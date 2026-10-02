"""Helpers for the /api/v1/github proxy routes (#198 M47), moved from
api/index.py. The routes themselves stay there.

GitHub and the limiter are called through their modules (`requests.get`,
`rate_limit.check_and_consume`), never through names imported from them. The
tests patch those module attributes (`api.index.requests.get` is the same
object), and a `from requests import get` would silently escape the patches.
"""

import logging

import requests
from flask import Response, jsonify

from api._lib import rate_limit
from api._lib.request_utils import (
    GITHUB_API,
    GITHUB_TIMEOUT_SECONDS,
    Visitor,
    current_visitor,
    github_headers,
    validate_repo_name,
)
from api._lib.site_config import CONFIG, GITHUB_NAME

logger = logging.getLogger("crog")

GH_RATE_LIMIT_MAX = 30
GH_RATE_LIMIT_WINDOW = 60


def _gh_rate_key(visitor: Visitor, endpoint: str) -> str:
    return f"ratelimit:gh:{endpoint}:{visitor.id}"


def _gh_rate_limit_or_429(endpoint: str):
    """Returns a Flask response if rate-limited, else None."""
    key = _gh_rate_key(current_visitor(), endpoint)
    full = rate_limit.check_and_consume({key: GH_RATE_LIMIT_MAX}, GH_RATE_LIMIT_WINDOW, fail_open=True)
    if full:
        return (
            jsonify(
                {
                    "error": "Rate limit exceeded",
                    "message": f"Max {GH_RATE_LIMIT_MAX} requests per minute",
                }
            ),
            429,
        )
    return None


def _allowed_owner(owner: str) -> bool:
    """Whether the proxy serves this owner's repos: a GitHub name that is
    site.yaml's github.username (or GITHUB_OWNER) or one of its allowed_owners,
    in any case. GitHub names are ASCII, so a look-alike that lower-cases into
    an allowed name (the Kelvin sign into "k") is refused."""
    return bool(GITHUB_NAME.fullmatch(owner)) and owner.lower() in CONFIG.allowed_owners


def _guard_repo_request(owner: str, repo_name: str, endpoint: str):
    """Shared entry guard for the single-repo proxy routes: per-IP rate limit,
    the owner, then repo-name validation. Returns an error response to
    short-circuit on, or None to proceed.

    Another owner gets the same generic 404 as a missing repo, before any
    GitHub call, so the proxy can't be pointed at the rest of GitHub (#189).
    """
    if (resp := _gh_rate_limit_or_429(endpoint)) is not None:
        return resp
    if not _allowed_owner(owner):
        return jsonify({"error": "Repository not found"}), 404
    is_valid, error_msg = validate_repo_name(repo_name)
    if not is_valid:
        return jsonify({"error": error_msg}), 400
    return None


def _github_unavailable(endpoint: str, repo: str, r=None, exc=None):
    """Log an upstream GitHub failure and return the response for it.

    These failures used to come back as "Repository not found", so an expired
    token or a spent quota told visitors that real repos didn't exist, and
    nothing reached the log. They are now logged with what an operator needs
    to tell them apart, and answered with a status that names GitHub, not the
    repo: 503 for 403/429 (GitHub's rate-limit statuses) and 502 for anything
    else. The body is the same for every failure, and GitHub's own status and
    message never reach the visitor, so this can't be used to probe which
    private repos exist (#97).
    """
    status = r.status_code if r is not None else None
    remaining = r.headers.get("X-RateLimit-Remaining") if r is not None else None
    logger.warning(
        "github upstream error: endpoint=%s repo=%s status=%s ratelimit_remaining=%s error=%s",
        endpoint,
        repo,
        status,
        remaining,
        type(exc).__name__ if exc is not None else None,
    )
    return jsonify({"error": "GitHub is unavailable right now"}), 503 if status in (403, 429) else 502


def _fetch_public_repo(owner: str, repo_name: str, endpoint: str):
    """Fetch an allowed owner's repo metadata, enforcing the public-only guard.

    Returns ``(data, None)`` when ``repo_name`` is a public repo of the owner,
    else ``(None, <error response>)``. This is the single source of truth for the
    private-repo guard (defense-in-depth so the proxy never serves private-repo
    data even if GITHUB_TOKEN is over-scoped), and returning the fetched
    metadata lets the /repo endpoint reuse it instead of making a second,
    identical GitHub call.

    A missing repo and a private repo both yield the SAME generic 404, so the
    proxy can't be used as an oracle for private repo names. Any other upstream
    failure is GitHub's, not the repo's, and goes to ``_github_unavailable``.
    """
    try:
        r = requests.get(
            f"{GITHUB_API}/repos/{owner}/{repo_name}",
            headers=github_headers(),
            timeout=GITHUB_TIMEOUT_SECONDS,
        )
    except requests.RequestException as e:
        return None, _github_unavailable(endpoint, repo_name, exc=e)
    if r.status_code == 404:
        return None, (jsonify({"error": "Repository not found"}), 404)
    if r.status_code != 200:
        return None, _github_unavailable(endpoint, repo_name, r=r)
    try:
        data = r.json()
    except ValueError as e:
        return None, _github_unavailable(endpoint, repo_name, r=r, exc=e)
    if not isinstance(data, dict):
        return None, _github_unavailable(endpoint, repo_name, r=r)
    if data.get("private"):
        return None, (jsonify({"error": "Repository not found"}), 404)
    return data, None


def _cdn_cached(response: Response) -> Response:
    """Let Vercel's CDN cache a successful proxy response for an hour, so repeat
    views of a project page skip the function, GitHub and Redis entirely (#194
    M33). Repos change slowly, and a repo made private drops out within the
    hour. Only a 200 is marked: errors and refusals are never cached.

    The CDN keys on the full URL, so a varying query string still reaches the
    function. Only an edge rule (a Vercel Firewall rate limit on /api/*) bounds
    those invocations.
    """
    response.headers["Cache-Control"] = "public, s-maxage=3600"
    return response


def _proxy_sub_resource(
    owner: str,
    repo_name: str,
    path: str | tuple[str, ...],
    label: str,
    endpoint: str,
    missing_msg: str | None = None,
):
    """GET a sub-resource of an already-validated public repo. ``path`` is
    appended to the repo URL (e.g. ``/readme``), and a tuple of paths is tried in
    order so a caller can prefer a specific file over GitHub's own resolution and
    still fall back when it is absent; ``label`` names the resource in the 404
    message; ``missing_msg`` (when set) replaces that message. Any failure other
    than the resource being absent goes to ``_github_unavailable``."""
    candidates = (path,) if isinstance(path, str) else path
    for i, candidate in enumerate(candidates):
        try:
            r = requests.get(
                f"{GITHUB_API}/repos/{owner}/{repo_name}{candidate}",
                headers=github_headers(),
                timeout=GITHUB_TIMEOUT_SECONDS,
            )
        except requests.RequestException as e:
            return _github_unavailable(endpoint, repo_name, exc=e)
        # A 404 on any but the last candidate just means "try the next one";
        # only the final candidate's absence is the resource being missing.
        if r.status_code == 404 and i < len(candidates) - 1:
            continue
        if r.status_code == 404:
            return jsonify({"error": missing_msg or f"Failed to fetch {label} from GitHub"}), 404
        if r.status_code != 200:
            return _github_unavailable(endpoint, repo_name, r=r)
        try:
            return _cdn_cached(jsonify(r.json()))
        except ValueError as e:
            return _github_unavailable(endpoint, repo_name, r=r, exc=e)


# The fields of the frontend's `Repository` type (githubService.ts), and all
# that /repo returns. GitHub's full body, fetched with the server's token, also
# carries token-specific fields such as `permissions`, which a public endpoint
# has no reason to repeat (#199).
_REPO_FIELDS = (
    "name",
    "full_name",
    "description",
    "html_url",
    "homepage",
    "stargazers_count",
    "forks_count",
    "watchers_count",
    "open_issues_count",
    "language",
    "topics",
    "created_at",
    "updated_at",
    "pushed_at",
    "license",
    "default_branch",
)


def _repository_fields(data: dict) -> dict:
    fields = {key: data.get(key) for key in _REPO_FIELDS}
    if isinstance(fields["license"], dict):
        fields["license"] = {"name": fields["license"].get("name"), "spdx_id": fields["license"].get("spdx_id")}
    return fields

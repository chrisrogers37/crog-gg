"""Unit tests for the GitHub proxy access-control defense-in-depth (issues #97,
#106).

Coverage:
  - ``get_repository`` drops private repos via the upstream ``private`` flag,
    and makes a single GitHub call — it reuses the metadata the public-repo
    guard already fetched (#106).
  - ``get_readme`` / ``get_repo_languages`` are gated on ``_fetch_public_repo``,
    which returns the SAME generic 404 for a private repo and a missing repo
    (no existence oracle).
  - Public-repo happy paths still return 200.
  - GitHub's own failures (#195) are 502/503 "GitHub is unavailable right now"
    and are logged, rather than reading as "Repository not found".

``requests.get`` is mocked, so no network access occurs.
"""

import logging
import os
import subprocess
import sys
from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest
import requests


def _make_response(status_code=200, json_data=None):
    resp = MagicMock()
    resp.status_code = status_code
    resp.ok = 200 <= status_code < 300
    resp.json.return_value = {} if json_data is None else json_data

    def _raise_for_status():
        if status_code >= 400:
            raise requests.HTTPError(response=resp)

    resp.raise_for_status.side_effect = _raise_for_status
    return resp


def _metadata_then_payload(metadata):
    """Build a ``requests.get`` side_effect where the metadata pre-check call
    (``/repos/<owner>/<repo>``) returns ``metadata`` and the follow-up
    readme/languages fetch returns a benign public payload."""

    def _side_effect(url, **kwargs):
        # The readme route asks for the root README.md first and only falls back
        # to GitHub's /readme resolution when that 404s, so both are served here.
        if url.endswith("/contents/README.md") or url.endswith("/readme"):
            return _make_response(200, {"content": "aGVsbG8=", "encoding": "base64"})
        if url.endswith("/languages"):
            return _make_response(200, {"Python": 1234})
        return metadata

    return _side_effect


# --- get_repository --------------------------------------------------------


def test_get_repository_public_returns_200(client):
    payload = {"name": "shuffify", "private": False, "description": "demo"}
    with patch("api.index.requests.get", return_value=_make_response(200, payload)):
        r = client.get("/api/v1/github/repo/shuffify")
    assert r.status_code == 200
    assert r.get_json()["name"] == "shuffify"


def test_get_repository_private_returns_generic_404(client):
    payload = {"name": "secret", "private": True, "description": "nope"}
    with patch("api.index.requests.get", return_value=_make_response(200, payload)):
        r = client.get("/api/v1/github/repo/secret")
    assert r.status_code == 404
    assert r.get_json() == {"error": "Repository not found"}


def test_get_repository_missing_returns_generic_404(client):
    # Truly-nonexistent repo: upstream 404 -> raise_for_status -> except branch.
    # Must return the SAME generic body as a private repo (no existence oracle).
    with patch("api.index.requests.get", return_value=_make_response(404, {})):
        r = client.get("/api/v1/github/repo/nope")
    assert r.status_code == 404
    assert r.get_json() == {"error": "Repository not found"}


def test_get_repository_private_and_missing_no_oracle(client):
    """The repo endpoint must return byte-identical 404s for a private vs a
    missing repo, so it can't be used to confirm which private repo names exist."""
    with patch("api.index.requests.get", return_value=_make_response(200, {"private": True})):
        r_private = client.get("/api/v1/github/repo/secret")
    with patch("api.index.requests.get", return_value=_make_response(404, {})):
        r_missing = client.get("/api/v1/github/repo/nope")
    assert r_private.status_code == r_missing.status_code == 404
    assert r_private.get_json() == r_missing.get_json() == {"error": "Repository not found"}


def test_get_repository_makes_single_github_call(client):
    """The /repo endpoint returns the metadata it fetched for the public-repo
    guard directly, so it must hit GitHub exactly once (#106 — no redundant
    re-fetch of the same repo-root URL)."""
    payload = {"name": "shuffify", "private": False}
    with patch("api.index.requests.get", return_value=_make_response(200, payload)) as mock_get:
        r = client.get("/api/v1/github/repo/shuffify")
    assert r.status_code == 200
    assert mock_get.call_count == 1


# --- get_readme ------------------------------------------------------------


def test_get_readme_public_returns_200(client):
    meta = _make_response(200, {"name": "shuffify", "private": False})
    with patch("api.index.requests.get", side_effect=_metadata_then_payload(meta)):
        r = client.get("/api/v1/github/readme/shuffify")
    assert r.status_code == 200
    assert r.get_json()["encoding"] == "base64"


def test_get_readme_prefers_root_over_dot_github(client):
    """GitHub's /readme resolves .github/README.md ahead of the root file, which
    surfaces a repo's CI notes as its project documentation. The route must ask
    for the root README.md explicitly (issue #123 D2)."""
    meta = _make_response(200, {"name": "storydump", "private": False})
    requested = []

    def _side_effect(url, **kwargs):
        requested.append(url)
        if url.endswith("/contents/README.md"):
            return _make_response(200, {"path": "README.md", "content": "cm9vdA==", "encoding": "base64"})
        if url.endswith("/readme"):
            return _make_response(
                200,
                {"path": ".github/README.md", "content": "Y2k=", "encoding": "base64"},
            )
        return meta

    with patch("api.index.requests.get", side_effect=_side_effect):
        r = client.get("/api/v1/github/readme/storydump")

    assert r.status_code == 200
    assert r.get_json()["path"] == "README.md"
    assert any(u.endswith("/contents/README.md") for u in requested)
    # the fallback must not be consulted when the root file exists
    assert not any(u.endswith("/readme") for u in requested)


def test_get_readme_falls_back_when_no_root_readme(client):
    """Repos with README.rst, lowercase readme, or docs-only layouts still work."""
    meta = _make_response(200, {"name": "shuffify", "private": False})

    def _side_effect(url, **kwargs):
        if url.endswith("/contents/README.md"):
            return _make_response(404, {"message": "Not Found"})
        if url.endswith("/readme"):
            return _make_response(200, {"path": "README.rst", "content": "cnN0", "encoding": "base64"})
        return meta

    with patch("api.index.requests.get", side_effect=_side_effect):
        r = client.get("/api/v1/github/readme/shuffify")

    assert r.status_code == 200
    assert r.get_json()["path"] == "README.rst"


def test_get_readme_404_when_neither_exists(client):
    meta = _make_response(200, {"name": "shuffify", "private": False})

    def _side_effect(url, **kwargs):
        if url.endswith("/contents/README.md") or url.endswith("/readme"):
            return _make_response(404, {"message": "Not Found"})
        return meta

    with patch("api.index.requests.get", side_effect=_side_effect):
        r = client.get("/api/v1/github/readme/shuffify")

    assert r.status_code == 404


def test_get_readme_private_returns_generic_404(client):
    meta = _make_response(200, {"name": "secret", "private": True})
    with patch("api.index.requests.get", side_effect=_metadata_then_payload(meta)):
        r = client.get("/api/v1/github/readme/secret")
    assert r.status_code == 404
    assert r.get_json() == {"error": "Repository not found"}


def test_get_readme_missing_returns_generic_404(client):
    meta = _make_response(404, {})
    with patch("api.index.requests.get", side_effect=_metadata_then_payload(meta)):
        r = client.get("/api/v1/github/readme/nope")
    assert r.status_code == 404
    assert r.get_json() == {"error": "Repository not found"}


# --- get_repo_languages ----------------------------------------------------


def test_get_languages_public_returns_200(client):
    meta = _make_response(200, {"name": "shuffify", "private": False})
    with patch("api.index.requests.get", side_effect=_metadata_then_payload(meta)):
        r = client.get("/api/v1/github/languages/shuffify")
    assert r.status_code == 200
    assert r.get_json() == {"Python": 1234}


def test_get_languages_private_returns_generic_404(client):
    meta = _make_response(200, {"name": "secret", "private": True})
    with patch("api.index.requests.get", side_effect=_metadata_then_payload(meta)):
        r = client.get("/api/v1/github/languages/secret")
    assert r.status_code == 404
    assert r.get_json() == {"error": "Repository not found"}


def test_get_languages_missing_returns_generic_404(client):
    meta = _make_response(404, {})
    with patch("api.index.requests.get", side_effect=_metadata_then_payload(meta)):
        r = client.get("/api/v1/github/languages/nope")
    assert r.status_code == 404
    assert r.get_json() == {"error": "Repository not found"}


def test_private_and_missing_are_indistinguishable_no_oracle(client):
    """readme must return byte-identical 404s for a private vs a missing repo,
    so the endpoint is not an oracle for which private repo names exist."""
    private_meta = _make_response(200, {"private": True})
    missing_meta = _make_response(404, {})
    with patch("api.index.requests.get", side_effect=_metadata_then_payload(private_meta)):
        r_private = client.get("/api/v1/github/readme/secret")
    with patch("api.index.requests.get", side_effect=_metadata_then_payload(missing_meta)):
        r_missing = client.get("/api/v1/github/readme/nope")
    assert r_private.status_code == r_missing.status_code == 404
    assert r_private.get_json() == r_missing.get_json() == {"error": "Repository not found"}


# --- upstream failures (#195) ------------------------------------------------
# An expired token or a spent quota used to tell visitors that real repos don't
# exist. GitHub's failures now name GitHub, carry a status an operator can act
# on and reach the log, while a missing or private repo keeps the generic 404.

_UNAVAILABLE = {"error": "GitHub is unavailable right now"}


def _failing(status_code, remaining="0"):
    resp = _make_response(status_code, {"message": "upstream says no"})
    resp.headers = {"X-RateLimit-Remaining": remaining}
    return resp


@pytest.mark.parametrize("status_code", [401, 500, 502])
def test_upstream_401_and_5xx_are_502(client, status_code):
    with patch("api.index.requests.get", return_value=_failing(status_code)):
        r = client.get("/api/v1/github/repo/shuffify")
    assert r.status_code == 502
    assert r.get_json() == _UNAVAILABLE


@pytest.mark.parametrize("status_code", [403, 429])
def test_upstream_rate_limit_is_503(client, status_code):
    with patch("api.index.requests.get", return_value=_failing(status_code)):
        r = client.get("/api/v1/github/repo/shuffify")
    assert r.status_code == 503
    assert r.get_json() == _UNAVAILABLE


@pytest.mark.parametrize("exc", [requests.Timeout("slow"), requests.ConnectionError("down")])
def test_upstream_timeout_and_network_errors_are_502(client, exc):
    with patch("api.index.requests.get", side_effect=exc):
        r = client.get("/api/v1/github/repo/shuffify")
    assert r.status_code == 502
    assert r.get_json() == _UNAVAILABLE


def test_upstream_failure_is_logged(client, caplog):
    caplog.set_level(logging.WARNING, logger="crog")
    with patch("api.index.requests.get", return_value=_failing(403, remaining="0")):
        client.get("/api/v1/github/readme/shuffify")
    [record] = [rec for rec in caplog.records if "github upstream error" in rec.getMessage()]
    assert record.levelname == "WARNING"
    assert "endpoint=readme repo=shuffify status=403 ratelimit_remaining=0" in record.getMessage()
    # GitHub's message is neither returned nor logged.
    assert "upstream says no" not in record.getMessage()


def test_sub_resource_failure_is_not_passed_through(client):
    """The README fetch used to return GitHub's own status code; it now goes
    through the same mapping as the metadata call."""
    meta = _make_response(200, {"name": "shuffify", "private": False})

    def _side_effect(url, **kwargs):
        if url.endswith("/contents/README.md"):
            return _failing(500)
        return meta

    with patch("api.index.requests.get", side_effect=_side_effect):
        r = client.get("/api/v1/github/readme/shuffify")
    assert r.status_code == 502
    assert r.get_json() == _UNAVAILABLE


def test_sub_resource_network_error_is_502(client):
    meta = _make_response(200, {"name": "shuffify", "private": False})

    def _side_effect(url, **kwargs):
        if url.endswith("/languages"):
            raise requests.ConnectionError("down")
        return meta

    with patch("api.index.requests.get", side_effect=_side_effect):
        r = client.get("/api/v1/github/languages/shuffify")
    assert r.status_code == 502
    assert r.get_json() == _UNAVAILABLE


def _not_json(status_code=200):
    resp = _make_response(status_code)
    resp.json.side_effect = requests.exceptions.JSONDecodeError("Expecting value", "", 0)
    resp.headers = {}
    return resp


def test_repo_metadata_that_is_not_json_is_502(client):
    with patch("api.index.requests.get", return_value=_not_json()):
        r = client.get("/api/v1/github/repo/shuffify")
    assert r.status_code == 502
    assert r.get_json() == _UNAVAILABLE


@pytest.mark.parametrize(
    "route, suffix, reply",
    [
        ("/api/v1/github/readme/shuffify", "/contents/README.md", _not_json),
        ("/api/v1/github/languages/shuffify", "/languages", lambda: _not_json(204)),
    ],
    ids=["readme-not-json", "languages-204"],
)
def test_sub_resource_reply_that_is_not_json_is_502(client, route, suffix, reply):
    meta = _make_response(200, {"name": "shuffify", "private": False})

    def _side_effect(url, **kwargs):
        return reply() if url.endswith(suffix) else meta

    with patch("api.index.requests.get", side_effect=_side_effect):
        r = client.get(route)
    assert r.status_code == 502
    assert r.get_json() == _UNAVAILABLE


def test_repo_name_with_a_trailing_newline_is_rejected(client):
    # `$` also matches before a final newline, so a name ending in one passed
    # validation and would split the upstream-error log line.
    with patch("api.index.requests.get") as mock_get:
        r = client.get("/api/v1/github/repo/shuffify%0A")
    assert r.status_code == 400
    mock_get.assert_not_called()


# --- what /repo and the language total expose (#199) -------------------------


def test_repo_returns_only_the_repository_fields(client):
    from api.index import _REPO_FIELDS

    payload = {
        "name": "shuffify",
        "private": False,
        "stargazers_count": 3,
        "permissions": {"admin": True, "push": True},
        "security_and_analysis": {"secret_scanning": {"status": "enabled"}},
        "license": {"key": "mit", "name": "MIT License", "spdx_id": "MIT", "url": "https://api.github.com/licenses/mit"},
    }
    with patch("api.index.requests.get", return_value=_make_response(200, payload)):
        r = client.get("/api/v1/github/repo/shuffify")

    body = r.get_json()
    assert set(body) == set(_REPO_FIELDS) and len(_REPO_FIELDS) == 16
    assert body["stargazers_count"] == 3
    assert body["license"] == {"name": "MIT License", "spdx_id": "MIT"}
    assert "permissions" not in body and "security_and_analysis" not in body


def test_language_total_skips_private_repos(client):
    repos = [
        {"name": "public-one", "fork": False, "private": False},
        {"name": "secret-one", "fork": False, "private": True},
        {"name": "forked-one", "fork": True, "private": False},
    ]

    def _side_effect(url, **kwargs):
        if url.endswith("/repos?per_page=100"):
            return _make_response(200, repos)
        if "/public-one/" in url:
            return _make_response(200, {"Python": 10})
        return _make_response(200, {"Secret": 99})

    with patch("api.index.cache.get_json", return_value=None), patch("api.index.cache.set_json"):
        with patch("api.index.requests.get", side_effect=_side_effect) as mock_get:
            r = client.get("/api/v1/github/languages")

    assert r.get_json() == {"Python": 10}
    assert not any("secret-one" in call.args[0] for call in mock_get.call_args_list)


def _import_request_utils(env):
    return subprocess.run(
        [sys.executable, "-c", "import api._lib.request_utils"],
        cwd=Path(__file__).resolve().parents[1],
        env=env,
        capture_output=True,
        text=True,
        check=True,
    ).stderr


def test_missing_token_is_logged_once_at_import():
    env = {k: v for k, v in os.environ.items() if k != "GITHUB_TOKEN"}
    assert _import_request_utils(env).count("github token missing") == 1
    assert "github token missing" not in _import_request_utils({**env, "GITHUB_TOKEN": "x"})

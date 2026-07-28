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

``requests.get`` is mocked, so no network access occurs.
"""

from unittest.mock import MagicMock, patch

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

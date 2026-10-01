"""Tests for the /api/v1/github/languages aggregate cache (#91).

The aggregate endpoint fans out to GitHub (1 + N calls, N = non-fork repos).
These tests lock in the server-side cache that bounds that fan-out: a cache hit
must serve without touching GitHub, and a cache miss must populate the cache
with the computed aggregate at the module TTL.

``requests.get`` and the cache helpers are mocked, so no network access occurs.
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


def test_languages_cache_hit_skips_github(client):
    """A warm cache serves the aggregate without any GitHub fan-out."""
    cached = {"Python": 100, "TypeScript": 50}
    with patch("api.index.cache.get_json", return_value=cached):
        with patch("api.index.requests.get") as mock_get:
            r = client.get("/api/v1/github/languages")
    assert r.status_code == 200
    assert r.get_json() == cached
    assert mock_get.call_count == 0


def test_languages_cache_miss_computes_and_caches(client):
    """A cold cache fans out, aggregates non-fork repos, and writes the result
    back to the cache with the 1-hour TTL."""
    repos = [
        {"name": "alpha", "fork": False},
        {"name": "forked", "fork": True},  # must be skipped
        {"name": "beta", "fork": False},
    ]

    def _side_effect(url, **kwargs):
        if url.endswith("/repos?per_page=100"):
            return _make_response(200, repos)
        if url.endswith("/alpha/languages"):
            return _make_response(200, {"Python": 100})
        if url.endswith("/beta/languages"):
            return _make_response(200, {"Python": 50, "TypeScript": 30})
        if url.endswith("/forked/languages"):
            raise AssertionError("fork repos must not be fetched")
        return _make_response(200, {})

    with patch("api.index.cache.get_json", return_value=None):
        with patch("api.index.cache.set_json") as mock_set:
            with patch("api.index.requests.get", side_effect=_side_effect):
                r = client.get("/api/v1/github/languages")

    assert r.status_code == 200
    assert r.get_json() == {"Python": 150, "TypeScript": 30}

    # cached the computed aggregate under the shared key with the module TTL
    assert mock_set.call_count == 1
    args, _ = mock_set.call_args
    assert args[0] == "cache:all_languages"
    assert args[1] == {"Python": 150, "TypeScript": 30}
    assert args[2] == 3600


def test_languages_cache_miss_skips_failed_language_calls(client):
    """A per-repo /languages call that isn't OK is skipped, not fatal."""
    repos = [{"name": "alpha", "fork": False}, {"name": "beta", "fork": False}]

    def _side_effect(url, **kwargs):
        if url.endswith("/repos?per_page=100"):
            return _make_response(200, repos)
        if url.endswith("/alpha/languages"):
            return _make_response(200, {"Go": 10})
        if url.endswith("/beta/languages"):
            return _make_response(500, {})  # not ok -> skipped, not fatal
        return _make_response(200, {})

    with patch("api.index.cache.get_json", return_value=None):
        with patch("api.index.cache.set_json"):
            with patch("api.index.requests.get", side_effect=_side_effect):
                r = client.get("/api/v1/github/languages")

    assert r.status_code == 200
    assert r.get_json() == {"Go": 10}


def test_languages_repo_list_failure_is_not_cached(client):
    """If the repo-list fetch fails, the endpoint 500s and nothing is cached."""

    def _side_effect(url, **kwargs):
        if url.endswith("/repos?per_page=100"):
            return _make_response(500, {})
        return _make_response(200, {})

    with patch("api.index.cache.get_json", return_value=None):
        with patch("api.index.cache.set_json") as mock_set:
            with patch("api.index.requests.get", side_effect=_side_effect):
                r = client.get("/api/v1/github/languages")

    assert r.status_code == 500
    assert mock_set.call_count == 0


def test_an_unreadable_cache_is_a_503_not_a_fan_out(client):
    """During an Upstash outage, every miss would fan out to GitHub and could
    spend the token's quota for every project page (#194 M33)."""
    with patch("api._lib.cache.redis_client.command", side_effect=RuntimeError("redis down")):
        with patch("api.index.requests.get") as mock_get:
            r = client.get("/api/v1/github/languages")
    assert r.status_code == 503
    assert r.get_json() == {"error": "Language stats are unavailable right now"}
    mock_get.assert_not_called()

"""/api/health (#195): what an uptime monitor polls.

Every dependency is mocked: the OpenAI client is a sentinel that must never be
called, Redis answers through ``redis_client.command``, and GitHub's
/rate_limit through ``requests.get``.
"""

from contextlib import ExitStack
from unittest.mock import MagicMock, patch

import pytest
import requests

import api.index as index

_CHECKS = {"openai_key", "redis_configured", "redis_ping", "github_token", "github_core_remaining"}


@pytest.fixture(autouse=True)
def _fresh_cache():
    index._health_cache.clear()
    yield
    index._health_cache.clear()


def _rate_limit(remaining=4999, status=200):
    r = MagicMock()
    r.status_code = status
    r.json.return_value = {"resources": {"core": {"remaining": remaining}}}

    def _raise():
        if status >= 400:
            raise requests.HTTPError(response=r)

    r.raise_for_status.side_effect = _raise
    return r


def _deps(stack, openai_key=True, ping="PONG", token="tok", github=None):
    """Patch every dependency; healthy unless an argument says otherwise."""
    fake_openai = MagicMock()
    stack.enter_context(patch("api.index.openai_client", fake_openai if openai_key else None))
    command = stack.enter_context(patch("api.index.redis_client.command"))
    if isinstance(ping, Exception):
        command.side_effect = ping
    else:
        command.return_value = ping
    stack.enter_context(patch("api.index.redis_client.is_configured", return_value=True))
    stack.enter_context(patch("api.index.GITHUB_TOKEN", token))
    get = stack.enter_context(patch("api.index.requests.get", return_value=github or _rate_limit()))
    return fake_openai, command, get


def test_healthy_returns_200_with_every_check(client):
    with ExitStack() as stack:
        _deps(stack)
        r = client.get("/api/health")
    assert r.status_code == 200
    body = r.get_json()
    assert body["ok"] is True
    assert set(body["checks"]) == _CHECKS
    assert body["checks"]["github_core_remaining"] == 4999
    assert r.headers["Cache-Control"] == "no-store"


def test_redis_ping_error_is_503(client):
    with ExitStack() as stack:
        _deps(stack, ping=RuntimeError("Upstash error: down"))
        r = client.get("/api/health")
    assert r.status_code == 503
    assert r.get_json()["checks"]["redis_ping"] is False


def test_missing_openai_key_is_503(client):
    with ExitStack() as stack:
        _deps(stack, openai_key=False)
        r = client.get("/api/health")
    assert r.status_code == 503
    assert r.get_json()["checks"]["openai_key"] is False


def test_expired_github_token_is_503(client):
    with ExitStack() as stack:
        _deps(stack, github=_rate_limit(status=401))
        r = client.get("/api/health")
    assert r.status_code == 503
    assert r.get_json()["checks"]["github_core_remaining"] is None


def test_exhausted_github_quota_is_503(client):
    with ExitStack() as stack:
        _deps(stack, github=_rate_limit(remaining=0))
        r = client.get("/api/health")
    assert r.status_code == 503


def test_no_github_token_is_still_healthy(client):
    # Without a token the GitHub panels fall back to the shared unauthenticated
    # quota; that's degraded, not down, and the token check reports it.
    with ExitStack() as stack:
        _deps(stack, token=None, github=_rate_limit(status=403))
        r = client.get("/api/health")
    assert r.status_code == 200
    assert r.get_json()["checks"]["github_token"] is False


def test_never_calls_openai(client):
    with ExitStack() as stack:
        fake_openai, _command, _get = _deps(stack)
        client.get("/api/health")
    assert fake_openai.mock_calls == []


def test_result_is_cached_for_30_seconds(client):
    with ExitStack() as stack:
        _fake, command, get = _deps(stack)
        clock = stack.enter_context(patch("api.index.time"))
        clock.monotonic.side_effect = [1000.0, 1029.0, 1031.0]
        first = client.get("/api/health")
        command.side_effect = RuntimeError("down")
        cached = client.get("/api/health")
        refreshed = client.get("/api/health")
    assert first.status_code == cached.status_code == 200
    assert refreshed.status_code == 503
    assert command.call_count == 2
    assert get.call_count == 2

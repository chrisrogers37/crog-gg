"""/api/health (#195): what an uptime monitor polls.

Every dependency is mocked: the OpenAI client is a sentinel that must never be
called, Redis answers through ``redis_client.command``, and GitHub's
/rate_limit through ``requests.get``.
"""

import logging
import threading
import time
from contextlib import ExitStack
from unittest.mock import ANY, MagicMock, patch

import pytest
import requests

import api.index as index

_CHECKS = {"openai_key", "redis_configured", "redis_ping", "github_token", "github_quota"}


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
    # `is None`, not `or`: a real requests.Response with a 4xx/5xx status is falsy.
    reply = github if github is not None else _rate_limit()
    get = stack.enter_context(patch("api.index.requests.get", return_value=reply))
    return fake_openai, command, get


def test_healthy_returns_200_with_every_check(client):
    with ExitStack() as stack:
        _deps(stack)
        r = client.get("/api/health")
    assert r.status_code == 200
    body = r.get_json()
    assert body["ok"] is True
    assert set(body["checks"]) == _CHECKS
    assert body["checks"]["github_quota"] is True
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
    assert r.get_json()["checks"]["github_quota"] is None


def test_exhausted_github_quota_is_503(client):
    with ExitStack() as stack:
        _deps(stack, github=_rate_limit(remaining=0))
        r = client.get("/api/health")
    assert r.status_code == 503
    assert r.get_json()["checks"]["github_quota"] is False


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
        clock.monotonic.return_value = 1000.0
        first = client.get("/api/health")
        command.side_effect = RuntimeError("down")
        clock.monotonic.return_value = 1029.0
        cached = client.get("/api/health")
        clock.monotonic.return_value = 1031.0
        refreshed = client.get("/api/health")
    assert first.status_code == cached.status_code == 200
    assert refreshed.status_code == 503
    assert command.call_count == 2
    assert get.call_count == 2


def test_the_checks_make_the_calls_they_claim(client):
    with ExitStack() as stack:
        _fake, command, get = _deps(stack)
        client.get("/api/health")
    command.assert_called_once_with("PING")
    get.assert_called_once_with(f"{index.GITHUB_API}/rate_limit", headers=ANY, timeout=5)


def test_concurrent_misses_share_one_refresh(client):
    with ExitStack() as stack:
        _fake, command, get = _deps(stack)

        def slow_ping(*_args):
            time.sleep(0.2)
            return "PONG"

        command.side_effect = slow_ping
        statuses = []

        def hit():
            with index.app.app_context():
                statuses.append(index.health().status_code)

        threads = [threading.Thread(target=hit) for _ in range(8)]
        for t in threads:
            t.start()
        for t in threads:
            t.join()
    assert statuses == [200] * 8
    assert command.call_count == 1
    assert get.call_count == 1


def test_unconfigured_redis_is_reported_by_the_real_client(client):
    # No patch on redis_client's functions: the real client, with no URL or
    # token, must report itself unconfigured and fail the PING.
    with ExitStack() as stack:
        stack.enter_context(patch("api.index.openai_client", MagicMock()))
        stack.enter_context(patch("api.index.redis_client._URL", ""))
        stack.enter_context(patch("api.index.redis_client._TOKEN", ""))
        stack.enter_context(patch("api.index.GITHUB_TOKEN", None))
        stack.enter_context(patch("api.index.requests.get", return_value=_rate_limit()))
        r = client.get("/api/health")
    assert r.status_code == 503
    checks = r.get_json()["checks"]
    assert checks["redis_configured"] is False and checks["redis_ping"] is False


def _real_response(status, body: bytes):
    r = requests.Response()
    r.status_code = status
    r._content = body
    r.headers["Content-Type"] = "application/json"
    return r


@pytest.mark.parametrize(
    "status, body",
    [
        (200, b"<html>maintenance</html>"),
        (200, b""),
        (200, b"[]"),
        (200, b"null"),
        (200, b'{"resources": {}}'),
        (200, b'{"resources": {"core": {"remaining": "lots"}}}'),
        (502, b"bad gateway"),
    ],
    ids=["html", "empty", "list", "null", "wrong-shape", "not-a-number", "502"],
)
def test_an_unusable_github_reply_is_null_not_a_500(client, caplog, status, body):
    caplog.set_level(logging.WARNING, logger="crog")
    with ExitStack() as stack:
        _deps(stack, github=_real_response(status, body))
        r = client.get("/api/health")
    assert r.status_code == 503
    assert r.is_json
    assert r.get_json()["checks"]["github_quota"] is None
    assert any("health check failed: check=github_core_remaining" in rec.getMessage() for rec in caplog.records)


def test_a_usable_github_reply_says_quota_is_left_but_not_how_much(client):
    with ExitStack() as stack:
        _deps(stack, github=_real_response(200, b'{"resources": {"core": {"remaining": 4321}}}'))
        r = client.get("/api/health")
    assert r.status_code == 200
    assert r.get_json()["checks"]["github_quota"] is True
    # The endpoint is public: the count would show how close the token is to empty.
    assert "4321" not in r.get_data(as_text=True)


# --- what the deployment serves (#189 M21) ----------------------------------


def _with_modes(stack, **modes):
    import dataclasses

    stack.enter_context(patch.object(index, "CONFIG", dataclasses.replace(index.CONFIG, **modes)))


def test_a_fork_with_neither_key_nor_upstash_is_healthy(client):
    # SUMMON isn't served there, by design, so its parts aren't missing.
    with ExitStack() as stack:
        _deps(stack, openai_key=False, ping=RuntimeError("no Upstash"))
        stack.enter_context(patch("api.index.redis_client.is_configured", return_value=False))
        r = client.get("/api/health")
    assert r.status_code == 200
    assert r.get_json()["ok"] is True


def test_regenerate_off_skips_its_checks(client):
    with ExitStack() as stack:
        _deps(stack, openai_key=False, ping=RuntimeError("down"))
        _with_modes(stack, regenerate_mode="off")
        assert client.get("/api/health").status_code == 200


def test_upstash_without_a_key_is_still_a_failure(client):
    # Half set up: the owner meant to serve it.
    with ExitStack() as stack:
        _deps(stack, openai_key=False)
        assert client.get("/api/health").status_code == 503


def test_regenerate_on_needs_its_parts_even_with_neither_set(client):
    with ExitStack() as stack:
        _deps(stack, openai_key=False, ping=RuntimeError("no Upstash"))
        stack.enter_context(patch("api.index.redis_client.is_configured", return_value=False))
        _with_modes(stack, regenerate_mode="on")
        assert client.get("/api/health").status_code == 503


def test_github_off_skips_the_github_check_and_its_call(client):
    with ExitStack() as stack:
        _fake_openai, _command, get = _deps(stack, github=_rate_limit(status=401))
        _with_modes(stack, github_mode="off")
        r = client.get("/api/health")
    assert r.status_code == 200
    assert r.get_json()["checks"]["github_quota"] is None
    get.assert_not_called()

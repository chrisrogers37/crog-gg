"""The paid endpoint must not spend money it cannot meter (#113).

Every spend control on ``/api/regenerate`` -- the 30s per-IP cooldown and the
per-IP daily cap -- lives in Redis. Before this, any Upstash exception returned
"allowed", so an outage silently removed both at once and left an
unauthenticated endpoint proxying unbounded calls to a paid API.

These tests drive the REAL limiter with Redis broken underneath it, rather than
patching the limiter with a raising mock. The distinction is the whole point:
a raising mock proves only that the handler catches, and would keep passing if
the limiter went back to falling open. What needs pinning is the limiter's own
decision to refuse.

They must patch over conftest's autouse ``_hermetic_rate_limit``, which stubs
the very primitives under test.
"""

from unittest.mock import MagicMock, patch

import pytest

from api._lib import rate_limit

# Bound at import time, before conftest's autouse fixture replaces them.
_REAL = {
    "check_and_consume": rate_limit.check_and_consume,
    "get_cooldown_remaining": rate_limit.get_cooldown_remaining,
}

_BODY = {"sections": {"about": {"bio": "hi"}}}


@pytest.fixture
def redis_down():
    """Real limiter, unreachable Redis."""
    with patch("api.index.rate_limit.check_and_consume", _REAL["check_and_consume"]):
        with patch("api.index.rate_limit.get_cooldown_remaining", _REAL["get_cooldown_remaining"]):
            with patch("api._lib.rate_limit.redis_client.command", side_effect=RuntimeError("redis down")):
                with patch("api._lib.rate_limit.redis_client.pipeline", side_effect=RuntimeError("redis down")):
                    yield


@pytest.fixture
def no_openai():
    """Any call to the paid API while metering is down fails the test loudly."""
    fake = MagicMock()
    fake.chat.completions.create.side_effect = AssertionError("OpenAI called while metering was unavailable")
    with patch("api.index.openai_client", fake):
        yield fake


def test_outage_returns_503_and_spends_nothing(client, redis_down, no_openai):
    r = client.post("/api/regenerate", json=_BODY)
    assert r.status_code == 503
    assert r.get_json()["error"] == "Regeneration temporarily unavailable"
    no_openai.chat.completions.create.assert_not_called()


def test_outage_blocks_every_section_of_a_multi_section_request(client, redis_down, no_openai):
    # The handler fans out one paid call per section; none may start.
    r = client.post("/api/regenerate", json={"sections": {"about": {"bio": "hi"}, "portfolio": {"items": []}}})
    assert r.status_code == 503
    no_openai.chat.completions.create.assert_not_called()


def test_free_github_gate_still_falls_open(redis_down):
    # Deliberate asymmetry: an outage costs nothing on the free endpoints, so
    # dropping real traffic there would be the worse failure. Guard it so a
    # future sweep does not close the fail-open uniformly.
    from api.index import _gh_rate_limit_or_429, app

    with app.test_request_context("/api/v1/github/repo/whatever"):
        assert _gh_rate_limit_or_429("repo") is None


def test_free_limits_endpoint_still_answers_during_an_outage(client, redis_down):
    r = client.get("/api/limits")
    assert r.status_code == 200

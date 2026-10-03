"""The paid endpoint must not spend money it cannot meter (#113).

Every spend control on ``/api/regenerate`` -- the 30s per-visitor cooldown and
the daily caps -- lives in Redis. Before this, any Upstash exception returned
"allowed", so an outage silently removed them all at once and left an
unauthenticated endpoint proxying unbounded calls to a paid API.

These tests drive the REAL limiter with Redis broken underneath it, rather than
patching the limiter with a raising mock. The distinction is the whole point:
a raising mock proves only that the handler catches, and would keep passing if
the limiter went back to falling open. What needs pinning is the limiter's own
decision to refuse. Each test runs under both ways Redis can fail to meter
(``metering_broken``): unreachable, and answering reads while refusing the
write (#194). The last two run the real limiter on a working Redis: a burst
of presses must not all get through a cooldown meant to admit one, and a press
the site-wide budget refuses must not spend the visitor's own slots.

They must patch over conftest's autouse ``_hermetic_rate_limit``, which stubs
the very primitives under test.
"""

import threading
from concurrent.futures import ThreadPoolExecutor
from unittest.mock import MagicMock, patch

import pytest

from api._lib import rate_limit, redis_client
from api._lib.request_utils import Visitor
from api.index import (
    REGEN_DAILY_WINDOW,
    REGEN_GLOBAL_DAILY_MAX,
    REGEN_GLOBAL_KEY,
    _regen_daily_key,
)

# Bound at import time, before conftest's autouse fixture replaces them.
_REAL = {
    "check_and_consume": rate_limit.check_and_consume,
    "get_cooldown_remaining": rate_limit.get_cooldown_remaining,
    "claim_cooldown": rate_limit.claim_cooldown,
}

_BODY = {"sections": {"about": {"bio": "hi"}}}


@pytest.fixture
def real_limiter():
    """Put back the real primitives that conftest's autouse fixture stubs."""
    with patch.multiple("api.index.rate_limit", **_REAL):
        yield


@pytest.fixture
def redis_down(real_limiter):
    """Real limiter, unreachable Redis."""
    with patch("api._lib.rate_limit.redis_client.command", side_effect=RuntimeError("redis down")):
        with patch("api._lib.rate_limit.redis_client.pipeline", side_effect=RuntimeError("redis down")):
            yield


@pytest.fixture
def redis_writes_refused(real_limiter):
    """Real limiter; Redis answers reads but refuses writes (#194)."""

    def reply(args):
        if args[0] in ("SET", "EVAL"):  # the limiter's script writes too
            return {"error": "OOM command not allowed"}
        return {"result": -2}  # TTL of a missing key: no cooldown

    def upstash(path, body):
        return [reply(args) for args in body] if path == "/pipeline" else reply(body)

    with patch("api._lib.redis_client._post", side_effect=upstash):
        yield


@pytest.fixture(params=["redis_down", "redis_writes_refused"])
def metering_broken(request):
    """Each way Redis can fail to meter: unreachable, or refusing the write."""
    request.getfixturevalue(request.param)


@pytest.fixture
def no_openai():
    """Any call to the paid API fails the test loudly: every request these
    tests send must be refused before it gets that far."""
    fake = MagicMock()
    fake.chat.completions.create.side_effect = AssertionError("OpenAI called for a request that should be refused")
    with patch("api.index.openai_client", fake):
        yield fake


def test_outage_returns_503_and_spends_nothing(client, metering_broken, no_openai):
    r = client.post("/api/regenerate", json=_BODY)
    assert r.status_code == 503
    assert r.get_json()["error"] == "regeneration temporarily unavailable"
    no_openai.chat.completions.create.assert_not_called()


def test_outage_blocks_every_section_of_a_multi_section_request(client, metering_broken, no_openai):
    # The handler fans out one paid call per section; none may start.
    r = client.post("/api/regenerate", json={"sections": {"about": {"bio": "hi"}, "portfolio": {"items": []}}})
    assert r.status_code == 503
    no_openai.chat.completions.create.assert_not_called()


def test_free_github_gate_still_falls_open(metering_broken):
    # Deliberate asymmetry: an outage costs nothing on the free endpoints, so
    # dropping real traffic there would be the worse failure. Guard it so a
    # future sweep does not close the fail-open uniformly.
    from api._lib.github_proxy import _gh_rate_limit_or_429
    from api.index import app

    with app.test_request_context("/api/v1/github/repo/whatever"):
        assert _gh_rate_limit_or_429("repo") is None


def test_free_limits_endpoint_still_answers_during_an_outage(client, metering_broken):
    r = client.get("/api/limits")
    assert r.status_code == 200


def test_parallel_presses_get_one_200_and_429s_for_the_rest(client, real_limiter, fake_upstash):
    # The cooldown used to be a TTL read and, later, a SETEX, so presses that
    # all read before any wrote all got through (#194 M64). Holding each press
    # after its first Redis call until every press has made one forces that
    # race on every run. With SET NX, exactly one press claims the cooldown.
    presses = 4
    all_called = threading.Barrier(presses, timeout=5)
    this_press = threading.local()
    upstash = redis_client._post  # fake_upstash's

    def held_after_first_call(path, body):
        reply = upstash(path, body)
        if not getattr(this_press, "held", False):
            this_press.held = True
            all_called.wait()
        return reply

    def press(_):
        return client.application.test_client().post("/api/regenerate", json=_BODY).status_code

    model = MagicMock()
    model.chat.completions.create.return_value.choices = [MagicMock(message=MagicMock(content='{"bio": "rewritten"}'))]

    with patch("api.index.openai_client", model):
        with patch("api._lib.redis_client._post", side_effect=held_after_first_call):
            with ThreadPoolExecutor(presses) as pool:
                statuses = sorted(pool.map(press, range(presses)))

    assert statuses == [200] + [429] * (presses - 1)
    model.chat.completions.create.assert_called_once()


def test_site_wide_ceiling_refuses_without_spending_the_visitors_slots(client, real_limiter, fake_upstash, no_openai):
    # Spending them would let a budget outage use up every visitor's day as
    # they kept pressing (#194 M11, M14).
    budget = {REGEN_GLOBAL_KEY: REGEN_GLOBAL_DAILY_MAX}
    assert rate_limit.check_and_consume(budget, REGEN_DAILY_WINDOW, cost=REGEN_GLOBAL_DAILY_MAX) is None
    r = client.post("/api/regenerate", json=_BODY)
    assert r.status_code == 503
    assert r.get_json()["error"] == "daily regeneration budget reached"
    assert fake_upstash.zcard(_regen_daily_key(Visitor.from_ip("127.0.0.1"))) == 0
    no_openai.chat.completions.create.assert_not_called()

"""Unit tests for the sliding-window limiter (api/_lib/rate_limit.py).

Focus is the ``cost`` argument: a request that consumes several slots records
them in one round trip, so the recorded count reflects the whole request rather
than however many hits a per-slot loop managed before the cap tripped.
"""

import logging
from unittest.mock import patch

import pytest

from api._lib import rate_limit

# conftest's autouse `_hermetic_rate_limit` stubs `rate_limit.check_and_consume`
# for every test in the suite -- including this module, whose subject IS that
# function. Bind the real one at import time, before any fixture runs, so these
# tests exercise the limiter instead of the stub standing in for it.
check_and_consume = rate_limit.check_and_consume
get_cooldown_remaining = rate_limit.get_cooldown_remaining
start_cooldown = rate_limit.start_cooldown


def _zadd_from(pipeline_call):
    """The ZADD command out of the pipeline the limiter submitted."""
    commands = pipeline_call.call_args[0][0]
    return next(c for c in commands if c[0] == "ZADD")


def test_default_cost_records_one_hit():
    with patch("api._lib.rate_limit.redis_client.pipeline", return_value=[0, 1, 1, 1]) as pipe:
        check_and_consume("k", 30, 60)
    zadd = _zadd_from(pipe)
    # ZADD key score member -> one score/member pair
    assert len(zadd) == 4


def test_cost_records_that_many_hits_in_one_round_trip():
    with patch("api._lib.rate_limit.redis_client.pipeline", return_value=[0, 3, 3, 1]) as pipe:
        check_and_consume("k", 30, 60, cost=3)
    pipe.assert_called_once()
    zadd = _zadd_from(pipe)
    assert len(zadd) == 2 + (3 * 2)


def test_members_are_distinct_so_none_overwrite_each_other():
    # Same-millisecond members that collided would silently under-count.
    with patch("api._lib.rate_limit.redis_client.pipeline", return_value=[0, 4, 4, 1]) as pipe:
        check_and_consume("k", 30, 60, cost=4)
    zadd = _zadd_from(pipe)
    members = zadd[3::2]
    assert len(set(members)) == 4


def test_batch_over_the_cap_is_denied():
    with patch("api._lib.rate_limit.redis_client.pipeline", return_value=[0, 2, 31, 1]):
        allowed, count = check_and_consume("k", 30, 60, cost=2)
    assert allowed is False
    assert count == 31


def test_falls_open_only_when_the_caller_opts_out():
    # Free endpoints keep serving: losing rate limiting on a transient outage
    # beats dropping legit traffic where an extra request costs nothing.
    with patch("api._lib.rate_limit.redis_client.pipeline", side_effect=RuntimeError("down")):
        allowed, count = check_and_consume("k", 30, 60, cost=2, fail_open=True)
    assert allowed is True
    assert count == 0


def test_fails_closed_by_default():
    # "Cannot meter" must not read as "allowed". The safe mode is the default so
    # that forgetting the flag on a paid gate cannot silently leak money -- the
    # direction a caller forgets in is the harmless one.
    with patch("api._lib.rate_limit.redis_client.pipeline", side_effect=RuntimeError("down")):
        with pytest.raises(rate_limit.RedisUnavailable):
            check_and_consume("k", 30, 60, cost=2)


def test_cooldown_read_fails_closed_by_default_and_opens_on_request():
    # 0 already means "no cooldown in effect", so reporting 0 on an error is the
    # collision that made the original fail-open invisible.
    with patch("api._lib.rate_limit.redis_client.command", side_effect=RuntimeError("down")):
        with pytest.raises(rate_limit.RedisUnavailable):
            get_cooldown_remaining("k")
        assert get_cooldown_remaining("k", fail_open=True) == 0


def test_start_cooldown_never_raises():
    # Runs after the daily slot is already consumed: failing the request here
    # would reject work the caller has already been charged for.
    with patch("api._lib.rate_limit.redis_client.command", side_effect=RuntimeError("down")):
        start_cooldown("k", 30)


def test_outage_is_logged_so_the_degradation_is_visible(caplog):
    caplog.set_level(logging.ERROR, logger="crog")
    with patch("api._lib.rate_limit.redis_client.pipeline", side_effect=RuntimeError("down")):
        check_and_consume("k", 30, 60, fail_open=True)
    assert any("rate limit unavailable" in r.getMessage() for r in caplog.records)


@pytest.mark.parametrize(
    "reply",
    [
        pytest.param([{"result": 0}, {"error": "OOM"}, {"result": 0}, {"result": 1}], id="refused-write"),
        pytest.param([{"result": 0}], id="short"),
        pytest.param([{"result": 0}, {"result": 1}, {"result": None}, {"result": 1}], id="no-count"),
    ],
)
def test_unusable_reply_fails_closed_and_is_logged(reply, caplog):
    # Each of these used to read as a count of 0, or escape as an IndexError (#194).
    caplog.set_level(logging.ERROR, logger="crog")
    with patch("api._lib.redis_client._post", return_value=reply):
        with pytest.raises(rate_limit.RedisUnavailable):
            check_and_consume("k", 30, 60)
        assert check_and_consume("k", 30, 60, fail_open=True) == (True, 0)
    assert any("rate limit unavailable" in r.getMessage() for r in caplog.records)


def test_cooldown_read_needs_an_integer_ttl():
    with patch("api._lib.redis_client._post", return_value={"result": None}):
        with pytest.raises(rate_limit.RedisUnavailable):
            get_cooldown_remaining("k")
        assert get_cooldown_remaining("k", fail_open=True) == 0

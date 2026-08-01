"""Unit tests for the sliding-window limiter (api/_lib/rate_limit.py).

Focus is the ``cost`` argument: a request that consumes several slots records
them in one round trip, so the recorded count reflects the whole request rather
than however many hits a per-slot loop managed before the cap tripped.
"""

from unittest.mock import patch

from api._lib import rate_limit

# conftest's autouse `_hermetic_rate_limit` stubs `rate_limit.check_and_consume`
# for every test in the suite -- including this module, whose subject IS that
# function. Bind the real one at import time, before any fixture runs, so these
# tests exercise the limiter instead of the stub standing in for it.
check_and_consume = rate_limit.check_and_consume


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


def test_falls_open_when_redis_is_down():
    # Losing rate limiting on a transient outage beats dropping legit traffic.
    with patch("api._lib.rate_limit.redis_client.pipeline", side_effect=RuntimeError("down")):
        allowed, count = check_and_consume("k", 30, 60, cost=2)
    assert allowed is True
    assert count == 0

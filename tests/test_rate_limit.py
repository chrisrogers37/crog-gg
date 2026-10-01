"""Unit tests for the limiter primitives (api/_lib/rate_limit.py).

``check_and_consume`` is one Lua script (#194): it records a request's ``cost``
hits in every window it names, and only if they fit in all of them, so a
refused request adds nothing anywhere.
``claim_cooldown`` checks and starts a cooldown in one SET NX. The mocked tests
pin what each one sends and how it reads the reply; the ``fake_upstash`` tests
run the real script against an in-memory Redis.
"""

import logging
import time
from types import SimpleNamespace
from unittest.mock import patch

import pytest

from api._lib import rate_limit

# conftest's autouse `_hermetic_rate_limit` stubs these for every test in the
# suite -- including this module, whose subject IS them. Bind the real ones at
# import time, before any fixture runs, so these tests exercise the limiter
# instead of the stubs standing in for it.
check_and_consume = rate_limit.check_and_consume
get_cooldown_remaining = rate_limit.get_cooldown_remaining
claim_cooldown = rate_limit.claim_cooldown


def _eval_sent(command):
    """The windows, caps and members the limiter's EVAL sent the script."""
    args = command.call_args.args
    assert args[:2] == ("EVAL", rate_limit._CONSUME_SCRIPT)
    n = args[2]
    # After numkeys: the keys, then ARGV, which is 3 values, a cap per key, and
    # then the members.
    keys, argv = args[3:][:n], args[3:][n:]
    return SimpleNamespace(keys=keys, caps=argv[3:][:n], members=argv[3:][n:])


def test_default_cost_records_one_hit():
    with patch("api._lib.rate_limit.redis_client.command", return_value=0) as command:
        check_and_consume({"k": 30}, 60)
    assert len(_eval_sent(command).members) == 1


def test_cost_records_that_many_hits_in_one_round_trip():
    with patch("api._lib.rate_limit.redis_client.command", return_value=0) as command:
        check_and_consume({"k": 30}, 60, cost=3)
    command.assert_called_once()
    assert len(_eval_sent(command).members) == 3


def test_members_are_distinct_so_none_overwrite_each_other():
    # Same-millisecond members that collided would silently under-count.
    with patch("api._lib.rate_limit.redis_client.command", return_value=0) as command:
        check_and_consume({"k": 30}, 60, cost=4)
    assert len(set(_eval_sent(command).members)) == 4


def test_every_window_goes_in_one_call_with_its_cap():
    with patch("api._lib.rate_limit.redis_client.command", return_value=0) as command:
        check_and_consume({"visitor": 30, "site": 300}, 86400, cost=2)
    command.assert_called_once()
    sent = _eval_sent(command)
    assert sent.keys == ("visitor", "site")
    assert sent.caps == (30, 300)


@pytest.mark.parametrize("reply, full", [(0, None), (1, "visitor"), (2, "site")])
def test_the_script_names_the_full_window(reply, full):
    with patch("api._lib.rate_limit.redis_client.command", return_value=reply):
        assert check_and_consume({"visitor": 30, "site": 300}, 86400) == full


def test_falls_open_only_when_the_caller_opts_out():
    # Free endpoints keep serving: losing rate limiting on a transient outage
    # beats dropping legit traffic where an extra request costs nothing.
    with patch("api._lib.rate_limit.redis_client.command", side_effect=RuntimeError("down")):
        assert check_and_consume({"k": 30}, 60, cost=2, fail_open=True) is None


def test_fails_closed_by_default():
    # "Cannot meter" must not read as "allowed". The safe mode is the default so
    # that forgetting the flag on a paid gate cannot silently leak money -- the
    # direction a caller forgets in is the harmless one.
    with patch("api._lib.rate_limit.redis_client.command", side_effect=RuntimeError("down")):
        with pytest.raises(rate_limit.RedisUnavailable):
            check_and_consume({"k": 30}, 60, cost=2)


def test_cooldown_read_fails_closed_by_default_and_opens_on_request():
    # 0 already means "no cooldown in effect", so reporting 0 on an error is the
    # collision that made the original fail-open invisible.
    with patch("api._lib.rate_limit.redis_client.command", side_effect=RuntimeError("down")):
        with pytest.raises(rate_limit.RedisUnavailable):
            get_cooldown_remaining("k")
        assert get_cooldown_remaining("k", fail_open=True) == 0


def test_outage_is_logged_so_the_degradation_is_visible(caplog):
    caplog.set_level(logging.ERROR, logger="crog")
    with patch("api._lib.rate_limit.redis_client.command", side_effect=RuntimeError("down")):
        check_and_consume({"k": 30}, 60, fail_open=True)
    assert any("rate limit unavailable" in r.getMessage() for r in caplog.records)


@pytest.mark.parametrize(
    "reply",
    [
        pytest.param({"error": "OOM command not allowed"}, id="refused-write"),
        pytest.param({"result": None}, id="nil"),
        pytest.param({"result": 3}, id="no-such-window"),
        pytest.param({"result": -1}, id="negative"),
        pytest.param({"result": [1, 0]}, id="not-a-number"),
    ],
)
def test_unusable_reply_fails_closed_and_is_logged(reply, caplog):
    # Each of these must stop the request like an outage, not read as "recorded" (#194).
    caplog.set_level(logging.ERROR, logger="crog")
    with patch("api._lib.redis_client._post", return_value=reply):
        with pytest.raises(rate_limit.RedisUnavailable):
            check_and_consume({"visitor": 30, "site": 300}, 60)
        assert check_and_consume({"visitor": 30, "site": 300}, 60, fail_open=True) is None
    assert any("rate limit unavailable" in r.getMessage() for r in caplog.records)


def test_cooldown_read_needs_an_integer_ttl():
    with patch("api._lib.redis_client._post", return_value={"result": None}):
        with pytest.raises(rate_limit.RedisUnavailable):
            get_cooldown_remaining("k")
        assert get_cooldown_remaining("k", fail_open=True) == 0


def test_claim_cooldown_checks_and_starts_it_in_one_set_nx():
    # Without NX every press would claim it, and the cooldown would never refuse.
    with patch("api._lib.redis_client._post", return_value=[{"result": "OK"}, {"result": 30}]) as post:
        claim_cooldown("k", 30)
    post.assert_called_once_with("/pipeline", [["SET", "k", "1", "NX", "EX", "30"], ["TTL", "k"]])


@pytest.mark.parametrize(
    "reply, remaining",
    [
        # "OK": this press started the cooldown.
        pytest.param([{"result": "OK"}, {"result": 30}], 0, id="ok"),
        # nil: one is running, and the TTL says for how long.
        pytest.param([{"result": None}, {"result": 12}], 12, id="nil"),
        # It ran out between the SET and the TTL: still a refusal, for a second.
        pytest.param([{"result": None}, {"result": -2}], 1, id="nil-then-gone"),
    ],
)
def test_claim_cooldown_ok_nil(reply, remaining):
    with patch("api._lib.redis_client._post", return_value=reply):
        assert claim_cooldown("k", 30) == remaining


@pytest.mark.parametrize(
    "reply",
    [
        pytest.param([{"error": "OOM command not allowed"}, {"result": -2}], id="error"),
        pytest.param([{"result": None}, {"result": None}], id="no-ttl"),
        pytest.param([{"result": "OK"}], id="short"),
    ],
)
def test_claim_cooldown_error_fails_closed_and_is_logged(reply, caplog):
    # Anything else must refuse the press, never read as "OK" (#194).
    caplog.set_level(logging.ERROR, logger="crog")
    with patch("api._lib.redis_client._post", return_value=reply):
        with pytest.raises(rate_limit.RedisUnavailable):
            claim_cooldown("k", 30)
    assert any("cooldown claim unavailable" in r.getMessage() for r in caplog.records)


# --- the real script and SET NX, run by an in-memory Redis ------------------


def test_refused_request_adds_nothing(fake_upstash):
    # Recording refused hits would keep a full window full for as long as
    # someone kept asking, and push back everyone's wait (#194 M14).
    assert check_and_consume({"k": 3}, 60, cost=3) is None
    hits = fake_upstash.zrange("k", 0, -1, withscores=True)
    assert check_and_consume({"k": 3}, 60) == "k"
    assert fake_upstash.zrange("k", 0, -1, withscores=True) == hits


def test_a_request_is_recorded_whole_or_not_at_all(fake_upstash):
    assert check_and_consume({"k": 3}, 60, cost=2) is None
    assert check_and_consume({"k": 3}, 60, cost=2) == "k"
    assert check_and_consume({"k": 3}, 60, cost=1) is None
    assert fake_upstash.zcard("k") == 3


def test_a_full_window_keeps_the_request_out_of_every_window(fake_upstash):
    # A press the site-wide budget refuses must not spend the visitor's own
    # slots, or a budget outage would use up their day (#194 M11, M14).
    assert check_and_consume({"someone-else": 30, "site": 2}, 60, cost=2) is None
    assert check_and_consume({"visitor": 30, "site": 2}, 60) == "site"
    assert fake_upstash.zcard("visitor") == 0
    # The other way round, too: a visitor at their cap spends nothing site-wide.
    assert check_and_consume({"capped": 1, "roomy": 30}, 60) is None
    assert check_and_consume({"capped": 1, "roomy": 30}, 60) == "capped"
    assert fake_upstash.zcard("roomy") == 1


def test_the_first_full_window_is_the_one_named(fake_upstash):
    assert check_and_consume({"a": 1, "b": 1}, 60) is None
    assert check_and_consume({"a": 1, "b": 1}, 60) == "a"
    assert check_and_consume({"b": 1, "a": 1}, 60) == "b"


def test_hits_older_than_the_window_stop_counting(fake_upstash):
    stale_ms = int(time.time() * 1000) - 61_000
    fake_upstash.zadd("k", {f"{stale_ms}:old": stale_ms})
    assert check_and_consume({"k": 1}, 60) is None
    assert 0 < fake_upstash.ttl("k") <= 61  # and the key expires with its hits


def test_only_the_first_claim_starts_the_cooldown(fake_upstash):
    assert claim_cooldown("cd", 30) == 0
    assert 0 < claim_cooldown("cd", 30) <= 30
    fake_upstash.delete("cd")  # as if it ran out
    assert claim_cooldown("cd", 30) == 0

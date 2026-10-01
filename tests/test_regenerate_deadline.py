"""A press is answered inside its deadline (#195 M37).

Nothing bounded a press's wall clock: the SDK retried on its own and slept on a
Retry-After, so a slow OpenAI could hold the function until the platform cut it
off and the visitor saw a gateway error. ``_create_within`` gives each attempt
what's left of one deadline and retries a retryable failure once, if there's
time. The module's clock and ``openai_client`` are patched, so nothing waits and
nothing reaches OpenAI.
"""

import json
import logging
from contextlib import contextmanager
from pathlib import Path
from unittest.mock import MagicMock, patch

import httpx
import openai
import pytest

from api.index import REGEN_DEADLINE_SECONDS, _create_within, _make_openai_client

_REQUEST = httpx.Request("POST", "https://api.openai.com/v1/chat/completions")


def _status_error(status):
    """The error the SDK raises for an HTTP ``status``, built by the SDK."""
    response = httpx.Response(status, request=_REQUEST)
    return openai.OpenAI(api_key="test")._make_status_error(f"HTTP {status}", body=None, response=response)


class _Clock:
    def __init__(self, now):
        self.now = now

    def monotonic(self):
        return self.now


@contextmanager
def _openai(*calls, now=0.0):
    """Each of ``calls`` is (seconds it takes, what it returns or raises), and
    the patched clock moves as they take time. Yields the create() mock."""
    clock, script = _Clock(now), iter(calls)

    def create(**_kwargs):
        took, outcome = next(script)
        clock.now += took
        if isinstance(outcome, BaseException):
            raise outcome
        return outcome

    fake = MagicMock()
    fake.chat.completions.create.side_effect = create
    with patch("api.index.openai_client", fake), patch("api.index.time", clock):
        yield fake.chat.completions.create


@pytest.mark.parametrize(
    "failure",
    [
        openai.APIConnectionError(request=_REQUEST),
        openai.APITimeoutError(request=_REQUEST),
        _status_error(503),
    ],
    ids=["connection", "timeout", "503"],
)
def test_a_retryable_failure_gets_one_more_try(failure):
    with _openai((1.0, failure), (1.0, "the completion")) as create:
        assert _create_within(50.0, model="m") == "the completion"
    assert create.call_count == 2


def test_a_retry_gets_only_what_is_left_and_is_logged(caplog):
    # The first attempt takes 35 of the 50 seconds before it fails.
    caplog.set_level(logging.WARNING, logger="crog")
    with _openai((35.0, openai.APIConnectionError(request=_REQUEST)), (1.0, "the completion")) as create:
        _create_within(50.0, model="m")
    assert [c.kwargs["timeout"].read for c in create.call_args_list] == [20.0, 15.0]
    [line] = [r.getMessage() for r in caplog.records if r.getMessage().startswith("regenerate.retry")]
    assert line == "regenerate.retry error=APIConnectionError left=15.0"


def test_no_retry_once_under_ten_seconds_are_left():
    with _openai((41.0, openai.APIConnectionError(request=_REQUEST))) as create:
        with pytest.raises(openai.APIConnectionError):
            _create_within(50.0, model="m")
    assert create.call_count == 1


def test_a_second_failure_is_raised():
    failure = openai.APIConnectionError(request=_REQUEST)
    with _openai((1.0, failure), (1.0, failure)) as create:
        with pytest.raises(openai.APIConnectionError):
            _create_within(50.0, model="m")
    assert create.call_count == 2


def test_a_rate_limit_is_not_retried():
    with _openai((1.0, _status_error(429))) as create:
        with pytest.raises(openai.RateLimitError):
            _create_within(50.0, model="m")
    assert create.call_count == 1


@pytest.mark.parametrize("left, read", [(35.0, 20.0), (15.0, 15.0), (0.2, 1.0)])
def test_each_attempt_gets_what_is_left_of_the_deadline(left, read):
    with _openai((0.0, "the completion"), now=50.0 - left) as create:
        _create_within(50.0, model="m")
    timeout = create.call_args.kwargs["timeout"]
    assert (timeout.read, timeout.connect) == (read, 5.0)


def test_the_sdk_does_not_retry_on_its_own():
    # It would sleep on a Retry-After, past the deadline.
    assert _make_openai_client("test-key").max_retries == 0


def test_the_deadline_runs_from_when_the_press_arrives(client):
    # Time spent before the model calls comes out of the same budget: here the
    # cooldown claim takes 5 of the 12 seconds, leaving each section 7.
    clock = _Clock(100.0)

    def slow_claim(*_args):
        clock.now += 5
        return 0

    choice = MagicMock(finish_reason="stop")
    choice.message.content = '{"bio": "rewritten"}'
    fake = MagicMock()
    fake.chat.completions.create.return_value = MagicMock(choices=[choice])
    both = {"sections": {"about": {"bio": "hi"}, "portfolio": {"experience": []}}}
    with (
        patch("api.index.openai_client", fake),
        patch("api.index.REGEN_DEADLINE_SECONDS", 12),
    ):
        with (
            patch("api.index.time", clock),
            patch("api.index.rate_limit.claim_cooldown", side_effect=slow_claim),
        ):
            client.post("/api/regenerate", json=both)
    assert [c.kwargs["timeout"].read for c in fake.chat.completions.create.call_args_list] == [7.0, 7.0]


def test_the_deadline_leaves_room_under_the_function_limit():
    vercel = json.loads((Path(__file__).resolve().parents[1] / "vercel.json").read_text())
    assert REGEN_DEADLINE_SECONDS < vercel["functions"]["api/index.py"]["maxDuration"]

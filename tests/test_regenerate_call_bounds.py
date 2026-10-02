"""Each model call is bounded, in JSON mode, traceable and logged (#194 M12).

``openai_client`` is patched, so nothing reaches OpenAI.
"""

import logging
import re
from unittest.mock import MagicMock, patch

import pytest

from api._lib.prompts import _PROMPTS
from api._lib.request_utils import client_tag
from api.index import _MAX_COMPLETION_TOKENS, FAILURE_TRUNCATED

_ABOUT = {"sections": {"about": {"bio": "hi"}}}


def _model(content='{"bio": "rewritten"}', finish_reason="stop", usage=None):
    choice = MagicMock(finish_reason=finish_reason)
    choice.message.content = content
    fake = MagicMock()
    fake.chat.completions.create.return_value = MagicMock(choices=[choice], usage=usage)
    return fake


def test_every_section_the_allowlist_accepts_has_an_output_budget():
    # The allowlist is _PROMPTS. A section it accepts with no budget would be
    # charged a daily slot, then fail every press at the model call.
    assert set(_PROMPTS) == set(_MAX_COMPLETION_TOKENS)


@pytest.mark.parametrize("section, body", [("about", {"bio": "hi"}), ("portfolio", {"experience": []})])
def test_each_call_is_bounded_for_its_section_and_in_json_mode(client, section, body):
    fake = _model()
    with patch("api.index.openai_client", fake):
        client.post("/api/regenerate", json={"sections": {section: body}})

    kwargs = fake.chat.completions.create.call_args.kwargs
    assert kwargs["max_completion_tokens"] == _MAX_COMPLETION_TOKENS[section]
    assert kwargs["response_format"] == {"type": "json_object"}
    # The API refuses JSON mode unless the messages ask for JSON.
    assert "json" in " ".join(m["content"] for m in kwargs["messages"]).lower()


@pytest.mark.parametrize("content", ['{"bio": "rewrit', ""], ids=["cut-off", "nothing-left"])
def test_a_completion_that_ran_out_of_tokens_is_truncated(client, content):
    with patch("api.index.openai_client", _model(content=content, finish_reason="length")):
        r = client.post("/api/regenerate", json=_ABOUT)
    assert r.get_json()["failures"]["about"] == {
        "reason": FAILURE_TRUNCATED,
        "max_completion_tokens": _MAX_COMPLETION_TOKENS["about"],
    }


# A refused completion is billed like any other, so it gets a line too.
@pytest.mark.parametrize("finish_reason", ["stop", "length"])
def test_each_completed_call_logs_its_usage(client, caplog, finish_reason):
    caplog.set_level(logging.INFO, logger="crog")
    usage = MagicMock(prompt_tokens=120, completion_tokens=45)
    usage.completion_tokens_details.reasoning_tokens = 7
    with patch("api.index.openai_client", _model(finish_reason=finish_reason, usage=usage)):
        client.post("/api/regenerate", json=_ABOUT)

    [line] = [r.getMessage() for r in caplog.records if r.getMessage().startswith("regenerate.usage")]
    expected = rf"regenerate\.usage section=about ms=\d+ prompt=120 completion=45 reasoning=7 finish={finish_reason}"
    assert re.fullmatch(expected, line)


def test_the_visitors_tag_is_the_safety_identifier(client, salted):
    fake = _model()
    with patch("api.index.openai_client", fake):
        client.post("/api/regenerate", json=_ABOUT, headers={"x-real-ip": "203.0.113.7"})
    assert fake.chat.completions.create.call_args.kwargs["safety_identifier"] == client_tag("203.0.113.7")


def test_without_a_salt_no_safety_identifier_is_sent(client):
    fake = _model()
    with patch("api.index.openai_client", fake):
        client.post("/api/regenerate", json=_ABOUT)
    assert "safety_identifier" not in fake.chat.completions.create.call_args.kwargs

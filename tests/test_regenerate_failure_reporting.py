"""A failed generation must say why (#134 preview failure).

`gpt-5.6-luna` returned HTTP 500 on every attempt against the preview while
production kept working, and the cause could not be established from outside:
`_regenerate_section` collapsed both an OpenAI error and a JSON parse failure
into a bare `None`, so the reason existed only in a Vercel log nobody on the
fleet can read. Three attempts produced three identical, contentless 500s.

Two things are pinned here. That the request no longer carries a parameter the
current model generation rejects, and that when a call does fail the response
names the cause -- so the next failure costs one look instead of one deploy per
hypothesis.

Local mock builder rather than a shared one: `_mock_openai` in test_regenerate.py
and `_with_model_returning` in test_regenerate_social_links.py are already two
copies of this, and consolidating them is a separate cleanup that would touch
files owned by other in-flight branches.
"""

import json
from unittest.mock import MagicMock, patch

import openai
import pytest

from api.index import (
    FAILURE_MODEL_ERROR,
    FAILURE_NOT_JSON,
    OPENAI_SAMPLING,
    _describe_failure,
)

_BIO = {"bio": "hi"}
_BODY = {"sections": {"about": _BIO}}


def _client(content=None, error=None):
    fake = MagicMock()
    if error is not None:
        fake.chat.completions.create.side_effect = error
    else:
        fake.chat.completions.create.return_value = MagicMock(choices=[MagicMock(message=MagicMock(content=content))])
    return fake


def test_no_sampling_parameter_is_sent():
    # The observed failure. The current model generation accepts only the
    # default temperature and rejects an explicit one outright, so a single
    # stray kwarg fails 100% of calls rather than degrading.
    assert "temperature" not in OPENAI_SAMPLING
    assert "top_p" not in OPENAI_SAMPLING


def test_the_request_carries_no_rejected_parameter(client):
    fake = _client(content=json.dumps({"bio": "rewritten"}))
    with patch("api.index.openai_client", fake):
        client.post("/api/regenerate", json=_BODY)

    kwargs = fake.chat.completions.create.call_args.kwargs
    assert "temperature" not in kwargs, f"a rejected sampling param reached the API: {sorted(kwargs)}"
    assert set(kwargs) <= {"model", "messages"}, f"unexpected params on the wire: {sorted(kwargs)}"


def test_describe_failure_extracts_the_machine_tokens():
    # The shape OpenAI returns for a rejected parameter -- `code` and `param`
    # are what identify the cause without echoing the request back.
    exc = openai.OpenAIError("Unsupported value: 'temperature' does not support 0.7 with this model")
    exc.body = {"error": {"code": "unsupported_value", "param": "temperature"}}
    exc.status_code = 400

    d = _describe_failure(exc)
    assert d["code"] == "unsupported_value"
    assert d["param"] == "temperature"
    assert d["status"] == 400
    assert "temperature" in d["message"]


def test_describe_failure_survives_an_error_with_no_body():
    d = _describe_failure(openai.OpenAIError("boom"))
    assert d["type"] == "OpenAIError"
    assert d["code"] is None and d["param"] is None
    assert d["message"] == "boom"


def test_a_failed_request_names_the_cause(client):
    exc = openai.OpenAIError("Unsupported value: 'temperature'")
    exc.body = {"error": {"code": "unsupported_value", "param": "temperature"}}
    with patch("api.index.openai_client", _client(error=exc)):
        r = client.post("/api/regenerate", json=_BODY)

    assert r.status_code == 500
    body = r.get_json()
    assert body["failed_sections"] == ["about"]
    # The whole point: the 500 is no longer contentless.
    assert body["failures"]["about"]["reason"] == FAILURE_MODEL_ERROR
    assert body["failures"]["about"]["code"] == "unsupported_value"
    assert body["failures"]["about"]["param"] == "temperature"


def test_a_non_json_response_also_names_itself(client):
    with patch("api.index.openai_client", _client(content="not json at all")):
        r = client.post("/api/regenerate", json=_BODY)

    assert r.status_code == 500
    assert r.get_json()["failures"]["about"]["reason"] == FAILURE_NOT_JSON


def _section_aware_client():
    """Answer each section in its own shape.

    One canned body standing in for every section is an artifact, not a
    simplification: a response that shares no key with the section it rewrites
    is a legitimate thing to reject, so a shared body makes the test assert the
    rejection rather than the success it is named for.
    """
    fake = MagicMock()

    def per_call(**kwargs):
        prompt = kwargs["messages"][1]["content"]
        body = {"experience": [{"title": "Engineer"}]} if "experience" in prompt else {"bio": "rewritten"}
        return MagicMock(choices=[MagicMock(message=MagicMock(content=json.dumps(body)))])

    fake.chat.completions.create.side_effect = per_call
    return fake


def test_every_failure_reaches_the_log_at_one_level(client, caplog):
    """Internal taxonomy logs unconditionally, and at a single level.

    Split across two levels it is not one taxonomy but two half-populated ones:
    readable for a single incident and useless for a pattern. This was a real
    gap -- the non-JSON token reached the response body and never the log, while
    the two paths logged at ERROR and WARNING respectively.
    """
    import logging

    caplog.set_level(logging.DEBUG, logger="crog")

    exc = openai.OpenAIError("boom")
    cases = [(_client(error=exc), FAILURE_MODEL_ERROR), (_client(content="not json"), FAILURE_NOT_JSON)]
    levels = set()
    for fake, token in cases:
        caplog.clear()
        with patch("api.index.openai_client", fake):
            client.post("/api/regenerate", json=_BODY)
        emitted = [r for r in caplog.records if token in r.getMessage()]
        assert emitted, f"{token} never reached the log"
        levels.update(r.levelname for r in emitted)

    assert levels == {"ERROR"}, f"taxonomy split across log levels: {levels}"


@pytest.mark.parametrize("sections", [{"about": _BIO}, {"about": _BIO, "portfolio": {"experience": []}}])
def test_a_successful_request_reports_no_failures(client, sections):
    with patch("api.index.openai_client", _section_aware_client()):
        r = client.post("/api/regenerate", json={"sections": sections})
    assert r.status_code == 200
    assert r.get_json()["failures"] == {}

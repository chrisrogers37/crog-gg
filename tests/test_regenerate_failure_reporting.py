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

Local mock builder rather than a shared one: `_mock_openai` in test_regenerate.py,
`_with_model_returning` in test_regenerate_social_links.py and `_model` in
test_regenerate_call_bounds.py are already copies of this, and consolidating
them is a separate cleanup that would touch files owned by other in-flight
branches.
"""

import json
from unittest.mock import MagicMock, patch

import httpx
import openai
import pytest

from api.index import (
    FAILURE_EMPTY_RESPONSE,
    FAILURE_MODEL_ERROR,
    FAILURE_NOT_JSON,
    FAILURE_UNEXPECTED,
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
    # Exact, so every parameter on the wire is one someone chose (#194 M12).
    # No safety_identifier: conftest leaves IP_HASH_SALT unset.
    expected = {"model", "messages", "max_completion_tokens", "response_format"}
    assert set(kwargs) == expected, f"unexpected params on the wire: {sorted(kwargs)}"
    assert kwargs["max_completion_tokens"] > 0


def _api_error(status, code=None, param=None, message="Unsupported value: 'temperature' does not support 0.7"):
    """An OpenAI error exactly as the SDK raises it for an HTTP error response.

    Built through the SDK rather than by setting attributes by hand: the SDK
    unwraps OpenAI's {"error": {...}} envelope before raising, and a hand-built
    envelope hid for months that _describe_failure never found `code`.
    """
    body = {"error": {"message": message, "type": "invalid_request_error", "param": param, "code": code}}
    response = httpx.Response(status, request=httpx.Request("POST", "https://api.openai.com/v1/chat/completions"))
    return openai.OpenAI(api_key="test")._make_status_error(f"Error code: {status} - {body}", body=body, response=response)


def test_describe_failure_extracts_the_machine_tokens():
    # The shape OpenAI returns for a rejected parameter -- `code` and `param`
    # are what identify the cause without echoing the request back.
    public, private = _describe_failure(_api_error(400, code="unsupported_value", param="temperature"))
    assert public == {"status": 400, "code": "unsupported_value"}
    assert private["param"] == "temperature"
    assert private["type"] == "BadRequestError"
    assert "does not support 0.7" in private["message"]


def test_describe_failure_also_reads_a_wrapped_envelope():
    exc = openai.OpenAIError("boom")
    exc.body = {"error": {"code": "unsupported_value", "param": "temperature"}}
    public, private = _describe_failure(exc)
    assert public["code"] == "unsupported_value" and private["param"] == "temperature"


def test_a_quota_error_names_itself(client):
    exc = _api_error(429, code="insufficient_quota", message="You exceeded your current quota. " * 12)
    with patch("api.index.openai_client", _client(error=exc)):
        r = client.post("/api/regenerate", json=_BODY)
    assert r.get_json()["failures"]["about"] == {"reason": FAILURE_MODEL_ERROR, "status": 429, "code": "insufficient_quota"}


def test_describe_failure_survives_an_error_with_no_body():
    public, private = _describe_failure(openai.OpenAIError("boom"))
    assert public == {"status": None, "code": None}
    assert private == {"type": "OpenAIError", "param": None, "message": "boom"}


def test_a_failed_request_names_the_cause(client):
    exc = _api_error(400, code="unsupported_value", param="temperature")
    with patch("api.index.openai_client", _client(error=exc)):
        r = client.post("/api/regenerate", json=_BODY)

    assert r.status_code == 500
    body = r.get_json()
    assert body["failed_sections"] == ["about"]
    # The whole point: the 500 is no longer contentless. The machine token
    # names the cause; the provider's own words stay server-side (#199).
    assert body["failures"]["about"] == {"reason": FAILURE_MODEL_ERROR, "status": 400, "code": "unsupported_value"}


def test_provider_text_stays_in_the_log(client, caplog, monkeypatch):
    import logging

    monkeypatch.delenv("VERCEL_ENV", raising=False)
    caplog.set_level(logging.ERROR, logger="crog")
    exc = _api_error(400, code="unsupported_value", param="temperature")
    with patch("api.index.openai_client", _client(error=exc)):
        r = client.post("/api/regenerate", json=_BODY)

    assert "does not support" not in r.get_data(as_text=True)
    assert "temperature" not in r.get_data(as_text=True)
    [record] = [rec for rec in caplog.records if "regeneration failed" in rec.getMessage()]
    assert "does not support 0.7" in record.getMessage()
    assert "'param': 'temperature'" in record.getMessage()


def test_preview_responses_keep_the_provider_text(client, monkeypatch):
    # Previews sit behind Vercel's login, so they keep #134's browser-side
    # diagnosis.
    monkeypatch.setenv("VERCEL_ENV", "preview")
    exc = _api_error(400, code="unsupported_value", param="temperature")
    with patch("api.index.openai_client", _client(error=exc)):
        r = client.post("/api/regenerate", json=_BODY)

    failure = r.get_json()["failures"]["about"]
    assert failure["param"] == "temperature"
    assert "Unsupported value" in failure["message"]


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


# --- empty completions and crashed workers (#195) --------------------------
# A completion with no text made json.loads raise a TypeError nothing caught,
# and any exception in a worker re-raised from future.result(). Either way the
# request became an HTML 500 that also discarded the sections that worked.

_TWO = {"sections": {"about": _BIO, "portfolio": {"experience": [{"title": "Eng"}]}}}


def _choice(content, finish_reason="stop"):
    return MagicMock(message=MagicMock(content=content), finish_reason=finish_reason)


def _choices_client(choices):
    fake = MagicMock()
    fake.chat.completions.create.return_value = MagicMock(choices=choices)
    return fake


def _about_gets(about_choices):
    """`about` receives ``about_choices``; `portfolio` receives a usable rewrite."""
    fake = MagicMock()

    def per_call(**kwargs):
        if "experience" in kwargs["messages"][1]["content"]:
            return MagicMock(choices=[_choice(json.dumps({"experience": [{"title": "Engineer"}]}))])
        return MagicMock(choices=about_choices)

    fake.chat.completions.create.side_effect = per_call
    return fake


def test_none_content_is_counted_and_sibling_survives(client):
    with patch("api.index.openai_client", _about_gets([_choice(None, finish_reason="content_filter")])):
        r = client.post("/api/regenerate", json=_TWO)
    assert r.status_code == 200
    body = r.get_json()
    assert "portfolio" in body["content"]
    assert body["failed_sections"] == ["about"]
    assert body["failures"]["about"] == {"reason": FAILURE_EMPTY_RESPONSE, "finish_reason": "content_filter"}


@pytest.mark.parametrize(
    "choices",
    [[], None, [_choice("")], [_choice("  \n ")], [MagicMock(message=None, finish_reason="stop")]],
    ids=["empty-choices", "null-choices", "empty-text", "blank-text", "null-message"],
)
def test_empty_completion_is_counted(client, choices):
    with patch("api.index.openai_client", _choices_client(choices)):
        r = client.post("/api/regenerate", json=_BODY)
    assert r.status_code == 500
    assert r.is_json
    assert r.get_json()["failures"]["about"]["reason"] == FAILURE_EMPTY_RESPONSE


def test_worker_crash_is_counted_not_500(client):
    def crash_about(name, *args):
        if name == "about":
            raise RuntimeError("detail that must stay server-side")
        return {"experience": [{"title": "Engineer"}]}, None

    with patch("api.index.openai_client", MagicMock()), patch("api.index._regenerate_section", side_effect=crash_about):
        r = client.post("/api/regenerate", json=_TWO)
    assert r.status_code == 200
    body = r.get_json()
    assert body["content"] == {"portfolio": {"experience": [{"title": "Engineer"}]}}
    assert body["failures"]["about"] == {"reason": FAILURE_UNEXPECTED, "error_type": "RuntimeError"}
    assert "must stay server-side" not in r.get_data(as_text=True)


def test_a_crash_in_every_section_is_still_json(client):
    with patch("api.index.openai_client", MagicMock()), patch(
        "api.index._regenerate_section", side_effect=RuntimeError("boom")
    ):
        r = client.post("/api/regenerate", json=_BODY)
    assert r.status_code == 500
    assert r.is_json
    assert r.get_json()["failures"]["about"]["reason"] == FAILURE_UNEXPECTED

"""Pytest bootstrap + shared fixtures.

Put the repo root on sys.path so ``import api.index`` resolves regardless of
how pytest is invoked. The backend package is rooted at the repo root and
imports itself as ``api.*`` (e.g. ``from api._lib import rate_limit``), so the
repo root must be importable for the test suite.

The Flask test client, the hermetic stubs and the fakes and fixtures the test
modules share are defined here, once, so no module redefines the plumbing.
"""

import importlib
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# The fictional site.example (#191), so the owner's own edits to site/ can't
# turn the API's tests red. Assigned, not defaulted, so a developer's shell
# can't leak another site in; test_site_config.py loads site/site.yaml itself.
os.environ["SITE_DIR"] = "site.example"

from unittest.mock import MagicMock, patch  # noqa: E402

import pytest  # noqa: E402

from api._lib import rate_limit, request_utils  # noqa: E402
from api.index import _MAX_COMPLETION_TOKENS, _PROMPTS, app  # noqa: E402

# Bound at import time, before _hermetic_rate_limit replaces them.
_REAL_LIMITER = {
    "check_and_consume": rate_limit.check_and_consume,
    "get_cooldown_remaining": rate_limit.get_cooldown_remaining,
    "claim_cooldown": rate_limit.claim_cooldown,
}


@pytest.fixture
def client():
    app.config.update(TESTING=True)
    return app.test_client()


@pytest.fixture(autouse=True)
def _hermetic_rate_limit():
    """Keep tests hermetic: never depend on (or reach for) Redis rate limiting.

    Here we stub them so no test touches the network and the cooldown/daily-cap
    gates default to "allowed" unless a test overrides them.

    Production failure modes differ per call site (#113): the free GitHub
    endpoints fall open, the paid /api/regenerate gates fail closed. Tests that
    exercise either behaviour must patch over this fixture, which stubs the very
    primitives under test: ``real_limiter`` puts them back. See
    tests/test_regenerate_spend_guard.py.
    """
    with patch("api.index.rate_limit.check_and_consume", return_value=None):
        with patch("api.index.rate_limit.get_cooldown_remaining", return_value=0):
            with patch("api.index.rate_limit.claim_cooldown", return_value=0):
                yield


@pytest.fixture
def real_limiter():
    """Put back the real primitives that ``_hermetic_rate_limit`` stubs."""
    with patch.multiple("api.index.rate_limit", **_REAL_LIMITER):
        yield


@pytest.fixture
def redis_down(real_limiter):
    """Real limiter, unreachable Redis."""
    with patch("api._lib.rate_limit.redis_client.command", side_effect=RuntimeError("redis down")):
        with patch("api._lib.rate_limit.redis_client.pipeline", side_effect=RuntimeError("redis down")):
            yield


@pytest.fixture(autouse=True)
def _unsalted():
    """No IP_HASH_SALT unless a test asks for one with ``salted``, so a salt
    exported in the shell can't change what the tests see."""
    with patch.object(request_utils, "IP_HASH_SALT", ""):
        yield


@pytest.fixture(autouse=True)
def _no_real_openai():
    """No test reaches OpenAI, whatever OPENAI_API_KEY the shell exports: a
    test that doesn't patch the client gets one whose every call fails. A test
    of the keyless path patches it to None itself (#189 M21)."""
    client = MagicMock()
    client.chat.completions.create.side_effect = AssertionError("unexpected OpenAI call")
    with patch("api.index.openai_client", client):
        yield
    # A press the handler turned into a failed section still fails the test.
    client.chat.completions.create.assert_not_called()


@pytest.fixture
def fake_openai():
    """Build a fake OpenAI client, to patch in as ``api.index.openai_client``.

    Each call answers with ``content``, the reply's text: a string as it is, or
    a dict or list sent as its JSON, by default a usable ``about`` rewrite.
    ``finish_reason`` and ``usage`` ride on the reply. ``error`` is raised
    instead, and ``per_call`` takes over entirely, for a test whose answer
    depends on the section: it gets each call's arguments and returns that
    call's content, taken as ``content`` is, or a whole response.
    """

    def build(content='{"bio": "rewritten"}', error=None, per_call=None, finish_reason="stop", usage=None):
        def reply(text):
            if isinstance(text, (dict, list)):
                text = json.dumps(text)
            choice = MagicMock(finish_reason=finish_reason)
            choice.message.content = text
            return MagicMock(choices=[choice], usage=usage)

        def answer(**kwargs):
            response = per_call(**kwargs)
            return reply(response) if isinstance(response, (str, dict, list)) else response

        fake = MagicMock()
        if per_call is not None:
            fake.chat.completions.create.side_effect = answer
        elif error is not None:
            fake.chat.completions.create.side_effect = error
        else:
            fake.chat.completions.create.return_value = reply(content)
        return fake

    return build


# Shaped like a real section's prompt: a role, and a format that asks for JSON
# in words, as JSON mode requires.
_NOTES_PROMPT = {
    "system": "You rewrite short notes. Return ONLY valid JSON with no prefixes or additional text.",
    "format": "Return ONLY the JSON object, with every text field rewritten.\n",
}


@pytest.fixture
def notes_section(monkeypatch):
    """Register "notes", a test-only second /api/regenerate section, and return
    its name. `about` is the only real section, but metering per section,
    partial failure, the shared deadline and one register per press are about
    every section a press sends, so their tests need a second one to send.

    Added to the dicts api.index reads: its ``_PROMPTS`` is prompts.py's own
    dict, imported by name, so the allowlist and the prompt both see it.
    monkeypatch takes it out again after the test. Its output budget differs
    from about's, so a test can tell which section's bound a call got. Like any
    section but about, it has no ``_UNAUTHORED_KEYS`` entry.
    """
    monkeypatch.setitem(_PROMPTS, "notes", _NOTES_PROMPT)
    monkeypatch.setitem(_MAX_COMPLETION_TOKENS, "notes", 1000)
    return "notes"


@pytest.fixture
def salted():
    with patch.object(request_utils, "IP_HASH_SALT", "a-test-salt-of-thirty-two-chars!"):
        yield


def _require(module: str):
    """A test-only dependency: skipped where it's missing locally, but a failure
    in CI, which installs requirements-dev.txt, so a broken install can't
    quietly switch the tests off (the #120 lesson)."""
    if os.environ.get("CI"):
        return importlib.import_module(module)
    return pytest.importorskip(module)


@pytest.fixture
def fake_upstash():
    """Upstash's REST replies, served by an in-memory Redis that runs Lua (#194).

    Only the client's network call is replaced, so the reply unwrapping, the
    pipeline checks and the limiter's Lua script all run for real. Yields a
    client on the same data for assertions. Needs ``fakeredis[lua]``, from
    requirements-dev.txt.
    """
    fakeredis = _require("fakeredis")
    _require("lupa")  # what fakeredis runs EVAL with
    from redis.exceptions import ResponseError

    server = fakeredis.FakeServer()
    upstash = fakeredis.FakeRedis(server=server, decode_responses=True)
    upstash.response_callbacks = {}  # raw replies, which is what Upstash serializes

    def reply(args):
        try:
            return {"result": upstash.execute_command(*args)}
        except ResponseError as exc:
            return {"error": str(exc)}

    def post(path, body):
        return [reply(args) for args in body] if path == "/pipeline" else reply(body)

    with patch("api._lib.redis_client._post", side_effect=post):
        yield fakeredis.FakeRedis(server=server, decode_responses=True)

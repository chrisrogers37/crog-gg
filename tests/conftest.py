"""Fixtures for the tests under tests/. The repo root's conftest.py holds the
rest and loads first, so ``api.index`` is importable here."""

import pytest

import api.index as index

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
    monkeypatch.setitem(index._PROMPTS, "notes", _NOTES_PROMPT)
    monkeypatch.setitem(index._MAX_COMPLETION_TOKENS, "notes", 1000)
    return "notes"

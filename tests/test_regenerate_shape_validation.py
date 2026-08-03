"""A well-formed response is not automatically a usable section (#105).

The model can return JSON that parses cleanly and is still not a section: an
empty object, a bare string, a list. Each of those reached the page as a blank
section from an HTTP 200 this endpoint reported as a success -- no exception, no
failed request, no log line. Calling that a success is the defect; the shape
check turns it into the failed-section path that already exists.

Scope note: this pins the SERVER's half. Whether an individual field is
renderable is validated in the store (frontend/src/store/contentStore.ts), so a
section that is a section but carries one empty list passes here on purpose --
the caller keeps the fields that did come back rather than losing the section.
"""

import json
from unittest.mock import MagicMock, patch

import pytest

from api.index import _is_usable_section

_ORIGINAL = {"about_text": "original", "display_name": "Chris"}


@pytest.mark.parametrize(
    "parsed",
    [
        pytest.param({}, id="empty-object"),
        pytest.param([], id="empty-list"),
        pytest.param("a truncated sentence with no shape at all", id="bare-string"),
        pytest.param([{"about_text": "x"}], id="list-of-objects"),
        pytest.param(0, id="number"),
        pytest.param({"unrelated": "value"}, id="object-sharing-no-key"),
    ],
)
def test_unusable_shapes_are_rejected(parsed):
    assert _is_usable_section(parsed, _ORIGINAL) is False


@pytest.mark.parametrize(
    "parsed",
    [
        pytest.param({"about_text": "rewritten"}, id="partial-rewrite"),
        pytest.param({"about_text": "x", "display_name": "y"}, id="full-rewrite"),
        pytest.param({"about_text": "x", "tagline": "new"}, id="rewrite-adding-a-key"),
        pytest.param({"experience": []}, id="section-with-one-empty-list-is-the-clients-call"),
    ],
)
def test_usable_shapes_are_accepted(parsed):
    original = {**_ORIGINAL, "experience": [{"title": "Engineer"}]}
    assert _is_usable_section(parsed, original) is True


def _client_returning(payload):
    fake = MagicMock()
    fake.chat.completions.create.return_value = MagicMock(
        choices=[MagicMock(message=MagicMock(content=json.dumps(payload)))]
    )
    return fake


# The payload the store actually sends is a full BioData, social_links and email
# included (contentStore.ts posts `state.bio`). Testing with a thinner object
# hides the interaction below, because the unauthored-key restore has nothing to
# graft when those keys are absent -- so these end-to-end tests use the real one.
_REAL_BIO = {
    "display_name": "Christopher Rogers",
    "email": "someone@example.com",
    "location": "New York",
    "about_text": "original text",
    "welcome_message": "hello",
    "social_links": {"github": "chrisrogers37"},
}


@pytest.mark.parametrize(
    "model_returns",
    [
        pytest.param({}, id="empty-object"),
        pytest.param({"unrelated": "value"}, id="unrelated-object"),
        pytest.param("a truncated sentence with no shape at all", id="bare-string"),
    ],
)
def test_unusable_section_is_reported_as_failed_not_as_success(client, model_returns):
    # End to end: the endpoint must not hand the caller a blank section and
    # call it a success. Nothing usable came back, so the request fails.
    with patch("api.index.openai_client", _client_returning(model_returns)):
        r = client.post("/api/regenerate", json={"sections": {"about": _REAL_BIO}})
    assert r.status_code == 500
    body = r.get_json()
    assert body["success"] is False
    assert body["failed_sections"] == ["about"]


def test_unauthored_key_restore_cannot_rescue_an_unusable_shape(client):
    """Regression: order of validation vs the unauthored-key restore.

    `_UNAUTHORED_KEYS` grafts `email` and `social_links` from the original onto
    the model's output. Validating after that graft made an empty object look
    usable -- it had inherited two keys that shared with the original -- so `{}`
    came back as HTTP 200 with `about = {email, social_links}` and the page lost
    display_name, about_text and welcome_message. A blank section, reported as a
    success, through the check written to prevent exactly that.

    Pinned separately from the parametrised case above because it only appears
    when the request carries the unauthored keys, which is what a real client
    sends and what a thin fixture omits.
    """
    with patch("api.index.openai_client", _client_returning({})):
        r = client.post("/api/regenerate", json={"sections": {"about": _REAL_BIO}})

    assert r.status_code == 500, "empty object was rescued by the unauthored-key restore"
    assert "content" not in r.get_json() or not r.get_json().get("content")


def test_a_usable_partial_rewrite_still_succeeds(client):
    # A rewrite legitimately returns a subset of what it was given; the restore
    # then puts the unauthored keys back.
    with patch("api.index.openai_client", _client_returning({"about_text": "rewritten"})):
        r = client.post("/api/regenerate", json={"sections": {"about": _REAL_BIO}})
    assert r.status_code == 200
    about = r.get_json()["content"]["about"]
    assert about["about_text"] == "rewritten"
    assert about["social_links"] == _REAL_BIO["social_links"]

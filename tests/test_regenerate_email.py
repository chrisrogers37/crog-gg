"""Unit tests for the ``email`` pin on ``/api/regenerate`` (issue #130).

Same defect class as #98/#122, one field over. The ``about`` payload carries
``email``, the ``about`` prompt tells the model to rewrite EVERY text field with
no carve-out, and the client renders whatever comes back straight into a
``mailto:`` href (``ContactCTA.tsx:85``). So each regeneration was free to
change the contact address the site publishes.

Note the exposure here is not script execution -- the ``mailto:`` scheme prefix
is fixed in the JSX, so a ``javascript:`` value cannot break out of it. It is
that the link keeps working and points somewhere else: mail to a different
recipient, or extra ``?bcc=``/``?body=`` parameters smuggled through the
address. The link looks and behaves normal, which is what makes it quiet.

These tests fabricate the model response rather than calling OpenAI. That is
deliberate and stronger than an end-to-end run: it proves the property holds for
ANY model output, including outputs a live call would not happen to produce.
No network access occurs and no API key is required.
"""

import json
from unittest.mock import MagicMock, patch

ORIGINAL_EMAIL = "someone@example.com"

ORIGINAL_SOCIAL_LINKS = {
    "github": "https://github.com/chrisrogers37/",
    "linkedin": "https://www.linkedin.com/in/chrisrogers37/",
}


def _bio(email=ORIGINAL_EMAIL, social_links=None):
    """A realistic ``about`` payload, shaped like site/public/content/bio.yaml."""
    payload = {
        "display_name": "Christopher Rogers",
        "location": "New York City, New York",
        "about_text": "original bio prose",
    }
    if email is not None:
        payload["email"] = email
    if social_links is not None:
        payload["social_links"] = social_links
    return payload


def _with_model_returning(payload):
    """Patch the OpenAI client so the handler parses ``payload`` as model output."""
    fake = MagicMock()
    fake.chat.completions.create.return_value.choices = [
        MagicMock(message=MagicMock(content=json.dumps(payload)))
    ]
    return patch("api.index.openai_client", fake)


def _regenerate(client, model_returns, content, section="about", use_fantasy=False):
    with _with_model_returning(model_returns):
        response = client.post(
            "/api/regenerate",
            json={"sections": {section: content}, "use_fantasy": use_fantasy},
        )
    assert response.status_code == 200, response.get_data(as_text=True)
    return response.get_json()["content"][section]


def test_model_rewritten_email_is_discarded(client):
    """The core case: a different address the model invented must not reach the client."""
    mangled = _bio(email="invented.contact@example.net")

    result = _regenerate(client, mangled, _bio())

    assert result["email"] == ORIGINAL_EMAIL


def test_mailto_parameter_injection_is_discarded(client):
    """An address carrying ``?bcc=`` / ``?body=`` would silently copy a third party."""
    mangled = _bio(email="someone@example.com?bcc=attacker@evil.example&body=hi")

    result = _regenerate(client, mangled, _bio())

    assert result["email"] == ORIGINAL_EMAIL
    assert "bcc" not in json.dumps(result)


def test_lookalike_address_is_discarded(client):
    """A near-miss is the realistic failure -- it survives a human glance at the page."""
    mangled = _bio(email="someone@examp1e.com")

    result = _regenerate(client, mangled, _bio())

    assert result["email"] == ORIGINAL_EMAIL


def test_fantasy_mode_cannot_rewrite_the_email(client):
    """Fantasy mode instructs transforming EVERY field, so it invites this most."""
    mangled = _bio(email="christopher.the.dataweaver@realms.of.data")

    result = _regenerate(client, mangled, _bio(), use_fantasy=True)

    assert result["email"] == ORIGINAL_EMAIL


def test_input_without_email_is_not_synthesised(client):
    """A caller that sent no address must not get one the model made up."""
    mangled = _bio(email="invented@nowhere.test")

    result = _regenerate(client, mangled, _bio(email=None))

    assert "email" not in result


def test_prose_rewrites_still_pass_through(client):
    """The pin is narrow: everything the model IS meant to rewrite still lands."""
    mangled = _bio(email="wrong@example.com")
    mangled["about_text"] = "a completely rewritten biography"
    mangled["display_name"] = "Chris T. Rogers"

    result = _regenerate(client, mangled, _bio())

    assert result["about_text"] == "a completely rewritten biography"
    assert result["display_name"] == "Chris T. Rogers"
    assert result["email"] == ORIGINAL_EMAIL


def test_email_and_social_links_are_pinned_in_one_pass(client):
    """Both unauthored keys are restored from the same response, not just whichever is first."""
    mangled = _bio(
        email="wrong@example.com",
        social_links={"github": "https://github.com/lookalike-example/", "linkedin": ""},
    )

    result = _regenerate(client, mangled, _bio(social_links=ORIGINAL_SOCIAL_LINKS))

    assert result["email"] == ORIGINAL_EMAIL
    assert result["social_links"] == ORIGINAL_SOCIAL_LINKS


def test_portfolio_section_email_is_untouched(client):
    """The pin table is per-section: only ``about`` declares ``email`` unauthored.

    The input carries an ``email`` too, because a key the input lacks is dropped
    as the model's invention whatever the section (#199)."""
    rewritten = {
        "experience": [{"title": "rewritten"}],
        "email": "anything@example.com",
    }

    result = _regenerate(
        client,
        rewritten,
        {"experience": [{"title": "original"}], "email": "original@example.com"},
        section="portfolio",
    )

    assert result == rewritten

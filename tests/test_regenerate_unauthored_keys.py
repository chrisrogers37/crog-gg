"""The keys the model may not author on ``/api/regenerate`` (#98, #130).

``_UNAUTHORED_KEYS`` restores ``about``'s ``social_links``, an object of URLs,
and ``email`` from the caller's input after parsing, so the model cannot author
them at all. The ``about`` prompt tells the model to rewrite EVERY text field,
with no carve-out for either, and the page used to render both straight into
an href: ``<a href>`` and a ``mailto:`` link. A client may still send them, and
the API keeps guarding them.

The ``mailto:`` exposure is not script execution -- the scheme prefix is fixed
in the JSX, so a ``javascript:`` value cannot break out of it. It is that the
link keeps working and points somewhere else: mail to a different recipient, or
extra ``?bcc=``/``?body=`` parameters smuggled through the address. The link
looks and behaves normal, which is what makes it quiet.

These tests fabricate the model response rather than calling OpenAI. That is
deliberate and stronger than an end-to-end run: it proves the property holds for
ANY model output, including outputs a live call would not happen to produce.
No network access occurs and no API key is required.
"""

import json
from unittest.mock import patch

import pytest

ORIGINAL_EMAIL = "someone@example.com"

ORIGINAL_SOCIAL_LINKS = {
    "github": "https://github.com/chrisrogers37/",
    "hoobe": "https://hoo.be/crog",
    "spotify": "https://open.spotify.com/artist/0UotSScPTiSFPmbmjam2jn",
    "linkedin": "https://www.linkedin.com/in/chrisrogers37/",
    "telegram": "https://t.me/crogcrogcrog",
    "instagram_personal": "https://instagram.com/cr0g",
    "instagram_music": "https://instagram.com/crogmusic",
}

# What a caller sends under each unauthored key, and what the model writes there instead.
SENT = {"email": ORIGINAL_EMAIL, "social_links": ORIGINAL_SOCIAL_LINKS}
AUTHORED = {"email": "invented@nowhere.test", "social_links": {"github": "https://github.com/lookalike-example/"}}
# The mode each key's cases post. social_links runs in fantasy mode, the only mode the page sends;
# email runs in the plain rewrite, and its fantasy-mode case is its own test.
FANTASY = {"email": False, "social_links": True}


def _bio(social_links=None, email=ORIGINAL_EMAIL):
    """An ``about`` payload, with ``email`` unless it is None and ``social_links`` when given."""
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


def _regenerate(client, fake_openai, model_returns, content, section="about", use_fantasy=False):
    with patch("api.index.openai_client", fake_openai(content=model_returns)):
        response = client.post(
            "/api/regenerate",
            json={"sections": {section: content}, "use_fantasy": use_fantasy},
        )
    assert response.status_code == 200, response.get_data(as_text=True)
    return response.get_json()["content"][section]


# --- both keys ----------------------------------------------------------------


@pytest.mark.parametrize("key", ["email", "social_links"])
def test_prose_rewrites_still_pass_through(client, fake_openai, key):
    """The pin is narrow: everything the model IS meant to rewrite still lands."""
    mangled = _bio(**{key: AUTHORED[key]})
    mangled["about_text"] = "a completely rewritten biography"
    mangled["display_name"] = "Chris T. Rogers"

    result = _regenerate(client, fake_openai, mangled, _bio(**{key: SENT[key]}), use_fantasy=FANTASY[key])

    assert result["about_text"] == "a completely rewritten biography"
    assert result["display_name"] == "Chris T. Rogers"
    assert result[key] == SENT[key]


@pytest.mark.parametrize("key", ["email", "social_links"])
def test_input_without_the_key_is_not_synthesised(client, fake_openai, key):
    """A caller that sent nothing under the key must not get a value the model made up."""
    result = _regenerate(
        client, fake_openai, _bio(**{key: AUTHORED[key]}), _bio(**{key: None}), use_fantasy=FANTASY[key]
    )

    assert key not in result


@pytest.mark.parametrize("key", ["email", "social_links"])
def test_another_section_is_untouched(client, fake_openai, notes_section, key):
    """The pin table is per-section: only ``about`` declares these keys unauthored.

    The input carries the key too, because a key the input lacks is dropped as
    the model's invention whatever the section (#199)."""
    rewritten = {"entries": [{"title": "rewritten"}], key: AUTHORED[key]}

    result = _regenerate(
        client,
        fake_openai,
        rewritten,
        {"entries": [{"title": "original"}], key: SENT[key]},
        section="notes",
        use_fantasy=FANTASY[key],
    )

    assert result == rewritten


def test_email_and_social_links_are_pinned_in_one_pass(client, fake_openai):
    """Both unauthored keys are restored from the same response, not just whichever is first."""
    mangled = _bio(
        email="wrong@example.com",
        social_links={"github": "https://github.com/lookalike-example/", "linkedin": ""},
    )

    result = _regenerate(client, fake_openai, mangled, _bio(social_links=ORIGINAL_SOCIAL_LINKS))

    assert result["email"] == ORIGINAL_EMAIL
    assert result["social_links"] == ORIGINAL_SOCIAL_LINKS


# --- email --------------------------------------------------------------------


def test_model_rewritten_email_is_discarded(client, fake_openai):
    """The core case: a different address the model invented must not reach the client."""
    mangled = _bio(email="invented.contact@example.net")

    result = _regenerate(client, fake_openai, mangled, _bio())

    assert result["email"] == ORIGINAL_EMAIL


def test_mailto_parameter_injection_is_discarded(client, fake_openai):
    """An address carrying ``?bcc=`` / ``?body=`` would silently copy a third party."""
    mangled = _bio(email="someone@example.com?bcc=attacker@evil.example&body=hi")

    result = _regenerate(client, fake_openai, mangled, _bio())

    assert result["email"] == ORIGINAL_EMAIL
    assert "bcc" not in json.dumps(result)


def test_lookalike_address_is_discarded(client, fake_openai):
    """A near-miss is the realistic failure -- it survives a human glance at the page."""
    mangled = _bio(email="someone@examp1e.com")

    result = _regenerate(client, fake_openai, mangled, _bio())

    assert result["email"] == ORIGINAL_EMAIL


def test_fantasy_mode_cannot_rewrite_the_email(client, fake_openai):
    """Fantasy mode instructs transforming EVERY field, so it invites this most."""
    mangled = _bio(email="christopher.the.dataweaver@realms.of.data")

    result = _regenerate(client, fake_openai, mangled, _bio(), use_fantasy=True)

    assert result["email"] == ORIGINAL_EMAIL


# --- social_links -------------------------------------------------------------


def test_javascript_url_from_model_is_discarded(client, fake_openai):
    """The security case: a javascript: URL must never reach the client."""
    mangled = _bio({**ORIGINAL_SOCIAL_LINKS, "github": "javascript:alert(document.domain)"})

    result = _regenerate(client, fake_openai, mangled, _bio(ORIGINAL_SOCIAL_LINKS), use_fantasy=FANTASY["social_links"])

    assert result["social_links"]["github"] == ORIGINAL_SOCIAL_LINKS["github"]
    assert "javascript:" not in json.dumps(result["social_links"])


def test_every_scheme_the_model_invents_is_discarded(client, fake_openai):
    """data:, vbscript: and file: are equally unwelcome in an href."""
    mangled = _bio(
        {
            **ORIGINAL_SOCIAL_LINKS,
            "linkedin": "data:text/html,<script>alert(1)</script>",
            "telegram": "vbscript:msgbox(1)",
            "spotify": "file:///etc/passwd",
        }
    )

    result = _regenerate(client, fake_openai, mangled, _bio(ORIGINAL_SOCIAL_LINKS), use_fantasy=FANTASY["social_links"])

    assert result["social_links"] == ORIGINAL_SOCIAL_LINKS


def test_plausible_lookalike_urls_are_discarded(client, fake_openai):
    """The functional case, and the likelier one.

    The `about` prompt says to rewrite EVERY text field, so an obedient model
    rewrites the URLs too -- into plausible https look-alikes that no scheme
    allowlist would reject. This is what silently breaks the owner's own links.
    """
    mangled = _bio(
        {
            **ORIGINAL_SOCIAL_LINKS,
            "github": "https://github.com/lookalike-example",
            "linkedin": "https://www.linkedin.com/in/lookalike-example/",
            "hoobe": "https://hoo.be/lookalike-example",
        }
    )

    result = _regenerate(client, fake_openai, mangled, _bio(ORIGINAL_SOCIAL_LINKS), use_fantasy=FANTASY["social_links"])

    assert result["social_links"] == ORIGINAL_SOCIAL_LINKS


def test_model_cannot_add_new_link_keys(client, fake_openai):
    """A key absent from the input must not appear in the output."""
    mangled = _bio({**ORIGINAL_SOCIAL_LINKS, "payments": "https://not-chris.example/pay"})

    result = _regenerate(client, fake_openai, mangled, _bio(ORIGINAL_SOCIAL_LINKS), use_fantasy=FANTASY["social_links"])

    assert "payments" not in result["social_links"]
    assert result["social_links"] == ORIGINAL_SOCIAL_LINKS


def test_model_cannot_drop_links_entirely(client, fake_openai):
    """Omitting social_links must restore them, not leave the client without."""
    result = _regenerate(client, fake_openai, _bio(), _bio(ORIGINAL_SOCIAL_LINKS), use_fantasy=FANTASY["social_links"])

    assert result["social_links"] == ORIGINAL_SOCIAL_LINKS


def test_non_dict_model_output_is_refused_rather_than_returned(client, fake_openai):
    """A JSON array parses fine but is not a section.

    This used to assert a 200, with the array standing in for the bio -- a blank
    section arriving from a response the server called a success (#105). The
    shape check now refuses it, and since `about` was the only section requested
    the request fails cleanly. Still no traceback, which is what this test has
    always been guarding.
    """
    with patch("api.index.openai_client", fake_openai(content=["unexpected", "shape"])):
        response = client.post(
            "/api/regenerate",
            json={"sections": {"about": _bio(ORIGINAL_SOCIAL_LINKS)}},
        )

    assert response.status_code == 500
    body = response.get_json()
    assert body["success"] is False
    assert body["failed_sections"] == ["about"]

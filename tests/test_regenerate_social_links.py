"""Unit tests for the ``social_links`` pin on ``/api/regenerate`` (issue #98).

The model is asked to rewrite the ``about`` payload, and that payload carries
``social_links`` -- a nested object of URL strings. The ``about`` prompt tells
the model to rewrite EVERY text field with no carve-out for links, so the model
is free to return whatever it likes there. Whatever comes back is handed to the
client, which renders those values straight into ``<a href>``.

The pin restores ``social_links`` from the caller-supplied input after parsing,
so the model cannot author URLs at all.

These tests fabricate the model response rather than calling OpenAI. That is
deliberate and stronger than an end-to-end run: it proves the property holds for
ANY model output, including outputs a live call would not happen to produce.
No network access occurs and no API key is required.
"""

import json
from unittest.mock import MagicMock, patch

ORIGINAL_SOCIAL_LINKS = {
    "github": "https://github.com/chrisrogers37/",
    "hoobe": "https://hoo.be/crog",
    "spotify": "https://open.spotify.com/artist/0UotSScPTiSFPmbmjam2jn",
    "linkedin": "https://www.linkedin.com/in/chrisrogers37/",
    "telegram": "https://t.me/crogcrogcrog",
    "instagram_personal": "https://instagram.com/cr0g",
    "instagram_music": "https://instagram.com/crogmusic",
}


def _bio(social_links=None):
    """A realistic ``about`` payload, shaped like frontend/public/content/bio.yaml."""
    payload = {
        "display_name": "Christopher Rogers",
        "email": "someone@example.com",
        "location": "New York City, New York",
        "about_text": "original bio prose",
        "welcome_message": "hey there!",
    }
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


def _regenerate(client, model_returns, content, section="about"):
    with _with_model_returning(model_returns):
        response = client.post(
            "/api/regenerate",
            json={"sections": {section: content}},
        )
    assert response.status_code == 200, response.get_data(as_text=True)
    return response.get_json()["content"][section]


def test_javascript_url_from_model_is_discarded(client):
    """The security case: a javascript: URL must never reach the client."""
    mangled = _bio(
        {**ORIGINAL_SOCIAL_LINKS, "github": "javascript:alert(document.domain)"}
    )

    result = _regenerate(client, mangled, _bio(ORIGINAL_SOCIAL_LINKS))

    assert result["social_links"]["github"] == ORIGINAL_SOCIAL_LINKS["github"]
    assert "javascript:" not in json.dumps(result["social_links"])


def test_every_scheme_the_model_invents_is_discarded(client):
    """data:, vbscript: and file: are equally unwelcome in an href."""
    mangled = _bio(
        {
            **ORIGINAL_SOCIAL_LINKS,
            "linkedin": "data:text/html,<script>alert(1)</script>",
            "telegram": "vbscript:msgbox(1)",
            "spotify": "file:///etc/passwd",
        }
    )

    result = _regenerate(client, mangled, _bio(ORIGINAL_SOCIAL_LINKS))

    assert result["social_links"] == ORIGINAL_SOCIAL_LINKS


def test_plausible_lookalike_urls_are_discarded(client):
    """The functional case, and the likelier one.

    The `about` prompt says to rewrite EVERY text field, so an obedient model
    rewrites the URLs too -- into plausible https look-alikes that no scheme
    allowlist would reject. This is what silently breaks the owner's own links.
    """
    mangled = _bio(
        {
            **ORIGINAL_SOCIAL_LINKS,
            "github": "https://github.com/christopher-rogers",
            "linkedin": "https://www.linkedin.com/in/christopher-t-rogers/",
            "hoobe": "https://hoo.be/christopherrogers",
        }
    )

    result = _regenerate(client, mangled, _bio(ORIGINAL_SOCIAL_LINKS))

    assert result["social_links"] == ORIGINAL_SOCIAL_LINKS


def test_model_cannot_add_new_link_keys(client):
    """A key absent from the input must not appear in the output."""
    mangled = _bio(
        {**ORIGINAL_SOCIAL_LINKS, "payments": "https://not-chris.example/pay"}
    )

    result = _regenerate(client, mangled, _bio(ORIGINAL_SOCIAL_LINKS))

    assert "payments" not in result["social_links"]
    assert result["social_links"] == ORIGINAL_SOCIAL_LINKS


def test_model_cannot_drop_links_entirely(client):
    """Omitting social_links must restore them, not leave the client without."""
    result = _regenerate(client, _bio(), _bio(ORIGINAL_SOCIAL_LINKS))

    assert result["social_links"] == ORIGINAL_SOCIAL_LINKS


def test_prose_rewrites_still_pass_through(client):
    """The pin must not over-reach: rewriting prose is the whole feature."""
    rewritten = _bio(ORIGINAL_SOCIAL_LINKS)
    rewritten["about_text"] = "a completely rewritten biography"
    rewritten["display_name"] = "Chris T. Rogers"

    result = _regenerate(client, rewritten, _bio(ORIGINAL_SOCIAL_LINKS))

    assert result["about_text"] == "a completely rewritten biography"
    assert result["display_name"] == "Chris T. Rogers"
    assert result["social_links"] == ORIGINAL_SOCIAL_LINKS


def test_input_without_social_links_is_not_synthesised(client):
    """No input links means nothing to pin -- and nothing invented either."""
    result = _regenerate(client, _bio({"github": "javascript:alert(1)"}), _bio())

    assert "social_links" not in result or result["social_links"] == {}


def test_portfolio_section_is_untouched(client):
    """The pin is scoped to `about`; portfolio carries no social_links."""
    portfolio = {"experience": [{"title": "Engineer"}], "education": []}
    rewritten = {"experience": [{"title": "Senior Engineer"}], "education": []}

    result = _regenerate(client, rewritten, portfolio, section="portfolio")

    assert result == rewritten


def test_non_dict_model_output_does_not_crash(client):
    """A JSON array parses fine but has no keys to pin; must not 500."""
    with _with_model_returning(["unexpected", "shape"]):
        response = client.post(
            "/api/regenerate",
            json={"sections": {"about": _bio(ORIGINAL_SOCIAL_LINKS)}},
        )

    assert response.status_code == 200

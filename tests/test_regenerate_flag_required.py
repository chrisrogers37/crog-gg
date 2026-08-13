"""`use_fantasy` is required rather than defaulted (#160).

The flag selects between two materially different products: with it, the
rewrite is sent through `_fantasy_addition_for` and `_variation_directive` and
comes back in one of the lore registers; without it, the rewrite is a plain
restatement that keeps the sentence skeleton and does not rename anyone.

It used to be `data.get("use_fantasy", False)`, so a request that lost the key
silently got the plain path. Measured against production, that output is a
near-identical paraphrase of the input -- which is indistinguishable, to the
person who pressed the button, from the button not working. That is the exact
report this came from.

Rejecting rather than defaulting follows the decision this route already made
for `section` (#89): an input the caller did not supply must not fall through
to a permissive default prompt. Both directions of a default are silently
wrong -- defaulting true overrides a caller who wanted the plain rewrite,
defaulting false reproduces the bug -- and only rejection has no silent-wrong
direction.

``openai_client`` is patched throughout: none of these should reach the model,
and a test that did would be asserting the wrong thing.
"""

from unittest.mock import MagicMock, patch

import pytest


def _working_fake():
    """A fake whose response parses, so a test that reaches the model fails on
    its own assertion rather than crashing on the mock."""
    fake = MagicMock()
    resp = MagicMock()
    resp.choices = [MagicMock()]
    resp.choices[0].message.content = '{"about_text": "rewritten"}'
    fake.chat.completions.create.return_value = resp
    return fake


def _bio():
    return {"about_text": "a bit about me...", "display_name": "Chris Rogers"}


def _body(**overrides):
    body = {"sections": {"about": _bio()}}
    body.update(overrides)
    return body


@pytest.mark.parametrize(
    "payload, why",
    [
        pytest.param(_body(), "absent", id="absent"),
        pytest.param(_body(use_fantasy=None), "null", id="null"),
        pytest.param(_body(use_fantasy="true"), "a string", id="string-true"),
        pytest.param(_body(use_fantasy=1), "an int", id="int"),
    ],
)
def test_a_missing_or_non_boolean_flag_is_rejected(client, payload, why):
    """Reject, rather than pick a product behaviour on the caller's behalf.

    `"true"` and `1` are included because both are truthy in Python: under the
    old `data.get(...)` they would have selected the fantasy path while telling
    the caller nothing, and a caller sending a string is a caller with a bug.
    """
    fake = _working_fake()
    with patch("api.index.openai_client", fake):
        r = client.post("/api/regenerate", json=payload)

    assert r.status_code == 400, f"{why} was accepted"
    assert r.get_json()["error"] == "use_fantasy must be a boolean"
    assert not fake.chat.completions.create.called, (
        "the model was called for a request that should have been rejected "
        "before metering"
    )


@pytest.mark.parametrize("flag", [True, False])
def test_an_explicit_boolean_is_accepted(client, flag):
    """The control. Without this, the test above would also pass against a
    route that rejected every request."""
    fake = _working_fake()
    with patch("api.index.openai_client", fake):
        r = client.post("/api/regenerate", json=_body(use_fantasy=flag))

    assert r.status_code == 200, r.get_json()
    assert fake.chat.completions.create.called


def test_the_rejection_happens_before_the_cooldown_is_started(client):
    """A refused request must not spend the caller's 30 seconds.

    Same ordering the route already applies to an invalid section: validate,
    then meter. Getting this backwards would make a caller with a malformed
    body wait out a cooldown for a press that never ran.
    """
    with patch("api.index.openai_client", _working_fake()):
        first = client.post("/api/regenerate", json=_body())
        assert first.status_code == 400

    with patch("api.index.openai_client", _working_fake()):
        second = client.post("/api/regenerate", json=_body(use_fantasy=True))

    assert second.status_code == 200, (
        "the rejected request started a cooldown, so a malformed body costs "
        "the caller a real press"
    )

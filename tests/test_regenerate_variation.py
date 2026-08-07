"""SUMMON NEW LORE variation -- what moves between presses and what does not.

The button feeds its own output back in: the client sends the CURRENT content, so
press N rewrites press N-1. Two consequences pull in opposite directions, and this
module covers the second.

The first is length, which compounds; ``_LENGTH_ANCHOR`` bounds it (#134).

The second is sameness. The fantasy block named one source register and three
worked mappings, so every press aimed at the same destination -- and a second pass
over already-epic prose has nowhere left to climb, so it lands on paraphrase. A
faithful paraphrase is indistinguishable from a no-op to the person pressing the
button, which is how a working rewrite got read as "it reprinted the same copy".

Asserted here is the half the server owns: which register is sampled, that one
press is one register across every section, that it genuinely differs press to
press, and that the pinned destinations are gone. Whether the model then writes a
good sea shanty is not assertable from here and is not claimed -- the same standing
the length anchor has, which pins delivery rather than compliance.

The fake OpenAI client is built locally rather than shared, matching the other
test_regenerate_* modules; see test_regenerate_failure_reporting.py for why that
consolidation is deferred rather than absent.
"""

from unittest.mock import MagicMock, patch

import pytest

from api.index import _LORE_REGISTERS


def _press(client, sections=None, use_fantasy=True):
    """One press of the button. Returns the prompts delivered to the model."""
    fake = MagicMock()
    resp = MagicMock()
    resp.choices = [MagicMock()]
    resp.choices[0].message.content = '{"bio": "rewritten"}'
    fake.chat.completions.create.return_value = resp

    with patch("api.index.openai_client", fake):
        client.post(
            "/api/regenerate",
            json={
                "sections": sections or {"about": {"bio": "hi"}},
                "use_fantasy": use_fantasy,
            },
        )
    return [
        {
            "system": c.kwargs["messages"][0]["content"],
            "user": c.kwargs["messages"][1]["content"],
        }
        for c in fake.chat.completions.create.call_args_list
    ]


def _register_in(user_prompt):
    """The register a delivered prompt names, or None."""
    return next((r for r in _LORE_REGISTERS if r in user_prompt), None)


@pytest.mark.parametrize("use_fantasy", [True, False])
def test_both_anchors_ride_every_section_in_both_modes(client, use_fantasy):
    """Length and facts are pinned on the system prompt, independent of the mode.

    Independence is the whole reason turning variation up is safe: on the old
    prompt one dial moved both, so wilder bought longer on every press. These two
    ride the unconditional system concatenation and the wildness dial rides
    ``format``, which is what keeps them separable -- and what would break first
    if a later change moved either behind ``use_fantasy``.
    """
    prompts = _press(client, {"about": {"bio": "hi"}, "portfolio": {"experience": []}}, use_fantasy)
    assert len(prompts) == 2, f"expected one call per section, got {len(prompts)}"
    for p in prompts:
        assert "Two things are fixed" in p["system"]
        assert "never the person it is about" in p["system"]
        assert "must not be longer than the content provided" in p["system"]
        assert "do not expand it" in p["system"].lower()


def test_one_press_is_one_register(client):
    """Every section of a single press lands in the same world.

    Sampled per section instead, one press could open `about` as a sea shanty and
    `portfolio` as a stat block -- which reads as broken rather than wild.
    """
    prompts = _press(client, {"about": {"bio": "hi"}, "portfolio": {"experience": []}})
    registers = {_register_in(p["user"]) for p in prompts}
    assert len(registers) == 1, f"one press delivered {len(registers)} registers: {registers}"
    assert registers.pop() is not None, "no register reached the model"


def test_the_register_changes_between_presses(client):
    """The dial actually turns -- the one property separating the fix from the defect.

    Sampling server-side rather than asking the model to vary is what makes this
    assertable, and it has to be: this model rejects an explicit temperature
    outright, so there is no sampling knob to lean on.

    A constant register is caught at two presses; the extra ten buy false-failure
    headroom only, at 16^-11 for a sampler that is working.
    """
    seen = {_register_in(_press(client)[0]["user"]) for _ in range(12)}
    assert None not in seen, "a press delivered no register"
    assert len(seen) > 1, f"the register never changed across 12 presses: {seen}"


def test_a_plain_rewrite_gets_no_register(client):
    """The wildness dial belongs to SUMMON, not to every rewrite."""
    prompts = _press(client, use_fantasy=False)
    assert _register_in(prompts[0]["user"]) is None
    assert "TELL IT AS" not in prompts[0]["user"]


def test_the_worked_examples_are_gone(client):
    """Regression guard on the defect itself.

    A worked example is an attractor: handed the same one every call, the model
    returns it, and then finds it already in the text on the next press. Re-adding
    one re-pins the destination and the button goes quiet again -- a failure no
    length or shape assertion would catch.
    """
    user = _press(client)[0]["user"]
    for attractor in (
        "Great Archives of Knowledge",
        "Ancient Orchestrator of Realms",
        "Serpent's Tongue of Command",
        "Christopher the Dataweaver",
        "Christopher T. Rogers",
    ):
        assert attractor not in user, f"worked example back in the prompt: {attractor}"


def test_the_prompt_stops_asking_for_invented_dates(client):
    """`Keep all numerical metrics exactly the same` used to sit in the same prompt
    as `Rewrite school names, degrees, and years`. Under a stated split, years are
    facts. A contradiction is not a stated split -- it is two defaults fighting.
    """
    user = _press(client, {"portfolio": {"experience": []}})[0]["user"]
    assert "keep every year exactly as given" in user
    assert "keep every period exactly as given" in user
    assert "Rewrite school names, degrees, and years" not in user

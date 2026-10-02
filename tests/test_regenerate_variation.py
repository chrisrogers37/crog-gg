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

The standing constraints live here too, for the property they share with the
register rather than with each other: each one either rides the unconditional
system concatenation or it rides ``format``, and that choice is the whole
difference between a rule that holds on every press and one that holds on some of
them. Two of them (#160) were measured failing on BOTH paths at once, which is the
signature of a rule that reaches the model on neither -- so every anchor test below
is parametrized over both modes on purpose. A fantasy-only assertion passes for an
anchor that has been quietly moved behind ``use_fantasy``, which is the exact
regression these exist to catch.

The fake OpenAI client is built locally rather than shared, matching the other
test_regenerate_* modules; see test_regenerate_failure_reporting.py for why that
consolidation is deferred rather than absent.
"""

from unittest.mock import MagicMock, patch

import pytest

from api._lib.prompts import _LORE_REGISTERS, _VERBATIM_STRINGS, _tone_anchor
from api._lib.site_config import CONFIG
from api.index import _lost_paragraphs, _lost_verbatim


def _press(client, sections=None, use_fantasy=True):
    """One press of the button. Returns the prompts delivered to the model."""
    fake = MagicMock()
    resp = MagicMock()
    resp.choices = [MagicMock()]
    resp.choices[0].message.content = '{"bio": "rewritten"}'
    fake.chat.completions.create.return_value = resp

    # use_fantasy=None means OMIT the key. A third case, and not the same as
    # sending False -- it is the one the server's default decides, and the one
    # no caller ever asks for.
    payload = {"sections": sections or {"about": {"bio": "hi"}}}
    if use_fantasy is not None:
        payload["use_fantasy"] = use_fantasy

    with patch("api.index.openai_client", fake):
        client.post(
            "/api/regenerate",
            json=payload,
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
def test_every_standing_constraint_rides_every_section_in_both_modes(client, use_fantasy):
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
        assert "Preserve the paragraph structure" in p["system"]
        assert "never rename the interface" in p["system"]
        # site.yaml's style rules, each word for word (#189).
        for rule in CONFIG.style_rules:
            assert rule in p["system"]


def test_the_style_rules_reach_the_model_at_all(client):
    """The rule existed only as a repo instruction, so the model never saw it.

    "NEVER use em-dashes" is a house rule in CLAUDE.md, which is addressed to the
    people and agents editing this repo. The model that writes the copy reads the
    system prompt, and nothing in it said so. "The tone constraints are not
    surviving into the fantasy prompt" therefore understates it: there was no tone
    constraint on either path to survive.

    The measured distribution said the same thing -- 2 of 6 fantasy presses and 1
    of 5 plain -- where a rule dropped on one path would have shown 0 on the other.
    Both modes are parametrized here for exactly that reason: a fantasy-only
    assertion passes for a rule that has been moved behind ``use_fantasy``, which
    is the shape this was first mistaken for.

    Delivery, not compliance. That the instruction is in front of the model, not
    that the model obeys it -- obedience is only observable against the live
    endpoint, and the em dash rate there is the acceptance test, not this.

    The rules are site.yaml's now (#189): the owner's is the em dash rule, the
    tests' site has one of its own.
    """
    assert CONFIG.style_rules, "the tests' site.yaml names a style rule to check"
    system = _press(client)[0]["system"]
    for rule in CONFIG.style_rules:
        assert " " + rule in system


def test_no_style_rules_add_no_tone_anchor():
    """A site with no style rules asks for nothing extra, not an empty clause;
    each rule rides as written, in order."""
    assert _tone_anchor(()) == ""
    assert _tone_anchor(("Be brief.", "Be kind.")) == " Be brief. Be kind."


def test_a_they_persona_reads_grammatically(client):
    """The tests' site writes its persona as they/them (#189)."""
    assert CONFIG.pronouns["subj"] == "they"
    system = _press(client)[0]["system"]
    assert "the work they actually do, the field they do it in" in system
    assert "the places they have lived and worked" in system
    assert "Rename their employers, their tools and their craft" in system
    assert any("a merchant who owes them a favour" in register for register in _LORE_REGISTERS)


def test_the_paragraph_rule_survives_the_press_it_has_to_survive(client):
    """about_text is authored as paragraphs and rewritten wholesale on every press.

    The client renders it under ``white-space: pre-line``, so the blank lines in
    the YAML are the paragraph breaks on the page. The rewrite returns a fresh
    string: with nothing asking for the structure back, press one flattens it to a
    wall and no later press restores it, because the flattened copy is what the
    next press is handed. The content fix is undone by the first press without
    this, which is what makes this the load-bearing half of that change.
    """
    system = _press(client)[0]["system"]
    assert "Preserve the paragraph structure" in system
    assert "same number of paragraphs" in system
    assert "real newline characters inside the JSON string" in system


def test_the_button_cannot_be_renamed_by_the_lore_that_names_it(client):
    """The last line of the About copy tells the reader which control to press.

    A rewrite that renames SUMMON NEW LORE in the world of the telling has obeyed
    every other constraint in this module and still broken the page: the sentence
    now points at a control that does not exist. This is the one string in the
    copy that is interface rather than prose, and the registers are otherwise
    encouraged to rename everything they touch.
    """
    system = _press(client)[0]["system"]
    assert _VERBATIM_STRINGS, "the protected-string table is empty"
    for verbatim in _VERBATIM_STRINGS:
        assert verbatim in system, f"{verbatim!r} is never shown to the model"
    # The tests' site's own button, from its site.yaml (#189).
    assert repr(CONFIG.button_label) in system
    assert "character for character" in system
    assert "never rename the interface" in system


def test_the_new_guards_do_not_contradict_the_freedoms_beside_them(client):
    """Structure and typography are pinned; the register is still free.

    _FACT_ANCHOR hands the model genre, register, voice and rhythm on purpose, and
    a guard broad enough to reach those would flatten the variation the button
    exists to produce -- a lowercase rule, say, contradicts every register that
    opens on a spoken address. Pinning the overreach here means widening one of
    these later has to fail a test rather than quietly cost the feature.
    """
    system = _press(client)[0]["system"]
    assert "FREE: genre, register, imagery, narrative voice" in system
    assert "Which form the telling takes is yours to choose" in system
    for overreach in ("lowercase", "sentence length", "do not use metaphor", "keep it formal"):
        assert overreach not in system, f"a guard reached into the register: {overreach}"


def test_a_press_that_loses_the_flag_still_gets_the_button_it_pressed(client):
    """A missing use_fantasy must not select the path that looks like a no-op.

    The plain rewrite keeps the sentence skeleton and leaves display_name alone,
    so a visitor cannot tell it from the button doing nothing -- and the server
    used to choose it for any request arriving without the key. Nothing raises on
    that path, so there is no signal anywhere: not for the visitor, not in the
    logs. The only shipped caller always sends True, so a request without the key
    is one that LOST it, never one asking for plain.
    """
    prompts = _press(client, sections={"about": {"bio": "hi"}}, use_fantasy=None)
    assert _register_in(prompts[0]["user"]) is not None, "a flagless press fell through to the plain rewrite"
    assert "TELL IT AS" in prompts[0]["user"]


def test_plain_is_still_reachable_by_asking_for_it(client):
    """The default moved; the path did not disappear.

    Paired with the test above deliberately: "absent means fantasy" is only right
    while "False means plain" still holds. Making the flag unreadable altogether
    would satisfy that test on its own, and this is what says so.
    """
    prompts = _press(client, use_fantasy=False)
    assert _register_in(prompts[0]["user"]) is None
    assert "TELL IT AS" not in prompts[0]["user"]


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
        # The same worked example, for whoever the tests' site is about.
        *(f"{name} the Dataweaver" for name in CONFIG.name_variants),
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


# ---------------------------------------------------------------------------
# The measurement half. A prompt cannot guarantee either property, so the server
# counts what came back -- see the helpers for why this is a warning and not a
# rejection.
# ---------------------------------------------------------------------------


def test_a_flattened_field_is_detected():
    """Several paragraphs in, one block out: the loss _SHAPE_ANCHOR asks against."""
    assert _lost_paragraphs({"about_text": "one.\n\ntwo."}, {"about_text": "one. two."}) == ["about_text"]


def test_structure_that_survived_is_not_reported():
    """The positive control. A detector that fires on everything counts nothing."""
    assert _lost_paragraphs({"about_text": "one.\n\ntwo."}, {"about_text": "ONE.\n\nTWO."}) == []


def test_a_field_that_was_never_multi_paragraph_cannot_lose_paragraphs():
    """The wall of text this all started from must not report itself as a loss."""
    assert _lost_paragraphs({"about_text": "one long line."}, {"about_text": "another long line."}) == []


def test_a_renamed_control_is_detected():
    sent = {"about_text": f"smash the {_VERBATIM_STRINGS[0]} button."}
    assert _lost_verbatim(sent, {"about_text": "smash the Rune of Summoning."}) == [
        f"about_text:{_VERBATIM_STRINGS[0]}"
    ]


def test_a_control_that_survived_is_not_reported():
    """Positive control again, and the case every ordinary press should hit."""
    sent = {"about_text": f"smash the {_VERBATIM_STRINGS[0]} button."}
    assert _lost_verbatim(sent, {"about_text": f"press the {_VERBATIM_STRINGS[0]} rune."}) == []


def test_a_control_absent_from_the_input_is_not_expected_back():
    """Only what was sent is owed back. Otherwise every portfolio press reports a loss."""
    assert _lost_verbatim({"bio": "no controls here."}, {"bio": "still none."}) == []


def test_the_name_rule_names_the_sites_own_names(client):
    # The rewritten name keeps one of site.yaml's name variants, not the
    # owner's (#189 M06).
    prompts = _press(client)[0]
    rule = " or ".join(f"'{name}'" for name in CONFIG.name_variants)
    assert f"still contains {rule}" in prompts["system"] + prompts["user"]

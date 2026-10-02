"""site_config: the API's reading of site.yaml (#189).

The tests run on site.example (conftest.py sets SITE_DIR), and break copies of
its site.yaml. The owner's own site/site.yaml is only loaded, never read for
its values, since the function ships with it and a fork's edits to it must
not turn these red (#191).
"""

import json
from fnmatch import fnmatch
from pathlib import Path

import pytest

from api._lib import site_config
from api._lib.site_config import REPO_ROOT, SiteConfigError, load

OWNER_SITE = REPO_ROOT / "site" / "site.yaml"
FIXTURE = REPO_ROOT / "site.example" / "site.yaml"


def _with(tmp_path: Path, old: str, new: str) -> Path:
    """site.example's site.yaml with one edit, as a file to load."""
    text = FIXTURE.read_text(encoding="utf-8")
    assert old in text, f"{old!r} isn't in {FIXTURE}"
    path = tmp_path / "site.yaml"
    path.write_text(text.replace(old, new, 1), encoding="utf-8")
    return path


def test_the_shipped_site_yaml_loads():
    config = load(OWNER_SITE)
    assert config.site_url in config.cors_origins
    assert config.allows(config.github_owner)
    assert config.button_label and config.name_variants


def test_the_tests_site_is_the_fixture():
    assert site_config.PATH.parent.name == "site.example"
    assert site_config.CONFIG.github_owner == "octocat"


def test_the_function_ships_with_the_file_it_reads():
    # Vercel bundles what the function imports; a data file only through
    # includeFiles. Without it, every /api route fails at import.
    vercel = json.loads((REPO_ROOT / "vercel.json").read_text(encoding="utf-8"))
    assert fnmatch("site/site.yaml", vercel["functions"]["api/index.py"]["includeFiles"])


def test_a_missing_file_says_where_vercel_needs_it(tmp_path):
    with pytest.raises(SiteConfigError, match="includeFiles"):
        load(tmp_path / "nowhere.yaml")


def test_a_missing_key_is_named(tmp_path):
    path = _with(tmp_path, "    button: ASK AGAIN\n", "")
    with pytest.raises(SiteConfigError, match=r"regenerate\.labels\.button is missing"):
        load(path)


def test_the_name_rule_needs_a_name(tmp_path):
    path = _with(tmp_path, "    name_variants:\n      - Ada\n", "    name_variants: []\n")
    with pytest.raises(SiteConfigError, match=r"name_variants must name at least one"):
        load(path)


def test_pronouns_are_ones_the_prompt_can_write(tmp_path):
    path = _with(tmp_path, "    pronouns: they\n", "    pronouns: xe\n")
    with pytest.raises(SiteConfigError, match=r"pronouns must be one of he, she, they"):
        load(path)


def test_pronouns_default_to_they(tmp_path):
    path = _with(tmp_path, "    pronouns: they\n", "")
    assert load(path).pronouns["subj"] == "they"


def test_the_owner_must_be_a_github_name(tmp_path):
    for name in ("not/a name", "josé", "x" * 40):
        path = _with(tmp_path, "  username: octocat\n", f"  username: {name}\n")
        with pytest.raises(SiteConfigError, match=r"github\.username must be a GitHub username"):
            load(path)


def test_the_allowed_owners_are_the_username_and_the_extras_lower_cased(tmp_path):
    path = _with(
        tmp_path,
        "  username: octocat\n",
        "  username: OctoCat\n  allowed_owners: [Some-Org]\n",
    )
    config = load(path)
    assert config.github_owner == "OctoCat"
    assert config.allowed_owners == frozenset({"octocat", "some-org"})
    assert config.allows("SOME-ORG") and not config.allows("someone-else")


def test_an_extra_owner_must_be_a_github_name_too(tmp_path):
    path = _with(
        tmp_path,
        "  username: octocat\n",
        "  username: octocat\n  allowed_owners: [not/a name]\n",
    )
    with pytest.raises(SiteConfigError, match=r"github\.allowed_owners\.0 must be a GitHub username"):
        load(path)


def test_style_rules_are_optional(tmp_path):
    path = _with(tmp_path, "  style_rules:\n    - Keep every sentence short.\n", "")
    assert load(path).style_rules == ()


def test_on_and_off_are_text_as_the_frontend_reads_them(tmp_path):
    # PyYAML's default (YAML 1.1) reads on, off, yes and no as booleans;
    # js-yaml, which builds the page, reads them as text (#189).
    path = _with(tmp_path, "    button: ASK AGAIN\n", "    button: off\n")
    assert load(path).button_label == "off"


def test_true_is_still_a_boolean(tmp_path):
    path = _with(tmp_path, "    button: ASK AGAIN\n", "    button: true\n")
    with pytest.raises(SiteConfigError, match=r"regenerate\.labels\.button must be text"):
        load(path)


def test_features_default_to_auto():
    config = load(FIXTURE)
    assert (config.regenerate_mode, config.github_mode) == ("auto", "auto")


def test_a_feature_mode_must_be_one_the_api_knows(tmp_path):
    path = _with(tmp_path, "\nregenerate:\n", "\nfeatures:\n  github: sometimes\nregenerate:\n")
    with pytest.raises(SiteConfigError, match=r"features\.github must be one of auto, on, off"):
        load(path)


def test_off_and_on_set_a_feature_as_written(tmp_path):
    # Unquoted, as a fork writes them: PyYAML's YAML 1.1 default read off as
    # False, which counted as unset, so regeneration stayed on.
    path = _with(tmp_path, "\nregenerate:\n", "\nfeatures:\n  regenerate: off\n  github: on\nregenerate:\n")
    config = load(path)
    assert (config.regenerate_mode, config.github_mode) == ("off", "on")


def test_a_mode_of_false_is_a_mistake_not_auto(tmp_path):
    # schema.ts rejects it too: "off" is the word (#243's review).
    path = _with(tmp_path, "\nregenerate:\n", "\nfeatures:\n  regenerate: false\nregenerate:\n")
    with pytest.raises(SiteConfigError, match=r"features\.regenerate must be one of auto, on, off"):
        load(path)

"""site_config: the API's reading of site.yaml (#189).

The tests run on site.example (conftest.py sets SITE_DIR); these also load the
owner's site/site.yaml, since the function ships with that one.
"""

import json
from fnmatch import fnmatch
from pathlib import Path

import pytest

from api._lib import site_config
from api._lib.site_config import REPO_ROOT, SiteConfigError, load

OWNER_SITE = REPO_ROOT / "site" / "site.yaml"


def _write(tmp_path: Path, text: str) -> Path:
    path = tmp_path / "site.yaml"
    path.write_text(text, encoding="utf-8")
    return path


def _with(base: Path, tmp_path: Path, old: str, new: str) -> Path:
    text = base.read_text(encoding="utf-8")
    assert old in text, f"{old!r} isn't in {base}"
    return _write(tmp_path, text.replace(old, new, 1))


def test_the_owners_site_yaml_loads(monkeypatch):
    monkeypatch.delenv("GITHUB_OWNER", raising=False)
    config = load(OWNER_SITE)
    assert config.site_url == "https://www.crog.gg"
    # The apex 308s to www, but a browser on it may still call the API.
    assert set(config.cors_origins) == {"https://www.crog.gg", "https://crog.gg"}
    assert config.github_owner == "chrisrogers37"
    assert config.button_label == "SUMMON NEW LORE"
    assert config.name_variants == ("Christopher", "Chris")
    assert config.pronouns["subj"] == "he"
    assert config.style_rules and "—" in config.style_rules[0]


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
    path = _with(OWNER_SITE, tmp_path, "    button: SUMMON NEW LORE\n", "")
    with pytest.raises(SiteConfigError, match=r"regenerate\.labels\.button is missing"):
        load(path)


def test_the_name_rule_needs_a_name(tmp_path):
    path = _with(
        OWNER_SITE,
        tmp_path,
        "    name_variants:\n      - Christopher\n      - Chris\n",
        "    name_variants: []\n",
    )
    with pytest.raises(SiteConfigError, match=r"name_variants must name at least one"):
        load(path)


def test_pronouns_are_ones_the_prompt_can_write(tmp_path):
    path = _with(OWNER_SITE, tmp_path, "    pronouns: he\n", "    pronouns: xe\n")
    with pytest.raises(SiteConfigError, match=r"pronouns must be one of he, she, they"):
        load(path)


def test_the_owner_must_be_a_github_name(tmp_path):
    path = _with(OWNER_SITE, tmp_path, "  username: chrisrogers37\n", "  username: not/a name\n")
    with pytest.raises(SiteConfigError, match=r"github\.username must be a GitHub username"):
        load(path)


def test_github_owner_env_wins(monkeypatch):
    monkeypatch.setenv("GITHUB_OWNER", "someone-else")
    config = load(OWNER_SITE)
    assert config.github_owner == "someone-else"
    assert config.allowed_owners == frozenset({"someone-else"})

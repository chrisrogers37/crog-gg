"""Who the site is, for the API (#189): the same site/site.yaml the frontend reads.

The frontend checks the file's whole shape when it builds (frontend/src/config/
schema.ts). This reads only the keys the API uses, and names the key when one
is missing or wrong, so a bad file fails the function at import with a reason
rather than a KeyError somewhere later.
"""

import os
import re
from dataclasses import dataclass
from pathlib import Path
from types import MappingProxyType
from typing import Any, Mapping

import yaml

REPO_ROOT = Path(__file__).resolve().parents[2]

# SITE_DIR picks another site folder, as it does for the frontend (the tests
# use site.example, #191).
PATH = REPO_ROOT / (os.environ.get("SITE_DIR") or "site") / "site.yaml"

# The forms a prompt needs, by site.yaml's regenerate.persona.pronouns.
PRONOUN_FORMS = {
    "he": MappingProxyType({"subj": "he", "obj": "him", "pos": "his", "does": "does", "has": "has"}),
    "she": MappingProxyType({"subj": "she", "obj": "her", "pos": "her", "does": "does", "has": "has"}),
    "they": MappingProxyType({"subj": "they", "obj": "them", "pos": "their", "does": "do", "has": "have"}),
}

# What GitHub accepts as a username or organisation, as schema.ts's githubName.
# ASCII only, so nothing else lower-cases into an allowed owner's name.
GITHUB_NAME = re.compile(r"[A-Za-z0-9-]{1,39}")

_REQUIRED = object()


class _Loader(yaml.SafeLoader):
    """YAML as the frontend's js-yaml reads it (1.2): only true and false are
    booleans, so off, on, yes and no stay text, as a label or a mode says them."""


_Loader.yaml_implicit_resolvers = {
    first: [(tag, regexp) for tag, regexp in resolvers if tag != "tag:yaml.org,2002:bool"]
    for first, resolvers in yaml.SafeLoader.yaml_implicit_resolvers.items()
}
_Loader.add_implicit_resolver(
    "tag:yaml.org,2002:bool", re.compile(r"^(?:true|True|TRUE|false|False|FALSE)$"), list("tTfF")
)


class SiteConfigError(RuntimeError):
    """site.yaml is missing, or a key the API reads is missing or wrong."""


@dataclass(frozen=True)
class SiteConfig:
    site_url: str
    # The origins a browser may call the API from: site.url and its aliases.
    cors_origins: tuple[str, ...]
    # github.username: whose repos the one-segment proxy routes serve.
    github_owner: str
    # Owners whose public repos the proxy serves at all, lower-cased.
    allowed_owners: frozenset[str]
    # The regenerate button's label, which the rewrite must leave as it is.
    button_label: str
    # The rewrite keeps one of these in the name it writes.
    name_variants: tuple[str, ...]
    pronouns: Mapping[str, str]
    # Rules every rewrite is asked to keep, appended to the prompt.
    style_rules: tuple[str, ...]

    def allows(self, owner: str) -> bool:
        """Whether the proxy serves this owner's repos: a GitHub name that is
        github.username or one of github.allowed_owners, in any case. GitHub
        names are ASCII, so a look-alike that lower-cases into an allowed name
        (the Kelvin sign into "k") is refused."""
        return bool(GITHUB_NAME.fullmatch(owner)) and owner.lower() in self.allowed_owners


def _at(data: Any, key: str, source: Path, default: Any = _REQUIRED) -> Any:
    node = data
    for part in key.split("."):
        if not isinstance(node, dict) or part not in node:
            if default is _REQUIRED:
                raise SiteConfigError(f"{source}: {key} is missing")
            return default
        node = node[part]
    return node


def _text(data: Any, key: str, source: Path) -> str:
    value = _at(data, key, source)
    if not isinstance(value, str) or not value.strip():
        raise SiteConfigError(f"{source}: {key} must be text")
    return value


def _texts(data: Any, key: str, source: Path, *, required: bool) -> tuple[str, ...]:
    # Optional means absent, null or "", as schema.ts's optional() reads it.
    value = _at(data, key, source) if required else _at(data, key, source, None)
    if not required and value in (None, ""):
        return ()
    if not isinstance(value, list) or not all(isinstance(v, str) and v.strip() for v in value):
        raise SiteConfigError(f"{source}: {key} must be a list of text")
    if required and not value:
        raise SiteConfigError(f"{source}: {key} must name at least one")
    return tuple(value)


def _github_name(value: Any, key: str, source: Path) -> str:
    if not isinstance(value, str) or not GITHUB_NAME.fullmatch(value):
        raise SiteConfigError(f"{source}: {key} must be a GitHub username")
    return value


def load(path: Path = PATH) -> SiteConfig:
    """site.yaml's keys the API reads, checked; a SiteConfigError names the key."""
    try:
        data = yaml.load(path.read_text(encoding="utf-8"), Loader=_Loader)
    except FileNotFoundError as exc:
        # On Vercel the file reaches the function only through vercel.json's
        # functions.includeFiles.
        raise SiteConfigError(f"{path} not found; is it in vercel.json's functions.includeFiles?") from exc

    site_url = _text(data, "site.url", path)
    aliases = _texts(data, "site.aliases", path, required=False)

    owner = _github_name(_at(data, "github.username", path), "github.username", path)
    allowed = _texts(data, "github.allowed_owners", path, required=False)
    for index, extra in enumerate(allowed):
        _github_name(extra, f"github.allowed_owners.{index}", path)

    pronouns = _at(data, "regenerate.persona.pronouns", path, None) or "they"
    if pronouns not in PRONOUN_FORMS:
        raise SiteConfigError(f"{path}: regenerate.persona.pronouns must be one of {', '.join(PRONOUN_FORMS)}")

    return SiteConfig(
        site_url=site_url,
        cors_origins=(site_url, *aliases),
        github_owner=owner,
        allowed_owners=frozenset(name.lower() for name in (owner, *allowed)),
        button_label=_text(data, "regenerate.labels.button", path),
        name_variants=_texts(data, "regenerate.persona.name_variants", path, required=True),
        pronouns=PRONOUN_FORMS[pronouns],
        style_rules=_texts(data, "regenerate.style_rules", path, required=False),
    )


CONFIG = load()

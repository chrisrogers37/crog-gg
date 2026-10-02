"""Request-side helpers: who a request is from (a ``Visitor``, never the bare
address), GitHub headers, repo name validation."""

import hashlib
import hmac
import ipaddress
import logging
import os
import re
from dataclasses import dataclass

from flask import request

GITHUB_TOKEN = os.environ.get("GITHUB_TOKEN")
if not GITHUB_TOKEN:
    # Once per cold start. Without a token every proxy call shares GitHub's
    # unauthenticated quota, and the panels it feeds fail with nothing in the
    # log to say why.
    logging.getLogger("crog").warning("github token missing: proxy calls are unauthenticated (60/hour)")
IP_HASH_SALT = os.environ.get("IP_HASH_SALT", "")
if not IP_HASH_SALT:
    logging.getLogger("crog").warning(
        "ip hash salt missing: rate-limit keys and logs name visitors by address,"
        " and regenerate calls go without a safety_identifier"
    )
GITHUB_USERNAME = "chrisrogers37"
GITHUB_API = "https://api.github.com"
# The proxy's GitHub calls give up after this; the health check uses a shorter one.
GITHUB_TIMEOUT_SECONDS = 10

REPO_NAME_PATTERN = re.compile(r"^[a-zA-Z0-9._-]+$")
MAX_REPO_NAME_LENGTH = 100


def _client_ip() -> str:
    """The request's address. Private: handlers get a ``Visitor`` from
    ``current_visitor()`` instead, so none of them holds an address it could
    log (#199 M75).

    Vercel sets `x-real-ip` from its trusted edge after stripping client-
    supplied headers — this resolves the X-Forwarded-For spoofing issue
    that affected the old DO deployment.

    Falls back to X-Forwarded-For and remote_addr for local `vercel dev`.
    """
    real_ip = request.headers.get("x-real-ip")
    if real_ip:
        return real_ip
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.remote_addr or "unknown"


def _rate_limit_subject(ip: str) -> str:
    """What a per-visitor limit counts, for an address from ``_client_ip``.

    An IPv6 address counts as its /64, since one connection is usually handed
    a whole /64 and could otherwise rotate through it for fresh limits (#194
    M11). An IPv4 address, IPv4-mapped or not, counts as itself. Anything that
    doesn't parse is returned unchanged.
    """
    try:
        addr = ipaddress.ip_address(ip)
    except ValueError:
        return ip
    if addr.version == 4:
        return ip
    if addr.ipv4_mapped:
        return str(addr.ipv4_mapped)
    return str(ipaddress.ip_network((addr, 64), strict=False))


def client_tag(ip: str) -> str | None:
    """A stable name for a visitor that doesn't reveal their address: 16 hex
    characters of HMAC-SHA256 over ``_rate_limit_subject(ip)``, keyed by
    ``IP_HASH_SALT`` (#194 M12, #199 M75).

    None without a salt, because an unkeyed hash of an address is undone by
    hashing every address.
    """
    if not IP_HASH_SALT:
        return None
    return hmac.new(IP_HASH_SALT.encode(), _rate_limit_subject(ip).encode(), hashlib.sha256).hexdigest()[:16]


@dataclass(frozen=True)
class Visitor:
    """Who a request is from, without their address (#199 M75).

    ``id`` names the visitor in rate-limit keys and log lines: their ``tag``,
    so neither Redis nor the logs hold an address. Without a salt it falls back
    to what their limits count, the address, because limits have to keep
    working when the setting is missing (the warning above says so). ``tag``
    is what goes to OpenAI as ``safety_identifier``: None without a salt, so an
    address is never sent there.
    """

    id: str
    tag: str | None

    @classmethod
    def from_ip(cls, ip: str) -> "Visitor":
        tag = client_tag(ip)
        return cls(id=tag or _rate_limit_subject(ip), tag=tag)


def current_visitor() -> Visitor:
    """The visitor making this request. Handlers use this, never the address."""
    return Visitor.from_ip(_client_ip())


def github_headers() -> dict:
    headers = {
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "CYOC-Portfolio",
    }
    if GITHUB_TOKEN:
        headers["Authorization"] = f"token {GITHUB_TOKEN}"
    return headers


def validate_repo_name(repo_name: str) -> tuple[bool, str | None]:
    if not repo_name:
        return False, "Repository name cannot be empty"
    if len(repo_name) > MAX_REPO_NAME_LENGTH:
        return False, f"Repository name too long (max {MAX_REPO_NAME_LENGTH} characters)"
    if repo_name in (".", ".."):
        return False, "Invalid repository name"
    if repo_name.startswith("."):
        return False, "Repository name cannot start with a period"
    if not REPO_NAME_PATTERN.fullmatch(repo_name):
        return False, (
            "Repository name contains invalid characters " "(allowed: alphanumeric, hyphens, underscores, periods)"
        )
    return True, None

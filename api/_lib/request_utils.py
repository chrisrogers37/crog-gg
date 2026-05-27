"""Request-side helpers: client IP, GitHub headers, repo name validation."""

import os
import re

from flask import request

GITHUB_TOKEN = os.environ.get("GITHUB_TOKEN")
GITHUB_USERNAME = "chrisrogers37"
GITHUB_API = "https://api.github.com"

REPO_NAME_PATTERN = re.compile(r"^[a-zA-Z0-9._-]+$")
MAX_REPO_NAME_LENGTH = 100


def get_client_ip() -> str:
    """Vercel sets `x-real-ip` from its trusted edge after stripping client-
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
    if not REPO_NAME_PATTERN.match(repo_name):
        return False, (
            "Repository name contains invalid characters " "(allowed: alphanumeric, hyphens, underscores, periods)"
        )
    return True, None

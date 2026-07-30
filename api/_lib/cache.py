"""Small JSON key/value cache backed by Upstash Redis.

Separate from rate_limit.py: this is opportunistic response caching, not a
limiter. Like the rate-limit primitives, every operation falls open on a Redis
error — a cache miss or a silent no-op is always preferable to failing the
request when Upstash is unreachable.
"""

import json
from typing import Any

from . import redis_client


def get_json(key: str) -> Any | None:
    """Return the decoded JSON value stored at ``key``, or None on a miss, a
    decode error, or any Redis error (fall-open)."""
    try:
        raw = redis_client.command("GET", key)
    except Exception:
        return None
    if raw is None:
        return None
    try:
        return json.loads(raw)
    except (ValueError, TypeError):
        return None


def set_json(key: str, value: Any, ttl_seconds: int) -> None:
    """Store ``value`` as JSON at ``key`` with a TTL. Silently no-ops on error."""
    try:
        redis_client.command("SETEX", key, ttl_seconds, json.dumps(value))
    except Exception:
        pass

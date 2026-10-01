"""Small JSON key/value cache backed by Upstash Redis.

Separate from rate_limit.py: this is opportunistic response caching, not a
limiter. By default every operation falls open on a Redis error: a cache miss
or a silent no-op beats failing the request when Upstash is unreachable. A
caller whose miss costs more than a refusal passes ``raise_on_error`` (#194).
"""

import json
from typing import Any

from . import redis_client


def get_json(key: str, raise_on_error: bool = False) -> Any | None:
    """Return the decoded JSON value stored at ``key``, or None on a miss or a
    decode error. A Redis error reads as None too (fall-open), unless
    ``raise_on_error`` is set, when it raises instead."""
    try:
        raw = redis_client.command("GET", key)
    except Exception:
        if raise_on_error:
            raise
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

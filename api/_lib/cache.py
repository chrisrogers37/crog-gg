"""Small JSON key/value cache backed by Upstash Redis.

Separate from rate_limit.py: this is opportunistic response caching, not a
limiter. A write falls open on a Redis error: a no-op beats failing the
request. A read that can't reach Redis raises ``RedisUnavailable``, as the
limiter does, so the caller decides between refusing and carrying on (#194
M33). Its one caller refuses rather than fan out to GitHub.
"""

import json
import logging
from typing import Any

from . import redis_client
from .rate_limit import RedisUnavailable

logger = logging.getLogger("crog")


def get_json(key: str) -> Any | None:
    """Return the decoded JSON value stored at ``key``, or None on a miss or a
    decode error. Raises ``RedisUnavailable`` if Redis can't be read."""
    try:
        raw = redis_client.command("GET", key)
    except Exception as exc:
        logger.error("cache read unavailable (key=%s): %s", key, exc)
        raise RedisUnavailable(key) from exc
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

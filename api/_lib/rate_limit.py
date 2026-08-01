"""Rate limiting + cooldown primitives backed by Upstash Redis.

Two patterns:
  - Sliding window (for per-minute IP caps on GitHub endpoints)
  - Cooldown TTL (for the 30s per-IP gate on /api/regenerate)
"""

import time
import uuid

from . import redis_client


def check_and_consume(key: str, max_requests: int, window_seconds: int, cost: int = 1) -> tuple[bool, int]:
    """Sliding-window rate limit. Atomically prune expired, record this hit,
    then return (allowed, current_count).

    ``cost`` records that many hits in the same round trip, for a request that
    consumes more than one slot. Recording them together means the count
    reflects the whole request, rather than however many hits a per-slot loop
    happened to record before the cap tripped.

    Falls open (allows the request) if Redis is unreachable — losing rate
    limiting on a transient outage is preferable to dropping legit traffic.
    """
    now_ms = int(time.time() * 1000)
    window_start_ms = now_ms - (window_seconds * 1000)
    zadd = ["ZADD", key]
    for _ in range(cost):
        zadd += [str(now_ms), f"{now_ms}:{uuid.uuid4().hex}"]

    try:
        results = redis_client.pipeline(
            [
                ["ZREMRANGEBYSCORE", key, "0", str(window_start_ms)],
                zadd,
                ["ZCARD", key],
                ["EXPIRE", key, str(window_seconds + 1)],
            ]
        )
    except Exception:
        return True, 0

    count = int(results[2] or 0)
    return count <= max_requests, count


def get_cooldown_remaining(key: str) -> int:
    """Seconds left on a cooldown key, 0 if expired/missing/error."""
    try:
        ttl = redis_client.command("TTL", key)
    except Exception:
        return 0
    ttl = int(ttl or 0)
    return max(0, ttl)


def start_cooldown(key: str, seconds: int) -> None:
    """Set or refresh a cooldown TTL. Silently no-ops on error."""
    try:
        redis_client.command("SETEX", key, seconds, "1")
    except Exception:
        pass

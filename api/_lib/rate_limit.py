"""Rate limiting + cooldown primitives backed by Upstash Redis.

Two patterns:
  - Sliding window (for per-minute IP caps on GitHub endpoints)
  - Cooldown TTL (for the 30s per-IP gate on /api/regenerate)

When Redis is unreachable, or refuses part of a call, the limiter raises
``RedisUnavailable`` and the caller decides (#113, #194). Callers that spend
money per request must not treat "cannot meter" as "allowed", so refusing is
the default; a caller for whom an outage costs nothing passes
``fail_open=True`` and keeps serving.

The default is deliberately the safe one. Forgetting the flag on a paid gate
would leak money silently, while forgetting it on a free gate produces a loud,
cheap 503 -- so the direction people forget in is the harmless one.

Either way the exception is logged. The failure that motivated this was not the
fail-open itself but that it was silent: the only cost control on a public
endpoint could disappear with nothing recording that it had.
"""

import logging
import time
import uuid

from . import redis_client

logger = logging.getLogger("crog")


class RedisUnavailable(RuntimeError):
    """The limiter got no usable answer from Redis (unreachable, refused or
    malformed) and the caller opted to fail closed.
    """


def check_and_consume(
    key: str, max_requests: int, window_seconds: int, cost: int = 1, fail_open: bool = False
) -> tuple[bool, int]:
    """Sliding-window rate limit. Atomically prune expired, record this hit,
    then return (allowed, current_count).

    ``cost`` records that many hits in the same round trip, for a request that
    consumes more than one slot. Recording them together means the count
    reflects the whole request, rather than however many hits a per-slot loop
    happened to record before the cap tripped.

    Raises ``RedisUnavailable`` if Redis cannot be reached or doesn't return a
    count, unless the caller passes ``fail_open`` to keep serving instead. See
    the module docstring.
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
        # Inside the try: a bad count must fail like an outage, not read as 0.
        count = results[2]
        if not isinstance(count, int):
            raise RuntimeError(f"ZCARD replied {count!r}")
    except Exception as exc:
        logger.error("rate limit unavailable (key=%s, fail_open=%s): %s", key, fail_open, exc)
        if fail_open:
            return True, 0
        raise RedisUnavailable(key) from exc

    return count <= max_requests, count


def get_cooldown_remaining(key: str, fail_open: bool = False) -> int:
    """Seconds left on a cooldown key, 0 if expired or missing.

    Raises ``RedisUnavailable`` if the lookup fails, so an outage cannot read as
    "no cooldown in effect" -- 0 is already a meaningful value here, which is
    precisely the collision that made the original fail-open invisible.
    """
    try:
        ttl = redis_client.command("TTL", key)
        if not isinstance(ttl, int):
            raise RuntimeError(f"TTL replied {ttl!r}")
    except Exception as exc:
        logger.error("cooldown read unavailable (key=%s, fail_open=%s): %s", key, fail_open, exc)
        if fail_open:
            return 0
        raise RedisUnavailable(key) from exc
    return max(0, ttl)


def start_cooldown(key: str, seconds: int) -> None:
    """Set or refresh a cooldown TTL.

    Deliberately has no fail-closed mode. This runs after the daily slot has
    already been consumed, so a failure here has not cost an unmetered call --
    refusing the request at this point would reject work that was already paid
    for out of the caller's budget. Log it and carry on.
    """
    try:
        redis_client.command("SETEX", key, seconds, "1")
    except Exception as exc:
        logger.error("cooldown write failed (key=%s): %s", key, exc)

"""Rate limiting + cooldown primitives backed by Upstash Redis.

Two patterns:
  - Sliding windows (the per-minute IP caps on the GitHub endpoints, and the
    per-visitor and site-wide daily caps on /api/regenerate), counted and
    recorded in one Lua script
  - Cooldown (the 30s per-visitor gate on /api/regenerate), checked and
    started in one SET NX

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


# ``check_and_consume`` as one script (#194 M11 and M14, #139 property 3).
#   KEYS[1..n]    the windows            ARGV[1]      prune scores up to this (ms)
#   ARGV[2]       the new hits' score    ARGV[3]      the keys' TTL (s)
#   ARGV[4..3+n]  each window's cap      ARGV[4+n..]  one member per hit
# Every window is checked before any is written, so a request one window
# refuses adds nothing to the others. Expired hits only ever add to a count, so
# counting them can't wrongly allow; a window is pruned only when they might be
# what puts the request over its cap. That keeps an allowed one-window call at
# the old pipeline's four Upstash commands.
# Returns 0 if the hits were recorded, else the number of the first full window.
_CONSUME_SCRIPT = """
local n = #KEYS
local cost = #ARGV - 3 - n
for k = 1, n do
  local cap = tonumber(ARGV[3 + k])
  local count = redis.call('ZCARD', KEYS[k])
  if count + cost > cap then
    count = count - redis.call('ZREMRANGEBYSCORE', KEYS[k], 0, ARGV[1])
    if count + cost > cap then
      return k
    end
  end
end
for k = 1, n do
  for i = 4 + n, #ARGV do
    redis.call('ZADD', KEYS[k], ARGV[2], ARGV[i])
  end
  redis.call('EXPIRE', KEYS[k], ARGV[3])
end
return 0
"""


def check_and_consume(
    limits: dict[str, int], window_seconds: int, cost: int = 1, fail_open: bool = False
) -> str | None:
    """Sliding-window rate limits in one atomic step. ``limits`` maps each
    window's key to its cap.

    Returns None if this request's ``cost`` hits went into every window, else
    the key of the first full window, with nothing recorded anywhere: a refused
    request neither fills a window nor stretches anyone's wait, and two
    requests can't both see room for the last slot.

    Raises ``RedisUnavailable`` if Redis cannot be reached or doesn't give a
    usable answer, unless the caller passes ``fail_open`` to keep serving
    instead, which returns None. See the module docstring.
    """
    keys = list(limits)
    names = ",".join(keys)
    now_ms = int(time.time() * 1000)
    members = [f"{now_ms}:{uuid.uuid4().hex}" for _ in range(cost)]

    try:
        full = redis_client.command(
            "EVAL",
            _CONSUME_SCRIPT,
            len(keys),
            *keys,
            now_ms - window_seconds * 1000,
            now_ms,
            window_seconds + 1,
            *limits.values(),
            *members,
        )
        # Inside the try: an unreadable answer must fail like an outage.
        if not (isinstance(full, int) and 0 <= full <= len(keys)):
            raise RuntimeError(f"EVAL replied {full!r}")
    except Exception as exc:
        logger.error("rate limit unavailable (keys=%s, fail_open=%s): %s", names, fail_open, exc)
        if fail_open:
            return None
        raise RedisUnavailable(names) from exc

    return keys[full - 1] if full else None


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


def claim_cooldown(key: str, seconds: int) -> int:
    """Start a cooldown unless one is running. Returns 0 if this call started
    it, else the seconds left on the running one.

    SET NX checks and claims at once, so parallel presses can't all find no
    cooldown before any of them starts one (#194 M64): the first gets 0 and the
    rest the time left. There's no fail-open mode, because the only caller
    spends money per request, so any error raises ``RedisUnavailable``.
    """
    try:
        claimed, ttl = redis_client.pipeline([["SET", key, "1", "NX", "EX", seconds], ["TTL", key]])
        if claimed == "OK":
            return 0
        if claimed is not None or not isinstance(ttl, int):
            raise RuntimeError(f"SET NX replied {claimed!r}, TTL {ttl!r}")
    except Exception as exc:
        logger.error("cooldown claim unavailable (key=%s): %s", key, exc)
        raise RedisUnavailable(key) from exc
    # At least a second, even if the cooldown ran out between the SET and TTL.
    return max(1, ttl)

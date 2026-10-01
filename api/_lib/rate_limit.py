"""Rate limiting + cooldown primitives backed by Upstash Redis.

Two patterns:
  - Sliding window (the per-minute IP caps on the GitHub endpoints, and the
    daily cap on /api/regenerate), counted and recorded in one Lua script
  - Cooldown (the 30s per-IP gate on /api/regenerate), checked and started in
    one SET NX

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


# ``check_and_consume`` as one script (#194 M14, #139 property 3).
#   KEYS[1]  the window             ARGV[1]   prune scores up to this (ms)
#   ARGV[2]  the cap                ARGV[3]   the new hits' score (now, ms)
#   ARGV[4]  the key's TTL (s)      ARGV[5..] one member per hit
# Expired hits only ever add to the count, so counting them can't wrongly allow;
# the prune runs only when they might be what puts a request over the cap. That
# keeps an allowed call at the old pipeline's four Upstash commands.
_CONSUME_SCRIPT = """
local cost = #ARGV - 4
local count = redis.call('ZCARD', KEYS[1])
if count + cost > tonumber(ARGV[2]) then
  count = count - redis.call('ZREMRANGEBYSCORE', KEYS[1], 0, ARGV[1])
  if count + cost > tonumber(ARGV[2]) then
    return {0, count}
  end
end
for i = 5, #ARGV do
  redis.call('ZADD', KEYS[1], ARGV[3], ARGV[i])
end
redis.call('EXPIRE', KEYS[1], ARGV[4])
return {1, count + cost}
"""


def check_and_consume(
    key: str, max_requests: int, window_seconds: int, cost: int = 1, fail_open: bool = False
) -> tuple[bool, int]:
    """Sliding-window rate limit in one atomic step: record this request's
    ``cost`` hits only if they fit under ``max_requests``. Returns (allowed,
    the count after this request, which can include expired hits the script
    had no need to prune).

    A refused request records nothing, so it neither fills the window nor
    stretches anyone's wait, and two requests can't both see room for the last
    slot. The ``cost`` hits of one request are recorded together, so the count
    reflects the whole request.

    Raises ``RedisUnavailable`` if Redis cannot be reached or doesn't return a
    count, unless the caller passes ``fail_open`` to keep serving instead. See
    the module docstring.
    """
    now_ms = int(time.time() * 1000)
    window_start_ms = now_ms - (window_seconds * 1000)
    members = [f"{now_ms}:{uuid.uuid4().hex}" for _ in range(cost)]

    try:
        reply = redis_client.command(
            "EVAL",
            _CONSUME_SCRIPT,
            1,
            key,
            window_start_ms,
            max_requests,
            now_ms,
            window_seconds + 1,
            *members,
        )
        # Inside the try: an unreadable answer must fail like an outage.
        if not (isinstance(reply, list) and len(reply) == 2 and all(isinstance(v, int) for v in reply)):
            raise RuntimeError(f"EVAL replied {reply!r}")
        allowed, count = reply
    except Exception as exc:
        logger.error("rate limit unavailable (key=%s, fail_open=%s): %s", key, fail_open, exc)
        if fail_open:
            return True, 0
        raise RedisUnavailable(key) from exc

    return allowed == 1, count


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

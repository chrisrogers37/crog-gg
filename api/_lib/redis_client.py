"""Minimal Upstash Redis REST client.

Uses urllib so we don't pull in extra deps. Auto-detects env vars from
either naming convention used by the Vercel Marketplace integration:
  - UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN (direct Upstash)
  - KV_REST_API_URL / KV_REST_API_TOKEN (legacy Vercel KV naming,
    still used by the marketplace install today)
"""

import json
import os
import urllib.error
import urllib.request
from typing import Any

_URL = (
    os.environ.get("UPSTASH_REDIS_REST_URL")
    or os.environ.get("KV_REST_API_URL")
    or ""
).rstrip("/")
_TOKEN = (
    os.environ.get("UPSTASH_REDIS_REST_TOKEN")
    or os.environ.get("KV_REST_API_TOKEN")
    or ""
)
_TIMEOUT = 5


def is_configured() -> bool:
    return bool(_URL and _TOKEN)


def _post(path: str, body: Any) -> Any:
    if not is_configured():
        raise RuntimeError("Upstash Redis env vars not configured")

    req = urllib.request.Request(
        f"{_URL}{path}",
        data=json.dumps(body).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {_TOKEN}",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=_TIMEOUT) as resp:
        return json.loads(resp.read())


def command(*args: Any) -> Any:
    """Execute a single Redis command. Returns the `result` field."""
    payload = [str(a) for a in args]
    data = _post("", payload)
    if "error" in data:
        raise RuntimeError(f"Upstash error: {data['error']}")
    return data.get("result")


def pipeline(commands: list[list[Any]]) -> list[Any]:
    """Execute multiple commands in a single round-trip.

    Returns a list of result values in the same order as the input commands.
    Note: Upstash `/pipeline` is non-atomic; use `/multi-exec` for transactions.
    """
    payload = [[str(a) for a in cmd] for cmd in commands]
    data = _post("/pipeline", payload)
    return [item.get("result") for item in data]

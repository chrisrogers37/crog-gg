"""``GET /api/limits`` must not report an outage as "no cooldown" (#162).

The endpoint reports a value whose healthy form is ``0``, so falling open to
``0`` made a total Redis outage byte-identical to a healthy read: same 200,
same ``cooldown_remaining: 0``, same ``is_on_cooldown: false``. Nothing in the
response distinguished "nothing is limiting you" from "nobody can tell". That
is the collision ``rate_limit``'s own docstring names, arriving at the caller
after the helper was hardened against it.

Staying available is still correct here -- the endpoint spends nothing, so an
outage should not take it down -- so these pin availability AND honesty
together. ``test_free_limits_endpoint_still_answers_during_an_outage`` in
tests/test_regenerate_spend_guard.py holds the first half from the spend side;
it must keep passing.

The healthy cases are positive controls, not decoration: an endpoint that
hardcoded ``metering_available: false`` would satisfy the outage test alone.

These patch over conftest's autouse ``_hermetic_rate_limit``, which stubs the
primitive under test. As in the spend-guard module, the outage is produced by
breaking Redis underneath the REAL limiter rather than by patching the limiter
with a raising mock -- a raising mock would keep passing if the call site went
back to falling open, which is the exact regression being guarded.
"""

from unittest.mock import patch

import pytest

from api._lib import rate_limit

# Bound at import time, before conftest's autouse fixture replaces it.
_REAL_GET_COOLDOWN = rate_limit.get_cooldown_remaining


@pytest.fixture
def real_limiter():
    """Undo conftest's stub so the limiter's own decision is what runs."""
    with patch("api.index.rate_limit.get_cooldown_remaining", _REAL_GET_COOLDOWN):
        yield


def _redis_unreachable():
    return patch(
        "api._lib.rate_limit.redis_client.command",
        side_effect=RuntimeError("redis down"),
    )


def _redis_returns_ttl(ttl: int):
    return patch("api._lib.rate_limit.redis_client.command", return_value=ttl)


@pytest.fixture
def redis_down(real_limiter):
    """Real limiter, unreachable Redis."""
    with _redis_unreachable():
        yield


@pytest.fixture
def redis_up_no_cooldown(real_limiter):
    """Real limiter, reachable Redis, no cooldown key set (TTL -2)."""
    with _redis_returns_ttl(-2):
        yield


@pytest.fixture
def redis_up_on_cooldown(real_limiter):
    """Real limiter, reachable Redis, 17s left on the cooldown key."""
    with _redis_returns_ttl(17):
        yield


def test_a_healthy_read_with_no_cooldown_reports_itself_as_metered(
    client, redis_up_no_cooldown
):
    body = client.get("/api/limits").get_json()

    assert body["metering_available"] is True
    assert body["cooldown_remaining"] == 0
    assert body["is_on_cooldown"] is False


def test_a_healthy_read_during_a_cooldown_reports_the_seconds_left(
    client, redis_up_on_cooldown
):
    body = client.get("/api/limits").get_json()

    assert body["metering_available"] is True
    assert body["cooldown_remaining"] == 17
    assert body["is_on_cooldown"] is True


def test_an_outage_reports_that_the_cooldown_could_not_be_read(client, redis_down):
    r = client.get("/api/limits")

    # Still available: this endpoint spends nothing, so an outage must not 503.
    assert r.status_code == 200

    body = r.get_json()
    assert body["metering_available"] is False
    # Withheld rather than answered. A flag beside a confident `0` still leaves
    # the two fields a reader actually looks at asserting something untrue.
    assert body["cooldown_remaining"] is None
    assert body["is_on_cooldown"] is None


def test_an_outage_does_not_answer_the_same_as_a_healthy_read(client, real_limiter):
    """The issue as filed: the two states were byte-identical.

    Stated as a property rather than as two field values, so it still holds if
    the schema is reshaped later -- renaming fields could satisfy the tests
    above one at a time while quietly restoring the collision.
    """
    with _redis_returns_ttl(-2):
        healthy = client.get("/api/limits").get_json()
    with _redis_unreachable():
        outage = client.get("/api/limits").get_json()

    assert healthy != outage

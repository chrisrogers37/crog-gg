"""CORS: a browser may call the API from site.yaml's site.url and its aliases
(#189), here site.example's, and from nowhere else."""

import pytest

from api._lib.site_config import CONFIG


def _preflight(client, origin):
    return client.options(
        "/api/limits",
        headers={"Origin": origin, "Access-Control-Request-Method": "GET"},
    )


def test_the_sites_own_origins_may_call(client):
    for origin in CONFIG.cors_origins:
        r = _preflight(client, origin)
        assert r.headers.get("Access-Control-Allow-Origin") == origin


@pytest.mark.parametrize("origin", ["https://evil.example", "https://ada.example.evil.example", "http://ada.example"])
def test_another_origin_may_not(client, origin):
    assert "Access-Control-Allow-Origin" not in _preflight(client, origin).headers

"""GET /api/features: what this deployment can serve, so the page hides the
rest (#189 M21). It must answer without Redis or GitHub, so a fork with
neither still gets one.
"""

import dataclasses
from unittest.mock import MagicMock, patch

import pytest

import api.index as index


def _features(client, **config):
    with patch.object(index, "CONFIG", dataclasses.replace(index.CONFIG, **config)):
        return client.get("/api/features")


@pytest.fixture
def redis_configured():
    with patch("api.index.redis_client.is_configured", return_value=True):
        yield


def test_the_shape_and_its_cache(client, redis_configured):
    r = client.get("/api/features")
    assert r.status_code == 200
    assert r.get_json() == {"regenerate": True, "github": True}
    assert r.headers["Cache-Control"] == "public, max-age=300"


def test_it_reads_no_redis_and_calls_no_github(client, redis_configured):
    with (
        patch("api.index.redis_client._post", side_effect=AssertionError("redis read")),
        patch("api.index.requests.get", side_effect=AssertionError("github call")),
        patch("api.index.requests.post", side_effect=AssertionError("github call")),
    ):
        assert client.get("/api/features").status_code == 200


def test_no_key_means_no_regenerate(client, redis_configured):
    with patch("api.index.openai_client", None):
        assert client.get("/api/features").get_json()["regenerate"] is False


def test_no_upstash_means_no_regenerate(client):
    # The paid endpoint refuses to run unmetered (#113), so it can't serve.
    with patch("api.index.redis_client.is_configured", return_value=False):
        assert client.get("/api/features").get_json()["regenerate"] is False


@pytest.mark.parametrize("mode, expected", [("auto", True), ("on", True), ("off", False)])
def test_site_yaml_can_turn_regenerate_off(client, redis_configured, mode, expected):
    assert _features(client, regenerate_mode=mode).get_json()["regenerate"] is expected


@pytest.mark.parametrize("mode, expected", [("auto", True), ("on", True), ("off", False)])
def test_site_yaml_can_turn_github_off(client, mode, expected):
    assert _features(client, github_mode=mode).get_json()["github"] is expected


def test_it_answers_with_a_client_that_was_never_called(client, redis_configured):
    model = MagicMock()
    with patch("api.index.openai_client", model):
        client.get("/api/features")
    model.chat.completions.create.assert_not_called()

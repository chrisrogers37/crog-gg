"""/api/regenerate on a deployment that can't rewrite: no OpenAI key, or
site.yaml's features.regenerate is off (#189 M21). It answers 503
regeneration_disabled before the cooldown, so it reads no Redis and meters
nothing; #113's fail-closed metering is unchanged for a deployment that can.
"""

import dataclasses
from unittest.mock import patch

import pytest

import api.index as index

PRESS = {"sections": {"about": {"about_text": "hello"}}, "use_fantasy": True}


@pytest.fixture
def no_metering():
    with (
        patch("api.index.rate_limit.get_cooldown_remaining", side_effect=AssertionError("cooldown read")) as read,
        patch("api.index.rate_limit.claim_cooldown", side_effect=AssertionError("cooldown claim")) as claim,
        patch("api.index.rate_limit.check_and_consume", side_effect=AssertionError("daily cap")) as consume,
    ):
        yield read, claim, consume


def _disabled(r):
    assert r.status_code == 503
    body = r.get_json()
    assert body["success"] is False
    assert body["code"] == "regeneration_disabled"
    assert body["error"] == "Regeneration isn't set up on this site"


def test_no_key_is_disabled_before_any_metering(client, no_metering):
    with patch("api.index.openai_client", None):
        _disabled(client.post("/api/regenerate", json=PRESS))
    for gate in no_metering:
        gate.assert_not_called()


def test_off_in_site_yaml_is_disabled_even_with_a_key(client, no_metering):
    off = dataclasses.replace(index.CONFIG, regenerate_mode="off")
    with patch.object(index, "CONFIG", off):
        _disabled(client.post("/api/regenerate", json=PRESS))
    index.openai_client.chat.completions.create.assert_not_called()


def test_a_bad_request_is_still_a_400_first(client):
    with patch("api.index.openai_client", None):
        r = client.post("/api/regenerate", json={"sections": {"nope": {}}, "use_fantasy": True})
    assert r.status_code == 400


@pytest.mark.parametrize("mode", ["auto", "on"])
def test_a_deployment_that_can_rewrite_goes_on_to_the_cooldown(client, mode):
    config = dataclasses.replace(index.CONFIG, regenerate_mode=mode)
    with (
        patch.object(index, "CONFIG", config),
        patch("api.index.rate_limit.claim_cooldown", return_value=17),
    ):
        r = client.post("/api/regenerate", json=PRESS)
    assert r.status_code == 429

"""Unit tests for the cache helper (api/_lib/cache.py, #91).

A write never turns a Redis outage into a request failure: set_json silently
no-ops when Upstash errors. A read raises RedisUnavailable, so its caller can
refuse rather than treat an outage as a miss (#194 M33). These also pin the
JSON round-trip contract with the underlying Redis command, which the endpoint
tests mock out.
"""

import json
from unittest.mock import patch

import pytest

from api._lib import cache
from api._lib.rate_limit import RedisUnavailable


def test_get_json_raises_redis_unavailable_on_redis_error():
    with patch("api._lib.cache.redis_client.command", side_effect=RuntimeError("down")):
        with pytest.raises(RedisUnavailable):
            cache.get_json("k")


def test_get_json_returns_none_on_miss():
    with patch("api._lib.cache.redis_client.command", return_value=None):
        assert cache.get_json("k") is None


def test_get_json_decodes_stored_value():
    with patch("api._lib.cache.redis_client.command", return_value=json.dumps({"a": 1})):
        assert cache.get_json("k") == {"a": 1}


def test_get_json_returns_none_on_bad_json():
    # A corrupt value isn't an outage: the miss recomputes and overwrites it.
    with patch("api._lib.cache.redis_client.command", return_value="not json"):
        assert cache.get_json("k") is None


def test_set_json_swallows_redis_error():
    with patch("api._lib.cache.redis_client.command", side_effect=RuntimeError("down")):
        cache.set_json("k", {"a": 1}, 3600)  # must not raise


def test_set_json_issues_setex_with_json_payload():
    with patch("api._lib.cache.redis_client.command") as mock_cmd:
        cache.set_json("k", {"a": 1}, 3600)
    mock_cmd.assert_called_once_with("SETEX", "k", 3600, json.dumps({"a": 1}))

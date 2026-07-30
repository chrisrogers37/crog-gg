"""Unit tests for the fall-open cache helper (api/_lib/cache.py, #91).

The cache must NEVER turn a Redis outage into a request failure: get_json
returns None (a miss) and set_json silently no-ops when Upstash errors. These
also pin the JSON round-trip contract with the underlying Redis command, which
the endpoint tests mock out.
"""

import json
from unittest.mock import patch

from api._lib import cache


def test_get_json_returns_none_on_redis_error():
    with patch("api._lib.cache.redis_client.command", side_effect=RuntimeError("down")):
        assert cache.get_json("k") is None


def test_get_json_returns_none_on_miss():
    with patch("api._lib.cache.redis_client.command", return_value=None):
        assert cache.get_json("k") is None


def test_get_json_decodes_stored_value():
    with patch("api._lib.cache.redis_client.command", return_value=json.dumps({"a": 1})):
        assert cache.get_json("k") == {"a": 1}


def test_get_json_returns_none_on_bad_json():
    with patch("api._lib.cache.redis_client.command", return_value="not json"):
        assert cache.get_json("k") is None


def test_set_json_swallows_redis_error():
    with patch("api._lib.cache.redis_client.command", side_effect=RuntimeError("down")):
        cache.set_json("k", {"a": 1}, 3600)  # must not raise


def test_set_json_issues_setex_with_json_payload():
    with patch("api._lib.cache.redis_client.command") as mock_cmd:
        cache.set_json("k", {"a": 1}, 3600)
    mock_cmd.assert_called_once_with("SETEX", "k", 3600, json.dumps({"a": 1}))

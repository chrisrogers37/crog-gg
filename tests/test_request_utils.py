"""What counts as one visitor (#194 M11), and their anonymous tag (#194 M12).

Keying limits on the raw address let one IPv6 connection, which is usually
handed a whole /64, rotate through it for a fresh cooldown and daily cap on
every press.
"""

import re
from types import SimpleNamespace
from unittest.mock import patch

import pytest

from api._lib import request_utils
from api._lib.github_proxy import _gh_rate_key
from api._lib.request_utils import Visitor, _rate_limit_subject, client_tag
from api.index import _cooldown_key, _regen_daily_key, app


@pytest.mark.parametrize(
    "ip, subject",
    [
        pytest.param("2001:db8:1:2:3:4:5:6", "2001:db8:1:2::/64", id="ipv6-is-its-64"),
        pytest.param("2001:db8:1:2:ffff:ffff:ffff:ffff", "2001:db8:1:2::/64", id="same-64"),
        pytest.param("2001:db8:1:3::1", "2001:db8:1:3::/64", id="next-64"),
        pytest.param("203.0.113.7", "203.0.113.7", id="ipv4"),
        pytest.param("::ffff:203.0.113.7", "203.0.113.7", id="mapped-ipv4"),
        pytest.param("unknown", "unknown", id="not-an-address"),
    ],
)
def test_rate_limit_subject(ip, subject):
    assert _rate_limit_subject(ip) == subject


def test_every_per_visitor_key_counts_a_64_as_one_visitor():
    a, b = Visitor.from_ip("2001:db8:1:2::1"), Visitor.from_ip("2001:db8:1:2:aaaa::9")
    assert _cooldown_key(a) == _cooldown_key(b)
    assert _regen_daily_key(a) == _regen_daily_key(b)
    assert _gh_rate_key(a, "repo") == _gh_rate_key(b, "repo")
    assert _regen_daily_key(a) != _regen_daily_key(Visitor.from_ip("2001:db8:1:3::1"))


def test_client_tag_is_stable_short_hex_with_no_address_in_it(salted):
    tag = client_tag("203.0.113.7")
    assert tag == client_tag("203.0.113.7")
    assert re.fullmatch(r"[0-9a-f]{16}", tag)


def test_client_tag_names_one_visitor_per_64(salted):
    assert client_tag("2001:db8:1:2::1") == client_tag("2001:db8:1:2:aaaa::9")
    assert client_tag("2001:db8:1:2::1") != client_tag("2001:db8:1:3::1")


def test_client_tag_changes_with_the_salt():
    with patch.object(request_utils, "IP_HASH_SALT", "one-salt"):
        first = client_tag("203.0.113.7")
    with patch.object(request_utils, "IP_HASH_SALT", "another-salt"):
        assert client_tag("203.0.113.7") != first


def test_without_a_salt_there_is_no_tag():
    with patch.object(request_utils, "IP_HASH_SALT", ""):
        assert client_tag("203.0.113.7") is None


def test_without_a_salt_a_visitor_is_named_by_address():
    assert Visitor.from_ip("2001:db8:1:2::1") == Visitor(id="2001:db8:1:2::/64", tag=None)


def test_salted_keys_hold_no_address(salted):
    ip = "203.0.113.7"
    visitor = Visitor.from_ip(ip)
    assert visitor == Visitor(id=client_tag(ip), tag=client_tag(ip))
    keys = [_cooldown_key(visitor), _regen_daily_key(visitor), _gh_rate_key(visitor, "repo")]
    assert all(key.endswith(visitor.tag) for key in keys)
    assert not any(ip in key for key in keys)


@pytest.mark.parametrize(
    "headers, remote, expected",
    [
        ({"X-Real-IP": "203.0.113.7", "X-Forwarded-For": "198.51.100.9"}, "192.0.2.4", "203.0.113.7"),
        ({"X-Forwarded-For": " 198.51.100.9, 192.0.2.1"}, "192.0.2.4", "198.51.100.9"),
        ({}, "192.0.2.4", "192.0.2.4"),
        ({}, None, "unknown"),
    ],
)
def test_current_visitor_uses_edge_address_then_local_fallbacks(headers, remote, expected):
    with app.test_request_context(headers=headers, environ_overrides={"REMOTE_ADDR": remote}):
        assert request_utils.current_visitor() == Visitor.from_ip(expected)


@pytest.mark.parametrize("token", [None, "fixture-public-data-token"])
@pytest.mark.parametrize("site_url, user_agent", [("https://portfolio.example", "portfolio.example"), ("", "site")])
def test_github_headers_name_the_site_and_only_add_a_configured_token(monkeypatch, token, site_url, user_agent):
    monkeypatch.setattr(request_utils, "GITHUB_TOKEN", token)
    monkeypatch.setattr(request_utils, "CONFIG", SimpleNamespace(site_url=site_url))
    headers = request_utils.github_headers()
    assert headers["Accept"] == "application/vnd.github.v3+json"
    assert headers["User-Agent"] == user_agent
    if token:
        assert headers["Authorization"] == f"token {token}"
    else:
        assert "Authorization" not in headers


@pytest.mark.parametrize(
    "name, error",
    [
        ("", "cannot be empty"),
        ("x" * 101, "too long"),
        (".", "Invalid repository name"),
        ("..", "Invalid repository name"),
        (".hidden", "cannot start with a period"),
        ("owner/repo", "invalid characters"),
        ("repo\n", "invalid characters"),
    ],
)
def test_invalid_repo_names_are_rejected_with_a_reason(name, error):
    valid, message = request_utils.validate_repo_name(name)
    assert valid is False
    assert error in message


@pytest.mark.parametrize("name", ["a", "Example-repo_1.2", "x" * 100])
def test_valid_repo_names_include_the_length_boundary(name):
    assert request_utils.validate_repo_name(name) == (True, None)

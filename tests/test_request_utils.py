"""What counts as one visitor (#194 M11), and their anonymous tag (#194 M12).

Keying limits on the raw address let one IPv6 connection, which is usually
handed a whole /64, rotate through it for a fresh cooldown and daily cap on
every press.
"""

import re
from unittest.mock import patch

import pytest

from api._lib import request_utils
from api._lib.request_utils import Visitor, _rate_limit_subject, client_tag
from api._lib.github_proxy import _gh_rate_key
from api.index import _cooldown_key, _regen_daily_key


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

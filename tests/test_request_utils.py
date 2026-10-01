"""What a per-visitor limit counts (#194 M11).

Keying limits on the raw address let one IPv6 connection, which is usually
handed a whole /64, rotate through it for a fresh cooldown and daily cap on
every press.
"""

import pytest

from api._lib.request_utils import rate_limit_subject
from api.index import _cooldown_key, _gh_rate_key, _regen_daily_key


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
    assert rate_limit_subject(ip) == subject


def test_every_per_visitor_key_counts_a_64_as_one_visitor():
    a, b = "2001:db8:1:2::1", "2001:db8:1:2:aaaa::9"
    assert _cooldown_key(a) == _cooldown_key(b)
    assert _regen_daily_key(a) == _regen_daily_key(b)
    assert _gh_rate_key(a, "repo") == _gh_rate_key(b, "repo")
    assert _regen_daily_key(a) != _regen_daily_key("2001:db8:1:3::1")

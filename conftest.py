"""Pytest bootstrap + shared fixtures.

Put the repo root on sys.path so ``import api.index`` resolves regardless of
how pytest is invoked. The backend package is rooted at the repo root and
imports itself as ``api.*`` (e.g. ``from api._lib import rate_limit``), so the
repo root must be importable for the test suite.

The Flask test client and a hermetic rate-limit fixture are exposed here so
every test module shares them without redefining the plumbing.
"""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from unittest.mock import patch  # noqa: E402

import pytest  # noqa: E402

from api.index import app  # noqa: E402


@pytest.fixture
def client():
    app.config.update(TESTING=True)
    return app.test_client()


@pytest.fixture(autouse=True)
def _hermetic_rate_limit():
    """Keep tests hermetic: never depend on (or reach for) Redis rate limiting.

    Here we stub them so no test touches the network and the cooldown/daily-cap
    gates default to "allowed" unless a test overrides them.

    Production failure modes differ per call site (#113): the free GitHub
    endpoints fall open, the paid /api/regenerate gates fail closed. Tests that
    exercise either behaviour must patch over this fixture -- it stubs the very
    primitives under test. See tests/test_regenerate_spend_guard.py.
    """
    with patch("api.index.rate_limit.check_and_consume", return_value=(True, 0)):
        with patch("api.index.rate_limit.get_cooldown_remaining", return_value=0):
            with patch("api.index.rate_limit.start_cooldown"):
                yield

"""Pytest bootstrap.

Put the repo root on sys.path so ``import api.index`` resolves regardless of
how pytest is invoked. The backend package is rooted at the repo root and
imports itself as ``api.*`` (e.g. ``from api._lib import rate_limit``), so the
repo root must be importable for the test suite.
"""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

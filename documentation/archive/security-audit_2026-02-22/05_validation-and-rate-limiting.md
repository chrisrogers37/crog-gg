# Phase 05: Add Input Validation and Rate Limiting to GitHub Endpoints

**Status:** ✅ COMPLETE
**Started:** 2026-02-22
**Completed:** 2026-02-22

| Field                  | Value                                                            |
| ---------------------- | ---------------------------------------------------------------- |
| **PR Title**           | Add input validation and rate limiting to GitHub proxy endpoints |
| **Risk**               | Low                                                              |
| **Effort**             | Low-Medium (~2-3 hours)                                          |
| **Findings Addressed** | #9 (LOW - no repo_name validation), #10 (LOW - no rate limiting) |
| **Files Modified**     | 1 (`backend/app.py`)                                             |
| **Files Created**      | 1 (`backend/test_app.py`)                                        |
| **Dependencies**       | None                                                             |
| **Unlocks**            | None                                                             |

---

## Context

The backend proxies GitHub API requests through six `/api/v1/github/*` endpoints. Two LOW-severity issues exist:

1. **Finding #9:** The `repo_name` URL parameter in three endpoints is passed directly into GitHub API URLs with zero validation. Proper validation prevents malformed requests from reaching the upstream API.

2. **Finding #10:** All GitHub proxy endpoints have no rate limiting. An attacker could exhaust the project's GitHub API rate limit (5,000 req/hr with token) by spamming the proxy.

`Flask-Limiter==3.3.0` is already in `backend/requirements.txt` (line 8) but is never used. This PR puts it to work.

---

## Dependencies

None. Independent of all other phases. Note: Phase 01 also modifies `backend/app.py` but in non-overlapping sections (logging lines vs. GitHub endpoints).

---

## Detailed Implementation Plan

All changes in `backend/app.py`. Line numbers reference current state at commit `0f66c43`.

### Step 1: Add `re` import (line 7 area)

Add `import re` among the stdlib imports.

### Step 2: Add Flask-Limiter imports

After `from dotenv import load_dotenv`:

```python
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
```

### Step 3: Initialize Flask-Limiter

After `app = Flask(__name__)` (line 28), before the CORS block:

```python
# Initialize rate limiter (in-memory storage, no default limits)
limiter = Limiter(
    get_remote_address,
    app=app,
    default_limits=[],
    storage_uri="memory://",
)
```

**Why `default_limits=[]`:** Only GitHub endpoints need limits. The `/api/regenerate` endpoint has its own cooldown mechanism with a specific response format the frontend depends on.

**Why `storage_uri="memory://"`:** Production runs Gunicorn with 3 workers, so each worker has its own counter (effective ~90 req/min per IP). Acceptable for a personal portfolio site. Adding Redis would be over-engineering.

### Step 4: Add 429 error handler

After the limiter initialization:

```python
@app.errorhandler(429)
def ratelimit_handler(e):
    """Return JSON instead of HTML for rate limit errors."""
    return jsonify({
        'error': 'Rate limit exceeded',
        'message': str(e.description),
    }), 429
```

### Step 5: Add repo name validation function

After the existing rate limiting section (after line 89), before `get_fantasy_prompt`:

```python
# ===========================================
# INPUT VALIDATION
# ===========================================

REPO_NAME_PATTERN = re.compile(r'^[a-zA-Z0-9._-]+$')
MAX_REPO_NAME_LENGTH = 100


def validate_repo_name(repo_name):
    """
    Validate a GitHub repository name.
    Returns (is_valid, error_message) tuple.
    """
    if not repo_name:
        return False, 'Repository name cannot be empty'

    if len(repo_name) > MAX_REPO_NAME_LENGTH:
        return False, f'Repository name too long (max {MAX_REPO_NAME_LENGTH} characters)'

    if repo_name in ('.', '..'):
        return False, 'Invalid repository name'

    if repo_name.startswith('.'):
        return False, 'Repository name cannot start with a period'

    if not REPO_NAME_PATTERN.match(repo_name):
        return False, (
            'Repository name contains invalid characters '
            '(allowed: alphanumeric, hyphens, underscores, periods)'
        )

    return True, None
```

### Step 6: Apply rate limiting and validation to all 6 GitHub endpoints

For each endpoint, add `@limiter.limit("30/minute")` after `@app.route(...)`. For endpoints with `<repo_name>`, add validation at the top of the function body.

**Example (apply to all three repo_name endpoints):**

```python
@app.route('/api/v1/github/repo/<repo_name>', methods=['GET'])
@limiter.limit("30/minute")
def get_repository(repo_name):
    is_valid, error_msg = validate_repo_name(repo_name)
    if not is_valid:
        logger.warning(f"Invalid repo name rejected: {repr(repo_name)}")
        return jsonify({'error': error_msg}), 400
    # ... rest of function unchanged
```

**Endpoints requiring both rate limiting AND validation (3):**

- `/api/v1/github/repo/<repo_name>` (~line 391)
- `/api/v1/github/readme/<repo_name>` (~line 412)
- `/api/v1/github/languages/<repo_name>` (~line 437)

**Endpoints requiring rate limiting ONLY (3):**

- `/api/v1/github/languages` (~line 458)
- `/api/v1/github/contributions` (~line 496)
- `/api/github/languages` (legacy, ~line 308)

---

## Test Plan

### Create `backend/test_app.py`

```python
"""Tests for input validation and rate limiting on GitHub endpoints."""
import pytest
from unittest.mock import patch, MagicMock
from app import app, validate_repo_name


@pytest.fixture
def client():
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client


class TestValidateRepoName:
    def test_valid_alphanumeric(self):
        assert validate_repo_name('shuffify') == (True, None)

    def test_valid_with_hyphens(self):
        assert validate_repo_name('30-day-abs') == (True, None)

    def test_valid_with_underscores(self):
        assert validate_repo_name('my_repo') == (True, None)

    def test_invalid_empty(self):
        is_valid, _ = validate_repo_name('')
        assert is_valid is False

    def test_invalid_too_long(self):
        is_valid, _ = validate_repo_name('a' * 101)
        assert is_valid is False

    def test_valid_at_max_length(self):
        assert validate_repo_name('a' * 100) == (True, None)

    def test_invalid_dot(self):
        is_valid, _ = validate_repo_name('.')
        assert is_valid is False

    def test_invalid_dotdot(self):
        is_valid, _ = validate_repo_name('..')
        assert is_valid is False

    def test_invalid_starts_with_period(self):
        is_valid, _ = validate_repo_name('.hidden')
        assert is_valid is False

    def test_invalid_special_chars(self):
        is_valid, _ = validate_repo_name('repo;rm -rf')
        assert is_valid is False

    def test_invalid_angle_brackets(self):
        is_valid, _ = validate_repo_name('repo<script>')
        assert is_valid is False


class TestRepoEndpointValidation:
    @patch('app.requests.get')
    def test_valid_name_passes(self, mock_get, client):
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {'name': 'shuffify'}
        mock_response.raise_for_status.return_value = None
        mock_get.return_value = mock_response
        response = client.get('/api/v1/github/repo/shuffify')
        assert response.status_code == 200

    def test_invalid_name_returns_400(self, client):
        response = client.get('/api/v1/github/repo/repo%3Brm')
        assert response.status_code == 400
        assert 'error' in response.get_json()
```

**Running tests:**

```bash
cd backend && source venv/bin/activate
pip install pytest  # if needed
pytest test_app.py -v
```

### Manual Verification

```bash
# Valid request
curl -s http://localhost:5001/api/v1/github/repo/shuffify | python -m json.tool

# Invalid request - should return 400
curl -s -w "\nHTTP: %{http_code}\n" http://localhost:5001/api/v1/github/repo/'repo;rm'

# Rate limit test - 31st request should return 429
for i in $(seq 1 31); do
  code=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5001/api/v1/github/contributions)
  echo "Request $i: HTTP $code"
done
```

---

## Stress Testing & Edge Cases

| Scenario                                  | Expected                                                         |
| ----------------------------------------- | ---------------------------------------------------------------- |
| URL-encoded special chars (`%3B` for `;`) | Flask decodes before routing, validation rejects                 |
| Unicode zero-width chars                  | Rejected by regex                                                |
| 100-char name                             | Accepted (boundary)                                              |
| 101-char name                             | Rejected                                                         |
| 30 requests/min from same IP              | All succeed                                                      |
| 31st request in same minute               | Returns 429 JSON                                                 |
| Gunicorn with 3 workers                   | Effective limit ~90/min per IP                                   |
| `X-Forwarded-For` spoofing                | `get_remote_address` behavior matches existing `get_client_ip()` |

---

## Verification Checklist

- [x]`import re` added
- [x]Flask-Limiter imported and initialized with `default_limits=[]`, `storage_uri="memory://"`
- [x]`@app.errorhandler(429)` returns JSON
- [x]`validate_repo_name()` handles: empty, too long, `.`, `..`, starts with period, invalid chars
- [x]`@limiter.limit("30/minute")` on all 6 GitHub endpoints
- [x]Validation check at top of 3 `<repo_name>` endpoints
- [x]`logger.warning` with `repr(repo_name)` in validation failures
- [x]`flake8`, `black`, `isort` pass
- [x]`pytest test_app.py -v` passes
- [x]Frontend loads projects without regression

---

## What NOT To Do

1. **Do NOT use Redis for storage.** Over-engineering for a LOW-severity finding on a personal site.
2. **Do NOT replace the existing `/api/regenerate` cooldown with Flask-Limiter.** The frontend depends on its specific response format.
3. **Do NOT set `default_limits`.** Would interfere with `/api/regenerate` and `/api/limits`.
4. **Do NOT validate against an allow-list of repos.** New projects are added via YAML config anytime. Validate format, not values.
5. **Do NOT log raw `repo_name` without `repr()`.** Malicious input could contain terminal escape sequences.
6. **Do NOT forget the 429 error handler.** Without it, Flask-Limiter returns HTML that breaks the frontend's `response.json()`.
7. **Do NOT apply different limits to legacy vs v1 endpoints.** Use `30/minute` consistently.
8. **Do NOT add validation to endpoints without `<repo_name>`.** They only need the rate limit decorator.

---

_Remediation doc for Security Audit 2026-02-22, Phase 05. Addresses findings #9 and #10._

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

    def test_valid_with_periods(self):
        assert validate_repo_name('my.repo') == (True, None)

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

    def test_invalid_slashes(self):
        is_valid, _ = validate_repo_name('repo/../etc')
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

    def test_readme_invalid_name_returns_400(self, client):
        response = client.get('/api/v1/github/readme/repo%3Brm')
        assert response.status_code == 400
        assert 'error' in response.get_json()

    def test_languages_invalid_name_returns_400(self, client):
        response = client.get('/api/v1/github/languages/repo%3Brm')
        assert response.status_code == 400
        assert 'error' in response.get_json()

    @patch('app.requests.get')
    def test_readme_valid_name_passes(self, mock_get, client):
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {'content': 'readme'}
        mock_response.raise_for_status.return_value = None
        mock_get.return_value = mock_response
        response = client.get('/api/v1/github/readme/shuffify')
        assert response.status_code == 200

    @patch('app.requests.get')
    def test_languages_valid_name_passes(self, mock_get, client):
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {'Python': 1000}
        mock_response.raise_for_status.return_value = None
        mock_get.return_value = mock_response
        response = client.get('/api/v1/github/languages/shuffify')
        assert response.status_code == 200

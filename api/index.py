"""Flask app for crog.gg backend — deployed as a single Vercel Function.

Ported from backend/app.py. Key differences:
  - In-memory cooldown dict / Flask-Limiter memory:// are replaced by
    Upstash Redis (see api/_lib/redis_client.py and rate_limit.py).
  - Client IP comes from `x-real-ip` (Vercel edge) instead of
    parsing X-Forwarded-For (which was spoofable on the old DO setup).
  - No gunicorn-specific logger plumbing; Vercel captures stdout/stderr.

All routes are namespaced under /api/* and dispatched here by a rewrite
in vercel.json.
"""

import json
import logging
import os

import openai
import requests
from flask import Flask, jsonify, request
from flask_cors import CORS

from api._lib import rate_limit
from api._lib.request_utils import (
    GITHUB_API,
    GITHUB_USERNAME,
    get_client_ip,
    github_headers,
    validate_repo_name,
)

logging.basicConfig(level=logging.INFO, format="%(levelname)s - %(name)s - %(message)s")
logger = logging.getLogger("crog")

app = Flask(__name__)

_DEBUG = os.environ.get("FLASK_DEBUG", "false").lower() in ("true", "1", "yes")
_cors_origins = ["https://crog.gg", "https://www.crog.gg"]
if _DEBUG:
    _cors_origins += [
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
    ]
CORS(
    app,
    origins=_cors_origins,
    supports_credentials=True,
    allow_headers=["Content-Type", "Authorization"],
    methods=["GET", "POST", "OPTIONS"],
)

OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")
openai_client = openai.OpenAI(api_key=OPENAI_API_KEY) if OPENAI_API_KEY else None

COOLDOWN_SECONDS = 30
REGEN_DAILY_MAX = 30
REGEN_DAILY_WINDOW = 86400
GH_RATE_LIMIT_MAX = 30
GH_RATE_LIMIT_WINDOW = 60


def _cooldown_key(ip: str) -> str:
    return f"cooldown:regenerate:{ip}"


def _regen_daily_key(ip: str) -> str:
    return f"ratelimit:regen_daily:{ip}"


def _gh_rate_key(ip: str, endpoint: str) -> str:
    return f"ratelimit:gh:{endpoint}:{ip}"


def _gh_rate_limit_or_429(endpoint: str):
    """Returns a Flask response if rate-limited, else None."""
    ip = get_client_ip()
    allowed, count = rate_limit.check_and_consume(
        _gh_rate_key(ip, endpoint), GH_RATE_LIMIT_MAX, GH_RATE_LIMIT_WINDOW
    )
    if not allowed:
        return (
            jsonify(
                {
                    "error": "Rate limit exceeded",
                    "message": f"Max {GH_RATE_LIMIT_MAX} requests per minute",
                }
            ),
            429,
        )
    return None


# ---------------------------------------------------------------------------
# /api/regenerate — OpenAI proxy with 30s per-IP cooldown
# ---------------------------------------------------------------------------


def _fantasy_addition_for(section: str) -> str:
    if section == "about":
        return """
        Transform ALL content by incorporating fantasy elements similar to those from Lord of the Rings, Narnia, or Game of Thrones.

        For the display_name field:
        1. Create an epic fantasy name that MUST include 'Christopher' or 'Chris'
        2. Add a fantasy title or epithet that reflects mastery over data and technology
        3. Example: 'Christopher the Dataweaver, Architect of Digital Realms'
        4. Never return the exact input name

        For EVERY bio and achievement:
        1. Reframe EACH technical accomplishment as an epic quest or magical feat
        2. Transform EVERY technical tool and platform into a mystical artifact or enchanted realm
           - For example: 'BigQuery' becomes 'the Great Archives of Knowledge'
           - 'Kubernetes' becomes 'the Ancient Orchestrator of Realms'
           - 'Python' becomes 'the Serpent's Tongue of Command'
        3. Turn ALL metrics and improvements into legendary achievements
           - Example: "90% reduction in processing time" becomes "banished 90% of the time-consuming dark forces"
        4. Convert EVERY team collaboration into an epic alliance or fellowship
        5. Transform EACH technical challenge into a battle with mythical creatures or dark forces
        6. Keep all numerical metrics exactly the same, but frame them in fantasy terms

        IMPORTANT: EVERY single piece of text must be transformed into fantasy style while preserving the core professional impact. Do not leave any text in its original form.
        """
    return """
    Transform this content by incorporating fantasy elements similar to those from Lord of the Rings, Narnia, or Game of Thrones.
    Blend real accomplishments with fantasy elements while keeping the core information clear and accurate.
    """


_PROMPTS = {
    "about": {
        "system": "You are a creative writer who specializes in professional biographies and achievements. You MUST rewrite ALL text content while preserving the core meaning and facts. Return ONLY valid JSON with no prefixes or additional text.",
        "format": "Return ONLY the JSON object with no prefixes or additional text. You MUST rewrite EVERY text field with new phrasing while maintaining the same core information.\n\nFor ALL text content (display_name, bio, etc.):\n1. EVERY single text field must be rewritten with new phrasing\n2. Maintain the same core accomplishments and facts\n3. Use varied sentence structures and strong action verbs\n4. Keep all numerical metrics (percentages, numbers) exactly the same\n5. Do not copy any full sentences from the original text\n\nFor the display_name field:\n1. Create a professional variation that includes 'Christopher' or 'Chris'\n2. Never return the exact input name\n3. Example format: 'Christopher T. Rogers' or 'Chris Rogers'\n",
    },
    "portfolio": {
        "system": "You are a technical and creative writer who specializes in professional portfolios. You MUST rewrite ALL text content in the portfolio (experience, education, skills, projects, music) while preserving the core meaning and facts. Return ONLY valid JSON with no prefixes or additional text.",
        "format": "Return ONLY the JSON object with no prefixes or additional text. You MUST rewrite EVERY text field in experience, education, skills, projects, and music with new wording while maintaining the same core information.\n\nFor ALL text content (titles, descriptions, achievements, etc.):\n1. EVERY single text field must be rewritten with new phrasing\n2. Maintain the same core accomplishments and facts\n3. Use varied sentence structures and strong action verbs\n4. Keep all numerical metrics (percentages, numbers) exactly the same\n5. Do not copy any full sentences from the original text\n\nFor experience, education, skills, projects, and music:\n- Experience: Rewrite job titles, company names, periods, and achievements.\n- Education: Rewrite school names, degrees, and years.\n- Skills: Rewrite each skill with a new phrasing or synonym.\n- Projects: Rewrite project titles, descriptions, and technologies.\n- Music: Rewrite track titles, album names, and years.\n",
    },
    "projects": {
        "system": "You are a technical writer who specializes in project descriptions. Return ONLY valid JSON with no prefixes or additional text. Keep the core project details accurate but present them in a new, engaging way.",
        "format": "Return ONLY the JSON array with no prefixes or additional text, maintaining the same structure but with rewritten descriptions. Keep technologies and links unchanged.",
    },
    "music": {
        "system": "You are a music industry writer who specializes in describing musical works and achievements. Return ONLY valid JSON with no prefixes or additional text. Keep the core details accurate but present them in a fresh, exciting way.",
        "format": "Return ONLY the JSON array with no prefixes or additional text, maintaining the same structure but with rewritten descriptions. Keep years and links unchanged.",
    },
}

_DEFAULT_PROMPT = {
    "system": "You are a professional writer who specializes in creative content regeneration. You MUST rewrite ALL text content while preserving the core meaning. Return ONLY valid JSON with no prefixes or additional text.",
    "format": "Return ONLY the JSON content with no prefixes or additional text. You MUST rewrite EVERY text field with new phrasing while maintaining the same core information. Never return any text exactly as it appeared in the input.",
}


@app.route("/api/regenerate", methods=["POST"])
def regenerate_content():
    client_ip = get_client_ip()
    remaining = rate_limit.get_cooldown_remaining(_cooldown_key(client_ip))
    if remaining > 0:
        return (
            jsonify(
                {
                    "success": False,
                    "error": "Ability on cooldown",
                    "cooldown_remaining": remaining,
                    "cooldown_total": COOLDOWN_SECONDS,
                }
            ),
            429,
        )

    allowed, _count = rate_limit.check_and_consume(
        _regen_daily_key(client_ip), REGEN_DAILY_MAX, REGEN_DAILY_WINDOW
    )
    if not allowed:
        return (
            jsonify(
                {
                    "success": False,
                    "error": "Daily limit reached",
                    "message": f"Max {REGEN_DAILY_MAX} regenerations per day",
                }
            ),
            429,
        )

    if openai_client is None:
        return jsonify(
            {"success": False, "error": "OpenAI API key not configured"}
        ), 500

    data = request.get_json(silent=True)
    if not data:
        return jsonify({"success": False, "error": "No data provided"}), 400

    section = data.get("section")
    content = data.get("content")
    is_full_regeneration = data.get("is_full_regeneration", False)
    use_fantasy = data.get("use_fantasy", False)
    regenerate_target = content.get("regenerate_target") if content else None

    if not section:
        return jsonify({"success": False, "error": "Section not specified"}), 400

    section_prompt = dict(_PROMPTS.get(section, _DEFAULT_PROMPT))

    if use_fantasy:
        section_prompt["format"] += _fantasy_addition_for(section)

    if section == "about" and regenerate_target and not is_full_regeneration:
        target_instructions = {
            "bio": "\nOnly rewrite the 'bio' field, keeping all other fields exactly the same.",
            "citadel": "\nOnly rewrite the achievements for the Citadel employment entry, keeping all other content exactly the same.",
            "meta": "\nOnly rewrite the achievements for the Meta employment entry, keeping all other content exactly the same.",
            "msk": "\nOnly rewrite the achievements for the Memorial Sloan Kettering employment entry, keeping all other content exactly the same.",
        }
        if regenerate_target in target_instructions:
            section_prompt["format"] += target_instructions[regenerate_target]

    try:
        response = openai_client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": section_prompt["system"]},
                {
                    "role": "user",
                    "content": (
                        f"Original content: {json.dumps(content)}\n\n"
                        f"Formatting instructions: {section_prompt['format']}\n\n"
                        "Please rewrite this content, paying special attention to "
                        "achievements if they exist. Each achievement should be "
                        "rewritten to be more impactful while maintaining the same "
                        "core accomplishments and metrics."
                    ),
                },
            ],
            temperature=0.7,
        )
        new_content = response.choices[0].message.content
    except openai.OpenAIError as e:
        logger.error("OpenAI error: %s", e)
        return jsonify({"success": False, "error": "Content generation failed"}), 500

    try:
        parsed = json.loads(new_content)
    except json.JSONDecodeError:
        return (
            jsonify(
                {
                    "success": False,
                    "error": "Invalid response from upstream service",
                    "raw_content": new_content,
                }
            ),
            400,
        )

    rate_limit.start_cooldown(_cooldown_key(client_ip), COOLDOWN_SECONDS)
    return jsonify(
        {
            "success": True,
            "content": parsed,
            "cooldown_total": COOLDOWN_SECONDS,
        }
    )


@app.route("/api/limits", methods=["GET"])
def get_usage_info():
    client_ip = get_client_ip()
    remaining = rate_limit.get_cooldown_remaining(_cooldown_key(client_ip))
    return jsonify(
        {
            "cooldown_remaining": remaining,
            "cooldown_total": COOLDOWN_SECONDS,
            "is_on_cooldown": remaining > 0,
        }
    )


# ---------------------------------------------------------------------------
# GitHub endpoints
# ---------------------------------------------------------------------------


@app.route("/api/v1/github/repo/<repo_name>", methods=["GET"])
def get_repository(repo_name):
    if (resp := _gh_rate_limit_or_429("repo")) is not None:
        return resp
    is_valid, error_msg = validate_repo_name(repo_name)
    if not is_valid:
        return jsonify({"error": error_msg}), 400

    try:
        r = requests.get(
            f"{GITHUB_API}/repos/{GITHUB_USERNAME}/{repo_name}",
            headers=github_headers(),
            timeout=10,
        )
        r.raise_for_status()
        return jsonify(r.json())
    except requests.RequestException as e:
        status = (
            e.response.status_code if getattr(e, "response", None) is not None else 500
        )
        return jsonify({"error": "Failed to fetch repository from GitHub"}), status


@app.route("/api/v1/github/readme/<repo_name>", methods=["GET"])
def get_readme(repo_name):
    if (resp := _gh_rate_limit_or_429("readme")) is not None:
        return resp
    is_valid, error_msg = validate_repo_name(repo_name)
    if not is_valid:
        return jsonify({"error": error_msg}), 400

    try:
        r = requests.get(
            f"{GITHUB_API}/repos/{GITHUB_USERNAME}/{repo_name}/readme",
            headers=github_headers(),
            timeout=10,
        )
        if r.status_code == 404:
            return jsonify({"error": "README not found"}), 404
        r.raise_for_status()
        return jsonify(r.json())
    except requests.RequestException as e:
        status = (
            e.response.status_code if getattr(e, "response", None) is not None else 500
        )
        return jsonify({"error": "Failed to fetch README from GitHub"}), status


@app.route("/api/v1/github/languages/<repo_name>", methods=["GET"])
def get_repo_languages(repo_name):
    if (resp := _gh_rate_limit_or_429("languages_repo")) is not None:
        return resp
    is_valid, error_msg = validate_repo_name(repo_name)
    if not is_valid:
        return jsonify({"error": error_msg}), 400

    try:
        r = requests.get(
            f"{GITHUB_API}/repos/{GITHUB_USERNAME}/{repo_name}/languages",
            headers=github_headers(),
            timeout=10,
        )
        r.raise_for_status()
        return jsonify(r.json())
    except requests.RequestException as e:
        status = (
            e.response.status_code if getattr(e, "response", None) is not None else 500
        )
        return jsonify({"error": "Failed to fetch languages from GitHub"}), status


@app.route("/api/v1/github/languages", methods=["GET"])
def get_all_languages_v1():
    if (resp := _gh_rate_limit_or_429("languages_all")) is not None:
        return resp
    try:
        repos_response = requests.get(
            f"{GITHUB_API}/users/{GITHUB_USERNAME}/repos?per_page=100",
            headers=github_headers(),
            timeout=10,
        )
        repos_response.raise_for_status()
        repos = repos_response.json()

        all_languages: dict[str, int] = {}
        for repo in repos:
            if repo.get("fork"):
                continue
            lang_response = requests.get(
                f"{GITHUB_API}/repos/{GITHUB_USERNAME}/{repo['name']}/languages",
                headers=github_headers(),
                timeout=10,
            )
            if lang_response.ok:
                for lang, bytes_count in lang_response.json().items():
                    all_languages[lang] = all_languages.get(lang, 0) + bytes_count

        return jsonify(all_languages)
    except requests.RequestException:
        return jsonify({"error": "Failed to aggregate languages from GitHub"}), 500


@app.route("/api/v1/github/contributions", methods=["GET"])
def get_contributions():
    if (resp := _gh_rate_limit_or_429("contributions")) is not None:
        return resp

    github_token = os.environ.get("GITHUB_TOKEN")
    if not github_token:
        return jsonify({"error": "GitHub token required for contribution data"}), 500

    query = """
    query($username: String!) {
        user(login: $username) {
            contributionsCollection {
                contributionCalendar {
                    totalContributions
                    weeks {
                        contributionDays {
                            date
                            contributionCount
                            contributionLevel
                        }
                    }
                }
            }
        }
    }
    """

    try:
        response = requests.post(
            "https://api.github.com/graphql",
            headers={
                "Authorization": f"bearer {github_token}",
                "Content-Type": "application/json",
            },
            json={"query": query, "variables": {"username": GITHUB_USERNAME}},
            timeout=10,
        )
        response.raise_for_status()
        data = response.json()

        if "errors" in data:
            return jsonify({"error": "GraphQL query failed"}), 500

        calendar = data["data"]["user"]["contributionsCollection"][
            "contributionCalendar"
        ]
        level_map = {
            "NONE": 0,
            "FIRST_QUARTILE": 1,
            "SECOND_QUARTILE": 2,
            "THIRD_QUARTILE": 3,
            "FOURTH_QUARTILE": 4,
        }
        weeks = [
            [
                {
                    "date": day["date"],
                    "count": day["contributionCount"],
                    "level": level_map.get(day["contributionLevel"], 0),
                }
                for day in week["contributionDays"]
            ]
            for week in calendar["weeks"]
        ]
        return jsonify({"total": calendar["totalContributions"], "weeks": weeks})
    except requests.RequestException:
        return jsonify({"error": "Failed to fetch contributions from GitHub"}), 500


@app.errorhandler(429)
def ratelimit_handler(e):
    return (
        jsonify(
            {
                "error": "Rate limit exceeded",
                "message": str(getattr(e, "description", "")),
            }
        ),
        429,
    )


if __name__ == "__main__":
    app.run(debug=_DEBUG, port=5001)

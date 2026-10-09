"""Exercise the real workflow shell with a mocked GitHub branch-head lookup.

No deployment is contacted and the fixture credentials are invented.
"""

import os
import subprocess
from pathlib import Path

import pytest
import yaml

WORKFLOW = yaml.safe_load((Path(__file__).resolve().parents[1] / ".github/workflows/smoke.yml").read_text())
JOBS = WORKFLOW["jobs"]


@pytest.fixture
def run_step(tmp_path):
    fake_curl = tmp_path / "curl"
    fake_curl.write_text(
        '#!/bin/bash\nprintf "%s\\n" "$*" >> "$CURL_LOG"\n'
        'printf "%s\\n%s" "$BRANCH_REPLY" "$BRANCH_CODE"\nexit "$CURL_EXIT"\n'
    )
    fake_curl.chmod(0o755)

    def run(job="eligibility", **overrides):
        output = tmp_path / "output"
        summary = tmp_path / "summary"
        curl_log = tmp_path / "curl-log"
        env = {
            **os.environ,
            "PATH": f"{tmp_path}{os.pathsep}{os.environ['PATH']}",
            "GITHUB_OUTPUT": str(output),
            "GITHUB_STEP_SUMMARY": str(summary),
            "ENVIRONMENT": "Preview",
            "REPOSITORY": "chrisrogers37/crog-gg",
            "SHA": "example-commit",
            "GH_TOKEN": "fixture-github-credential",
            "DEPLOYMENT_URL": "https://deployment.example/",
            "SITE_URL": "",
            "HAS_BYPASS": "false",
            "BRANCH_REPLY": '[{"name":"example-branch"}]',
            "BRANCH_CODE": "200",
            "CURL_EXIT": "0",
            "CURL_LOG": str(curl_log),
            "BASE": "https://deployment.example",
            "BYPASS": "fixture-bypass-credential",
            **overrides,
        }
        script = JOBS[job]["steps"][0]["run"]
        result = subprocess.run(["bash", "-e", "-c", script], env=env, cwd=tmp_path, capture_output=True, text=True)
        values = dict(line.split("=", 1) for line in output.read_text().splitlines()) if output.exists() else {}
        return (
            result,
            values,
            summary.read_text() if summary.exists() else "",
            curl_log.read_text() if curl_log.exists() else "",
        )

    return run


def test_missing_preview_bypass_skips_without_contacting_any_host(run_step):
    result, output, summary, requests = run_step()
    assert result.returncode == 0
    assert output == {"run_smoke": "false", "use_bypass": "false"}
    assert "no deployment checks ran" in summary
    assert "No automation bypass secret" in summary
    assert requests == ""


def test_own_branch_head_is_eligible_for_protected_deployment(run_step):
    result, output, summary, requests = run_step(HAS_BYPASS="true")
    assert result.returncode == 0
    assert output == {"run_smoke": "true", "use_bypass": "true", "base": "https://deployment.example"}
    assert "separate Smoke job" in summary
    assert "branches-where-head" in requests
    assert "fixture-bypass-credential" not in requests + result.stdout + summary


@pytest.mark.parametrize(
    "lookup",
    [
        {"BRANCH_REPLY": "[]"},  # Fork, or a branch that moved to another commit.
        {"BRANCH_REPLY": '{"message":"unavailable"}', "BRANCH_CODE": "503"},
        {"BRANCH_REPLY": "", "BRANCH_CODE": "000", "CURL_EXIT": "7"},
    ],
)
def test_unverified_branch_never_becomes_eligible(run_step, lookup):
    result, output, summary, requests = run_step(HAS_BYPASS="true", **lookup)
    assert result.returncode == 0
    assert output == {"run_smoke": "false", "use_bypass": "false"}
    assert "no deployment checks ran" in summary
    assert "could not be verified" in summary
    assert "fixture-bypass-credential" not in requests + result.stdout + summary


@pytest.mark.parametrize("bypass", ["true", "false"])
def test_public_production_fallback_never_uses_bypass(run_step, bypass):
    result, output, _, _ = run_step(
        ENVIRONMENT="Production", SITE_URL="https://public.example/", HAS_BYPASS=bypass, BRANCH_REPLY="[]"
    )
    assert result.returncode == 0
    assert output == {"run_smoke": "true", "use_bypass": "false", "base": "https://public.example"}


def test_owner_production_without_a_safe_target_fails(run_step):
    result, output, summary, _ = run_step(ENVIRONMENT="Production")
    assert result.returncode == 1
    assert output["run_smoke"] == "false"
    assert "Production can't be checked" in summary


def test_a_forks_production_can_skip_when_not_configured(run_step):
    result, output, summary, _ = run_step(ENVIRONMENT="Production", REPOSITORY="example/fork")
    assert result.returncode == 0
    assert output["run_smoke"] == "false"
    assert "no deployment checks ran" in summary


def test_smoke_rechecks_branch_head_before_sending_a_header(run_step):
    result, _, summary, requests = run_step(job="smoke", BRANCH_REPLY="[]")
    assert result.returncode == 1
    assert "branch-head verification failed" in summary
    assert "branches-where-head" in requests
    assert "https://deployment.example" not in requests
    assert "fixture-bypass-credential" not in requests + result.stdout + summary


def test_only_the_conditional_smoke_job_receives_the_bypass_secret():
    assert WORKFLOW["permissions"] == {"contents": "read"}
    assert "BYPASS" not in JOBS["eligibility"]["env"]
    assert JOBS["smoke"]["needs"] == "eligibility"
    assert JOBS["smoke"]["if"] == "needs.eligibility.outputs.run_smoke == 'true'"
    assert JOBS["smoke"]["env"]["BYPASS"] == (
        "${{ needs.eligibility.outputs.use_bypass == 'true' && secrets.VERCEL_AUTOMATION_BYPASS_SECRET || '' }}"
    )

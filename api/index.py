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
import random
import re
import threading
import time
from concurrent.futures import ThreadPoolExecutor

import httpx
import openai
import requests
from flask import Flask, jsonify, request
from flask_cors import CORS

from api._lib import cache, rate_limit, redis_client
from api._lib.github_proxy import (
    GITHUB_TIMEOUT_S,
    _cdn_cached,
    _fetch_public_repo,
    _gh_rate_limit_or_429,
    _guard_repo_request,
    _proxy_sub_resource,
    _repository_fields,
)
from api._lib.prompts import (
    _FACT_ANCHOR,
    _INJECTION_GUARD,
    _LENGTH_ANCHOR,
    _LITERAL_ANCHOR,
    _LORE_REGISTERS,
    _PROMPTS,
    _SHAPE_ANCHOR,
    _TONE_ANCHOR,
    _VERBATIM_STRINGS,
    _fantasy_addition_for,
    _variation_directive,
)
from api._lib.request_utils import (
    GITHUB_API,
    GITHUB_TOKEN,
    GITHUB_USERNAME,
    Visitor,
    current_visitor,
    github_headers,
)

logging.basicConfig(level=logging.INFO, format="%(levelname)s - %(name)s - %(message)s")
logger = logging.getLogger("crog")

app = Flask(__name__)

# Cap request bodies (#90). Only /api/regenerate accepts a POST body; 64KB is
# generous for portfolio content and bounds both parse memory and the prompt
# size forwarded to OpenAI. The GitHub routes are GET, so this is a no-op there.
app.config["MAX_CONTENT_LENGTH"] = 64 * 1024

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
    allow_headers=["Content-Type"],
    methods=["GET", "POST", "OPTIONS"],
)

OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")
# One model call's time limit, and the SDK's own limit for connecting, which
# applies to the TCP connect and again to the TLS handshake. _create_within
# shortens the call limit to what's left of the press's deadline (#195 M37);
# the client's copy is the backstop for any call that doesn't pass its own.
_OPENAI_CALL_SECONDS = 20.0
_OPENAI_CONNECT_SECONDS = openai.DEFAULT_TIMEOUT.connect


def _make_openai_client(api_key: str) -> openai.OpenAI:
    """No SDK retries: it sleeps up to 60 s on a Retry-After, past the press's
    deadline. ``_create_within`` retries inside it (#195 M37).
    """
    timeout = openai.Timeout(_OPENAI_CALL_SECONDS, connect=_OPENAI_CONNECT_SECONDS)
    return openai.OpenAI(api_key=api_key, timeout=timeout, max_retries=0)


openai_client = _make_openai_client(OPENAI_API_KEY) if OPENAI_API_KEY else None

# The rewrite model. This is a public button anyone can press, so the pick is
# governed by cost and latency per call rather than raw capability -- it is
# rewriting a short bio, not reasoning. Prefer the current model generation's
# small tier: it keeps cost per call below the previous pick while staying far
# from a retirement date, so this endpoint is not re-migrated on someone else's
# schedule.
OPENAI_MODEL = "gpt-5.6-luna"

# Sampling parameters belong with the model choice, not hardcoded at the call
# site: which ones are legal depends entirely on which model is selected. The
# current generation accepts only the default temperature and rejects any
# explicit value outright, so passing one fails every call rather than degrading
# -- swapping the model without revisiting this is how that happens silently.
#
# The model reasons by default: on Preview a real press spent 512 and 404
# reasoning tokens of 876 and 1066 completion tokens (#194 M12). A rewrite needs
# little of it, and reasoning counts against _MAX_COMPLETION_TOKENS, so it's low.
OPENAI_SAMPLING: dict = {"reasoning_effort": "low"}

COOLDOWN_SECONDS = 30
# The whole press's time budget (#195 M37). An attempt can spend the connect
# limit twice (TCP, then TLS) on top of what it was given, so this leaves room
# for that under vercel.json's maxDuration (60 s): the handler answers before
# the platform cuts the function off.
REGEN_DEADLINE_SECONDS = 45
REGEN_DAILY_MAX = 30
REGEN_DAILY_WINDOW = 86400
# Section rewrites per rolling 24 h across all visitors (#194 M11), the ceiling
# per-visitor caps can't give, since anyone can bring more addresses. Size it
# as the monthly OpenAI budget / (30 x the WORST-case cost of one rewrite):
# MAX_SECTION_CHARS of input plus _MAX_COMPLETION_TOKENS of output. Someone
# using many addresses can make every rewrite the worst case, not the average.
REGEN_GLOBAL_DAILY_MAX = 300
REGEN_GLOBAL_KEY = "spend:regen_global"
# The largest section a press may send, measured as it goes into the prompt
# (#194 M11). The shipped sections are about 1.7 KB and 3.9 KB.
MAX_SECTION_CHARS = 12_000

# Server-side cache for the /languages aggregate fan-out (#91). That endpoint
# makes 1 + N GitHub calls (N = non-fork repos); caching the result bounds the
# fan-out to at most once per hour per warm cache, so a burst of client requests
# can't exhaust the GITHUB_TOKEN quota. Language stats change rarely, so a 1h
# staleness window is an acceptable trade.
CACHE_ALL_LANGUAGES_KEY = "cache:all_languages"
CACHE_ALL_LANGUAGES_TTL = 3600


def _cooldown_key(visitor: Visitor) -> str:
    return f"cooldown:regenerate:{visitor.id}"


def _regen_daily_key(visitor: Visitor) -> str:
    return f"ratelimit:regen_daily:{visitor.id}"


# ---------------------------------------------------------------------------
# /api/regenerate — OpenAI proxy with 30s per-IP cooldown
# ---------------------------------------------------------------------------


# Fields the model is never allowed to author, by section. The section prompts
# instruct a rewrite of EVERY text field with no carve-out, and these values are
# rendered straight into an `href` by the client -- `social_links` into <a href>
# and `email` into a mailto: link. A rewritten value there is a live link
# pointing wherever the model chose, so restore the caller-supplied value after
# parsing instead of trusting what came back.
#
# A prompt asking the model to leave links alone is not a substitute for an
# entry here: the prompt is a request, this is the enforcement. Any section
# whose payload reaches an href, src, or similar sink belongs in this table.
_UNAUTHORED_KEYS = {
    "about": ("social_links", "email"),
}

# The internal failure taxonomy. Stable, enumerable tokens rather than free text,
# because a reason you cannot count tells you about one incident instead of a
# pattern. Every failure path emits exactly one of these.
FAILURE_MODEL_ERROR = "model_error"
FAILURE_NOT_JSON = "not_json"
FAILURE_NOT_AN_OBJECT = "not_an_object"
FAILURE_EMPTY_OBJECT = "empty_object"
FAILURE_UNRELATED_OBJECT = "unrelated_object"
# The model sent no text: a refusal, a content filter or an empty `choices`.
FAILURE_EMPTY_RESPONSE = "empty_response"
# The section's worker raised something no other reason covers.
FAILURE_UNEXPECTED = "unexpected"
# The rewrite is over MAX_SECTION_CHARS. The client would send it back as the
# next press's input and get a 413 every time from then on (#194 M11).
FAILURE_TOO_LONG = "too_long"
# The model ran out of max_completion_tokens before it finished (#194 M12).
FAILURE_TRUNCATED = "truncated"

# Output bounds per call (#194 M12): no completion runs longer than this,
# whatever the input asks for. Reasoning tokens count against it too. Set to
# about twice the largest completion real presses produced on Preview, with
# low reasoning effort: about 530 and 662, portfolio 857 and 768. Keep them
# well under what the section cap would take back (MAX_SECTION_CHARS / ~3.5
# characters per token), since output beyond that can only be billed and then
# refused as too_long.
_MAX_COMPLETION_TOKENS = {"about": 1500, "portfolio": 2000}


def _describe_failure(exc) -> tuple[dict, dict]:
    """Why a model call failed, split into ``(public, private)`` (#199).

    Configuration faults -- a rejected parameter, a model the account cannot
    reach, an exhausted quota -- present as a total outage: every call fails
    identically, and a bare 500 makes them impossible to diagnose from outside.
    So ``public`` keeps the two short machine tokens that name the cause
    (`status` and `code`, e.g. 400 and `unsupported_value`) and goes back to the
    caller. ``private`` holds the provider's own words (`message`), the
    parameter it names and the exception type. That text is the provider's, not
    ours, so it goes only into the server log, and into Preview responses,
    which sit behind Vercel's login.
    """
    body = getattr(exc, "body", None)
    # The SDK unwraps OpenAI's {"error": {...}} envelope before it raises, so
    # exc.body is usually the inner object already; accept either shape.
    err = body.get("error", body) if isinstance(body, dict) else None
    err = err if isinstance(err, dict) else {}
    public = {"status": getattr(exc, "status_code", None), "code": err.get("code")}
    private = {"type": type(exc).__name__, "param": err.get("param"), "message": str(exc)[:300]}
    return public, private


def _fail(section: str, reason: str, log_only: str = "", log_detail: dict | None = None, **detail):
    """Record a failed section and return it in the caller's shape.

    Every failure routes through here, so the taxonomy reaches the log
    unconditionally and at ONE level. Split across two levels it is not one
    taxonomy but two half-populated ones -- readable for a single incident and
    useless for a pattern.

    ``reason`` is the token to aggregate on. ``detail`` rides along in the
    response; ``log_only`` and ``log_detail`` never leave the server.
    """
    failure = {"reason": reason, **detail}
    sample = f" sample={log_only[:200]!r}" if log_only else ""
    logger.error("regeneration failed: section=%s %s%s", section, {**failure, **(log_detail or {})}, sample)
    return None, failure


def _prompt_json(content) -> str:
    """``content`` as JSON that can't close the <user_content> tag around it.

    json.dumps leaves ``<`` and ``>`` alone, so a value containing
    ``</user_content>`` would end the data block early and turn the rest of the
    visitor's text into instructions. ``\\u003c`` and ``\\u003e`` are the same
    characters to any JSON reader, so the model still sees the content unchanged.
    """
    return json.dumps(content).replace("<", "\\u003c").replace(">", "\\u003e")


def _section_rejection(parsed, original: dict):
    """Why a parsed model response cannot stand in for the section it rewrites.

    Returns None when it can, or one of the taxonomy tokens when it cannot.
    Deliberately NOT a bool: the three rejections are three different incidents
    pointing at three different fixes -- the model ignored the JSON-object
    instruction, the model returned nothing, or the model rewrote something
    other than the section it was given. Collapsing them loses the only thing
    that makes a failure actionable.

    Well-formed JSON is not the same as a usable section. ``{}``, ``[]`` and a
    bare string all parse, and each one reaches the page as a blank section from
    an HTTP 200 this endpoint called a success.

    The bar is "recognisably the section it replaces", not a full schema: a
    rewrite legitimately returns a subset of the keys it was given, so requiring
    a fixed key set would reject real responses.

    Field-level renderability is the client's call, not this one. A section that
    is a section but carries one empty list still passes here, so the caller can
    keep the fields that did come back instead of losing the whole section.
    """
    if not isinstance(parsed, dict):
        return FAILURE_NOT_AN_OBJECT
    if not parsed:
        return FAILURE_EMPTY_OBJECT
    if not any(key in original for key in parsed):
        return FAILURE_UNRELATED_OBJECT
    return None


def _lost_paragraphs(original: dict, parsed: dict) -> list[str]:
    """Fields that arrived as several paragraphs and came back as one block.

    _SHAPE_ANCHOR asks for the structure back; a prompt cannot guarantee it. This
    is the other half of that pair, and it is deliberately a MEASUREMENT rather
    than a rejection: the loss is one-way, since the button feeds its output back
    in and the flattened copy is what the next press is handed, but discarding an
    otherwise good rewrite over formatting costs the visitor more than the wall
    of text does.

    Measured because the compliance rate is not otherwise knowable. The daily cap
    is 30 per IP shared across every visitor, so nobody can afford to press this
    enough times to establish a rate deliberately -- and a rate that cannot be
    established is one nobody can tell has regressed. Production presses it for
    free. That is the same argument the failure taxonomy above makes: a reason
    you cannot count tells you about one incident instead of a pattern.
    """
    lost = []
    for key, before in original.items():
        after = parsed.get(key)
        if not isinstance(before, str) or not isinstance(after, str):
            continue
        if len(_paragraphs(before)) > 1 and len(_paragraphs(after)) == 1:
            lost.append(key)
    return lost


def _paragraphs(text: str) -> list[str]:
    return [p for p in re.split(r"\n\s*\n", text) if p.strip()]


def _lost_verbatim(original: dict, parsed: dict) -> list[str]:
    """Strings that name an on-screen control and did not come back.

    Exact and false-positive-free, unlike the paragraph count: the string was
    either in the field it was sent in or it was not. Same measurement standing
    as _lost_paragraphs, and read from the same _VERBATIM_STRINGS table the
    prompt is built from so the two cannot drift.
    """
    lost = []
    for verbatim in _VERBATIM_STRINGS:
        for key, before in original.items():
            after = parsed.get(key)
            if not isinstance(before, str) or not isinstance(after, str):
                continue
            if verbatim in before and verbatim not in after:
                lost.append(f"{key}:{verbatim}")
    return lost


def _log_usage(section: str, usage, finish_reason, started: float) -> None:
    """One INFO line per completed call: what it cost and how it ended (#194 M12).

    Every completed call is billed, including ones whose output is refused
    later, so each gets a line. ``reasoning=`` shows whether the model spends
    reasoning tokens, which count against _MAX_COMPLETION_TOKENS.
    """
    logger.info(
        "regenerate.usage section=%s ms=%d prompt=%s completion=%s reasoning=%s finish=%s",
        section,
        (time.monotonic() - started) * 1000,
        getattr(usage, "prompt_tokens", None),
        getattr(usage, "completion_tokens", None),
        getattr(getattr(usage, "completion_tokens_details", None), "reasoning_tokens", None),
        finish_reason,
    )


# Worth one more try inside the deadline: the connection failed, connect
# timeouts included (APITimeoutError is an APIConnectionError), or OpenAI
# answered with a 5xx, so most likely nothing was generated. Not a read
# timeout: the model was still writing, a second try pays for that slow
# generation again and rarely fits in what's left. Not a 429 either, which a
# retry only makes worse.
_RETRYABLE = (openai.APIConnectionError, openai.InternalServerError)
# A retry needs at least this long left to be worth starting.
_RETRY_MIN_SECONDS = 10.0


def _create_within(section: str, deadline: float, **kwargs):
    """``chat.completions.create`` for ``section``, finished by ``deadline`` (a
    ``time.monotonic()`` value) (#195 M37). Each attempt may take what's left,
    at most _OPENAI_CALL_SECONDS, and one that fails retryably gets a second
    try while _RETRY_MIN_SECONDS or more remain.
    """
    for attempt in (1, 2):
        left = deadline - time.monotonic()
        # Connecting keeps its own limit. A bare number would give every phase
        # the whole budget, so one attempt could take twice what's left.
        timeout = openai.Timeout(max(1.0, min(_OPENAI_CALL_SECONDS, left)), connect=_OPENAI_CONNECT_SECONDS)
        try:
            return openai_client.chat.completions.create(timeout=timeout, **kwargs)
        except _RETRYABLE as exc:
            left = deadline - time.monotonic()
            # The SDK raises APITimeoutError from the httpx timeout behind it.
            if attempt == 2 or left < _RETRY_MIN_SECONDS or isinstance(exc.__cause__, httpx.ReadTimeout):
                raise
            logger.warning("regenerate.retry section=%s error=%s left=%.1f", section, type(exc).__name__, left)


def _regenerate_section(
    section: str, content: dict, use_fantasy: bool, register: str, tag: str | None, deadline: float
):
    """Rewrite one section through the model.

    Returns ``(parsed, failure)``: the parsed object and None on success, or
    None and a description of what went wrong. Returning rather than raising
    lets a multi-section request keep the sections that did succeed; returning
    the reason alongside is what stops a failure from being anonymous.

    ``tag`` is the visitor's ``client_tag``, sent as OpenAI's
    ``safety_identifier`` so abuse can be traced to one visitor rather than to
    the whole site's key. It's None when no salt is configured. ``deadline`` is
    when the whole press has to be answered by.
    """
    section_prompt = dict(_PROMPTS[section])

    if use_fantasy:
        section_prompt["format"] += _fantasy_addition_for(section)
        section_prompt["format"] += _variation_directive(register)

    started = time.monotonic()
    try:
        response = _create_within(
            section,
            deadline,
            model=OPENAI_MODEL,
            messages=[
                # The order is the reading order, not a precedence: role, then
                # the standing constraints -- treat input as data, do not grow,
                # do not drift off the person, keep the shape you were handed,
                # leave the names of on-screen controls alone, and never reach
                # for an em dash. Each is listed in the order it is defined
                # above. The mode-specific half rides section_prompt["format"].
                {
                    "role": "system",
                    "content": (
                        section_prompt["system"]
                        + _INJECTION_GUARD
                        + _LENGTH_ANCHOR
                        + _FACT_ANCHOR
                        + _SHAPE_ANCHOR
                        + _LITERAL_ANCHOR
                        + _TONE_ANCHOR
                    ),
                },
                {
                    "role": "user",
                    "content": (
                        "Rewrite the content provided between the <user_content> tags below.\n\n"
                        f"<user_content>\n{_prompt_json(content)}\n</user_content>\n\n"
                        f"Formatting instructions: {section_prompt['format']}\n\n"
                        "Pay special attention to achievements if they exist. Each "
                        "achievement should be rewritten to be more impactful while "
                        "maintaining the same core accomplishments and metrics."
                    ),
                },
            ],
            max_completion_tokens=_MAX_COMPLETION_TOKENS[section],
            # Both prompts' formats ask for JSON in words, which the API
            # requires before it accepts JSON mode.
            response_format={"type": "json_object"},
            **({"safety_identifier": tag} if tag else {}),
            **OPENAI_SAMPLING,
        )
        choice = response.choices[0] if response.choices else None
        new_content = getattr(getattr(choice, "message", None), "content", None)
        finish_reason = getattr(choice, "finish_reason", None)
        _log_usage(section, response.usage, finish_reason, started)
    except openai.OpenAIError as e:
        public, private = _describe_failure(e)
        if os.environ.get("VERCEL_ENV") == "preview":
            public = {**public, **private}
        return _fail(section, FAILURE_MODEL_ERROR, log_detail=private, **public)

    # Before the checks below: a cut-off completion is usually empty or broken
    # JSON too, and "truncated" is the reason that points at the fix.
    if finish_reason == "length":
        return _fail(section, FAILURE_TRUNCATED, max_completion_tokens=_MAX_COMPLETION_TOKENS[section])

    # Checked before parsing because json.loads(None) raises a TypeError, not
    # the JSONDecodeError caught below. Uncaught, it became an HTML 500 that
    # also threw away the sibling section the visitor had already paid for.
    if not isinstance(new_content, str) or not new_content.strip():
        return _fail(
            section,
            FAILURE_EMPTY_RESPONSE,
            finish_reason=finish_reason if isinstance(finish_reason, str) else None,
        )

    try:
        parsed = json.loads(new_content)
    except json.JSONDecodeError:
        return _fail(section, FAILURE_NOT_JSON, log_only=new_content or "")

    # A field that came in as a string has to come back as a non-empty one: an
    # object in the bio's text reached the page and turned it into the 404 page
    # (#196 M16). Dropped before validation, and counted; the fill below puts
    # the visitor's copy back.
    if isinstance(parsed, dict) and (
        dropped := sorted(
            k for k, v in parsed.items() if isinstance(content.get(k), str) and not (isinstance(v, str) and v.strip())
        )
    ):
        for key in dropped:
            del parsed[key]
        logger.warning("regenerate.field_type_dropped section=%s fields=%s", section, ",".join(dropped))

    # Validate what the MODEL returned, before anything is grafted onto it.
    # Order is load-bearing: the unauthored-key restore below adds keys from the
    # original, so an empty or unrelated object checked afterwards would inherit
    # `email` and `social_links` and pass as a usable section -- shipping the
    # blank section this check exists to stop.
    rejection = _section_rejection(parsed, content)
    if rejection is not None:
        return _fail(section, rejection, output_type=type(parsed).__name__)

    # A rewrite keeps the shape it was handed, so a key the input didn't have is
    # the model's invention. It goes before the restore below, and is counted:
    # a key that keeps appearing is a prompt that keeps drifting.
    if extra := sorted(key for key in parsed if key not in content):
        for key in extra:
            del parsed[key]
        logger.warning("regenerate.extra_keys_dropped section=%s keys=%s", section, ",".join(extra))

    # The model does not author URLs -- see _UNAUTHORED_KEYS. Assignment is
    # wholesale so nothing the model put under one of these keys survives. A
    # key the caller never sent is already gone, dropped just above.
    for key in _UNAUTHORED_KEYS.get(section, ()):
        if key in content:
            parsed[key] = content[key]

    # A rewrite is often partial. Fields the model left out keep the visitor's
    # copy, so a one-field rewrite never blanks the rest of the section,
    # whatever bundle sent the press (#196 M16).
    for key, value in content.items():
        parsed.setdefault(key, value)

    # Measured as the next press will send it, so the visitor keeps the copy
    # they have rather than one the section cap would refuse.
    if (size := len(_prompt_json(parsed))) > MAX_SECTION_CHARS:
        return _fail(section, FAILURE_TOO_LONG, chars=size)

    # Observed, not enforced -- see the two helpers for why each is a warning
    # rather than a rejection. Both are what makes the two prompt anchors above
    # falsifiable at all: without a count, "the model preserves structure" is a
    # claim no affordable number of presses could check.
    if flattened := _lost_paragraphs(content, parsed):
        logger.warning("regenerate.shape_lost section=%s fields=%s", section, ",".join(flattened))
    if renamed := _lost_verbatim(content, parsed):
        logger.warning("regenerate.verbatim_lost section=%s lost=%s", section, ",".join(renamed))

    return parsed, None


@app.errorhandler(rate_limit.RedisUnavailable)
def _metering_unavailable(_exc):
    """503 when a spend gate could not be consulted (#113).

    The cooldown and the daily caps, per visitor and site-wide, are the spend
    controls on /api/regenerate, and all of them live in Redis. If the limiter
    cannot be consulted, an "allow" turns a public button into an unmetered
    proxy to a paid API, so refusing is the cheaper failure: the endpoint
    rewrites cosmetic copy and the rest of the site is unaffected while it is
    paused.

    Registered at the app level rather than caught per call, so a gate added
    later is covered without anyone remembering to wrap it.
    """
    return (
        jsonify(
            {
                "success": False,
                "error": "Regeneration temporarily unavailable",
                "message": "Rate limiting is unavailable, so this endpoint is paused. Try again shortly.",
            }
        ),
        503,
    )


@app.route("/api/regenerate", methods=["POST"])
def regenerate_content():
    deadline = time.monotonic() + REGEN_DEADLINE_SECONDS
    visitor = current_visitor()

    data = request.get_json(silent=True)
    if not data:
        return jsonify({"success": False, "error": "No data provided"}), 400
    # A list, string, number or `true` passes the check above and would raise
    # an AttributeError at data.get() below: an HTML 500, before any metering.
    if not isinstance(data, dict):
        return jsonify({"success": False, "error": "Request body must be a JSON object"}), 400

    sections = data.get("sections")
    # SUMMON NEW LORE is the only caller and it always sends True, so a request
    # without the key is one that LOST it -- a stale cached bundle, a proxy that
    # stripped it -- not one asking for the plain rewrite. Defaulting to the plain
    # path made that loss silent and indistinguishable from the button doing
    # nothing: the copy comes back paraphrased, the name untouched, and no error
    # is raised anywhere to notice it by. Defaulting to the path the button means
    # makes the failure mode "it worked". The plain rewrite stays reachable, but
    # only for a caller that asks for it by name.
    if "use_fantasy" not in data:
        # Recorded rather than rejected. Defaulting keeps a stale bundle working,
        # which is why it defaults -- but a caller silently losing the key is
        # still a caller worth being able to count later.
        logger.warning("regenerate.use_fantasy_absent client=%s", visitor.id)
    use_fantasy = data.get("use_fantasy", True)

    # One user action is one request. `sections` maps each section name to the
    # content to rewrite, so a multi-section regeneration passes the cooldown
    # gate once instead of racing its own sibling requests through it.
    if not isinstance(sections, dict) or not sections:
        return jsonify({"success": False, "error": "sections must be a non-empty object"}), 400

    # Validate every section before metering or calling OpenAI (#89, #107).
    # Reject unknown names against the allowlist instead of falling through to a
    # permissive default prompt, and require each body to be an object so the
    # `.get()` calls downstream cannot raise an AttributeError -> uncaught 500.
    for name, section_content in sections.items():
        if name not in _PROMPTS:
            return jsonify({"success": False, "error": f"Invalid section: {name}"}), 400
        if not isinstance(section_content, dict):
            return jsonify({"success": False, "error": f"content for {name} must be an object"}), 400
        if len(_prompt_json(section_content)) > MAX_SECTION_CHARS:
            return jsonify({"success": False, "error": f"content for {name} is too long"}), 413

    if openai_client is None:
        return jsonify({"success": False, "error": "OpenAI API key not configured"}), 500

    # After validation, so a rejected request costs nothing (#107), and before
    # the daily caps, so a press refused here doesn't spend a daily slot.
    remaining = rate_limit.claim_cooldown(_cooldown_key(visitor), COOLDOWN_SECONDS)
    if remaining > 0:
        return (
            jsonify(
                {
                    "success": False,
                    "error": "Ability on cooldown",
                    "limit": "cooldown",
                    "cooldown_remaining": remaining,
                    "cooldown_total": COOLDOWN_SECONDS,
                }
            ),
            429,
        )

    # One slot per section in two daily windows, the visitor's and the site's
    # (#194 M11), so batching sections into a single request costs the same as
    # the calls it replaces. The visitor's goes first, so someone at their own
    # cap gets their 429, not the site's 503. Metered BEFORE the OpenAI calls
    # (#107) so a request that then errors has still spent its slots and a
    # caller cannot retry expensive generations by forcing errors.
    full = rate_limit.check_and_consume(
        {_regen_daily_key(visitor): REGEN_DAILY_MAX, REGEN_GLOBAL_KEY: REGEN_GLOBAL_DAILY_MAX},
        REGEN_DAILY_WINDOW,
        cost=len(sections),
    )
    if full == REGEN_GLOBAL_KEY:
        logger.warning("regenerate.global_cap_reached sections=%d", len(sections))
        # The cooldown was claimed first, so it's running: say so, and the page
        # counts it down instead of offering a press the server would refuse.
        return (
            jsonify(
                {
                    "success": False,
                    "error": "Daily regeneration budget reached",
                    "limit": "budget",
                    "cooldown_total": COOLDOWN_SECONDS,
                }
            ),
            503,
        )
    if full:
        # Like the budget's 503, this follows the cooldown claim, so one is running.
        return (
            jsonify(
                {
                    "success": False,
                    "error": "Daily limit reached",
                    "limit": "daily",
                    "message": f"Max {REGEN_DAILY_MAX} regenerations per day",
                    "cooldown_total": COOLDOWN_SECONDS,
                }
            ),
            429,
        )

    # Sampled once per request, not once per section: one press is one telling,
    # so every section has to land in the same world. Sampling inside the
    # per-section call would put a sea shanty beside a stat block on one press.
    register = random.choice(_LORE_REGISTERS)

    # Fan the model calls out so a multi-section rewrite costs one round trip of
    # wall clock rather than one per section. These are I/O-bound and the OpenAI
    # client is safe to share across threads.
    with ThreadPoolExecutor(max_workers=len(sections)) as pool:
        futures = {
            name: pool.submit(_regenerate_section, name, body, use_fantasy, register, visitor.tag, deadline)
            for name, body in sections.items()
        }
        results = {}
        for name, future in futures.items():
            try:
                results[name] = future.result()
            except Exception as exc:
                # One crashed section must not cost the others: the daily slots
                # for every section are already spent, and an exception raised
                # here would be an HTML 500 carrying none of the sections that
                # worked. The exception text stays in the log, never the response.
                logger.exception("regeneration crashed: section=%s", name)
                results[name] = _fail(name, FAILURE_UNEXPECTED, error_type=type(exc).__name__)

    regenerated = {name: parsed for name, (parsed, _reason) in results.items() if parsed is not None}
    failed = sorted(name for name, (parsed, _reason) in results.items() if parsed is None)
    # Why each section failed, carried to the caller. The server log is the
    # fuller record, but it is not reachable from a browser -- and a failure
    # nobody can see the cause of costs a round trip per guess to diagnose.
    failures = {name: reason for name, (parsed, reason) in results.items() if parsed is None and reason}

    # A section that failed must not discard the ones that worked: return what
    # was rewritten and name what was not, and fail the request only when
    # nothing at all came back.
    if not regenerated:
        return (
            jsonify(
                {
                    "success": False,
                    "error": "Content generation failed",
                    "failed_sections": failed,
                    "failures": failures,
                    # Metered already, so the cooldown is running (#196 M44).
                    "cooldown_total": COOLDOWN_SECONDS,
                }
            ),
            500,
        )

    return jsonify(
        {
            "success": True,
            "content": regenerated,
            "failed_sections": failed,
            "failures": failures,
            "cooldown_total": COOLDOWN_SECONDS,
        }
    )


@app.route("/api/limits", methods=["GET"])
def get_usage_info():
    """Cooldown state for this IP, or an explicit "could not tell" (#162).

    Stays available during an outage on purpose: this endpoint spends nothing,
    so a 503 would take a free read offline for no gain, and would look the
    same to anyone probing it as the API itself being down.

    What it must not do is answer anyway. A clear result here IS ``0``, so
    falling open to ``0`` made a total outage byte-identical to a healthy read
    -- the collision ``rate_limit``'s docstring names, reintroduced at the
    caller after the helper was hardened against it. So the two fields that
    would be inferences are withheld rather than captioned: a flag beside a
    confident ``0`` leaves the values a reader actually looks at still
    asserting something untrue.

    ``null`` is falsy in the browser, so a caller that ignores the flag still
    degrades toward letting the visitor press the button -- and /api/regenerate
    is the authority on that, failing closed with its own 503.
    """
    try:
        remaining = rate_limit.get_cooldown_remaining(_cooldown_key(current_visitor()))
    except rate_limit.RedisUnavailable:
        remaining = None
    return jsonify(
        {
            "cooldown_remaining": remaining,
            "cooldown_total": COOLDOWN_SECONDS,
            "is_on_cooldown": None if remaining is None else remaining > 0,
            # Reported in both states, never only when degraded: a field that
            # appears only on failure cannot be tested for the healthy case,
            # and its absence is ambiguous with an older deploy.
            "metering_available": remaining is not None,
        }
    )


# How long one health result is reused. A monitor polling every few minutes
# still sees fresh data, and a flood of requests costs one Redis PING and one
# GitHub call per instance every 30 s: the lock makes concurrent misses wait for
# a single refresh instead of each running their own.
HEALTH_CACHE_SECONDS = 30
_health_cache: dict = {}
_health_lock = threading.Lock()


def _redis_ping() -> bool:
    try:
        return redis_client.command("PING") == "PONG"
    except Exception as e:
        logger.warning("health check failed: check=redis_ping error=%s", type(e).__name__)
        return False


def _github_core_remaining():
    """GitHub's remaining core quota for this deployment, or None if unknown.

    /rate_limit doesn't count against the quota, and it fails once the token
    has expired or been revoked, which is the failure this check exists for.
    """
    try:
        r = requests.get(f"{GITHUB_API}/rate_limit", headers=github_headers(), timeout=5)
        r.raise_for_status()
        return r.json()["resources"]["core"]["remaining"]
    except (requests.RequestException, ValueError, KeyError, TypeError) as e:
        status = getattr(getattr(e, "response", None), "status_code", None)
        logger.warning("health check failed: check=github_core_remaining status=%s error=%s", status, type(e).__name__)
        return None


def _run_health_checks():
    """Run every check, the two network calls side by side, and stamp the result
    with the time it finished, so a slow refresh still counts its full 30 s."""
    with ThreadPoolExecutor(max_workers=2) as pool:
        ping = pool.submit(_redis_ping)
        remaining = pool.submit(_github_core_remaining)
        checks = {
            "openai_key": openai_client is not None,
            "redis_configured": redis_client.is_configured(),
            "redis_ping": ping.result(),
            "github_token": bool(GITHUB_TOKEN),
            "github_core_remaining": remaining.result(),
        }
    ok = (
        checks["openai_key"]
        and checks["redis_ping"]
        and (not checks["github_token"] or bool(checks["github_core_remaining"]))
    )
    return time.monotonic(), {"ok": ok, "checks": checks}, 200 if ok else 503


def _is_fresh(entry) -> bool:
    return entry is not None and time.monotonic() - entry[0] < HEALTH_CACHE_SECONDS


@app.route("/api/health", methods=["GET"])
def health():
    """Whether this deployment can serve its features, for an uptime monitor (#195).

    200 when the OpenAI key is set, Redis answers a PING, and the GitHub token
    (if one is set) still works and has quota left; 503 otherwise. The body
    always lists every check, so a 503 says which one failed. It never calls
    OpenAI, which would spend money on every poll. /api/limits isn't a health
    check either: it answers null on purpose during an outage.
    """
    entry = _health_cache.get("entry")
    if not _is_fresh(entry):
        with _health_lock:
            entry = _health_cache.get("entry")
            if not _is_fresh(entry):
                entry = _health_cache["entry"] = _run_health_checks()
    _at, body, status = entry
    response = jsonify(body)
    response.status_code = status
    response.headers["Cache-Control"] = "no-store"
    return response


# ---------------------------------------------------------------------------
# GitHub endpoints
# ---------------------------------------------------------------------------


@app.route("/api/v1/github/repo/<repo_name>", methods=["GET"])
def get_repository(repo_name):
    if (resp := _guard_repo_request(repo_name, "repo")) is not None:
        return resp
    # The public-repo guard already fetches the repo metadata, which IS this
    # endpoint's payload, so reuse it directly (one GitHub call, not two).
    data, error = _fetch_public_repo(repo_name, "repo")
    if error is not None:
        return error
    return _cdn_cached(jsonify(_repository_fields(data)))


@app.route("/api/v1/github/readme/<repo_name>", methods=["GET"])
def get_readme(repo_name):
    if (resp := _guard_repo_request(repo_name, "readme")) is not None:
        return resp
    _data, error = _fetch_public_repo(repo_name, "readme")
    if error is not None:
        return error
    # Ask for the root README explicitly. GitHub's /readme endpoint resolves
    # .github/README.md ahead of the root file, which surfaces a repo's CI or
    # contributing notes as if they were the project documentation. The fallback
    # covers repos with no root README.md (.rst/.txt, non-standard casing).
    return _proxy_sub_resource(
        repo_name,
        ("/contents/README.md", "/readme"),
        "README",
        "readme",
        missing_msg="README not found",
    )


@app.route("/api/v1/github/languages/<repo_name>", methods=["GET"])
def get_repo_languages(repo_name):
    if (resp := _guard_repo_request(repo_name, "languages_repo")) is not None:
        return resp
    _data, error = _fetch_public_repo(repo_name, "languages_repo")
    if error is not None:
        return error
    return _proxy_sub_resource(repo_name, "/languages", "languages", "languages_repo")


@app.route("/api/v1/github/languages", methods=["GET"])
def get_all_languages_v1():
    if (resp := _gh_rate_limit_or_429("languages_all")) is not None:
        return resp

    # A cache that can't be read is a refusal, not a miss: a miss fans out to
    # GitHub (1 + N calls), and during an Upstash outage every request would,
    # spending the token's quota for every project page (#194 M33).
    try:
        cached = cache.get_json(CACHE_ALL_LANGUAGES_KEY)
    except rate_limit.RedisUnavailable:
        return jsonify({"error": "Language stats are unavailable right now"}), 503
    if cached is not None:
        return jsonify(cached)

    try:
        repos_response = requests.get(
            f"{GITHUB_API}/users/{GITHUB_USERNAME}/repos?per_page=100",
            headers=github_headers(),
            timeout=GITHUB_TIMEOUT_S,
        )
        repos_response.raise_for_status()
        repos = repos_response.json()

        all_languages: dict[str, int] = {}
        for repo in repos:
            # Private repos are skipped like forks: a token that can see them
            # would otherwise add their languages to a public total (#199).
            if repo.get("fork") or repo.get("private"):
                continue
            lang_response = requests.get(
                f"{GITHUB_API}/repos/{GITHUB_USERNAME}/{repo['name']}/languages",
                headers=github_headers(),
                timeout=GITHUB_TIMEOUT_S,
            )
            if lang_response.ok:
                for lang, bytes_count in lang_response.json().items():
                    all_languages[lang] = all_languages.get(lang, 0) + bytes_count

        # Only reached once the aggregate is fully computed (past the point the
        # repo-list fetch could raise). Cache it so subsequent requests skip the
        # fan-out entirely until the TTL lapses.
        cache.set_json(CACHE_ALL_LANGUAGES_KEY, all_languages, CACHE_ALL_LANGUAGES_TTL)
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
            timeout=GITHUB_TIMEOUT_S,
        )
        response.raise_for_status()
        data = response.json()

        if "errors" in data:
            return jsonify({"error": "GraphQL query failed"}), 500

        calendar = data["data"]["user"]["contributionsCollection"]["contributionCalendar"]
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


@app.errorhandler(413)
def request_too_large(e):
    return jsonify({"success": False, "error": "Request body too large"}), 413


@app.errorhandler(429)
def ratelimit_handler(e):
    return (
        jsonify(
            {
                "error": "Rate limit exceeded",
                "message": "Too many requests",
            }
        ),
        429,
    )


if __name__ == "__main__":
    app.run(debug=_DEBUG, port=5001)

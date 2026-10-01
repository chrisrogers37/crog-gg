"""No log line or Redis key holds a visitor's address (#199 M75).

Rate-limit keys embedded the raw IP, so Redis and the limiter's ``key=`` error
lines held it, and one regenerate warning logged it outright. With a salt set,
both name the visitor by ``client_tag`` instead.
"""

import logging
from unittest.mock import MagicMock, patch

from api._lib.request_utils import client_tag

_IP = "203.0.113.7"


def test_a_press_leaves_no_address_in_keys_or_logs(client, salted, caplog):
    caplog.set_level(logging.INFO, logger="crog")
    choice = MagicMock(finish_reason="stop")
    choice.message.content = '{"bio": "rewritten"}'
    model = MagicMock()
    model.chat.completions.create.return_value = MagicMock(choices=[choice])

    with (
        patch("api.index.openai_client", model),
        patch("api.index.rate_limit.claim_cooldown", return_value=0) as claim,
        patch("api.index.rate_limit.check_and_consume", return_value=None) as consume,
        patch("api.index.rate_limit.get_cooldown_remaining", return_value=0) as read,
    ):
        # No use_fantasy, so the press logs the warning that used to carry the IP.
        client.post("/api/regenerate", json={"sections": {"about": {"bio": "hi"}}}, headers={"x-real-ip": _IP})
        client.get("/api/limits", headers={"x-real-ip": _IP})

    keys = [claim.call_args.args[0], *consume.call_args.args[0], read.call_args.args[0]]
    assert not any(_IP in key for key in keys)
    messages = [record.getMessage() for record in caplog.records]
    assert not any(_IP in message for message in messages)
    assert f"regenerate.use_fantasy_absent client={client_tag(_IP)}" in messages


def test_handlers_never_see_an_address():
    # Handlers get a Visitor from current_visitor(); the address and the
    # helpers that return it stay private to request_utils, so no handler can
    # put one in a log line or a key (#199 M75).
    import api.index as index

    assert not {"get_client_ip", "_client_ip", "_rate_limit_subject"} & set(vars(index))

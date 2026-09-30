"""The Upstash client's contract: a reply is a result, or it raises (#194).

Callers read ``None`` as Redis nil. An error item, a missing result or a reply
of the wrong shape has to raise instead, or it reaches the limiter as a value
it will count.
"""

from unittest.mock import patch

import pytest

from api._lib import redis_client


@pytest.mark.parametrize(
    "reply",
    [
        pytest.param({"error": "WRONGTYPE"}, id="error"),
        pytest.param({}, id="no-result"),
        pytest.param("OK", id="not-an-object"),
    ],
)
def test_command_raises_unless_the_reply_is_a_result(reply):
    with patch("api._lib.redis_client._post", return_value=reply):
        with pytest.raises(RuntimeError):
            redis_client.command("TTL", "k")


@pytest.mark.parametrize(
    "reply",
    [
        pytest.param([{"result": 1}, {"error": "OOM"}], id="error-item"),
        pytest.param([{"result": 1}, {}], id="no-result"),
        pytest.param([{"result": 1}, "OK"], id="item-not-an-object"),
        pytest.param([{"result": 1}], id="short"),
        pytest.param(None, id="not-a-list"),
    ],
)
def test_pipeline_raises_unless_every_command_got_a_result(reply):
    with patch("api._lib.redis_client._post", return_value=reply):
        with pytest.raises(RuntimeError):
            redis_client.pipeline([["ZCARD", "k"], ["TTL", "k"]])


def test_nil_is_a_result():
    with patch("api._lib.redis_client._post", return_value=[{"result": None}, {"result": 3}]):
        assert redis_client.pipeline([["GET", "k"], ["ZCARD", "k"]]) == [None, 3]

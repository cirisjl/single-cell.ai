"""Prompt/response log for the parameter-recommendation agent.

Every ``/api/agent/recommend`` request is appended as one JSON line to
``$AGENT_LOG_DIR/recommend-YYYY-MM-DD.jsonl``. A record holds the request
context, the exact messages sent to each LLM call, the model's raw reply and
the final response returned to the UI. Read it with ``agent/view_logs.py``.

Logging must never break a recommendation, so write errors are only printed.
Set ``AGENT_LOG_ENABLED=0`` to turn it off.
"""
from __future__ import annotations

import json
import os
import threading
from datetime import datetime
from typing import Any, Dict

LOG_DIR = os.getenv("AGENT_LOG_DIR", "/data/logs/agent")
ENABLED = os.getenv("AGENT_LOG_ENABLED", "1") not in ("0", "false", "False")

_lock = threading.Lock()  # recommend() runs in a threadpool


def log_path(day: datetime = None) -> str:
    day = day or datetime.now()
    return os.path.join(LOG_DIR, f"recommend-{day:%Y-%m-%d}.jsonl")


def write(record: Dict[str, Any]) -> None:
    if not ENABLED:
        return
    try:
        os.makedirs(LOG_DIR, exist_ok=True)
        line = json.dumps(record, ensure_ascii=False, default=str)
        with _lock, open(log_path(), "a", encoding="utf-8") as fh:
            fh.write(line + "\n")
    except Exception as exc:  # noqa: BLE001
        print(f"[agent.prompt_log] could not write log ({exc})")

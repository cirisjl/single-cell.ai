#!/usr/bin/env python3
"""Start the API / Celery / Flower with URL-safe, file-backed credentials.

No shell evaluation, no secrets in command-line arguments or log messages.
"""

import os
from pathlib import Path
import sys
from urllib.parse import quote


def read_secret(name):
    path = Path("/run/secrets") / name
    value = path.read_text(encoding="utf-8").rstrip("\r\n")
    if not value:
        raise SystemExit(f"Required secret {name} is empty")
    return value


def main():
    if len(sys.argv) < 2:
        raise SystemExit("Usage: celery-entrypoint.py PROGRAM [ARGS...]")
    user = quote(os.environ.get("RABBITMQ_DEFAULT_USER", "admin"), safe="")
    rabbit_password = quote(read_secret("rabbitmq_password"), safe="")
    redis_password = quote(read_secret("redis_password"), safe="")
    env = dict(os.environ)
    env["CELERY_BROKER_URL"] = (
        f"amqp://{user}:{rabbit_password}@oscb-rabbitmq:5672//"
    )
    env["CELERY_RESULT_BACKEND"] = (
        f"redis://:{redis_password}@oscb-redis:6388/0"
    )
    if (Path("/run/secrets") / "flower_basicauth_password").is_file():
        env["FLOWER_BASIC_AUTH"] = (
            "admin:" + read_secret("flower_basicauth_password")
        )
    os.execvpe(sys.argv[1], sys.argv[1:], env)


if __name__ == "__main__":
    main()

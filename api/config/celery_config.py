"""Celery queues and GPU-to-CPU fallback routing."""

import logging
import os
from functools import lru_cache

import redis
from celery import current_app as current_celery_app
from kombu import Queue

logger = logging.getLogger(__name__)

# A separate expiring key per GPU worker supports multiple workers and prevents
# an unclean shutdown from advertising GPU availability indefinitely.
GPU_HEARTBEAT_KEY_PREFIX = os.getenv(
    "CELERY_GPU_HEARTBEAT_KEY_PREFIX", "single_cell:celery:gpu_worker:"
)
GPU_HEARTBEAT_INTERVAL = max(
    1, int(os.getenv("CELERY_GPU_HEARTBEAT_INTERVAL", "10"))
)
GPU_HEARTBEAT_TTL = max(
    GPU_HEARTBEAT_INTERVAL * 3,
    int(os.getenv("CELERY_GPU_HEARTBEAT_TTL", "30")),
)
GPU_REDIS_TIMEOUT = max(
    0.1, float(os.getenv("CELERY_GPU_REDIS_TIMEOUT", "1"))
)


@lru_cache(maxsize=2)
def _redis_client(backend_url):
    """Reuse a short-timeout Redis connection pool in each process."""
    return redis.Redis.from_url(
        backend_url,
        socket_connect_timeout=GPU_REDIS_TIMEOUT,
        socket_timeout=GPU_REDIS_TIMEOUT,
    )


def gpu_heartbeat_client():
    """Use the same Redis instance/database as the Celery result backend."""
    url = current_celery_app.conf.result_backend
    if not url or not url.startswith(("redis://", "rediss://", "unix://")):
        raise RuntimeError("GPU worker heartbeat requires a Redis result backend")
    return _redis_client(url)


def gpu_worker_available():
    """True if at least one non-expired GPU worker heartbeat exists.

    A Redis failure means GPU availability is unknown; route GPU-capable tasks
    to the CPU queue rather than leave them on an unconsumed GPU queue.
    """
    try:
        client = gpu_heartbeat_client()
        return any(
            True for _ in client.scan_iter(match=f"{GPU_HEARTBEAT_KEY_PREFIX}*", count=10)
        )
    except (redis.RedisError, OSError, RuntimeError, ValueError):
        logger.debug("GPU heartbeat check failed; routing to CPU", exc_info=True)
        return False


def route_task(name, args, kwargs, options, task=None, **kw):
    """Keep the ``queue:task_name`` convention with GPU -> CPU fallback."""
    if ":" in name:
        queue, _ = name.split(":", 1)
        if queue == "gpu" and not gpu_worker_available():
            return {"queue": "cpu"}
        return {"queue": queue}
    return {"queue": "celery"}


class BaseConfig:
    CELERY_TASK_QUEUES = (
        Queue("celery"),
        Queue("cpu"),
        Queue("gpu"),
        Queue("web"),
        Queue("dataset"),
    )

    CELERY_TASK_ROUTES = (route_task,)


class DevelopmentConfig(BaseConfig):
    pass


@lru_cache()
def get_settings():
    config_cls_dict = {
        "development": DevelopmentConfig,
    }
    config_name = os.environ.get("CELERY_CONFIG", "development")
    config_cls = config_cls_dict[config_name]
    return config_cls()


settings = get_settings()

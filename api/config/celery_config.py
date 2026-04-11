import os
from functools import lru_cache
from kombu import Queue


def route_task(name, args, kwargs, options, task=None, **kw):
    if ":" in name:
        queue, _ = name.split(":")
        return {"queue": queue}
    return {"queue": "celery"}


class BaseConfig:
    # broker_url : str = os.environ.get("broker_url ", None)
    # result_backend: str = os.environ.get("result_backend", None)
    # rmg_pass = os.environ.get("RABBITMQ_PASSWORD")
    # rmg_port = os.environ.get("RABBITMQ_PORT")
    # redis_pass = os.environ.get("REDIS_PASSWORD")
    # redis_port = os.environ.get("REDIS_PORT")

    # broker_url  = f'amqp://admin:{rmg_pass}@oscb_rabbitmq:{rmg_port}//'
    # result_backend = f'redis://:{redis_pass}@oscb_redis:{redis_port}/0'
    # broker_url : str = "amqp://admin:dRlBRiklTEridrlQa89DI5os@oscb_rabbitmq:5672//"
    # result_backend: str = "redis://:b6tHecatruchlwRaSplZlXaV@oscb_redis:6388"

    # print(f"broker_url : {broker_url }")
    # print(f"result_backend: {result_backend}")

    CELERY_TASK_QUEUES: list = (
        # default queue
        Queue("celery"),
        # custom queue
        Queue("tools"),
        Queue("workflows"),
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

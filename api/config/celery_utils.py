"""Celery initialization, GPU worker heartbeats, and task utilities."""

import logging
import os
import threading
import uuid

from celery import current_app as current_celery_app
from celery.result import AsyncResult
from celery.signals import worker_ready, worker_shutdown

from .celery_config import (
    GPU_HEARTBEAT_INTERVAL,
    GPU_HEARTBEAT_KEY_PREFIX,
    GPU_HEARTBEAT_TTL,
    gpu_heartbeat_client,
    settings,
)
from constants.declarations import USER_STORAGE
from utils.mongodb import get_job_from_db

logger = logging.getLogger(__name__)


def read_secret(path: str) -> str:
    with open(path, "r", encoding="utf-8") as f:
        return f.read().strip()


rabbitmq_password = read_secret("/run/secrets/rabbitmq_password")
redis_password = read_secret("/run/secrets/redis_password")

broker_user = os.getenv("CELERY_BROKER_USER", "admin")
broker_host = os.getenv("CELERY_BROKER_HOST", "oscb-rabbitmq")
broker_port = os.getenv("RABBITMQ_PORT", "5672")

redis_host = os.getenv("CELERY_RESULT_BACKEND_HOST", "oscb-redis")
redis_port = os.getenv("REDIS_PORT", "6388")

broker_url = f"amqp://{broker_user}:{rabbitmq_password}@{broker_host}:{broker_port}//"
result_backend = f"redis://:{redis_password}@{redis_host}:{redis_port}/0"

# Never print broker_url/result_backend: both include credentials.


def create_celery():
    celery_app = current_celery_app
    celery_app.config_from_object(settings, namespace="CELERY")
    celery_app.conf.update(
        task_track_started=True,
        task_serializer="json",
        result_serializer="json",
        accept_content=["json"],
        result_persistent=True,
        worker_send_task_events=False,
        worker_prefetch_multiplier=1,
        broker_url=broker_url,
        result_backend=result_backend,
        broker_connection_retry=True,
        broker_connection_retry_on_startup=True,
        broker_connection_max_retries=None,
        broker_heartbeat=300,
        broker_heartbeat_checkrate=2,
        broker_connection_timeout=300,
        worker_cancel_long_running_tasks_on_connection_loss=True,
    )
    return celery_app


_gpu_heartbeat_stop = threading.Event()
_gpu_heartbeat_thread = None
_gpu_heartbeat_key = None


def _gpu_heartbeat_loop(key):
    """Run independently of the solo worker's task-execution thread."""
    while not _gpu_heartbeat_stop.is_set():
        try:
            gpu_heartbeat_client().set(key, "1", ex=GPU_HEARTBEAT_TTL)
        except Exception as exc:
            # Allow transient Redis outages; the TTL safely expires on failure.
            logger.warning("Could not renew GPU heartbeat (%s)", type(exc).__name__)
        if _gpu_heartbeat_stop.wait(GPU_HEARTBEAT_INTERVAL):
            break


def _consumes_gpu_queue(consumer):
    """Inspect queues selected by -Q on the ready worker, not all declared queues."""
    task_consumer = getattr(consumer, "task_consumer", None)
    queues = getattr(task_consumer, "queues", None)
    if queues is None:
        # Compatible with consumers whose task_consumer is not exposed.
        app = getattr(consumer, "app", None)
        amqp = getattr(app, "amqp", None)
        queue_config = getattr(amqp, "queues", None)
        queues = getattr(queue_config, "consume_from", ())
    if isinstance(queues, dict):
        return "gpu" in queues
    return any(getattr(queue, "name", None) == "gpu" for queue in (queues or ()))


@worker_ready.connect(weak=False)
def _start_gpu_heartbeat(sender=None, **kwargs):
    """Announce only actual GPU-queue consumers when they become ready."""
    global _gpu_heartbeat_thread, _gpu_heartbeat_key
    if sender is None or not _consumes_gpu_queue(sender):
        return
    if _gpu_heartbeat_thread is not None and _gpu_heartbeat_thread.is_alive():
        return

    _gpu_heartbeat_stop.clear()
    _gpu_heartbeat_key = f"{GPU_HEARTBEAT_KEY_PREFIX}{uuid.uuid4().hex}"
    _gpu_heartbeat_thread = threading.Thread(
        target=_gpu_heartbeat_loop,
        args=(_gpu_heartbeat_key,),
        name="celery-gpu-heartbeat",
        daemon=True,
    )
    _gpu_heartbeat_thread.start()
    logger.info("GPU worker heartbeat started")


@worker_shutdown.connect(weak=False)
def _stop_gpu_heartbeat(sender=None, **kwargs):
    """Remove this worker's heartbeat; the TTL also handles abrupt crashes."""
    global _gpu_heartbeat_thread, _gpu_heartbeat_key
    _gpu_heartbeat_stop.set()
    if _gpu_heartbeat_thread is not None:
        _gpu_heartbeat_thread.join(timeout=2)
    if _gpu_heartbeat_key is not None:
        try:
            gpu_heartbeat_client().delete(_gpu_heartbeat_key)
        except Exception:
            logger.debug("GPU heartbeat will expire via its TTL", exc_info=True)
    _gpu_heartbeat_thread = None
    _gpu_heartbeat_key = None


def get_task_info(job_id):
    """
    Return task information for the given job_id, checking Celery first,
    then falling back to the database for missing/purged tasks.
    """
    task_result = AsyncResult(job_id)
    
    # 1. Initialize safe defaults to avoid UnboundLocalError
    task_status = task_result.status  # e.g., 'PENDING', 'STARTED', 'SUCCESS'
    summary = "Processing"

    # 2. Handle terminal states (SUCCESS, FAILURE, REVOKED)
    if task_result.ready():
        if task_result.successful():
            summary = task_result.get()
        elif task_result.failed():
            # Safely format the exception and traceback
            traceback_info = task_result.traceback or "No traceback available"
            summary = f"{task_result.result}\n{traceback_info}"
        else:
            # Catch-all for other ready states like 'REVOKED'
            summary = str(task_result.result)

    # 3. Handle PENDING states (Celery defaults to PENDING for unknown IDs)
    elif task_status == 'PENDING':
        backend_key = task_result.backend.get_key_for_task(job_id)
        
        # If the task isn't actually in the Celery backend, check the DB
        if not task_result.backend.get(backend_key):
            results = get_job_from_db(job_id)
            
            # Safely check if 'results' is a valid dictionary before accessing keys
            if results:
                print(f"DB results for job_id {job_id}: {results.get('Status')}")
                # print(f"DB results for job_id {job_id}: {results.get('results')}")
                
                task_status = results.get('Status', task_status)
                summary = results.get('results', "No results available")
            else:
                task_status = "UNKNOWN"
                summary = "Task not found in Celery backend or Database"

    # 4. Return the standard dictionary
    return {
        "job_id": job_id,
        "task_status": task_status,
        "task_result": summary
    }


def get_input_path(input, userID):
    """
    return the absolute input path for a given input
    """
    input_path = None
    if input is not None and userID is not None:
        input_path = USER_STORAGE + userID + input
    return input_path


def get_output(output, userID, job_id):
    """
    return the absolute input path for a given input
    """
    output_path = None
    if output is not None and userID is not None:
        output_path = output + "/" + job_id
    
    return output_path
    

def benchmarks_output_path(input):
    """
    return the absolute output path for a given input
    """
    output_path = None
    if input is not None:
        # Check if the input path is a directory
        if os.path.isdir(input):
            # If it's a directory, append '/QC' to it
            output_path = os.path.join(input, 'QC')
        else:
            # If it's a file, get the parent directory and append '/QC'
            parent_dir = os.path.dirname(input)
            output_path = os.path.join(parent_dir, 'QC')
    
    return output_path

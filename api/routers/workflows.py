from celery import group
from fastapi import APIRouter
from starlette.responses import JSONResponse

# from api import tools
from celery_tasks.tasks import create_clustering_task, create_annotation_wf_task, create_integration_wf_task
from schemas.schemas import Dataset, Datasets
router = APIRouter(prefix='/api/workflows', tags=['workflows'], responses={404: {"description": "API Not found"}})


@router.post("/clustering")
async def create_clustering_task_async(ds: Dataset):
    """
    Create a task for clustering
    """
    ds_dict = ds.model_dump()  # Convert the Pydantic model to a dict
    task = create_clustering_task.apply_async(args=[ds_dict])
    return JSONResponse({"job_id": task.id, "status": "Clustering task is submitted successfully"})


@router.post("/integration")
async def create_integration_wf_task_async(dss: Datasets):
    """
    Create a task for integration
    """
    dss_dict = dss.model_dump()  # Convert the Pydantic model to a dict
    task = create_integration_wf_task.apply_async(args=[dss_dict])
    return JSONResponse({"job_id": task.id, "status": "Integration task is submitted successfully"})


@router.post("/annotation")
async def create_annotation_wf_task_async(dss: Datasets):
    """
    Create a task for annotation
    """
    dss_dict = dss.model_dump()  # Convert the Pydantic model to a dict
    task = create_annotation_wf_task.apply_async(args=[dss_dict])
    return JSONResponse({"job_id": task.id, "status": "Annotation task is submitted successfully"})

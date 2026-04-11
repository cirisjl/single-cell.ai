from celery import group
from fastapi import APIRouter, HTTPException
from starlette.responses import JSONResponse

# from api import tools
from celery_tasks.tasks import create_download_dataset_task
from schemas.schemas import DownloadDataset

router = APIRouter(prefix='/api/dataset', tags=['dataset'], responses={404: {"description": "API Not found"}})


@router.post("/download")
async def download_dataset_task(ds: DownloadDataset):
    """
    Download a dataset after processing user specified tool
    """
    ds_dict = ds.model_dump()  # Convert the Pydantic model to a dict
    task = create_download_dataset_task.apply_async(args=[ds_dict])

    return JSONResponse({"job_id": task.id, "status": "Download Dataset Task Submitted Successfully!"})
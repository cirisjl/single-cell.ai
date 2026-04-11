import os
from fastapi import APIRouter, HTTPException
from starlette.responses import JSONResponse
from fastapi.responses import StreamingResponse
from utils.mongodb import get_file_by_id, get_benchmarks_by_id
from schemas.schemas import DownloadDataset
from urllib.parse import quote
import json

router = APIRouter(prefix='/api', tags=['dataset'], responses={404: {"description": "API Not found"}})


@router.post("/download")
async def download_dataset(ds: DownloadDataset):
    """
    Download a dataset after processing user specified tool
    """
    def iter_file(path: str):
        with open(file=path, mode="rb") as tfile:
            yield tfile.read()

    ds_dict = ds.model_dump()  # Convert the Pydantic model to a dict
    dataset_id = ds_dict['dataset_id'] 
    document = get_file_by_id(dataset_id)
    adata_path = document.get("adata_path")
    document.pop("adata_path", None)  # Remove adata_path from metadata to avoid exposing file system details

    if not os.path.isfile(adata_path):
        raise HTTPException(status_code=404, detail="File not found")
    
    file_name = os.path.basename(adata_path)

    headers={
        "Content-Disposition": "attachment; filename={}".format(quote(file_name)),
        "X-File-Metadata": json.dumps(document)
        }

    return StreamingResponse(iter_file(path=adata_path), media_type="application/octet-stream", headers=headers)


@router.get("/benchmarks/{benchmarksId}")
async def get_benchmark_record(benchmarksId: str) -> dict:
    """
    Download a dataset after processing user specified tool
    """
    results = get_benchmarks_by_id(benchmarksId)

    if results is None:
        raise HTTPException(status_code=404, detail="Benchmarks record not found")

    return results
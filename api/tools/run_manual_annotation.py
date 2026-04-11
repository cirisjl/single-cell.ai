import os
from utils.redislogger import *
from utils.mongodb import upsert_jobs
from fastapi import HTTPException, status
from tools.annotation.manual_annotation import *
from exceptions.custom_exceptions import CeleryTaskException
from datetime import datetime


def run_manual_annotation(job_id, ma:dict):
    cluster_id = ma['cluster_id']
    process_id = ma['process_id']
    userID = ma['userID']
    adata_path = ma['adata_path']
    updatedAll = ma['updatedAll']
    updatedChangedOnly = ma['updatedChangedOnly']
    deleted = ma['deleted']
    obsEmbedding = ma['obsEmbedding']
    obsSets = ma['obsSets']
    datasetId = ma['datasetId']
    description = ma['description']
    layer = ma['layer']
    zarr_path = ma['zarr_path']
    origin_job_id = ma['job_id']

    if origin_job_id is None:
        upsert_jobs(
            {
                "job_id": job_id, 
                "Category": 'tools',
                "Method": ["Manual Annotation"],
                "Process": 'Annotation',
                "created_by": userID,
                "datasetId": datasetId,
                "Description": description,
                "datasetURL": adata_path,
                "Status": "Processing",
                "Created on": datetime.now(), 
            }
        )
    else:
        upsert_jobs(
            {
                "job_id": origin_job_id, 
                # "Category": 'tools',
                # "Method": ["Manual Annotation"],
                # "Process": 'Annotation',
                "modified_by": userID,
                # "datasetId": datasetId,
                # "Description": description,
                # "datasetURL": adata_path,
                "Status": "Processing",
                "Modified on": datetime.now(), 
                # "origin_job_id": origin_job_id
            }
        )

    try: 
        resutls = manual_annotation(cluster_id, adata_path, layer, job_id, origin_job_id,process_id, updatedAll, updatedChangedOnly, deleted, obsEmbedding, obsSets, zarr_path, userID)

        return resutls["results"]

    except Exception as e:
        details = f"Manual Annotation is failed: {e}"
        redislogger.error(job_id, details)
        if origin_job_id is None:
            upsert_jobs(
                {
                    "job_id": job_id, 
                    "results": details,
                    "Completed on": datetime.now(),
                    "Status": "Failure"
                }
            )
        raise CeleryTaskException(details)

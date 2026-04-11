from benchmarks.clustering import clustering_task
from benchmarks.imputation import imputation_task
from benchmarks.trajectory import trajectory_task
from benchmarks.multimodal import multimodal_task
from benchmarks.integration import integration_task
from benchmarks.ccc import ccc_task
from benchmarks.annotation import annotation_task
from utils.redislogger import *
from utils.mongodb import upsert_benchmarks, upsert_jobs
from utils.unzip import unzip_file_if_compressed
from fastapi import HTTPException, status
from exceptions.custom_exceptions import CeleryTaskException
from datetime import datetime

def run_benchmarks(job_id, task_dict:dict):
    adata_path = task_dict['adata_path']
    label = task_dict['label']
    task_type = task_dict['task_type']
    benchmarksId = task_dict['benchmarksId']
    datasetId = task_dict['datasetId']
    userID = task_dict['userID']
    ccc_target = task_dict['ccc_target']
    batch_key = task_dict['batch_key']
    species = task_dict['species']
    celltypist_model = task_dict['celltypist_model']
    SingleR_ref = task_dict['SingleR_ref']
    bm_traj = task_dict['bm_traj']
    origin_group = task_dict['origin_group']
    mod1 = task_dict['mod1']
    mod2 = task_dict['mod2']

    redislogger.info(job_id, f"Task parameters: {task_dict}")

    upsert_jobs(
        {
            "job_id": job_id,
            "Category": "Benchmarks",
            "created_by": userID,
            "Status": "Processing"
        }
    )

    adata_path = unzip_file_if_compressed(job_id, adata_path)
    
    if(task_type=="Clustering"):
        try:
            if os.path.exists(adata_path):
                clustering_results = clustering_task(adata_path, label, benchmarksId, datasetId, job_id, task_type)
                upsert_benchmarks(benchmarksId, clustering_results)
                results = {
                    "datasetId": datasetId,
                    "benchmarksId": benchmarksId
                }

                upsert_jobs(
                    {
                        "job_id": job_id, 
                        "datasetId": datasetId,
                        "benchmarksId": benchmarksId,
                        "results": clustering_results,
                        "Completed on": datetime.now(),
                        "Status": "Success"
                    }
                )

                return results
            else:
                detail = f'File does not exist at {adata_path}'
                redislogger.error(job_id, detail)
                raise CeleryTaskException(detail)
            
        except Exception as e:
            # Handle exceptions as needed
            detail=f"Clustering benchmarks is failed: {str(e)}"
            redislogger.error(job_id, detail)
            upsert_jobs(
                {
                    "job_id": job_id, 
                    "results": detail,
                    "Completed on": datetime.now(),
                    "Status": "Failure"
                }
            )
            raise CeleryTaskException(detail)

    if(task_type=="Cell Type Annotation"):
        try:
            if os.path.exists(adata_path):
                annotation_results = annotation_task(adata_path, label, benchmarksId, datasetId, job_id, celltypist_model=celltypist_model, SingleR_ref=SingleR_ref, species=species, task_type='Cell Type Annotation')
                upsert_benchmarks(benchmarksId, annotation_results)
                results = {
                    "datasetId": datasetId,
                    "benchmarksId": benchmarksId
                }

                upsert_jobs(
                    {
                        "job_id": job_id, 
                        "datasetId": datasetId,
                        "benchmarksId": benchmarksId,
                        "results": annotation_results,
                        "Completed on": datetime.now(),
                        "Status": "Success"
                    }
                )

                return results
            else:
                detail = f'File does not exist at {adata_path}'
                redislogger.error(job_id, detail)
                raise CeleryTaskException(detail)
            
        except Exception as e:
            # Handle exceptions as needed
            detail=f"Cell Type Annotation benchmarks is failed: {str(e)}"
            redislogger.error(job_id, detail)
            upsert_jobs(
                {
                    "job_id": job_id, 
                    "results": detail,
                    "Completed on": datetime.now(),
                    "Status": "Failure"
                }
            )
            raise CeleryTaskException(detail)

    if(task_type=="Cell-Cell Communication"):
        try:
            if os.path.exists(adata_path):
                ccc_results = ccc_task(adata_path, label, ccc_target, benchmarksId, datasetId, job_id, species=species, task_type='Cell-Cell Communication')
                upsert_benchmarks(benchmarksId, ccc_results)
                results = {
                    "datasetId": datasetId,
                    "benchmarksId": benchmarksId
                }

                upsert_jobs(
                    {
                        "job_id": job_id, 
                        "datasetId": datasetId,
                        "benchmarksId": benchmarksId,
                        "results": ccc_results,
                        "Completed on": datetime.now(),
                        "Status": "Success"
                    }
                )

                return results
            else:
                detail = f'File does not exist at {adata_path}'
                redislogger.error(job_id, detail)
                raise CeleryTaskException(detail)
            
        except Exception as e:
            # Handle exceptions as needed
            detail=f"Cell-Cell Communication benchmarks is failed: {str(e)}"
            redislogger.error(job_id, detail)
            upsert_jobs(
                {
                    "job_id": job_id, 
                    "results": detail,
                    "Completed on": datetime.now(),
                    "Status": "Failure"
                }
            )
            raise CeleryTaskException(detail)


    if(task_type=="Imputation"):
        try:
            if os.path.exists(adata_path):
                imputation_results = imputation_task(adata_path, species, benchmarksId, datasetId, job_id, task_type='Imputation')
                upsert_benchmarks(benchmarksId, imputation_results)
                results = {
                    "datasetId": datasetId,
                    "benchmarksId": benchmarksId
                }

                upsert_jobs(
                    {
                        "job_id": job_id, 
                        "datasetId": datasetId,
                        "benchmarksId": benchmarksId,
                        "results": imputation_results,
                        "Completed on": datetime.now(),
                        "Status": "Success"
                    }
                )

                return results
            else:
                detail = f'File does not exist at {adata_path}'
                redislogger.error(job_id, detail)
                raise CeleryTaskException(detail)
            
        except Exception as e:
            # Handle exceptions as needed
            detail=f"Imputation benchmarks is failed: {str(e)}"
            redislogger.error(job_id, detail)
            upsert_jobs(
                {
                    "job_id": job_id, 
                    "results": detail,
                    "Completed on": datetime.now(),
                    "Status": "Failure"
                }
            )
            raise CeleryTaskException(detail)

    if(task_type=="Batch Integration"):
        try:
            if os.path.exists(adata_path):
                integration_results = integration_task(adata_path, label, batch_key, benchmarksId, datasetId, job_id, species=species, task_type='Batch Integration')
                upsert_benchmarks(benchmarksId, integration_results)
                results = {
                    "datasetId": datasetId,
                    "benchmarksId": benchmarksId
                }

                upsert_jobs(
                    {
                        "job_id": job_id, 
                        "datasetId": datasetId,
                        "benchmarksId": benchmarksId,
                        "results": integration_results,
                        "Completed on": datetime.now(),
                        "Status": "Success"
                    }
                )

                return results
            else:
                detail = f'File does not exist at {adata_path}'
                redislogger.error(job_id, detail)
                raise CeleryTaskException(detail)
            
        except Exception as e:
            # Handle exceptions as needed
            detail=f"Batch Integration benchmarks is failed: {str(e)}"
            redislogger.error(job_id, detail)
            upsert_jobs(
                {
                    "job_id": job_id, 
                    "results": detail,
                    "Completed on": datetime.now(),
                    "Status": "Failure"
                }
            )
            raise CeleryTaskException(detail)

    if(task_type=="Multimodal Data Integration"):
        try:
            if os.path.exists(adata_path):
                multimodal_results = multimodal_task(adata_path, mod1, mod2, label, batch_key, benchmarksId, datasetId, job_id, task_type="Multimodal Data Integration")
                upsert_benchmarks(benchmarksId, multimodal_results)
                results = {
                    "datasetId": datasetId,
                    "benchmarksId": benchmarksId
                }

                upsert_jobs(
                    {
                        "job_id": job_id, 
                        "datasetId": datasetId,
                        "benchmarksId": benchmarksId,
                        "results": multimodal_results,
                        "Completed on": datetime.now(),
                        "Status": "Success"
                    }
                )

                return results
            else:
                detail = f'File does not exist at {adata_path}'
                redislogger.error(job_id, detail)
                raise CeleryTaskException(detail)
            
        except Exception as e:
            # Handle exceptions as needed
            detail=f"Multimodal Data Integration benchmarks is failed: {str(e)}"
            redislogger.error(job_id, detail)
            upsert_jobs(
                {
                    "job_id": job_id, 
                    "results": detail,
                    "Completed on": datetime.now(),
                    "Status": "Failure"
                }
            )
            raise CeleryTaskException(detail)

    if(task_type=="Trajectory"):
        try:
            if os.path.exists(adata_path):
                trajectory_results = trajectory_task(adata_path, label, origin_group, benchmarksId, datasetId, job_id, bm_traj=bm_traj, task_type='Trajectory')
                upsert_benchmarks(benchmarksId, trajectory_results)
                results = {
                    "datasetId": datasetId,
                    "benchmarksId": benchmarksId
                }

                upsert_jobs(
                    {
                        "job_id": job_id, 
                        "datasetId": datasetId,
                        "benchmarksId": benchmarksId,
                        "results": trajectory_results,
                        "Completed on": datetime.now(),
                        "Status": "Success"
                    }
                )

                return results
            else:
                detail = f'File does not exist at {adata_path}'
                redislogger.error(job_id, detail)
                raise CeleryTaskException(detail)
            
        except Exception as e:
            # Handle exceptions as needed
            detail=f"Trajectory benchmarks is failed: {str(e)}"
            redislogger.error(job_id, detail)
            upsert_jobs(
                {
                    "job_id": job_id, 
                    "results": detail,
                    "Completed on": datetime.now(),
                    "Status": "Failure"
                }
            )
            raise CeleryTaskException(detail)
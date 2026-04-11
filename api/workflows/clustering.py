import os
from tools.formating.formating import *
from tools.run_qc import run_qc
from tools.run_normalization import run_normalization
from tools.run_imputation import run_imputation
from utils.unzip import unzip_file_if_compressed
from fastapi import HTTPException, status
from utils.redislogger import *
from utils.mongodb import generate_workflow_id, upsert_jobs, upsert_workflows
from datetime import datetime
from exceptions.custom_exceptions import CeleryTaskException


def run_clustering(job_id, ds:dict, random_state=0):
    wf_results = {}
    process_ids = []
    userID = ds['userID']
    datasetId = ds['datasetId']
    dataset = ds['dataset']
    qc_params = ds['qc_params']
    normalization_params = ds['normalization_params']
    imputation_params = ds['imputation_params']
    fig_path = None
    reduction_params = ds['reduction_params']
    n_neighbors = reduction_params['n_neighbors']
    n_pcs = reduction_params['n_pcs']
    resolution = reduction_params['resolution']
    n_hvg = reduction_params['n_hvg']
    qc_params['n_neighbors'] = n_neighbors
    qc_params['n_pcs'] = n_pcs
    qc_params['resolution'] = resolution
    normalization_params['n_neighbors'] = n_neighbors
    normalization_params['n_pcs'] = n_pcs
    normalization_params['resolution'] = resolution
    imputation_params['n_neighbors'] = n_neighbors
    imputation_params['n_pcs'] = n_pcs
    imputation_params['resolution'] = resolution
    ds['n_hvg'] = n_hvg

    # Initialize methodMap
    methodMap = {}

    # Extract methods for Quality Control
    if qc_params and "methods" in qc_params and qc_params["methods"]:
        methodMap["Quality Control"] = ", ".join(qc_params["methods"])

    # Extract methods for Normalization
    if normalization_params and "methods" in normalization_params and normalization_params["methods"]:
        methodMap["Normalization"] = ", ".join(normalization_params["methods"])

    # Extract methods for Imputation
    if imputation_params and "methods" in imputation_params and imputation_params["methods"]:
        methodMap["Imputation"] = ", ".join(imputation_params["methods"])
        
    output = None
    description = "Clustering Workflow" 
    input = unzip_file_if_compressed(job_id, ds['input'])
    md5 = get_md5(input)

    # Create folders for output figures
    workflow_id = generate_workflow_id(md5, "clustering", ds)
    fig_path = os.path.join(os.path.dirname(ds['input']), 'workflow', workflow_id)
    if not os.path.exists(fig_path):
        os.makedirs(fig_path, exist_ok=True)
    wf_results['figures'] = fig_path

    # for method i want methodMap key value pairs.

    if datasetId is not None:
        description = f"Clustering Workflow for {datasetId}"
    elif dataset is not None:
        description = f"Clustering Workflow for {dataset}"

    # wf_results = pp_result_exists(process_id)
    upsert_jobs(
        {
            "job_id": job_id, 
            "created_by": userID,
            "Description": description,
            # "Method": str(methodMap).replace("'", "").replace("{", "").replace("}", ""),
            "Method": methodMap,
            "datasetURL": input,
            "datasetId": datasetId,
            "Process": "Clustering",
            "Category": 'workflow',
            "Created on": datetime.now(),
            "Status": "Processing"
        }
    )

    try:
        qc_results = run_qc(job_id, ds, fig_path=fig_path, wf=True)
        if qc_results is not None:
            ds['input'] = qc_results['adata_path']
            print(qc_results['adata_path'])        
            process_ids.extend(qc_results["process_ids"])
            wf_results['QC'] = qc_results["process_ids"]
            wf_results['QC_output'] = qc_results['output']
            if normalization_params["methods"] is not None:
                normalization_results = run_normalization(job_id, ds, fig_path=fig_path, wf=True)
                wf_results['normalization'] = normalization_results["process_ids"]
                process_ids.extend(normalization_results["process_ids"])
                wf_results['normalization_output'] = normalization_results['output']
                output = normalization_results['output']
            elif imputation_params["methods"] is not None:
                imputation_results = run_imputation(job_id, ds, fig_path=fig_path, wf=True)
                wf_results['imputation'] = imputation_results["process_ids"]
                process_ids.extend(imputation_results["process_ids"])
                wf_results['imputation_output'] = imputation_results['output']
                output = imputation_results['output']
            # upsert_workflows(workflow_id, wf_results)

        results = {
            "output": output,
            # "workflow_id": workflow_id,
            "md5": md5,
            "wf_results": wf_results,
            # "figures":fig_path, 
            "process_ids": process_ids
        }
        
        upsert_jobs(
            {
                "job_id": job_id, 
                "output": output,
                "process_ids": process_ids,
                # "workflow_id": workflow_id,
                "results": results,
                # "figures": fig_path, 
                "Completed on": datetime.now(),
                "Status": "Success"
            }
        )
    except Exception as e:
        detail = f"Clustering workflow is failed: {e}"
        upsert_jobs(
            {
                "job_id": job_id, 
                "results": {"error": detail},
                "Completed on": datetime.now(),
                "Status": "Failure"
            }
        )
        raise CeleryTaskException(detail)

    return results 
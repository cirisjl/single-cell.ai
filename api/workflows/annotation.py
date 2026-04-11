import os
from tools.formating.formating import *
from tools.run_qc import run_qc
from tools.run_integration import run_integration
from tools.run_annotation import run_annotation
from utils.unzip import unzip_file_if_compressed
from fastapi import HTTPException, status
from utils.redislogger import *
from utils.mongodb import generate_workflow_id, upsert_jobs, upsert_workflows
from datetime import datetime
from exceptions.custom_exceptions import CeleryTaskException


def run_annotation_wf(job_id, dss:dict, random_state=0):
    wf_results = {}
    process_ids = []
    userID = dss['userID']
    datasetIds = dss['datasetIds']
    datasets = dss['dataset']
    inputs = dss['input']
    do_umap = dss['do_umap']
    do_cluster = dss['do_cluster']
    user_refs = dss['user_refs']
    qc_params = dss['qc_params']
    integration_params = dss['integration_params']
    annotation_params = dss['annotation_params']
    reduction_params = dss['reduction_params']
    n_neighbors = reduction_params['n_neighbors']
    n_pcs = reduction_params['n_pcs']
    resolution = reduction_params['resolution']
    n_hvg = reduction_params['n_hvg']
    qc_params['n_neighbors'] = n_neighbors
    qc_params['n_pcs'] = n_pcs
    qc_params['resolution'] = resolution
    integration_params['dims'] = n_neighbors
    integration_params['npcs'] = n_pcs 
    integration_params['resolution'] = resolution
    annotation_params['n_neighbors'] = n_neighbors
    annotation_params['n_pcs'] = n_pcs 
    annotation_params['resolution'] = resolution
    fig_path = None
    md5 = []

    # Initialize methodMap
    methodMap = {}

    # Extract methods for Quality Control
    if qc_params and "methods" in qc_params and qc_params["methods"]:
        methodMap["Quality Control"] = ", ".join(qc_params["methods"])

    # Extract methods for Integration
    if integration_params and "methods" in integration_params and integration_params["methods"]:
        methodMap["Integration"] = ", ".join(integration_params["methods"])

    # Extract methods for Annotation
    if annotation_params and "methods" in annotation_params and annotation_params["methods"]:
        methodMap["Annotation"] = ", ".join(annotation_params["methods"])
        
    output = None
    description = "Annotation Workflow"

    abs_inputList = []

    if len(inputs) > 0:
        for input in inputs:
            if input is not None:
                input = unzip_file_if_compressed(job_id, input)
                md5 = md5 + get_md5(input)
                abs_inputList.append(input)
    else:
        raise CeleryTaskException("No input file is found.")

    # Create folders for output figures
    workflow_id = generate_workflow_id(md5, "annotation", dss)
    fig_path = os.path.join(os.path.dirname(inputs[0]), 'workflow', workflow_id)
    if not os.path.exists(fig_path):
        os.makedirs(fig_path, exist_ok=True)
    wf_results['figures'] = fig_path

    # for method i want methodMap key value pairs.

    if datasetIds is not None:
        description = f"Annotation Workflow for {datasetIds}"
    elif dataset is not None:
        description = f"Annotation Workflow for {datasets}"

    # wf_results = pp_result_exists(process_id)
    upsert_jobs(
        {
            "job_id": job_id, 
            "created_by": userID,
            "Description": description,
            # "Method": str(methodMap).replace("'", "").replace("{", "").replace("}", ""),
            "Method": methodMap,
            "datasetURL": inputs,
            "datasetId": datasetIds,
            "Process": "Annotation",
            "Category": 'workflow',
            "Created on": datetime.now(),
            "Status": "Processing"
        }
    )

    try:
        # Run QC
        qc_outputs = []
        qc_process_ids = []
        for i in range(len(abs_inputList)):
            ds = {}
            ds['userID'] = userID
            ds['input'] = abs_inputList[i]
            ds['output'] = dss['output']
            ds['datasetId'] = datasetIds[i]
            ds['dataset'] = datasets[i]
            ds['do_umap'] = do_umap
            ds['do_cluster'] = do_cluster
            ds['qc_params'] = qc_params
            ds['species'] = dss['species']
            ds['organ_part'] = dss['organ_part']
            ds['skip_3d'] = dss['skip_3d']
            ds['skip_tsne'] = dss['skip_tsne']
            ds['n_hvg'] = n_hvg
            
            qc_results = run_qc(job_id, ds, fig_path=fig_path, wf=True)
            if qc_results is not None:
                qc_outputs.append(qc_results['adata_path'])
                process_ids.extend(qc_results["process_ids"])
                qc_process_ids.extend(qc_results["process_ids"])

        wf_results['QC'] = qc_process_ids
        wf_results['QC_output'] = qc_outputs

        print(f"QC outputs: {qc_outputs}")
        

        # Run Integration
        integration_process_ids = []
        integration_outputs = {}
        if len(qc_outputs) > 0 and len(integration_params["methods"]) > 0:
            dss['input'] = qc_outputs
            dss['n_hvg'] = n_hvg
            integration_results = run_integration(job_id, dss, fig_path=fig_path, wf=True)
            wf_results['integration'] = integration_results["process_ids"]
            process_ids.extend(integration_results["process_ids"])
            wf_results['integration_output'] = integration_results['output']
            output = integration_results['output']
            # adata_outputs = integration_results['adata_path']
            integration_outputs.update(integration_results['adata_path'])
        else:
            integration_outputs = {qc_params["methods"][i]: qc_outputs[i] for i in range(len(qc_outputs))}

        print(f"Integration outputs: {integration_outputs}")

        # Run Annotation
        ann_process_ids = []
        annotation_outputs = []
        if len(integration_outputs) > 0 and len(annotation_params["methods"]) > 0:
            for key, value in integration_outputs.items():
                print(f"Running annotation for integration output: {key}")
                print(f"Input: {value}")
                ds = {}
                ds['userID'] = userID
                ds['input'] = value
                ds['output'] = value
                ds['datasetId'] = datasetIds[0]
                ds['dataset'] = '_'.join(datasets)
                ds['species'] = dss['species']
                ds['organ_part'] = dss['organ_part']
                ds['user_refs'] = user_refs
                ds['do_umap'] = False
                ds['do_cluster'] = False
                ds['n_hvg'] = n_hvg
                ds['annotation_params'] = annotation_params

                print(f"Annotation params: {ds}")

                annotation_results = run_annotation(job_id, ds, fig_path=fig_path, description=f"{', '.join(annotation_params['methods'])} Annotation for {key} Integration", wf=True)
                ann_process_ids.extend(annotation_results["process_ids"])
                process_ids.extend(annotation_results["process_ids"])
                annotation_outputs.extend(annotation_results['output'])
                print(f"Annotation outputs for {key}: {annotation_results['output']}")
            output = annotation_outputs
                
        wf_results['annotation'] = ann_process_ids
        wf_results['annotation_output'] = annotation_outputs
        # print(f"Annotation outputs: {annotation_outputs}")
        # print(f"Output: {output}")
        
        results = {
            "output": output,
            # "workflow_id": workflow_id,
            "md5": md5,
            # "adata_path": adata_outputs,
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
        detail = f"Annotation workflow is failed: {e}"
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
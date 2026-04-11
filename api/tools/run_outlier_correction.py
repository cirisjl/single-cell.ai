from tools.formating.formating import *
import scanpy as sc
import os
import numpy as np
from utils.redislogger import *
from utils.mongodb import create_pp_results, upsert_jobs
from fastapi import HTTPException, status
from tools.annotation.manual_annotation import *
from exceptions.custom_exceptions import CeleryTaskException
from datetime import datetime


def run_outlier_correction(job_id, oc:dict):
    cluster_id = oc['cluster_id']
    process_id = oc['process_id']
    userID = oc['userID']
    adata_path = oc['adata_path']
    updatedDiscardAll = oc['updatedDiscardAll']
    updatedDiscardChangedOnly = oc['updatedDiscardChangedOnly']
    updatedOutlierAll = oc['updatedOutlierAll']
    updatedOutlierChangedOnly = oc['updatedOutlierChangedOnly']
    deleted = oc['deleted']
    obsEmbedding = oc['obsEmbedding']
    obsSets = oc['obsSets']
    obs_cols = []
    if len(obsSets) > 0: obs_cols = [item['path'].replace("obs/", "") for item in obsSets if item['name'] != "Cluster"]
    datasetId = oc['datasetId']
    description = oc['description']
    layer = oc['layer']
    zarr_path = oc['zarr_path']
    origin_job_id = oc['job_id']

    upsert_jobs(
        {
            "job_id": origin_job_id, 
            # "Category": 'tools',
            # "Method": ["Outlier Correction"],
            # "Process": 'Outlier Correction',
            "modified_by": userID,
            # "datasetId": datasetId,
            # "Description": description,
            # "datasetURL": adata_path,
            "Status": "Processing",
            "modified on": datetime.now(), 
            # "origin_job_id": origin_job_id
        }
    )

    try: 
        redislogger.info(job_id, f"Loading AnnData ...")
        adata = load_anndata(adata_path)
        redislogger.info(job_id, f"Updating discard labels ...")
        output = adata_path.replace("_outlier_correction", "").replace(".h5ad", "_outlier_correction.h5ad")

        # Process updated discards
        if "discard" in adata.obs.columns:
            if len(updatedDiscardChangedOnly) > 0:
                for update in updatedDiscardChangedOnly:
                    cluster_row_id = update['Cluster']
                    new_label = update['discard']
                    if cluster_id in adata.obs.columns:
                        adata.obs.loc[adata.obs[cluster_id]==cluster_row_id, 'discard'] = new_label
        elif len(updatedDiscardAll) > 0:
            adata.obs['discard'] = False
            for update in updatedDiscardAll:
                print(f"update: {update}")
                cluster_row_id = update['Cluster']
                new_label = update['discard']
                if cluster_id in adata.obs.columns:
                    adata.obs.loc[adata.obs[cluster_id]==cluster_row_id, 'discard'] = new_label

        # Process updated outliers
        if "outlier" in adata.obs.columns:
            if len(updatedOutlierChangedOnly) > 0:
                for update in updatedOutlierChangedOnly:
                    cluster_row_id = update['Cluster']
                    new_label = update['outlier']
                    if cluster_id in adata.obs.columns:
                        adata.obs.loc[adata.obs[cluster_id]==cluster_row_id, 'outlier'] = new_label
        elif len(updatedOutlierAll) >0:
            adata.obs['outlier'] = False
            for update in updatedOutlierAll:
                print(f"update: {update}")
                cluster_row_id = update['Cluster']
                new_label = update['outlier']
                if cluster_id in adata.obs.columns:
                    adata.obs.loc[adata.obs[cluster_id]==cluster_row_id, 'outlier'] = new_label

        # Process deleted annotations
        if len(deleted) > 0:
            redislogger.info(job_id, f"Removing cluster(s) ...")
            adata=adata[~adata.obs[cluster_id].isin(deleted)]

        # Save adata
        redislogger.info(job_id, f"Saving Anndata ...")
        output_path, _ = save_anndata(adata, output, zarr=False)
        # Update UMAP/t-SNE & adata.obs
        redislogger.info(job_id, f"Updating UMAP & t-SNE of Anndata ...")
        pp_results = get_updated_metadata(adata, process_id, cluster_id=cluster_id, adata_path=output, orign_adata_path=adata_path, obsEmbedding=obsEmbedding)
        pp_results['output'] = [
            {
                'Outlier Correction': output,
                "Original Anndata": adata_path,
            }
        ]
        # Update zarr
        redislogger.info(job_id, f"Updating Gene Expression panel ...")
        zarr_path = save_zarr(adata, adata_path=output, layer=layer, obs_cols=obs_cols)
        pp_results['zarr_path'] = zarr_path
        pp_results['obsSets'] = obsSets
        pp_results['created_by'] = userID
        # Update pp_results
        create_pp_results(process_id, pp_results)

        results = {
            "job_id": origin_job_id,         
            "Status": 'Success',
            "adata_path": output,
            # "original_adata_path": adata_path,
            "output": [
                {
                    'Outlier Correction': output,
                    "Original Anndata": adata_path.replace("_outlier_correction", ""),
                }
            ],
            "process_ids": [process_id],
            "Completed on": datetime.now(),
            "results": { 
                "adata_path": output,
                "output": [
                    {
                        'Outlier Correction': output,
                        "Original Anndata": adata_path.replace("_outlier_correction", ""),
                    }
                ], 
                "process_ids": [process_id],
            }
        }

        # Update jobs
        upsert_jobs(results)
        redislogger.info(job_id, f"Outlier Correction is completed successfully.")
    
        adata = None
        # results["job_id"] = job_id

        return results["results"]

    except Exception as e:
        details = f"Outlier Correction is failed: {e}"
        redislogger.error(job_id, details)
        # upsert_jobs(
        #     {
        #         "job_id": job_id, 
        #         "results": details,
        #         "Completed on": datetime.now(),
        #         "Status": "Failure"
        #     }
        # )
        raise CeleryTaskException(details)

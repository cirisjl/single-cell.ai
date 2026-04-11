from tools.formating.formating import *
import scanpy as sc
import os
import numpy as np
from utils.mongodb import create_pp_results, upsert_jobs
from utils.redislogger import *
from datetime import datetime


def manual_annotation(cluster_id, adata_path, layer, job_id, origin_job_id, process_id, updatedAll, updatedChangedOnly, deleted, obsEmbedding, obsSets, zarr_path, userID):
    redislogger.info(job_id, f"Loading AnnData ...")
    adata = load_anndata(adata_path)
    output = adata_path.replace("_manual_annotation", "").replace(".h5ad", "_manual_annotation.h5ad")
    # Check if 'cell_label' is in obsSets, if not, add it
    if not any(item['name'] == 'cell_label' for item in obsSets):
        obsSets.append({
            'name': 'cell_label',
            'path': 'obs/cell_label'
        })
    # Update obsSets to obs_cols for later use
    obs_cols = []
    if len(obsSets) > 0: obs_cols = [item['path'].replace("obs/", "") for item in obsSets if item['name'] != "Cluster"]
    
    redislogger.info(job_id, f"Updating cell labels ...")
    # Process updated annotations
    if "cell_label" in adata.obs.columns:
        if len(updatedChangedOnly) > 0:
            adata.obs['cell_label'] = adata.obs['cell_label'].astype('object')
            for update in updatedChangedOnly:
                cluster_row_id = update['Cluster']
                new_label = update['cell_label']
                if cluster_id in adata.obs.columns:
                    adata.obs.loc[adata.obs[cluster_id]==cluster_row_id, 'cell_label'] = new_label
            adata.obs['cell_label'] = adata.obs['cell_label'].astype('category')
    elif len(updatedAll) >0:
        adata.obs['cell_label'] = "Unknown"
        adata.obs['cell_label'] = adata.obs['cell_label'].astype('object')
        for update in updatedAll:
            print(f"update: {update}")
            cluster_row_id = update['Cluster']
            new_label = update['cell_label']
            if cluster_id in adata.obs.columns:
                adata.obs.loc[adata.obs[cluster_id]==cluster_row_id, 'cell_label'] = new_label
        adata.obs['cell_label'] = adata.obs['cell_label'].astype('category')

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
                'Manual Annotation': output,
                "Original Anndata": adata_path,
            }
        ]
    # Update zarr
    redislogger.info(job_id, f"Updating Gene Expression panel ...")
    zarr_path = save_zarr(adata, adata_path=output, layer=layer, obs_cols=obs_cols)
    pp_results['zarr_path'] = zarr_path
    pp_results['obsSets'] = obsSets
    # Update pp_results
    pp_results['created_by'] = userID
    create_pp_results(process_id, pp_results)

    results = {
        "job_id": origin_job_id,         
        "Status": 'Success',
        "adata_path": output,
        # "original_adata_path": adata_path,
        "output": [
            {
                'Manual Annotation': output,
                "Original Anndata": adata_path.replace("_manual_annotation", ""),
            }
        ],
        "process_ids": [process_id],
        "Completed on": datetime.now(),
        "results": { 
            "adata_path": output,
            "output": [
                {
                    'Manual Annotation': output,
                    "Original Anndata": adata_path.replace("_manual_annotation", ""),
                }
            ], 
            "process_ids": [process_id],
        }
    }

    if origin_job_id is None:
        results["job_id"] = job_id

    # Update jobs
    upsert_jobs(results)
    redislogger.info(job_id, f"Manual annotation is completed successfully.")
    results["job_id"] = job_id
  
    adata = None

    return results
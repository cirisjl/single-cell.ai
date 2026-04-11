import os
import hashlib
from pathlib import Path
# import tempfile
import shutil
# from benchmarks.clustering import clustering_task
from utils.redislogger import *
from utils.molecular_cross_validation import *
from utils.mongodb import upsert_benchmarks, upsert_jobs
from utils.unzip import unzip_file_if_compressed
from tools.formating.formating import *
from tools.utils.datasplit import sc_train_val_test_split
from fastapi import HTTPException, status
import json
import anndata
import numpy as np
from exceptions.custom_exceptions import CeleryTaskException
from datetime import datetime

def run_data_split(job_id, data_dict:dict):
    datasetId = data_dict['datasetId']
    benchmarksId = data_dict['benchmarksId']
    userID = data_dict['userID']
    adata_path = data_dict['adata_path']
    train_fraction = data_dict['train_fraction']
    validation_fraction = data_dict['validation_fraction']
    test_fraction = data_dict['test_fraction']
    labels = data_dict['labels']
    task_type = data_dict['task_type']
    # Serializing the dictionary to a JSON string and encoding to bytes
    encoded_data = json.dumps(data_dict, sort_keys=True).encode('utf-8')
    split_id = hashlib.md5(encoded_data).hexdigest()

    upsert_jobs(
        {
            "job_id": job_id, 
            "created_by": userID,
            "Status": "Processing"
        }
    )

    adata_path = unzip_file_if_compressed(job_id, adata_path)

    if not adata_path.endswith(".h5mu"): 
        try:
            adata = load_anndata(adata_path)
            if adata is not None:
                if task_type == "Imputation":
                    if not 'train' in adata.obsm.keys():
                        adata = split_imputation_data(adata)
                        save_anndata(adata, adata_path)

                elif not (test_fraction ==1 and 'split_idx' in adata.obs.keys()):
                    if labels is not None and labels != "":
                        adata = adata[~adata.obs[labels].isna()] # Remove rows with NaN labels
                    adata = sc_train_val_test_split(adata, train_fraction, validation_fraction, test_fraction)
                    save_anndata(adata, adata_path)
                adata = None
            else:
                detail = f'File does not exist at {adata_path}'
                raise CeleryTaskException(detail)
        except Exception as e:
            # Handle any errors
            detail=f"Data split is failed: {str(e)}"
            upsert_jobs(
                {
                    "job_id": job_id,
                    "results": detail,
                    "Completed on": datetime.now(),
                    "Status": "Failure"
                }
            )
            raise CeleryTaskException(detail)
    
    # Write AnnData objects to files with unique filenames in the temporary directory
    # if adata is not None: 
    #     # adata.write(adata_path, compression='gzip')
    #     save_anndata(adata, adata_path)
    
    # Updating records using string paths
    upsert_benchmarks(benchmarksId, {
        "datasetId": datasetId,
        "adata_path": adata_path
    })        
    results = {
        "datasetId": datasetId,
        "benchmarksId": benchmarksId,
        "adata_path": adata_path
    }
    
    upsert_jobs(
        {
            "job_id": job_id,
            "datasetId": datasetId,
            "benchmarksId": benchmarksId,
            "output": adata_path,
            "adata_path": adata_path,
            "Completed on": datetime.now(),
            "results": results,
            "Status": "Success"
        }
    ) 
    return results


def split_imputation_data(
    adata: anndata.AnnData, train_frac: float = 0.9, seed: int = 0
) -> anndata.AnnData:
    """Split data using molecular cross-validation.

    Stores "train" and "test" dataset using the AnnData.obsm property.
    """
    import scipy.sparse

    random_state = np.random.RandomState(seed)

    X = adata.X

    if scipy.sparse.issparse(X):
        X = np.array(X.todense())
    if np.allclose(X, X.astype(int)):
        X = X.astype(int)
    else:
        raise TypeError("Molecular cross-validation requires integer count data.")

    X_train, X_test = split_molecules(
        X, 0.9, 0.0, random_state
    )
    # remove zero entries
    is_missing = X_train.sum(axis=0) == 0
    X_train, X_test = X_train[:, ~is_missing], X_test[:, ~is_missing]

    adata = adata[:, ~is_missing].copy()
    adata.obsm["train"] = scipy.sparse.csr_matrix(X_train).astype(float)
    adata.obsm["test"] = scipy.sparse.csr_matrix(X_test).astype(float)

    return adata
import os
from tools.formating.formating import *
from config.celery_utils import get_input_path, get_output
from utils.redislogger import *
from tools.reduction.reduction import run_dimension_reduction, run_clustering
from utils.mongodb import generate_process_id, pp_result_exists, create_pp_results, upsert_jobs
from utils.unzip import unzip_file_if_compressed
from fastapi import HTTPException, status
from exceptions.custom_exceptions import CeleryTaskException
from datetime import datetime
    

def run_reduction(job_id, ds:dict, show_error=True, random_state=0):
    pp_stage = "Summarized"
    process = "Reduction"
    dataset = ds['dataset']
    input = ds['input']
    userID = ds['userID']
    # output = ds['output']
    datasetId = ds['datasetId']
    parameters = ds['reduction_params']
    n_hvg = ds['n_hvg']
    species = ds['species'].lower()
    organ_part = ds['organ_part']
    layer = None
    layers = None
    if(len(parameters['layer'].strip())):
        layer = parameters['layer']
    n_neighbors = parameters['n_neighbors']
    n_pcs = parameters['n_pcs']
    resolution = parameters['resolution']
    method = 'UMAP&t-SNE'

    upsert_jobs(
        {
            "job_id": job_id, 
            "created_by": userID,
            "Status": "Processing"
        }
    )

    redislogger.info(job_id, f"Using Visualization Parameters: {parameters}")
    
    #Get the absolute path for the given input
    # input = get_input_path(input, userID)
    #Get the absolute path for the given output
    input = unzip_file_if_compressed(job_id, ds['input'])
    md5 = get_md5(input)
    output = input.replace('.h5ad', f'_resolution_{str(resolution).replace(".", "_")}.h5ad')
    print(f"Output path: {output}")
    adata = load_anndata(input)
    process_id = generate_process_id(md5, process, method, parameters)
    reduction_results = pp_result_exists(process_id)
    if reduction_results is not None:
        redislogger.info(job_id, "Found existing pre-process results in database, skip dimension reduction.")
    else:
        try:
            redislogger.info(job_id, "Computing PCA, neighborhood graph, tSNE, UMAP, and 3D UMAP")
            adata, msg = run_dimension_reduction(adata, layer=layer, n_neighbors=n_neighbors, n_pcs=n_pcs, random_state=random_state)
            if msg is not None: redislogger.warning(job_id, msg)

            redislogger.info(job_id, "Clustering the neighborhood graph.")
            adata = run_clustering(adata, layer=layer, resolution=resolution, random_state=random_state)

            # adata.write_h5ad(output, compression='gzip')
            output, zarr_output = save_anndata(adata, output, zarr=True, n_hvg=n_hvg, layer=layer)

            redislogger.info(job_id, "Retrieving metadata and embeddings from AnnData object.")
            reduction_results = get_metadata_from_anndata(adata, pp_stage, process_id, process, method, parameters, md5, adata_path=output, zarr_path=zarr_output)
            
            # Add preset questions for tissue and species
            if organ_part is not None and organ_part != "" and species is not None and species != "":
                preset_questions = create_annotation_prompt(adata, tissue=organ_part, species=species, layer=layer, method="t-test", groupby=f"{method}_leiden", top=n_hvg, task="Dimension Reduction")
                reduction_results['preset_questions'] = preset_questions

            adata = None
            reduction_results['datasetId'] = datasetId
            reduction_results['created_by'] = userID
            create_pp_results(process_id, reduction_results)  # Insert pre-process results to database
            redislogger.info(job_id, "AnnData object for UMAP & t-SNE reduction is saved successfully")
        except Exception as e:
            # redislogger.error(job_id, "UMAP reduction is failed.")
            detail = f"UMAP or t-SNE reduction is failed: {e}"
            upsert_jobs(
                {
                    "job_id": job_id, 
                    "results": detail,
                    "Completed on": datetime.now(),
                    "Status": "Failure"
                }
            )
            os.remove(output)
            raise CeleryTaskException(detail)
    
    if 'layers' in reduction_results.keys():
        layers = reduction_results['layers']

    results = {
        "output": [{method: output}],
        "layers": layers,
        "md5": md5,
        "process_ids": [process_id]
    }

    upsert_jobs(
        {
            "job_id": job_id, 
            "datasetId": datasetId,
            "output": [{method: output}],
            "process_ids": [process_id],
            "layers": layers,
            "results": results,
            "Completed on": datetime.now(),
            "Status": "Success"
        }
    )

    return results

        
            


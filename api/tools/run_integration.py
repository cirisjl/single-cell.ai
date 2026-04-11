import os
import subprocess
from tools.formating.formating import *
from config.celery_utils import get_input_path, get_output
from utils.redislogger import *
from utils.unzip import unzip_file_if_compressed
from fastapi import HTTPException, status
from tools.integration.scvi import scvi_integrate
from scipy.sparse import csr_matrix
from tools.reduction.reduction import *
from utils.mongodb import generate_process_id, pp_result_exists, create_pp_results, upsert_jobs
from exceptions.custom_exceptions import CeleryTaskException
from datetime import datetime

import warnings
warnings.simplefilter("ignore", FutureWarning)
warnings.simplefilter("ignore", UserWarning)
warnings.simplefilter("ignore", RuntimeWarning)
warnings.filterwarnings("ignore", category=DeprecationWarning)

def run_integration(job_id, ids:dict, fig_path=None, wf=False):
    pp_stage = "Corrected"
    md5 = []
    process_ids = []
    process = "Integration"
    datasetIds = ids['datasetIds']
    datasets = ids['dataset']
    inputs = ids['input']
    userID = ids['userID']
    output = ids['output']
    do_umap = ids['do_umap']
    do_cluster = ids['do_cluster']
    n_hvg = ids['n_hvg']
    species = ids['species'].lower()
    organ_part = ids['organ_part']
    
    # output_format = ids['output_format']
    parameters = ids['integration_params']
    batch_key = parameters['batch_key']
    pseudo_replicates = parameters['pseudo_replicates']
    methods = parameters['methods']
    default_assay = parameters['default_assay']
    # reference = parameters['reference']
    dims = parameters['dims']
    npcs = parameters['npcs']
    resolution = parameters['resolution']
    integration_output = []
    adata_outputs = {}
    zarr_output = None

    upsert_jobs(
        {
            "job_id": job_id, 
            "created_by": userID,
            "Status": "Processing"
        }
    )

    if methods is None:
        redislogger.warning(job_id, "No integration method is selected.")
        detail = 'No integration method is selected.'
        redislogger.error(job_id, detail)
        if not wf:
            raise CeleryTaskException(detail)
    # output = get_output_path(datasets, input, method='integration')
    methods = [x.upper() for x in methods if isinstance(x,str)]
    # adata, counts, csv_path = LoadAnndata_to_csv(input, output, layer, show_error)

    # methods = list_py_to_r(methods)
    abs_inputList = []

    if inputs is not None:
        for input in inputs:
            if input is not None:
                input = unzip_file_if_compressed(job_id, input)
                md5 = md5 + get_md5(input)
                abs_inputList.append(input)
    else:
        raise CeleryTaskException("No input file is found.")

    if datasets is not None:
        dataset = datasets[0]
    datasets = list_to_string(datasets)
    input_str = list_to_string_default(abs_inputList)
    
    redislogger.info(job_id, f"Using Integration Parameters: {parameters}")

    # #Get the absolute path for the given input
    # input = get_input_path(input, userID)
    # Get the absolute path for the given output
    # output = get_output(output, userID, job_id)
    for method in methods:
        process_id = generate_process_id(md5, process, method, parameters)
        output = os.path.join(os.path.dirname(inputs[0]), 'integration', process_id, f"{method}_integration.h5seurat")
        if not os.path.exists(os.path.dirname(output)):
            os.makedirs(os.path.dirname(output))
        adata_path = output.replace(".h5seurat", ".h5ad")
        report_path = output.replace(".h5seurat", ".html")

        # output = get_output_path(output, 'Integration', dataset=dataset, method=method, format='Seurat')
        # adata_path = get_output_path(output, 'Integration', dataset=dataset, method=method, format='AnnData')

        integration_results = pp_result_exists(process_id)

        if integration_results is not None:
            redislogger.info(job_id, "Found existing pre-process results in database, skip Integration.")
            integration_output = integration_results['outputs']
            adata_outputs.update({method: integration_results['adata_path']})
            process_ids.append(process_id)
        else:
            try:
                if ("HARMONY" in methods or "SCVI" in methods):
                    adata = None
                    print("inputs: ", inputs)
                    if len(inputs) > 1:
                        # adatas = [load_anndata(input) for input in inputs]                      
                        adatas = []
                        if batch_key is None or batch_key.strip() == '':
                            for input in inputs:
                                ad = load_anndata(input)
                                ad.obs['batch'] = os.path.basename(input).split('.')[0] # If bacth_key is empty, use filename as batch_key
                                adatas.append(ad) 
                            batch_key = 'batch'
                        elif '.' in batch_key:
                            for input in inputs:
                                ad = load_anndata(input)
                                ad.obs['batch'] = ad.obs[batch_key].values.astype("str")
                                adatas.append(ad)
                            batch_key = 'batch'
                        else:
                            for input in inputs:
                                ad = load_anndata(input)
                                batch_key = parameters['batch_key']
                                ad.obs[batch_key] = ad.obs[batch_key].values.astype("str")
                                adatas.append(ad)
                        adata = sc.concat(adatas, join='outer')
                        adata.obs[batch_key] = adata.obs[batch_key].astype("category")
                        # if batch_key is None or batch_key.strip() == '':
                        #     batch_key = 'batch'
                    elif len(inputs) == 1:
                        adata = load_anndata(inputs[0])
                        if batch_key is None or batch_key.strip() == '':
                            # adata.obs['batch'] = os.path.basename(input[0]).split('.')[0]
                            # batch_key = 'batch'
                            detail = f"{method} integration is failed: 'Batch Key' is required for single file input."
                            redislogger.error(job_id, detail)
                            if not wf:
                                raise CeleryTaskException(detail)
                    
                    # Pseudo replicates
                    if pseudo_replicates > 1:
                        adata = create_pseudo_replicates(adata, batch_key, pseudo_replicates)
      
                    if "HARMONY" in methods and adata is not None:
                        redislogger.info(job_id, f"Start {method} integration...")
                        import scanpy.external as sce
                        # Check if X is normalized
                        if adata is not None:
                            if not is_normalized(adata.X) and check_nonnegative_integers(adata.X):
                                adata.layers['raw_counts'] = adata.X.copy() # Keep a copy of the raw counts
                            else:
                                adata.X = adata.layers['raw_counts'].copy() # Restore the raw counts
                                # Handle NaNs/Infinities, e.g., replace with 0 or a small value, or remove affected genes/cells
                                # Example: Replacing NaNs with 0 (use with caution based on your data)
                                adata.X[np.isnan(adata.X)] = 0
                                adata.X[np.isinf(adata.X)] = 0
                                sc.pp.normalize_total(adata) 
                        else:
                            detail = f"{method} integration is failed: AnnData is None."
                            redislogger.error(job_id, detail)
                            if not wf:
                                raise CeleryTaskException(detail)

                        sc.pp.log1p(adata)
                        sc.pp.highly_variable_genes(adata, batch_key = batch_key, subset=False)
                        sc.pp.scale(adata)
                        sc.pp.pca(adata, use_highly_variable=True) #True since we didnt subset
                        sce.pp.harmony_integrate(adata, key = batch_key)

                        if np.isnan(adata.obsm["X_pca_harmony"].data).any() or np.isinf(adata.obsm["X_pca_harmony"].data).any():
                            # Handle NaNs/Infinities, e.g., replace with 0 or a small value, or remove affected genes/cells
                            # Example: Replacing NaNs with 0 (use with caution based on your data)
                            adata.obsm["X_pca_harmony"][np.isnan(adata.obsm["X_pca_harmony"])] = 0
                            adata.obsm["X_pca_harmony"][np.isinf(adata.obsm["X_pca_harmony"])] = 0
                            
                        # sc.pp.neighbors(adata, use_rep = "X_pca_harmony")
                        if do_umap:
                            redislogger.info(job_id, "Computing PCA, neighborhood graph, tSNE, UMAP, and 3D UMAP")
                            adata, msg = run_dimension_reduction(adata, n_neighbors=dims, n_pcs=npcs, use_rep="X_pca_harmony", random_state=0)
                            if msg is not None: redislogger.warning(job_id, msg)
                        if do_cluster:
                            redislogger.info(job_id, "Clustering the neighborhood graph.")
                            adata = run_clustering(adata, resolution=resolution, use_rep="X_pca_harmony", random_state=0)
                        if fig_path is not None:
                            plot_embedding(adata, color=batch_key, fig_path=fig_path, title="Harmony Integration")

                        # adata.write_h5ad(adata_path, compression='gzip')
                        adata_path, zarr_output = save_anndata(adata, adata_path, zarr=True, n_hvg=n_hvg, obs_cols=[batch_key])

                        redislogger.info(job_id, "Retrieving metadata and embeddings from AnnData object.")
                        # integration_results = get_metadata_from_anndata(adata, pp_stage, process_id, process, method, parameters, md5, layer=None, use_rep="X_pca_harmony", adata_path=adata_path, cluster_colname=batch_key, zarr_path=zarr_output, obsSets=[{"name": "Batch", "path": "obs/" + batch_key}])
                        integration_results = get_metadata_from_anndata(adata, pp_stage, process_id, process, method, parameters, md5, layer=None, use_rep="X_pca_harmony", adata_path=adata_path, zarr_path=zarr_output, obsSets=[{"name": "Batch", "path": "obs/" + batch_key}])

                        # Add preset questions for tissue and species
                        if organ_part is not None and organ_part != "" and species is not None and species != "":
                            preset_questions = create_annotation_prompt(adata, tissue=organ_part, species=species, use_rep="X_pca_harmony", method="t-test", groupby="X_pca_harmony_leiden", top=n_hvg, task="Batch Integration")
                            integration_results['preset_questions'] = preset_questions

                        integration_output.append({f"{method}_AnnData": adata_path})
                        integration_results['outputs'] = integration_output
                        adata_outputs.update({method: adata_path})
                        adata = None

                        redislogger.info(job_id, integration_results['info'])
                        integration_results['datasetIds'] = datasetIds
                        integration_results['created_by'] = userID
                        create_pp_results(process_id, integration_results)  # Insert pre-process results to database 
                        process_ids.append(process_id) 

                    if "SCVI" in methods and adata is not None:
                        redislogger.info(job_id, "Start scVI integration...")
                        scvi_path = get_scvi_path(adata_path, "batch_integration")
                        # Check if X is normalized
                        if adata is not None:
                            if not is_normalized(adata.X) and check_nonnegative_integers(adata.X):
                                adata.layers['raw_counts'] = adata.X.copy() # Keep a copy of the raw counts
                            else:
                                adata.X = adata.layers['raw_counts'].copy() # Restore the raw counts
                        else:
                            detail = f"{method} integration is failed: AnnData is None."
                            redislogger.error(job_id, detail)
                            if not wf:
                                raise CeleryTaskException(detail)

                        # Handle NaNs/Infinities, e.g., replace with 0 or a small value, or remove affected genes/cells
                        # Example: Replacing NaNs with 0 (use with caution based on your data)
                        adata.X[np.isnan(adata.X)] = 0
                        adata.X[np.isinf(adata.X)] = 0

                        adata = scvi_integrate(adata, batch_key=batch_key, model_path=scvi_path)

                        sc.pp.neighbors(adata, use_rep = "X_scVI")
                        if do_umap:
                            redislogger.info(job_id, "Computing PCA, neighborhood graph, tSNE, UMAP, and 3D UMAP")
                            adata, msg = run_dimension_reduction(adata, n_neighbors=dims, n_pcs=npcs, use_rep="X_scVI", random_state=0)
                            if msg is not None: redislogger.warning(job_id, msg)
                        if do_cluster:
                            redislogger.info(job_id, "Clustering the neighborhood graph.")
                            adata = run_clustering(adata, resolution=resolution, use_rep="X_scVI", random_state=0)
                        if fig_path is not None:
                            plot_embedding(adata, color=batch_key, fig_path=fig_path, title="scVI Integration")

                        adata_path, zarr_output = save_anndata(adata, adata_path, zarr=True, n_hvg=n_hvg, obs_cols=[batch_key])
                        # adata.write_h5ad(adata_path, compression='gzip')
                        redislogger.info(job_id, "Retrieving metadata and embeddings from AnnData object.")
                        integration_results = get_metadata_from_anndata(adata, pp_stage, process_id, process, method, parameters, md5, layer=None, use_rep="X_scVI", adata_path=adata_path, scanpy_cluster=batch_key, zarr_path=zarr_output, obsSets=[{"name": "Batch", "path": "obs/" + batch_key}])

                        # Add preset questions for tissue and species
                        if organ_part is not None and organ_part != "" and species is not None and species != "":
                            preset_questions = create_annotation_prompt(adata, tissue=organ_part, species=species, use_rep="X_scVI", method="t-test", groupby="X_scVI_leiden", top=n_hvg, task="Batch Integration")
                            integration_results['preset_questions'] = preset_questions

                        integration_output.append({f"{method}_AnnData": adata_path})
                        integration_results['outputs'] = integration_output
                        adata_outputs.update({method: adata_path})
                        adata = None
                        redislogger.info(job_id, integration_results['info'])
                        integration_results['datasetIds'] = datasetIds
                        integration_results['created_by'] = userID
                        create_pp_results(process_id, integration_results)  # Insert pre-process results to database 
                        process_ids.append(process_id)

                else:
                    if parameters['batch_key'] is None or parameters['batch_key'].strip() == '':
                        # adata.obs['batch'] = os.path.basename(input[0]).split('.')[0]
                        # batch_key = 'batch'
                        detail = f"{method} integration is failed: 'Batch Key' is required for {method} integration."
                        redislogger.error(job_id, detail)
                        if not wf:
                            raise CeleryTaskException(detail)
                        
                    redislogger.info(job_id, f"Start {method} integration...")
                    # report_path = get_report_path(dataset, output, "integration")
                    # Get the absolute path of the current file
                    current_file = os.path.abspath(__file__)
                    # Construct the relative path to the desired file
                    relative_path = os.path.join(os.path.dirname(current_file), 'integration', 'integration.Rmd')
                    # Get the absolute path of the desired file
                    rmd_path = os.path.abspath(relative_path)
                    # s = subprocess.call([f"R -e \"rmarkdown::render('{rmd_path}', params=list(unique_id='{job_id}', datasets='{datasets}', inputs='{input}', output_folder='{output}', adata_path='{adata_path}', methods='{methods}', dims='{dims}', npcs='{npcs}', default_assay='{default_assay}', reference='{reference}'), output_file='{report_path}')\""], shell = True)
                    s = subprocess.call([f"R -e \"rmarkdown::render('{rmd_path}', params=list(unique_id='{job_id}', datasets='{datasets}', batch_key='{parameters['batch_key']}', inputs='{input_str}', output_folder='{output}', adata_path='{adata_path}', methods='{method}', dims={dims}, npcs={npcs}, resolution={resolution}, default_assay='{default_assay}'), output_file='{report_path}')\""], shell = True)
                    # redislogger.info(job_id, str(s))
                    print(f"R -e \"rmarkdown::render('{rmd_path}', params=list(unique_id='{job_id}', datasets='{datasets}', inputs='{input_str}', output_folder='{output}', adata_path='{adata_path}', fig_path='{fig_path}', methods='{method}', dims={dims}, npcs={npcs}, default_assay='{default_assay}'), output_file='{report_path}')\"")

                    if os.path.exists(adata_path):
                        redislogger.info(job_id, "Adding 2D & 3D UMAP to AnnData object.")
                        adata = load_anndata(adata_path)
                        sc.pp.neighbors(adata, n_neighbors=dims, n_pcs=npcs, random_state=0)
                        adata = sc.tl.umap(adata, random_state=0, 
                                        init_pos="spectral", n_components=2, 
                                        copy=True, maxiter=None)
                        adata_3D = sc.tl.umap(adata, random_state=0, 
                                        init_pos="spectral", n_components=3, 
                                        copy=True, maxiter=None)
                        adata.obsm["X_umap_3D"] = adata_3D.obsm["X_umap"]

                        # Pseudo replicates
                        if pseudo_replicates > 1:
                            adata = create_pseudo_replicates(adata, parameters['batch_key'], pseudo_replicates)

                        # Converrt dense martrix to sparse matrix
                        if isinstance(adata.X, np.ndarray):
                            adata.X = csr_matrix(adata.X)

                        # adata.write_h5ad(adata_path, compression='gzip')
                        adata_path, zarr_output = save_anndata(adata, adata_path, zarr=True, n_hvg=n_hvg, obs_cols=[parameters['batch_key']])
                        adata_3D = None
                    else:
                        upsert_jobs(
                            {
                                "job_id": job_id, 
                                "results": "AnnData file does not exist due to the failure of Integration.",
                                "Completed on": datetime.now(),
                                "Status": "Failure"
                            }
                        )
                        raise ValueError("AnnData file does not exist due to the failure of Integration.")

                    if fig_path is not None:
                            plot_embedding(adata, color=parameters['batch_key'], fig_path=fig_path, title=method + " Integration")
                
                    redislogger.info(job_id, "Retrieving metadata and embeddings from AnnData object.")
                    # integration_results = get_metadata_from_anndata(adata, pp_stage, process_id, process, method, parameters, md5, layer=None, adata_path=adata_path, seurat_path=output, cluster_colname=parameters['batch_key'], zarr_path=zarr_output, obsSets=[{"name": "Batch", "path": "obs/" + parameters['batch_key']}])
                    integration_results = get_metadata_from_anndata(adata, pp_stage, process_id, process, method, parameters, md5, layer=None, adata_path=adata_path, seurat_path=output, zarr_path=zarr_output, obsSets=[{"name": "Batch", "path": "obs/" + parameters['batch_key']}])
                    
                    # Add preset questions for tissue and species
                    if organ_part is not None and organ_part != "" and species is not None and species != "":
                        preset_questions = create_annotation_prompt(adata, tissue=organ_part, species=species, method="t-test", groupby="leiden", top=n_hvg, task="Batch Integration")
                        integration_results['preset_questions'] = preset_questions

                    tools_path = adata_path.replace('.h5ad', '.txt')
                    if os.path.exists(tools_path):
                        tools = get_r_tools(tools_path)
                        integration_results['tools'] = tools

                    # integration_output.append({method: {'adata_path': adata_path, 'seurat_path': output}})
                    integration_output.append({f"{method}_AnnData": adata_path})
                    integration_output.append({f"{method}_Seurat": output})
                    integration_output.append({f"{method}_Report": report_path})
                    integration_results['outputs'] = integration_output
                    adata_outputs.update({method: adata_path})
                    adata = None
                    redislogger.info(job_id, integration_results['info'])
                    integration_results['datasetIds'] = datasetIds
                    integration_results['created_by'] = userID
                    create_pp_results(process_id, integration_results)  # Insert pre-process results to database 
                    process_ids.append(process_id) 

            except Exception as e:
                upsert_jobs(
                    {
                        "job_id": job_id, 
                        "results": f"Integration is failed: {e}",
                        "Completed on": datetime.now(),
                        "Status": "Failure"
                    }
                )
                detail = f"{method} integration is failed: {e}"
                redislogger.error(job_id, detail)
                if not wf:
                    raise CeleryTaskException(detail)

    results = {
        "output": integration_output,
        "default_assay": default_assay,
        "md5": md5,
        "adata_path": adata_outputs,
        "process_ids": process_ids
    }

    upsert_jobs(
        {
            "job_id": job_id, 
            "output": integration_output,
            "datasetIds": datasetIds,
            "process_ids": process_ids,
            "results": results,
            "Completed on": datetime.now(),
            "Status": "Success"
        }
    )

    return results

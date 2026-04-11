import os
import subprocess
import sys
from tools.formating.formating import *
from tools.annotation.celltypist import run_celltypist
from tools.annotation.scanvi import scanvi_transfer
from tools.annotation.SingleR import run_singler
from config.celery_utils import get_input_path, get_output
from utils.redislogger import *
from tools.reduction.reduction import *
from utils.mongodb import generate_process_id, pp_result_exists, create_pp_results, upsert_jobs
from utils.unzip import unzip_file_if_compressed
from fastapi import HTTPException, status
from scipy.sparse import csr_matrix
from exceptions.custom_exceptions import CeleryTaskException
from datetime import datetime
    

def run_annotation(job_id, ds:dict, fig_path=None, description=None, show_error=True, random_state=0, wf=False):
    pp_results = []
    process_ids = []
    annotation_output = []
    pp_stage = "Annotation"
    process = "Annotation"
    dataset = ds['dataset']
    n_hvg = ds['n_hvg']
    species = ds['species'].lower()
    organ_part = ds['organ_part']
    input = ds['input']
    user_refs = ds['user_refs']
    userID = ds['userID']
    output = ds['output']
    datasetId = ds['datasetId']
    do_umap = ds['do_umap']
    do_cluster = ds['do_cluster']
    parameters = ds['annotation_params']
    layer = None
    if parameters['layer'] is not None and parameters['layer'].strip != "":
        layer = parameters['layer']
    assay = parameters['assay']
    methods = parameters['methods']
    celltypist_model = parameters['celltypist_model']
    SingleR_ref = parameters['SingleR_ref']
    user_label = parameters['user_label']
    n_neighbors = parameters['n_neighbors']
    n_pcs = parameters['n_pcs']
    resolution = parameters['resolution']
    obsSets = []
    obs_cols = []
    preset_questions = []

    upsert_jobs(
        {
            "job_id": job_id, 
            "created_by": userID,
            "Status": "Processing"
        }
    )
    
    if methods is None:
        redislogger.error(job_id, "No annotation method is selected.")
        detail = 'No annotation method is selected.'
        if not wf:
            raise CeleryTaskException(detail)
    
    input = unzip_file_if_compressed(job_id, ds['input'])
    md5 = get_md5(input)
    process_id = generate_process_id(md5, process, methods, parameters)
    # output = get_output_path(output, process_id, dataset, method='annotation')
    adata_path = get_output_path(output, process_id, dataset, method='annotation')

    adata = load_anndata(input)
    if adata is None:
        detail = f"The file format is not supported: {input}"
        upsert_jobs(
            {
                "job_id": job_id, 
                "results": detail,
                "Completed on": datetime.now(),
                "Status": "Failure"
            }
        )
        if wf:
            redislogger.error(job_id, detail)
        else:
            raise CeleryTaskException(detail)

    redislogger.info(job_id, f"Using Annotation Parameters: {parameters}")
    methodMap = ', '.join(methods)
    methodsArr = methods
    methods = [x.upper() for x in methods if isinstance(x, str)]
    for method in methods:
        
        # adata_path = get_output_path(output, process_id, dataset, method=method)
        annotation_results = pp_result_exists(process_id)

        if annotation_results is not None:
            redislogger.info(job_id, f"Found existing pre-process results in database, skip {method} annotation.")
            process_ids.append(process_id)
            annotation_output = annotation_results["outputs"]
        else:
            if method == "CELLTYPIST":
                try:
                    redislogger.info(job_id, "Start CellTypist annotation...")
                    adata = run_celltypist(adata, model_name=celltypist_model, refs = user_refs, labels = user_label, species = species)
                    redislogger.info(job_id, "CellTypist annotation has been added to AnnData.obs.")
                    
                    # if do_umap:
                    #     redislogger.info(job_id, "Computing PCA, neighborhood graph, tSNE, UMAP, and 3D UMAP")
                    #     adata, msg = run_dimension_reduction(adata, n_neighbors=n_neighbors, n_pcs=n_pcs, random_state=random_state)
                    #     if msg is not None: redislogger.warning(job_id, msg)
                    # if do_cluster:
                    #     redislogger.info(job_id, "Clustering the neighborhood graph.")
                    #     adata = run_clustering(adata, resolution=resolution, random_state=random_state, fig_path=fig_path)

                    # adata.write_h5ad(adata_path, compression='gzip')
                    if "celltypist_label" in adata.obs.keys():
                        obsSets.append({"name":"celltypist_label", "path":"obs/celltypist_label"})
                        obs_cols.append("celltypist_label")
                        if fig_path is not None:
                            plot_embedding(adata, color="celltypist_label", fig_path=fig_path, title="CellTypist UMAP of " + description)
                    if "celltypist_ref_label" in adata.obs.keys():
                        obsSets.append({"name":"celltypist_ref_label", "path":"obs/celltypist_ref_label"})
                        obs_cols.append("celltypist_ref_label")
                        if fig_path is not None:
                            plot_embedding(adata, color="celltypist_ref_label", fig_path=fig_path, title="CellTypist Ref UMAP of " + description)

                    # Add preset questions for tissue and species
                    if organ_part is not None and organ_part != "" and species is not None and species != "":
                        if "leiden" not in adata.obs.columns:
                            adata = run_clustering(adata, resolution=resolution, random_state=0)
                        preset_question = create_annotation_prompt(adata, tissue=organ_part, species=species, method="t-test", groupby="leiden", top=n_hvg, task="Cell Type Annotation")
                        preset_questions.append(preset_question[0])
                        
                    # adata_path, zarr_output = save_anndata(adata, adata_path, zarr=True, n_hvg=n_hvg)
                    # redislogger.info(job_id, "Retrieving metadata and embeddings from AnnData object.")
                    # annotation_results = get_metadata_from_anndata(adata, pp_stage, process_id, process, method, parameters, md5, adata_path=adata_path, zarr_path=zarr_output, obsSets=obsSets)

                    # annotation_output.append({"CellTypist": adata_path})
                    # annotation_results["outputs"] = annotation_output
                    # redislogger.info(job_id, "AnnData object for CellTypist annotation is saved successfully")
                    # process_ids.append(process_id)

                    # annotation_results['datasetId'] = datasetId
                    # create_pp_results(process_id, annotation_results)  # Insert pre-process results to database
                    # pp_results.append(annotation_results)

                except Exception as e:
                    detail = f"CellTypist annotation is failed: {e}"
                    upsert_jobs(
                        {
                            "job_id": job_id, 
                            "results": detail,
                            "Completed on": datetime.now(),
                            "Status": "Failure"
                        }
                    )
                    # os.remove(output)
                    redislogger.error(job_id, detail)
                    if not wf:
                        raise CeleryTaskException(detail)

            if method == "SCANVI":
                try:
                    redislogger.info(job_id, "Start scANVI annotation...")
                    adata = scanvi_transfer(adata, refs = user_refs, labels = user_label)
                    redislogger.info(job_id, "scANVI cell type transfer has been added to AnnData.obs.")

                    # if do_umap:
                    #     redislogger.info(job_id, "Computing PCA, neighborhood graph, tSNE, UMAP, and 3D UMAP")
                    #     adata, msg = run_dimension_reduction(adata, n_neighbors=n_neighbors, n_pcs=n_pcs, random_state=random_state)
                    #     if msg is not None: redislogger.warning(job_id, msg)
                    # if do_cluster:
                    #     redislogger.info(job_id, "Clustering the neighborhood graph.")
                    #     adata = run_clustering(adata, resolution=resolution, random_state=random_state, fig_path=fig_path)

                    if "scANVI_predicted" in adata.obs.keys():
                        obsSets.append({"name":"scANVI_predicted", "path":"obs/scANVI_predicted"})
                        obs_cols.append("scANVI_predicted")
                        if fig_path is not None:
                            plot_embedding(adata, color="scANVI_predicted", fig_path=fig_path, title="scANVI UMAP of " + description)
                    # Add preset questions for tissue and species
                    if organ_part is not None and organ_part != "" and species is not None and species != "":
                        if "X_scVI_leiden" not in adata.obs.columns:
                            adata = run_clustering(adata, resolution=resolution, use_rep="X_scVI", random_state=0)
                        preset_question = create_annotation_prompt(adata, tissue=organ_part, species=species, use_rep="X_scVI", method="t-test", groupby="X_scVI_leiden", top=n_hvg, task="Cell Type Annotation")
                        preset_questions.append(preset_question[0])
                    # adata.write_h5ad(adata_path, compression='gzip')
                    # adata_path, zarr_output = save_anndata(adata, adata_path, zarr=True, n_hvg=n_hvg)
                    # redislogger.info(job_id, "Retrieving metadata and embeddings from AnnData object.")
                    # annotation_results = get_metadata_from_anndata(adata, pp_stage, process_id, process, method, parameters, md5, adata_path=adata_path, zarr_path=zarr_output, obsSets=obsSets)

                    # annotation_output.append({"scANVI": adata_path})
                    # annotation_results["outputs"] = annotation_output
                    # # adata = None
                    # redislogger.info(job_id, "AnnData object for scANVI annotation is saved successfully")
                    # process_ids.append(process_id)
                    # annotation_results['datasetId'] = datasetId
                    # create_pp_results(process_id, annotation_results)  # Insert pre-process results to database
                    # pp_results.append(annotation_results)

                except Exception as e:
                    detail = f"scANVI annotation is failed: {e}"
                    upsert_jobs(
                        {
                            "job_id": job_id, 
                            "results": detail,
                            "Completed on": datetime.now(),
                            "Status": "Failure"
                        }
                    )
                    # os.remove(adata_path)
                    redislogger.error(job_id, detail)
                    if not wf:
                        raise CeleryTaskException(detail)

            if method == "SINGLER":
                if len(SingleR_ref) == 0 and (len(user_refs) == 0 or user_label is None):
                    redislogger.error(job_id, f"SingleR annotation is failed due to empty reference ({SingleR_ref}) and empty user reference ({user_refs}) or cell labels ({user_label}).")
                    if not wf:
                        raise CeleryTaskException(f"SingleR annotation is failed due to empty reference ({SingleR_ref}) and empty user reference ({user_refs}) or cell labels ({user_label}).")

                try:
                    # # report_path = get_report_path(dataset, output, "SAVER")
                    # report_path = adata_path.replace(".h5ad", "_report.html")
                    # output_folder = os.path.dirname(adata_path)
                    
                    # # Get the absolute path of the current file
                    # current_file = os.path.abspath(__file__)

                    # # Construct the relative path to the desired file
                    # relative_path = os.path.join(os.path.dirname(current_file), 'annotation', 'singleR.Rmd')

                    # # Get the absolute path of the desired file
                    # singler_path = os.path.abspath(relative_path)

                    # redislogger.info(job_id, " Start SingleR annotation ...")
                    # if user_label is not None and len(user_refs) > 0:
                    #     s = subprocess.call([f"R -e \"rmarkdown::render('{singler_path}', params=list(unique_id='{job_id}', dataset='{dataset}', input='{input}', output_folder='{output_folder}', dims={n_neighbors}, npcs={n_pcs}, resolution={resolution}, species='{species}', default_assay='{assay}', reference='{SingleR_ref}', user_ref='{user_refs[0]}', user_label='{user_label}'), output_file='{report_path}')\""], shell = True)
                    # else:
                    #     s = subprocess.call([f"R -e \"rmarkdown::render('{singler_path}', params=list(unique_id='{job_id}', dataset='{dataset}', input='{input}', output_folder='{output_folder}', dims={n_neighbors}, npcs={n_pcs}, resolution={resolution}, species='{species}', default_assay='{assay}', reference='{SingleR_ref}'), output_file='{report_path}')\""], shell = True)

                    # csv_main = output_folder + "/results_main.csv"
                    # csv_fine = output_folder + "/results_fine.csv"
                    # csv_user = output_folder + "/results_user.csv"

                    # if not (os.path.exists(csv_main) or os.path.exists(csv_fine) or os.path.exists(csv_user)):
                    #     upsert_jobs(
                    #         {
                    #             "job_id": job_id, 
                    #             "results": "SingleR annotation is failed.",
                    #             "Completed on": datetime.now(),
                    #             "Status": "Failure"
                    #         }
                    #     )
                    #     # redislogger.warning(job_id, 'SingleR annotation is failed.')
                    #     raise CeleryTaskException('SingleR annotation is failed.')

                    # if os.path.exists(csv_main):
                    #     df_main = pd.read_csv(csv_main, index_col=0)
                    #     adata.obs['SingleR_main'] = df_main['labels']
                    #     adata.obs['SingleR_main.pruned'] = df_main['pruned.labels']
                    
                    # if os.path.exists(csv_fine):
                    #     df_fine = pd.read_csv(csv_fine, index_col=0)
                    #     adata.obs['SingleR_fine'] = df_fine['labels']
                    #     adata.obs['SingleR_fine.pruned'] = df_fine['pruned.labels']

                    # if os.path.exists(csv_user):
                    #     df_user = pd.read_csv(csv_user, index_col=0)
                    #     adata.obs['SingleR_user_ref'] = df_user['labels']
                    #     adata.obs['SingleR_user_ref.pruned'] = df_user['pruned.labels']

                    adata = run_singler(adata, SingleR_ref=SingleR_ref, user_ref=user_refs, user_label=user_label)

                    # if do_umap:
                    #     redislogger.info(job_id, "Computing PCA, neighborhood graph, tSNE, UMAP, and 3D UMAP")
                    #     adata, msg = run_dimension_reduction(adata, n_neighbors=n_neighbors, n_pcs=n_pcs, random_state=random_state)
                    #     if msg is not None: redislogger.warning(job_id, msg)
                    # if do_cluster:
                    #     redislogger.info(job_id, "Clustering the neighborhood graph.")
                    #     adata = run_clustering(adata, resolution=resolution, random_state=random_state, fig_path=fig_path)

                    if "SingleR_main" in adata.obs.keys():
                        obsSets.append({"name":"SingleR_main", "path":"obs/SingleR_main"})
                        obs_cols.append("SingleR_main")
                        if fig_path is not None:
                            plot_embedding(adata, color="SingleR_main", fig_path=fig_path, title="SingleR main UMAP of " + description)
                    if "SingleR_fine" in adata.obs.keys():
                        obsSets.append({"name":"SingleR_fine", "path":"obs/SingleR_fine"})
                        obs_cols.append("SingleR_fine")
                        if fig_path is not None:
                            plot_embedding(adata, color="SingleR_fine", fig_path=fig_path, title="SingleR fine UMAP of " + description)
                    if "SingleR_user_ref" in adata.obs.keys():
                        obsSets.append({"name":"SingleR_user_ref", "path":"obs/SingleR_user_ref"})
                        obs_cols.append("SingleR_user_ref")
                        if fig_path is not None:
                            plot_embedding(adata, color="SingleR_user_ref", fig_path=fig_path, title="SingleR Ref UMAP of " + description)
                    
                    # Add preset questions for tissue and species
                    if organ_part is not None and organ_part != "" and species is not None and species != "":
                        if "leiden" not in adata.obs.columns:
                            adata = run_clustering(adata, resolution=resolution, random_state=0)
                        preset_question = create_annotation_prompt(adata, tissue=organ_part, species=species, method="t-test", groupby="leiden", top=n_hvg, task="Cell Type Annotation")
                        preset_questions.append(preset_question[0])
                    # adata.write_h5ad(adata_path, compression='gzip')
                    # adata_path, zarr_output = save_anndata(adata, adata_path, zarr=True, n_hvg=n_hvg)
                    # redislogger.info(job_id, "Retrieving metadata and embeddings from AnnData object.")
                    # annotation_results = get_metadata_from_anndata(adata, pp_stage, process_id, process, method, parameters, md5, adata_path=adata_path, zarr_path=zarr_output, obsSets=obsSets)
                    
                    # annotation_output.append({"SingleR": adata_path})
                    # # annotation_output.append({"Report": report_path})
                    # annotation_results["outputs"] = annotation_output
                    # redislogger.info(job_id, "AnnData object for SingleR annotation is saved successfully")
                    # process_ids.append(process_id)
                    # annotation_results['datasetId'] = datasetId
                    # create_pp_results(process_id, annotation_results)  # Insert pre-process results to database
                    # pp_results.append(annotation_results)
            
                except Exception as e:
                    detail = f"SingleR annotation is failed: {e}"
                    upsert_jobs(
                        {
                            "job_id": job_id, 
                            "results": detail,
                            "Completed on": datetime.now(),
                            "Status": "Failure"
                        }
                    )
                    redislogger.error(job_id, detail)
                    if not wf:
                        raise CeleryTaskException(detail)

    if do_umap:
        redislogger.info(job_id, "Computing PCA, neighborhood graph, tSNE, UMAP, and 3D UMAP")
        adata, msg = run_dimension_reduction(adata, n_neighbors=n_neighbors, n_pcs=n_pcs, random_state=random_state)
        if msg is not None: redislogger.warning(job_id, msg)
    if do_cluster:
        redislogger.info(job_id, "Clustering the neighborhood graph.")
        adata = run_clustering(adata, resolution=resolution, random_state=random_state)

    adata_path, zarr_output = save_anndata(adata, adata_path, zarr=True, n_hvg=n_hvg, obs_cols=obs_cols)
    dictKey = description if description else ', '.join(methodsArr) + ' Annotation'
    annotation_output.append({dictKey: adata_path})
    seen = set()
    annotation_output = [x for x in annotation_output if x[dictKey] not in seen and not seen.add(x[dictKey])] # Deduplicate outputs
    redislogger.info(job_id, "Retrieving metadata and embeddings from AnnData object.")
    annotation_results = get_metadata_from_anndata(adata, pp_stage, process_id, process, methodMap, parameters, md5, description=description, adata_path=adata_path, zarr_path=zarr_output, obsSets=obsSets)
    # annotation_output = [dict(fs) for fs in set(frozenset(d.items()) for d in annotation_output)]  # De-duplicate outputs
    annotation_results['preset_questions'] = preset_questions
    annotation_results["outputs"] = annotation_output
    redislogger.info(job_id, "AnnData object for Annotation is saved successfully")
    process_ids.append(process_id)
    process_ids = list(set(process_ids)) # De-duplicate process_ids

    annotation_results['datasetId'] = datasetId
    annotation_results['created_by'] = userID
    create_pp_results(process_id, annotation_results)  # Insert pre-process results to database
    pp_results.append(annotation_results)
    
    results = {
        "output": annotation_output,
        "adata_path": adata_path,
        "md5": md5,
        "process_ids": process_ids,
    }

    upsert_jobs(
        {
            "job_id": job_id, 
            "datasetId": datasetId,
            "process_ids": process_ids,
            "adata_path": adata_path,
            "output": annotation_output,
            "results": results,
            "Completed on": datetime.now(),
            "Status": "Success"
        }
    )

    adata = None

    return results

    
    

        
            


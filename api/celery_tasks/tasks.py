from typing import List
from celery import shared_task
from tools.formating.formating import *
from tools.run_qc import run_qc
from tools.run_normalization import run_normalization
from tools.run_imputation import run_imputation
from tools.run_integration import run_integration
from tools.run_evaluation import run_evaluation
from tools.run_reduction import run_reduction
from tools.run_annotation import run_annotation
from tools.run_conversion import run_conversion
from tools.load_metadata import load_metadata
from tools.run_manual_annotation import run_manual_annotation
from tools.run_outlier_correction import run_outlier_correction
from benchmarks.run_benchmarks import run_benchmarks
from benchmarks.run_data_split import run_data_split
from benchmarks.run_subset_data import run_subset_data
from workflows.clustering import run_clustering
from workflows.integration import run_integration_wf
from workflows.annotation import run_annotation_wf
from utils.mongodb import get_pp_results
from tools.formating.formating import df_to_dict
from tools.visualization.plot import plot_UMAP_obs, plot_violin, plot_scatter, plot_highest_expr_genes
from urllib.parse import quote
import json
from fastapi import HTTPException, WebSocketException

# from oscb_cli.runDownloadDataset import run_download_dataset


@shared_task(bind=True, name='tools:create_qc_task') 
def create_qc_task(self, ds_dict:dict):
    job_id = self.request.id
    results = run_qc(job_id, ds_dict)
    return results


@shared_task(bind=True, name='tools:create_normalization_task') 
def create_normalization_task(self, ds_dict:dict):
    job_id = self.request.id
    results = run_normalization(job_id, ds_dict)
    return results


@shared_task(bind=True, name='tools:create_imputation_task') 
def create_imputation_task(self, ds_dict:dict):
    job_id = self.request.id
    results = run_imputation(job_id, ds_dict)
    return results


@shared_task(bind=True, name='tools:create_reduction_task') 
def create_reduction_task(self, ds_dict:dict):
    job_id = self.request.id
    results = run_reduction(job_id, ds_dict)
    return results


@shared_task(bind=True, name='tools:create_conversion_task') 
def create_conversion_task(self, ds_dict:dict):
    job_id = self.request.id
    results = run_conversion(job_id, ds_dict)
    return results


@shared_task(bind=True, name='tools:create_integration_task') 
def create_integration_task(self, ids_dict:dict):
    job_id = self.request.id
    results = run_integration(job_id, ids_dict)
    return results


@shared_task(bind=True, name='tools:load_metadata_task') 
def load_metadata_task(self, file_dict:dict):
    job_id = self.request.id
    results = load_metadata(job_id, file_dict)
    return results


@shared_task(bind=True, name='tools:create_evaluation_task') 
def create_evaluation_task(self, dataset, input, userID, output, methods, layer=None, genes=None, ncores=12, show_error=True):
    job_id = self.request.id
    results = run_evaluation(job_id, dataset, input, userID, output, methods, layer=None, genes=None, ncores=12, show_error=True)
    return results


@shared_task(bind=True, name='tools:create_annotation_task') 
def create_annotation_task(self, ds_dict:dict):
    job_id = self.request.id
    results = run_annotation(job_id, ds_dict)
    return results


# Benchmarks
@shared_task(bind=True, name='tools:create_benchmarks_task') 
def create_benchmarks_task(self, task_dict:dict):
    job_id = self.request.id
    results = run_benchmarks(job_id, task_dict)
    return results


@shared_task(bind=True, name='tools:create_data_split_task') 
def create_data_split_task(self, task_dict:dict):
    job_id = self.request.id
    results = run_data_split(job_id, task_dict)
    return results


@shared_task(bind=True, name='tools:create_subset_data_task') 
def create_subset_data_task(self, task_dict:dict):
    job_id = self.request.id
    results = run_subset_data(job_id, task_dict)
    return results


# Workflows
@shared_task(bind=True, name='tools:create_clustering_task') 
def create_clustering_task(self, ds_dict:dict):
    job_id = self.request.id
    results = run_clustering(job_id, ds_dict)
    return results


@shared_task(bind=True, name='tools:create_integration_wf_task') 
def create_integration_wf_task(self, dss_dict:dict):
    job_id = self.request.id
    results = run_integration_wf(job_id, dss_dict)
    return results


@shared_task(bind=True, name='tools:create_annotation_wf_task') 
def create_annotation_wf_task(self, dss_dict:dict):
    job_id = self.request.id
    results = run_annotation_wf(job_id, dss_dict)
    return results


@shared_task(bind=True, name='tools:manual_annotation_task') 
def manual_annotation_task(self, ma_dict:dict):
    job_id = self.request.id
    # self.update_state(state='PROCESSING')
    results = run_manual_annotation(job_id, ma_dict)
    return results


@shared_task(bind=True, name='tools:outlier_correction_task') 
def outlier_correction_task(self, oc_dict:dict):
    job_id = self.request.id
    # self.update_state(state='PROCESSING')
    results = run_outlier_correction(job_id, oc_dict)
    return results


# #cli
# @shared_task(bind=True, name='tools:create_download_dataset_task') 
# def create_download_dataset_task(self, ds_dict:dict):
#     job_id = self.request.id
#     results = run_download_dataset(job_id, ds_dict)
#     return results


# Web API tasks
@shared_task(bind=True, name='web:getPreProcessResults') 
def getPreProcessResults(self, req_dict: dict):
    """
    Get details of pp_results
    """
    process_ids = req_dict['process_ids']
    record_type = req_dict['record_type']
    if len(process_ids) == 0:
        raise HTTPException(status_code=400, detail="No process ID is provided.")

    pp_results = get_pp_results(process_ids, record_type=record_type)
    results = []

    if len(pp_results) == 0:
        raise HTTPException(status_code=404, detail="No pp_result is found.")
    
    for pp_result in pp_results:
        obs = pp_result['cell_metadata']
        pp_result['cell_metadata'] = df_to_dict(obs)
        # pp_result['obs'] = pp_result['obs']
        print(f"obs.shape: {obs.shape}")
        
        if 'atac_cell_metadata' in pp_result.keys():
            atac_obs = pp_result['atac_cell_metadata']
            pp_result['atac_cell_metadata'] = df_to_dict(atac_obs)
            # pp_result['atac_obs'] = pp_result['atac_obs']

        if record_type == None:
            pp_result['cell_metadata_head'] = obs.dropna().head().to_dict() # Replace NA
            if 'umap' in pp_result.keys():
                pp_result['umap_plot'] = plot_UMAP_obs(obs, pp_result['umap'], layer=pp_result['layer'])
                pp_result['umap'] = pp_result['umap'].tolist()
                print(f"umap.shape: {obs.shape}")

            if 'umap_3d' in pp_result.keys():
                pp_result['umap_plot_3d'] = plot_UMAP_obs(obs, pp_result['umap_3d'], layer=pp_result['layer'], n_dim=3)
                pp_result['umap_3d'] = pp_result['umap_3d'].tolist()
                print(f"umap_3d.shape: {obs.shape}")

            if 'tsne' in pp_result.keys():
                pp_result['tsne_plot'] = plot_UMAP_obs(obs, pp_result['tsne'], layer=pp_result['layer'], plot_name='t-SNE')
                pp_result['tsne'] = pp_result['tsne'].tolist()
                print(f"tsne.shape: {obs.shape}")

            if 'tsne_3d' in pp_result.keys():
                pp_result['tsne_plot_3d'] = plot_UMAP_obs(obs, pp_result['tsne_3d'], layer=pp_result['layer'], n_dim=3, plot_name='t-SNE')
                pp_result['tsne_3d'] = pp_result['tsne_3d'].tolist()
                print(f"tsne_3d.shape: {obs.shape}")

            if 'atac_umap' in pp_result.keys():
                pp_result['atac_umap_plot'] = plot_UMAP_obs(atac_obs, pp_result['atac_umap'], layer=pp_result['layer'])
                pp_result['atac_umap'] = pp_result['atac_umap'].tolist()

            if 'atac_umap_3d' in pp_result.keys():
                pp_result['atac_umap_plot_3d'] = plot_UMAP_obs(atac_obs, pp_result['atac_umap_3d'], layer=pp_result['layer'], n_dim=3)
                pp_result['atac_umap_3d'] = pp_result['atac_umap_3d'].tolist()

            if pp_result['process'] == 'QC':
                pp_result['violin_plot'] = plot_violin(obs)
                pp_result['scatter_plot'] = plot_scatter(obs)
                if 'highest_expr_genes' in pp_result.keys():
                    pp_result['highest_expr_genes_plot'] = plot_highest_expr_genes(pp_result['highest_expr_genes']['counts_top_genes'], pp_result['highest_expr_genes']['columns'])
                    pp_result.pop('highest_expr_genes')

        results.append(pp_result)

    return results


@shared_task(name='web:umapplot') 
def umapplot(self, req_dict: dict):
    """
    Get details of pp_results
    """
    process_ids = req_dict['process_ids']
    clustering_plot_type = req_dict['clustering_plot_type']
    annotation = req_dict['annotation']

    umap_plots = []
    if len(process_ids) == 0:
        raise HTTPException(status_code=400, detail="No process ID is provided.")

    pp_results = get_pp_results(process_ids, umap=True)

    if len(pp_results) == 0:
        raise HTTPException(status_code=404, detail="No UMAP is found.")
    
    for pp_result in pp_results:
        umap_plot = {}
        if 'umap' in pp_result.keys():
            umap_plot['umap_plot'] = plot_UMAP_obs(pp_result['cell_metadata'], pp_result['umap'], clustering_plot_type=clustering_plot_type, annotation=annotation)
        if 'umap_3d' in pp_result.keys():
            umap_plot['umap_plot_3d'] = plot_UMAP_obs(pp_result['cell_metadata'], pp_result['umap_3d'], clustering_plot_type=clustering_plot_type, n_dim=3, annotation=annotation)
        umap_plots.append(umap_plot)
    
    return umap_plots

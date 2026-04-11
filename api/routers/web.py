import os
from fastapi import APIRouter, HTTPException
from starlette.responses import JSONResponse
from fastapi.responses import StreamingResponse

from celery_tasks.tasks import getPreProcessResults, umapplot

from utils.mongodb import get_pp_results
from tools.formating.formating import df_to_dict
from tools.visualization.plot import plot_UMAP_obs, plot_violin, plot_scatter, plot_highest_expr_genes
from schemas.schemas import ProcessResultsRequest
from urllib.parse import quote
import json

router = APIRouter(prefix='/api', tags=['web'], responses={404: {"description": "API Not found"}})


@router.post("/getPreProcessResults")
async def getPreProcessResults_sync(req: ProcessResultsRequest):
    """
    Get details of pp_results
    """
    req_dict = req.model_dump() 
    task = getPreProcessResults.apply_async(args=[req_dict])

    return JSONResponse({"job_id": task.id})


@router.post("/plotumap")
async def umapplot_sync(req: ProcessResultsRequest):
    """
    Get details of pp_results
    """
    req_dict = req.model_dump() 
    task = umapplot.apply_async(args=[req_dict])

    return JSONResponse({"job_id": task.id})


@router.post("/getPreProcessResultsMain")
async def getPreProcessResultsMain(req: ProcessResultsRequest) -> list:
    """
    Get details of pp_results
    """
    req_dict = req.model_dump() 
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
        
        if 'atac_cell_metadata' in pp_result.keys():
            atac_obs = pp_result['atac_cell_metadata']
            pp_result['atac_cell_metadata'] = df_to_dict(atac_obs)
            # pp_result['atac_obs'] = pp_result['atac_obs']

        if record_type == None:
            pp_result['cell_metadata_head'] = obs.dropna().head().to_dict() # Replace NA
            if 'umap' in pp_result.keys():
                pp_result['umap_plot'] = plot_UMAP_obs(obs, pp_result['umap'], layer=pp_result['layer'])
                pp_result['umap'] = pp_result['umap'].tolist()

            if 'umap_3d' in pp_result.keys():
                pp_result['umap_plot_3d'] = plot_UMAP_obs(obs, pp_result['umap_3d'], layer=pp_result['layer'], n_dim=3)
                pp_result['umap_3d'] = pp_result['umap_3d'].tolist()

            if 'tsne' in pp_result.keys():
                pp_result['tsne_plot'] = plot_UMAP_obs(obs, pp_result['tsne'], layer=pp_result['layer'], plot_name='t-SNE')
                pp_result['tsne'] = pp_result['tsne'].tolist()

            if 'tsne_3d' in pp_result.keys():
                pp_result['tsne_plot_3d'] = plot_UMAP_obs(obs, pp_result['tsne_3d'], layer=pp_result['layer'], n_dim=3, plot_name='t-SNE')
                pp_result['tsne_3d'] = pp_result['tsne_3d'].tolist()

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


# @router.post("/plotumap")
# async def umapplot(req: ProcessResultsRequest) -> list:
#     """
#     Get details of pp_results
#     """
#     req_dict = req.model_dump() 
#     process_ids = req_dict['process_ids']
#     clustering_plot_type = req_dict['clustering_plot_type']
#     annotation = req_dict['annotation']

#     umap_plots = []
#     if len(process_ids) == 0:
#         raise HTTPException(status_code=400, detail="No process ID is provided.")

#     pp_results = get_pp_results(process_ids, umap=True)

#     if len(pp_results) == 0:
#         raise HTTPException(status_code=404, detail="No UMAP is found.")
    
#     for pp_result in pp_results:
#         umap_plot = {}
#         if 'umap' in pp_result.keys():
#             umap_plot['umap_plot'] = plot_UMAP_obs(pp_result['cell_metadata'], pp_result['umap'], clustering_plot_type=clustering_plot_type, annotation=annotation)
#         if 'umap_3d' in pp_result.keys():
#             umap_plot['umap_plot_3d'] = plot_UMAP_obs(pp_result['cell_metadata'], pp_result['umap_3d'], clustering_plot_type=clustering_plot_type, n_dim=3, annotation=annotation)
#         umap_plots.append(umap_plot)
    
#     return umap_plots
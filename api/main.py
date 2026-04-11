import time
import uvicorn as uvicorn
from fastapi import FastAPI, WebSocket, Request, Query, HTTPException, WebSocketException, WebSocketDisconnect
from celery.result import AsyncResult
from celery.app.control import Control
import asyncio
from fastapi.responses import HTMLResponse
from fastapi.responses import FileResponse

from config.celery_utils import create_celery, get_task_info
from routers import tools, benchmarks, workflows, pypi, web
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.wsgi import WSGIMiddleware
# from dash_app.dashboard import app as dashboard
from utils.redislogger import *
# from utils.mongodb import get_pp_results
# from tools.formating.formating import df_to_dict
# from tools.visualization.plot import plot_UMAP_obs, plot_violin, plot_scatter, plot_highest_expr_genes
# from schemas.schemas import ProcessResultsRequest
# from dash_app.dashboard import is_valid_query_param, get_dash_layout
from fastapi.concurrency import run_in_threadpool
import logging

def create_app() -> FastAPI:
    current_app = FastAPI(title="Asynchronous tasks processing with Celery and RabbitMQ",
                          description="AI-Ready for Single-Cell Data Analyses Event driven architecture"
                                      "FastAPI Application with Celery and RabbitMQ",
                          version="1.0.0", )

    current_app.celery_app = create_celery()
    current_app.include_router(tools.router)
    current_app.include_router(benchmarks.router)
    current_app.include_router(workflows.router)
    current_app.include_router(pypi.router)
    current_app.include_router(web.router)

    return current_app


app = create_app()

# Mount the Dash app as a sub-application in the FastAPI server
# app.mount("/dashboard", WSGIMiddleware(dashboard.server))

celery = app.celery_app

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

celery_control = Control(app=celery)

# Use a dictionary to store the last_read_index for each job_id
last_read_indices = {}


@app.middleware("http")
async def add_process_time_header(request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(f'{process_time:0.4f} sec')
    return response


@app.websocket("/wsapi/{request_type}/{job_id}")
async def websocket_endpoint(websocket: WebSocket, request_type: str, job_id: str):
    await websocket.accept()
    
    # Early exit for unsupported request types
    if request_type not in ['taskCurrentStatus', 'log']:
        await websocket.send_json({"error": f"Unsupported request_type: {request_type}"})
        await websocket.close(code=1003) # 1003: Unsupported Data
        return

    try:
        while True:
            if request_type == 'taskCurrentStatus':
                # Run the synchronous DB/Celery calls in a threadpool so it doesn't block FastAPI
                result = await run_in_threadpool(get_task_info, job_id)
                await websocket.send_json(result)
                
                # Optional: break the loop if the task is finished to save resources
                if result.get("task_status") in ['SUCCESS', 'FAILURE', 'REVOKED']:
                    break

            elif request_type == 'log':
                last_read_index = last_read_indices.get(job_id, 0)
                logs, last_read_index = await log_reader(job_id, last_read_index)
                
                last_read_indices[job_id] = last_read_index
                if logs: # Only send if there are actually new logs to reduce network spam
                    await websocket.send_text(logs)
            
            await asyncio.sleep(3)

    except WebSocketDisconnect:
        # This is the expected exception when a client closes the browser/connection
        logging.info(f"Client disconnected from {request_type} stream for job {job_id}.")
    except Exception as e:
        # Catch and log real errors (DB crashes, missing files, etc.)
        logging.error(f"Unexpected error in websocket for job {job_id}: {str(e)}")
    finally: 
        # Clean up memory
        if request_type == 'log' and job_id in last_read_indices:
            del last_read_indices[job_id]

        
# @app.websocket("/{request_type}/{job_idsCommaSeparated}")
# async def websocket_endpoint(websocket: WebSocket, request_type:str, job_idsCommaSeparated: str):
#     await websocket.accept()
    
#     try:
#         while True:
#             if request_type == 'taskStatus':
#                 job_ids = job_idsCommaSeparated.split(',')
#                 results = {}
#                 for job_id in job_ids:
#                     result = AsyncResult(job_id)
#                     if result.ready():
#                         if result.successful():
#                             results[job_id] = 'Success'
#                         else:
#                             results[job_id] = 'Failed'
#                     else:
#                         results[job_id] = 'Processing'
#                 await websocket.send_json(results)

#             elif request_type == 'log':
#                 logs = await log_reader(job_idsCommaSeparated, 0, 30)
#                 await websocket.send_text(logs)
#             await asyncio.sleep(3)
#     except Exception as e:
#         print(e)
#     finally:
#         await websocket.close()


@app.get("/status")
def get_status():
    return {"status": "ok"}


@app.get("/api/task/{job_id}")
async def get_task_status(job_id: str) -> dict:
    """
    Return the status of the submitted Task
    """
    return get_task_info(job_id)


@app.get("/api/job/downloadDataset/{job_id}")
async def get_cli_task_status(job_id: str) -> dict:
    """
    Return the status of the submitted Task
    """
    task_info = get_task_info(job_id)
    task_status = task_info.get("task_status")
    task_result = task_info.get("task_result")

    if task_status == "SUCCESS":
        # Task completed successfully

        if task_result:
            adata_path = task_result.get("adata_path")

            if adata_path:
                # Return the file as a response
                return FileResponse(
                    adata_path,
                    media_type="application/octet-stream",
                    filename=os.path.basename(adata_path),
                )
            else:
                # Task completed but no file found
                return {"status": "Task result does not contain a file path", "job_status": task_status}
        
        else:
            return {"status": "Invalid Response for the Task Submitted", "job_status": task_status}
    elif task_status == "FAILURE":
        # Task failed, return error details
        return {
            "status": "Task failed",
            "job_status": task_status,
            "error_message": str(task_result),
        }

    # Task is still processing
    return {"job_id": job_id, "job_status": task_status}




@app.post("/api/job/revoke/{job_id}")
async def revoke_task(job_id: str) -> dict:
    """
    Revoke a submitted Task
    """
    celery_control.revoke(job_id, terminate=True)

    result = {
        "job_id": job_id,
        "task_status": "Revoked",
        "task_result": f"Task {job_id} is revoked."
    }
    
    return result


# @app.post("/api/getPreProcessResults/")
# async def getPreProcessResults(req: ProcessResultsRequest) -> list:
#     """
#     Get details of pp_results
#     """
#     req_dict = req.model_dump() 
#     process_ids = req_dict['process_ids']
#     record_type = req_dict['record_type']
#     if len(process_ids) == 0:
#         raise HTTPException(status_code=400, detail="No process ID is provided.")

#     pp_results = get_pp_results(process_ids, record_type=record_type)
#     results = []

#     if len(pp_results) == 0:
#         raise HTTPException(status_code=404, detail="No pp_result is found.")
    
#     for pp_result in pp_results:
#         obs = pp_result['cell_metadata']
#         pp_result['cell_metadata'] = df_to_dict(obs)
#         # pp_result['obs'] = pp_result['obs']
        
#         if 'atac_cell_metadata' in pp_result.keys():
#             atac_obs = pp_result['atac_cell_metadata']
#             pp_result['atac_cell_metadata'] = df_to_dict(atac_obs)
#             # pp_result['atac_obs'] = pp_result['atac_obs']

#         if record_type == None:
#             pp_result['cell_metadata_head'] = obs.dropna().head().to_dict() # Replace NA
#             if 'umap' in pp_result.keys():
#                 pp_result['umap_plot'] = plot_UMAP_obs(obs, pp_result['umap'], layer=pp_result['layer'])
#                 pp_result['umap'] = pp_result['umap'].tolist()

#             if 'umap_3d' in pp_result.keys():
#                 pp_result['umap_plot_3d'] = plot_UMAP_obs(obs, pp_result['umap_3d'], layer=pp_result['layer'], n_dim=3)
#                 pp_result['umap_3d'] = pp_result['umap_3d'].tolist()

#             if 'tsne' in pp_result.keys():
#                 pp_result['tsne_plot'] = plot_UMAP_obs(obs, pp_result['tsne'], layer=pp_result['layer'], plot_name='t-SNE')
#                 pp_result['tsne'] = pp_result['tsne'].tolist()

#             if 'tsne_3d' in pp_result.keys():
#                 pp_result['tsne_plot_3d'] = plot_UMAP_obs(obs, pp_result['tsne_3d'], layer=pp_result['layer'], n_dim=3, plot_name='t-SNE')
#                 pp_result['tsne_3d'] = pp_result['tsne_3d'].tolist()

#             if 'atac_umap' in pp_result.keys():
#                 pp_result['atac_umap_plot'] = plot_UMAP_obs(atac_obs, pp_result['atac_umap'], layer=pp_result['layer'])
#                 pp_result['atac_umap'] = pp_result['atac_umap'].tolist()

#             if 'atac_umap_3d' in pp_result.keys():
#                 pp_result['atac_umap_plot_3d'] = plot_UMAP_obs(atac_obs, pp_result['atac_umap_3d'], layer=pp_result['layer'], n_dim=3)
#                 pp_result['atac_umap_3d'] = pp_result['atac_umap_3d'].tolist()

#             if pp_result['process'] == 'QC':
#                 pp_result['violin_plot'] = plot_violin(obs)
#                 pp_result['scatter_plot'] = plot_scatter(obs)
#                 if 'highest_expr_genes' in pp_result.keys():
#                     pp_result['highest_expr_genes_plot'] = plot_highest_expr_genes(pp_result['highest_expr_genes']['counts_top_genes'], pp_result['highest_expr_genes']['columns'])
#                     pp_result.pop('highest_expr_genes')

#         results.append(pp_result)

#     return results


# @app.post("/api/plotumap/")
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

if __name__ == "__main__":
    uvicorn.run("main:app", host='0.0.0.0', port=5005, reload=True)

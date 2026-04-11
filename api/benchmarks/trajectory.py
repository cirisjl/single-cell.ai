from tools.formating.formating import load_anndata, get_md5, clean_anndata
from tools.visualization.plot import plot_bar, plot_line
from benchmarks.trajectory_methods.scanpy import scanpy_trajectory
from utils.mongodb import generate_process_id, create_bm_results, benchmark_result_exists
from utils.redislogger import *
from datetime import datetime
from exceptions.custom_exceptions import CeleryTaskException
import os


def trajectory_task(adata_path, label, origin_group, benchmarksId, datasetId, job_id, task_type='Trajectory', bm_traj='benchmark_traj'):
    redislogger.info(job_id, "Start running benchmarks for Trajectory task.")
    trajectory_results = []
    y_values = {}
    y_values_ur = {}
    x_timepoints = []
    md5 = get_md5(adata_path)
    # Load AnnData
    adata = load_anndata(adata_path)
    adata = clean_anndata(adata) # Remove outliers
    adata = adata[~adata.obs[label].isna()] # Remove NaN in cell type label
    current_date_and_time = datetime.now()
    sys_info = None

    #static array to define the metrics evaluated for the Trajectory methods
    metrics = ["Graph Edit Distance", "Graph Kernel Score", "Jaccard Similarity Coefficient", "Tree Edit Distance", "Mean"]
    
    # scanpy
    try:
        redislogger.info(job_id, "Running Scanpy for Trajectory task.")
        process_id = generate_process_id(md5, task_type, 'Scanpy', label)
        scanpy_results = benchmark_result_exists(process_id)

        if scanpy_results is not None:
            redislogger.info(job_id, "Found existing Scanpy Benchmarks results in database, skip scanpy.")
        else:
            # Call scanpy method
            scanpy_results = scanpy_trajectory(adata, job_id, label, origin_group, benchmarksId, datasetId, task_type=task_type, bm_traj=bm_traj)
            create_bm_results(process_id, scanpy_results)
            trajectory_results.append({'Scanpy': scanpy_results})
            redislogger.info(job_id, "Scanpy Trajectory is done.")
        if len(scanpy_results) > 0:
            for key, result in scanpy_results.items():
                sys_info = result['sys_info']
                y_values[key] = [result['Graph Edit Distance'], result['Graph Kernel Score'], result['Jaccard Similarity Coefficient'], result['Tree Edit Distance'], result['Mean']]
                y_values_ur['scanpy_CPU'] = result['cpu_usage']
                y_values_ur['scanpy_Memory'] = result['mem_usage']
                y_values_ur['scanpy_GPU'] = result['gpu_usage']
                y_values_ur['scanpy_GPU_Memory'] = result['gpu_mem_usage']
                x_timepoints = result['time_points']
                redislogger.info(job_id, f"{key}: Graph Edit Distance: {result['Graph Edit Distance']}, Graph Kernel Score: {result['Graph Kernel Score']}, Jaccard Similarity Coefficient: {result['Jaccard Similarity Coefficient']}, Tree Edit Distance: {result['Tree Edit Distance']}, Mean: {result['Mean']}")

    except Exception as e:
        # Handle exceptions as needed
        redislogger.error(job_id, f"Scanpy Trajectory is failed: {e}")
        raise CeleryTaskException(f"Scanpy Trajectory is failed: {e}")

    
    redislogger.info(job_id, "Creating bar plot for evaluation.")
    # Call the plot_bar function
    benchmarks_plot = plot_bar(x=metrics, y=y_values, title='Benchmarks: Trajectory')

    redislogger.info(job_id, "Creating line plot for computing resourses utilization rate.")
    # Call the plot_line function with an empty array for x
    utilization_plot = plot_line(x=x_timepoints, y=y_values_ur, sysinfo=sys_info)

    adata = None # Release memory
    
    results = {
        # "adata_path": adata_path,
        "benchmarksId": benchmarksId,
        "datasetId": datasetId,
        "task_type": task_type,
        "label": label,
        "origin_group": origin_group,
        "bm_traj": bm_traj,
        "metrics": metrics,
        "methods": trajectory_results,
        # "sys_info": sys_info,
        "benchmarks_plot": benchmarks_plot,
        "utilization_plot": utilization_plot
    }

    return results
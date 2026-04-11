import sys
sys.path.append('..')
# from tools.formating.formating import *
from tools.trajectory.scanpy import run_scanpy_trajectory
from tools.evaluation.monitor import *
from tools.evaluation.trajectory import trajectory_metrics
from datetime import datetime


def scanpy_trajectory(adata, job_id, cell_type_label, origin_group, benchmarksId, datasetId, task_type='Trajectory', bm_traj='benchmark_traj'):
    # Start monitoring
    monitor = Monitor(1)
    sys_info = monitor.get_sys_info()
    results = {}
    adata = run_scanpy_trajectory(adata, job_id, cell_type_label=cell_type_label, origin_group=adata.uns[origin_group])
    
    # Stop monitoring
    time_points, cpu_usage, mem_usage, gpu_usage, gpu_mem_usage = monitor.stop()

    current_date_and_time = datetime.now()

    ged_score, gks_score, jsc_score, ted_score, mean = trajectory_metrics(adata.uns['trajectory'], adata.uns[bm_traj], adata.uns[origin_group])

    results["Scanpy"] = {
                "sys_info": sys_info,
                "benchmarksId": benchmarksId,
                "datasetId": datasetId,
                "task_type": task_type,
                "tool": "Scanpy",
                "Graph Edit Distance": ged_score,
                "Graph Kernel Score": gks_score,
                "Jaccard Similarity Coefficient": jsc_score,
                "Tree Edit Distance": ted_score,
                "Mean": mean,
                "time_points": time_points,
                "cpu_usage": cpu_usage,
                "mem_usage": mem_usage,
                "gpu_usage": gpu_usage,
                "gpu_mem_usage": gpu_mem_usage,
                "created_on": current_date_and_time
            }

    adata = None

    return results
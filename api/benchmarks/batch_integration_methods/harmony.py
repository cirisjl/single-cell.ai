import sys
sys.path.append('..')
# from tools.formating.formating import *
import scanpy as sc
import scanpy.external as sce
from tools.evaluation.monitor import *
from tools.evaluation.integration import integration_metrics
from datetime import datetime


def harmony_integration(adata, label, batch_key, benchmarksId, datasetId, task_type, species="mouse"):
    # Start monitoring
    monitor = Monitor(1)
    sys_info = monitor.get_sys_info()
    results = {}
    adata_int = adata.copy()

    sc.pp.normalize_total(adata_int)
    sc.pp.log1p(adata_int)
    sc.pp.highly_variable_genes(adata_int, batch_key=batch_key, subset=False)
    sc.pp.scale(adata_int)
    sc.pp.pca(adata_int, use_highly_variable=True) #True since we didnt subset
    sce.pp.harmony_integrate(adata_int, key = batch_key)
    
    # Stop monitoring
    time_points, cpu_usage, mem_usage, gpu_usage, gpu_mem_usage = monitor.stop()

    current_date_and_time = datetime.now()

    metrics_dict = integration_metrics(adata, adata_int, batch_key=batch_key, label_key=label, species=species)

    sys_usage = {
            "sys_info": sys_info,
            "benchmarksId": benchmarksId,
            "datasetId": datasetId,
            "task_type": task_type,
            "tool": "Harmony",
            "time_points": time_points,
            "cpu_usage": cpu_usage,
            "mem_usage": mem_usage,
            "gpu_usage": gpu_usage,
            "gpu_mem_usage": gpu_mem_usage,
            "created_on": current_date_and_time
            }

    results = {**sys_usage, **metrics_dict}
    adata_int = None

    return results
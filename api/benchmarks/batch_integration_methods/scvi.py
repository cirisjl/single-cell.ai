import sys
sys.path.append('..')
# from tools.formating.formating import *
from tools.integration.scvi import scvi_integrate
from tools.evaluation.monitor import *
from tools.evaluation.integration import integration_metrics
from tools.formating.formating import get_scvi_path
from datetime import datetime


def scvi_integration(adata, adata_path, label, batch_key, benchmarksId, datasetId, task_type, species="mouse"):
    # Start monitoring
    monitor = Monitor(1)
    sys_info = monitor.get_sys_info()
    results = {}
    scvi_path = get_scvi_path(adata_path, "batch_integration")

    adata_int = scvi_integrate(adata, batch_key=batch_key, model_path=scvi_path)
    
    # Stop monitoring
    time_points, cpu_usage, mem_usage, gpu_usage, gpu_mem_usage = monitor.stop()

    current_date_and_time = datetime.now()

    metrics_dict = integration_metrics(adata, adata_int, batch_key=batch_key, label_key=label, species=species)

    sys_usage = {
            "sys_info": sys_info,
            "benchmarksId": benchmarksId,
            "datasetId": datasetId,
            "task_type": task_type,
            "tool": "scVI",
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
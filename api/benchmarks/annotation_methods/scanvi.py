import sys
sys.path.append('..')
# from tools.formating.formating import *
from tools.annotation.scanvi import scanvi_transfer
from tools.evaluation.monitor import *
from tools.evaluation.annotation import annotation_metrics
from datetime import datetime


def scanvi_annotation(adata, label, benchmarksId, datasetId, task_type, ref=None, species="mouse"):
    # Start monitoring
    monitor = Monitor(1)
    sys_info = monitor.get_sys_info()
    results = {}

    adata = scanvi_transfer(adata, ref_adata=ref, labels=label)
    
    # Stop monitoring
    time_points, cpu_usage, mem_usage, gpu_usage, gpu_mem_usage = monitor.stop()

    current_date_and_time = datetime.now()

    # Model
    if "scANVI_predicted" in adata.obs.keys():
        accuracy, f1_macro, f1_micro, f1_weighted = annotation_metrics(adata.obs[label], adata.obs['scANVI_predicted'])
        results = {
                "sys_info": sys_info,
                "benchmarksId": benchmarksId,
                "datasetId": datasetId,
                "task_type": task_type,
                "results": [
                    {
                        "tool": "scANVI",
                        "Accuracy": accuracy,
                        "F1_macro": f1_macro,
                        "F1_micro": f1_micro,
                        "F1_weighted": f1_weighted,
                    }
                ],
                "time_points": time_points,
                "cpu_usage": cpu_usage,
                "mem_usage": mem_usage,
                "gpu_usage": gpu_usage,
                "gpu_mem_usage": gpu_mem_usage,
                "created_on": current_date_and_time
            }

    return results
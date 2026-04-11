import sys
sys.path.append('..')
# from tools.formating.formating import *
from tools.annotation.celltypist import run_celltypist
from tools.evaluation.monitor import *
from tools.evaluation.annotation import annotation_metrics
from datetime import datetime


def celltypist_annotation(adata, label, benchmarksId, datasetId, task_type, celltypist_model=None, ref=None, species="mouse"):
    # Start monitoring
    monitor = Monitor(1)
    sys_info = monitor.get_sys_info()
    results = {}

    adata = run_celltypist(adata, model_name=celltypist_model, ref_adata=ref, labels=label, species=species)
    
    # Stop monitoring
    time_points, cpu_usage, mem_usage, gpu_usage, gpu_mem_usage = monitor.stop()

    current_date_and_time = datetime.now()

    results = {
                "sys_info": sys_info,
                "benchmarksId": benchmarksId,
                "datasetId": datasetId,
                "task_type": task_type,
                "time_points": time_points,
                "cpu_usage": cpu_usage,
                "mem_usage": mem_usage,
                "gpu_usage": gpu_usage,
                "gpu_mem_usage": gpu_mem_usage,
                "created_on": current_date_and_time,
                "results": []
            }

    # Model
    if "celltypist_label" in adata.obs.keys():
        accuracy, f1_macro, f1_micro, f1_weighted = annotation_metrics(adata.obs[label], adata.obs['celltypist_label'])
        results["results"].append({ 
                "tool": f"CellTypist: {celltypist_model}",
                "Accuracy": accuracy,
                "F1_macro": f1_macro,
                "F1_micro": f1_micro,
                "F1_weighted": f1_weighted,
            })

    # Train data
    if "celltypist_ref_label" in adata.obs.keys():
        accuracy, f1_macro, f1_micro, f1_weighted = annotation_metrics(adata.obs[label], adata.obs['celltypist_ref_label'])
        results["results"].append({ 
                "tool": f"CellTypist",
                "Accuracy": accuracy,
                "F1_macro": f1_macro,
                "F1_micro": f1_micro,
                "F1_weighted": f1_weighted,
            })

    return results
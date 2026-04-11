import sys
sys.path.append('..')
# from tools.formating.formating import *
import mudata as md
from muon import MuData
import muon as mu
import scanpy as sc
from tools.evaluation.monitor import *
from tools.evaluation.multimodal import multimodal_metrics
from tools.formating.formating import *
from utils.redislogger import *
from datetime import datetime


def wnn_multimodal(mdata, mod1, mod2, batch_key, label, benchmarksId, datasetId, task_type):
    # Start monitoring
    monitor = Monitor(1)
    sys_info = monitor.get_sys_info()
    # Since subsetting was performed after calculating nearest neighbours,
    # we have to calculate them again for each modality.
    sc.pp.neighbors(mdata[mod1])
    sc.pp.neighbors(mdata[mod2])

    # Calculate weighted nearest neighbors
    mu.pp.neighbors(mdata, key_added='wnn')
    mu.tl.umap(mdata, neighbors_key='wnn', random_state=10)
    mdata.obsm["X_wnn_umap"] = mdata.obsm["X_umap"]
    
    # Stop monitoring
    time_points, cpu_usage, mem_usage, gpu_usage, gpu_mem_usage = monitor.stop()

    current_date_and_time = datetime.now()

    metrics_dict = multimodal_metrics(mdata, embed='X_wnn_umap', mod1=mod1, batch=batch_key, label_key=label)

    sys_usage = {
            "sys_info": sys_info,
            "benchmarksId": benchmarksId,
            "datasetId": datasetId,
            "task_type": task_type,
            "tool": "WNN",
            "time_points": time_points,
            "cpu_usage": cpu_usage,
            "mem_usage": mem_usage,
            "gpu_usage": gpu_usage,
            "gpu_mem_usage": gpu_mem_usage,
            "created_on": current_date_and_time
            }

    results = {**sys_usage, **metrics_dict}
    mdata = None

    return results
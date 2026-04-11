import sys
sys.path.append('..')
# from tools.formating.formating import *
from tools.multimodal.MultiVI import run_multivi
from tools.evaluation.monitor import *
from tools.evaluation.multimodal import multimodal_metrics
from tools.formating.formating import *
from utils.redislogger import *
from datetime import datetime


def multivi_multimodal(mdata_path, mdata, mod1, mod2, batch_key, label, benchmarksId, datasetId, task_type):
    # Start monitoring
    monitor = Monitor(1)
    sys_info = monitor.get_sys_info()
    mdata = run_multivi(mdata_path, mdata=mdata, rna_subset=mod1, atac_subset=mod2)
    
    # Stop monitoring
    time_points, cpu_usage, mem_usage, gpu_usage, gpu_mem_usage = monitor.stop()

    current_date_and_time = datetime.now()

    metrics_dict = multimodal_metrics(mdata, embed='X_multivi', mod1=mod1, batch=batch_key, label_key=label)

    sys_usage = {
            "sys_info": sys_info,
            "benchmarksId": benchmarksId,
            "datasetId": datasetId,
            "task_type": task_type,
            "tool": "MultiVI",
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
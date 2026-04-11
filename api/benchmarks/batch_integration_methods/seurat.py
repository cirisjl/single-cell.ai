
import os
import subprocess
import sys
import scanpy as sc
sys.path.append('..')
from tools.formating.formating import *
from tools.evaluation.monitor import *
from tools.evaluation.integration import integration_metrics
from datetime import datetime


def seurat_integration(adata, input, label, batch_key, datasets, benchmarksId, datasetId, task_type, species="mouse"):
    adata_int = None
    # Start monitoring
    monitor = Monitor(1)
    sys_info = monitor.get_sys_info()
    results = {}
    current_file = os.path.abspath(__file__)
    # Construct the relative path to the desired file
    relative_path = os.path.join(os.path.dirname(current_file), 'integration.Rmd')
    # Get the absolute path of the desired file
    rmd_path = os.path.abspath(relative_path)
    # output = os.path.join(os.path.dirname(input[0]), 'Seurat_integration')
    output = os.path.dirname(input[0])
    adata_path = input[0].replace(".h5ad", 'Seurat_integration.h5ad')
    report_path = os.path.join(output, 'Seurat_integration_report.html')
    input = list_to_string_default(input)
    s = subprocess.call([f"R -e \"rmarkdown::render('{rmd_path}', params=list(unique_id='{benchmarksId}', datasets='{datasets}', batch_key='{batch_key}', inputs='{input}', output_folder='{output}', adata_path='{adata_path}', methods='SEURAT'), output_file='{report_path}')\""], shell = True)
    
    # Stop monitoring
    time_points, cpu_usage, mem_usage, gpu_usage, gpu_mem_usage = monitor.stop()

    current_date_and_time = datetime.now()

    if os.path.exists(adata_path):
        adata_int = load_anndata(adata_path)
        adata_original = sc.AnnData(X=adata_int.layers['counts'], obs=adata_int.obs, var=adata_int.var).copy()
        metrics_dict = integration_metrics(adata_original, adata_int, batch_key=batch_key, label_key=label, species=species)

        sys_usage = {
                "sys_info": sys_info,
                "benchmarksId": benchmarksId,
                "datasetId": datasetId,
                "task_type": task_type,
                "tool": "Seurat",
                "time_points": time_points,
                "cpu_usage": cpu_usage,
                "mem_usage": mem_usage,
                "gpu_usage": gpu_usage,
                "gpu_mem_usage": gpu_mem_usage,
                "created_on": current_date_and_time
                }

        results = {**sys_usage, **metrics_dict}
        adata_int = None
    else:
        detail=f"Seurat integration failed: output file {adata_path} not found."
        raise Exception(detail)


    return results
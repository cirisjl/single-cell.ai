import sys
sys.path.append('..')
from tools.formating.formating import *
from tools.evaluation.monitor import *
from tools.evaluation.imputation import imputation_metrics
from datetime import datetime


def saver_imputation(adata, csv_path, benchmarksId, datasetId, task_type, species="mouse"):
    # Start monitoring
    monitor = Monitor(1)
    sys_info = monitor.get_sys_info()
    results = {}
    # output = os.path.join(os.path.dirname(adata_path), 'Saver_imputation')
    
    output = csv_path.replace(".csv", "_Saver_imputation.h5ad")
    report_path = csv_path.replace(".csv", '_Saver_imputation_report.html')
    # Get the absolute path of the current file
    current_file = os.path.abspath(__file__)

    # Construct the relative path to the desired file
    relative_path = os.path.join(os.path.dirname(current_file), 'SAVER.Rmd')

    # Get the absolute path of the desired file
    saver_path = os.path.abspath(relative_path)
    s = subprocess.call([f"R -e \"rmarkdown::render('{saver_path}', params=list(dataset='{datasetId}', input='{csv_path}', output='{output}', output_format='AnnData'), output_file='{report_path}')\""], shell = True)
    
    # Stop monitoring
    time_points, cpu_usage, mem_usage, gpu_usage, gpu_mem_usage = monitor.stop()

    current_date_and_time = datetime.now()

    if os.path.exists(output):
        adata_saver = load_anndata(output)
        adata.layers["SAVER"] = adata_saver.layers["SAVER"] 

    mse, possion = imputation_metrics(adata, denoised_layer="SAVER")

    results = {
                "sys_info": sys_info,
                "benchmarksId": benchmarksId,
                "datasetId": datasetId,
                "task_type": task_type,
                "tool": "SAVER",
                "MSE": mse,
                "Possion": possion,
                "time_points": time_points,
                "cpu_usage": cpu_usage,
                "mem_usage": mem_usage,
                "gpu_usage": gpu_usage,
                "gpu_mem_usage": gpu_mem_usage,
                "created_on": current_date_and_time
            }

    adata_saver = None
    adata = None

    return results
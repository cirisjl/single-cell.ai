from tools.formating.formating import load_anndata, get_md5, clean_anndata
from tools.visualization.plot import plot_bar, plot_line
from benchmarks.ccc_methods.liana import liana_ccc
from utils.mongodb import generate_process_id, create_bm_results, benchmark_result_exists
from utils.redislogger import *
from datetime import datetime
import os


def ccc_task(adata_path, label, ccc_target, benchmarksId, datasetId, job_id, species, task_type='Cell-cell communication'):
    redislogger.info(job_id, "Start running benchmarks for Cell-cell communication task.")
    ccc_results = []
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

    #static array to define the metrics evaluated for the Cell-cell communication methods
    metrics = ['Precision-recall AUC', 'Odds Ratio']
    
    # LIANA
    try:
        redislogger.info(job_id, "Running LIANA for Cell-cell communication task.")
        process_id = generate_process_id(md5, task_type, 'LIANA', label)
        LIANA_results = benchmark_result_exists(process_id)

        if LIANA_results is not None:
            redislogger.info(job_id, "Found existing LIANA Benchmarks results in database, skip LIANA.")
        else:
            # Call LIANA method
            LIANA_results = liana_ccc(adata, label, benchmarksId, datasetId, task_type, species=species, ccc_target=ccc_target)
            create_bm_results(process_id, LIANA_results)
            ccc_results.append({'LIANA': LIANA_results})
            redislogger.info(job_id, "LIANA Cell-cell communication is done.")
        sys_info = LIANA_results['sys_info']
        y_values_ur['LIANA_CPU'] = LIANA_results['cpu_usage']
        y_values_ur['LIANA_Memory'] = LIANA_results['mem_usage']
        y_values_ur['LIANA_GPU'] = LIANA_results['gpu_usage']
        y_values_ur['LIANA_GPU_Memory'] = LIANA_results['gpu_mem_usage']
        x_timepoints = LIANA_results['time_points']

        if len(LIANA_results['results']) > 0:
            for result in LIANA_results['results']:
                key = result['tool']
                y_values[key] = [result['Precision-recall AUC'], result['Odds Ratio']]
                redislogger.info(job_id, f"{key}: Precision-recall AUC: {result['Precision-recall AUC']}, Odds Ratio: {result['Odds Ratio']}")

    except Exception as e:
        # Handle exceptions as needed
        redislogger.error(job_id, f"LIANA Cell-cell communication is failed: {e}")

    
    redislogger.info(job_id, "Creating bar plot for evaluation.")
    # Call the plot_bar function
    benchmarks_plot = plot_bar(x=metrics, y=y_values, title='Benchmarks: Cell-cell communication')

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
        "ccc_target": ccc_target,
        "species": species,
        "metrics": metrics,
        "methods": ccc_results,
        # "sys_info": sys_info,
        "benchmarks_plot": benchmarks_plot,
        "utilization_plot": utilization_plot
    }

    return results
from tools.formating.formating import load_anndata, load_anndata_to_csv, get_md5, clean_anndata
from tools.visualization.plot import plot_bar, plot_line
from benchmarks.imputation_methods.magic import magic_imputation
from benchmarks.imputation_methods.saver import saver_imputation
from utils.mongodb import generate_process_id, create_bm_results, benchmark_result_exists
from utils.redislogger import *
from datetime import datetime
import os
import numpy as np


def imputation_task(adata_path, species, benchmarksId, datasetId, job_id, task_type='Imputation'):
    redislogger.info(job_id, "Start running benchmarks for Imputation task.")
    imputation_results = []
    y_values = {}
    y_values_ur = {}
    x_timepoints = []
    md5 = get_md5(adata_path)
    # Load AnnData
    csv_path = adata_path.replace(".h5ad", ".csv")
    adata = load_anndata(adata_path)
    adata = clean_anndata(adata) # Remove outliers
    # Save the dense array to a CSV file
    np.savetxt(csv_path, adata.obsm['train'].toarray(), delimiter=",")

    current_date_and_time = datetime.now()
    sys_info = None

    #static array to define the metrics evaluated for the imputation methods
    metrics = ['MSE', 'Possion']
    
    # Magic
    try:
        redislogger.info(job_id, "Running Magic for Imputation task.")
        process_id = generate_process_id(md5, task_type, 'Magic', species)
        magic_results = benchmark_result_exists(process_id)

        if magic_results is not None:
            redislogger.info(job_id, "Found existing Magic Benchmarks results in database, skip Magic.")
        else:
            # Call Magic method
            magic_results = magic_imputation(adata, benchmarksId, datasetId, task_type, species=species)
            create_bm_results(process_id, magic_results)
            imputation_results.append({'Magic': magic_results})
            redislogger.info(job_id, "Magic imputation is done.")
        key = 'MAGIC'
        sys_info = magic_results['sys_info']
        y_values[key] = [magic_results['MSE'], magic_results['Possion']]
        y_values_ur['MAGIC_CPU'] = magic_results['cpu_usage']
        y_values_ur['MAGIC_Memory'] = magic_results['mem_usage']
        y_values_ur['MAGIC_GPU'] = magic_results['gpu_usage']
        y_values_ur['MAGIC_GPU_Memory'] = magic_results['gpu_mem_usage']
        x_timepoints = magic_results['time_points']
        redislogger.info(job_id, f"{key}: MSE: {magic_results['MSE']}, Possion: {magic_results['Possion']}")

    except Exception as e:
        # Handle exceptions as needed
        redislogger.error(job_id, f"Magic imputation is failed: {e}")

   # Saver
    try:
        redislogger.info(job_id, "Running Saver for Imputation task.")
        process_id = generate_process_id(md5, task_type, 'Saver', species)
        saver_results = benchmark_result_exists(process_id)

        if saver_results is not None:
            redislogger.info(job_id, "Found existing Saver Benchmarks results in database, skip Saver.")
        else:
            # Call Saver method
            saver_results = saver_imputation(adata, csv_path, benchmarksId, datasetId, task_type, species=species)
            create_bm_results(process_id, saver_results)
            imputation_results.append({'Saver': saver_results})
            redislogger.info(job_id, "Saver imputation is done.")
        key = 'SAVER'
        sys_info = saver_results['sys_info']
        y_values[key] = [saver_results['MSE'], saver_results['Possion']]
        y_values_ur['SAVER_CPU'] = saver_results['cpu_usage']
        y_values_ur['SAVER_Memory'] = saver_results['mem_usage']
        y_values_ur['SAVER_GPU'] = saver_results['gpu_usage']
        y_values_ur['SAVER_GPU_Memory'] = saver_results['gpu_mem_usage']
        x_timepoints = saver_results['time_points']
        redislogger.info(job_id, f"{key}: MSE: {saver_results['MSE']}, Possion: {saver_results['Possion']}")

    except Exception as e:
        if os.path.exists(csv_path):
            os.remove(csv_path)
        # Handle exceptions as needed
        redislogger.error(job_id, f"Saver imputation is failed: {e}")
    
    redislogger.info(job_id, "Creating bar plot for evaluation.")
    # Call the plot_bar function
    benchmarks_plot = plot_bar(x=metrics, y=y_values, title='Benchmarks: Imputation')

    redislogger.info(job_id, "Creating line plot for computing resourses utilization rate.")
    # Call the plot_line function with an empty array for x
    utilization_plot = plot_line(x=x_timepoints, y=y_values_ur, sysinfo=sys_info)

    adata = None # Release memory

    if os.path.exists(csv_path):
        os.remove(csv_path)
    
    results = {
        # "adata_path": adata_path,
        "benchmarksId": benchmarksId,
        "datasetId": datasetId,
        "task_type": task_type,
        "species": species,
        "metrics": metrics,
        "methods": imputation_results,
        # "sys_info": sys_info,
        "benchmarks_plot": benchmarks_plot,
        "utilization_plot": utilization_plot
    }

    return results
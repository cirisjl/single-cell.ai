from tools.formating.formating import load_anndata, get_md5, clean_anndata, get_scvi_path, save_anndata
from tools.visualization.plot import plot_bar, plot_line
from benchmarks.annotation_methods.celltypist import celltypist_annotation
from benchmarks.annotation_methods.scanvi import scanvi_annotation
from benchmarks.annotation_methods.singler import singler_annotation
from utils.mongodb import generate_process_id, create_bm_results, benchmark_result_exists
from utils.redislogger import *
from datetime import datetime
import os


def annotation_task(adata_path, label, benchmarksId, datasetId, job_id, celltypist_model=None, SingleR_ref=None, species="mouse", task_type='Cell Type Annotation'):
    redislogger.info(job_id, "Start running benchmarks for Cell Type Annotation task.")
    annotation_results = []
    y_values = {}
    y_values_ur = {}
    x_timepoints = []
    md5 = get_md5(adata_path)
    # Load AnnData
    adata = load_anndata(adata_path)
    scvi_path = get_scvi_path(adata_path)
    adata = clean_anndata(adata) # Remove outliers
    train_adata = adata[adata.obs.split_idx.str.contains('train'), :].copy()
    # ref_path = adata_path.replace(".h5ad", "_ref.h5ad")
    # train_adata.write_h5ad(ref_path, compression='gzip')
    # save_anndata(train_adata, ref_path)
    test_adata = adata[adata.obs.split_idx.str.contains('test'), :].copy()
    current_date_and_time = datetime.now()
    sys_info = None

    #static array to define the metrics evaluated for the annotation methods
    metrics = ['Accuracy', 'F1_macro', 'F1_micro', 'F1_weighted']
    
    # SingleR
    try:
        redislogger.info(job_id, "Running SingleR for Cell Type Annotation task.")
        process_id = generate_process_id(md5, task_type, 'SingleR', label)
        singler_results = benchmark_result_exists(process_id)

        if singler_results is not None:
            redislogger.info(job_id, "Found existing SingleR Benchmarks results in database, skip SingleR.")
        else:
            # Call SingleR method
            singler_results = singler_annotation(test_adata.copy(), label, benchmarksId, datasetId, task_type, SingleR_ref, user_refdata=[train_adata], species=species)
            create_bm_results(process_id, singler_results)
            annotation_results.append(singler_results)
            redislogger.info(job_id, "SingleR annotation is done.")

        sys_info = singler_results['sys_info']     
        y_values_ur['SingleR_CPU'] = singler_results['cpu_usage']
        y_values_ur['SingleR_Memory'] = singler_results['mem_usage']
        # y_values_ur['SingleR_GPU'] = result['gpu_mem_usage']
        x_timepoints = singler_results['time_points']
        if len(singler_results['results']) > 0:
            for result in singler_results['results']:
                key = result['tool']
                y_values[key] = [result['Accuracy'], result['F1_macro'], result['F1_micro'], result['F1_weighted']]
                redislogger.info(job_id, f"{key}: Accuracy: {result['Accuracy']}, F1_macro: {result['F1_macro']}, F1_micro: {result['F1_micro']}, F1_weighted: {result['F1_weighted']}")

    except Exception as e:
        # Handle exceptions as needed
        redislogger.error(job_id, f"SingleR annotation is failed: {e}")
    
    # CellTypist
    try:
        redislogger.info(job_id, "Running CellTypist for Cell Type Annotation task.")
        process_id = generate_process_id(md5, task_type, 'CellTypist', label)
        celltypist_results = benchmark_result_exists(process_id)

        if celltypist_results is not None:
            redislogger.info(job_id, "Found existing CellTypist Benchmarks results in database, skip CellTypist.")
        else:
            # Call CellTypist method
            celltypist_results = celltypist_annotation(test_adata.copy(), label, benchmarksId, datasetId, task_type, celltypist_model=celltypist_model, ref=train_adata, species=species)
            create_bm_results(process_id, celltypist_results)
            annotation_results.append(celltypist_results)
            redislogger.info(job_id, "CellTypist annotation is done.")

        sys_info = celltypist_results['sys_info']
        y_values_ur['CellTypist_CPU'] = celltypist_results['cpu_usage']
        y_values_ur['CellTypist_Memory'] = celltypist_results['mem_usage']
        y_values_ur['CellTypist_GPU'] = celltypist_results['gpu_usage']
        y_values_ur['CellTypist_GPU_Memory'] = celltypist_results['gpu_mem_usage']
        x_timepoints = celltypist_results['time_points']
        
        if len(celltypist_results['results']) > 0:
            for result in celltypist_results['results']:
                key = result['tool']
                y_values[key] = [result['Accuracy'], result['F1_macro'], result['F1_micro'], result['F1_weighted']]
                redislogger.info(job_id, f"{key}: Accuracy: {result['Accuracy']}, F1_macro: {result['F1_macro']}, F1_micro: {result['F1_micro']}, F1_weighted: {result['F1_weighted']}")

    except Exception as e:
        # Handle exceptions as needed
        redislogger.error(job_id, f"CellTypist annotation is failed: {e}")

    # scANVI
    try:
        redislogger.info(job_id, "Running scANVI for Cell Type Annotation task.")
        process_id = generate_process_id(md5, task_type, 'scANVI', label)
        scvi_results = benchmark_result_exists(process_id)

        if scvi_results is not None:
            redislogger.info(job_id, "Found existing scANVI Benchmarks results in database, skip scANVI.")
        else:
            # Call scANVI method
            scvi_results = scanvi_annotation(test_adata.copy(), label, benchmarksId, datasetId, task_type, ref=train_adata, species=species)
            create_bm_results(process_id, scvi_results)
            annotation_results.append(scvi_results)
            redislogger.info(job_id, "scANVI annotation is done.")
        
        sys_info = scvi_results['sys_info']
        y_values_ur['scANVI_CPU'] = scvi_results['cpu_usage']
        y_values_ur['scANVI_Memory'] = scvi_results['mem_usage']
        y_values_ur['scANVI_GPU'] = scvi_results['gpu_usage']
        y_values_ur['scANVI_GPU_Memory'] = scvi_results['gpu_mem_usage']
        x_timepoints = scvi_results['time_points']

        if len(scvi_results['results']) > 0:
            for result in scvi_results['results']:
                key = result['tool']
                y_values[key] = [result['Accuracy'], result['F1_macro'], result['F1_micro'], result['F1_weighted']]
                redislogger.info(job_id, f"{key}: Accuracy: {result['Accuracy']}, F1_macro: {result['F1_macro']}, F1_micro: {result['F1_micro']}, F1_weighted: {result['F1_weighted']}")

    except Exception as e:
        # Handle exceptions as needed
        redislogger.error(job_id, f"scANVI annotation is failed: {e}")
    
    redislogger.info(job_id, "Creating bar plot for evaluation.")
    # Call the plot_bar function
    benchmarks_plot = plot_bar(x=metrics, y=y_values, title='Benchmarks: Cell Type Annotation')

    redislogger.info(job_id, "Creating line plot for computing resourses utilization rate.")
    # Call the plot_line function with an empty array for x
    utilization_plot = plot_line(x=x_timepoints, y=y_values_ur, sysinfo=sys_info)

    adata = None # Release memory
    
    results = {
        # "adata_path": adata_path,
        "benchmarksId": benchmarksId,
        "datasetId": datasetId,
        "label": label,
        "species": species,
        "task_type": task_type,
        "metrics": metrics,
        "methods": annotation_results,
        # "sys_info": sys_info,
        "benchmarks_plot": benchmarks_plot,
        "utilization_plot": utilization_plot
    }

    return results
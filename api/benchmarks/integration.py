from tools.formating.formating import *
from tools.visualization.plot import plot_bar, plot_line
from benchmarks.batch_integration_methods.harmony import harmony_integration
from benchmarks.batch_integration_methods.scvi import scvi_integration
from benchmarks.batch_integration_methods.seurat import seurat_integration
from benchmarks.batch_integration_methods.liger import liger_integration
from utils.mongodb import generate_process_id, create_bm_results, benchmark_result_exists
from utils.redislogger import *
from datetime import datetime
import os


def integration_task(adata_path, label, batch_key, benchmarksId, datasetId, job_id, species="mouse", task_type='Batch Integration'):
    redislogger.info(job_id, "Start running benchmarks for Batch Integration task.")
    integration_results = []
    y_values = {}
    y_values_ur = {}
    x_timepoints = []
    md5 = get_md5(adata_path)
    # Load AnnData
    adata = load_anndata(adata_path)
    adata = adata[~adata.obs[label].isna()] # Remove NaN in cell type label
    scvi_path = get_scvi_path(adata_path)
    adata = clean_anndata(adata) # Remove outliers
    input_folder = os.path.dirname(adata_path)

    # Create input files for Seurat and Liger
    input = []
    datasets = []
    for sample in adata.obs[batch_key].unique():
        adata_sub = adata[adata.obs[batch_key]==sample, :]
        adata_sub_path = f"{input_folder}/{sample}.h5ad"
        # adata_sub.write_h5ad(adata_sub_path, compression='gzip')
        save_anndata(adata_sub, adata_sub_path)
        input.append(adata_sub_path)
        datasets.append(sample)
    datasets = list_to_string(datasets)
    current_date_and_time = datetime.now()
    sys_info = None

    #static array to define the metrics evaluated for the Integration methods
    metrics = ['graph_conn', 'kBET', 'PCR_batch', 'ASW_label/batch', 'Biological Conservation']
 
    # Liger
    try:
        redislogger.info(job_id, "Running Liger for Batch Integration task.")
        process_id = generate_process_id(md5, task_type, 'Liger', label)
        liger_results = benchmark_result_exists(process_id)

        if liger_results is not None:
            redislogger.info(job_id, "Found existing Liger Benchmarks results in database, skip Liger.")
        else:
            # Call Liger method
            liger_results = liger_integration(adata.copy(), input, label, batch_key, datasets, benchmarksId, datasetId, task_type, species=species)
            create_bm_results(process_id, liger_results)
            integration_results.append({'Liger': liger_results})
            redislogger.info(job_id, "Liger Integration is done.")

        sys_info = liger_results['sys_info']
        y_values['Liger'] = [liger_results['graph_conn'], liger_results['kBET'], liger_results['PCR_batch'], liger_results['ASW_label/batch'], liger_results['Biological Conservation']]
        y_values_ur['Liger_CPU'] = liger_results['cpu_usage']
        y_values_ur['Liger_Memory'] = liger_results['mem_usage']
        y_values_ur['Liger_GPU'] = liger_results['gpu_mem_usage']
        x_timepoints = liger_results['time_points']
        redislogger.info(job_id, f"Liger: Graph Connectivity: {liger_results['graph_conn']}, kBET: {liger_results['kBET']}, Principal component regression score: {liger_results['PCR_batch']}, Batch ASW: {liger_results['ASW_label/batch']}, Biological Conservation: {liger_results['Biological Conservation']}")

    except Exception as e:
        # Handle exceptions as needed
        redislogger.error(job_id, f"Liger Integration is failed: {e}")

    # Seurat
    try:
        redislogger.info(job_id, "Running Seurat for Batch Integration task.")
        process_id = generate_process_id(md5, task_type, 'Seurat', label)
        seurat_results = benchmark_result_exists(process_id)

        if seurat_results is not None:
            redislogger.info(job_id, "Found existing Seurat Benchmarks results in database, skip Seurat.")
        else:
            # Call Seurat method
            seurat_results = seurat_integration(adata.copy(), input, label, batch_key, datasets, benchmarksId, datasetId, task_type, species=species)
            create_bm_results(process_id, seurat_results)
            integration_results.append({'Seurat': seurat_results})
            redislogger.info(job_id, "Seurat Integration is done.")

        sys_info = seurat_results['sys_info']
        y_values['Seurat'] = [seurat_results['graph_conn'], seurat_results['kBET'], seurat_results['PCR_batch'], seurat_results['ASW_label/batch'], seurat_results['Biological Conservation']]
        y_values_ur['Seurat_CPU'] = seurat_results['cpu_usage']
        y_values_ur['Seurat_Memory'] = seurat_results['mem_usage']
        # y_values_ur['Seurat_GPU'] = seurat_results['gpu_mem_usage']
        x_timepoints = seurat_results['time_points']
        redislogger.info(job_id, f"Seurat: Graph Connectivity: {seurat_results['graph_conn']}, kBET: {seurat_results['kBET']}, Principal component regression score: {seurat_results['PCR_batch']}, Batch ASW: {seurat_results['ASW_label/batch']}, Biological Conservation: {seurat_results['Biological Conservation']}")

    except Exception as e:
        # Handle exceptions as needed
        redislogger.error(job_id, f"Seurat Integration is failed: {e}")

    # Harmony
    try:
        redislogger.info(job_id, "Running Harmony for Batch Integration task.")
        process_id = generate_process_id(md5, task_type, 'Harmony', label)
        harmony_results = benchmark_result_exists(process_id)

        if harmony_results is not None:
            redislogger.info(job_id, "Found existing Harmony Benchmarks results in database, skip Harmony.")
        else:
            # Call Harmony method
            harmony_results = harmony_integration(adata.copy(), label, batch_key, benchmarksId, datasetId, task_type, species=species)
            create_bm_results(process_id, harmony_results)
            integration_results.append({'Harmony': harmony_results})
            redislogger.info(job_id, "Harmony Integration is done.")

        sys_info = harmony_results['sys_info']
        y_values['Harmony'] = [harmony_results['graph_conn'], harmony_results['kBET'], harmony_results['PCR_batch'], harmony_results['ASW_label/batch'], harmony_results['Biological Conservation']]
        y_values_ur['Harmony_CPU'] = harmony_results['cpu_usage']
        y_values_ur['Harmony_Memory'] = harmony_results['mem_usage']
        y_values_ur['Harmony_GPU'] = harmony_results['gpu_usage']
        y_values_ur['Harmony_GPU_Memory'] = harmony_results['gpu_mem_usage']
        x_timepoints = harmony_results['time_points']
        redislogger.info(job_id, f"Harmony: Graph Connectivity: {harmony_results['graph_conn']}, kBET: {harmony_results['kBET']}, Principal component regression score: {harmony_results['PCR_batch']}, Batch ASW: {harmony_results['ASW_label/batch']}, Biological Conservation: {harmony_results['Biological Conservation']}")

    except Exception as e:
        # Handle exceptions as needed
        redislogger.error(job_id, f"Harmony Integration is failed: {e}")

    # scVI
    try:
        redislogger.info(job_id, "Running scVI for Batch Integration task.")
        process_id = generate_process_id(md5, task_type, 'scVI', label)
        scvi_results = benchmark_result_exists(process_id)

        if scvi_results is not None:
            redislogger.info(job_id, "Found existing scVI Benchmarks results in database, skip scVI.")
        else:
            # Call scVI method
            scvi_results = scvi_integration(adata.copy(), adata_path, label, batch_key, benchmarksId, datasetId, task_type, species=species)
            create_bm_results(process_id, scvi_results)
            integration_results.append({'scVI': scvi_results})
            redislogger.info(job_id, "scVI Integration is done.")

        sys_info = scvi_results['sys_info']
        y_values['scVI'] = [scvi_results['graph_conn'], scvi_results['kBET'], scvi_results['PCR_batch'], scvi_results['ASW_label/batch'], scvi_results['Biological Conservation']]
        y_values_ur['scVI_CPU'] = scvi_results['cpu_usage']
        y_values_ur['scVI_Memory'] = scvi_results['mem_usage']
        y_values_ur['scVI_GPU'] = scvi_results['gpu_usage']
        y_values_ur['scVI_GPU_Memory'] = scvi_results['gpu_mem_usage']
        x_timepoints = scvi_results['time_points']
        redislogger.info(job_id, f"scVI: Graph Connectivity: {scvi_results['graph_conn']}, kBET: {scvi_results['kBET']}, Principal component regression score: {scvi_results['PCR_batch']}, Batch ASW: {scvi_results['ASW_label/batch']}, Biological Conservation: {scvi_results['Biological Conservation']}")

    except Exception as e:
        # Handle exceptions as needed
        redislogger.error(job_id, f"scVI Integration is failed: {e}")
    
    redislogger.info(job_id, "Creating bar plot for evaluation.")
    # Call the plot_bar function
    benchmarks_plot = plot_bar(x=metrics, y=y_values, title='Benchmarks: Batch Integration')

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
        "batch_key": batch_key,
        "species": species,
        "metrics": metrics,
        "methods": integration_results,
        # "sys_info": sys_info,
        "benchmarks_plot": benchmarks_plot,
        "utilization_plot": utilization_plot
    }

    return results
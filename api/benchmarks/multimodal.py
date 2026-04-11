from tools.formating.formating import *
from tools.visualization.plot import plot_bar, plot_line
from benchmarks.multimodal_methods.multivi import multivi_multimodal
from benchmarks.multimodal_methods.mofa import mofa_multimodal
from benchmarks.multimodal_methods.wnn import wnn_multimodal
from utils.mongodb import generate_process_id, create_bm_results, benchmark_result_exists
from utils.redislogger import *
import muon
from datetime import datetime
import os


def multimodal_task(mdata_path, mod1, mod2, label, batch_key, benchmarksId, datasetId, job_id, task_type='Multimodal'):
    redislogger.info(job_id, "Start running benchmarks for Multimodal task.")
    multimodal_results = []
    y_values = {}
    y_values_ur = {}
    x_timepoints = []
    md5 = get_md5(mdata_path)
    current_date_and_time = datetime.now()
    sys_info = None

    #static array to define the metrics evaluated for the Multimodal methods
    metrics = ['graph_conn', 'kBET', 'PCR_batch', 'ASW_label/batch', 'Biological Conservation']
    mdata = muon.read_h5mu(mdata_path)
    
    # MultiVI
    try:
        redislogger.info(job_id, "Running MultiVI for Multimodal task.")
        process_id = generate_process_id(md5, task_type, 'MultiVI', label)
        multivi_results = benchmark_result_exists(process_id)

        if multivi_results is not None:
            redislogger.info(job_id, "Found existing MultiVI Benchmarks results in database, skip multivi.")
        else:
            # Call multivi method
            multivi_results = multivi_multimodal(mdata_path, mdata, mod1, mod2, batch_key, label, benchmarksId, datasetId, task_type)
            create_bm_results(process_id, multivi_results)
            multimodal_results.append({'MultiVI': multivi_results})
            redislogger.info(job_id, "MultiVI Multimodal is done.")

        sys_info = multivi_results['sys_info']
        y_values['MultiVI'] = [multivi_results['graph_conn'], multivi_results['kBET'], multivi_results['PCR_batch'], multivi_results['ASW_label/batch'], multivi_results['Biological Conservation']]
        y_values_ur['MultiVI_CPU'] = multivi_results['cpu_usage']
        y_values_ur['MultiVI_Memory'] = multivi_results['mem_usage']
        y_values_ur['MultiVI_GPU'] = multivi_results['gpu_usage']
        y_values_ur['MultiVI_GPU_Memory'] = multivi_results['gpu_mem_usage']
        x_timepoints = multivi_results['time_points']
        redislogger.info(job_id, f"MultiVI: Graph Connectivity: {multivi_results['graph_conn']}, kBET: {multivi_results['kBET']}, Principal component regression score: {multivi_results['PCR_batch']}, Batch ASW: {multivi_results['ASW_label/batch']}, Biological Conservation: {multivi_results['Biological Conservation']}")

    except Exception as e:
        # Handle exceptions as needed
        redislogger.error(job_id, f"MultiVI Multimodal is failed: {e}")

    # MOFA
    try:
        redislogger.info(job_id, "Running MOFA for Multimodal task.")
        process_id = generate_process_id(md5, task_type, 'MOFA', label)
        mofa_results = benchmark_result_exists(process_id)

        if mofa_results is not None:
            redislogger.info(job_id, "Found existing MOFA Benchmarks results in database, skip MOFA.")
        else:
            # Call MOFA method
            mofa_results = mofa_multimodal(mdata, mod1, mod2, batch_key, label, benchmarksId, datasetId, task_type)
            create_bm_results(process_id, mofa_results)
            multimodal_results.append({'MOFA': mofa_results})
            redislogger.info(job_id, "MOFA Multimodal is done.")

        sys_info = mofa_results['sys_info']
        y_values['MOFA'] = [mofa_results['graph_conn'], mofa_results['kBET'], mofa_results['PCR_batch'], mofa_results['ASW_label/batch'], mofa_results['Biological Conservation']]
        y_values_ur['MOFA_CPU'] = mofa_results['cpu_usage']
        y_values_ur['MOFA_Memory'] = mofa_results['mem_usage']
        y_values_ur['MOFA_GPU'] = mofa_results['gpu_usage']
        y_values_ur['MOFA_GPU_Memory'] = mofa_results['gpu_mem_usage']
        x_timepoints = mofa_results['time_points']
        redislogger.info(job_id, f"MOFA: Graph Connectivity: {mofa_results['graph_conn']}, kBET: {mofa_results['kBET']}, Principal component regression score: {mofa_results['PCR_batch']}, Batch ASW: {mofa_results['ASW_label/batch']}, Biological Conservation: {mofa_results['Biological Conservation']}")

    except Exception as e:
        # Handle exceptions as needed
        redislogger.error(job_id, f"MOFA Multimodal is failed: {e}")

    # WNN
    try:
        redislogger.info(job_id, "Running WNN for Multimodal task.")
        process_id = generate_process_id(md5, task_type, 'WNN', label)
        wnn_results = benchmark_result_exists(process_id)

        if wnn_results is not None:
            redislogger.info(job_id, "Found existing WNN Benchmarks results in database, skip WNN.")
        else:
            # Call WNN method
            wnn_results = wnn_multimodal(mdata, mod1, mod2, batch_key, label, benchmarksId, datasetId, task_type)
            create_bm_results(process_id, wnn_results)
            multimodal_results.append({'WNN': wnn_results})
            redislogger.info(job_id, "WNN Multimodal is done.")

        sys_info = wnn_results['sys_info']
        y_values['WNN'] = [wnn_results['graph_conn'], wnn_results['kBET'], wnn_results['PCR_batch'], wnn_results['ASW_label/batch'], wnn_results['Biological Conservation']]
        y_values_ur['WNN_CPU'] = wnn_results['cpu_usage']
        y_values_ur['WNN_Memory'] = wnn_results['mem_usage']
        y_values_ur['WNN_GPU'] = wnn_results['gpu_usage']
        y_values_ur['WNN_GPU_Memory'] = wnn_results['gpu_mem_usage']
        x_timepoints = wnn_results['time_points']
        redislogger.info(job_id, f"WNN: Graph Connectivity: {wnn_results['graph_conn']}, kBET: {wnn_results['kBET']}, Principal component regression score: {wnn_results['PCR_batch']}, Batch ASW: {wnn_results['ASW_label/batch']}, Biological Conservation: {wnn_results['Biological Conservation']}")

    except Exception as e:
        # Handle exceptions as needed
        redislogger.error(job_id, f"WNN Multimodal is failed: {e}")

    redislogger.info(job_id, "Creating bar plot for evaluation.")
    # Call the plot_bar function
    benchmarks_plot = plot_bar(x=metrics, y=y_values, title='Benchmarks: Multimodal')

    redislogger.info(job_id, "Creating line plot for computing resourses utilization rate.")
    # Call the plot_line function with an empty array for x
    utilization_plot = plot_line(x=x_timepoints, y=y_values_ur, sysinfo=sys_info)

    mdata = None # Release memory
    
    results = {
        "adata_path": mdata_path,
        "benchmarksId": benchmarksId,
        "datasetId": datasetId,
        "task_type": task_type,
        "mod1": mod1,
        "mod2": mod2,
        "label": label,
        "batch_key": batch_key,
        "metrics": metrics,
        "methods": multimodal_results,
        # "sys_info": sys_info,
        "benchmarks_plot": benchmarks_plot,
        "utilization_plot": utilization_plot
    }

    return results
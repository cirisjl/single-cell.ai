from .evaluation.annotation import *
from .evaluation.ccc import *
from .evaluation.clustering import *
from .evaluation.imputation import *
from .evaluation.integration import *
from .evaluation.multimodal import *
from .evaluation.trajectory import *
from .evaluation.annotation import *
from datetime import datetime
from .utils import *
import requests
import json


def eval(adata=None, adata_int=None, mdata=None, benchmarks_id=None, task=None, cluster_key=None, label_key=None, batch_key=None, labels=None, labels_pred=None, embedding=None, embedding_key=None, ccc_pred=None, ccc_target=None, score="score", denoised=None, train='train', test='test', mod1_key='rna', mod2_key='atac', traj=None, bm_traj=None, root_node=None, species=None, server_endpoint=server_endpoint+'benchmarks/', method="Your method"):
    if adata is None and mdata is None and (task != "Cell Type Annotation" or task != "CT"):
        if adata is None:
            raise ValueError("adata is required.")
        else:
            raise ValueError("mdata is required.")
    
    benchmarks = None
    current_date_and_time = datetime.now()
    benchmarks_data = None
    dataset_id = None

    if benchmarks_id is not None:
        dataset_id, task = get_dataset_id(benchmarks_id)
        url = server_endpoint + benchmarks_id
        response = requests.get(url)
        if response.status_code == 200:
            try:
                benchmarks = response.json()
                benchmarks_data = benchmarks['benchmarks_plot']['data']
                match task:
                    case "Clustering" | "CL":
                        label_key = benchmarks['label']
                        labels = adata.obs[label_key]
                        if cluster_key is not None:
                            labels_pred = adata.obs[cluster_key]
                        if embedding_key is not None:
                            embedding = adata.obsm[embedding_key]

                    case "Imputation" | "IM":
                        species = benchmarks['species']

                    case "Batch Integration" | "BI":
                        label_key = benchmarks['label']
                        batch_key = benchmarks['batch_key']
                        species = benchmarks['species']

                    case "Trajectory" | "TJ":
                        label_key = benchmarks['label']
                        root_node = benchmarks['origin_group']
                        bm_traj_key = benchmarks['bm_traj']
                        bm_traj = adata.uns[bm_traj_key]
                        root_node = adata.uns[root_node]

                    case "Cell-Cell Communication" | "CCC":
                        label_key = benchmarks['label']
                        ccc_target_key = benchmarks['ccc_target']
                        species = benchmarks['species']
                        ccc_target = adata.uns[ccc_target_key]

                    case "Multimodal Data Integration" | "MI":
                        mod1_key = benchmarks['mod1']
                        mod2_key = benchmarks['mod2']
                        label_key = benchmarks['label']
                        batch_key = benchmarks['batch_key']
                        species = benchmarks['species']

                    case "Cell Type Annotation" | "CT":
                        label_key = benchmarks['label']
                        labels = adata.obs[label_key]
                        # species = benchmarks['species']

            except Exception as e:
                print(f"Failed to get Benchmarks: {str(e)}")
        else:
            print(f"Failed to get Benchmarks: {benchmarks_id}.")

    if task is not None:
        task_info = {
            "benchmarksId": benchmarks_id,
            "datasetId": dataset_id,
            "task_type": task,
            "tool": method,
            "created_on": current_date_and_time
        }
        match task:
            case "Clustering" | "CL":
                if labels_pred is not None and labels is not None and embedding is not None:
                    asw_score, nmi_score, ari_score, fm_score = clustering_metrics(labels, labels_pred, embedding)
                    results = {
                        "benchmarksId": benchmarks_id,
                        "datasetId": dataset_id,
                        "task_type": task,
                        "tool": method,
                        "Silhouette": asw_score,
                        "NMI": nmi_score,
                        "ARI": ari_score,
                        "Fowlkes Mallows": fm_score,
                        "created_on": current_date_and_time
                    }
                    if benchmarks_data is not None:
                        labels, y_labels, data = get_bar_plot_data(benchmarks_data, user_results=results)
                        plot_bars(task, labels, y_labels, data)

                    return results
                else: 
                    raise ValueError(f"labels_pred, labels and embedding are required for {task}.")

            case "Imputation" | "IM":
                if denoised is not None:
                    mse, possion = imputation_metrics(adata, denoised=denoised)
                    results = {
                        "benchmarksId": benchmarks_id,
                        "datasetId": dataset_id,
                        "task_type": task,
                        "tool": method,
                        "MSE": mse,
                        "Possion": possion,
                        "created_on": current_date_and_time
                    }
                    if benchmarks_data is not None:
                        labels, y_labels, data = get_bar_plot_data(benchmarks_data, user_results=results)
                        plot_bars(task, labels, y_labels, data)
                    return results
                else: 
                    raise ValueError(f"denoised is required for {task}.")

            case "Batch Integration" | "BI":
                if adata_int is not None and label_key is not None and batch_key is not None:
                    metrics_dict = integration_metrics(adata, adata_int, batch_key=batch_key, label_key=label_key, species=species)
                    results = {**task_info, **metrics_dict}
                    if benchmarks_data is not None:
                        labels, y_labels, data = get_bar_plot_data(benchmarks_data, user_results=results)
                        plot_bars(task, labels, y_labels, data, rotation=90)
                    return results
                else: 
                    raise ValueError(f"adata_int, label_key and batch_key are required for {task}.")
                    
            case "Trajectory" | "TJ":
                if traj is not None and bm_traj is not None and root_node is not None:
                    ged_score, gks_score, jsc_score, ted_score, mean = trajectory_metrics(traj, bm_traj, root_node)
                    results = {
                        "benchmarksId": benchmarks_id,
                        "datasetId": dataset_id,
                        "task_type": task,
                        "tool": method,
                        "Graph Edit Distance": ged_score,
                        "Graph Kernel Score": gks_score,
                        "Jaccard Similarity Coefficient": jsc_score,
                        "Tree Edit Distance": ted_score,
                        "Mean": mean,
                        "created_on": current_date_and_time
                    }
                    if benchmarks_data is not None:
                        labels, y_labels, data = get_bar_plot_data(benchmarks_data, user_results=results)
                        plot_bars(task, labels, y_labels, data, rotation=90)
                    return results
                else: 
                    raise ValueError(f"traj, bm_traj and root_node are required for {task}.")

            case "Cell-Cell Communication" | "CCC":
                if ccc_pred is not None and ccc_target is not None and score is not None:
                    auc_score, oddsratio_score = ccc_metrics(adata, ccc_pred, ccc_target, score='score')
                    results = {
                        "benchmarksId": benchmarks_id,
                        "datasetId": dataset_id,
                        "task_type": task,
                        "tool": method,
                        "Precision-recall AUC": auc_score,
                        "Odds Ratio": oddsratio_score,
                        "created_on": current_date_and_time
                    }
                    if benchmarks_data is not None:
                        labels, y_labels, data = get_bar_plot_data(benchmarks_data, user_results=results)
                        plot_bars(task, labels, y_labels, data, rotation=90)
                    return results
                else: 
                    raise ValueError(f"ccc_pred, ccc_target and score are required for {task}.")

            case "Multimodal Data Integration" | "MI":
                if embedding_key is not None and mod1_key is not None and batch_key is not None and label_key is not None:
                    metrics_dict = multimodal_metrics(mdata, embed=embedding_key, mod1=mod1_key, batch=batch_key, label_key=label_key, species=species)
                    results = {**task_info, **metrics_dict}
                    if benchmarks_data is not None:
                        labels, y_labels, data = get_bar_plot_data(benchmarks_data, user_results=results)
                        plot_bars(task, labels, y_labels, data, rotation=90)
                    return results
                else: 
                    raise ValueError(f"embedding_key, mod1_key, label_key and batch_key are required for {task}.")

            case "Cell Type Annotation" | "CT":
                if labels_pred is not None and labels is not None:
                    accuracy, f1_macro, f1_micro, f1_weighted = annotation_metrics(labels, labels_pred)
                    results = {
                        "benchmarksId": benchmarks_id,
                        "datasetId": dataset_id,
                        "task_type": task,
                        "tool": method,
                        "Accuracy": accuracy,
                        "F1_macro": f1_macro,
                        "F1_micro": f1_micro,
                        "F1_weighted": f1_weighted,
                        "created_on": current_date_and_time
                    }
                    if benchmarks_data is not None:
                        labels, y_labels, data = get_bar_plot_data(benchmarks_data, user_results=results)
                        plot_bars(task, labels, y_labels, data)
                    return results
                else: 
                    raise ValueError(f"labels_pred, and labels are required for {task}.")

            case _:  # Default case, equivalent to 'default' in other languages
                raise ValueError(f"{task} is not supported. Please input the task name from the following list [Clustering, Imputation, Batch Integration, Trajectory, Cell-Cell Communication, Multimodal Data Integration, Cell Type Annotation].")
    else:
        raise ValueError("benchmarks_id or task is required.")


def write_json(data, file_path="./output.json"):
    # Open the file in write mode ('w') and use json.dump() to write the dictionary
    with open(file_path, 'w') as json_file:
        json.dump(data, json_file, indent=4, default=serialize_datetime) # indent=4 for pretty-printing

    print(f"Dictionary successfully written to {file_path}")


def serialize_datetime(obj):
    if isinstance(obj, datetime):
        return obj.isoformat()
    raise TypeError("Type not serializable")

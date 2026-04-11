import sys
sys.path.append('..')
from tools.formating.formating import *
from tools.ccc.liana import run_liana_ccc
from tools.evaluation.monitor import *
from tools.evaluation.ccc import *
from datetime import datetime


def liana_ccc(adata, cell_type_label, benchmarksId, datasetId, task_type, species, ccc_target="ccc_target", methods=['SingleCellSignalR', 'Connectome', 'CellPhoneDB', 'NATMI', 'log2FC', 'CellChat', 'GeometricMean']):
    # Start monitoring
    monitor = Monitor(1)
    sys_info = monitor.get_sys_info()
    results = {}
    adata = run_liana_ccc(adata, cell_type_label=cell_type_label, species=species, methods=methods, aggregate_methods=['mean', 'rra'])
    
    # Stop monitoring
    time_points, cpu_usage, mem_usage, gpu_usage, gpu_mem_usage = monitor.stop()

    current_date_and_time = datetime.now()

    results = {
                "sys_info": sys_info,
                "benchmarksId": benchmarksId,
                "datasetId": datasetId,
                "task_type": task_type,
                "time_points": time_points,
                "cpu_usage": cpu_usage,
                "mem_usage": mem_usage,
                "gpu_usage": gpu_usage,
                "gpu_mem_usage": gpu_mem_usage,
                "created_on": current_date_and_time
             }
    results['results'] = []

    for method in methods:
        if method in adata.uns.keys():
            # Max
            adata.uns["ccc_pred"] = aggregate_method_scores(adata.copy(), how="max", ccc_pred=method, score="score")
            auc_score, oddsratio_score = ccc_metrics(adata, ccc_pred="ccc_pred", ccc_target=ccc_target, score='score')
            results['results'].append({
                "tool": f"{method} (max)",
                "Precision-recall AUC": auc_score,
                "Odds Ratio": oddsratio_score
            })
            del adata.uns["ccc_pred"]

            # Sum
            adata.uns["ccc_pred"] = aggregate_method_scores(adata.copy(), how="sum", ccc_pred=method, score="score")
            auc_score, oddsratio_score = ccc_metrics(adata, ccc_pred="ccc_pred", ccc_target=ccc_target, score='score')
            results['results'].append({
                "tool": f"{method} (sum)",
                "Precision-recall AUC": auc_score,
                "Odds Ratio": oddsratio_score
            })
            adata.uns["ccc_pred"]

    adata.uns["ccc_pred"] = aggregate_method_scores(adata.copy(), how="max", ccc_pred='LIANA (rra)', score="score")
    auc_score, oddsratio_score = ccc_metrics(adata, ccc_pred="ccc_pred", ccc_target=ccc_target, score="score")
    results['results'].append({
                "tool": "LIANA RobustRankAggregate (max)",
                "Precision-recall AUC": auc_score,
                "Odds Ratio": oddsratio_score
             })

    adata.uns["ccc_pred"] = aggregate_method_scores(adata.copy(), how="sum", ccc_pred='LIANA (rra)', score="score")
    auc_score, oddsratio_score = ccc_metrics(adata, ccc_pred="ccc_pred", ccc_target=ccc_target, score="score")
    results['results'].append({
                "tool": "LIANA RobustRankAggregate (sum)",
                "Precision-recall AUC": auc_score,
                "Odds Ratio": oddsratio_score
             })

    adata.uns["ccc_pred"] = aggregate_method_scores(adata.copy(), how="max", ccc_pred='LIANA (mean)', score="score")
    auc_score, oddsratio_score = ccc_metrics(adata, ccc_pred="ccc_pred", ccc_target=ccc_target, score="score")
    results['results'].append({
                "tool": "LIANA MeanRank (max)",
                "Precision-recall AUC": auc_score,
                "Odds Ratio": oddsratio_score
             })

    adata.uns["ccc_pred"] = aggregate_method_scores(adata.copy(), how="sum", ccc_pred='LIANA (mean)', score="score")
    auc_score, oddsratio_score = ccc_metrics(adata, ccc_pred="ccc_pred", ccc_target=ccc_target, score="score")
    results['results'].append({
                "tool": "LIANA MeanRank (sum)",
                "Precision-recall AUC": auc_score,
                "Odds Ratio": oddsratio_score
             })

    adata = None

    return results
from typing import Union

import anndata
import collections
import numpy as np
from sklearn.metrics import auc
from sklearn.metrics import precision_recall_curve

# Cell Cell Communication
def ccc_metrics(adata, ccc_pred="ccc_pred", ccc_target="ccc_target", score="score", top_prop=0.05):
    # Precision-recall AUC
    gt = join_truth_and_pred(adata, ccc_pred, ccc_target, score)
    precision, recall, _ = precision_recall_curve(
        gt["response"], gt[score], pos_label=1
    )

    auc_score = auc(recall, precision)

    # Odds Ratio
    gt = gt.sort_values(score, ascending=False)
    top_n = int(adata.uns[ccc_target].shape[0] * top_prop)

    # assign the top rank interactions to 1
    a = np.zeros(len(gt[score]))
    a[0:top_n] = 1
    gt.loc[:, ["top_n"]] = a

    top = gt[gt["top_n"] == 1]
    tp = np.sum(top.response == 1)
    fp = np.sum(top.response == 0)

    bot = gt[gt["top_n"] == 0]
    fn = np.sum(bot.response == 1)
    tn = np.sum(bot.response == 0)

    numerator = tp * tn
    denominator = fp * fn
    if denominator == 0:
        if numerator == 0:
            # undefined
            oddsratio_score = np.nan
        else:
            # perfect score
            oddsratio_score = np.inf
    else:
        oddsratio_score = numerator / denominator
        oddsratio_score = _sigmoid_transform(oddsratio_score)

    return float('{:.4f}'.format(auc_score)), float('{:.4f}'.format(oddsratio_score))


# Join predictions to target
def join_truth_and_pred(adata, ccc_pred="ccc_pred", ccc_target="ccc_target", score="lrscore"):
    merge_keys = list(adata.uns["merge_keys"])
    gt = adata.uns[ccc_target].merge(adata.uns[ccc_pred], on=merge_keys, how="left")

    gt.loc[gt["response"].isna(), "response"] = 0
    gt.loc[gt[score].isna(), score] = np.nanmin(gt[score]) - np.finfo(float).eps

    return gt


def _sigmoid_transform(x):
    return 1 - 1 / (1 + x / 2)


def aggregate_method_scores(adata, how, ccc_pred="LIANA", score="score"):
    merge_keys = list(adata.uns["merge_keys"])
    return (
        adata.uns[ccc_pred]
        .groupby(merge_keys)
        .agg(score=(score, how))
        .reset_index()
    )
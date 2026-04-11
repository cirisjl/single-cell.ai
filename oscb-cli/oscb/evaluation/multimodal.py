import numpy as np
import pandas as pd 
import os
import subprocess
import scanpy as sc
import scipy.io
import scib
import muon as mu
from muon import MuData


def multimodal_metrics(mdata, embed, mod1='rna', batch='group', label_key='cell_type'):
    scib_anndata = sc.AnnData(mdata.obsm[embed]).copy()
    scib_anndata.obs = mdata.obs.copy()
    scib_anndata.obsp["connectivities"] = mdata.obsp["connectivities"].copy()
    scib_anndata.obsm[embed] = mdata.obsm[embed].copy()
    scib_anndata = scib_anndata[~scib_anndata.obs[f"{mod1}:{batch}"].isna()] # Remove NaN in batch
    scib_anndata = scib_anndata[~scib_anndata.obs[f"{mod1}:{label_key}"].isna()] # Remove NaN in cell type label
    scib_anndata.obs[f"{mod1}:{batch}"] = scib_anndata.obs[f"{mod1}:{batch}"].astype("category")
    scib_anndata.obs[f"{mod1}:{label_key}"] = scib_anndata.obs[f"{mod1}:{label_key}"].astype("category")
    
    metrics = scib.metrics.metrics(
        scib_anndata,
        scib_anndata,
        batch_key=f"{mod1}:{batch}",
        label_key=f"{mod1}:{label_key}",
        embed=embed,
        ari_=True,
        nmi_=True,
        silhouette_=True,
        graph_conn_=True,
        isolated_labels_asw_=True,
    )

    biological_conservation_metrics = ['NMI_cluster/label', 'ARI_cluster/label', 'ASW_label', 'cell_cycle_conservation','isolated_label_F1', 'isolated_label_silhouette', 'hvg_overlap']
    metrics = metrics.fillna(0).to_dict()[0]

    for key, value in metrics.items():
        metrics[key] = float('{:.4f}'.format(value))

    bc_total = 0
    for key in biological_conservation_metrics:
        bc_total += metrics[key]
    biological_conservation_score = float('{:.4f}'.format(bc_total/len(biological_conservation_metrics)))

    metrics['Biological Conservation'] = biological_conservation_score
    scib_anndata = None

    return metrics
# Seed for reproducibility
import torch
import os
import shutil
import numpy as np
import pandas as pd
import scanpy as sc
from typing import Tuple

import sys
sys.path.append('..')
# from tools.formating.formating import *
from tools.reduction.reduction import run_dimension_reduction, run_clustering
from tools.evaluation.monitor import *
from tools.evaluation.clustering import clustering_metrics

# scVI imports
import scvi
# from scvi.model.utils import mde
import pymde

torch.manual_seed(0)
np.random.seed(0)
# sc.settings.verbosity = 0  # verbosity: errors (0), warnings (1), info (2), hints (3)


def scvi_clustering(adata, labels, model_path):
    # Start monitoring
    model = None
    monitor = Monitor(1)
    adata = adata.copy()
    sys_info = monitor.get_sys_info()
    scvi.model.SCVI.setup_anndata(adata)
    if not os.path.exists(model_path):
        model = scvi.model.SCVI(adata, n_hidden = 192, n_latent = 50, n_layers = 1, gene_likelihood = 'zinb')
        model.train(max_epochs = 400, early_stopping = True)
        model.save(model_path)
    else:
        try:
            model = scvi.model.SCVI.load(model_path, adata)
        except Exception as e:
            print(e)
            shutil.rmtree(model_path) # If the model_path exists but could not be loaded, then remove it and train a new one.
            model = scvi.model.SCVI(adata, n_hidden = 192, n_latent = 50, n_layers = 1, gene_likelihood = 'zinb')
            model.train(max_epochs = 400, early_stopping = True)
            model.save(model_path)

    latent = model.get_latent_representation()
    adata.obsm["X_scVI"] = latent
    # denoised = model.get_normalized_expression(adata, library_size=1e4)
    adata.layers["scvi_normalized"] = model.get_normalized_expression(
        library_size=10e4
    )

    adata, msg = run_dimension_reduction(adata, use_rep='X_scVI', skip_tsne=True, skip_3d=True)
    adata = run_clustering(adata, use_rep='X_scVI')

    adata.obsm["X_mde"] = pymde.preserve_neighbors(adata.obsm["X_scVI"]).embed().numpy()
    
    # Stop monitoring
    time_points, cpu_usage, mem_usage, gpu_usage, gpu_mem_usage = monitor.stop()

    asw_score, nmi_score, ari_score, fm_score = clustering_metrics(adata.obs[labels], adata.obs["leiden_X_scVI"], adata.obsm["X_mde"])

    return adata, sys_info, asw_score, nmi_score, ari_score, fm_score, time_points, cpu_usage, mem_usage, gpu_usage, gpu_mem_usage




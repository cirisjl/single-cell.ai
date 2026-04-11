# Seed for reproducibility
import torch
import os
import numpy as np
import pandas as pd
import scanpy as sc
from typing import Tuple

# scVI imports
import scvi
# from scvi.model.utils import mde
import pymde

import seaborn as sns
import matplotlib.pyplot as plt

torch.manual_seed(0)
np.random.seed(0)
# sc.settings.verbosity = 0  # verbosity: errors (0), warnings (1), info (2), hints (3)


def scvi_integrate(adata, batch_key, model_path, fig_path=None):
    model = None
    adata = adata.copy()
    if 'pct_counts_mt' in adata.obs.keys() and 'pct_counts_ribo' in adata.obs.keys():
        scvi.model.SCVI.setup_anndata(adata, categorical_covariate_keys = [batch_key], continuous_covariate_keys=['pct_counts_mt', 'pct_counts_ribo'])
    else:
        scvi.model.SCVI.setup_anndata(adata, categorical_covariate_keys = [batch_key])
    if not os.path.exists(model_path):
        model = scvi.model.SCVI(adata, n_hidden = 192, n_latent = 50, n_layers = 2, gene_likelihood = 'zinb')
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

    adata.obsm["X_scVI"] = model.get_latent_representation()
    adata.layers['scvi_normalized'] = model.get_normalized_expression(library_size = 1e4)

    if fig_path is not None:
        y = model.history['reconstruction_loss_validation']['reconstruction_loss_validation'].min()
        plt.plot(model.history['reconstruction_loss_train']['reconstruction_loss_train'], label='train')
        plt.plot(model.history['reconstruction_loss_validation']['reconstruction_loss_validation'], label='validation')
        plt.axhline(y, c = 'k')
        plt.legend()
        plt.savefig(fig_path, bbox_inches='tight')
        
    adata.obsm["X_mde"] = pymde.preserve_neighbors(adata.obsm["X_scVI"]).embed().numpy()

    return adata




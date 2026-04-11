import numpy as np
import pandas as pd
import scanpy as sc
import sklearn
import dropkick as dk
from scipy.sparse import csr_matrix
from tools.formating.formating import is_normalized, check_nonnegative_integers
sc.settings.verbosity = 3             # verbosity: errors (0), warnings (1), info (2), hints (3)
# sc.logging.print_header()
# sc.settings.set_figure_params(dpi=80, facecolor='white')
from utils.redislogger import redislogger


def run_dropkick_qc(adata, unique_id, n_neighbors=30, n_pcs=10, resolution=0.5, random_state=0, n_hvg=2000):
    if adata is None:
        raise ValueError("Failed to load AnnData object.")
    
    if is_normalized(adata.X, 200) and not check_nonnegative_integers(adata.X):
        redislogger.info(unique_id, "adata.X is not raw counts.")
        if "raw_counts" in adata.layers.keys():
            redislogger.info(unique_id, "Use layer 'raw_counts' instead. Copy adata.X to layer 'normalized_X'.")
            adata.layers["normalized_X"] = adata.X.copy()
            adata.X = adata.layers['raw_counts'].copy()
        elif adata.raw.X is not None:
            redislogger.info(unique_id, "Use adata.raw.X instead. Copy adata.X to layer 'normalized_X'.")
            adata.layers["normalized_X"] = adata.X.copy()
            adata.X = adata.raw.X.copy()
        else:
            raise ValueError("Dropkick QC only take raw counts, not normalized data.")
    
    adata = dk.recipe_dropkick(adata, n_hvgs=None, X_final="raw_counts")
    
    # Run dropkick pipeline function
    redislogger.info(unique_id, "Run dropkick pipeline function.")
    qc_plt = dk.qc_summary(adata)
    adata_model = dk.dropkick(adata, n_jobs=5)
    score_plt = dk.score_plot(adata)
    dk.coef_inventory(adata)
    coef_plt = dk.coef_plot(adata)

    # Make a copy of our AnnData object, keeping all barcodes kept by dropkick, CellRanger, or EmptyDrops
    adata_filtered = adata[(adata.obs.dropkick_label=="True"),:].copy()
    
    # Here, we want to end up working with normalized, arcsinh-transformed counts 
    # where genes are scaled to unit variance and zero-centered
    # we also set filter=True to remove any genes with zero total counts
    # we perform a variable gene selection for 2000 HVGs before further processing
    adata_filtered= dk.recipe_dropkick(adata_filtered, X_final="arcsinh_norm", filter=True, n_hvgs=n_hvg, verbose=True)
    # adata_filtered.X = adata_filtered.layers["raw_counts"].copy()

    # Converrt dense martrix to sparse matrix
    if isinstance(adata.X, np.ndarray):
        adata.X = csr_matrix(adata.X)

    redislogger.info(unique_id, "Dropkick Quality Control is completed.")

    return adata_filtered

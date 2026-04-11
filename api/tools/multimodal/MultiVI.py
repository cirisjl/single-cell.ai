import os
import muon
import numpy as np
import scanpy as sc
from scipy.sparse import csr_matrix
import scvi
import seaborn as sns
import torch
import scipy
from scipy import sparse
import sys
sys.path.append('..')
from tools.formating.formating import *

scvi.settings.seed = 0
torch.set_float32_matmul_precision("high")

def run_multivi(mdata_path, mdata=None, rna_subset="rna", atac_subset="atac"):
    if mdata == None:
        mdata = muon.read_h5mu(mdata_path)
    model_dir = get_scvi_path(mdata_path, "multivi")

    if is_normalized(mdata[rna_subset].X, 200) and not check_nonnegative_integers(mdata[rna_subset].X):
        print("mdata[rna_subset].X is not raw counts.")
        if "raw_counts" in mdata[rna_subset].layers.keys():
            print("Use layer 'raw_counts' instead.")
            # mdata[rna_subset].layers["normalized_X"] = mdata[rna_subset].X.copy()
            mdata[rna_subset].X = mdata[rna_subset].layers['raw_counts'].copy()
        elif mdata[rna_subset].raw is not None:
            print("Use mdata[rna_subset].raw.X instead.")
            # mdata[rna_subset].layers["normalized_X"] = mdata[rna_subset].X.copy()
            mdata[rna_subset].X = mdata[rna_subset].raw.X.copy()
        else:
            raise ValueError("MultiVI only take raw counts, not normalized data.")

    if is_normalized(mdata[atac_subset].X, 200) and not check_nonnegative_integers(mdata[atac_subset].X):
        print("mdata[atac_subset].X is not raw counts.")
        if "raw_counts" in mdata[atac_subset].layers.keys():
            print("Use layer 'raw_counts' instead.")
            # mdata[atac_subset].layers["normalized_X"] = mdata[atac_subset].X.copy()
            mdata[atac_subset].X = mdata[atac_subset].layers['raw_counts'].copy()
        elif mdata[atac_subset].raw is not None:
            print("Use mdata[atac_subset].raw.X instead.")
            # mdata[atac_subset].layers["normalized_X"] = mdata[atac_subset].X.copy()
            mdata[atac_subset].X = mdata[atac_subset].raw.X.copy()
        else:
            raise ValueError("MultiVI only take raw counts, not normalized data.")

    model = None
    if not os.path.exists(model_dir):
        scvi.model.MULTIVI.setup_mudata(
            mdata,
            modalities={
                "rna_layer": rna_subset,
                "atac_layer": atac_subset,
            },
        )

        model = scvi.model.MULTIVI(
            mdata,
            n_genes=len(mdata.mod[rna_subset].var),
            n_regions=len(mdata.mod[atac_subset].var),
        )

        # For our sparse matrices, we want CSR rather than CSC as training will be faster
        if type(mdata.mod[rna_subset].X) == scipy.sparse._csc.csc_matrix:
            mdata.mod[rna_subset].X = mdata.mod[rna_subset].X.tocsr()
        elif type(mdata.mod[rna_subset].X) == np.matrix or type(mdata.mod[rna_subset].X) == np.ndarray:
            mdata.mod[rna_subset].X = sparse.csr_matrix(mdata.mod[rna_subset].X)
        if type(mdata.mod[atac_subset].X) == scipy.sparse._csc.csc_matrix:
            mdata.mod[atac_subset].X = mdata.mod[atac_subset].X.tocsr()
        elif type(mdata.mod[atac_subset].X) == np.matrix or type(mdata.mod[atac_subset].X) == np.ndarray:
            mdata.mod[atac_subset].X = sparse.csr_matrix(mdata.mod[atac_subset].X)
        mdata.update()
        model.train()
        model.save(model_dir, overwrite=True)
    else: 
        model = scvi.model.MULTIVI.load(model_dir, adata=mdata)

    mdata = model.adata

    # Below we an cell annotations for modality, so we can color the UMAP

    MULTIVI_LATENT_KEY = "X_multivi"

    mdata.obsm[MULTIVI_LATENT_KEY] = model.get_latent_representation()
    sc.pp.neighbors(mdata, use_rep=MULTIVI_LATENT_KEY)
    sc.tl.umap(mdata, min_dist=0.2)

    n = mdata.n_obs // 3

    # initialize the column first
    mdata.obs["modality"] = ""

    # set modality of first third to rna
    mdata.obs.iloc[:n, mdata.obs.columns.get_loc("modality")] = "expression"

    # set modality of second third to both
    mdata.obs.iloc[n : 2 * n, mdata.obs.columns.get_loc("modality")] = "paired"

    # set modality of last third to atac
    mdata.obs.iloc[2 * n :, mdata.obs.columns.get_loc("modality")] = "accessibility"

    sc.pl.umap(mdata, color="modality")
    # Impute missing modalities
    mdata.obsm["MultiVI_imputed"] = model.get_normalized_expression()

    return mdata
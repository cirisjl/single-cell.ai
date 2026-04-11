import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import plotnine as p9
import scanpy as sc
import scvi
import seaborn as sns
import torch
from scipy.stats import pearsonr

scvi.settings.seed = 0
torch.set_float32_matmul_precision("high")


def run_multivi(adata, transform_batch, held_out_batch=None, batch_key='batch', protein_expression_obsm_key="protein_expression"):
    held_out_proteins = None
    # Now we hold-out the proteins of the 5k dataset. To do so, we can replace all the values with 0s. We will store the original values to validate after training.
    if held_out_batch is not None:
        held_out_proteins = adata.obsm[protein_expression_obsm_key][batch == held_out_batch].copy()
        adata.obsm[protein_expression_obsm_key].loc[batch == held_out_batch] = np.zeros_like(
            adata.obsm[protein_expression_obsm_key][batch == held_out_batch]
        )

    sc.pp.highly_variable_genes(
        adata, batch_key=batch_key, flavor="seurat_v3", n_top_genes=4000, subset=True
    )
    scvi.model.TOTALVI.setup_anndata(
        adata, batch_key=batch_key, protein_expression_obsm_key=protein_expression_obsm_key
    )
    model = scvi.model.TOTALVI(adata, latent_distribution="normal", n_layers_decoder=2)
    model.train()

    plt.plot(model.history["elbo_train"], label="train")
    plt.plot(model.history["elbo_validation"], label="val")
    plt.title("Negative ELBO over training epochs")
    plt.ylim(1100, 1500)
    plt.legend()

    TOTALVI_LATENT_KEY = "X_totalVI"
    PROTEIN_FG_KEY = "protein_fg_prob"

    adata.obsm[TOTALVI_LATENT_KEY] = model.get_latent_representation()
    adata.obsm[PROTEIN_FG_KEY] = model.get_protein_foreground_probability(transform_batch=transform_batch)

    rna, protein = model.get_normalized_expression(
        transform_batch=transform_batch, n_samples=25, return_mean=True
    )

    _, protein_means = model.get_normalized_expression(
        n_samples=25,
        transform_batch=transform_batch,
        include_protein_background=True,
        sample_protein_mixing=False,
        return_mean=True,
    )

    TOTALVI_CLUSTERS_KEY = "leiden_totalVI"

    sc.pp.neighbors(adata, use_rep=TOTALVI_LATENT_KEY)
    sc.tl.umap(adata, min_dist=0.4)
    sc.tl.leiden(adata, key_added=TOTALVI_CLUSTERS_KEY)
    perm_inds = np.random.permutation(len(adata))
    sc.pl.umap(
        adata[perm_inds],
        color=[TOTALVI_CLUSTERS_KEY, batch_key],
        ncols=1,
        frameon=False,
    )

    batch = adata.obs.batch.values.ravel()
    combined_protein = np.concatenate(
        [adata.obsm[protein_expression_obsm_key].values[batch == transform_batch], held_out_proteins],
        axis=0,
    )

    # cleaner protein names
    parsed_protein_names = [p.split("_")[0] for p in adata.obsm[protein_expression_obsm_key].columns]
    for i, p in enumerate(parsed_protein_names):
        adata.obs[f"{p} imputed"] = protein_means.iloc[:, i]
        adata.obs[f"{p} observed"] = combined_protein[:, i]

    viz_keys = []
    for p in parsed_protein_names:
        viz_keys.append(p + " imputed")
        viz_keys.append(p + " observed")

    if held_out_batch is not None:
        sc.pl.umap(
            adata[adata.obs.batch == held_out_batch],
            color=viz_keys,
            ncols=2,
            vmax="p99",
            frameon=False,
            add_outline=True,
            wspace=0.1,
        )

        # Imputed vs denoised correlations
        imputed_pros = protein_means[batch == held_out_batch]
        held_vs_denoised = pd.DataFrame()
        held_vs_denoised["Observed (log)"] = np.log1p(held_out_proteins.values.ravel())
        held_vs_denoised["Imputed (log)"] = np.log1p(imputed_pros.to_numpy().ravel())
        protein_names_corrs = []
        for i in range(len(parsed_protein_names)):
            protein_names_corrs.append(
                parsed_protein_names[i]
                + ": Corr="
                + str(np.round(pearsonr(held_out_proteins.values[:, i], imputed_pros.iloc[:, i])[0], 3))
            )
        held_vs_denoised["Protein"] = protein_names_corrs * len(held_out_proteins)
        held_vs_denoised.head()

        p9.theme_set(p9.theme_classic)
        (
            p9.ggplot(held_vs_denoised, p9.aes("Observed (log)", "Imputed (log)"))
            + p9.geom_point(size=0.5)
            + p9.facet_wrap("~Protein", scales="free")
            + p9.theme(
                figure_size=(10, 10),
                panel_spacing=0.05,
            )
        )

    return adata
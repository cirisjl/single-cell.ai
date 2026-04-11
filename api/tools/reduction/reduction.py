import warnings
import os
import scanpy as sc
from anndata import AnnData
from sklearn.manifold import TSNE
from umap import UMAP
from tools.formating.formating import is_normalized, check_nonnegative_integers
import matplotlib.pyplot as plt
import matplotlib


def run_dimension_reduction(adata, layer=None, n_neighbors=15, use_rep=None, n_pcs=None, random_state=0, skip_if_exist=False, skip_tsne=False, skip_3d=False):
    msg = None
    if layer == "Pearson_residuals":
        msg = "Normalize Pearson_residuals may create NaN values, which are not accepted by PCA."
        return adata, msg

    if n_pcs == 0:
        n_pcs=None

    perplexity = 30.0
    if adata.n_obs < 3 * perplexity + 1:
        perplexity = (adata.n_obs - 1) / 3
        # warnings.warn(f"The number of cells is too small for the default perplexity 30.0. Set perplexity to {perplexity}.")
        msg = f"The number of cells is too small for the default perplexity 30.0. Set perplexity to {perplexity}."

    if layer is not None and layer in adata.layers.keys(): # and (layer+'_umap' not in adata.obsm.keys() or layer+'_umap_3D' not in adata.obsm.keys()):
        # Principal component analysis
        if not (skip_if_exist and layer+'_pca' in adata.obsm.keys()):
            adata.obsm[layer+'_pca'] = sc.pp.pca(adata.layers[layer])

        # Computing the neighborhood graph
        if not (skip_if_exist and 'neighbors' in adata.uns.keys()):
            if use_rep is not None and n_pcs is not None and adata.obsm[use_rep].shape[1] < n_pcs:
                msg = f"{use_rep} does not have enough Dimensions. Set n_pcs to {adata.obsm[use_rep].shape[1]}."
                n_pcs = adata.obsm[use_rep].shape[1]

            if use_rep is None:
                use_rep = layer+'_pca'

            sc.pp.neighbors(adata, n_neighbors=n_neighbors, n_pcs=n_pcs, use_rep=use_rep, random_state=random_state)
        
        # tSNE
        if not (skip_tsne or (skip_if_exist and layer+'_tsne' in adata.obsm.keys())):
            tsne = TSNE(n_components=2, perplexity=perplexity, random_state=random_state)
            adata.obsm[layer+'_tsne'] = tsne.fit_transform(adata.obsm[layer+'_pca'])

        if not (skip_tsne or skip_3d or (skip_if_exist and layer+'_tsne_3D' in adata.obsm.keys())):
            tsne = TSNE(n_components=3, perplexity=perplexity, random_state=random_state)
            adata.obsm[layer+'_tsne_3D'] = tsne.fit_transform(adata.obsm[layer+'_pca'])
        
        # UMAP
        if not (skip_if_exist and layer+'_umap' in adata.obsm.keys()):
            umap_2d = UMAP(n_components=2, init='random', random_state=random_state)
            adata.obsm[layer+'_umap'] = umap_2d.fit_transform(adata.obsm[layer+'_pca'])

        if not (skip_3d or (skip_if_exist and layer+'_umap_3D' in adata.obsm.keys())):
            umap_3d = UMAP(n_components=3, init='random', random_state=random_state)
            adata.obsm[layer+"_umap_3D"] = umap_3d.fit_transform(adata.obsm[layer+'_pca'])

    elif layer is None: # and ('X_umap' not in adata.obsm.keys() or 'X_umap_3D' not in adata.obsm.keys()):
        # Principal component analysis
        if not (skip_if_exist and 'X_pca' in adata.obsm.keys()):
            if not is_normalized(adata.X, 200):
                adata.layers['raw_counts'] = adata.X.copy()
                sc.pp.normalize_total(adata)
                sc.pp.log1p(adata)
            sc.pp.pca(adata, svd_solver='arpack', random_state=random_state)

        # Computing the neighborhood graph
        if not (skip_if_exist and 'neighbors' in adata.uns.keys()):
            if use_rep is not None and n_pcs is not None and adata.obsm[use_rep].shape[1] < n_pcs:
                msg = f"{use_rep} does not have enough Dimensions. Set n_pcs to {adata.obsm[use_rep].shape[1]}."
                n_pcs = adata.obsm[use_rep].shape[1]
                sc.pp.neighbors(adata, n_neighbors=n_neighbors, n_pcs=n_pcs, use_rep=use_rep, random_state=random_state)
            elif use_rep is not None:
                sc.pp.neighbors(adata, n_neighbors=n_neighbors, n_pcs=n_pcs, use_rep=use_rep, random_state=random_state)
            else:
                sc.pp.neighbors(adata, n_neighbors=n_neighbors, n_pcs=n_pcs, random_state=random_state)
            # elif use_rep is None:
            #     use_rep = 'X_pca'
            

        # tSNE
        if not (skip_tsne or (skip_if_exist and 'X_tsne' in adata.obsm.keys())):
            tsne = TSNE(n_components=2, perplexity=perplexity, random_state=random_state)
            adata.obsm['X_tsne'] = tsne.fit_transform(adata.obsm['X_pca'])

        # 3D tSNE
        if not (skip_tsne or skip_3d or (skip_if_exist and 'X_tsne_3D' in adata.obsm.keys())):
            tsne = TSNE(n_components=3, perplexity=perplexity, random_state=random_state)
            adata.obsm['X_tsne_3D'] = tsne.fit_transform(adata.obsm['X_pca'])

        # 2D UMAP
        if not (skip_if_exist and 'X_umap' in adata.obsm.keys()):
            umap_2d = UMAP(n_components=2, init='random', random_state=random_state)
            adata.obsm['X_umap'] = umap_2d.fit_transform(adata.obsm['X_pca'])
            # sc.tl.umap(adata, random_state=random_state, 
            #             init_pos="spectral", n_components=2, 
            #             copy=False, maxiter=None)
        
        # 3D UMAP
        if not (skip_3d or (skip_if_exist and 'X_umap_3D' in adata.obsm.keys())):
            umap_3d = UMAP(n_components=3, init='random', random_state=random_state)
            adata.obsm["X_umap_3D"] = umap_3d.fit_transform(adata.obsm['X_pca'])
            # adata_3D = sc.tl.umap(adata, random_state=random_state, 
            #                 init_pos="spectral", n_components=3, 
            #                 copy=True, maxiter=None)
            # adata.obsm["X_umap_3D"] = adata_3D.obsm["X_umap"]
            # adata_3D = None
    else:
        # if layer is None: layer = 'X'
        # msg = f"{layer}_umap already exists, skipped."
        msg = f"{layer} does not exist, skipped."

    return adata, msg


def run_clustering(adata, layer=None, use_rep=None, resolution=0.5, random_state=0, skip_if_exist=False):
    if layer == "Pearson_residuals":
        print("Normalize Pearson_residuals may create NaN values, which are not accepted by PCA.")
        return adata

    if skip_if_exist:
        if layer is not None and layer + '_louvain' in adata.obs.keys() and  layer + '_leiden' in adata.obs.keys():
            return adata
        elif layer is None and use_rep is not None and use_rep + '_louvain' not in adata.obs.keys() and use_rep + '_leiden' not in adata.obs.keys():
            return adata
        elif layer is None and 'louvain' not in adata.obs.keys() and 'leiden' not in adata.obs.keys():
            return adata
    
    if layer is not None: # and layer + '_louvain' not in adata.obs.keys():
        adata_temp = adata.copy()
        adata_temp.X = adata_temp.layers[layer]
        
        # Clustering the neighborhood graph
        sc.tl.leiden(adata_temp, resolution=resolution, 
                    random_state=random_state, flavor="igraph", n_iterations=2)

        adata.uns[layer + '_leiden'] = adata_temp.uns["leiden"].copy()
        adata.obs[layer + '_leiden'] = adata_temp.obs["leiden"].copy()

        sc.tl.louvain(adata_temp)
        adata.uns[layer + '_louvain'] = adata_temp.uns["louvain"].copy()
        adata.obs[layer + '_louvain'] = adata_temp.obs["louvain"].copy()
        adata_temp = None
    elif layer is None and use_rep is not None: # and use_rep + '_louvain' not in adata.obs.keys():
        leiden_key = use_rep + "_leiden"
        louvain_key = use_rep + "_louvain"
        sc.tl.leiden(adata, key_added = leiden_key, resolution=resolution, 
                    random_state=random_state, flavor="igraph", n_iterations=2)

        sc.tl.louvain(adata, key_added = louvain_key)
    elif layer is None: # and 'louvain' not in adata.obs.keys():
        # Clustering the neighborhood graph
        leiden_key = "leiden"
        louvain_key = "louvain"

        if not is_normalized(adata.X, 200):
            adata.layers['raw_counts'] = adata.X.copy()
            sc.pp.normalize_total(adata)
            sc.pp.log1p(adata)

        sc.tl.leiden(adata, key_added = leiden_key, resolution=resolution, 
                    random_state=random_state, flavor="igraph", n_iterations=2)

        sc.tl.louvain(adata, key_added = louvain_key)
    # else:
    #     if layer is None: layer = 'X'
    #     print(f"Cluster for {layer} already exists, skipped.")

    return adata


def plot_embedding(adata: AnnData, basis: str = 'X_umap', layer: str = None, color: str = 'leiden', fig_path: str = None, title: str = None, dpi: int = 300):
    if layer == "Pearson_residuals":
        print("Normalize Pearson_residuals may create NaN values, which are not accepted by PCA.")
        return
    if layer is not None:
        basis = layer + '_umap'
        if color is None:
            color = layer + '_leiden'

    if fig_path is not None:
        if title is not None:
            fig_path = os.path.join(fig_path, title + f'_{basis}.png')
        elif color is not None:
            fig_path = os.path.join(fig_path, f'{color}_{basis}.png')
        else:
            fig_path = os.path.join(fig_path, f'{basis}.png')
        print(f"Embedding figure will be saved to {fig_path}")

    if fig_path is not None and color is not None and color in adata.obs.keys() and basis in adata.obsm.keys():
        sc.pl.embedding(adata, basis=basis, color=color, show=False)
        plt.savefig(fig_path, dpi=dpi, bbox_inches='tight')

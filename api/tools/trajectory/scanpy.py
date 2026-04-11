import numpy as np
import matplotlib.pyplot as pl
import scanpy as sc
from tools.trajectory.build_graph import *
from tools.formating.formating import *
from utils.redislogger import *


def run_scanpy_trajectory(adata, unique_id, cell_type_label=None, color=["leiden"], origin_group=None, n_neighbors=10, n_pcs=20, resolution=1.0):
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
            raise ValueError("scanpy trajectory only take raw counts, not normalized data.")

    adata.X = adata.X.astype("float64")

    sc.pp.recipe_zheng17(adata)
    sc.tl.pca(adata, svd_solver="arpack")
    sc.pp.neighbors(adata, n_neighbors=n_neighbors, n_pcs=n_pcs)
    sc.tl.draw_graph(adata)
    # Denoising the graph
    sc.tl.diffmap(adata)
    sc.pp.neighbors(adata, n_neighbors=n_neighbors, use_rep="X_diffmap")
    sc.tl.draw_graph(adata)
    sc.tl.leiden(adata, resolution=resolution)
    sc.tl.paga(adata, groups="leiden")
    sc.pl.paga(adata, color=color)
    # Recomputing the embedding using PAGA-initialization
    sc.tl.draw_graph(adata, init_pos="paga")

    sc.pl.paga_compare(
        adata,
        threshold=0.03,
        title="",
        right_margin=0.2,
        size=10,
        edge_width_scale=0.5,
        legend_fontsize=12,
        fontsize=12,
        frameon=False,
        edges=True,
        # save=True,  # save figure to file figures/paga_compare.pdf
    )
    
    if cell_type_label is not None and cell_type_label in adata.obs.keys() and origin_group is not None:
        device = "cuda" if torch.cuda.is_available() else "cpu"
        build_graph(adata, 
                    use_rep='X_diffmap', # The same as 'use_rep' in Scanpy. Choosing cell embeddings.
                    k=10,            # K for building a KNN graph.
                    device=device)
        
        build_trajectory(adata, 
                        use_groups=cell_type_label,       # cell labels used to infer trajectory
                        origin_group=origin_group, # set the root cell label of trajectory
                        use_community=None,          # If None, use cell labels to build cell community.
                        traj_shape='mdo_tree',       # Choose build-in tree shape trajectory inference method.
                        device=device) 

    return adata

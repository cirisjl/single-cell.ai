import scanpy as sc; 
sc.set_figure_params(color_map="viridis", frameon=False)

def umap_plot(adata, svd_solver='arpack', key_added="cluster2", color=['leiden','cluster2']):
    sc.pp.scale(adata, max_value=10)

    # Principal component analysis
    sc.tl.pca(adata, svd_solver=svd_solver)
    
    # Computing the neighborhood graph
    sc.pp.neighbors(adata, n_neighbors=10, n_pcs=40)

    # Clustering the neighborhood graph
    sc.tl.umap(adata)
    sc.tl.leiden(adata)
    sc.tl.leiden(adata, resolution=0.5, key_added=key_added)
    sc.pl.umap(adata, color=color)

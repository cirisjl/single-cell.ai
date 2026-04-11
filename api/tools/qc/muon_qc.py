from muon import MuData
import muon as mu
import numpy as np
import pandas as pd
import scanpy as sc
import anndata as ad
import mudata as md
from umap import UMAP
from tools.formating.formating import *
from tools.annotation.annotation import *
from utils.redislogger import redislogger

def run_muon(input_path, output_path, md5, parameters, unique_id, process_id, mod1='rna', mod2='atac', min_genes=200, max_genes=8000, min_cells=3, pct_counts_mt=3, target_sum=1e4, n_top_genes=None, n_neighbors=10, n_pcs=20, resolution=.5, species='mouse'):
    layers = None
    mod_keys = None
    cell_metadata = None
    atac_cell_metadata = None
    obs_names = None
    nCells = 0
    nGenes = 0
    genes = None
    gene_metadata = None
    atac_gene_metadata = None
    embeddings = []
    umap = None
    atac_umap = None
    umap_3d = None
    atac_umap_3d = None
    top_genes = None
    info = None
    pp_results = None
    mdata_size = None
    description = 'muon QC' 
    obs = None
    uns = None
    obsp = None
    varm = None

    if max_genes == None:
        max_genes = 50000
    
    mdata = mu.read(input_path)

    redislogger.info(unique_id, "Check if mdata.var.index is gene symbols.")
    if is_ensembl(mdata.var_names[0]):
        redislogger.info(unique_id, "Convert Ensembl IDs to gene symbols.")
        if 'species' is not None:
            try:
                ensembl_ids = mdata.var.index.tolist()
                symbol_ids = ensembl_to_symbol(ensembl_ids, species=species)
                mdata.var['gene_symbols'] = symbol_ids
                mdata.var['ensembl_ids'] = ensembl_ids
                mdata.var = mdata.var.set_index('gene_symbols')
            except Exception as e:
                redislogger.warning(unique_id, f"An error occurred when converting Ensembl IDs to gene symbols, skipped: {e}")
        else:
            redislogger.warning(unique_id, "{species} is not supported by ensembl_to_symbol(), skipped.")

    mdata.var_names_make_unique()
    # MuData information
    redislogger.info(unique_id, mdata.__str__())
    info = mdata.__str__()

    mod_keys = list(mdata.mod.keys())
    
    # RNA
    rna = mdata.mod[mod1]

    if is_normalized(rna.X, min_genes) and not check_nonnegative_integers(rna.X):
        redislogger.info(unique_id, "rna.X is not raw counts.")
        if "raw_counts" in rna.layers.keys():
            redislogger.info(unique_id, "Use layer 'raw_counts' instead.")
            # rna.layers["normalized_X"] = rna.X.copy()
            rna.X = rna.layers['raw_counts'].copy()
        elif rna.raw is not None:
            redislogger.info(unique_id, "Use rna.raw.X instead.")
            # rna.layers["normalized_X"] = rna.X.copy()
            rna.X = rna.raw.X.copy()
        else:
            raise ValueError("muon QC only take raw counts, not normalized data.")

    redislogger.info(unique_id, "Check if rna.var.index is gene symbols.")
    if is_ensembl(rna.var_names[0]):
        redislogger.info(unique_id, "Convert Ensembl IDs to gene symbols.")
        if 'species' is not None:
            try:
                ensembl_ids = rna.var.index.tolist()
                symbol_ids = ensembl_to_symbol(ensembl_ids, species=species)
                rna.var['gene_symbols'] = symbol_ids
                rna.var['ensembl_ids'] = ensembl_ids
                rna.var = rna.var.set_index('gene_symbols')
            except Exception as e:
                redislogger.warning(unique_id, f"An error occurred when converting Ensembl IDs to gene symbols, skipped: {e}")
        else:
            redislogger.warning(unique_id, "{species} is not supported by ensembl_to_symbol(), skipped.")

    rna.var['mt'] = rna.var_names.str.startswith('MT-')  # annotate the group of mitochondrial genes as 'mt'
    sc.pp.calculate_qc_metrics(rna, qc_vars=['mt'], percent_top=None, log1p=False, inplace=True)

    # sc.pl.violin(rna, ['n_genes_by_counts', 'total_counts', 'pct_counts_mt'],
    #          jitter=0.4, multi_panel=True)

    redislogger.info(unique_id, f"Before: {rna.n_obs} cells")
    mu.pp.filter_obs(rna, 'n_genes_by_counts', lambda x: (x >= min_genes) & (x < max_genes))
    redislogger.info(unique_id, f"(After n_genes: {rna.n_obs} cells)")
    mu.pp.filter_obs(rna, 'total_counts', lambda x: x < 40000)
    redislogger.info(unique_id, f"(After total_counts: {rna.n_obs} cells)")
    mu.pp.filter_obs(rna, 'pct_counts_mt', lambda x: x < pct_counts_mt)
    redislogger.info(unique_id, f"After: {rna.n_obs} cells")

    # sc.pl.violin(rna, ['n_genes_by_counts', 'total_counts', 'pct_counts_mt'],
    #          jitter=0.4, multi_panel=True)

    # Normalisation
    rna.layers["raw_counts"] = rna.X.copy()
    sc.pp.normalize_total(rna, target_sum=target_sum)
    sc.pp.log1p(rna)
    # rna.raw = rna
    rna.layers["LogCP10K"] = rna.X.copy()

    # Feature selection
    sc.pp.highly_variable_genes(rna, min_mean=0.02, max_mean=4, min_disp=0.5)
    # sc.pl.highly_variable_genes(rna)
    redislogger.info(unique_id, f"Number of Highly Variable Genes: {np.sum(rna.var.highly_variable)}")

    # Scaling
    sc.pp.scale(rna, max_value=10)

    # PCA & UMAP
    sc.tl.pca(rna, svd_solver='arpack')
    sc.pp.neighbors(rna, n_neighbors=n_neighbors, n_pcs=n_pcs)
    sc.tl.leiden(rna, resolution=resolution)
    sc.tl.umap(rna, spread=1., min_dist=.5, random_state=11)
    # sc.pl.umap(rna, color="leiden", legend_loc="on data")
    umap_3d = UMAP(n_components=3, init='random', random_state=11)
    rna.obsm["X_umap_3D"] = umap_3d.fit_transform(rna.obsm['X_pca'])

    layers = list(rna.layers.keys())
    obs = regularise_df(rna.obs)
    obs_names = obs.columns.values.tolist()
    obs_dict = obs.to_dict('list') # Pandas dataframe
    obs_dict['index'] = obs.index.tolist()
    cell_metadata = gzip_dict(obs_dict)
    # cell_metadata = gzip_df(rna.obs) # pandas dataframe
    nCells = rna.n_obs # Number of cells
    nGenes = rna.n_vars # Number of genes

    if "highly_variable" in rna.var.keys():
        genes = gzip_list(rna.var[rna.var['highly_variable']==True].index.tolist())
        # gene_metadata = rna.var[rna.var['highly_variable']==True] # pandas dataframe
        var_dict = rna.var[rna.var['highly_variable']==True].to_dict('list') # Pandas dataframe
        var_dict['index'] = rna.var[rna.var['highly_variable']==True].index.tolist()
        gene_metadata = gzip_dict(var_dict)

    embedding_names = list(rna.obsm.keys()) # PCA, tSNE, UMAP
    uns = list(rna.uns.keys())
    obsp = list(rna.obsp.keys())
    varm = list(rna.varm.keys())
    for name in embedding_names:
        # embeddings.append({name: json_numpy.dumps(rna.obsm[name])})
        embeddings.append(name)
    
    if 'X_umap' in rna.obsm.keys():
        umap = json_numpy.dumps(rna.obsm['X_umap'])

    if 'X_umap_3D' in rna.obsm.keys():
        umap_3d = json_numpy.dumps(rna.obsm['X_umap_3D'])

    if nCells < 12000: # If the dataset is too large, then skip the highest expressed genes plot
            counts_top_genes, columns = highest_expr_genes(rna)
            top_genes = {"counts_top_genes": json_numpy.dumps(counts_top_genes), "columns": columns}

    # ATAC
    from muon import atac as ac

    atac = mdata.mod[mod2]
    if is_normalized(atac.X, min_genes) and not check_nonnegative_integers(atac.X):
        redislogger.info(unique_id, "atac.X is not raw counts.")
        if "raw_counts" in atac.layers.keys():
            redislogger.info(unique_id, "Use layer 'raw_counts' instead.")
            # atac.layers["normalized_X"] = atac.X.copy()
            atac.X = atac.layers['raw_counts'].copy()
        elif atac.raw is not None:
            redislogger.info(unique_id, "Use atac.raw.X instead.")
            # atac.layers["normalized_X"] = atac.X.copy()
            atac.X = atac.raw.X.copy()
        else:
            raise ValueError("muon QC only take raw counts, not normalized data.")
    
    # redislogger.info(unique_id, "Check if atac.var.index is gene symbols.")
    # if is_ensembl(atac.var_names[0]):
    #     redislogger.info(unique_id, "Convert Ensembl IDs to gene symbols.")
    #     if 'species' is not None:
    #         try:
    #             ensembl_ids = atac.var.index.tolist()
    #             symbol_ids = ensembl_to_symbol(ensembl_ids, species=species)
    #             atac.var['gene_symbols'] = symbol_ids
    #             atac.var['ensembl_ids'] = ensembl_ids
    #             atac.var = atac.var.set_index('gene_symbols')
    #         except Exception as e:
    #             redislogger.warning(unique_id, f"An error occurred when converting Ensembl IDs to gene symbols, skipped: {e}")
    #     else:
    #         redislogger.warning(unique_id, "{species} is not supported by ensembl_to_symbol(), skipped.")
            
    sc.pp.calculate_qc_metrics(atac, percent_top=None, log1p=False, inplace=True)
    # mu.pl.histogram(atac, ['n_genes_by_counts', 'total_counts'], linewidth=0)

    mu.pp.filter_var(atac, 'n_cells_by_counts', lambda x: x >= 10)
    
    redislogger.info(unique_id, f"Before: {atac.n_obs} cells")
    mu.pp.filter_obs(atac, 'total_counts', lambda x: (x >= 1000) & (x <= 80000))
    redislogger.info(unique_id, f"(After total_counts: {atac.n_obs} cells)")
    mu.pp.filter_obs(atac, 'n_genes_by_counts', lambda x: (x >= 100) & (x <= 30000))
    redislogger.info(unique_id, f"After: {atac.n_obs} cells")

    # mu.pl.histogram(atac, ['n_genes_by_counts', 'total_counts'], linewidth=0)

    # Normalisation
    atac.layers["counts"] = atac.X.copy()
    sc.pp.normalize_total(atac, target_sum=target_sum)
    sc.pp.log1p(atac)
    atac.layers["LogCP10K"] = atac.X.copy()

    # Define informative features
    sc.pp.highly_variable_genes(atac, min_mean=0.05, max_mean=1.5, min_disp=.5)
    # sc.pl.highly_variable_genes(atac)
    redislogger.info(unique_id, f"Number of Highly Variable Genes: {np.sum(atac.var.highly_variable)}")

    # Scaling and PCA
    sc.pp.scale(atac, max_value=10)
    sc.tl.pca(atac, svd_solver='arpack')
    # Finding cell neighbours and clustering cells
    sc.pp.neighbors(atac, n_neighbors=n_neighbors, n_pcs=n_pcs)
    sc.tl.leiden(atac, resolution=resolution)
    sc.tl.umap(atac, spread=1., min_dist=.5, random_state=11)
    # sc.pl.umap(atac, color="leiden", legend_loc="on data")
    atac_umap_3d = UMAP(n_components=3, init='random', random_state=11)
    atac.obsm["X_umap_3D"] = atac_umap_3d.fit_transform(atac.obsm['X_pca'])

    atac_obs = regularise_df(atac.obs)
    atac_obs_names = atac_obs.columns.values.tolist()
    atac_obs_dict = atac_obs.to_dict('list') # Pandas dataframe
    atac_obs_dict['index'] = atac_obs.index.tolist()
    atac_cell_metadata = gzip_dict(atac_obs_dict)

    if "highly_variable" in atac.var.keys():
        atac_genes = gzip_list(atac.var[atac.var['highly_variable']==True].index.tolist())
        # gene_metadata = atac.var[atac.var['highly_variable']==True] # pandas dataframe
        atac_var_dict = atac.var[atac.var['highly_variable']==True].to_dict('list') # Pandas dataframe
        atac_var_dict['index'] = atac.var[atac.var['highly_variable']==True].index.tolist()
        atac_gene_metadata = gzip_dict(atac_var_dict)

    if 'X_umap' in atac.obsm.keys():
        atac_umap = json_numpy.dumps(atac.obsm['X_umap'])

    if 'X_umap_3D' in atac.obsm.keys():
        atac_umap_3d = json_numpy.dumps(atac.obsm['X_umap_3D'])
    
    mdata.update()
    mu.pp.intersect_obs(mdata)
    mdata.write(output_path)

    if output_path is not None and os.path.exists(output_path):
        mdata_size = file_size(output_path)

    pp_results = {
            "process_id": process_id,
            "description": description,
            "md5": md5,
            "stage": 'Raw',
            "process": 'QC',
            "method": 'muon',
            "parameters": parameters,
            "info": info,
            "adata_path": output_path,
            "mdata_path": output_path,
            "mdata_size": mdata_size,
            "mod_keys": mod_keys,
            "layer": "X",
            "layers": layers,
            "obs_names": obs_names,
            "cell_metadata": cell_metadata,
            "gene_metadata": gene_metadata,
            "nCells": nCells,
            "nGenes": nGenes,
            "genes": genes,
            "embeddings": embeddings,
            "uns": uns,
            "obsp": obsp,
            "varm": varm,
            "umap": umap,
            "umap_3d": umap_3d,
            "atac_obs_names": atac_obs_names,
            "atac_cell_metadata": atac_cell_metadata,
            "atac_gene_metadata": atac_gene_metadata,
            "atac_umap": atac_umap,
            "atac_umap_3d": atac_umap_3d,
            "highest_expr_genes": top_genes
            }

    return mdata, pp_results
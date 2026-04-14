import scanpy as sc
import os
import math
import hashlib
import sys
import subprocess
import numpy as np
import pandas as pd
from detect_delimiter import detect
import scipy.sparse as sp_sparse
from scipy.sparse import csr_matrix, issparse
import scipy.cluster
from string import ascii_letters
import csv
import gzip
import logging
import h5py
import jax
import jax.numpy as jnp
from collections import OrderedDict
from anndata import AnnData
from tools.visualization.plot import highest_expr_genes
import rpy2.robjects as ro
from rpy2.robjects.packages import importr
from rpy2.robjects import pandas2ri
from rpy2.robjects.conversion import localconverter
from tools.evaluation.clustering import clustering_metrics
from tools.utils.gzip_str import *
from rpy2.robjects import r, StrVector, NULL
from typing import Any, List, Optional, Union
from attrdict import AttrDict
import json_numpy
import json
import re
from tools.formating.zarr_utils import optimize_adata
import importlib.metadata


# Ensure that pandas2ri is activated for automatic conversion
# pandas2ri.activate()

# Defining the R script and loading the instance in Python
ro.r['source'](os.path.abspath(os.path.join(os.path.dirname(__file__), 'formating.R')))

try:
    from anndata._core.sparse_dataset import SparseDataset
except ImportError:
    # anndata >= 0.10.0
    from anndata._core.sparse_dataset import (
        BaseCompressedSparseDataset as SparseDataset,
    )


def load_anndata(path, annotation_path=None, dataset=None, assay='RNA', show_error=True, replace_invalid=False, isDashboard=False, raw=False): # assay is optional and only for Seurat object
    # path = os.path.abspath(path)
    adata = None
    # print(path)

    # if (os.path.isdir(path) and os.path.exists(os.path.join(path, "matrix.mtx")) and os.path.exists(
    #         os.path.join(path, "genes.tsv")) and os.path.exists(os.path.join(path, "barcodes.tsv"))) 
    #         or (os.path.isdir(path) and os.path.exists(os.path.join(path, "matrix.mtx.gz")) and os.path.exists(
    #         os.path.join(path, "genes.tsv.gz")) and os.path.exists(os.path.join(path, "barcodes.tsv.gz"))):
    if (os.path.isdir(path)):
        adata = sc.read_10x_mtx(path,
                             var_names='gene_symbols',  # use gene symbols for the variable names (variables-axis index)
                             cache=True)  # write a cache file for faster subsequent reading
    elif(os.path.exists(path)):
        # suffix = os.path.splitext(path)[-1]
        if path.endswith(".h5ad"):
            adata = sc.read_h5ad(path)
        elif path.endswith(".csv") or path.endswith(".tsv"):
            # print("Inside the loadAnndata CSV")
            print(detect_delimiter(path))
            # print("Inside the loadAnndata CSV 2")
            adata = sc.read_csv(path, delimiter=detect_delimiter(path))
            if annotation_path is not None:
                df_ann = pd.read_csv(annotation_path)
                df_ann = df_ann.set_index('cell', drop=False)
                adata.var = adata.var.join(df_ann)
            # print("Inside the loadAnndata CSV 3")
        elif path.endswith(".csv.gz") or path.endswith(".tsv.gz"):
            adata = sc.read_csv(path)
        elif path.endswith(".xlsx") or path.endswith(".xls"):
            adata = sc.read_excel(path, 0)
        # elif suffix == ".h5" and "pbmc" in path:
            # adata = sc.read_10x_h5(path)
        elif path.endswith(".h5"):
            try:
                adata = sc.read_10x_h5(path)
            except Exception as e:
                print(e)
                adata = sc.read_hdf(path, key=dataset)
        elif path.endswith(".loom"):
            adata = sc.read_loom(path)
        elif path.endswith(".mtx"):
            adata = sc.read_mtx(path)
        elif path.endswith(".txt") or path.endswith(".tab") or path.endswith(".data"):
            if replace_invalid:
                delimiter = detect_delimiter(path)
                adata = read_text_replace_invalid(path, delimiter)
            else:
                adata = sc.read_text(path, delimiter=detect_delim(path))
        elif path.endswith(".txt.gz"):
            if replace_invalid:
                adata = read_text_replace_invalid(path, "/t")
            else:
                adata = sc.read_text(path)
        elif path.endswith(".gz"):
            adata = sc.read_umi_tools(path)
        elif path.endswith(".h5Seurat") or path.endswith(".h5seurat") or path.endswith(".rds") or path.endswith(".Robj"):
            adata_path, assay_names, default_assay = convert_seurat_sce_to_anndata(path, assay=assay)
            if os.path.exists(adata_path):
                adata = sc.read_h5ad(adata_path)
        elif path.endswith(".h5mu"):
            import muon
            mdata = muon.read_h5mu(path)
            adata = None
            for key in mdata.mod.keys():
                if "rna" in key or "RNA" in key:
                    adata = mdata[key]

    # If adata.X is empty, then try to use adata.layers['counts'] or adata.layers['raw_counts']
    if adata.X is None and "counts" in adata.layers.keys():
        adata.X = adata.layers['counts'].copy()
    elif adata.X is None and "raw_counts" in adata.layers.keys():
        adata.X = adata.layers['raw_counts'].copy()
        
    if adata is not None: 
        adata.obs = rename_col(adata.obs, 'n_counts')

    if raw and is_normalized(adata.X, 200) and not check_nonnegative_integers(adata.X):
        if "raw_counts" in adata.layers.keys():
            adata.layers["X_normalized"] = adata.X.copy()
            adata.X = adata.layers['raw_counts'].copy()
        elif "counts" in adata.layers.keys():
            adata.layers["X_normalized"] = adata.X.copy()
            adata.X = adata.layers['counts'].copy()
        elif adata.raw is not None:
            adata.layers["X_normalized"] = adata.X.copy()
            adata.X = adata.raw.X.copy()
        else:
            raise ValueError("No raw counts is found.")

    # if np.isnan(adata.X.data).any() or np.isinf(adata.X.data).any():
    #     # Handle NaNs/Infinities, e.g., replace with 0 or a small value, or remove affected genes/cells
    #     # Example: Replacing NaNs with 0 (use with caution based on your data)
    #     adata.X[np.isnan(adata.X)] = 0
    #     adata.X[np.isinf(adata.X)] = 0

    return adata


def change_file_extension(file_path, new_extension):
    # Check if the path is a directory
    if os.path.isdir(file_path):
        # If it's a directory, specify a default filename 'Anndata' with the new extension
        new_file_path = os.path.join(file_path, f"Anndata.{new_extension}")
    else:
        # If it's a file, proceed with changing the file's extension
        directory, base_filename = os.path.split(file_path)
        name, _ = os.path.splitext(base_filename)
        new_file_path = os.path.join(directory, f"{name}.{new_extension}").replace(" ", "_")

    return new_file_path


def convert_to_seurat_sce(input, output, format):
    import rpy2.rinterface_lib.callbacks as rcb
    import rpy2.robjects as ro
    ro.r['source'](os.path.abspath(os.path.join(os.path.dirname(__file__), 'formating.R')))

    if format == "Seurat":
        ConvertToSeurat_r = ro.globalenv['ConvertToSeurat']
        ConvertToSeurat_r(input, output)

    elif format == "SingleCellExperiment":
        ConvertToSCE_r = ro.globalenv['ConvertToSCE']
        ConvertToSCE_r(input, output)
    
    return output


def get_metadata_from_seurat(path):
    import rpy2.rinterface_lib.callbacks as rcb
    import rpy2.robjects as ro
    import anndata2ri
    from rpy2.robjects.packages import importr
    from rpy2.robjects import pandas2ri
    from rpy2.robjects.conversion import localconverter

    rcb.logger.setLevel(logging.ERROR)
    # ro.pandas2ri.activate()
    # anndata2ri.activate()

    # Defining the R script and loading the instance in Python
    ro.r['source'](os.path.abspath(os.path.join(os.path.dirname(__file__), 'formating.R')))
    GetMetadataFromSeurat_r = ro.globalenv['GetMetadataFromSeurat']
    default_assay = None
    assay_names = None
    metadata = None
    nCells = 0
    nGenes = 0
    genes = None
    cells = None
    HVGsID = None
    pca = None
    tsne = None
    umap = None
    info = None

    try:
        results = list(GetMetadataFromSeurat_r(path))
        default_assay = list(results[0])[0]
        assay_names = list(results[1])
        nCells = list(results[3])[0]
        nGenes = list(results[4])[0]
        genes  = list(results[5])
        cells = list(results[6])
        if results[7] != ro.rinterface.NULL:
            HVGsID = list(results[7])

        with localconverter(ro.default_converter + pandas2ri.converter):
            if results[2] != ro.rinterface.NULL: 
                metadata = ro.conversion.rpy2py(results[2])
            if results[8] != ro.rinterface.NULL:
                pca = ro.conversion.rpy2py(results[8])
            if results[9] != ro.rinterface.NULL:
                tsne = ro.conversion.rpy2py(results[9])
            if results[10] != ro.rinterface.NULL:
                umap = ro.conversion.rpy2py(results[10])

        info = convert_from_r(results[11])

        # print(convert_from_r(results))
        # print(default_assay)
        # print(assay_names)

    except Exception as e:
        print("Error in get_metadata_from_seurat: ", e)

    return info, default_assay, assay_names, metadata, nCells, nGenes, genes, cells, HVGsID, pca, tsne, umap


def arr_to_list(arr:np.ndarray):
    arr_list = []
    for i in range(len(arr[0])):
        arr_list.append(arr[:, i].tolist())
    return arr_list


# def df_to_dict(df:pd.DataFrame):
#     df_dict = {}
#     df_columns = df.columns.values.tolist()
#     df_index = df.index.values.tolist()
#     df_dict['columns'] = df_columns
#     df_dict['index'] = df_index
    
#     for name in df_columns:
#         df_dict[name] = df[name].tolist()
        
#     return df_dict


def get_cell_metadata(adata, adata_path=None):
    cell_metadata = None
    obs_names = None
    nCells = 0
    nGenes = 0
    layers = None
    info = None
    adata_size = None
    cell_metadata_head = None
    embeddings = []
    uns = None
    obsp = None
    varm = None

    if adata_path is not None and os.path.exists(adata_path):
        adata_size = file_size(adata_path)
    
    if adata is not None and isinstance(adata, AnnData):
        info = adata.__str__()
        layers = list(adata.layers.keys())
        obs = regularise_df(adata.obs)
        obs_names = obs.columns.values.tolist()
        nCells = adata.n_obs # Number of cells
        nGenes = adata.n_vars # Number of genes
        cell_metadata = df_to_dict(obs)
        cell_metadata_head = obs.dropna().head().to_dict()
        embedding_names = list(adata.obsm.keys()) # PCA, tSNE, UMAP
        uns = list(adata.uns.keys())
        obsp = list(adata.obsp.keys())
        varm = list(adata.varm.keys())
        for name in embedding_names:
            # embeddings.append({name: json_numpy.dumps(adata.obsm[name])})
            embeddings.append(name)
    
    return cell_metadata, cell_metadata_head, obs_names, nCells, nGenes, layers, info, adata_size, embeddings, uns, obsp, varm


def get_metadata_from_anndata(adata, pp_stage, process_id, process, method, parameters, md5, layer=None, use_rep=None, adata_path=None, seurat_path=None, sce_path=None, cluster_label=None, description=None, cluster_colname='leiden', n_top_genes=2000, zarr_path=None, initialFeatureFilterPath="var/highly_variable", obsEmbedding="obsm/X_umap", obsSets=None, ground_truth=None, label_columns=['celltypist_label', 'celltypist_ref_label', 'SingleR_main', 'SingleR_fine', 'SingleR_user_ref', 'scANVI_predicted'], score_columns=['celltypist_score', 'celltypist_ref_score', 'scANVI_transfer_score']): 
    layers = None
    cell_metadata = None
    obs_names = None
    nCells = 0
    nGenes = 0
    genes = None
    gene_metadata = None
    embeddings = []
    umap = None
    tsne = None
    umap_3d = None
    tsne_3d = None
    # violin_plot = None
    # scatter_plot = None
    # highest_expr_genes_plot = None
    top_genes = None
    info = None
    pp_results = None
    adata_size = None
    seurat_size = None
    sce_size = None
    evaluation_results = []
    asw_score_leiden = None
    nmi_score_leiden = None
    ari_score_leiden = None
    asw_score_louvain = None
    nmi_score_louvain = None
    ari_score_louvain = None
    labels_pred_leiden = None
    labels_pred_louvain = None
    cluster_embedding = None
    if description is None:
        description = f"{', '.join(method) if isinstance(method, list) else method} {process}" 
    min_genes = None
    target_sum = None
    obs = None
    uns = None
    obsp = None
    varm = None
    vitessce_config = None
    unique_cell_labels = []
    annotation_panel = None
    outlier_panel = None
    
    if obsSets is None:
        obsSets = []

    if adata_path is not None and os.path.exists(adata_path):
        adata_size = file_size(adata_path)
    if seurat_path is not None and os.path.exists(seurat_path):
        seurat_size = file_size(seurat_path)
    if sce_path is not None and os.path.exists(sce_path):
        sce_size = file_size(sce_path)

    if adata is not None and isinstance(adata, AnnData):
        if use_rep is not None and f'{use_rep}_leiden' in adata.obs.keys():
            cluster_colname = f'{use_rep}_leiden'
            if f'{use_rep}_leiden' in adata.obs.keys() and f'{use_rep}_umap' in adata.obsm.keys():
                labels_pred_leiden = adata.obs[f'{use_rep}_leiden']
            if f'{use_rep}_louvain' in adata.obs.keys() and f'{use_rep}_umap' in adata.obsm.keys():
                labels_pred_louvain = adata.obs[f'{use_rep}_louvain']
                cluster_embedding = adata.obsm[f'{use_rep}_umap']
                obsEmbedding = f'obsm/{use_rep}_umap'
        elif layer is None:
            layer = "X"
            if 'leiden' in adata.obs.keys(): 
                obsSets.append({"name":"Cluster", "path":"obs/leiden"})
            if cluster_label is not None and cluster_label in adata.obs.keys():
                cluster_label = adata.obs[cluster_label]
                if 'leiden' in adata.obs.keys() and f'{layer}_umap' in adata.obsm.keys():
                    labels_pred_leiden = adata.obs['leiden']
                if 'louvain' in adata.obs.keys() and f'{layer}_umap' in adata.obsm.keys():
                    labels_pred_louvain = adata.obs['louvain']
                cluster_embedding = adata.obsm[f'{layer}_umap']
            if 'X_umap' in adata.obsm.keys():
                obsEmbedding = 'obsm/X_umap'
        else:
            cluster_colname = f'{layer}_leiden'
            if f'{layer}_leiden' in adata.obs.keys():
                obsSets.append({"name":"Cluster", "path":f"obs/{layer}_leiden"})
            if cluster_label is not None and cluster_label in adata.obs.keys():
                cluster_label = adata.obs[cluster_label]
                if f'{layer}_leiden' in adata.obs.keys() and f'{layer}_umap' in adata.obsm.keys():
                    labels_pred_leiden = adata.obs[f'{layer}_leiden']
                if f'{layer}_louvain' in adata.obs.keys() and f'{layer}_umap' in adata.obsm.keys():
                    labels_pred_louvain = adata.obs[f'{layer}_louvain']
                cluster_embedding = adata.obsm[f'{layer}_umap']
            if f'{layer}_umap' in adata.obsm.keys():
                obsEmbedding = f'obsm/{layer}_umap'

        # Retrieve unique cell type labels
        try:
            with open('/usr/src/app/storage/uniqueCellLabels.json', 'r', encoding='utf-8') as file:
                unique_cell_labels = json.load(file)
        except FileNotFoundError:
            print("The specified JSON file was not found.")
        except json.JSONDecodeError:
            print("Error decoding JSON. Ensure the file contains a valid list.")
        # Add cell type annotations to obsSets
        if len(unique_cell_labels) > 0:
            for label in unique_cell_labels:
                if label in adata.obs.columns:
                    obsSets.append({"name": label, "path": f"obs/{label}"})

        # if('cluster.ids' in adata.obs.keys()):
        #     cluster_colname = 'cluster.ids'
                
        info = adata.__str__()
        layers = list(adata.layers.keys())
        obs = regularise_df(adata.obs)
        obs_names = obs.columns.values.tolist()
        obs_dict = obs.to_dict('list') # Pandas dataframe
        obs_dict['index'] = obs.index.tolist()
        cell_metadata = gzip_dict(obs_dict)
        # cell_metadata = gzip_df(adata.obs) # pandas dataframe
        nCells = adata.n_obs # Number of cells
        nGenes = adata.n_vars # Number of genes
        if "highly_variable" in adata.var.keys():
            genes = gzip_list(adata.var[adata.var['highly_variable']==True].index.tolist())
            # gene_metadata = adata.var[adata.var['highly_variable']==True] # pandas dataframe
            var_dict = adata.var[adata.var['highly_variable']==True].to_dict('list') # Pandas dataframe
            var_dict['index'] = adata.var[adata.var['highly_variable']==True].index.tolist()
            gene_metadata = gzip_dict(var_dict)
            initialFeatureFilterPath = "var/highly_variable"
        elif "vst.variable" in adata.var.keys():
            genes = gzip_list(adata.var[adata.var['vst.variable']==True].index.tolist())
            # gene_metadata = adata.var[adata.var['vst.variable']==True] # pandas dataframe
            var_dict = adata.var[adata.var['vst.variable']==True].to_dict('list') # Pandas dataframe
            var_dict['index'] = adata.var[adata.var['vst.variable']==True].index.tolist()
            gene_metadata = gzip_dict(var_dict)
            initialFeatureFilterPath = "var/vst.variable"
        elif nGenes > n_top_genes:
            # If highly variable does not exist, then create it.
            if is_normalized(adata.X) and not check_nonnegative_integers(adata.X):
                # sc.pp.log1p(adata)
                sc.pp.highly_variable_genes(adata, n_top_genes=n_top_genes)
            else:
                adata.layers['raw_counts'] = adata.X.copy() # Keep a copy of the raw counts
                sc.pp.normalize_total(adata, target_sum=target_sum)
                sc.pp.log1p(adata)
                sc.pp.highly_variable_genes(adata, n_top_genes=n_top_genes)
                adata.X = adata.layers['raw_counts'].copy() # Restore the raw counts

            genes = gzip_list(adata.var[adata.var['highly_variable']==True].index.tolist())
            # gene_metadata = adata.var[adata.var['highly_variable']==True] # pandas dataframe
            var_dict = adata.var[adata.var['highly_variable']==True].to_dict('list') # Pandas dataframe
            var_dict['index'] = adata.var[adata.var['highly_variable']==True].index.tolist()
            gene_metadata = gzip_dict(var_dict)
            initialFeatureFilterPath = "var/highly_variable"
        else:
            genes = gzip_list(adata.var.index.tolist())
            # gene_metadata = adata.var[adata.var['highly_variable']==True] # pandas dataframe
            var_dict = adata.var.to_dict('list') # Pandas dataframe
            var_dict['index'] = adata.var.index.tolist()
            gene_metadata = gzip_dict(var_dict)

            # genes = gzip_list(adata.var_names.to_list()) # Gene IDs
            # # gene_metadata = adata.var # pandas dataframe
            # var_dict = adata.var.to_dict('list') # Pandas dataframe
            # var_dict['index'] = adata.var.index.tolist()
            # gene_metadata = gzip_dict(var_dict)

        embedding_names = list(adata.obsm.keys()) # PCA, tSNE, UMAP
        uns = list(adata.uns.keys())
        obsp = list(adata.obsp.keys())
        varm = list(adata.varm.keys())
        for name in embedding_names:
            # embeddings.append({name: json_numpy.dumps(adata.obsm[name])})
            embeddings.append(name)
        
        if layer != 'Pearson_residuals': # Normalize Pearson_residuals may create NaN values, which could not work with PCA
            if layer is None: 
                layer = "X"
            if f'{layer}_umap' in adata.obsm.keys() and cluster_colname in adata.obs.keys():
                umap = json_numpy.dumps(adata.obsm[f'{layer}_umap'])
                # umap_plot = plot_UMAP(adata, layer=layer, clustering_plot_type=cluster_colname)
            elif f'{layer}_umap' in adata.obsm.keys():
                umap = json_numpy.dumps(adata.obsm[f'{layer}_umap'])
                # umap_plot = plot_UMAP(adata, layer=layer)
            
            if f'{layer}_umap_3D' in adata.obsm.keys() and cluster_colname in adata.obs.keys():
                umap_3d = json_numpy.dumps(adata.obsm[f'{layer}_umap_3D'])
                # umap_plot_3d = plot_UMAP(adata, layer=layer, clustering_plot_type=cluster_colname, n_dim=3)
            elif f'{layer}_umap_3D' in adata.obsm.keys():
                umap_3d = json_numpy.dumps(adata.obsm[f'{layer}_umap_3D'])
                # umap_plot_3d = plot_UMAP(adata, layer=layer, n_dim=3)

            if f'{layer}_tsne' in adata.obsm.keys():
                tsne = json_numpy.dumps(adata.obsm[f'{layer}_tsne'])
            
            if f'{layer}_tsne_3D' in adata.obsm.keys():
                tsne_3d = json_numpy.dumps(adata.obsm[f'{layer}_tsne_3D'])

        if process == 'QC':
            # violin_plot = gzip_str(plot_violin(adata))
            # scatter_plot = gzip_str(plot_scatter(adata))
            # violin_plot = plot_violin(adata)
            # scatter_plot = plot_scatter(adata)
            if nCells < 12000: # If the dataset is too large, then skip the highest expressed genes plot
                counts_top_genes, columns = highest_expr_genes(adata)
                top_genes = {"counts_top_genes": json_numpy.dumps(counts_top_genes), "columns": columns}
            try:
                outlier_panel = create_outlier_panel(adata.obs, cluster_id=cluster_colname)
            except Exception as e:
                print(f"Error creating outlier panel: {e}")
                outlier_panel = None

        if cluster_label is not None:
            if labels_pred_leiden is not None:
                asw_score_leiden, nmi_score_leiden, ari_score_leiden = clustering_metrics(cluster_label, labels_pred_leiden, cluster_embedding)
                evaluation_results.append(
                    {
                        "leiden": {
                            "asw_score": asw_score_leiden,
                            "nmi_score": nmi_score_leiden,
                            "ari_score": ari_score_leiden
                        }
                    }
                )
            if labels_pred_louvain is not None:
                asw_score_louvain, nmi_score_louvain, ari_score_louvain = clustering_metrics(cluster_label, labels_pred_louvain, cluster_embedding)
                evaluation_results.append(
                    {
                        "louvain": {
                            "asw_score": asw_score_louvain,
                            "nmi_score": nmi_score_louvain,
                            "ari_score": ari_score_louvain
                        }
                    }
                )
            evaluation_results = {
                "leiden": {
                    "asw_score": asw_score_leiden,
                    "nmi_score": nmi_score_leiden,
                    "ari_score": ari_score_leiden
                },
                "louvain": {
                    "asw_score": asw_score_louvain,
                    "nmi_score": nmi_score_louvain,
                    "ari_score": ari_score_louvain
                }
            }

        if zarr_path is None:
            initialFeatureFilterPath = None
            obsEmbedding = None
            obsSets = None
        if process != 'QC':
            # Add annotation panels for cell type labels
            annotation_panel = create_annotation_panel(adata.obs, cluster_id=cluster_colname, ground_truth=ground_truth, label_columns=label_columns, score_columns=score_columns)

        tools = get_tools()

        pp_results = {
            "process_id": process_id,
            "description": description,
            "md5": md5,
            "stage": pp_stage,
            "process": process,
            "method": method,
            "parameters": parameters,
            "info": info,
            "adata_path": adata_path,
            "seurat_path": seurat_path,
            "sce_path": sce_path,
            "adata_size": adata_size,
            "seurat_size": seurat_size,
            "sce_size": sce_size,
            "layer": layer,
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
            "tsne": tsne,
            "tsne_3d": tsne_3d,
            "highest_expr_genes": top_genes,
            # "violin_plot": violin_plot,
            # "scatter_plot": scatter_plot,
            # "highest_expr_genes_plot": highest_expr_genes_plot,
            "evaluation_results": evaluation_results,
            # "vitessce_config": vitessce_config,
            "zarr_path": zarr_path,
            "initialFeatureFilterPath": initialFeatureFilterPath,
            "obsEmbedding": obsEmbedding,
            "obsSets": obsSets,
            # "obs":cell_metadata
            "annotation_panel": annotation_panel,
            "outlier_panel": outlier_panel,
            "tools": tools
            }
        
    return pp_results


# def create_vitessce_config(process_id, description, zarr_url, initialFeatureFilterPath="var/highly_variable", obsEmbedding="obsm/X_umap", obsSets=[{name:"Cluster", path:"obs/leiden"}, ]):
#     return {
#         version: "1.0.17",
#         name: description,
#         description: description,
#         datasets: [
#             {
#                 uid: process_id,
#                 name: description,
#                 files: [
#                     {
#                         fileType: "anndata.zarr",
#                         url: zarr_url,
#                         coordinationValues: {
#                             embeddingType: "UMAP",
#                         },
#                         options: {
#                             obsFeatureMatrix: {
#                                 path: "X",
#                                 initialFeatureFilterPath: initialFeatureFilterPath,
#                             },
#                             obsEmbedding: {
#                                 path: obsEmbedding,
#                             },
#                             obsSets: obsSets,
#                         },
#                     },
#                 ],
#             },
#         ],
#         initStrategy: "auto",
#         coordinationSpace: {
#             embeddingType: {
#                 UMAP: "UMAP",
#             },
#             featureValueColormapRange: {
#                 A: [0, 0.35],
#             },
#         },
#         layout: [
#             {
#                 component: "obsSets",
#                 h: 4, w: 4, x: 4, y: 0,
#             },
#             {
#                 component: "obsSetSizes",
#                 h: 4, w: 4, x: 8, y: 0,
#             },
#             {
#                 component: "scatterplot",
#                 h: 4, w: 4, x: 0, y: 0,
#                 coordinationScopes: {
#                     embeddingType: "UMAP",
#                     featureValueColormapRange: "A",
#                 },
#             },
#             {
#                 component: "heatmap",
#                 h: 4, w: 8, x: 0, y: 4,
#                 coordinationScopes: {
#                     featureValueColormapRange: "A",
#                 },
#                 props: {
#                     transpose: true,
#                 },
#             },
#             {
#                 component: "featureList",
#                 h: 4, w: 4, x: 8, y: 4,
#             },
#         ],
#     }


def file_size(path): # MB
    return round(os.path.getsize(path)/(1024*1024), 2)


# Convert Seurat/Single-Cell Experiment object to Anndata object and return the path of Anndata object
def convert_seurat_sce_to_anndata(path, assay='RNA'):

    if assay is None:
        assay = 'RNA'
    
    # Convert Python string `assay` to an R-compatible string vector
    r_assay = StrVector([assay])


    # Access the loaded R functions
    ConvertSeuratSCEtoAnndata_r = ro.globalenv['ConvertSeuratSCEtoAnndata']

    assay_names = None
    adata_path = None
    default_assay = None

    if path.endswith(".h5Seurat") or path.endswith(".h5seurat") or path.endswith(".rds") or path.endswith(".Robj"):
        try:
            print("convert_seurat_sce_to_anndata")
            print(assay)
            results = list(ConvertSeuratSCEtoAnndata_r(path, assay=r_assay))
            print("run successful")
            print(results)
            if results[0] is not None and results[0] != ro.rinterface.NULL:
                default_assay = list(results[0])[0]
            else:
                default_assay = None  # or a sensible default like 'RNA'

            assay_names = list(results[1])
            adata_path = list(results[2])[0]  

        except Exception as e:
            print("Seurat/SCE to Anndata is failed")
            print(e)
    print("in formatting")
    print(adata_path)
    print(assay_names)
    print(default_assay)
    return adata_path, assay_names, default_assay


def anndata_to_csv(adata, output_path, layer=None, compress=False):
    counts = None

    if layer is None:
        if type(adata.X) != np.ndarray:
            counts = adata.X.toarray()
        else:
            counts = adata.X
    else:
        if type(adata.layers[layer]) != np.ndarray:
            counts = adata.layers[layer].toarray()
        else:
            counts = adata.layers[layer]

    pd.DataFrame(data=counts, index=adata.obs_names, columns=adata.var_names).to_csv(output_path)
    return output_path


def load_anndata_to_csv(input, csv_path, layer=None, show_error=True, dataset=None, compress=False):
    adata = None
    counts = None

    try:
        adata = load_anndata(input, dataset)
        print(adata)
        adata_path = input
    except Exception as e:
        print("File format is not supported.")
        if show_error: print(e)
        return None, None, None

    if layer is None:
        counts = adata.X
    elif layer in adata.layers.keys():
        counts = adata.layers[layer]       
    else:
        print("Layer is not found in AnnData object.")
        return None, None, None

    csv_path = anndata_to_csv(adata, csv_path, layer=layer, compress=compress)

    return adata, counts, csv_path


def detect_delim(path):
    # look at the first ten thousand bytes to guess the character encoding
    with open(path, 'rb') as file:
        rawdata = file.read(10000)
        rawdata = rawdata.decode('utf-8')
        delimiter = detect(rawdata, whitelist=[' ', ',', ';', ':', '|', '\t'])
        return delimiter


def detect_delimiter(file_path):
    with open(file_path, 'r') as file:
        # Read the first line of the file to detect the delimiter
        first_line = file.readline()
        dialect = csv.Sniffer().sniff(first_line)
        return dialect.delimiter


# def output_path_check(dataset, output, method = '', format = "AnnData"):
#     output = os.path.abspath(output)
#     if method != '': method = '_' + method
    
#     if not os.path.exists(os.path.dirname(output)):
#         os.makedirs(os.path.dirname(output))

#     if os.path.isdir(output) and format == "AnnData":
#         output = os.path.join(output, dataset + method + ".h5ad")
#         print("The output path is a directory, adding output file " + dataset + method + ".h5ad to the path.")
#     elif os.path.isdir(output) and format == "SingleCellExperiment":
#         output = os.path.join(output, dataset + method + ".rds")
#         print("The output path is a directory, adding output file " + dataset + method + ".rds to the path.")
#     elif os.path.isdir(output) and format == "Seurat":
#         output = os.path.join(output, dataset + method + ".h5Seurat")
#         print("The output path is a directory, adding output file " + dataset + method + ".h5Seurat to the path.")
#     elif os.path.isfile(output) and format == "AnnData" and os.path.splitext(output)[-1] != ".h5ad":
#         output.replace(os.path.splitext(output)[-1], method + ".h5ad")
#         print("The suffix is incorrect, changing it to '.h5ad'.")
    
#     return output


def get_output_path(path, process_id='', dataset=None, method='', format="AnnData", compress=False):
    output = os.path.abspath(path)
    method = f'_{method}' if method != '' else ''
    output_path = None
    base_name = os.path.basename(path)

    if not os.path.exists(output):
        os.makedirs(output)

    if os.path.isdir(output):
        if dataset is None:
            dataset = base_name
        if format == "AnnData":
            output_path = os.path.join(output, process_id, f'{dataset}_{method}.h5ad')
            print("The output path is a directory, adding output file " + dataset + method + ".h5ad to the path.")
        elif format == "MuData":
            output_path = os.path.join(output, process_id, f'{dataset}_{method}.h5mu')
            print("The output path is a directory, adding output file " + dataset + method + ".h5mu to the path.")
        elif format == "SingleCellExperiment":
            output_path = os.path.join(output, process_id, f'{dataset}_{method}.rds')
            print("The output path is a directory, adding output file " + dataset + method + ".rds to the path.")
        elif format == "Seurat":
            output_path = os.path.join(output, process_id, f'{dataset}_{method}.h5seurat')
            print("The output path is a directory, adding output file " + dataset + method + ".h5seurat to the path.")
        elif format == "CSV":
            if compress == True:
                output_path = os.path.join(output, process_id, f'{dataset}{method}.csv.gz')
                print("The output path is a directory, adding output file " + dataset + method + ".csv.gz to the path.")
            else:
                output_path = os.path.join(output, process_id, f'{dataset}_{method}.csv')
                print(f"The output path is a directory, adding output file {dataset}_{method}.csv to the path.")
    else:
        directory = os.path.dirname(output)
        if format == "AnnData":
            output_path = os.path.join(directory, process_id, base_name.replace(os.path.splitext(output)[-1], f"_{method}.h5ad"))
        elif format == "MuData":
            output_path = os.path.join(directory, process_id, base_name.replace(os.path.splitext(output)[-1], f"_{method}.h5mu"))
        elif format == "SingleCellExperiment":
            output_path = os.path.join(directory, process_id, base_name.replace(os.path.splitext(output)[-1], f"_{method}.rds"))
        elif format == "Seurat":
            output_path = os.path.join(directory, process_id, base_name.replace(os.path.splitext(output)[-1], f"_{method}.h5seurat"))
        elif format == "CSV":
            if compress == True:
                output_path = os.path.join(directory, process_id, base_name.replace(os.path.splitext(output)[-1], f"_{method}.csv.gz"))
            else:
                output_path = os.path.join(directory, process_id, base_name.replace(os.path.splitext(output)[-1], f"_{method}.csv"))

    if not os.path.exists(os.path.dirname(output_path)):
        os.makedirs(os.path.dirname(output_path))
    
    output_path = output_path.replace(" ", "_")
    output_path = output_path.replace("__", "_")
    print(output_path)

    return output_path


def get_report_path(dataset, output, method):
    output = os.path.abspath(output)
    method = f'_{method}' if method else ''
    report_path = None

    if not os.path.exists(os.path.dirname(output)):
        os.makedirs(os.path.dirname(output))

    report_path = output.replace(os.path.splitext(output)[-1], f"{method}_report.html")
    
    return report_path


def get_scvi_path(adata_path, task = None):
    if task is None:
        return os.path.join(os.path.dirname(os.path.abspath(adata_path)), '/scvi_model')
    else:
        return os.path.join(os.path.dirname(os.path.abspath(adata_path)), f'/{task}_model')


def list_py_to_r(list):
    list = [x.upper() for x in list if isinstance(x,str)]
    return 'c(' + ','.join(list) + ')'


def methods_list(list):
    list = [x.upper() for x in list if isinstance(x,str)]
    return ','.join(list)


def list_to_string(list):
    list = [x.upper() for x in list if isinstance(x, str)]
    return ','.join(list)


def list_to_string_default(list):
    list = [x for x in list if isinstance(x, str)]
    return ','.join(list)


def convert_gz_to_txt(gz_file_path, txt_file_path):
  with gzip.open(gz_file_path, 'rb') as f_in:
    with open(txt_file_path, 'w') as f_out:
      f_out.write(f_in.read().decode())


def read_text_replace_invalid(file_path, delimiter):
    if file_path.endswith(".gz"):
        file_name_without_extension = os.path.splitext(os.path.basename(file_path))[0]
        # Create the new file path with a .txt extension
        new_file_path = os.path.join(os.path.dirname(file_path), f"{file_name_without_extension}.txt")
        convert_gz_to_txt(file_path, new_file_path)
        df = pd.read_csv(new_file_path, sep="\t", on_bad_lines='skip', index_col=0)
    else:
        df = pd.read_csv(file_path, delimiter=delimiter, on_bad_lines='skip', index_col=0)
    
    df = df.apply(pd.to_numeric, errors='coerce')
    return sc.AnnData(df)


def read_text(file_path):
    if file_path.endswith(".gz"):
        
        file_name_without_extension = os.path.splitext(os.path.basename(file_path))[0]

        # Create the new file path with a .txt extension
        new_file_path = os.path.join(os.path.dirname(file_path), f"{file_name_without_extension}.txt")
        convert_gz_to_txt(file_path, new_file_path)

        df = pd.read_csv(new_file_path, sep="\t", on_bad_lines='skip', index_col=0)
        return sc.AnnData(df)
    else:
        delimiter = detect_delimiter(file_path)
        df = pd.read_csv(file_path, delimiter=delimiter, on_bad_lines='skip', index_col=0)
        return sc.AnnData(df)
    

def load_invalid_adata(file_path, replace_nan):
    if file_path.endswith(".gz"):
        file_name_without_extension = os.path.splitext(os.path.basename(file_path))[0]

        # Create the new file path with a .txt extension
        new_file_path = os.path.join(os.path.dirname(file_path), f"{file_name_without_extension}.txt")
        convert_gz_to_txt(file_path, new_file_path)
        df = pd.read_csv(new_file_path, sep="\t", on_bad_lines='skip', index_col=0)
    else:
        delimiter = detect_delimiter(file_path)
        df = pd.read_csv(file_path, delimiter=delimiter, on_bad_lines='skip', index_col=0)

    invalid_rows = df.apply(pd.to_numeric, errors='coerce').isnull().any(axis=1)
    invalid_columns = df.columns[df.apply(pd.to_numeric, errors='coerce').isnull().any()]
    invalid_df = df.loc[invalid_rows, invalid_columns]

    return sc.AnnData(invalid_df)


def is_normalized(expression_matrix, min_genes=200):
    if (not isinstance(expression_matrix, np.ndarray)):
        expression_matrix = expression_matrix.toarray()

    if np.min(expression_matrix) < 0 or np.max(expression_matrix) < min_genes:
        return True
    else:
        return False
        

def check_nonnegative_integers(
    data: Union[pd.DataFrame, np.ndarray, sp_sparse.spmatrix, h5py.Dataset],
    n_to_check: int = 20,
):
    """Approximately checks values of data to ensure it is count data."""
    # for backed anndata
    if isinstance(data, h5py.Dataset) or isinstance(data, SparseDataset):
        data = data[:100]

    if isinstance(data, np.ndarray):
        data = data
    elif issubclass(type(data), sp_sparse.spmatrix):
        data = data.data
    elif isinstance(data, pd.DataFrame):
        data = data.to_numpy()
    else:
        raise TypeError("data type not understood")

    ret = True
    if len(data) != 0:
        inds = np.random.choice(len(data), size=(n_to_check,))
        check = jax.device_put(data.flat[inds], device=jax.devices("cpu")[0])
        negative, non_integer = _is_not_count_val(check)
        ret = not (negative or non_integer)
    return ret


@jax.jit
def _is_not_count_val(data: jnp.ndarray):
    negative = jnp.any(data < 0)
    non_integer = jnp.any(data % 1 != 0)

    return negative, non_integer


def get_file_md5(path: str, split_num=256, get_byte=8):

    if not isinstance(split_num, int) or split_num <= 0:
        raise TypeError("split_num must be a positive none-zero integer!")
    if not isinstance(get_byte, int) or get_byte <= 0:
        raise TypeError("get_byte must be a positive none-zero integer!")
    if not os.path.exists(path):
        raise TypeError("%s does not exist!" % path)
    if os.path.isdir(path):
        raise TypeError("%s is a folder, while path should be a file!" % path)
    
    size = round(os.path.getsize(path), 2)
    # For a small file (equal to or less than 2M), caculate the MD5 values directly.
    if size < split_num * get_byte:
        # Read the file
        with open(path, 'rb') as f1:
            f1 = f1.read()
        cipher = hashlib.md5()
        cipher.update(str(split_num).encode('utf-8'))
        cipher.update(f1)
        cipher.update(str(get_byte).encode('utf-8'))
        return cipher.hexdigest()
    # For a large file, split the file in to several segment, and then sum the MD5 value. 
    mean_size = size // split_num
    cipher = hashlib.md5()
    # Position
    place = 0
    with open(path, 'rb') as f1:
        for i in range(split_num):
            f1.seek(place)
            res = f1.read(get_byte)
            cipher.update(res)
            place = place + mean_size

    return cipher.hexdigest()


def get_md5(path:str):
    md5 = []
    if not os.path.exists(path):
        raise TypeError(f"{path} does not exist!")
    if os.path.isdir(path):
        for file in os.listdir(path):
            md5.append(get_file_md5(path+file))
    else:
        md5.append(get_file_md5(path))
    return md5


def convert_df_dates_from_r(df: pd.DataFrame, date_cols: Optional[List[str]] = None) -> pd.DataFrame:
    """ convert given date columns into pandas datetime with UTC timezone
    Args:
        df (pd.DataFrame): The pandas datframe
        date_cols (list[str], optional): _description_. Defaults to None.
    Returns:
        pd.DataFrame: The dataframe with the converted
    """
    result = df.copy()
    if date_cols is not None:
        for col in (set(date_cols) & set(result.columns)):
            result[col] = pd.to_datetime(
                result[col], unit='D', origin='1970-1-1').dt.tz_localize('UTC')
    return result


def convert_to_r(item: Any) -> Any:
    """ cpnverts python object into rpy2 format
    Args:
        item (Any): native python object
    Returns:
        Any: rpy2 object
    """
    if item is None:
        return ro.r("NULL")
    elif isinstance(item, pd.DataFrame):
        with localconverter(ro.default_converter + pandas2ri.converter):
            result = ro.conversion.py2rpy(item)
        return result
    elif isinstance(item, np.ndarray):
        return ro.FloatVector(item)
    elif isinstance(item, (AttrDict, pd.Series)):
        return convert_to_r(dict(item))
    elif isinstance(item, dict):
        temp = {k: convert_to_r(v) for k, v in item.items()
                if v is not None}
        temp = {k: v for k, v in temp.items() if v is not None}
        return ro.ListVector(temp)
    elif isinstance(item, set):
        return convert_to_r(list(item))
    elif isinstance(item, (list, tuple, pd.Index)):
        if len(item) == 0:
            return None
        if isinstance(item[0], float):
            return ro.FloatVector(item)
        if isinstance(item[0], (int, np.int0)):
            return ro.IntVector(item)
        return ro.StrVector([str(i) for i in item])
    else:
        return item


def convert_from_r(item: Any, date_cols: Optional[List[str]] = None, name: str = '', reserve_plots: bool = True) -> Any:
    """convert rpy object into python native object
    Args:
        item (Any): rpy2 object to convert
        date_cols (list[str], optional): define the date colums in R dataframe , in order to conevrt them into pandas datetime. Defaults to None.
        name (str, optional): name of the object to convert, (not required for external use). Defaults to ''.
        reserve_plots (bool, optional): if True prserve rpy2 ListVector as rpy2 ListVector if name conatains plot,
                                        in order to be able to ouput ggplot plots. Defaults to True.
    Returns:
        Any: the converted item
    """
    result = item
    remove_list: bool = True
    if item == ro.vectors.NULL:
        return None
    elif 'plot' in name and isinstance(item, ro.vectors.ListVector) and reserve_plots:
        return item
    elif isinstance(item, (ro.environments.Environment,
                           ro.Formula)):
        return None
    elif isinstance(item, ro.vectors.DataFrame):
        with localconverter(ro.default_converter + pandas2ri.converter):
            result = ro.conversion.rpy2py(item)
        result = convert_df_dates_from_r(result, date_cols)
        remove_list = False
    elif isinstance(item, (ro.vectors.StrVector,
                           ro.vectors.FloatVector,
                           ro.vectors.BoolVector,
                           ro.vectors.IntVector)):
        result = tuple(item)
    elif isinstance(item, ro.vectors.ListVector):
        if item.names == ro.vectors.NULL:
            return None
        result = {}
        remove_list = False
        if len(item) > 0:
            result = dict(zip(item.names, list(item)))
            for k, v in result.items():
                result[k] = convert_from_r(v, date_cols, name=k)
    if '__len__' in result.__dir__() and len(result) == 1 and remove_list:
        result = result[0]
    return result


# def load_annData_dash(path, replace_invalid=False):
#     show_error=True
#     dataset = None
#     # path = os.path.abspath(path)
#     adata = None
    
#     if (os.path.isdir(path)):
#         adata = sc.read_10x_mtx(path,
#                              var_names='gene_symbols',  # use gene symbols for the variable names (variables-axis index)
#                              cache=True)  # write a cache file for faster subsequent reading
#     elif(os.path.exists(path)):
#         # suffix = os.path.splitext(path)[-1]
#         if path.endswith(".h5ad"):
#             adata = sc.read_h5ad(path)
#         elif path.endswith(".csv") or path.endswith(".tsv"):
#             # print("Inside the loadAnndata CSV")
#             print(detect_delimiter(path))
#             # print("Inside the loadAnndata CSV 2")
#             adata = sc.read_csv(path, delimiter=detect_delimiter(path))
#             # print("Inside the loadAnndata CSV 3")
#         elif path.endswith(".csv.gz") or path.endswith(".tsv.gz"):
#             data = sc.read_csv(path)
#         elif path.endswith(".xlsx") or path.endswith(".xls"):
#             adata = sc.read_excel(path, 0)
#         # elif suffix == ".h5" and "pbmc" in path:
#             # adata = sc.read_10x_h5(path)
#         elif path.endswith(".h5"):
#             try:
#                 adata = sc.read_10x_h5(path)
#             except Exception as e:
#                 print(e)
#                 adata = sc.read_hdf(path, key=dataset)
#         elif path.endswith(".loom"):
#             adata = sc.read_loom(path)
#         elif path.endswith(".mtx"):
#             adata = sc.read_mtx(path)
#         elif path.endswith(".txt") or path.endswith(".tab") or path.endswith(".data"):
#             delimiter = detect_delimiter(path)
#             if replace_invalid:
#                 adata = read_text_replace_invalid(path, delimiter)
#                 print(adata)
#                 print(adata.var_names[:10])
#                 print(adata.obs_names[:10])
#             else:
#                 adata = sc.read_text(path, delimiter=detect_delimiter(path))      
#         elif path.endswith(".txt.gz"):
#             if replace_invalid:
#                 adata = read_text_replace_invalid(path, "/t")
#             else:
#                 adata = sc.read_text(path)      
#         elif path.endswith(".gz"):
#             adata = sc.read_umi_tools(path)
#         elif path.endswith(".h5Seurat") or path.endswith(".h5seurat") or path.endswith(".rds"):
#             try:
#                 current_file = os.path.abspath(__file__)
#                 # Construct the relative path to the desired file
#                 relative_path = os.path.join(os.path.dirname(current_file), 'convert_to_anndata.Rmd')

#                 # Get the absolute path of the desired file
#                 operation_path = os.path.abspath(relative_path)
#                 report_path = os.path.join(os.path.dirname(path), "file_conversion_report.html")
#                 adata_path = os.path.splitext(path)[0] + '.h5ad'
                
#                 if os.path.exists(adata_path):
#                     adata = sc.read_h5ad(adata_path)
#                 else:
#                     s = subprocess.call(["R -e \"rmarkdown::render('" + operation_path + "', params=list(path='" + str(path) + "'), output_file='" + report_path + "')\""], shell = True)
#                     print(s)
#                     adata = sc.read_h5ad(adata_path)

#             except Exception as e:
#                 print("Object format conversion is failed")
#                 if show_error: print(e)

#     return adata

# Remove NA and single value columns
def regularise_df(df, drop_single_values=False):
    df = df.dropna(axis=1, how='all')
    res = df
    if drop_single_values == True:
        for col in df.columns:
            if len(df[col].unique()) == 1:
                res = res.drop(col,axis=1)
    return res


# Drop numerical columns for cell type annotation
def drop_num_col(df):
    col_to_drop = []

    for i, v in df.dtypes.items():
        if 'float' in str(v) or 'int' in str(v) or is_number(df[i][0]):
            col_to_drop.append(i)
    
    if len(col_to_drop) > 0:
        df = df.drop(columns=col_to_drop)
    
    return df


def rename_col(df, pattern):
    import re
    for name in df.columns.values:
        if re.match(pattern, name):
            df.rename(columns={name: pattern}, inplace=True)
            break
    return df


# Convert dataframe to dict for cell type selection
def df_to_dict(df):
    df_dict = {}
    # df = regularise_df(df)
    df = drop_num_col(df)
    for col in df.columns:
        col_dict = {}
        if len(df[col].unique()) < 500 and isinstance(df[col][0], str): # The known human cell types are less than 500
            col_dict[col] = [x for x in df[col].unique().tolist() if isinstance(x, str) or not math.isnan(x)]
            # col_dict[col] = df[col].unique().tolist()
            df_dict[col] = col_dict
    
    return df_dict


def is_number(s):
    try:
        float(s)
        return True
    except ValueError:
        pass
 
    try:
        import unicodedata
        unicodedata.numeric(s)
        return True
    except (TypeError, ValueError):
        pass
 
    return False


def make_unique(cols):
    import collections
    counts = collections.defaultdict(int)
    for i, col in enumerate(cols):
        counts[col] += 1
        if counts[col] > 1:
            cols[i] = f"{col}_{counts[col]-1}"
    return cols


def save_anndata(adata, output, zarr=False, n_hvg=50, layer=None, obsm_keys=None, obs_cols=None):
    # if np.isnan(adata.X.data).any() or np.isinf(adata.X.data).any():
    #     # Handle NaNs/Infinities, e.g., replace with 0 or a small value, or remove affected genes/cells
    #     # Example: Replacing NaNs with 0 (use with caution based on your data)
    #     adata.X[np.isnan(adata.X)] = 0
    #     adata.X[np.isinf(adata.X)] = 0
    
    # Convert to float64 to avoid potential issues with dgRMatrix

    adata.X = adata.X.astype(np.float64)
    # adata.obs.columns = make_unique(adata.obs.columns.tolist()) # Ensure unique column names in obs
    if len(adata.layers) > 0:
        for i in adata.layers.keys():
            adata.layers[i] = adata.layers[i].astype(np.float64)

    if not isinstance(adata.X, csr_matrix):
        adata.X = csr_matrix(adata.X)
    adata.write_h5ad(output, compression='gzip')

    zarr_output = None
    if zarr:
        zarr_output = save_zarr(adata, output, n_hvg=n_hvg, layer=layer, obsm_keys=obsm_keys, obs_cols=obs_cols)
    
    return output, zarr_output


def save_zarr(adata, adata_path, zarr_output=None, n_hvg=50, layer=None, min_genes=200, obsm_keys=None, obs_cols=None, label_columns=['celltypist_label', 'celltypist_ref_label', 'SingleR_main', 'SingleR_fine', 'SingleR_user_ref', 'scANVI_predicted']):
    if obsm_keys is None:
        obsm_keys = []
    if obs_cols is None:
        obs_cols = []
    if zarr_output is None:
        zarr_output = adata_path.replace('storage/', 'storage/zarr/').replace('.h5ad', '.zarr')
    unique_cell_labels = []
    # print("layer: " + str(layer))
    # print("obsm_keys: " + str(obsm_keys))
    # print("obs_cols: " + str(obs_cols))
    # print("adata.obs.columns: " + str(adata.obs.columns))
    adata = clean_anndata(adata)
    if layer is not None and f'{layer}_leiden' in adata.obs.columns:
        obs_cols.append(f'{layer}_leiden')
    elif 'leiden' in adata.obs.columns:
        obs_cols.append('leiden')

    if layer is not None and f'{layer}_umap' in adata.obsm.keys():
        obsm_keys.append(f'{layer}_umap')
    elif 'X_umap' in adata.obsm.keys():
        obsm_keys.append('X_umap')

    # Retrieve unique cell type labels
    try:
        with open('/usr/src/app/storage/uniqueCellLabels.json', 'r', encoding='utf-8') as file:
            unique_cell_labels = json.load(file)
    except FileNotFoundError:
        print("The specified JSON file was not found.")
    except json.JSONDecodeError:
        print("Error decoding JSON. Ensure the file contains a valid list.")
    # Add cell type annotations to obsSets
    if len(unique_cell_labels) > 0:
        for label in unique_cell_labels:
            if label in adata.obs.columns:
                obs_cols.append(label)
    
    # Add common cell type annotation columns to obsSets
    for label in label_columns:
        if label in adata.obs.columns:
            obs_cols.append(label)

    if not isinstance(adata.X, np.ndarray):
        adata.X = adata.X.toarray()

    if layer is not None and layer in adata.layers.keys():
        adata.X = adata.layers[layer]
        if not isinstance(adata.X, np.ndarray):
            adata.X = adata.X.toarray()
    if not is_normalized(adata.X, min_genes) or check_nonnegative_integers(adata.X):
        if "scale.data" in adata.layers.keys():
            adata.X = adata.layers["scale.data"]
        elif "normalized_X" in adata.layers.keys():
            adata.X = adata.layers["normalized_X"]
        else:
            # Perform normalization
            if not isinstance(adata.X, np.ndarray):
                adata.X = adata.X.toarray()
            # adata.X[np.isnan(adata.X)] = 0
            # adata.X[np.isinf(adata.X)] = 0
            if issparse(adata.X):
                adata.X.data[~np.isfinite(adata.X.data)] = 0
                adata.X.eliminate_zeros()
            else:
                adata.X[~np.isfinite(adata.X)] = 0
            sc.pp.normalize_total(adata, inplace=True)
            sc.pp.log1p(adata)

    if issparse(adata.X):
        adata.X.data[~np.isfinite(adata.X.data)] = 0
        adata.X.eliminate_zeros()
    else:
        adata.X[~np.isfinite(adata.X)] = 0
    try:
        sc.pp.highly_variable_genes(adata, flavor="seurat", n_top_genes=n_hvg)
    except Exception as e:
        print(f"Highly variable gene selection failed: {e}")
        print("Log1p normalize count matrix and try again...")
        sc.pp.log1p(adata)
        sc.pp.highly_variable_genes(adata, flavor="seurat", n_top_genes=n_hvg)
    # Get the highly variable gene matrix as a plain NumPy array
    X_hvg_arr = adata[:, adata.var['highly_variable']].X.toarray()
    X_hvg_index = adata[:, adata.var['highly_variable']].var.copy().index
    # Get the highly variable gene matrix as a plain NumPy array
    X_hvg_arr = adata[:, adata.var['highly_variable']].X.toarray()
    X_hvg_index = adata[:, adata.var['highly_variable']].var.copy().index

    # Perform average linkage hierarchical clustering on along the genes axis of the array
    Z = scipy.cluster.hierarchy.linkage(X_hvg_arr.T, method="average", optimal_ordering=True)

    # Get the hierarchy-based ordering of genes.
    num_genes = adata.var.shape[0]
    highly_var_index_ordering = scipy.cluster.hierarchy.leaves_list(Z)
    highly_var_genes = X_hvg_index.values[highly_var_index_ordering].tolist()

    all_genes = adata.var.index.values.tolist()
    not_var_genes = adata.var.loc[~adata.var['highly_variable']].index.values.tolist()

    def get_orig_index(gene_id):
        return all_genes.index(gene_id)
    var_index_ordering = list(map(get_orig_index, highly_var_genes)) + list(map(get_orig_index, not_var_genes))
    adata = adata[:, var_index_ordering].copy()
    adata.obsm['X_hvg'] = adata[:, adata.var['highly_variable']].X.copy()

    obsm_keys = list(set(obsm_keys))
    obs_cols = list(set(obs_cols))

    print(f"obsm_keys: {obsm_keys}")
    print(f"obs_cols: {obs_cols}")

    adata = optimize_adata(
        adata,
        obs_cols = obs_cols, # Add your "hue" columns here
        obsm_keys = obsm_keys,             # Add your UMAP key
    )

    obsm_keys = None # Clear obsm_keys after use
    obs_cols = None # Clear obs_cols after use

    # Write out to Zarr
    # Vitessce expects a specific hierarchy. This helper makes it compatible.
    try:
        adata.write_zarr(zarr_output)
    except Exception as e:
        print(f"Zarr output failed: {e}")
    # adata = None  # Free up memory
    
    return zarr_output


def clean_anndata(adata):
    # Scanpy
    # if 'outlier' in adata.obs.columns and 'mt_outlier' in adata.obs.columns:
    #     adata = adata[(~adata.obs.outlier) & (~adata.obs.mt_outlier)].copy()
    if 'outlier' in adata.obs.columns:
        adata = adata[(~adata.obs.outlier)].copy()
    if 'predicted_doublets' in adata.obs.columns:
        adata = adata[adata.obs.predicted_doublets=="False", :]

    # Bioconductor
    if 'discard' in adata.obs.columns:
        adata = adata[~adata.obs.discard, :]
    if 'discard' in adata.var.columns:
        adata = adata[:, ~adata.var.discard]

    # Seurat
    if 'doublet_class' in adata.obs.columns:
        adata = adata[adata.obs.doublet_class=="Singlet", :]

    if 'highly_variable' in adata.var.columns:
        adata = adata[:, adata.var.highly_variable]

    return adata


# Pseudo replicates
def create_pseudo_replicates(adata, batch_key, num):
    import random
    ads = []
    for sample in adata.obs[batch_key].unique():
        samp_cell_subset = adata[adata.obs[batch_key] == sample]

        if is_normalized(adata.X) and not check_nonnegative_integers(adata.X) and 'raw_counts' in adata.layers.keys():
            samp_cell_subset.X = samp_cell_subset.layers['raw_counts'] # Make sure to use raw data
        
        indices = list(samp_cell_subset.obs_names)
        random.shuffle(indices)
        indices = np.array_split(np.array(indices), num) # Change number here for number of replicates deisred
        
        for i, pseudo_rep in enumerate(indices):
        
            # rep_adata = sc.AnnData(X = samp_cell_subset[indices[i]].X.sum(axis = 0),
            #                        var = samp_cell_subset[indices[i]].var[[]])
            rep_adata = samp_cell_subset[samp_cell_subset.obs_names.isin(pseudo_rep)]
            rep_adata.obs['sample'] = f"{sample}_{i + 1}"
            # rep_adata.obs['condition'] = samp_cell_subset.obs['condition'].iloc[0]
            rep_adata.obs['replicate'] = i + 1

            ads.append(rep_adata)
    ad = sc.concat(ads)

    return ad


def reset_x_to_raw(adata, min_genes=200):
    if is_normalized(adata.X, min_genes) and not check_nonnegative_integers(adata.X):
        if "raw_counts" in adata.layers.keys():
            adata.layers["normalized_X"] = adata.X.copy()
            adata.X = adata.layers['raw_counts'].copy()
        elif adata.raw is not None:
            adata.layers["normalized_X"] = adata.X.copy()
            adata.X = adata.raw.X.copy()
        else:
            raise ValueError("Raw counts are not available.")
    
    return adata


# Remove duplicates by key in a list of dictionaries
def unique_by_key(data, key):
    seen = set()
    result = []
    for d in data:
        if d[key] not in seen:
            seen.add(d[key])
            result.append(d)
    return result


def create_annotation_prompt(adata, tissue, species, layer=None, use_rep=None, method="t-test", groupby="leiden", top=25,  task=None):
    preset_questions = []
    if layer is not None and layer in adata.layers.keys():
        sc.tl.rank_genes_groups(adata, groupby, layer=layer, method=method, use_raw=False)
        markers_df = sc.get.rank_genes_groups_df(adata, group=None, pval_cutoff=0.05)
        markers_df = markers_df.sort_values(['group', 'scores'], ascending=[True, False]) # View the top 100 for each cluster (sorted by group)
        # Create a wide-format DataFrame where columns are groups and rows are genes
        top_marker_df = pd.DataFrame(adata.uns['rank_genes_groups']['names']).head(top)

        # Convert the DataFrame to a dictionary
        marker_genes_dict = top_marker_df.to_dict(orient='list')
        prompt = f"Identify **cell types** of **{tissue}** cells from **{species}** using the following markers separately for each row. Some can be a mixture of multiple cell types.\n GeneList’:\n"
        for cluster, genes in marker_genes_dict.items():
            gene_list = ', '.join(genes)
            prompt += f"Cluster {cluster}: {gene_list}\n"
        prompt += "Provide the most likely cell type for each cluster based on these marker genes and show your reasoning."
        
        # Results
        if task is not None:
            preset_question = {
                "title": f"How do I interpret the results of the {task} task?", 
                "prompt": f"How do I interpret the results of the {task} task in single-cell sequencing data analysis?"
            }
            preset_questions.append(preset_question)

        # Cell types
        preset_question = {
            "title": f"What are the known **cell types** in **{tissue}** from **{species}**?", 
            "prompt": f"What is the estimated proportion of each cell type in {tissue} from {species}?"
        }
        preset_questions.append(preset_question)
        
        # Cell proportions
        preset_question = {
            "title": f"What is the estimated **proportion** of each **cell type** in **{tissue}** from **{species}**?", 
            "prompt": f"What is the estimated proportion of each cell type in {tissue} from {species}?"
        }
        preset_questions.append(preset_question)

        # Annotate clusters using marker genes
        preset_question = {
            "title": f"What **cell type** does each cluster most likely represent using layer: **{layer}**?", 
            "prompt": prompt
        }
        preset_questions.append(preset_question)     

    if use_rep is not None:
        if type(use_rep) is list:
            for rep in use_rep:
                if rep in adata.obsm.keys():
                    sc.tl.rank_genes_groups(adata, groupby, use_rep=rep, method=method, use_raw=False)
                    markers_df = sc.get.rank_genes_groups_df(adata, group=None, pval_cutoff=0.05)
                    markers_df = markers_df.sort_values(['group', 'scores'], ascending=[True, False]) # View the top 100 for each cluster (sorted by group)
                    # Create a wide-format DataFrame where columns are groups and rows are genes
                    top_marker_df = pd.DataFrame(adata.uns['rank_genes_groups']['names']).head(top)

                    # Convert the DataFrame to a dictionary
                    marker_genes_dict = top_marker_df.to_dict(orient='list')
                    prompt = f"Identify cell types of {tissue} cells from {species} using the following markers separately for each row. Some can be a mixture of multiple cell types.\n GeneList’:\n"
                    for cluster, genes in marker_genes_dict.items():
                        gene_list = ', '.join(genes)
                        prompt += f"Cluster {cluster}: {gene_list}\n"
                    prompt += "Provide the most likely cell type for each cluster based on these marker genes and show your reasoning."

                    preset_question = {
                        "title": f"What cell type does each cluster most likely represent using representation: {rep}?",
                        "prompt": prompt
                    }
                    preset_questions.append(preset_question)
        else:
            if use_rep in adata.obsm.keys():
                sc.tl.rank_genes_groups(adata, groupby, use_rep=use_rep, method=method, use_raw=False)
                markers_df = sc.get.rank_genes_groups_df(adata, group=None, pval_cutoff=0.05)
                markers_df = markers_df.sort_values(['group', 'scores'], ascending=[True, False]) # View the top 100 for each cluster (sorted by group)
                # Create a wide-format DataFrame where columns are groups and rows are genes
                top_marker_df = pd.DataFrame(adata.uns['rank_genes_groups']['names']).head(top)

                # Convert the DataFrame to a dictionary
                marker_genes_dict = top_marker_df.to_dict(orient='list')
                prompt = f"Identify cell types of {tissue} cells from {species} using the following markers separately for each row. Some can be a mixture of multiple cell types.\n GeneList’:\n"
                for cluster, genes in marker_genes_dict.items():
                    gene_list = ', '.join(genes)
                    prompt += f"Cluster {cluster}: {gene_list}\n"
                prompt += "Provide the most likely cell type for each cluster based on these marker genes and show your reasoning."

                preset_question = {
                    "title": f"What cell type does each cluster most likely represent using representation: {use_rep}?",
                    "prompt": prompt
                }
                preset_questions.append(preset_question)

    if layer is None and use_rep is None:
        sc.tl.rank_genes_groups(adata, groupby, method=method, use_raw=False)
        markers_df = sc.get.rank_genes_groups_df(adata, group=None, pval_cutoff=0.05)
        markers_df = markers_df.sort_values(['group', 'scores'], ascending=[True, False]) # View the top 100 for each cluster (sorted by group)
        # Create a wide-format DataFrame where columns are groups and rows are genes
        top_marker_df = pd.DataFrame(adata.uns['rank_genes_groups']['names']).head(top)

        # Convert the DataFrame to a dictionary
        marker_genes_dict = top_marker_df.to_dict(orient='list')
        prompt = f"Identify cell types of {tissue} cells from {species} using the following markers separately for each row. Some can be a mixture of multiple cell types.\n GeneList’:\n"
        for cluster, genes in marker_genes_dict.items():
            gene_list = ', '.join(genes)
            prompt += f"Cluster {cluster}: {gene_list}\n"
        prompt += "Provide the most likely cell type for each cluster based on these marker genes and show your reasoning."

        preset_question = {
            "title": "What cell type does each cluster most likely represent?",
            "prompt": prompt
        }
        preset_questions.append(preset_question)

    return preset_questions


def first_mode(x):
    m = x.mode()
    return m.iat[0] if len(m) else None


def add_majority_vote(
    df: pd.DataFrame,
    unknown_label: str | bool,
    tie_strategy: str = "first",   # "first" or "tie"
    tie_label: str = "Tie",
    return_counts: bool = False
) -> pd.DataFrame:
    """
    Add a majority_vote column to a dataframe by voting across each row.

    Parameters
    ----------
    df : pd.DataFrame
        Input dataframe containing label columns.
    unknown_label : str
        Label to use when a row has no non-null values.
    tie_strategy : str
        How to handle ties:
        - "first": return the first label after sorting by count desc, label asc
        - "tie": return tie_label if multiple labels share the top count
    tie_label : str
        Label used when tie_strategy == "tie" and a tie occurs.
    return_counts : bool
        If True, also add majority_count column.

    Returns
    -------
    pd.DataFrame
        Copy of input dataframe with majority_vote column added.
    """
    out = df.copy()
    obj = out.astype(object)

    stacked = obj.stack(dropna=True).reset_index()
    if stacked.empty:
        out["majority_vote"] = unknown_label
        if return_counts:
            out["majority_count"] = 0
        return out

    stacked.columns = ["row", "source", "label"]

    counts = (
        stacked.groupby(["row", "label"])
        .size()
        .reset_index(name="n")
    )

    max_counts = counts.groupby("row")["n"].max().rename("max_n").reset_index()
    top = counts.merge(max_counts, on="row")
    top = top[top["n"] == top["max_n"]].copy()

    if tie_strategy == "tie":
        tie_sizes = top.groupby("row").size().rename("n_winners").reset_index()
        top = top.merge(tie_sizes, on="row")

        winners = (
            top.sort_values(["row", "label"])
            .drop_duplicates("row")
            .set_index("row")
        )

        vote = winners["label"].where(winners["n_winners"] == 1, tie_label)
        out["majority_vote"] = out.index.to_series().map(vote).fillna(unknown_label)

    elif tie_strategy == "first":
        winners = (
            top.sort_values(["row", "label"])
            .drop_duplicates("row")
            .set_index("row")
        )
        out["majority_vote"] = out.index.to_series().map(winners["label"]).fillna(unknown_label)

    else:
        raise ValueError("tie_strategy must be either 'first' or 'tie'")

    if return_counts:
        count_map = max_counts.set_index("row")["max_n"]
        out["majority_count"] = out.index.to_series().map(count_map).fillna(0).astype(int)

    return out


def create_annotation_panel(obs, cluster_id='leiden', ground_truth=None, label_columns=['celltypist_label', 'celltypist_ref_label', 'SingleR_main', 'SingleR_fine', 'SingleR_user_ref', 'scANVI_predicted'], score_columns=['celltypist_score', 'celltypist_ref_score', 'scANVI_transfer_score']):
    unique_cell_labels = []
    obs_cols = []

    print(f"label columns: {label_columns}")
    print(f"score columns: {score_columns}")

    # Validate label and score columns
    for label_column in label_columns.copy():
        if label_column not in obs.columns:
            label_columns.remove(label_column)
    for score_column in score_columns.copy():
        if score_column not in obs.columns:
            score_columns.remove(score_column)
    
    print(f"Valid label columns: {label_columns}")
    print(f"Valid score columns: {score_columns}")

    # Add ground truth and cluster id at the front if they exist
    if ground_truth is not None and ground_truth in obs.columns:
        label_columns = [ground_truth] + label_columns
    else:
        # Retrieve unique cell type labels
        try:
            with open('/usr/src/app/storage/uniqueCellLabels.json', 'r', encoding='utf-8') as file:
                unique_cell_labels = json.load(file)
        except FileNotFoundError:
            print("The specified JSON file was not found.")
        except json.JSONDecodeError:
            print("Error decoding JSON. Ensure the file contains a valid list.")
        # Add cell type annotations to obsSets
        if len(unique_cell_labels) > 0:
            for label in unique_cell_labels:
                if label in obs.columns:
                    obs_cols.append(label)
            if len(obs_cols) > 0:
                label_columns = obs_cols + label_columns
    
    if "cell_label" in obs.columns and "cell_label" not in label_columns:
        label_columns = ["cell_label"] + label_columns

    if cluster_id in obs.columns:
        label_columns = [cluster_id] + label_columns
        score_columns = [cluster_id] + score_columns
    else:
        return None

    if len(label_columns) == 0:
        return None

    if len(label_columns) > 1:
        labels_df = obs[label_columns].groupby(cluster_id).agg(first_mode)
        labels_df = add_majority_vote(labels_df, unknown_label="Unknown", tie_strategy="first")
        # labels_df['majority_vote'] = labels_df.mode(axis=1).iloc[:, 0].fillna('Unknown')
        # labels_df['majority_vote'] = labels_df.mode(axis=1)[0]
        if "cell_label" not in obs.columns:
            # labels_df["cell_label"] = labels_df['majority_vote']
            if ground_truth is not None and ground_truth in obs.columns:
                unique_labels = pd.unique(labels_df.values.ravel()).tolist()
            else:
                labels_df.insert(loc=0, column='cell_label', value=labels_df['majority_vote'])
        try:
            unique_labels = labels_df.astype(object).stack().unique().tolist()
        except Exception as e:
            print(f"Error getting unique labels: {e}")
            unique_labels = labels_df["cell_label"].unique().tolist()         
    else:
        labels_df = pd.DataFrame(obs[cluster_id].unique(), columns=['Cluster'])
        unique_labels = None
        labels_df["cell_label"] = ''

    if len(score_columns) > 1:
        scores_df = obs[score_columns].groupby(cluster_id).agg(lambda x: x.mean())
        scores_df = scores_df.round(4)

        mapping_res = labels_df.merge(right = scores_df, left_index=True, right_index=True)
        mapping_res.insert(0, 'Cluster', mapping_res.index)
        mapping_res_dict = mapping_res.to_dict('list', index=True)
    else:
        if "Cluster" not in labels_df.columns:
            labels_df.insert(0, 'Cluster', labels_df.index)
        mapping_res_dict = labels_df.to_dict('list', index=True)

    return { "cluster_id": cluster_id, "table": mapping_res_dict, "unique_labels": unique_labels, }


def create_outlier_panel(obs, cluster_id='leiden', outlier_columns=["discard", "outlier", "mt_outlier", "doublet_class", "predicted_doublet", "clf_doublet"], score_columns=['doublet_score', 'clf_score']):
    # Validate outlier columns and score columns
    for outlier_column in outlier_columns.copy():
        if outlier_column not in obs.columns:
            outlier_columns.remove(outlier_column)
    for score_column in score_columns.copy():
        if score_column not in obs.columns:
            score_columns.remove(score_column)

    if len(outlier_columns) == 0:
        return None

    if cluster_id in obs.columns:
        outlier_columns = [cluster_id] + outlier_columns
        score_columns = [cluster_id] + score_columns
    else:
        return None

    if len(outlier_columns) > 1:
        outliers_columns_df = obs[outlier_columns].groupby(cluster_id).agg(first_mode)
        unique_labels = [False, True]      
        
        # outliers_columns_df.insert(loc=1, column='majority_vote', value=outliers_columns_df.mode(axis=1)[0])
        # outliers_columns_df['majority_vote'] = outliers_columns_df.mode(axis=1).iloc[:, 0].fillna(False)
        outliers_columns_df = add_majority_vote(outliers_columns_df, unknown_label=False, tie_strategy="first")
        # labels_df['majority_vote'] = labels_df.mode(axis=1)[0]
        if "discard" not in obs.columns:
            outliers_columns_df.insert(loc=0, column='discard', value=outliers_columns_df['majority_vote'])
        print(f"outlier columns: {outlier_columns}")

    if len(score_columns) > 1:
        scores_df = obs[score_columns].groupby(cluster_id).agg(lambda x: x.mean())
        scores_df = scores_df.round(4)
        print(f"score_columns: {score_columns}")

        mapping_res = outliers_columns_df.merge(right = scores_df, left_index=True, right_index=True)
        mapping_res.insert(0, 'Cluster', mapping_res.index)
        mapping_res_dict = mapping_res.to_dict('list', index=True)
    else:
        outliers_columns_df.insert(0, 'Cluster', outliers_columns_df.index)
        mapping_res_dict = outliers_columns_df.to_dict('list', index=True)

    return { "cluster_id": cluster_id, "table": mapping_res_dict }


def get_updated_metadata(adata, process_id, cluster_id, adata_path, orign_adata_path, obsEmbedding):
    cell_metadata = None
    obs_names = None
    umap = None
    tsne = None
    umap_3d = None
    tsne_3d = None
    nCells = None
    nGenes = None
    info = adata.__str__()
    umap_label = obsEmbedding.replace("obsm/", "")
    umap_3d_label = umap_label.replace("umap", "umap_3D")
    tsne_label = umap_label.replace("umap", "tsne")
    tsne_3d_label = umap_label.replace("umap", "tsne_3D")

    if adata is not None and isinstance(adata, AnnData):
        obs = regularise_df(adata.obs)
        obs_names = obs.columns.values.tolist()
        obs_dict = obs.to_dict('list') # Pandas dataframe
        obs_dict['index'] = obs.index.tolist()
        cell_metadata = gzip_dict(obs_dict)
        nCells = adata.n_obs # Number of cells
        nGenes = adata.n_vars # Number of genes

        if umap_label in adata.obsm.keys():
            umap = json_numpy.dumps(adata.obsm[umap_label])
        if umap_3d_label in adata.obsm.keys():
            umap_3d = json_numpy.dumps(adata.obsm[umap_3d_label])
        if tsne_label in adata.obsm.keys():
            tsne = json_numpy.dumps(adata.obsm[tsne_label])
        if tsne_3d_label in adata.obsm.keys():
            tsne_3d = json_numpy.dumps(adata.obsm[tsne_3d_label])
    else:
        return None

    annotation_panel = create_annotation_panel(adata.obs, cluster_id=cluster_id)
    outlier_panel = create_outlier_panel(adata.obs, cluster_id=cluster_id)
    
    pp_results = {
            "process_id": process_id,
            "info": info,
            "adata_path": adata_path,
            "original_adata_path": orign_adata_path,
            "cell_metadata": cell_metadata,
            "obs_names": obs_names,
            "nCells": nCells,
            "nGenes": nGenes,
            "umap": umap,
            "umap_3d": umap_3d,
            "tsne": tsne,
            "tsne_3d": tsne_3d,
            "annotation_panel": annotation_panel,
            "outlier_panel": outlier_panel,
            }

    return pp_results


def get_tools():
    # Get the base names of currently loaded modules (ignoring private/hidden ones)
    tools = []
    loaded_modules = set([m.split('.')[0] for m in sys.modules.keys() if not m.startswith('_')])
    for module_name in sorted(loaded_modules):
        try:
            # Try to get the version from the package metadata
            version = importlib.metadata.version(module_name)
            tools.append(f"{module_name} == {version}")
        except importlib.metadata.PackageNotFoundError:
            # Built-in modules (like 'sys' or 'math') won't be found here, which is normal
            pass
    return tools


def parse_session_info_to_dict(text):
    # Initialize the structure of our dictionary
    session_dict = {
        "r_version": None,
        "platform": None,
        "os": None,
        "matrix_products": None,
        "blas_lapack": None,
        "locale": [],
        "time_zone": None,
        "attached_base_packages": [],
        "other_attached_packages": {},
        "loaded_via_namespace": {}
    }

    current_section = "header"
    lines = text.strip().split('\n')

    for line in lines:
        line = line.strip()
        if not line:
            continue  # Skip blank lines

        # 1. Detect which section we are in
        if line.startswith("locale:"):
            current_section = "locale"
            continue
        elif line.startswith("attached base packages:"):
            current_section = "attached_base_packages"
            continue
        elif line.startswith("other attached packages:"):
            current_section = "other_attached_packages"
            continue
        elif line.startswith("loaded via a namespace (and not attached):"):
            current_section = "loaded_via_namespace"
            continue
        elif line.startswith("time zone:"):
            current_section = "header" # Switch back to header for trailing single lines

        # 2. Parse data based on the current section
        if current_section == "header":
            if line.startswith("R version"):
                session_dict["r_version"] = line
            elif line.startswith("Platform:"):
                session_dict["platform"] = line.split(":", 1)[1].strip()
            elif line.startswith("Running under:"):
                session_dict["os"] = line.split(":", 1)[1].strip()
            elif line.startswith("Matrix products:"):
                session_dict["matrix_products"] = line.split(":", 1)[1].strip()
            elif line.startswith("BLAS/LAPACK:"):
                session_dict["blas_lapack"] = line.split(":", 1)[1].strip()
            elif line.startswith("time zone:"):
                session_dict["time_zone"] = line.split(":", 1)[1].strip()

        elif current_section == "locale":
            # Remove the bracketed numbers like [1], [4] and split by spaces
            clean_line = re.sub(r'\[\d+\]\s*', '', line)
            items = [item.strip() for item in clean_line.split('  ') if item.strip()]
            session_dict["locale"].extend(items)

        elif current_section == "attached_base_packages":
            # Remove brackets and split by space
            clean_line = re.sub(r'\[\d+\]\s*', '', line)
            pkgs = [pkg.strip() for pkg in clean_line.split() if pkg.strip()]
            session_dict["attached_base_packages"].extend(pkgs)

        elif current_section in ["other_attached_packages", "loaded_via_namespace"]:
            # Extract PackageName_Version using regex
            # Group 1: Package name (letters, numbers, dots)
            # Group 2: Version (numbers, dots, hyphens)
            matches = re.findall(r'([A-Za-z0-9\.]+)_([0-9\.\-]+)', line)
            for pkg, version in matches:
                session_dict[current_section][pkg] = version

    return session_dict


def get_r_tools(tools_path):
    r_tools = None
    file_content = None
    try:
        # Open the file in read mode ('r')
        with open(tools_path, 'r') as file:
            file_content = file.read()
        if file_content is not None:
            r_tools = parse_session_info_to_dict(file_content)
    except Exception as e:
        print(f"Error retrieving R tools: {e}")
    return r_tools
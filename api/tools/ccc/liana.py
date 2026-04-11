import numpy as np
import liana as li
import scanpy as sc
from tools.formating.formating import is_normalized
from liana.mt import rank_aggregate
from liana.method import singlecellsignalr, connectome, cellphonedb, natmi, logfc, cellchat, geometric_mean

# https://liana-py.readthedocs.io/en/latest/notebooks/basic_usage.html
def run_liana_ccc(adata, cell_type_label, species, methods=None, aggregate_methods=['rra']):
    if adata is None:
        raise ValueError("Failed to load AnnData object.")
    if methods is None:
        methods = []
    
    if is_normalized(adata.X, 200) and not check_nonnegative_integers(adata.X):
        redislogger.info(unique_id, "adata.X is not raw counts.")
        if "raw_counts" in adata.layers.keys():
            redislogger.info(unique_id, "Use layer 'raw_counts' instead. Copy adata.X to layer 'normalized_X'.")
            adata.layers["normalized_X"] = adata.X.copy()
            adata.X = adata.layers['raw_counts'].copy()
            adata.raw.X = adata.X.copy()
        elif adata.raw.X is not None:
            redislogger.info(unique_id, "Use adata.raw.X instead. Copy adata.X to layer 'normalized_X'.")
            adata.layers["normalized_X"] = adata.X.copy()
            adata.X = adata.raw.X.copy()
        else:
            raise ValueError("Liana only take raw counts, not normalized data.")
    elif adata.raw == None:
        adata.raw = adata.copy()

    resource_name = 'consensus'
    if species == "mouse":
        resource_name = "mouseconsensus"
            
    # run cellphonedb
    # cellphonedb(adata,
    #         groupby=cell_type_label, 
    #         # NOTE by default the resource uses HUMAN gene symbols
    #         resource_name='consensus',
    #         expr_prop=0.1,
    #         verbose=True, key_added='cpdb_res')

    # by default, liana's output is saved in place:
    # adata.uns['cpdb_res'].head()

    if "CellPhoneDB" in methods:
        cellphonedb(adata,
            groupby=cell_type_label, 
            # NOTE by default the resource uses HUMAN gene symbols
            resource_name=resource_name,
            expr_prop=0.1,
            verbose=True, 
            key_added="CellPhoneDB")
        # Filter & Re-order
        adata.uns["CellPhoneDB"]["score"] = adata.uns["CellPhoneDB"].apply(
            lambda x: _p_filt(x.cellphone_pvals, x["lr_means"]), axis=1)

    if "SingleCellSignalR" in methods:
        singlecellsignalr(adata,
            groupby=cell_type_label, 
            # NOTE by default the resource uses HUMAN gene symbols
            resource_name=resource_name,
            expr_prop=0.1,
            verbose=True, 
            key_added='SingleCellSignalR')
        adata.uns["SingleCellSignalR"]["score"] = adata.uns["SingleCellSignalR"]["lrscore"]

    if "Connectome" in methods:
        connectome(adata,
            groupby=cell_type_label, 
            # NOTE by default the resource uses HUMAN gene symbols
            resource_name=resource_name,
            expr_prop=0.1,
            verbose=True, 
            key_added="Connectome")
        adata.uns["Connectome"]["score"] = adata.uns["Connectome"]["scaled_weight"]

    if "NATMI" in methods:
        natmi(adata,
            groupby=cell_type_label, 
            # NOTE by default the resource uses HUMAN gene symbols
            resource_name=resource_name,
            expr_prop=0.1,
            verbose=True, 
            key_added="NATMI")
        adata.uns["NATMI"]["score"] = adata.uns["NATMI"]["spec_weight"]

    if "log2FC" in methods:
        logfc(adata,
            groupby=cell_type_label, 
            # NOTE by default the resource uses HUMAN gene symbols
            resource_name=resource_name,
            expr_prop=0.1,
            verbose=True, 
            key_added="log2FC")
        adata.uns["log2FC"]["score"] = adata.uns["log2FC"]["lr_logfc"]
        adata.uns["log2FC"]['score'] = adata.uns["log2FC"]['score'].replace([-np.inf], 0)
        adata.uns["log2FC"]['score'] = adata.uns["log2FC"]['score'].replace([np.inf], 1)

    if "CellChat" in methods:
        cellchat(adata,
            groupby=cell_type_label, 
            # NOTE by default the resource uses HUMAN gene symbols
            resource_name=resource_name,
            expr_prop=0.1,
            verbose=True, 
            key_added="CellChat")
        # Filter & Re-order
        adata.uns["CellChat"]["score"] = adata.uns["CellChat"].apply(
            lambda x: _p_filt(x.cellchat_pvals, x["lr_probs"]), axis=1)
        
    if "GeometricMean" in methods:
        geometric_mean(adata,
            groupby=cell_type_label, 
            # NOTE by default the resource uses HUMAN gene symbols
            resource_name=resource_name,
            expr_prop=0.1,
            verbose=True, 
            key_added="GeometricMean")
        # Filter & Re-order
        adata.uns["GeometricMean"]["score"] = adata.uns["GeometricMean"].apply(
            lambda x: _p_filt(x.gmean_pvals, x["lr_gmeans"]), axis=1)
    
    # Run rank_aggregate
    for method in aggregate_methods:
        li.mt.rank_aggregate(adata, 
                            groupby=cell_type_label,
                            resource_name=resource_name,
                            expr_prop=0.1,
                            aggregate_method=method,
                            verbose=True, 
                            key_added=f"LIANA ({method})")
        adata.uns[f"LIANA ({method})"]["score"] = adata.uns[f"LIANA ({method})"]["lrscore"]
        adata.uns[f"LIANA ({method})"]["ligand"] = adata.uns[f"LIANA ({method})"]["ligand_complex"]

    # adata.uns['liana_res'].head()

    # methods = [logfc, geometric_mean]
    # new_rank_aggregate = li.mt.AggregateClass(li.mt.aggregate_meta, methods=methods)
    # new_rank_aggregate(adata,
    #                 groupby='bulk_labels',
    #                 expr_prop=0.1, 
    #                 verbose=True,
    #                 # Note that with this option, we don't perform permutations
    #                 # and hence we exclude the p-value for geometric_mean, as well as specificity_rank
    #                 n_perms=None,
    #                 use_raw=True,
    #                 )
    
    # adata.uns['liana_res'].head()

    return adata


# Helper function to filter according to permutation p-values
def _p_filt(x, y):
    if x <= 0.05:
        return y
    else:
        return 0

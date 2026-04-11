from scipy import sparse

import importlib
import numbers
import scanpy as sc
import numpy as np
import pandas as pd
import re
from typing import Literal
from scib.preprocessing import get_cell_cycle_genes
import warnings


def toarray(x):
    """Convert an array-like to a np.ndarray.

    Parameters
    ----------
    x : array-like
        Array-like to be converted
    Returns
    -------
    x : np.ndarray
    """
    if is_SparseDataFrame(x):
        x = x.to_coo().toarray()
    elif is_SparseSeries(x):
        x = x.to_dense().to_numpy()
    elif isinstance(x, (pd.DataFrame, pd.Series, pd.Index)):
        x = x.to_numpy()
    elif isinstance(x, sparse.spmatrix):
        x = x.toarray()
    elif isinstance(x, np.matrix):
        x = x.A
    elif isinstance(x, list):
        x_out = []
        for xi in x:
            try:
                xi = toarray(xi)
            except TypeError:
                # recursed too far
                pass
            x_out.append(xi)
        # convert x_out from list to array
        x = np.array(x_out, dtype=_check_numpy_dtype(x_out))
    elif isinstance(x, (np.ndarray, numbers.Number)):
        pass
    else:
        raise TypeError("Expected array-like. Got {}".format(type(x)))
    return x


def is_SparseSeries(X):
    with warnings.catch_warnings():
        warnings.filterwarnings(
            "ignore",
            "The SparseSeries class is removed from pandas. Accessing it from the "
            "top-level namespace will also be removed in the next version",
            FutureWarning,
        )
        try:
            return isinstance(X, pd.SparseSeries)
        except AttributeError:
            return False


def is_SparseDataFrame(X):
    with warnings.catch_warnings():
        warnings.filterwarnings(
            "ignore",
            "The SparseDataFrame class is removed from pandas. Accessing it from the "
            "top-level namespace will also be removed in the next version",
            FutureWarning,
        )
        try:
            return isinstance(X, pd.SparseDataFrame)
        except AttributeError:
            return False


def is_sparse_dataframe(x):
    if isinstance(x, pd.DataFrame) and not is_SparseDataFrame(x):
        try:
            x.sparse
            return True
        except AttributeError:
            pass
    return False


def is_sparse_series(x):
    if isinstance(x, pd.Series) and not is_SparseSeries(x):
        try:
            x.sparse
            return True
        except AttributeError:
            pass
    return False


def dataframe_to_sparse(x, fill_value=0.0):
    x = pd.DataFrame.sparse.from_spmatrix(
        sparse.coo_matrix(x.values), index=x.index, columns=x.columns
    )
    x.sparse.fill_value = fill_value
    return x


def SparseDataFrame(X, columns=None, index=None, default_fill_value=0.0):
    if sparse.issparse(X):
        X = pd.DataFrame.sparse.from_spmatrix(X)
        X.sparse.fill_value = default_fill_value
    else:
        if is_SparseDataFrame(X) or not isinstance(X, pd.DataFrame):
            X = pd.DataFrame(X)
        X = dataframe_to_sparse(X, fill_value=default_fill_value)
    if columns is not None:
        X.columns = columns
    if index is not None:
        X.index = index
    return X


def has_cell_cyle_genes(
    adata: sc.AnnData, 
    species: Literal[
        "mouse",
        "mus musculus",
        "mus_musculus",
        "human",
        "homo sapiens",
        "homo_sapiens",
        "c_elegans",
        "c elegans",
        "caenorhabditis elegans",
        "caenorhabditis_elegans",
        "zebrafish",
        "danio rerio",
        "danio_rerio",
    ]):
    columns = ["gene_name", "gene_id"]
    gene_map = get_cell_cycle_genes(species)
    df_s = gene_map.query("phase == 'S'")
    df_g = gene_map.query("phase == 'G2/M'")
    
    n_genes_s = 0
    for col in columns:
        _genes = [g for g in df_s[col] if g in adata.var_names]
        if len(_genes) > n_genes_s:  # pick largest overlapping set
            n_genes_s = len(_genes)
            genes_s = _genes
            
    if n_genes_s == 0:
        return False

    n_genes_g = 0
    for col in columns:
        _genes = [g for g in df_g[col] if g in adata.var_names]
        if len(_genes) > n_genes_g:  # pick largest overlapping set
            n_genes_g = len(_genes)
            genes_g = _genes
            
    if n_genes_g == 0:
        return False
        
    return True
from scipy import sparse
import importlib
import numbers
import anndata
import scanpy as sc
import sklearn.metrics
import numpy as np
import pandas as pd
import re
import warnings


# test_data = adata.obsm["test"]
# denoised_data = adata.obsm["denoised"]
# train_data = adata.obsm["train"]
def imputation_metrics(adata, denoised_layer, train='train', test='test'):
    #Mean-squared error
    test_adata = anndata.AnnData(X=adata.obsm[test], obs=adata.obs, var=adata.var)
    denoised_adata = anndata.AnnData(
        X=adata.layers[denoised_layer], obs=adata.obs, var=adata.var
    )

    # scaling and transformation
    target_sum = 10000

    sc.pp.normalize_total(test_adata, target_sum)
    sc.pp.log1p(test_adata)

    sc.pp.normalize_total(denoised_adata, target_sum)
    sc.pp.log1p(denoised_adata)

    mse = sklearn.metrics.mean_squared_error(
        toarray(test_adata.X), toarray(denoised_adata.X)
    )

    # Poisson loss
    test_data = adata.obsm[test]
    denoised_data = adata.layers[denoised_layer]

    # scaling
    initial_sum = adata.obsm[train].sum()
    target_sum = test_data.sum()
    denoised_data = denoised_data * target_sum / initial_sum

    possion = poisson_nll_loss(toarray(test_data), toarray(denoised_data))

    return float('{:.4f}'.format(mse)), float('{:.4f}'.format(possion))


def poisson_nll_loss(y_pred: np.ndarray, y_true: np.ndarray) -> float:
    return (y_pred - y_true * np.log(y_pred + 1e-6)).mean()


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
import scanpy as sc
import pandas as pd
import numpy as np


def normalize_pearson_residuals(adata):
    print(np.isfinite(_safe_accumulator_op(np.sum, adata.X)))
    adata.layers["Pearson_residuals"] = adata.X.copy()
    sc.experimental.pp.normalize_pearson_residuals(adata, layer='Pearson_residuals')
    return adata


def normalize_pearson_residuals_pca(adata):
    sc.experimental.pp.normalize_pearson_residuals_pca(adata)
    return adata


# Use at least float64 for the accumulating functions to avoid precision issue
# see https://github.com/numpy/numpy/issues/9393. The float64 is also retained
# as it is in case the float overflows
def _safe_accumulator_op(op, x, *args, **kwargs):
    """
    This function provides numpy accumulator functions with a float64 dtype
    when used on a floating point input. This prevents accumulator overflow on
    smaller floating point dtypes.
    Parameters
    ----------
    op : function
        A numpy accumulator function such as np.mean or np.sum.
    x : ndarray
        A numpy array to apply the accumulator function.
    *args : positional arguments
        Positional arguments passed to the accumulator function after the
        input x.
    **kwargs : keyword arguments
        Keyword arguments passed to the accumulator function.
    Returns
    -------
    result
        The output of the accumulator function passed to this function.
    """
    if np.issubdtype(x.dtype, np.floating) and x.dtype.itemsize < 8:
        result = op(x, *args, **kwargs, dtype=np.float64)
    else:
        result = op(x, *args, **kwargs)
    return result
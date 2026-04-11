import warnings
import scanpy as sc
import math
from typing import Union, Optional, Tuple, Collection, Sequence, Iterable, Literal
import numpy as np
from numpy import random
import scipy as sp
from scipy.sparse import issparse, isspmatrix_csr, csr_matrix, spmatrix
from anndata import AnnData


AnyRandom = Union[None, int, random.RandomState]  # random.Generator


# def sc_train_test_split(
#     data: Union[AnnData, np.ndarray, spmatrix],
#     train_fraction: [float] = 0.8,
#     n_obs: Optional[int] = None,
#     random_state: AnyRandom = 0
#     ) -> Optional[AnnData]:

#     random.seed(random_state)
#     total_obs = data.n_obs if isinstance(data, AnnData) else data.shape[0]
#     obs_indices = np.arange(total_obs)

#     if n_obs is not None:
#         train_n_obs = n_obs
#     elif train_fraction is not None:
#         if train_fraction > 1 or train_fraction < 0:
#             raise ValueError(f"`train_fraction` needs to be within [0, 1], not {train_fraction}")
#         train_n_obs = int(train_fraction * total_obs)
#     else:
#         raise ValueError("Either pass `n_obs` or `train_fraction`.")
    
#     if math.isclose(train_fraction, 1):
#         return data, None
#     elif math.isclose(train_fraction, 0):
#         return None, data
#     else:
#         train_indices = random.choice(total_obs, size=train_n_obs, replace=False)
#         test_indices = np.setdiff1d(obs_indices, train_indices)

#         if isinstance(data, AnnData):
#             if data.isbacked:
#                 return data[train_indices].to_memory(), data[test_indices].to_memory()
#             else:
#                 return data[train_indices].copy(), data[test_indices].copy()
#         else:
#             X = data
#             return X[train_indices], X[test_indices]


# def sc_train_val_test_split(
#     data: Union[AnnData, np.ndarray, spmatrix],
#     train_fraction: [float] = 0.8,
#     validation_fraction: [float] = 0.1,
#     test_fraction: [float] = 0.1
#     ) -> Optional[AnnData]:

#     if train_fraction is None or validation_fraction is None or test_fraction is None:
#         raise ValueError("`train_fraction`, `validation_fraction` and `test_fraction` are required.")
#     if train_fraction > 1 or train_fraction < 0:
#         raise ValueError(f"`train_fraction` needs to be within [0, 1], not {train_fraction}")
#     if validation_fraction > 1 or validation_fraction < 0:
#         raise ValueError(f"`validation_fraction` needs to be within [0, 1], not {validation_fraction}")
#     if test_fraction > 1 or test_fraction < 0:
#         raise ValueError(f"`test_fraction` needs to be within [0, 1], not {test_fraction}")
#     if train_fraction + validation_fraction + test_fraction != 1:
#         raise ValueError("`train_fraction`, `validation_fraction` and `test_fraction` must be added up to 1.")

#     train, validation_test = sc_train_test_split(data, train_fraction=train_fraction)
#     validation, test = sc_train_test_split(validation_test, train_fraction=validation_fraction/(validation_fraction+test_fraction))

#     return train, validation, test


def sc_train_test_split(
    data: AnnData,
    train_fraction: [float] = 0.8,
    n_obs: Optional[int] = None,
    random_state: AnyRandom = 0
    ) -> AnnData:

    random.seed(random_state)
    total_obs = data.n_obs # if isinstance(data, AnnData) else data.shape[0]
    obs_indices = np.arange(total_obs)

    if n_obs is not None:
        train_n_obs = n_obs
    elif train_fraction is not None:
        if train_fraction > 1 or train_fraction < 0:
            raise ValueError(f"`train_fraction` needs to be within [0, 1], not {train_fraction}")
        train_n_obs = int(train_fraction * total_obs)
    else:
        raise ValueError("Either pass `n_obs` or `train_fraction`.")
    
    if math.isclose(train_fraction, 1):
        data.obs['split_idx'] = 'train/test'
        return data
    elif math.isclose(train_fraction, 0):
        data.obs['split_idx'] = 'test'
        return data
    else:
        train_indices = random.choice(total_obs, size=train_n_obs, replace=False)
        test_indices = np.setdiff1d(obs_indices, train_indices)
        data.obs['split_idx'][train_indices] = 'train'
        data.obs['split_idx'][test_indices] = 'test'

        if data.isbacked:
            return data.to_memory()
        else:
            return data.copy()


def sc_train_val_test_split(
    data: AnnData,
    train_fraction: [float] = 0.8,
    validation_fraction: [float] = 0.1,
    test_fraction: [float] = 0.1,
    random_state: AnyRandom = 0
    ) -> AnnData:

    if train_fraction is None or validation_fraction is None or test_fraction is None:
        raise ValueError("`train_fraction`, `validation_fraction` and `test_fraction` are required.")
    if train_fraction > 1 or train_fraction < 0:
        raise ValueError(f"`train_fraction` needs to be within [0, 1], not {train_fraction}")
    if validation_fraction > 1 or validation_fraction < 0:
        raise ValueError(f"`validation_fraction` needs to be within [0, 1], not {validation_fraction}")
    if test_fraction > 1 or test_fraction < 0:
        raise ValueError(f"`test_fraction` needs to be within [0, 1], not {test_fraction}")
    if train_fraction + validation_fraction + test_fraction != 1:
        raise ValueError("`train_fraction`, `validation_fraction` and `test_fraction` must be added up to 1.")

    random.seed(random_state)
    total_obs = data.n_obs
    obs_indices = np.arange(total_obs)

    if train_fraction is not None:
        if train_fraction > 1 or train_fraction < 0:
            raise ValueError(f"`train_fraction` needs to be within [0, 1], not {train_fraction}")
        train_n_obs = int(train_fraction * total_obs)
    else:
        raise ValueError("`train_fraction` is None.")

    if validation_fraction is not None:
        if validation_fraction > 1 or validation_fraction < 0:
            raise ValueError(f"`validation_fraction` needs to be within [0, 1], not {validation_fraction}")
        val_n_obs = int(validation_fraction * total_obs)
    else:
        val_n_obs = 0

    if math.isclose(train_fraction, 1):
        data.obs['split_idx'] = 'train/test'
        return data
    elif math.isclose(train_fraction, 0):
        data.obs['split_idx'] = 'test'
        return data
    else:
        if val_n_obs == 0:
            train_indices = random.choice(total_obs, size=train_n_obs, replace=False)
            test_indices = np.setdiff1d(obs_indices, train_indices)
            data.obs['split_idx'][train_indices] = 'train'
            data.obs['split_idx'][test_indices] = 'test'

        else:
            train_val_n_obs = train_n_obs + val_n_obs
            train_val_indices = random.choice(total_obs, size=train_val_n_obs, replace=False)
            train_indices = random.choice(train_val_indices, size=train_n_obs, replace=False)
            val_indices = np.setdiff1d(train_val_indices, train_indices)
            test_indices = np.setdiff1d(obs_indices, train_val_indices)
            data.obs['split_idx'][train_indices] = 'train'
            data.obs['split_idx'][val_indices] = 'valid'
            data.obs['split_idx'][test_indices] = 'test'

        if data.isbacked:
            return data.to_memory()
        else:
            return data.copy()


def subset_by_obskey(
        adata: AnnData,
        obskey: str,
        values: list):
    adata_merge = None
    if isinstance(adata, AnnData):
        if obskey in adata.obs.keys() and len(values)>0:
            adata_list = []
            for value in values:
                adata_list.append(adata[adata.obs[obskey] == value])
            adata_merge = sc.AnnData.concatenate(*adata_list, join='outer')
            adata_merge.var_names_make_unique()
            adata_merge.obs_names_make_unique()

    return adata_merge

    

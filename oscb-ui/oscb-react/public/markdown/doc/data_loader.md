# Data Loader API

`oscb.data.DataLoader` downloads a public single-cell dataset or a benchmark-associated dataset into a local directory and returns its in-memory representation.

## Signature

```python
from oscb.data import DataLoader

DataLoader(benchmarks_id, data_folder="downloads/")
```

| Parameter | Type | Description |
| --- | --- | --- |
| `benchmarks_id` | `str` | A **benchmark ID** (task-specific) or **dataset ID** available on the platform. |
| `data_folder` | `str` | Writable directory for downloaded files; defaults to `downloads/`. |

**Returns:** `AnnData` for common single-modality tasks, `MuData` for supported multimodal datasets, or `None` when the entry cannot be found. Do not assume the return type from the ID alone.

## Example: benchmark ID

```python
from oscb.data import DataLoader

adata = DataLoader(
    benchmarks_id="CT-h-PBMC-11989-Adam-2022",
    data_folder="./datasets/",
)
if adata is None:
    raise ValueError("Benchmark dataset was not found")
print(type(adata).__name__)
```

A benchmark ID may also display task metadata such as the reference label field and available metrics.

## Example: dataset ID

```python
from oscb.data import DataLoader

adata = DataLoader(
    benchmarks_id="h-PBMC-11989-Adam-2022",
    data_folder="./datasets/",
)
if adata is None:
    raise ValueError("Dataset was not found")
```

## Inspect the result

An `AnnData` object can hold measurements and annotation information in several places:

| Attribute | Typical contents |
| --- | --- |
| `adata.X` | Primary expression matrix; may contain counts or processed values. |
| `adata.layers` | Named alternate matrices, when supplied. |
| `adata.obs` | Cell-level metadata, including reference labels and batch IDs. |
| `adata.var` | Gene/feature metadata. |
| `adata.obsm` | Embeddings or other per-cell multidimensional arrays. |
| `adata.uns` | Other metadata, including task-specific structures. |

For a `MuData` result, look in `mdata.mod` for modality-specific `AnnData` objects.

> **Important:** Raw-count storage is dataset-dependent. Verify the required input scale, feature identifiers, and cell order before running your method or [evaluating the results](doc/?doc=evaluators).

# Data Loader

<hr/>

## oscb.data.DataLoader

oscb.data.**DataLoader**(**benchmarks_id**, **data_folder**='downloads/')

---

### Parameters
> **benchmarks_id**: `str`
>> Benchmarks ID or Dataset ID. If Benchmarks ID is provided, print Benchmarks settings.
>
> **data_folder**: `str` (**default**: `downloads/`)
>> Local directory where the downloaded `AnnData` or `MuData` file will be saved. Make sure the directory exists and you have write permissions before downloading.

---

### Return Type
> `AnnData` | `MuData` | `None`

---

### Returns
> Returns `None` is no dataset is found.

> `AnnData`: Clustering, Cell Type Annotation, Cell-Cell Communication, Imputation, Batch Integration, and Trajectory tasks or user's datasets

> `MuData`: Multimodal Data Integration or user's datasets

---

### Examples

Load dataset by **Benchmarks ID**:
```python
from oscb.data import DataLoader

# Download and process data at './datasets/'
adata = DataLoader(benchmarks_id="CT-h-PBMC-11989-Adam-2022", data_folder="./datasets/")
```

Output:
```shell
Downloading dataset for Cell Type Annotation Benchmarks.
PBMC7K_annotation_1_scanpy.h5ad: 198MB [00:02, 74.4MB/s] 
File downloaded successfully to: downloads/PBMC7K_annotation_1_scanpy.h5ad
Benchmarks metadata:
benchmarksId: CT-h-PBMC-11989-Adam-2022
label: labels
datasetId: h-PBMC-11989-Adam-2022
metrics: ['Accuracy', 'F1_macro', 'F1_micro', 'F1_weighted']
task_type: Cell Type Annotation
```
Load dataset by **Dataset ID**:
```python
from oscb.data import DataLoader

# Download and process data at './datasets/'
adata = DataLoader(benchmarks_id="h-PBMC-11989-Adam-2022", data_folder="./datasets/")
```

Output:
```shell
Downloading dataset.
PBMC7K_annotation_1_scanpy.h5ad: 198MB [00:01, 135MB/s]  
File downloaded successfully to: downloads/PBMC7K_annotation_1_scanpy.h5ad
Benchmarks metadata:
Title: PBMC7K_annotation_1
```

> [!IMPORTANT]
> For public Benchmarks and datasets, the downloaded file is in [`AnnData`](https://github.com/scverse/anndata) or [`MuData`](https://github.com/scverse/mudata) format. The raw counts are kept in `adata.X`. The processed data (normalized, imputed, ...) are stored in `adata.layers`.

# Evaluators

---

## oscb.evaluator.eval

oscb.evaluator.**eval**(**adata**=None, **adata_int**=None, **mdata**=None, **benchmarks_id**=None, **task**=None, **cluster_key**=None, **label_key**=None, **batch_key**=None, **labels**=None, **labels_pred**=None, **embedding**=None, **embedding_key**=None, **ccc_pred**=None, **ccc_target**=None, **score**="score", **denoised**=None, **mod1_key**='rna', **mod2_key**='atac', **traj**=None, **bm_traj**=None, **root_node**=None, **species**=None, **method**="Your method")

---

### Parameters
> **adata**: `AnnData`  (default: `None`)
>> Annotated data matrix.
>
> **adata_int**: `AnnData` (default: `None`)
>> Annotated data matrix. Integrated `AnnData` for **Batch Integration** evaluation.
>
> **mdata**: `MuData` (default: `None`)
>> MuData object.
>
>**benchmarks_id**: `str` (default: `None`)
>> **Benchmarks ID**.
>
>**task**: `str` (default: `None`)
>> Benchmarks task types: **'Clustering'**, **'Cell Type Annotation'**, **'Cell-Cell Communication'**, **'Imputation'**, **'Batch Integration'**, **'Multimodal Data Integration'**, or **'Trajectory'**.
>
>**cluster_key**: `str` (default: `None`)
>> `adata.obs` key under which to add the **cluster labels**.
>
>**label_key**: `str` (default: `None`)
>> `adata.obs` key for the ground truth **cell type labels** used to evaluate or guide tasks such as **Clustering**, **Batch Integration**, **Trajectory**, **Cell-Cell Communication**, **Multimodal Data Integration** or **Cell Type Annotation** (e.g., `'cell_type'`).
>
>**batch_key**: `str` (default: `None`)
>> `adata.obs` key of batches for **Batch Integration** or **Multimodal Data Integration** (e.g., `'batch'`).
>
>**labels**: `array-like of shape (n_samples,)` (default: `None`)
>> Ground truth **cell type labels** used to evaluate tasks such as **Clustering** or **Cell Type Annotation** (e.g., `adata.obs['cell_type']`).
>
>**labels_pred**: `array-like of shape (n_samples,)` (default: `None`)
>> Predicted **cluster** for **Clustering** evaluation, or **cell type labels** for **Cell Type Annotation** evaluation.
>
>**embedding**: `{array-like, sparse matrix} of shape (n_samples_a, n_samples_a) or (n_samples_a, n_features)` (default: `None`)
>> **Embedding** for **Clustering** evaluation (e.g., adata.obsm["X_umap"]).
>
>**embedding_key**: `None` (default: `None`)
>> `adata.obsm` key of **embedding** for **Clustering** or **Multimodal Data Integration** evaluation.
>
>**ccc_pred**: `pandas.core.frame.DataFrame` (default: `None`)
>> Prediction of **Cell-Cell Communication** with columns "**source**", "**target**", and "**score**" for **source-target** prediction or "**ligand**", "**target**", and "**score**" for **ligand-target** prediction using your method. 
>
>**ccc_target**: `pandas.core.frame.DataFrame` (default: `None`)
>> Target of **Cell-Cell Communication** (e.g., `adata.uns['ccc_target']`).
>
>**score**: `str` (default: `score`)
>> Key of **Cell-Cell Communication** prediction **score** column, which specifies where the interaction or communication strength values are stored in your `pandas.core.frame.DataFrame`.
>
>**denoised**: `{array-like, sparse matrix} of shape (n_samples, n_features)` (default: `None`)
>> Imputed **embedding** for **Imputation** evaluation  (e.g., `adata.layer['denosied']` or `adata.obsm['denosied']`).
>
>**mod1_key**: `str` (default: `rna`)
>> `MuData.mod` key for **scRNA-seq** modality.
>
>**mod2_key**: `str` (default: `atac`)
>> `MuData.mod` key for **scATAC-seq** modality.
>
>**traj**: `pandas.core.frame.DataFrame` (default: `None`)
>> **Trajectory** inference with columns "**from**", "**to**", and "**length**" from your method.
>
>**bm_traj**: `pandas.core.frame.DataFrame` (default: `None`)
>> `adata.uns` key of ground truth **Trajectory**.
>
>**root_node**: `str` (default: `None`)
>> **Origin group** of **Trajectory** task (e.g., `'neoblast 1'`).
>
>**species**: `str` (default: `None`)
>> **Species** of your dataset (e.g., `'human'` or `'mouse'`)
>
>**method**: `str` (default: `'Your method'`)
>> **Name** of your method— this label will be displayed on the resulting plots to identify your analysis or algorithm. 

---

### Return Type
> `json` | `Figure`

---

### Returns
> `json`: Benchmarks results in `json` format.

> `Figure`: Bar plot of the performance evaluation.

---

### Examples

> **Clustering**: See [Benchmarks](/benchmarks/clustering).

> **Imputation**: See [Benchmarks](/benchmarks/imputation).

> **Batch Integration**: See [Benchmarks](/benchmarks/batch-integration).

> **Multimodal Data Integration**: See [Benchmarks](/benchmarks/multimodal-data-integration).

> **Trajectory**: See [Benchmarks](/benchmarks/trajectory).

> **Cell-Cell Communication**: See [Benchmarks](/benchmarks/cell-cell-communication).

> **Cell Type Annotation**: See [Benchmarks](/benchmarks/cell-type-annotation).


---

## oscb.utilization.Monitor

oscb.utilization.**Monitor**(**delay**=1)

---

### Parameters
> **delay**: `int` (default: 1)
>> Time between calls to GPUtil in second.

---

### Functions
> **stop()**
>> Stop monitoring the system utilization of CPU, memory, GPU, and GPU RAM to end resource tracking for the current task.

---

### Return Type
> `json` | `Figure`

---

### Returns
> `json`: Computing assessment results in `json` format.

> `Figure`: Line plot of the computing assessment.

---

### Examples

```python
from oscb.utilization import Monitor

monitor = Monitor(1) # 1 second, time between calls to GPUtil
# Your code
monitor.stop()
```
<div align="center">
<img src="/images/evaluator/cell_type_annotation_utilization.png">
</div>

---

## oscb.evaluator.write_json

oscb.evaluator.**write_json**(**data**, **file_path**="./output.json")

---

### Parameters
> **data**: `json`
>> Time between calls to GPUtil in second.
>
> **file_path**: `str`  (default: `'./output.json'`)
>> Local path to save the `json` file.

---

### Return Type
> `None`

---

### Examples

```python
from oscb.evaluator import write_json

write_json(results, file_path="./output.json") # The default file path is ./output.json
```


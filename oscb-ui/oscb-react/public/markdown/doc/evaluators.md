# Evaluator API

The OSCB evaluator compares method outputs against benchmark references or user-supplied ground truth. Required arguments vary by task; see the [Benchmarks](doc/?doc=benchmarks) for examples.

## `oscb.evaluator.eval`

```python
from oscb.evaluator import eval

results_dict = eval(
    adata=None, adata_int=None, mdata=None,
    benchmarks_id=None, task=None,
    cluster_key=None, label_key=None, batch_key=None,
    labels=None, labels_pred=None,
    embedding=None, embedding_key=None,
    ccc_pred=None, ccc_target=None, score="score",
    denoised=None, mod1_key="rna", mod2_key="atac",
    traj=None, bm_traj=None, root_node=None,
    species=None, method="Your method",
)
```

### Parameters

| Parameter | Expected input | Description |
| --- | --- | --- |
| `adata` | `AnnData` | Original or primary single-modality data. |
| `adata_int` | `AnnData` | Integrated output for batch-integration evaluation. |
| `mdata` | `MuData` | Multimodal dataset and related integrated representation. |
| `benchmarks_id` | `str` | Platform benchmark ID. Use this for predefined task configuration. |
| `task` | `str` | Task name for custom evaluation: `Clustering`, `Cell Type Annotation`, `Cell-Cell Communication`, `Imputation`, `Batch Integration`, `Multimodal Data Integration`, or `Trajectory`. |
| `cluster_key` | `str` | Column in `adata.obs` containing predicted cluster assignments. |
| `label_key` | `str` | Column in `adata.obs` or `mdata.obs` containing reference cell-type labels. |
| `batch_key` | `str` | Column containing batch or sample identifiers. |
| `labels`, `labels_pred` | array-like, length = cells | Ground-truth and predicted labels in matching cell order. |
| `embedding` | matrix / sparse matrix | Per-cell representation for metrics that use an embedding. |
| `embedding_key` | `str` | Key for an embedding in `adata.obsm` or `mdata.obsm`. |
| `ccc_pred`, `ccc_target` | `pandas.DataFrame` | Predicted and reference cell–cell communication interactions. |
| `score` | `str` | CCC score column; defaults to `score`. |
| `denoised` | matrix / sparse matrix | Imputed values, cells by genes, aligned with evaluation data. |
| `mod1_key`, `mod2_key` | `str` | Modality keys in `mdata.mod`; defaults to `rna` and `atac`. |
| `traj`, `bm_traj` | `pandas.DataFrame` | Predicted and reference trajectory edge tables with `from`, `to`, `length` columns. |
| `root_node` | `str` | Starting group for trajectory analysis when required. |
| `species` | `str` | Species, such as `human` or `mouse`, when required by the task. |
| `method` | `str` | Display name for the evaluated method. |

### Results

`eval()` returns the task evaluation results, which can be passed to `write_json()` as shown below. When supported, benchmark evaluation also generates a comparison visualization. The exact metrics and output schema depend on the task and OSCB version.

> **Before evaluating:** Confirm that cell order, feature order, metadata names, species, reference labels, and predicted outputs match the intended benchmark. An embedding computed from the same data used to fit a model is not automatically an unbiased test result.

### Task-specific examples

- [Clustering](benchmarks/clustering)
- [Cell Type Annotation](benchmarks/cell-cell-communication)
- [Cell–Cell Communication](benchmarks/cell-type-annotation)
- [Imputation](benchmarks/imputation)
- [Batch Integration](benchmarks/batch-integrationn)
- [Multimodal Data Integration](benchmarks/multimodal-data-integration)
- [Trajectory](benchmarks/trajectory)

## oscb.utilization.Monitor

Start a monitor before running your algorithm to sample CPU, memory, and—when supported—GPU utilization.

```python
from oscb.utilization import Monitor

monitor = Monitor(1)  # Sampling interval in seconds
try:
    # Insert your algorithm here.
    pass
finally:
    monitor.stop()
```

`Monitor(delay=1)` accepts a sampling interval in seconds. Resource measurements may depend on installed monitoring libraries and GPU availability.

![Example utilization plot](images/evaluator/cell_type_annotation_utilization.png)

## `oscb.evaluator.write_json`

Save evaluation results to a local JSON file:

```python
from oscb.evaluator import write_json

write_json(results_dict, file_path="./output.json")
```

| Parameter | Type | Description |
| --- | --- | --- |
| `data` | serializable results | Evaluation results to save. |
| `file_path` | `str` | Destination JSON path; defaults to `./output.json`. |

**Returns:** `None`.


<hr/>

## Load Dataset via Python API

**Open Single-Cell Benchmarks (OSCB)** is a Python package with a collection of benchmark datasets, data loaders, and evaluators for single-cell machine learning.
To install OSCB, please use Python's package manager pip:

```bash
pip install oscb
```

To show the installed version, run:

```bash
python -c "import oscb; print(oscb.__version__)" 
```

You may update the version by running:

```bash
pip install -U oscb
```

OSCB's primary advantages are its intuitive **data loaders**, designed for seamless dataset ingestion, and its standardized **evaluators**, which enable consistent and objective performance assessment across Clustering methods.

### Data Loader
To load a dataset, please replace `Benchmarks_ID/Dataset_ID` with the Benchmarks ID or Dataset ID (e.g., `"CL-m-FACS_Bladder-1268-Tabula-2018"`). The default download folder is `./datasets`. You can change the data folder by passing a new value to the parameter `data_folder`.

For public Benchmarks and datasets, the downloaded file is in [AnnData](https://github.com/scverse/anndata) or [MuData](https://github.com/scverse/mudata) format. The raw counts are kept in `adata.X`. The processed data (normalized, imputed, ...) are stored in `adata.layers`.
```python
from oscb.data import DataLoader

# Download and process data at './datasets/'
adata = DataLoader("Benchmarks_ID/Dataset_ID", data_folder="./datasets/")
```

### Evaluators
#### OSCB Benchmarks
For Benchmarks procided by [single-cell.ai](https://www.single-cell.ai/), please replace `Benchmarks_ID` with the Benchmarks ID (e.g., `"CL-m-FACS_Bladder-1268-Tabula-2018"`), `cluster_key` with your cluser key in `adata.obs` (e.g., `"leiden"`) and `embedding_key` with your embedding key in `adata.obsm` (e.g., `"X_umap"`). To modify the method name, adjust the `method` parameter.
> [!IMPORTANT]
> The input types of `benchmarks_id`, `cluster_key` and `embedding_key` are `string`.
```python
from oscb.evaluator import eval, write_json

results_dict = eval(adata, benchmarks_id="Benchmarks_ID", cluster_key=cluster_key, embedding_key=embedding_key, method="Your method")
```
> [!TIP]  
> If a `benchmarks_id` is specified, OSCB will automatically generate a bar chart to visually compare the performance of the user's method against established benchmark approaches.
> <div align="center">
> <img src="/images/evaluator/clustering_evaluation.png">
> </div>

#### User's Datasets
To utilize `eval()`, whether loading a dataset within [single-cell.ai](https://www.single-cell.ai/) via its ID or using your own, you must supply the `task` type (e.g., `"Clustering"` or `"CL"` for short), true `labels`(e.g., `adata.obs['cell_type']`), `labels_pred` from your Clustering (e.g., `adata.obs['leiden']`), and an `embedding` (e.g., `adata.obsm["X_umap"]`); the method name can be customized via the `method` parameter.
> [!IMPORTANT]
> The input types of `task` is `string`, `labels` and `labels_pred` are `array-like of shape (n_samples,)`, and `embedding` is `{array-like, sparse matrix} of shape (n_samples_a, n_samples_a) or (n_samples_a, n_features)`.
```python
from oscb.evaluator import eval, write_json

results_dict = eval(task='Clustering', labels=labels, labels_pred=labels_pred, embedding=embedding, method="Your method")
```
#### Save Results
To save your results to JSON format file, please run:
```python
from oscb.evaluator import write_json

write_json(results, file_path="./output.json") # The default file path is ./output.json
```
#### Computing Assessment
OSCB further offers a computational assessment unit that, by encapsulating your code within a `monitor` instance, tracks CPU, memory, GPU, and GPU memory usage.
```python
from oscb.utilization import Monitor

monitor = Monitor(1) # 1 second, time between calls to GPUtil
# Your code
monitor.stop()
```
<div align="center">
<img src="/images/evaluator/clustering_utilization.png">
</div>
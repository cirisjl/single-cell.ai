## Task Info
<div align="center">
<img src="/images/evaluator/Imputation.png">
</div>

Single-cell RNA sequencing (scRNA-seq) offers unprecedented insights into individual cells, but its data is often marked by "dropouts"—missing gene expression values due to technical limitations, which can obscure true biological signals. Single-cell Imputation addresses this by computationally estimating these missing values, effectively "filling in the blanks" in the raw data. By inferring likely gene expression based on similar cells and genes, Imputation transforms sparse and noisy datasets into more complete and accurate representations, thereby enhancing the reliability of downstream analyses like clustering and differential expression and allowing for a fuller understanding of cellular biology.

<hr/>

## Metrics

Evaluating single-cell RNA sequencing Imputation is challenging due to the lack of ground truth, as existing benchmark methods have limitations that prevent a unified accuracy measure. To address this, molecular cross-validation (MCV) is utilized, a method specifically designed to quantify Imputation accuracy by comparing a denoised training set against a partitioned test set, with demonstrated reliability in representing ground truth accuracy [^1].

A workflow for creating Imputation benchmarks is available on [single-cell.ai](https://www.single-cell.ai/), where training data is stored in `adata.obsm["train"]` and test data in `adata.obsm["test"]`.

* **MSE:** The metric measures the reweighted Mean Squared Error (MSE) [^1] between the denoised gene expression counts from the training dataset and the actual gene expression counts from the test dataset, where the reweighting factor is based on the train/test ratio.

* **Possion Loss:** This metric assesses the Poisson log-likelihood [^1] of observing the true gene counts in the test dataset, given that the denoised counts from the model represent the expected mean parameters of the underlying Poisson distributions.

<hr/>

## Python API

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

OSCB's primary advantages are its intuitive **data loaders**, designed for seamless dataset ingestion, and its standardized **evaluators**, which enable consistent and objective performance assessment across Imputation methods.

### Data Loader
To load a dataset, please replace `Benchmarks_ID/Dataset_ID` with the Benchmarks ID or Dataset ID (e.g., `"IM-h-10x_PBMC-1087-10x-2017"`). The default download folder is `./datasets`. You can change the data folder by passing a new value to the parameter `data_folder`.

For public Benchmarks and datasets, the downloaded file is in [AnnData](https://github.com/scverse/anndata) or [MuData](https://github.com/scverse/mudata) format. The raw counts are kept in `adata.X`. The processed data (normalized, imputed, ...) are stored in `adata.layers`.
```python
from oscb.data import DataLoader

# Download and process data at './datasets/'
adata = DataLoader("Benchmarks_ID/Dataset_ID", data_folder="./datasets/")
```

### Evaluators
#### OSCB Benchmarks
For Benchmarks procided by [single-cell.ai](https://www.single-cell.ai/), please replace `Benchmarks_ID` with the Benchmarks ID (e.g., `"IM-h-10x_PBMC-1087-10x-2017"`), and `denoised` with your denoised data (e.g., `adata.layer['denosied']` or `adata.obsm['denosied']`). To modify the method name, adjust the `method` parameter.
> [!IMPORTANT]
> The input types of `benchmarks_id` and `method` are `string`, while the input type of `denoised` is `{array-like, sparse matrix} of shape (n_samples, n_features)`.
```python
from oscb.evaluator import eval, write_json

results_dict = eval(adata, benchmarks_id="Benchmarks_ID", denoised=adata.layer['denosied'], method="Your method")
```
> [!TIP]  
> If a `benchmarks_id` is specified, OSCB will automatically generate a bar chart to visually compare the performance of the user's method against established benchmark approaches.
> <div align="center">
> <img src="/images/evaluator/imputation_evaluation.png">
> </div>

#### User's Datasets
To utilize `eval()`, whether loading a dataset within [single-cell.ai](https://www.single-cell.ai/) via its ID or using your own, you must supply the `task` type (e.g., `"Imputation"`  or `"IM"` for short), and `denoised` (e.g., `adata.layer['denosied']` or `adata.obsm['denosied']`); the method name can be customized via the `method` parameter.
> [!IMPORTANT]
> The input types of `task` and `method` are `string`, while the input type of `denoised` is `{array-like, sparse matrix} of shape (n_samples, n_features)`.
```python
from oscb.evaluator import eval, write_json

results_dict = eval(adata, task='Imputation', denoised=adata.layer['denosied'], method="Your method")
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
<img src="/images/evaluator/imputation_utilization.png">
</div>

<hr/>

## References
[^1]: Batson, Joshua, and Loic Royer. "Noise2self: Blind denoising by self-supervision." International conference on machine learning. PMLR, 2019.
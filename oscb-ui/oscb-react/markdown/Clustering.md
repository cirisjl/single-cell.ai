## Task Info
<div align="center">
<img src="/images/evaluator/Clustering.png">
</div>

In single-cell analysis, Clustering is a critical step to identify distinct cell types or states within a heterogeneous sample. The process begins with a gene expression matrix (**step 1**), detailing expression levels for thousands of genes across individual cells. To manage this high-dimensional data, dimensionality reduction techniques like PCA, UMAP or t-SNE (**step 2**) are applied, projecting cells into a 2D or 3D space while preserving transcriptional similarities. Finally, Clustering algorithms (**step 3**) group these projected cells into distinct clusters, where each cluster represents a population of cells with similar gene expression profiles, allowing for the identification and annotation of unique cell types (e.g., T Cells, B Cells, Macrophages, Neurons) from the original sample.

<hr/>

## Metrics

We use cell-type as Clustering ground truth, and compare it with the predicted Clustering.

* **ARI:** The Adjusted Rand Index [^1] quantifies the congruence between a derived Clustering solution and a predefined ground truth (e.g., cell types), factoring in chance agreement. It delivers a score between 0 (random assignment) and 1 (perfect concordance), reflecting both accurate inclusions and exclusions across partitions.

* **FMI:** The Fowlkes-Mallows Index [^2] assesses the fidelity of a Clustering result against a reference classification, e.g., cell type. Defined as the geometric mean of precision and recall, it evaluates how effectively a predicted Clustering identifies relevant cells (precision) and captures all pertinent instances (recall). Its values span from 0 to 1.

* **Silhouette:** The Silhouette Score [^3] provides an intrinsic evaluation of Clustering quality, independent of external labels. It measures the degree of similarity within clusters versus dissimilarity between clusters, with values ranging from -1 (indicating poor cluster separation) to +1 (denoting highly cohesive and distinct clusters).

* **NMI:** Normalized Mutual Information [^4] gauges the statistical dependence between a predicted Clustering and a known categorical variable, normalizing by the average entropy of both distributions. This metric ranges from 0 (statistical independence) to 1 (perfect correlation), indicating the shared information content between the two partitions.

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

<hr/>

## References
[^1]: Hubert, L., & Arabie, P. (1985). Comparing partitions. Journal of Classification, 2(1), 193–218. https://doi.org/10.1007/bf01908075
[^2]: E. B. Fowkles and C. L. Mallows, 1983. “A method for comparing two hierarchical clusterings”. Journal of the American Statistical Association
[^3]: Peter J. Rousseeuw (1987). “Silhouettes: a Graphical Aid to the Interpretation and Validation of Cluster Analysis”. Computational and Applied Mathematics 20: 53-65.
[^4]: Luecken, M. D., Büttner, M., Chaichoompu, K., Danese, A., Interlandi, M., Mueller, M. F., Strobl, D. C., Zappia, L., Dugas, M., Colomé-Tatché, M., & Theis, F. J. (2021). Benchmarking atlas-level data integration in single-cell genomics. Nature Methods, 19(1), 41–50. https://doi.org/10.1038/s41592-021-01336-8
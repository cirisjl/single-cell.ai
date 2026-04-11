## Task Info
<div align="center">
<img src="/images/evaluator/Cell_Type_Annotation.png">
</div>

In the intricate world of single-cell analysis, identifying the distinct types of cells present in a biological sample is a foundational step, often likened to a "Cellular Detective" or "Librarian" at work. Initially, computational methods like clustering group cells into distinct populations based on their gene expression profiles, but these clusters remain anonymous "mystery books" or "unsorted books" without assigned biological identities. Cell type annotation is the critical process of assigning meaningful labels—such as T cells, B cells, or macrophages—to these anonymous clusters. This "Annotation Magic" is achieved by comparing the molecular fingerprints of each cluster, often specific marker genes, against known biological references. By carefully sorting and cataloging these cellular identities, we transform raw, uncharacterized data into a rich, interpretable map of the cellular landscape, unlocking profound insights into biological processes, disease mechanisms, and therapeutic targets.

<hr/>

## Metrics

Metrics for cell type annotation quantify how accurately clusters match known cell types, ensuring consistency and distinctiveness. These measures are crucial for validating annotations, comparing methods, and guaranteeing the reliability of biological insights.

* **Accuracy:** Accuracy [^1] measures how well computationally assigned cell types match their true biological identities. It's often calculated as the proportion of correctly classified cells compared to a known reference.

* **F1 macro:** F1 macro [^1] is an evaluation metric that averages the F1-score (harmonic mean of precision and recall) for each cell type. It's especially useful for imbalanced datasets, giving equal weight to the annotation quality of both common and rare cell types.

* **F1 micro:** F1 micro [^1] calculates global precision and recall by summing true positives, false negatives, and false positives across all cell types before computing the F1-score. This approach effectively weighs the performance by class frequency, giving more importance to the annotation accuracy of abundant cell types.

* **F1 weighted:** F1 weighted [^1] calculates the F1-score for each cell type and then averages them, but crucially, it weights each type's score by its proportion in the dataset. This offers a balanced performance view, considering class imbalance while still reflecting the impact of larger classes.

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

OSCB's primary advantages are its intuitive **data loaders**, designed for seamless dataset ingestion, and its standardized **evaluators**, which enable consistent and objective performance assessment across Cell Type Annotation methods.

### Data Loader
To load a dataset, please replace `Benchmarks_ID/Dataset_ID` with the Benchmarks ID or Dataset ID (e.g., `"CT-h-PBMC-11989-Adam-2022"`). The default download folder is `./datasets`. You can change the data folder by passing a new value to the parameter `data_folder`.

For public Benchmarks and datasets, the downloaded file is in [AnnData](https://github.com/scverse/anndata) or [MuData](https://github.com/scverse/mudata) format. The raw counts are kept in `adata.X`. The processed data (normalized, imputed, ...) are stored in `adata.layers`.
```python
from oscb.data import DataLoader

# Download and process data at './datasets/'
adata = DataLoader("Benchmarks_ID/Dataset_ID", data_folder="./datasets/")
```

### Evaluators
#### OSCB Benchmarks
For Benchmarks procided by [single-cell.ai](https://www.single-cell.ai/), please replace `Benchmarks_ID` with the Benchmarks ID (e.g., `"CT-h-PBMC-11989-Adam-2022"`) and `labels_pred` with your cell label prediction (e.g., `adata.obs['scANVI_predicted']`). To modify the method name, adjust the `method` parameter.
> [!IMPORTANT]
> The input types of `benchmarks_id` is `string`, while `labels_pred` is `array-like of shape (n_samples,)`.
```python
from oscb.evaluator import eval, write_json

results_dict = eval(benchmarks_id="Benchmarks_ID", labels_pred=labels_pred, method="Your method")
```
> [!TIP]  
> If a `benchmarks_id` is specified, OSCB will automatically generate a bar chart to visually compare the performance of the user's method against established benchmark approaches.
> <div align="center">
> <img src="/images/evaluator/cell_type_annotation_evaluation.png">
> </div>

#### User's Datasets
To utilize `eval()`, whether loading a dataset within [single-cell.ai](https://www.single-cell.ai/) via its ID or using your own, you must supply the `task` type (e.g., `"Cell Type Annotation"` or `"CT"` for short), true `labels`(e.g., `adata.obs['cell_type']`), `labels_pred` from your Cell Type Annotation (e.g., `adata.obs['scANVI_predicted']`); the method name can be customized via the `method` parameter.
> [!IMPORTANT]
> The input types of `task` is `string`, while `labels` and `labels_pred` are `array-like of shape (n_samples,)`.
```python
from oscb.evaluator import eval, write_json

results_dict = eval(task='Cell Type Annotation', labels=labels, labels_pred=labels_pred, method="Your method")
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
<img src="/images/evaluator/cell_type_annotation_utilization.png">
</div>

<hr/>

## References
[^1]: Grandini, M., Bagli, E., & Visani, G. (2020). Metrics for multi-class classification: An overview. arXiv. https://doi.org/10.48550/arxiv.2008.05756
## Task Info
<div align="center">
<img src="/images/evaluator/Cell-Cell_Communication.png">
</div>

Cell-cell communication is a fundamental biological process that enables cells to interact, coordinate, and orchestrate complex functions within tissues and organs. In the context of single-cell analysis, understanding these intricate dialogues has become paramount. By analyzing the diverse molecular signals exchanged between individual cells, bioinformatics approaches can decipher the "biological symphony" — identifying which cell types are the "orchestra sections," what "molecular instruments" (ligand-receptor pairs) they "play," and how their "musical scores" (signaling pathways) lead to a harmonious or sometimes discordant biological outcome. This allows researchers to construct an "inferred network" or "grand score" of interactions, revealing the dynamic social landscape of cells and providing crucial insights into developmental processes, disease progression, and therapeutic interventions.

<hr/>

## Metrics

When assessing Cell-Cell Communication (CCC), the Precision-Recall Area Under the Curve (AUC) offers a robust metric to evaluate the overall performance of a prediction model, particularly when dealing with imbalanced datasets where true communication events might be rare. It quantifies the trade-off between identifying relevant interactions (precision) and finding all relevant interactions (recall) across various thresholds. Complementing this, the Odds Ratio provides a straightforward measure to quantify the association between two cell types communicating via a specific ligand-receptor pair, indicating how much more likely an interaction is to occur between those specific cell types compared to random chance.

A workflow for creating Cell-Cell Communication benchmarks is available on [single-cell.ai](https://www.single-cell.ai/), where cell type label is stored in `adata.obs` and CCC target is in `adata.uns["ccc_target"]`.

* **Odds Ratio:** The Odds Ratio [^1] quantifies the strength of association between two cell types communicating through a specific ligand-receptor pair. It indicates how much more likely an interaction is to occur between those particular cell types compared to other cell-type combinations, providing a clear measure of the specificity and enrichment of a communication link. A high odds ratio suggests a strong and specific communicative relationship, highlighting potentially crucial biological pathways.

* **Precision-recall AUC:** The Precision-Recall Area Under the Curve (AUC) [^2] evaluates the accuracy of CCC predictions by balancing precision (correct predictions among all positive predictions) and recall (correct predictions among all actual positives). It is particularly useful for single-cell data where true communication events might be rare, with a higher AUC indicating more reliable identification of true interactions.

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

OSCB's primary advantages are its intuitive **data loaders**, designed for seamless dataset ingestion, and its standardized **evaluators**, which enable consistent and objective performance assessment across cell-cell_communication methods.

### Data Loader
To load a dataset, please replace `Benchmarks_ID/Dataset_ID` with the Benchmarks ID or Dataset ID (e.g., `"CCC-m-10x_Brain-14249-Tasic-2016"`). The default download folder is `./datasets`. You can change the data folder by passing a new value to the parameter `data_folder`.

For public Benchmarks and datasets, the downloaded file is in [AnnData](https://github.com/scverse/anndata) or [MuData](https://github.com/scverse/mudata) format. The raw counts are kept in `adata.X`. The processed data (normalized, imputed, ...) are stored in `adata.layers`.
```python
from oscb.data import DataLoader

# Download and process data at './datasets/'
adata = DataLoader("Benchmarks_ID/Dataset_ID", data_folder="./datasets/")
```

### Evaluators
#### OSCB Benchmarks
For Benchmarks procided by [single-cell.ai](https://www.single-cell.ai/), please replace `Benchmarks_ID` with the Benchmarks ID (e.g., `"CCC-m-10x_Brain-14249-Tasic-2016"`), and `ccc_pred` with your CCC prediction (e.g., `adata.uns['Your method']`). To modify the method name, adjust the `method` parameter.
> [!IMPORTANT]
> The input types of `benchmarks_id` and `method` are `string`, while the input type of `ccc_pred` is `pandas.core.frame.DataFrame` with columns "**source**", "**target**", and "**score**" for **source-target** prediction or "**ligand**", "**target**", and "**score**" for **ligand-target** prediction as shown below:
> <div align="center" style="display: flex">
> <figure><img src="/images/evaluator/ccc_st_format.png"><figcaption>Source-Target</figcaption></figure>
> <figure><img src="/images/evaluator/ccc_lt_format.png"><figcaption>Ligand-Target</figcaption></figure>
> </div>
```python
from oscb.evaluator import eval, write_json

results_dict = eval(adata, benchmarks_id="Benchmarks_ID", ccc_pred=ccc_pred, method="Your method")
```
> [!TIP]  
> If a `benchmarks_id` is specified, OSCB will automatically generate a bar chart to visually compare the performance of the user's method against established benchmark approaches.
> <div align="center">
> <img src="/images/evaluator/cell-cell_communication_evaluation.png">
> </div>

#### User's Datasets
To utilize `eval()`, whether loading a dataset within [single-cell.ai](https://www.single-cell.ai/) via its ID or using your own, you must supply the `task` type (e.g., `"Cell-Cell Communication"`  or `"CCC"` for short), your CCC prediction `ccc_pred` (e.g.,  `adata.uns['Your method']`), and ground truth `ccc_target` (e.g.,  `adata.uns['ccc_target']`); the method name can be customized via the `method` parameter.
> [!IMPORTANT]
> The input types of `benchmarks_id` and `method` are `string`, while the input type of `ccc_pred` and `ccc_target`are `pandas.core.frame.DataFrame` "**source**", "**target**", and "**score**" for **source-target** prediction or "**ligand**", "**target**", and "**score**" for **ligand-target** prediction as shown below:
> <div align="center" style="display: flex">
> <figure><img src="/images/evaluator/ccc_st_format.png"><figcaption>Source-Target</figcaption></figure>
> <figure><img src="/images/evaluator/ccc_lt_format.png"><figcaption>Ligand-Target</figcaption></figure>
> </div>
```python
from oscb.evaluator import eval, write_json

results_dict = eval(adata, task='Cell-Cell Communication', ccc_pred=ccc_pred, ccc_target=ccc_target, method="Your method")
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
<img src="/images/evaluator/cell-cell_communication_utilization.png">
</div>

<hr/>

## References
[^1]: Bland, J. M. (2000). Statistics notes: The odds ratio. BMJ, 320(7247), 1468–1468. https://doi.org/10.1136/bmj.320.7247.1468
[^2]: Davis, J., & Goadrich, M. (2006). The relationship between precision-recall and ROC curves. Proceedings of the 23rd International Conference on Machine Learning - ICML 06. https://doi.org/10.1145/1143844.1143874
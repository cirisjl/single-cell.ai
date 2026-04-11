## Task Info
<div align="center">
<img src="/images/evaluator/Multimodal_Data_Integration.png">
</div>

Single-Cell Multimodal Data Integration, illustrated by combining scRNA-seq and scATAC-seq data, is a vital bioinformatics process that addresses the limitations of single-assay views. While individual assays provide partial insights—like gene expression (scRNA-seq) or chromatin accessibility (scATAC-seq)—they often present as disconnected datasets ("Raw Data: Separate Views"). Through "Integration Magic: The Alchemist's Synthesis" advanced algorithms align and connect these disparate modalities, identifying shared biological patterns to create a "Unified Landscape" of "Integrated Data." This comprehensive map reveals a more complete biological identity for each cell, enabling holistic downstream analysis by linking gene expression to its underlying regulatory chromatin state.

<hr/>

## Metrics

Evaluating the success of Multimodal Data Integration relies on various metrics that assess three key aspects: how effectively batch effects are removed (quantifying the mixing of cells from different technical batches), how well biological signals (including ARI, ASW batch/label, Cell Cycle Conservation, cLISI, HVG overlap, Isolated label ASW, Isolated label F1 score, and NMI) are preserved (ensuring distinct cell types remain separated), and the quality of alignment between corresponding features across modalities. Together, these metrics provide a quantitative framework to compare and optimize different integration algorithms, ensuring the generated "unified landscape" is both technically clean and biologically meaningful.

A workflow for creating Multimodal Data Integration benchmarks is available on [single-cell.ai](https://www.single-cell.ai/), where cell type label and batch key are stored in `mdata.obs`.

* **ARI:** The Adjusted Rand Index [^1] quantifies the congruence between a derived clustering solution and a predefined ground truth (e.g., cell types), factoring in chance agreement. It delivers a score between 0 (random assignment) and 1 (perfect concordance), reflecting both accurate inclusions and exclusions across partitions.

* **ASW batch/label:** The Modified Average Silhouette Width (ASW) of batch/label [^1] uses the absolute silhouette width, computed for batch labels, and then transforms it with 1 - abs(ASW) to produce a final score between 0 and 1, where 1 signifies optimal batch mixing and 0 signifies strong batch effects.

* **Cell Cycle Conservation:** The Cell-Cycle Conservation score [^1] quantifies the extent to which cell-cycle influence is retained throughout the integration process.

* **cLISI:** Cell-type Local Inverse Simpson Index [^1] evaluates how well biological cell types are preserved and separated after integration. A low cLISI score (approaching 1) for a cell indicates that its local neighborhood is predominantly composed of cells belonging to the same cell type, signaling that the integration successfully maintains cell type identity and separation. Conversely, a high cLISI would imply that distinct cell types are erroneously mixed together locally.

* **Graph Connectivity:** Graph Connectivity [^1] assesses how well the local neighborhood relationships and the overall structure of biological populations are maintained or recovered after multimodal data integration. A good integration method should yield a high graph connectivity score, indicating that true biological relationships among cells are preserved and strengthened across different batches.

* **HVG overlap:** HVG overlap [^1] refers to the degree of commonality in the set of highly variable genes (HVGs) identified before and after a specific data processing step in single-cell RNA sequencing (scRNA-seq) analysis, most commonly multimodal data integration. A high overlap indicates that the integration method has effectively preserved the true biological signal of cellular heterogeneity, as evidenced by the consistent identification of highly variable genes before and after correction.

* **Isolated label ASW:** Isolated Label ASW [^1] assesses the method's ability to correctly identify and preserve unique cell populations that are only found in a single batch. A high score for this metric suggests that the integration process respects these unique biological signals, allowing them to form distinct clusters in the combined dataset.

* **Isolated label F1 score:** The Isolated label F1 score [^1] is a metric that assesses how accurately rare or batch-specific cell populations, termed "isolated labels," are identified and grouped after single-cell data integration. It combines precision and recall to quantify the model's ability to correctly assign these unique cell types. A high score indicates successful preservation and resolution of these critical, often low-abundance, biological populations amidst integration.

* **kBET:** kBET (k-nearest neighbor Batch Effect Test) [^2] is a statistical metric used to quantify the success of batch effect removal in single-cell RNA sequencing data. It assesses local batch mixing by comparing the observed distribution of batch labels in a cell's neighborhood to the expected distribution. A low kBET rejection rate indicates effective multimodal data integration, signifying that cells from different batches are well-intermingled locally.

* **NMI:** * **NMI:** Normalized Mutual Information [^1] gauges the statistical dependence between a predicted clustering and a known categorical variable, normalizing by the average entropy of both distributions. This metric ranges from 0 (statistical independence) to 1 (perfect correlation), indicating the shared information content between the two partitions.

* **PC Regression:** PC Regression [^1] evaluates multimodal data integration by performing linear regression of batch labels onto the principal components of the integrated data. A low R-squared value indicates effective batch effect removal, as the integrated principal components no longer strongly capture batch-specific variation.

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

OSCB's primary advantages are its intuitive **data loaders**, designed for seamless dataset ingestion, and its standardized **evaluators**, which enable consistent and objective performance assessment across imputation methods.

### Data Loader
To load a dataset, please replace `Benchmarks_ID/Dataset_ID` with the Benchmarks ID or Dataset ID (e.g., `"MI-h-sci_CAR_Cell_Line-4739-Cao-2018"`). The default download folder is `./datasets`. You can change the data folder by passing a new value to the parameter `data_folder`.

For public Benchmarks and datasets, the downloaded file is in [AnnData](https://github.com/scverse/anndata) or [MuData](https://github.com/scverse/mudata) format. The raw counts are kept in `adata.X`. The processed data (normalized, imputed, ...) are stored in `adata.layers`.
```python
from oscb.data import DataLoader

# Download and process data at './datasets/'
adata = DataLoader("Benchmarks_ID/Dataset_ID", data_folder="./datasets/")
```

### Evaluators
#### OSCB Benchmarks
For Benchmarks procided by [single-cell.ai](https://www.single-cell.ai/), please replace `mdata` with your integrated `MuData`, `Benchmarks_ID` with the Benchmarks ID (e.g., `"MI-h-sci_CAR_Cell_Line-4739-Cao-2018"`), and `embedding_key` with the key in `mdata.obsm` for integrated embedding (e.g., `mdata.obsm['X_multivi']`). To modify the method name, adjust the `method` parameter.
> [!IMPORTANT]
> The input types of `benchmarks_id`, `embedding_key` and `method` are `string`, while the input type of `mdata` is `MuData`. 
```python
from oscb.evaluator import eval, write_json

results_dict = eval(mdata=mdata, embedding_key="X_multivi", benchmarks_id="Benchmarks_ID", method="Your method")
```
> [!TIP]  
> If a `benchmarks_id` is specified, OSCB will automatically generate a bar chart to visually compare the performance of the user's method against established benchmark approaches.
> <div align="center">
> <img src="/images/evaluator/multimodal_data_integration_evaluation.png">
> </div>

#### User's Datasets
To utilize `eval()`, whether loading a dataset within [single-cell.ai](https://www.single-cell.ai/) via its ID or using your own, you must supply the integtared `mdata`, `task` type (e.g., `"Multimodal Data Integration"`  or `"MI"` for short), `mod1_key` in `mdata.mod` for scRNA-seq (e.g., `rna`), `batch_key` in `mdata.obs` (e.g., `batch`), `label_key` in `mdata.obs` (e.g., `cell_type`), and `species` (e.g., `human` or `mouse`); the method name can be customized via the `method` parameter.
> [!IMPORTANT]
> The input types of `mdata` and is `MuData`. The input types of `task`, `mod1_key`, `batch_key`, `label_key`, `species` and `method` are `string`.
```python
from oscb.evaluator import eval, write_json

results_dict = eval(mdata=mdata, task="Multimodal Data Integration", embedding_key="X_multivi", mod1_key="rna", batch_key="batch", label_key="cell_type", species="human", method="Your method")
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
<img src="/images/evaluator/multimodal_data_integration_utilization.png">
</div>

<hr/>

## References
[^1]: Luecken, M. D., Büttner, M., Chaichoompu, K., Danese, A., Interlandi, M., Mueller, M. F., Strobl, D. C., Zappia, L., Dugas, M., Colomé-Tatché, M., & Theis, F. J. (2021). Benchmarking atlas-level data integration in single-cell genomics. Nature Methods, 19(1), 41–50. https://doi.org/10.1038/s41592-021-01336-8
[^2]: Büttner, M., Miao, Z., Wolf, F. A., Teichmann, S. A., & Theis, F. J. (2018). A test metric for assessing single-cell RNA-seq batch correction. Nature Methods, 16(1), 43–49. https://doi.org/10.1038/s41592-018-0254-1
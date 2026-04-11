## Task Info
<div align="center">
<img src="/images/evaluator/Trajectory.png">
</div>

Single-cell trajectory inference is a powerful computational approach used in bioinformatics to reconstruct the continuous biological processes undergone by individual cells, such as differentiation, development, or response to stimuli. Beginning with seemingly scattered individual cell data points, as depicted in the "Raw Data: Scattered Chapters" where cells appear as disordered snapshots, algorithms act as a "scribe," weaving together a coherent narrative by ordering cells along their latent biological progression. This "Trajectory Magic" transforms a static collection of cells into a dynamic "Inferred Trajectory," a roadmap that reveals developmental paths, transient cell states, and the underlying biological storyline, providing crucial insights into cellular differentiation and disease mechanisms.

<hr/>

## Metrics

In single-cell trajectory inference, assessing the quality and biological interpretability of the inferred paths is crucial, and this often relies on a variety of metrics. These metrics can be broadly categorized into those that evaluate the topological accuracy of the trajectory (how well it reflects known branching events or temporal ordering), the robustness of the inference to noise or parameter choices, and the biological relevance of the inferred cell states and transitions.

A workflow for creating Trajectory benchmarks is available on [single-cell.ai](https://www.single-cell.ai/), where Cell Type Label is stored in `adata.obs`, Trajectory Label, and Origin Group are in `adata.uns`.

* **Graph Edit Distance:** Graph Edit Distance (GED) [^1] quantifies the dissimilarity between two graphs by calculating the minimum number of fundamental graph operations (like adding/deleting nodes or edges, or relabeling them) needed to transform one graph into the other. Each operation has an associated cost, and the total GED is the sum of costs for the optimal sequence of transformations. In single-cell trajectory inference, GED can compare an inferred developmental roadmap (as a graph) against a known ground truth or another inferred trajectory, providing a robust metric for topological accuracy.

* **Graph Kernel Score:** Graph Kernel Score [^2] is a method for measuring similarity between graphs without explicitly calculating a costly distance like GED. Instead, it embeds graphs into a feature space where their similarity can be efficiently computed using a kernel function, often by counting substructures like paths or walks. This approach allows for efficient comparison of inferred trajectories or other biological networks, even for large datasets, by transforming the comparison into a more tractable dot product operation in the feature space.

* **Jaccard Similarity Coefficient:** The Jaccard Similarity Coefficient [^3] is a simple yet effective metric for comparing the similarity and diversity of sample sets. It is calculated as the size of the intersection of two sets divided by the size of their union. In the context of trajectory inference, it can be used to compare the overlap of cell populations assigned to specific branches or clusters across different inferred trajectories or between an inferred trajectory and a ground truth, indicating how consistently cells are grouped together.

* **Tree Edit Distance:** Tree Edit Distance (TED) [^4] is a specific application of graph edit distance tailored for trees, quantifying the dissimilarity between two ordered or unordered trees by determining the minimum cost sequence of node edits (insertions, deletions, and relabelings) required to transform one tree into another. Each edit operation is assigned a cost, and the total TED reflects the structural and label differences between the trees. In single-cell trajectory analysis, TED can be particularly useful for comparing inferred branching developmental trees against known hierarchies or other inferred trees, providing a direct measure of their topological and lineage-assignment similarity.

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

OSCB's primary advantages are its intuitive **data loaders**, designed for seamless dataset ingestion, and its standardized **evaluators**, which enable consistent and objective performance assessment across trajectory methods.

### Data Loader
To load a dataset, please replace `Benchmarks_ID/Dataset_ID` with the Benchmarks ID or Dataset ID (e.g., `"TJ-Planaria-Droplet_Planarian-18837-Mireya-2018"`). The default download folder is `./datasets`. You can change the data folder by passing a new value to the parameter `data_folder`.

For public Benchmarks and datasets, the downloaded file is in [AnnData](https://github.com/scverse/anndata) or [MuData](https://github.com/scverse/mudata) format. The raw counts are kept in `adata.X`. The processed data (normalized, imputed, ...) are stored in `adata.layers`.
```python
from oscb.data import DataLoader

# Download and process data at './datasets/'
adata = DataLoader("Benchmarks_ID/Dataset_ID", data_folder="./datasets/")
```

### Evaluators
#### OSCB Benchmarks
For Benchmarks procided by [single-cell.ai](https://www.single-cell.ai/), please replace `Benchmarks_ID` with the Benchmarks ID (e.g., `"TJ-Planaria-Droplet_Planarian-18837-Mireya-2018"`), and `traj` with your trajectory inference (e.g., `adata.uns['trajectory']`). To modify the method name, adjust the `method` parameter.
> [!IMPORTANT]
> The input types of `benchmarks_id` and `method` are `string`, while the input type of `traj` is `pandas.core.frame.DataFrame` with columns "**from**", "**to**", and "**length**" as shown below:
> <div align="center" style="display: flex">
> <img src="/images/evaluator/traj_format.png">
> </div>
```python
from oscb.evaluator import eval, write_json

results_dict = eval(adata, benchmarks_id="Benchmarks_ID", traj=traj, method="Your method")
```
> [!TIP]  
> If a `benchmarks_id` is specified, OSCB will automatically generate a bar chart to visually compare the performance of the user's method against established benchmark approaches.
> <div align="center">
> <img src="/images/evaluator/trajectory_evaluation.png">
> </div>

#### User's Datasets
To utilize `eval()`, whether loading a dataset within [single-cell.ai](https://www.single-cell.ai/) via its ID or using your own, you must supply the `task` type (e.g., `"Trajectory"`  or `"TJ"` for short), `traj` with your trajectory inference (e.g., `adata.uns['trajectory']`), `bm_traj` with your trajectory ground truth (e.g., `adata.uns['benchmark_traj']`), and `root_node` with your origin group (e.g., `'neoblast 1'`); the method name can be customized via the `method` parameter.
> [!IMPORTANT]
> The input types of `task`, `root_node` and `method` are `string`, while the input type of `traj` and `bm_traj` are `pandas.core.frame.DataFrame` with columns "**from**", "**to**", and "**length**" as shown below:
> <div align="center" style="display: flex">
> <img src="/images/evaluator/traj_format.png">
> </div>
```python
from oscb.evaluator import eval, write_json

results_dict = eval(adata, task="Trajectory", traj=traj, bm_traj=bm_traj, root_node=root_node, method="Your method")
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
<img src="/images/evaluator/trajectory_utilization.png">
</div>

<hr/>

## References
[^1]: Sanfeliu, Alberto; Fu, King-Sun (1983). "A distance measure between attributed relational graphs for pattern recognition". IEEE Transactions on Systems, Man, and Cybernetics. 13 (3): 353–363. doi:10.1109/TSMC.1983.6313167. S2CID 1087693.
[^2]: S.V. N. Vishwanathan; Nicol N. Schraudolph; Risi Kondor; Karsten M. Borgwardt (2010). "Graph kernels". Journal of Machine Learning Research. 11: 1201–1242.
[^3]: [Wikipedia entry for the Jaccard index](https://en.wikipedia.org/wiki/Jaccard_index#Jaccard_index_in_binary_classification_confusion_matrices).
[^4]: T. Hütter, M. Pawlik, R. Löschinger, N. Augsten. Effective Filters and Linear Time Verification for Tree Similarity Joins. ICDE, 2019.

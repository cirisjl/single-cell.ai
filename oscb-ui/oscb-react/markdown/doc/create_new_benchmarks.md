# Create New Benchmarks

> [!CAUTION]
> Only **Admin Users** can create new benchmarks.

<hr/>

## Upload a New Dataset

To create **benchmarks**, first **upload your datasets**. You can upload files from your **device**, **cloud storage** (e.g., Google Drive or OneDrive), or via a **direct link**.

Then, provide a `title` and specify the `species` for the dataset.

> [!IMPORTANT]
> Accepted Formats for Single-file Datasets: **csv, tsv, txt, txt.gz, h5ad, rds, h5, hdf5, h5ad, h5mu, h5seurat, Robj, zip, gz**
> All file formats will be automatically converted to `AnnData` or `MuData` format.
> Standard File Structure for Multi-file Datasets:
>* Molecules(txt) + Annotation(txt)
>* Barcodes(Alias name: cells, extension:tsv) + Genes(Alias name: genes, extension:tsv) + Matrix(mtx)
>* Barcodes(Alias name: cells, extension:tsv.gz) + Genes(Alias name: genes, extension:tsv.gz) + Matrix(mtx.gz)
>* Barcodes(Alias name: cells, extension:tsv) + Features(Alias name: features, extension:tsv) + Matrix(mtx)
>* Barcodes(Alias name: cells, extension:tsv.gz) + Features(Alias name: features, extension:tsv.gz) + Matrix(mtx.gz)

<div align="center">
<img src="/images/doc/benchmark_upload.png" width="80%">
</div>

<hr/>

### Quality Control (QC)

**Benchmark QC methods** include `Scanpy` [^1] for Python-formatted files and `Seurat` [^2] for R-formatted files.
 Parameters include `min genes`, `max genes`, `min cells`, `Highly Variable Genes (HVG)`, `expected doublet rate`, and `regress cell cycle`. This task removes low-quality cells, annotates doublets and outliers, regresses cell cycle effects, and computes HVGs.

 Choose **"Load Metadata"** if QC has been performed on the dataset. 

> [!TIP] 
> `min_genes` (Minimum Genes per Cell): Cells with very few detected genes are likely to be low-quality (e.g., dying cells, empty droplets, or cells that failed lysis/capture). These cells provide little to no useful biological information and can skew analyses. Setting a min_genes threshold removes these data-poor observations.
> + **Typical Range**: Often set to **200-500** genes.
>
> `max_genes` (Maximum Genes per Cell): Cells with an excessively high number of detected genes might indicate a doublet (two or more cells captured as one) or a stressed/apoptotic cell that has lost membrane integrity and is "leaking" RNA. Very high counts can also sometimes indicate technical artifacts. Removing these helps isolate single, healthy cells.
> + **Typical Range**: This is highly dataset-dependent and often determined by looking at the distribution of genes per cell, usually **2500-6000** genes for typical human/mouse cells.
>
> `min_cells` (Minimum Cells Expressing a Gene): Genes detected in only one or a very small number of cells are often noisy, lowly expressed, or technical artifacts. Including them increases computational burden without providing much discriminatory power for identifying cell types or states. Removing them focuses the analysis on more reliably detected and informative genes.
> + **Typical Range**: Often set to **3-20** cells.
>
> `Highly Variable Genes (HVG)`: Not all genes are equally informative for distinguishing cell types or states. HVGs are genes whose expression varies significantly more than expected by chance across the cell population, after accounting for technical noise (e.g., mean-variance relationship). Focusing on HVGs:
> + **Reduces Dimensionality**: Filters out uninformative genes, simplifying the dataset.
> + **Removes Noise**: Prioritizes genes with true biological variation over technical variation.
> + **Improves Signal Detection**: Enhances the ability of dimension reduction and clustering algorithms to identify distinct cell populations.
>
> `Expected doublet rate`: Doublets (or multiplets) occur when two or more cells are captured in the same droplet/well. These are undesirable because they represent a mixture of cell types, obscuring true single-cell biology and creating artificial cell populations in dimension reduction plots and clustering results. The expected doublet rate (usually provided by the sequencing chemistry vendor or estimated from cell loading density) informs doublet detection algorithms (like DoubletFinder, scrublet) about the approximate proportion of doublets to expect.
> + **Purpose**: Helps these algorithms identify and remove suspected doublets more accurately, based on known experiment characteristics. 
> + **Impact**: Improves the purity of single-cell populations for analysis.

<div align="center">
<img src="/images/doc/benchmark_qc.png" width="80%">
</div>

<hr/>

**Clustering and Visualization**:
+ `n_neighbors` (Number of Neighbors): How many nearby cells are considered when building the graph for dimension reduction (e.g., UMAP) and clustering.
    - **Effect**: Small values emphasize **local details (more fragmented clusters/embedding)**; large values emphasize **global structure (more cohesive)**.
+ `Resolution`: A parameter for graph-based clustering (e.g., Leiden/Louvain) that controls cluster granularity.
    - **Effect**: Small values yield fewer, larger clusters; large values yield more, smaller clusters (more subtypes).

> [!TIP]  
> The "default" value of `resolution` is often **0.5 or 1.0**, but it's a parameter that needs to be tuned based on the biological question and the expected heterogeneity of the dataset.

<div align="center">
<img src="/images/doc/benchmark_clustering.png" width="80%">
</div>

<hr/>

### Monitoring and Results

A **live log** will be provided during execution.

For result evaluation, the system generates **2D/3D UMAP**, **t-SNE**, **violin plots**, **scatter plots**, and **highest-expression gene plots**.

<div align="center">
<img src="/images/doc/benchmark_qc_results.png" width="80%">
</div>

<hr/>

### Metadata

Fill out the dataset metadata form. For fields like “Organ Part,” you can search existing options or create new ones. This searchable, creatable field reduces duplication and simplifies data entry.

Once submitted, the dataset can be found on **"[My Datasets](https://single-cell.ai//mydata)"** page (see **Doc → Data Management** for details).

<div align="center">
<img src="/images/doc/metadata.png" width="80%">
</div>

<hr/>

## Benchmark Task Builder

### Select a Dataset

Select data through the dataset browser. You can select one dataset at a time

A dataset may include multiple processed results—use the **“+”** icon to expand it and choose a processed file from another tool or workflow.

<div align="center">
<img src="/images/doc/benchmark_dataset.png" width="80%">
</div>

<hr/>

### Config Benchmark Settings

**Step 1:** Select a **benchmark task type**.

**Step 2:** Choose additional parameters, such as **`Cell Type Label`** for a **Cell Type Annotation** task.

**Step 3 (optional):** Split your dataset into **train**, **validation**, and **test** sets.
Most single-cell tasks use **self-supervised learning** for embeddings, where the **training data** also serves as the **test data**.

<div align="center">
<img src="/images/doc/benchmark_taskbuilder.png" width="80%">
</div>

<hr/>

### Run Benchmarks

The next step is to **run benchmarks** on the selected methods.
After completion, the system will generate a **bar chart** for performance evaluation and a **line chart** for computational assessments.

<div align="center">
<img src="/images/doc/benchmark_results.png" width="80%">
</div>

<hr/>

## References
[^1]: Wolf FA, Angerer P, Theis FJ (2018) SCANPY: large-scale single-cell gene expression data analysis. Genome Biol 19:15. https://doi.org/10.1186/s13059-017-1382-0
[^2]: Satija R, Farrell JA, Gennert D, et al (2015) Spatial reconstruction of single-cell gene expression data. Nat Biotechnol 33:495–502. https://doi.org/10.1038/nbt.3192
# Tools

<hr/>

## Tasks

To standardize single-cell data from diverse sources, we developed a data adapter that converts various formats into the most widely used ones—`AnnData`, `MuData`, `Seurat object`, and `SingleCellExperiment object`—supporting both Python and R platforms. This bridges the ecosystem gaps among `scVerse` [^1], `Seurat` [^2], and `Bioconductor` [^3], allowing users to apply cross-platform methods seamlessly.

We also evaluated and selected tools based on their performance in trusted publications and established best practices.
- **Quality Control**: `Bioconductor` [^3], `Scanpy` [^4], `Seurat` [^2], and `Dropkick` [^5]
- **Imputation**: `MAGIC` [^6] and `SAVER` [^7]
- **Normalization**: `LogCPM`, `LogCP10K`, `sctransform` [^8], `DEseq2` [^9], `scran`, `TMM`, `RLE`, `UpperQuartile` [^10], `TPM`, `FPKM` [^11], and `Pearson_Residuals` [^4]
- **Integration**: `Seurat` [^2], `Harmony` [^12], `Liger` [^13], and `scVI` [^14]
- **Annotation**: `CellTypist` [^15], `scANVI` [^14], and `SingleR` [^16]
- **Formatting**: `AnnData`, `Seurat` [^2], `SingleCellExperiment` and `csv`
- **Visualization**: `UAMP` and `t-SNE`

> [!TIP] 
> Below is a summary of common single-cell RNA-seq normalization methods and guidance on when to use each.
> | **Method**            | **Description**                                                                                 | **When to Use**                                             | **Tools / Packages**         |
> | --------------------- | ----------------------------------------------------------------------------------------------- | ----------------------------------------------------------- | ---------------------------- |
> | **LogCPM**            | Scales raw counts per million and applies log transformation.                                   | Simple, fast, and widely supported normalization.           | `edgeR` [^10], `Scanpy`  [^4]           |
> | **LogCP10K**          | Scales counts to 10,000 per cell (Seurat style).                                                | Standard in Seurat pipelines.                               | `Seurat::NormalizeData`      |
> | **sctransform**       | Uses regularized negative binomial regression to remove technical noise and stabilize variance. | High-quality, variance-stabilized normalization.            | `Seurat (SCTransform)` [^2]       |
> | **DESeq2**            | Uses the median ratio method to estimate size factors and correct library size differences.     | Bulk-like scRNA data or pseudobulk differential expression. | `DESeq2` [^9]                     |
> | **scran**             | Pools cells to estimate size factors, handling sparsity and variability.                        | Sparse data with cell-specific biases.                      | `scran::computeSumFactors`   |
> | **TMM**               | Trims extreme log-fold changes to correct composition bias.                                     | Datasets with composition bias (mostly bulk RNA-seq).       | `edgeR` [^10]                      |
> | **RLE**               | Centers each gene’s expression around its median across samples.                                | When most genes have similar expression levels.             | `DESeq2` [^9]                    |
> | **UpperQuartile**     | Scales counts by the upper quartile of expression per cell.                                     | Simple method less affected by highly expressed genes.      | —                            |
> | **TPM**               | Normalizes for sequencing depth and gene length.                                                | Comparing expression *within* a sample.                     | Common in bulk RNA-seq tools |
> | **FPKM**              | Normalizes per kilobase and per million mapped reads.                                           | Legacy bulk RNA-seq (not for UMI-based scRNA).              | —                            |
> | **Pearson Residuals** | Uses residuals from a negative binomial model for variance stabilization.                       | Advanced modeling (e.g., `scTransform`, `scVI`).            | `Scanpy` [^4], `Seurat` [^2]           |

> [!CAUTION]  
> Avoid using `FPKM/TPM` for **UMI-based scRNA-seq** — they are designed for bulk RNA-seq and don’t handle dropout sparsity well.

<hr/>

## Dataset(s)

To start using the tools, first upload your datasets (see **Doc → Data Management → Upload Data**). Then, select data through the dataset browser.

A dataset may include multiple processed results—use the **“+”** icon to expand it and choose a processed file from another tool or workflow.

By default, you can select one dataset at a time, except for **Integration** (which allows multiple datasets) and **Annotation** (which allows selecting a reference dataset).

<div align="center">
<img src="/images/doc/select_dataset.png" width="80%">
</div>

> [!TIP] 
> You can start from the result of your **previous process** (e.g., **QC**) by expanding the dataset and selecting the **subitem** generated by the last tool. 

<hr/>

## Parameters

### Quality Control
The Quality Control (QC) parameters include `min genes`, `max genes`, `min cells`, `Highly Variable Genes (HVG)`, `expected doublet rate`, and `regress cell cycle`. This task removes low-quality cells, annotates doublets and outliers, regresses cell cycle effects, and computes HVGs.

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
<img src="/images/doc/qc_param.png" width="80%">
</div>

### Integration
For Batch Integration, specify a `Batch Key` (e.g., "sample", "batch"). If samples are pooled, indicate the number of individual samples per batch to generate `pseudo-replicates`.

> [!TIP]  
> `Pseudo-replicates` are artificially created "replicates" generated from **pooled samples**, primarily used when true biological replicates are unavailable or when aiming to increase the effective sample size for robust statistical analysis, especially in batch integration.

> [!CAUTION]  
> **Not True Replicates**: It's crucial to remember that `pseudo-replicates` do not capture true biological variability between individual samples. They only reflect the variability inherent within the original pooled sample.
>
> **Risk of Overfitting**: If not used carefully, creating too many highly similar `pseudo-replicates` might lead the integration algorithm to overfit to the technical variation of that specific pooled sample.

<div align="center">
<img src="/images/doc/integration_param.png" width="80%">
</div>

### Annotation
For Cell Type Annotation, you must specify the `species`.

Additionally, provide:
- `CellTypist model` (if using `CellTypist`)
- `SingleR reference` (if using `SingleR`)
- `Reference dataset` for `CellTypist`, `SingleR`, and `scANVI` (if applicable, with `Cell Type Labels` included).

> [!CAUTION]  
> `Reference dataset` is required for `scANVI`.

> [!TIP]
> You may select multiple annotation tools at the same time.
>
> To improve annotation accuracy, use filters to select a reference dataset with similar organs or cell types. Closer cell type matches yield better results.

<div align="center">
<img src="/images/doc/annotation_param.png" width="80%">
</div>

### Clustering and Visualization

For visualization:
+ **Specify Representation**: Indicate the desired representation from AnnData.obsm or a specific layer.
+ `n_neighbors` (Number of Neighbors): How many nearby cells are considered when building the graph for dimension reduction (e.g., UMAP) and clustering.
    - **Effect**: Small values emphasize **local details (more fragmented clusters/embedding)**; large values emphasize **global structure (more cohesive)**.
+ `n_pcs` (Number of Principal Components): The number of dimensions kept after initial linear dimension reduction (PCA).
    - **Effect**: Too few can lose biological signal; too many can retain noise. Crucial for balancing signal and noise before further analysis.
+ `Resolution`: A parameter for graph-based clustering (e.g., Leiden/Louvain) that controls cluster granularity.
    - **Effect**: Small values yield fewer, larger clusters; large values yield more, smaller clusters (more subtypes).

> [!TIP]  
> The optimal number of **n_pcs** is often chosen by inspecting a "scree plot" (elbow plot) to find where the explained variance plateaus, or by considering components that explain a certain cumulative percentage of variance. It typically ranges from **20 to 50** for many datasets.
>
> The "default" value of **resolution** is often **0.5 or 1.0**, but it's a parameter that needs to be tuned based on the biological question and the expected heterogeneity of the dataset.

> [!CAUTION]  
> You can either use the indicated **representation** in `AnnData.obsm` or specify a **layer** in `AnnData.layers` to override the default `AnnData.X`.

<div align="center">
<img src="/images/doc/visualization_param.png" width="80%">
</div>

<hr/>

## Job Tracking

Once job is submitted, it will be queued and processed on backend. You can leave your current page and track your job status and retrieve the results on **"My Jobs"** page (see **"Job Management"**).

> [!NOTE]  
> Single-cell research generates massive datasets. We optimize storage and processing by using a deduplication strategy. Each file is assigned a unique **MD5 hash** based on its **content, process, method, and parameters**. If a matching hash exists, we retrieve the precomputed result, saving significant time and computational resources.

<hr/>

## Task Results and Data Storage

All task outputs are provided in **`AnnData`** or **`MuData`** format. You can convert them into other formats anytime using the built-in **Formatting Tool (Toolos → Formatting → Convert)**.

### Quality Control
Quality control results include both cell- and gene-level metadata:

- **Cell metadata:** `AnnData.obs`  
- **Gene metadata:** `AnnData.var`  
- **Raw counts:** `AnnData.layers["raw_counts"]`

### Imputation

Imputed data are stored by the imputation method name:
- **Format:** `AnnData.layers["method"]`  
- **Examples:**  
  - `AnnData.layers["MAGIC"]`  
  - `AnnData.layers["SAVER"]`

### Normalization
Normalized data are stored by normalization method name:

- **Format:** `AnnData.layers["method"]`  
- **Examples:**  
  - `AnnData.layers["LogCPM"]`  
  - `AnnData.layers["sctransform"]`

### Integration
Integration outputs depend on the selected method:

- **scVI, Harmony:** `AnnData.obsm`  
- **Seurat, LIGER:** `AnnData.X`

### Annotation
Predicted cell type labels are stored as new columns in `AnnData.obs`:

- **Without reference dataset:** `AnnData.obs["method_label"]`  
- **With reference dataset:** `AnnData.obs["method_ref_label"]`  
- **Examples:**  
  - `AnnData.obs["celltypist_label"]`  
  - `AnnData.obs["celltypist_ref_label"]`

### Visualization
Reduced-dimensional embeddings (e.g., UMAP, t-SNE, PCA) are stored in:

- `AnnData.obsm["layer_method"]`
- **Examples:**  
  - `AnnData.obsm["X_umap"]`  
  - `AnnData.obsm["sctransform_umap_3d"]`

<hr/>

## References
[^1]: Virshup I, Bredikhin D, Heumos L, et al (2023) The scverse project provides a computational ecosystem for single-cell omics data analysis. Nat Biotechnol 41:604–606. https://doi.org/10.1038/s41587-023-01733-8
[^2]: Satija R, Farrell JA, Gennert D, et al (2015) Spatial reconstruction of single-cell gene expression data. Nat Biotechnol 33:495–502. https://doi.org/10.1038/nbt.3192
[^3]: Huber W, Carey VJ, Gentleman R, et al (2015) Orchestrating high-throughput genomic analysis with Bioconductor. Nat Methods 12:115–121. https://doi.org/10.1038/nmeth.3252
[^4]: Wolf FA, Angerer P, Theis FJ (2018) SCANPY: large-scale single-cell gene expression data analysis. Genome Biol 19:15. https://doi.org/10.1186/s13059-017-1382-0
[^5]: Heiser CN, Wang VM, Chen B, et al (2021) Automated quality control and cell identification of droplet-based single-cell data using dropkick. Genome Res 31:1742–1752. https://doi.org/10.1101/gr.271908.120
[^6]: Dijk D van, Sharma R, Nainys J, et al (2018) Recovering Gene Interactions from Single-Cell Data Using Data Diffusion. Cell 174:716-729.e27. https://doi.org/10.1016/j.cell.2018.05.061
[^7]: Huang M, Wang J, Torre E, et al (2018) SAVER: gene expression recovery for single-cell RNA sequencing. Nat Methods 15:539–542. https://doi.org/10.1038/s41592-018-0033-z
[^8]: Hafemeister C, Satija R (2020) Analyzing scRNA-seq data with the Sctransform and offset models
[^9]: Love MI, Huber W, Anders S (2014) Moderated estimation of fold change and dispersion for RNA-seq data with DESeq2. Genome Biol 15:550. https://doi.org/10.1186/s13059-014-0550-8
[^10]: Hafemeister C, Satija R (2020) Analyzing scRNA-seq data with the Sctransform and offset models
[^11]: Durinck S, Moreau Y, Kasprzyk A, et al (2005) BioMart and Bioconductor: a powerful link between biological databases and microarray data analysis. Bioinformatics 21:3439–3440. https://doi.org/10.1093/bioinformatics/bti525
[^12]: Korsunsky I, Millard N, Fan J, et al (2019) Fast, sensitive and accurate integration of single-cell data with Harmony. Nat Methods 16:1289–1296. https://doi.org/10.1038/s41592-019-0619-0
[^13]: Jointly defining cell types from multiple single-cell datasets using LIGER | Nature Protocols. https://www.nature.com/articles/s41596-020-0391-8. Accessed 5 Nov 2024
[^14]: Gayoso A, Lopez R, Xing G, et al (2022) A Python library for probabilistic analysis of single-cell omics data. Nat Biotechnol 40:163–166. https://doi.org/10.1038/s41587-021-01206-w
[^15]: Domínguez Conde C, Xu C, Jarvis LB, et al (2022) Cross-tissue immune cell analysis reveals tissue-specific features in humans. Science 376:eabl5197. https://doi.org/10.1126/science.abl5197
[^16]: Aran D, Looney AP, Liu L, et al (2019) Reference-based analysis of lung single-cell sequencing reveals a transitional profibrotic macrophage. Nat Immunol 20:163–172. https://doi.org/10.1038/s41590-018-0276-y
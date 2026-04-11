# Data Management

<hr/>

## Upload Dataset

Steps to create a new dataset is shown as below:

<div align="center">
<img src="/images/doc/upload_dataset.png" width="80%">
</div>

**Step 1: Upload file**

Upload files → Select files → Confirm selection. Use the toolbar to organize, delete, or download files.

<div align="center">
<img src="/images/doc/file_upload.png" width="80%">
</div>

> [!IMPORTANT]
> Accepted Formats for Single-file Datasets: **csv, tsv, txt, txt.gz, h5ad, rds, h5, hdf5, h5ad, h5mu, h5seurat, Robj, zip, gz**
> All file formats will be automatically converted to `AnnData` format.
> Standard File Structure for Multi-file Datasets:
>* Molecules(txt) + Annotation(txt)
>* Barcodes(Alias name: cells, extension:tsv) + Genes(Alias name: genes, extension:tsv) + Matrix(mtx)
>* Barcodes(Alias name: cells, extension:tsv.gz) + Genes(Alias name: genes, extension:tsv.gz) + Matrix(mtx.gz)
>* Barcodes(Alias name: cells, extension:tsv) + Features(Alias name: features, extension:tsv) + Matrix(mtx)
>* Barcodes(Alias name: cells, extension:tsv.gz) + Features(Alias name: features, extension:tsv.gz) + Matrix(mtx.gz)

**Step 2: Set visibility**

By default, your dataset is visible only to you or your project members. You can make it public, which won’t use your private file space.

**Step 3: Add sample information (Optional)**

If your project has multiple datasets, add a sample name to your `AnnData` file. This field will be saved in `AnnData.obs` for batch integration.

**Step 4: Create project and add members (Optional)**

To share a dataset with a small group, create a project and add members. All project members will have access to the dataset.

**Step 5: Add the dataset to a project (Optional)**

Select a project to link your dataset. If no project is selected, the dataset will be visible only to you.

**Step 6: Add metadata**

Fill out the dataset metadata form. For fields like “Organ Part,” you can search existing options or create new ones. This searchable, creatable field reduces duplication and simplifies data entry.

<div align="center">
<img src="/images/doc/metadata.png" width="80%">
</div>

<hr/>

## Project

Projects let you share datasets with a small group:

* The owner can create a project for a dataset

* The owner can add or remove project members

* Users can belong to multiple projects

Use the **“MANAGE PROJECT”** button on **"Upload Data"** page or the **“My Projects”** option under the **“Analyses”** menu to access the project management page.

<div align="center">
<img src="/images/doc/project.png" width="80%">
</div>

<hr/>

## My Data

There are two data categories: user datasets and benchmark datasets.

Each user has **5 GB** of private storage for their own datasets. Public user datasets and benchmark datasets don’t count toward private space and are public by default.

Users can search datasets using filters such as species, category, author, organ part, cell type, and disease status. They can also view, edit, and delete their own datasets.

<div align="center">
<img src="/images/doc/my_data.png" width="80%">
</div>

> [!TIP]  
> Click the **column headers** to **sort** the table. 

<hr/>

## Dataset Details

The dataset details page displays metadata and pre-processing results.

Each dataset may include multiple data stages—expand them to view processed data and detailed parameters.

<div align="center">
<img src="/images/doc/data_details.png" width="80%">
</div>

> [!TIP]  
> Click the **title** of **pre-process results** to view details and download results. 
> <div align="center">
> <img src="/images/doc/pp_results.png">
> </div>

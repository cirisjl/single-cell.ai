# single-cell.ai API Tutorial

*A practical guide to the FastAPI endpoints.*

## 1. Architecture and prerequisites

The supplied API layer uses **FastAPI** for HTTP routing and **Pydantic** for request validation. Most processing endpoints enqueue work through **Celery** and immediately return a `job_id`; some endpoints access **MongoDB** records or generate result visualizations. The API itself does not execute the long-running analysis within the HTTP request.

```text
Client (curl / Python / React)
           |
           | HTTP + JSON
           v
    FastAPI /api/* routes
           |
           +-- Pydantic validation
           |
           +-- Celery .apply_async(...) ---> Queue ---> Worker ---> Results / MongoDB
           |
           +-- Direct record query / data download / visualization
```

### 1.1 Configure an API base URL

All commands below assume the server is already running and has included the supplied routers in its FastAPI application. Adjust the URL for your deployment:

```bash
export BASE_URL="http://localhost:5005"
```

If the application has FastAPI's default documentation enabled, try:

- Swagger UI: `${BASE_URL}/docs`
- OpenAPI specification: `${BASE_URL}/openapi.json`
- ReDoc: `${BASE_URL}/redoc`

These documentation URLs are **FastAPI defaults**, not routes explicitly present in the archive; a deployment may disable them or mount the app behind a different path.

### 1.2 Data and authentication assumptions

- Send JSON request bodies with `Content-Type: application/json`, except for the binary download response.
- The `input`, `adata_path`, and `fileDetails` fields are **strings containing paths or identifiers understood by the backend**. No general-purpose file-upload endpoint is present in this archive. Do not assume that a path on your computer is readable inside the API container.
- The included routers do not declare an authentication dependency or token format. This does **not** prove that a deployed API is public: an API gateway or application middleware may apply authentication.
- Replace placeholder IDs, file paths, method names, and reference datasets with values from your deployment. The models generally do **not** restrict method names to a documented enumeration.
- GPU method routing occurs only when the `method` array contains exactly `scVI` or `scANVI` for the applicable integration/annotation endpoints; the code otherwise sends these tasks to a CPU queue.

### 1.3 Understand asynchronous responses

For example, a processing endpoint can return:

```json
{
  "job_id": "<celery-task-id>",
  "Status": "Quality Control task submitted successfully"
}
```

This response means **submission succeeded**, not that the computation finished. Most submitters use HTTP `200 OK` (the source does not explicitly set `202 Accepted`). The property casing is inconsistent between endpoints: some use `Status`, some use `status`, and some return only `job_id`. **There is no job-status or cancel endpoint in the supplied routers.** Consult your main application's job-management endpoints, Celery result backend, or job records for task progress.

## 2. Quick start: submit a quality-control task

This walkthrough uses `POST /api/tools/qc`. The request uses the `Dataset` schema and its nested `qc_params`.

### Step 1: Prepare `qc_request.json`

```json
{
  "dataset": "Example mouse lung dataset",
  "datasetId": "<dataset-id>",
  "userID": "<user-id>",
  "input": "/data/example/lung.h5ad",
  "output": "/data/example/results",
  "description": "Quality control of mouse lung single-cell data",
  "process": "QC",
  "method": ["<configured-qc-method>"],
  "species": "Mouse",
  "qc_params": {
    "min_genes": 500,
    "max_genes": 0,
    "min_cells": 3,
    "pct_counts_mt": 10,
    "n_top_genes": 3000,
    "n_pcs": 50,
    "n_neighbors": 15,
    "resolution": 0.5,
    "use_default": false
  }
}
```

`input` is the only required field in the `Dataset` Pydantic model. For this particular route, `create_job()` also accesses `description`, `datasetId`, `method`, `input`, and `process` (these keys are present in the model dump even when omitted, but meaningful values are strongly recommended). `output` and other fields may also be needed by the worker. `pct_counts_mt` and the other QC settings above are illustrative values, not universally recommended thresholds. The selected QC method must be supported by the actual worker implementation.

### Step 2: Submit the job

Save the JSON above as `qc_request.json`, then run:

```bash
curl --fail-with-body -sS -X POST "$BASE_URL/api/tools/qc" \
  -H "Content-Type: application/json" \
  --data-binary @qc_request.json
```

Expected **response structure** (the ID and message are illustrative):

```json
{
  "job_id": "<celery-task-id>",
  "Status": "Quality Control task submitted successfully"
}
```

### Step 3: Retain the task ID

If `jq` is available:

```bash
JOB_ID=$(curl --fail-with-body -sS -X POST "$BASE_URL/api/tools/qc" \
  -H "Content-Type: application/json" \
  --data-binary @qc_request.json | jq -r '.job_id')

printf 'Submitted task: %s\n' "$JOB_ID"
```

The second command is a **new submission**, not a way to retrieve the first job's ID. Run it instead of Step 2 when scripting a single submission. The source includes a MongoDB job upsert for this endpoint with initial status `Queued`; the eventual progress/finished status depends on code outside the archive.

## 3. Complete endpoint reference

All paths below are relative to `BASE_URL`. Endpoints identified as **async** create a Celery task; **direct** endpoints respond within the HTTP request. The active routes are grouped by function, not by filename.

| Method | Endpoint | Request model | Behavior |
|---|---|---|---|
| POST | `/api/tools/qc` | `Dataset` | Async quality control |
| POST | `/api/tools/normalize` | `Dataset` | Async normalization |
| POST | `/api/tools/impute` | `Dataset` | Async imputation |
| POST | `/api/tools/reduce` | `Dataset` | Async dimensionality reduction |
| POST | `/api/tools/convert` | `Dataset` | Async data conversion |
| POST | `/api/tools/integrate` | `Datasets` | Async multi-dataset integration |
| POST | `/api/tools/annotate` | `Dataset` | Async cell-type annotation |
| POST | `/api/tools/manualannotation` | `ManualAnnotationRequest` | Async manual annotation |
| POST | `/api/tools/outliercorrection` | `OutlierCorrectionRequest` | Async outlier correction |
| POST | `/api/tools/evaluate` | `Dataset` | Async evaluation **(known source bug; see §11)** |
| POST | `/api/tools/metadata` | `UploadRequest` | Async metadata processing |
| POST | `/api/workflows/clustering` | `Dataset` | Async clustering workflow |
| POST | `/api/workflows/integration` | `Datasets` | Async integration workflow |
| POST | `/api/workflows/annotation` | `Datasets` | Async annotation workflow |
| POST | `/api/benchmarks/publishDatasets/validation` | `InputFilesRequest` | Direct Seurat-file validation/metadata |
| POST | `/api/benchmarks/create` | `BenchmarksRequest` | Async benchmark run |
| POST | `/api/benchmarks/data-split` | `DataSplitRequest` | Async train/validation/test split |
| POST | `/api/benchmarks/subset` | `SubsetDataRequest` | Async cell subset creation |
| POST | `/api/getPreProcessResults` | `ProcessResultsRequest` | Async preprocessing-result retrieval |
| POST | `/api/plotumap` | `ProcessResultsRequest` | Async UMAP plotting |
| POST | `/api/getPreProcessResultsMain` | `ProcessResultsRequest` | Direct preprocessing-result retrieval |
| POST | `/api/dataset/download` | `DownloadDataset` | Async dataset download preparation |
| POST | `/api/download` | `DownloadDataset` | Direct binary AnnData/file download |
| GET | `/api/benchmarks/{benchmarksId}` | Path parameter | Direct benchmark-record lookup |

## 4. Analysis tools

### 4.1 Core processing endpoints

The first six endpoints below use the same **single-dataset JSON envelope** shown in [§2](#2-quick-start-submit-a-quality-control-task), except `integrate`, which uses the **multi-dataset** model explained in §5.

| Endpoint | Purpose | Celery queue | Response keys |
|---|---|---|---|
| `/api/tools/qc` | Quality-control computation | `cpu` | `job_id`, `Status` |
| `/api/tools/normalize` | Expression normalization | `cpu` | `job_id`, `Status` |
| `/api/tools/impute` | Imputation | `cpu` | `job_id`, `Status` |
| `/api/tools/reduce` | Dimensionality reduction | `cpu` | `job_id`, `Status` |
| `/api/tools/convert` | Data format conversion | `cpu` | `job_id`, `Status` |
| `/api/tools/integrate` | Multi-dataset integration | `gpu` for `scVI`/`scANVI`, otherwise `cpu` | `job_id` |
| `/api/tools/annotate` | Cell-type annotation | `gpu` for `scVI`/`scANVI`, otherwise `cpu` | `job_id`, `Status` |

The core single-dataset tools also call `create_job()` to record a job with initial status `Queued` in MongoDB. Integration uses a separate `upsert_jobs()` call with slightly different record fields. Actual analysis-method behavior is implemented in missing Celery task code, so **method names and biological preprocessing semantics cannot be exhaustively verified from these routers**.

#### Normalization example

```bash
curl --fail-with-body -sS -X POST "$BASE_URL/api/tools/normalize" \
  -H "Content-Type: application/json" \
  -d '{
    "input": "/data/example/lung.h5ad",
    "datasetId": "<dataset-id>",
    "userID": "<user-id>",
    "description": "Normalize counts",
    "process": "Normalization",
    "method": ["<configured-normalization-method>"],
    "normalization_params": {
      "assay": "RNA",
      "layer": null,
      "use_default": true
    }
  }'
```

#### Dimensionality reduction example

```bash
curl --fail-with-body -sS -X POST "$BASE_URL/api/tools/reduce" \
  -H "Content-Type: application/json" \
  -d '{
    "input": "/data/example/lung.h5ad",
    "datasetId": "<dataset-id>",
    "userID": "<user-id>",
    "description": "Compute low-dimensional embeddings",
    "process": "Reduction",
    "method": ["<configured-reduction-method>"],
    "reduction_params": {"n_pcs": 50, "n_neighbors": 15, "n_hvg": 50},
    "do_umap": true,
    "skip_3d": false,
    "skip_tsne": true
  }'
```

#### Imputation example

```bash
curl --fail-with-body -sS -X POST "$BASE_URL/api/tools/impute" \
  -H "Content-Type: application/json" \
  -d '{
    "input": "/data/example/lung.h5ad",
    "datasetId": "<dataset-id>",
    "userID": "<user-id>",
    "description": "Impute gene expression",
    "process": "Imputation",
    "method": ["<configured-imputation-method>"],
    "imputation_params": {"ncores": 4, "genes": ["Sftpc", "Epcam"]}
  }'
```

For **conversion**, send the same `Dataset` envelope to `/api/tools/convert` with an appropriate source `input`, target `output_format`, and a supported `method`. The router provides no separate format-validation contract.

### 4.2 Cell-type annotation

Use `POST /api/tools/annotate` with `Dataset`, including `annotation_params`:

```json
{
  "input": "/data/example/lung_integrated.h5ad",
  "datasetId": "<dataset-id>",
  "userID": "<user-id>",
  "description": "Annotate cell types",
  "process": "Annotation",
  "method": ["<configured-annotation-method>"],
  "species": "Mouse",
  "organ_part": "lung",
  "cluster_label": "leiden",
  "annotation_params": {
    "methods": ["<configured-annotation-method>"],
    "celltypist_model": null,
    "SingleR_ref": [],
    "user_label": null,
    "n_neighbors": 20,
    "n_pcs": 20,
    "resolution": 0.3
  }
}
```

Submit this document to `/api/tools/annotate`. `method` is the top-level list inspected by the router for CPU/GPU routing; `annotation_params.methods` is a separate nested parameter that may be consumed by the worker. The source does not guarantee that these two fields are interchangeable.

### 4.3 Manual annotation

Use `POST /api/tools/manualannotation` to send revised cluster labels/observations.

Required fields: `cluster_id`, `process_id`, `adata_path`. Other fields, including `job_id`, are optional in the schema.

```bash
curl --fail-with-body -sS -X POST "$BASE_URL/api/tools/manualannotation" \
  -H "Content-Type: application/json" \
  -d '{
    "cluster_id": "<cluster-id>",
    "process_id": "<process-id>",
    "adata_path": "/data/example/lung.h5ad",
    "datasetId": "<dataset-id>",
    "userID": "<user-id>",
    "description": "Update manual cell labels",
    "updatedAll": [],
    "updatedChangedOnly": [],
    "deleted": [],
    "obsSets": []
  }'
```

The nested objects inside `updatedAll`, `updatedChangedOnly`, and `obsSets` are typed only as generic dictionaries in the archive; consult the implementation or a real frontend request before sending label changes. Returns `job_id` and `Status`; queue `cpu`.

### 4.4 Outlier correction

Use `POST /api/tools/outliercorrection` to update outlier/discard annotations. Required: `job_id`, `cluster_id`, `process_id`, `adata_path`.

```bash
curl --fail-with-body -sS -X POST "$BASE_URL/api/tools/outliercorrection" \
  -H "Content-Type: application/json" \
  -d '{
    "job_id": "<existing-job-id>",
    "cluster_id": "<cluster-id>",
    "process_id": "<process-id>",
    "adata_path": "/data/example/lung.h5ad",
    "datasetId": "<dataset-id>",
    "updatedDiscardAll": [],
    "updatedDiscardChangedOnly": [],
    "updatedOutlierAll": [],
    "updatedOutlierChangedOnly": [],
    "deleted": []
  }'
```

Returns `job_id` and `Status`; queue `cpu`. The router does not describe the internal shape of the updated observation dictionaries.

### 4.5 Upload metadata processing

`POST /api/tools/metadata` submits a metadata task (not a multipart upload).

```bash
curl --fail-with-body -sS -X POST "$BASE_URL/api/tools/metadata" \
  -H "Content-Type: application/json" \
  -d '{
    "fileDetails": ["/data/example/cells.csv"],
    "userID": "<user-id>",
    "assay_name": "RNA",
    "sample": "mouse_lung"
  }'
```

`fileDetails` is a **list of strings**. `userID` is required. Returns `{"job_id":"<celery-task-id>"}`; queue `cpu`.

## 5. Multi-dataset workflows

A **`Datasets`** payload represents multiple inputs as parallel lists. Its `userID` is required. While `datasetIds`, `dataset`, and `input` have empty-list defaults, useful work typically requires actual datasets. The schema does not enforce equal list lengths; the caller should.

### 5.1 Integration tool versus integration workflow

| Endpoint | Request model | Task | Queue selection | Response |
|---|---|---|---|---|
| `/api/tools/integrate` | `Datasets` | `create_integration_task` | CPU/GPU by `method` | `job_id` |
| `/api/workflows/integration` | `Datasets` | `create_integration_wf_task` | CPU/GPU by `method` | `job_id`, `status` |
| `/api/workflows/annotation` | `Datasets` | `create_annotation_wf_task` | CPU/GPU by `method` | `job_id`, `status` |
| `/api/workflows/clustering` | `Dataset` | `create_clustering_task` | `cpu` | `job_id`, `status` |

**Use a tools route for a single processing operation; use a workflow route when you intend to invoke the corresponding composite workflow.** The precise steps of a composite workflow are determined by task implementations not included in the archive.

### 5.2 Integration workflow example

```bash
curl --fail-with-body -sS -X POST "$BASE_URL/api/workflows/integration" \
  -H "Content-Type: application/json" \
  -d '{
    "datasetIds": ["<dataset-a-id>", "<dataset-b-id>"],
    "dataset": ["lung_sample_a", "lung_sample_b"],
    "input": ["/data/lung_a.h5ad", "/data/lung_b.h5ad"],
    "userID": "<user-id>",
    "output": "/data/results/lung_integrated.h5ad",
    "description": "Integrate two lung samples",
    "process": "Integration",
    "method": ["scVI"],
    "integration_params": {
      "methods": ["scVI"],
      "batch_key": "sample",
      "dims": 30,
      "npcs": 30,
      "resolution": 0.5
    }
  }'
```

The queue is `gpu` here because the **top-level** `method` includes `scVI`. The archive confirms routing behavior, but does not establish that every GPU method can be run with this example data or that `batch_key` values are present in the AnnData observations.

Expected response shape:

```json
{
  "job_id": "<celery-task-id>",
  "status": "Integration task is submitted successfully"
}
```

To call the **integration tool** instead, send a `Datasets` payload to `/api/tools/integrate`. To call the **annotation workflow**, submit a `Datasets` payload to `/api/workflows/annotation`, with suitable `annotation_params` and `method`.

### 5.3 Clustering workflow example

```bash
curl --fail-with-body -sS -X POST "$BASE_URL/api/workflows/clustering" \
  -H "Content-Type: application/json" \
  -d '{
    "input": "/data/results/lung_integrated.h5ad",
    "datasetId": "<dataset-id>",
    "userID": "<user-id>",
    "process": "Clustering",
    "method": ["<configured-clustering-method>"],
    "do_cluster": true,
    "do_umap": true,
    "reduction_params": {"n_pcs": 50, "n_neighbors": 15, "resolution": 0.5}
  }'
```

Returns `job_id`, `status`; queue `cpu`.

## 6. Benchmarking and dataset preparation

### 6.1 Validate a Seurat dataset

`POST /api/benchmarks/publishDatasets/validation` accepts `InputFilesRequest` containing an `inputFiles` array. Each element has required `fileDetails` and optional `assay`.

```bash
curl --fail-with-body -sS -X POST "$BASE_URL/api/benchmarks/publishDatasets/validation" \
  -H "Content-Type: application/json" \
  -d '{
    "inputFiles": [
      {"fileDetails": "/data/reference/sample.rds", "assay": "RNA"}
    ]
  }'
```

For paths ending in `.h5Seurat`, `.h5seurat`, `.rds`, or `.Robj`, the implementation attempts to extract Seurat metadata and can return an array of entries with this shape:

```json
[
  {
    "inputfile": "/data/reference/sample.rds",
    "info": "<metadata-value-from-backend>",
    "format": "h5seurat",
    "default_assay": "RNA",
    "assay_names": ["RNA"]
  }
]
```

This is an **illustrative** response: `info` and assay values depend on `get_metadata_from_seurat`. The function uncompresses compressed inputs first. Other supported-by-the-system data formats are not handled in this active branch and may lead to an empty response array. Exceptions inside metadata extraction are translated to HTTP `500`.

### 6.2 Create a benchmark task

`POST /api/benchmarks/create` uses `BenchmarksRequest`.

```bash
curl --fail-with-body -sS -X POST "$BASE_URL/api/benchmarks/create" \
  -H "Content-Type: application/json" \
  -d '{
    "benchmarksId": "<benchmark-run-id>",
    "datasetId": "<dataset-id>",
    "userID": "<user-id>",
    "task_type": "clustering",
    "adata_path": "/data/example/lung.h5ad",
    "label": "leiden",
    "batch_key": "sample",
    "species": "mouse"
  }'
```

Required fields: `benchmarksId`, `datasetId`, `task_type`, `adata_path`. Task-specific options include `label`, `ccc_target`, `bm_traj`, `origin_group`, `batch_key`, `celltypist_model`, `SingleR_ref`, `mod1`, and `mod2`. No fixed set of allowed `task_type` values is provided by the schema; `clustering` is an illustrative choice. Response keys: `job_id`, `Status`. This task calls `apply_async()` **without an explicit queue**, so the Celery application's routing/default queue determines where it runs.

### 6.3 Split data into training, validation, and test sets

`POST /api/benchmarks/data-split` uses `DataSplitRequest`.

```bash
curl --fail-with-body -sS -X POST "$BASE_URL/api/benchmarks/data-split" \
  -H "Content-Type: application/json" \
  -d '{
    "benchmarksId": "<benchmark-run-id>",
    "datasetId": "<dataset-id>",
    "userID": "<user-id>",
    "adata_path": "/data/example/lung.h5ad",
    "train_fraction": 0.70,
    "validation_fraction": 0.15,
    "test_fraction": 0.15,
    "labels": "cell_type",
    "task_type": "annotation"
  }'
```

Required: benchmark ID, dataset ID, AnnData path, and all three numeric fractions. Fractions summing to `1.0` are a sensible client-side constraint; **the supplied Pydantic schema does not enforce ranges or their sum**. The worker may impose additional rules. Response: `job_id`, `Status`; queue `cpu`.

### 6.4 Create a subset using cell metadata

`POST /api/benchmarks/subset` uses `SubsetDataRequest`.

```bash
curl --fail-with-body -sS -X POST "$BASE_URL/api/benchmarks/subset" \
  -H "Content-Type: application/json" \
  -d '{
    "benchmarksId": "<benchmark-run-id>",
    "datasetId": "<dataset-id>",
    "userID": "<user-id>",
    "adata_path": "/data/example/lung.h5ad",
    "obskey": "cell_type",
    "values": ["T cell", "B cell"]
  }'
```

Required: `benchmarksId`, `datasetId`, `adata_path`, `obskey`, `values`. `values` is a generic list: its elements should match the actual values in the chosen AnnData observation column. Response: `job_id`, `Status`; queue `cpu`.

## 7. Results and visualization

All three web endpoints use `ProcessResultsRequest`:

```json
{
  "process_ids": ["<process-id-1>", "<process-id-2>"],
  "clustering_plot_type": "leiden",
  "annotation": null,
  "record_type": null,
  "selected_cell_intersection": null
}
```

Only `process_ids` is required by Pydantic; it may technically be an empty list, but the direct endpoint explicitly rejects that case.

### 7.1 Request preprocessing results as a task

`POST /api/getPreProcessResults` submits the payload to Celery queue `web` and returns:

```json
{"job_id": "<celery-task-id>"}
```

Example:

```bash
curl --fail-with-body -sS -X POST "$BASE_URL/api/getPreProcessResults" \
  -H "Content-Type: application/json" \
  -d '{"process_ids": ["<process-id>"]}'
```

### 7.2 Request UMAP plotting as a task

`POST /api/plotumap` also submits to queue `web`, returning just `job_id`:

```bash
curl --fail-with-body -sS -X POST "$BASE_URL/api/plotumap" \
  -H "Content-Type: application/json" \
  -d '{
    "process_ids": ["<process-id>"],
    "clustering_plot_type": "leiden",
    "annotation": null
  }'
```

The router forwards all request fields to the task without applying transformations. The exact visualization payload requires the worker implementation.

### 7.3 Fetch results synchronously

`POST /api/getPreProcessResultsMain` queries saved preprocessing results and returns a JSON **array**. Unlike the above two, it does not return a task ID:

```bash
curl --fail-with-body -sS -X POST "$BASE_URL/api/getPreProcessResultsMain" \
  -H "Content-Type: application/json" \
  -d '{"process_ids": ["<process-id>"], "record_type": null}'
```

The implementation:

- Calls `get_pp_results(process_ids, record_type=record_type)`.
- Converts `cell_metadata` to JSON-friendly data, and likewise `atac_cell_metadata` when present.
- When `record_type` is `null`, adds a preview of cell metadata and constructs plot data where matching keys exist: `umap`, `umap_3d`, `tsne`, `tsne_3d`, `atac_umap`, `atac_umap_3d`.
- For results with `process == "QC"`, adds `violin_plot` and `scatter_plot`, and conditionally `highest_expr_genes_plot`.
- Converts embedding arrays to lists when constructing plots.
- Returns **HTTP 400** with `{"detail":"No process ID is provided."}` for an empty ID list, or **HTTP 404** with `{"detail":"No pp_result is found."}` if the database lookup produces no records.

> Plot generation in this synchronous endpoint may be computationally expensive for large datasets.

## 8. Dataset and benchmark retrieval

### 8.1 Download a dataset as binary data

`POST /api/download` accepts `DownloadDataset` and returns an `application/octet-stream` response rather than JSON:

```bash
curl --fail-with-body -sS -X POST "$BASE_URL/api/download" \
  -H "Content-Type: application/json" \
  -H "Accept: application/octet-stream" \
  -D dataset_headers.txt \
  -o dataset_download.bin \
  -d '{"dataset_id": "<dataset-id>"}'
```

The backend resolves `dataset_id` with `get_file_by_id()`, reads the record's `adata_path`, and streams the file as an attachment. It sends:

- `Content-Disposition`: the file's basename (URL-quoted in the source).
- `X-File-Metadata`: a JSON-encoded copy of the database document **after removing `adata_path`**.
- `Content-Type`: `application/octet-stream`.

The `.bin` extension above avoids assuming the stored file's format. After inspecting `Content-Disposition`, rename the file appropriately (often `.h5ad`, if that is the stored file). The source returns `404` with `{"detail":"File not found"}` when the resolved path does not exist. A missing database record may behave differently because the router does not explicitly handle `get_file_by_id()` returning `None`.

`DownloadDataset` also allows `user_id`, `process_type`, and `method`, but the **direct download implementation only accesses `dataset_id`**.

### 8.2 Submit a dataset download job

`POST /api/dataset/download` uses the same request model but invokes `create_download_dataset_task` on queue `dataset`:

```bash
curl --fail-with-body -sS -X POST "$BASE_URL/api/dataset/download" \
  -H "Content-Type: application/json" \
  -d '{
    "dataset_id": "<dataset-id>",
    "user_id": "<user-id>",
    "process_type": "QC",
    "method": "<configured-method>"
  }'
```

It returns JSON with `job_id` and `status` (`"Download Dataset Task Submitted Successfully!"`). The eventual download artifact location or retrieval mechanism is **not defined** in the supplied router.

### 8.3 Fetch a benchmark record

`GET /api/benchmarks/{benchmarksId}` returns the database record for the specified benchmark ID:

```bash
curl --fail-with-body -sS "$BASE_URL/api/benchmarks/<benchmark-run-id>"
```

It returns the database result as JSON, or `404` with `{"detail":"Benchmarks record not found"}` when no record exists. It is distinct from the asynchronous `/api/benchmarks/create` endpoint.

## 9. Request schema reference

This section summarizes the field-level contracts in `schemas/schemas.py`. `Optional` means a value may be `null` or omitted under the current Pydantic model; **task-specific code may still expect a value**. Defaults shown below are from the source, not necessarily recommended analysis parameters.

### 9.1 `Dataset` — a single dataset

| Field | Type | Source default | Description |
|---|---|---|---|
| `input` | string | **Required** | Input data path/identifier |
| `dataset` | string or null | `null` | Dataset display name |
| `output` | string or null | `null` | Output path |
| `user_refs` | string[] or null | `[]` | User references |
| `userID` | string or null | `null` | User identifier |
| `description` | string or null | `null` | Task description |
| `datasetId` | string or null | `null` | Dataset ID |
| `method` | string[] or null | `[]` | Top-level methods (also used for queue routing) |
| `process` | string or null | `null` | Processing-stage label |
| `output_format` | string or null | `"AnnData"` | Output format |
| `species` | string or null | `"Mouse"` | Species |
| `organ_part` | string or null | `null` | Organ/tissue |
| `idtype` | string or null | `"SYMBOL"` | Gene-ID type |
| `cluster_label` | string or null | `null` | Cluster label |
| `cluster_colname` | string or null | `null` | Cluster column name |
| `qc_params` | `QCParameters` | defaults | QC parameters |
| `imputation_params` | `imputationParameters` | defaults | Imputation parameters |
| `integration_params` | `integrationParameters` | defaults | Integration parameters |
| `normalization_params` | `normalizationParameters` | defaults | Normalization parameters |
| `annotation_params` | `annotationParameters` | defaults | Annotation parameters |
| `reduction_params` | `reductionParameters` | defaults | Dimensionality-reduction parameters |
| `n_hvg` | integer or null | `50` | HVGs used for visualization |
| `do_umap` | boolean or null | `true` | Request UMAP |
| `do_cluster` | boolean or null | `true` | Request clustering |
| `skip_3d` | boolean or null | `false` | Skip 3D visualizations |
| `skip_tsne` | boolean or null | `false` | Skip t-SNE |

### 9.2 `Datasets` — multiple datasets

Required: `userID` (string). `datasetIds`, `dataset`, and `input` are each `string[]` with default `[]`. `output` and `description` are optional strings. The other fields largely mirror `Dataset`: `user_refs`, `output_format`, `method`, `species`, `organ_part`, `idtype`, `cluster_label`, `cluster_colname`, `process`, `n_hvg`, `do_umap`, `do_cluster`, `skip_3d`, `skip_tsne`, plus `qc_params`, `integration_params`, `annotation_params`, and `reduction_params`. Unlike `Dataset`, this model **does not define** `imputation_params` or `normalization_params`.

> **Important:** the router does not validate that `datasetIds[i]`, `dataset[i]`, and `input[i]` reference the same sample or even have equal list lengths. Validate their alignment in the client.

### 9.3 Analysis parameter models

#### `QCParameters` (`qc_params`)

| Field | Type | Default |
|---|---|---|
| `methods` | string[] or null | `null` |
| `assay` | string or null | `"RNA"` |
| `layer` | string or null | `null` |
| `min_genes` | integer or null | `200` |
| `max_genes` | integer or null | `0` |
| `min_cells` | integer or null | `2` |
| `target_sum` | integer or null | `10000` |
| `n_top_genes` | integer or null | `2000` |
| `n_neighbors` | integer or null | `15` |
| `n_pcs` | integer or null | `20` |
| `resolution` | number or null | `0.5` |
| `doublet_rate` | number or null | `0` |
| `pct_counts_mt` | number or null | `3` |
| `regress_cell_cycle` | boolean or null | `false` |
| `use_default` | boolean or null | `true` |
| `skip_qc` | boolean or null | `false` |
| `colour_by` | string or null | `"NULL"` |
| `shape_by_1` | string or null | `"NULL"` |
| `shape_by_2` | string or null | `"NULL"` |

Note that `max_genes: 0`, `doublet_rate: 0`, and the string `"NULL"` are source defaults; their operational meaning is decided by the worker. `pct_counts_mt` uses numeric input, but the source does not document whether workers interpret it as a percentage or fraction.

#### `normalizationParameters` (`normalization_params`)

`methods: string[] | null = null`; `assay: str | null = "RNA"`; `layer: str | null = null`; `n_neighbors: int | null = 15`; `n_pcs: int | null = 20`; `resolution: number | null = 0.5`; `use_default: bool | null = true`.

#### `imputationParameters` (`imputation_params`)

`methods: string[] | null = null`; `assay: str | null = "RNA"`; `layer: str | null = null`; `genes: string[] | null = null`; `ncores: int | null = 4`; `n_neighbors: int | null = 15`; `n_pcs: int | null = 20`; `resolution: number | null = 0.5`.

#### `reductionParameters` (`reduction_params`)

`methods: string[] | null = null`; `assay: str | null = "RNA"`; `layer: str | null = null`; `n_neighbors: int | null = 15`; `n_pcs: int | null = 20`; `resolution: number | null = 0.5`; `n_hvg: int | null = 50`; `use_default: bool | null = true`.

#### `integrationParameters` (`integration_params`)

`methods: string[] | null = []`; `batch_key: str | null = null`; `pseudo_replicates: int | null = 0`; `layer: str | null = null`; `dims: int | null = 30`; `npcs: int | null = 30`; `resolution: number | null = 0.5`; `default_assay: str | null = "RNA"`; `reference: str | null = null`.

#### `annotationParameters` (`annotation_params`)

`methods: string[] | null = []`; `assay: str | null = "RNA"`; `layer: str | null = null`; `celltypist_model: str | null = null`; `SingleR_ref: string[] | null = []`; `user_label: str | null = null`; `n_neighbors: int | null = 20`; `n_pcs: int | null = 20`; `resolution: number | null = 0.3`.

### 9.4 Other request models

| Model | Required fields | Optional fields and defaults |
|---|---|---|
| `ManualAnnotationRequest` | `cluster_id: str`, `process_id: str`, `adata_path: str` | `job_id`, `userID`, `datasetId`, `description`, `layer`, `obsEmbedding`, `zarr_path` = `null`; `updatedAll`, `updatedChangedOnly`, `obsSets` = `[]` of dictionaries; `deleted` = `[]` of strings |
| `OutlierCorrectionRequest` | `job_id: str`, `cluster_id: str`, `process_id: str`, `adata_path: str` | `userID`, `datasetId`, `description`, `layer`, `obsEmbedding`, `zarr_path` = `null`; `updatedDiscardAll`, `updatedDiscardChangedOnly`, `updatedOutlierAll`, `updatedOutlierChangedOnly`, `obsSets` = `[]` of dictionaries; `deleted` = `[]` of strings |
| `UploadRequest` | `fileDetails: string[]`, `userID: str` | `assay_name`, `sample` = `null` |
| `InputFilesRequest` | `inputFiles: InputFile[]` | Each `InputFile` requires `fileDetails: str`, with optional `assay: str | null` |
| `BenchmarksRequest` | `benchmarksId: str`, `datasetId: str`, `task_type: str`, `adata_path: str` | `userID`, `label`, `ccc_target`, `bm_traj`, `origin_group`, `batch_key`, `celltypist_model`, `mod1`, `mod2` = `null`; `SingleR_ref` = `[]`; `species` = `"mouse"` |
| `DataSplitRequest` | `benchmarksId: str`, `datasetId: str`, `adata_path: str`, `train_fraction: float`, `validation_fraction: float`, `test_fraction: float` | `userID`, `labels`, `task_type` = `null` |
| `SubsetDataRequest` | `benchmarksId: str`, `datasetId: str`, `adata_path: str`, `obskey: str`, `values: list` | `userID` = `null` |
| `ProcessResultsRequest` | `process_ids: string[]` | `clustering_plot_type` = `"leiden"`; `annotation`, `record_type`, `selected_cell_intersection` = `null` |
| `DownloadDataset` | `dataset_id: str` | `user_id`, `process_type`, `method` = `null` |

Several additional Pydantic models (`PathRequest`, `ConversionRequest`, `ConversionResponse`, `AnndataMetadata`, `UMAPRequest`, `CombinedQCResult`, `TaskDataRequest`, `QualityControlRequest`) exist in `schemas.py`, but **none is the request model of an active router endpoint in this archive**. They may support other code not supplied here.

## 10. Python client walkthrough

For scripting, install `requests`:

```bash
python -m pip install requests
```

The following client demonstrates **submission**, robust HTTP error reporting, **direct results retrieval**, and **binary download**. It intentionally does not invent a job-status API.

```python
import os
from pathlib import Path
import requests

BASE_URL = os.environ.get("API_BASE_URL", "http://localhost:5005").rstrip("/")


def post_json(path: str, payload: dict) -> dict | list:
    response = requests.post(
        f"{BASE_URL}{path}", json=payload, timeout=120
    )
    response.raise_for_status()
    return response.json()


def submit_qc(input_path: str, dataset_id: str, user_id: str, method: str) -> str:
    result = post_json("/api/tools/qc", {
        "input": input_path,
        "datasetId": dataset_id,
        "userID": user_id,
        "description": "QC submitted from Python",
        "process": "QC",
        "method": [method],
        "qc_params": {
            "min_genes": 500,
            "pct_counts_mt": 10,
            "n_pcs": 50,
            "use_default": False,
        },
    })
    return result["job_id"]


def get_saved_process_results(process_ids: list[str]) -> list:
    result = post_json("/api/getPreProcessResultsMain", {
        "process_ids": process_ids,
        "record_type": None,
    })
    return result


def download_dataset(dataset_id: str, destination: Path) -> None:
    destination.parent.mkdir(parents=True, exist_ok=True)
    with requests.post(
        f"{BASE_URL}/api/download",
        json={"dataset_id": dataset_id},
        stream=True,
        timeout=(10, 300),
    ) as response:
        response.raise_for_status()
        with destination.open("wb") as target:
            for chunk in response.iter_content(chunk_size=1024 * 1024):
                if chunk:
                    target.write(chunk)


if __name__ == "__main__":
    job_id = submit_qc(
        input_path="/data/example/lung.h5ad",
        dataset_id="<dataset-id>",
        user_id="<user-id>",
        method="<configured-qc-method>",
    )
    print("Submitted QC job:", job_id)
    # Later, once an external job-status mechanism confirms completion:
    # results = get_saved_process_results(["<process-id>"])
    # download_dataset("<dataset-id>", Path("lung_download.h5ad"))
```

The `timeout` values shown are client settings, not server guarantees. Use retry policies carefully for task-submission POST requests: **blind retries can create duplicate jobs**. Retain the `job_id` from successful submissions.

## 11. Troubleshooting and known implementation issues

### 11.1 Common HTTP and operational errors

| Symptom | Likely cause | What to check |
|---|---|---|
| HTTP `422 Unprocessable Entity` | Invalid Pydantic body | Required fields, JSON types, list vs. string, model names (`datasetId` vs. `dataset_id`) |
| HTTP `400` from `/api/getPreProcessResultsMain` | Empty `process_ids` | Provide at least one saved process ID |
| HTTP `404` from `/api/getPreProcessResultsMain` | No matching preprocessing record | Verify saved process IDs and `record_type` |
| HTTP `404` from `/api/download` | Resolved file is absent | Check file storage and backend-mounted path |
| HTTP `404` from `GET /api/benchmarks/{id}` | Missing benchmark record | Confirm benchmark ID and persistence |
| Task stays queued | No worker consumes the target queue | Check Celery broker, worker status, queues `cpu`, `gpu`, `web`, `dataset`, and default routing |
| Submission succeeds but no result | Worker error, missing input, or no result link | Inspect Celery logs, result backend, MongoDB job records, and actual task implementation |
| HTTP `500` from evaluation | Current router implementation bug | See fix below |

`ds` is a `Dataset` Pydantic object, which does not support the dictionary-style indexing used here, and the `Dataset` model does not define the referenced `methods`, `layer`, `genes`, `ncores`, or `show_error` fields at the top level. Some related values exist in nested parameter models, but the actual evaluation task signature is **not available** in the archive. The appropriate fix is to reconcile the request schema with the evaluation task function first, then convert/validate the request and call `apply_async()` with the task's actual expected arguments. Do **not** simply replace every `ds[...]` with a similarly named attribute without inspecting the worker task.

### 11.3 Other implementation caveats

- **No polling route:** task IDs are returned, but no status, progress, cancellation, or result-download route specifically for a Celery `job_id` is included. Do not confuse saved `process_id`, `benchmarksId`, `dataset_id`, and Celery `job_id`; they represent different identifiers.
- **Queue names and worker routing:** tools and workflows use `cpu`/`gpu`; web plotting uses `web`; asynchronous downloads use `dataset`. Benchmark creation does not select a queue explicitly. Verify that worker deployments listen to these exact queue names.
- **Validation gaps:** multi-dataset list lengths, fraction ranges/sums, input paths, method enumerations, and resource permissions are not enforced by the shown schemas. Apply client-side validation and server-side authorization in production.
- **Potentially sensitive metadata:** `/api/download` returns metadata in `X-File-Metadata` and does not show an authorization check. Validate the behavior of upstream auth and minimize data included in returned metadata.
- **File streaming:** the current `iter_file()` uses `yield tfile.read()`, which reads the entire file in one operation. For large `.h5ad` datasets, implement bounded chunk reads or use `FileResponse` where appropriate.
- **Missing-file handling:** `/api/download` assumes `get_file_by_id()` returns a dictionary and an `adata_path`. A missing record may cause an unhandled exception rather than a controlled 404.
- **Synchronous result conversion:** `/api/getPreProcessResultsMain` mutates retrieved result dictionaries and creates plots synchronously when `record_type` is `null`. Test performance and serializability for large records, empty/missing observation fields, and ATAC paths.
- **Response casing:** normalize `Status` vs. `status` in clients until the server adopts a consistent response contract.
- **Schema defaults are not usage guidance:** analysis thresholds, sample annotations, permitted gene ID types, and accepted algorithms must be documented and verified with the actual underlying tools. In particular, exact method strings are not established by the router models.
- **Router inclusion is not shown:** an endpoint appears at the documented path only if the main FastAPI application includes its router without an additional mounting prefix.
from typing import List, Optional
from pydantic import BaseModel, Field



# class QCParameters(BaseModel):
#     assay: Optional[str] =  Field(default='RNA')
#     doublet_rate: float = Field(default=0)
#     min_genes: int = Field(default=200)
#     max_genes: int = Field(default=0)
#     min_cells: int = Field(default=2)
#     target_sum: int = Field(default=1e4)
#     n_top_genes: int = Field(default=2000)
#     n_neighbors: int = Field(default=15)
#     n_pcs: int = Field(default=1)
#     resolution: float = Field(default=0.5)
#     regress_cell_cycle: Optional[bool] = False
#     use_default: Optional[bool] = True



class QCParameters(BaseModel):
    methods: Optional[List[str]]= None
    assay: Optional[str] = 'RNA' # Required for Seurat
    layer: Optional[str] = None
    min_genes: Optional[int] = 200
    max_genes: Optional[int] = 0
    min_cells: Optional[int] = 2
    target_sum: Optional[int] =1e4
    n_top_genes: Optional[int] = 2000
    n_neighbors: Optional[int] = 15
    n_pcs: Optional[int] = 20 # Scanpy
    resolution: Optional[float] = 0.5
    doublet_rate: Optional[float] = 0
    pct_counts_mt: Optional[float] = 3
    regress_cell_cycle: Optional[bool] = False
    use_default: Optional[bool] = True 
    skip_qc: Optional[bool] = False
    # Bioconductor
    colour_by: Optional[str] = 'NULL' # Color by for plots
    shape_by_1: Optional[str] = 'NULL'  # Shape by 1 for plots
    shape_by_2: Optional[str] = 'NULL'  # Shape by 2 for plots



class imputationParameters(BaseModel):
    methods: Optional[List[str]]= None
    assay: Optional[str] = 'RNA' # Required for Seurat
    layer: Optional[str] = None
    genes: Optional[List[str]] = None
    ncores: Optional[int] = 4
    n_neighbors: Optional[int] = 15
    n_pcs: Optional[int] = 20 # Scanpy
    resolution: Optional[float] = 0.5



class normalizationParameters(BaseModel):
    methods: Optional[List[str]]= None
    assay: Optional[str] = 'RNA' # Required for Seurat
    layer: Optional[str] = None
    n_neighbors: Optional[int] = 15
    n_pcs: Optional[int] = 20 # Scanpy
    resolution: Optional[float] = 0.5
    use_default: Optional[bool] = True



class reductionParameters(BaseModel):
    methods: Optional[List[str]]= None
    assay: Optional[str] = 'RNA' # Required for Seurat
    layer: Optional[str] = None
    n_neighbors: Optional[int] = 15
    n_pcs: Optional[int] = 20 # Scanpy
    resolution: Optional[float] = 0.5
    n_hvg: Optional[int] = 50 # Number of highly variable genes to use for Heatmap of Vitessce
    use_default: Optional[bool] = True



class annotationParameters(BaseModel):
    methods: Optional[List[str]]= []
    assay: Optional[str] = 'RNA' # Required for Seurat
    layer: Optional[str] = None
    celltypist_model: Optional[str] = None
    SingleR_ref: Optional[List[str]]= []
    user_label: Optional[str] = None
    n_neighbors: Optional[int] = 20
    n_pcs: Optional[int] = 20
    resolution: Optional[float] = 0.3



class integrationParameters(BaseModel):
    # description: Optional[str] = None
    # datasetId: Optional[str] = None
    methods: Optional[List[str]]= []
    batch_key: Optional[str] = None
    pseudo_replicates: Optional[int] = 0
    # assay: Optional[str] = 'RNA' # Required for Seurat
    layer: Optional[str] = None
    dims: Optional[int] = 30
    npcs: Optional[int] = 30
    resolution: Optional[float] = 0.5
    default_assay: Optional[str] = 'RNA' # Required for Seurat
    reference: Optional[str] = None
    # show_umap: Optional[bool] = True
    # show_error: Optional[bool] = True



class Dataset(BaseModel):
    dataset: Optional[str] = None # Title of datasets
    input: str
    output: Optional[str] = None
    user_refs: Optional[List[str]] = []
    userID: Optional[str] = None
    description: Optional[str] = None
    datasetId: Optional[str] = None
    method: Optional[List[str]] = []
    process: Optional[str] = None
    output_format: Optional[str] = 'AnnData'
    species: Optional[str] = 'Mouse' # c("Human", "Mouse") Species of the database for annotation. Allowed input is human or mouse.
    organ_part: Optional[str] = None # organ part or tissue for annotation, e.g., "lung", "brain"
    idtype: Optional[str] = 'SYMBOL' # idtype should be one of "SYMBOL", "ENSEMBL", "ENTREZID" or "REFSEQ".
    cluster_label: Optional[str] = None
    qc_params: QCParameters = Field(default_factory=QCParameters)
    imputation_params: imputationParameters = Field(default_factory=imputationParameters)
    integration_params: integrationParameters = Field(default_factory=integrationParameters)
    normalization_params: normalizationParameters = Field(default_factory=normalizationParameters)
    annotation_params: annotationParameters = Field(default_factory=annotationParameters)
    reduction_params: reductionParameters = Field(default_factory=reductionParameters)
    n_hvg: Optional[int] = 50 # Number of highly variable genes to use for Heatmap of Vitessce
    do_umap: Optional[bool] = True
    do_cluster: Optional[bool] = True
    skip_3d: Optional[bool] = False
    skip_tsne: Optional[bool] = False



class Datasets(BaseModel):
    datasetIds: List[str] = []
    dataset: List[str] = []
    input: List[str] = []
    user_refs: Optional[List[str]] = []
    output: Optional[str] = None
    userID: str
    output_format: Optional[str] = 'AnnData'
    # methods: Optional[List[str]] = []
    method: Optional[List[str]] = []
    # batch_key: Optional[str] = None
    # pseudo_replicates: Optional[int] = 0
    species: Optional[str] = 'Mouse' # c("Human", "Mouse") Species of the database for annotation. Allowed input is human or mouse.
    organ_part: Optional[str] = None # organ part or tissue for annotation, e.g., "lung", "brain"
    idtype: Optional[str] = 'SYMBOL' # idtype should be one of "SYMBOL", "ENSEMBL", "ENTREZID" or "REFSEQ".
    cluster_label: Optional[str] = None
    process: Optional[str] = None
    description: Optional[str] = None
    n_hvg: Optional[int] = 50 # Number of highly variable genes to use for Heatmap of Vitessce
    do_umap: Optional[bool] = True
    do_cluster: Optional[bool] = True
    skip_3d: Optional[bool] = False
    skip_tsne: Optional[bool] = False
    qc_params: QCParameters = Field(default_factory=QCParameters)
    integration_params: integrationParameters = Field(default_factory=integrationParameters)
    annotation_params: annotationParameters = Field(default_factory=annotationParameters)
    reduction_params: reductionParameters = Field(default_factory=reductionParameters)
   


class ManualAnnotationRequest(BaseModel):
    job_id: Optional[str] = None
    cluster_id: str
    process_id: str
    userID: Optional[str] = None
    datasetId: Optional[str] = None
    adata_path: str
    description: Optional[str] = None
    layer: Optional[str] = None
    updatedAll: Optional[List[dict]] = []
    updatedChangedOnly: Optional[List[dict]] = []
    deleted: Optional[List[str]] = []
    obsEmbedding: Optional[str] = None
    obsSets: Optional[List[dict]] = []
    zarr_path: Optional[str] = None



class OutlierCorrectionRequest(BaseModel):
    job_id: str
    cluster_id: str
    process_id: str
    userID: Optional[str] = None
    datasetId: Optional[str] = None
    adata_path: str
    description: Optional[str] = None
    layer: Optional[str] = None
    updatedDiscardAll: Optional[List[dict]] = []
    updatedDiscardChangedOnly: Optional[List[dict]] = []
    updatedOutlierAll: Optional[List[dict]] = []
    updatedOutlierChangedOnly: Optional[List[dict]] = []
    deleted: Optional[List[str]] = []
    obsEmbedding: Optional[str] = None
    obsSets: Optional[List[dict]] = []
    zarr_path: Optional[str] = None



class PathRequest(BaseModel):
    path: str



# Define data models using Pydantic for request and response bodies
class ConversionRequest(BaseModel):
    path: str



class ConversionResponse(BaseModel):
    assay_names: list
    adata_path: str
    message: str



class InputFile(BaseModel):
    fileDetails: str
    assay: Optional[str] = None



class InputFilesRequest(BaseModel):
    inputFiles: List[InputFile]



class AnndataMetadata(BaseModel):
    layers: list
    cell_metadata: dict
    gene_metadata: dict
    nCells: int
    nGenes: int
    genes: list
    cells: list
    embeddings: list



class UMAPRequest(BaseModel):
    adata_path: str
    layer: str
    clustering_plot_type: str
    selected_cell_intersection: list
    n_dim: int



class CombinedQCResult(BaseModel):
    scanpy_results: AnndataMetadata  # Assuming you have the AnndataMetadata model defined
    # dropkick_results: AnndataMetadata



class DataSplitRequest(BaseModel):
    benchmarksId: str
    datasetId: str
    userID: Optional[str] = None
    adata_path: str
    train_fraction: float
    validation_fraction: float
    test_fraction: float
    labels: Optional[str] = None  # Added labels field for filtering rows with NaN labels
    task_type: Optional[str] = None



class SubsetDataRequest(BaseModel):
    benchmarksId: str
    datasetId: str
    userID: Optional[str] = None
    adata_path: str
    obskey: str
    values: list



class TaskDataRequest(BaseModel):
    adata_path: str
    task_label: str
    datasetId: str



class BenchmarksRequest(BaseModel):
    benchmarksId: str
    datasetId: str
    userID: Optional[str] = None
    task_type: str
    adata_path: str
    label: Optional[str] = None
    ccc_target: Optional[str] = None
    bm_traj: Optional[str] = None
    origin_group: Optional[str] = None
    batch_key: Optional[str] = None
    celltypist_model: Optional[str] = None
    SingleR_ref: Optional[List[str]]= []
    mod1: Optional[str] = None
    mod2: Optional[str] = None
    species: Optional[str] = 'mouse'
    # data: List[TaskDataRequest]



class UploadRequest(BaseModel):
    fileDetails: List[str]
    assay_name: Optional[str] = None
    userID: str
    sample: Optional[str] = None



class QualityControlRequest(BaseModel):
    fileDetails: str
    assay: Optional[str] = None
    min_genes: int
    max_genes: int
    min_cells: int
    target_sum: float
    n_top_genes: int
    n_neighbors: int
    n_pcs: int
    resolution: float
    regress_cell_cycle: bool
    use_default: bool
    doublet_rate: float
    unique_id: str


class ProcessResultsRequest(BaseModel):
    process_ids: List[str]
    clustering_plot_type: Optional[str] = 'leiden'
    annotation: Optional[str] = None
    record_type: Optional[str] = None
    selected_cell_intersection: Optional[List[str]]= None


class DownloadDataset(BaseModel):
    dataset_id: str
    user_id: Optional[str] = None
    process_type: Optional[str] = None
    method:  Optional[str] = None
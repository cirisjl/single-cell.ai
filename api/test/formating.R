library(scater)
library(anndata)
library(Seurat)
library(SingleCellExperiment)
library(SeuratDisk)
library(SeuratData)
library(patchwork)
library(Signac)
# library(scDblFinder)
library(BiocParallel)
# library(loomR)
library(Matrix)
library(RhpcBLASctl)
blas_set_num_threads(1)
omp_set_num_threads(1)

# Get suffix of the file
GetSuffix <- function(path) {
    filename <- basename(path)
    parts <- strsplit(filename,".",fixed = TRUE)
    nparts <- length(parts[[1]])
    return(parts[[1]][nparts])
}

# Read csv/xlsx/h5ad/hdf5/h5/loom/mtx/txt/tab/data/gz file to create AnnData object
LoadAnndata <- function(path) {
    adata <- NULL
    suffix <- tolower(GetSuffix(path))
    if(suffix == "csv"){
        adata <- read_csv(path)
    } else if(suffix == "xlsx"){
        adata <- read_excel(path)
    } else if(suffix == "h5ad"){
        adata <- read_h5ad(path)
    } else if(suffix == "hdf5" || suffix == "h5"){
        adata <- read_hdf(path)
    } 
    # else if(suffix == "loom"){
    #     ad <- read_loom(path)
    # }
     else if(suffix == "mtx"){
        adata <- read_mtx(path)
    } else if(suffix == "txt" || suffix == "tab" || suffix == "data"){
        delim <- DetectDelim(path)
        adata <- read_text(path, delimiter = delim)
    } else if(suffix == "gz"){
        adata <- read_umi_tools(path)
    } else if(suffix == "h5Seurat" || suffix == "h5seurat" || suffix == "rds" || suffix == "robj"){
        srat <- LoadSeurat(path)
        adata <- ConvertToAnndata(srat)
    } 
    # else if(suffix == "rds" || suffix == "robj"){
    #     srat <- LoadSeurat(path)
    #     seurat_path <- paste0(tools::file_path_sans_ext(path), ".h5Seurat")
    #     SaveH5Seurat(srat, filename = seurat_path, overwrite = TRUE, verbose = FALSE)        
    #     Convert(paste0(tools::file_path_sans_ext(path), ".h5Seurat"), dest = "h5ad" , overwrite = TRUE, verbose = FALSE)
    #     adata_path <- Convert(seurat_path, dest = "h5ad" , overwrite = TRUE, verbose = FALSE)
    #     adata <- read_h5ad(adata_path)    
    # } 
    # else if(suffix == "loom"){
    #     srat <- LoadSeurat(path)
    #     SaveH5Seurat(srat, overwrite = TRUE)
    #     Convert(paste0(tools::file_path_sans_ext(path), ".h5Seurat"), dest = "h5ad")
    #     ad <- read_h5ad(paste0(tools::file_path_sans_ext(path), ".h5ad"))
    # } 
    py_to_r_ifneedbe(adata)
}

LoadExpressionMatrix <- function(path) {
    expression_matrix <- NULL
    if(file_test("-d", path)) {
        if(file.exists(file.path(path,"barcodes.tsv")) && file.exists(file.path(path,"genes.tsv")) && file.exists(file.path(path,"matrix.mtx"))){
            expression_matrix <- Read10X(data.dir = path)
        } else if(file.exists(file.path(path,"barcodes.tsv.gz")) && file.exists(file.path(path,"genes.tsv.gz")) && file.exists(file.path(path,"matrix.mtx.gz"))){
            expression_matrix <- Read10X(data.dir = path)
        } else if(file.exists(file.path(path,"count_matrix.mtx.gz")) && file.exists(file.path(path,"features.tsv.gz")) && file.exists(file.path(path,"barcodes.tsv.gz"))){
            expression_matrix <- ReadMtx(mtx = "count_matrix.mtx.gz", features = file.path(path,"features.tsv.gz"), cells = file.path(path,"barcodes.tsv.gz"))
        } else if(file.exists(file.path(path,"count_matrix.mtx")) && file.exists(file.path(path,"features.tsv")) && file.exists(file.path(path,"barcodes.tsv"))){
            expression_matrix <- ReadMtx(mtx = "count_matrix.mtx", features = file.path(path,"features.tsv"), cells = file.path(path,"barcodes.tsv"))           
        } else if(file.exists(file.path(path,"molecules.txt")) && file.exists(file.path(path,"annotation.txt"))){
            delim <- DetectDelim(path)
            molecules <- read.delim(file.path(path,"molecules.txt"), sep = delim, row.names = 1) 
            expression_matrix <- as.matrix(molecules)} 
    } else{       
        suffix <- tolower(GetSuffix(path))
        if(suffix == "h5"){
            expression_matrix  <- Read10X_h5(path, use.names = T)
            if('Gene Expression' %in% names(expression_matrix)) expression_matrix <- expression_matrix$`Gene Expression`
        }
        else if(suffix == "csv"){
            expression_matrix  <- as.matrix(read.csv(path, header=TRUE, row.names=1))
        } 
    }
    expression_matrix
}


LoadSeurat <- function(path, project = NULL) {
    srat <- NULL
    suffix <- tolower(GetSuffix(path))

    if(suffix == "h5seurat"){
        print("Inside LoadSeurat")
        srat <- LoadH5Seurat(path)
    } else if(suffix == "h5ad"){
        # Convert(path, "h5seurat", overwrite = TRUE, assay = "RNA")
        # srat <- LoadH5Seurat(paste0(tools::file_path_sans_ext(path), ".h5seurat"))
        project_name <- sub("\\.h5ad$", "", basename(path))
        adata <- LoadAnndata(path)
        # srat <- AnndataToSeurat(adata, project_name = project_name, complete = FALSE)
        tryCatch({
            srat <- AnndataToSeurat(adata, project_name = project_name)
        }, error = function(e) {
            print(paste0("An error happened when converting AnnData to Seurat, try loading a simple one: ", e$message))
        }, finally = {
          # Finally block: executed regardless of errors/warnings
          srat <- AnndataToSeurat(adata, project_name = project_name, complete = FALSE)
          return(srat)
        }) 
        
        rm(adata)
    } else if(suffix == "rds"){
        print("insode if else block of rds")
        robj <- readRDS(path)
        if(class(robj) == 'Seurat'){
            # srat <- CreateSeuratObject(counts=robj[['RNA']]$counts, meta.data=robj@meta.data, project = Project(robj))
            srat <- robj
        } else if(class(robj) == 'SingleCellExperiment'){
            if ('logcounts' %in% names(robj)){
                srat <- as.Seurat(robj, slot = "counts")
            } else {
                srat <- as.Seurat(robj, slot = "counts", data = NULL)
            }
        }
        rm(robj)
    } else if(suffix == "robj"){
        robj <- get(load(path))
        if(tolower(class(robj)) == 'seurat'){
            if (compareVersion(as.character(robj@version), "3.0.0") < 0){
                srat_v3 <- UpdateSeuratObject(robj)
                srat <- CreateSeuratObject(counts=srat_v3[['RNA']]@counts, meta.data=srat_v3@meta.data, project = Project(srat_v3))
                rm(srat_v3)
            } else {
                srat <- robj
            }           
        }
        rm(robj)
    } else {
        expression_matrix <- LoadExpressionMatrix(path)
        if(!is.null(expression_matrix) && !is.null(project)) {
            srat <- CreateSeuratObject(counts = expression_matrix, project = project)
        } else if (!is.null(expression_matrix)){
            srat <- CreateSeuratObject(counts = expression_matrix)
        }
        rm(expression_matrix) # Erase expression_matrix from memory to save RAM
    }
    # else if(suffix == "loom"){
    #     loom <- connect(filename = path, mode = "r")
    #     srat <- as.Seurat(loom)
    # }
    gc()
    srat
}


LoadSCE <- function(path) {
    sce <- NULL
    if(file_test("-d", path)){
        if(file.exists(file.path(path,"molecules.txt")) && file.exists(file.path(path,"annotation.txt"))){
            delim <- DetectDelim(path)
            molecules <- read.delim(file.path(path,"molecules.txt"), sep = delim, row.names = 1) 
            annotation <- read.delim(file.path(path,"annotation.txt"), sep = delim, stringsAsFactors = T)
            sce <- SingleCellExperiment(assays = list(counts = as.matrix(molecules)), colData = annotation)
        } else{
            srat <- LoadSeurat(path)
            if(!is.null(srat)){
                sce <- as.SingleCellExperiment(srat)
                rm(srat) # Erase expression_matrix from memory to save RAM
            }
        }
    } else{
        suffix <- tolower(GetSuffix(path))
        if(suffix == "rds"){
            sce <- readRDS(path)
        } else{
            srat <- LoadSeurat(path)
            if(!is.null(srat)){
                sce <- as.SingleCellExperiment(srat)
                rm(srat) # Erase expression_matrix from memory to save RAM
            }
        }
    }
    sce
}


# LoadSeuratMetaData <- function(path, assay='RNA'){
#     srat <- LoadSeurat(path)
#     default_assay <- NULL
#     assay_names <- NULL
#     metadata <- NULL
#     nCells <- ncol(srat)
#     nGenes <- nrow(srat)
#     nGenes <- 0
#     nCells <- 0

#     if(!is.null(srat)){
#         assay_names <- names(srat@assays)
#         if(assay != 'RNA' && assay %in% assay_names) DefaultAssay(srat) <- assay
#         default_assay <- DefaultAssay(srat)
#         metadata <- srat@meta.data
#     }

#     list(srat=srat, default_assay=default_assay, assay_names=assay_names, metadata=metadata)
# }


ConvertToSeurat <- function(input, output){
    srat <- LoadSeurat(input)
    output <- SaveSeurat(srat, output)
    output
}


ConvertToSCE <- function(input, output){
    sce <- LoadSCE(input)
    saveRDS(sce, file = output)
    output
}


# Return metadata and a list of assays if the default assay is not "RNA"
GetMetadataFromSeurat <- function(path, assay='RNA') {
    srat <- LoadSeurat(path)
    default_assay <- NULL
    assay_names <- NULL
    metadata <- NULL
    HVGsID <- NULL
    nGenes <- 0
    nCells <- 0
    genes <- NULL
    cells <- NULL
    pca <- NULL
    tsne <- NULL
    umap <- NULL
    info <- NULL
    # suffix <- tolower(GetSuffix(path))

    if(!is.null(srat)){
        assay_names <- names(srat@assays)
        if(assay != 'RNA' && assay %in% assay_names){
            DefaultAssay(srat) <- assay
        }
        else if(!(assay %in% assay_names)){
            assay <- DefaultAssay(srat)
        }        
        default_assay <- DefaultAssay(srat)
        metadata <- srat@meta.data
        nCells <- ncol(srat)
        nGenes <- nrow(srat)
        genes <- rownames(srat)
        cells <- Cells(srat)
        HVGsID <- srat[[assay]]@var.features
        if('pca' %in% names(srat@reductions)) pca <- Embeddings(object = srat, reduction = "pca")
        if('tsne' %in% names(srat@reductions)) tsne <- Embeddings(object = srat, reduction = "tsne")
        if('umap' %in% names(srat@reductions)) umap <- Embeddings(object = srat, reduction = "umap")
        info <- str(srat)
    }
    srat <- NULL
    
    list(default_assay=default_assay, assay_names=assay_names, metadata=metadata, nCells=nCells, nGenes=nGenes, genes=genes, cells=cells, HVGsID=HVGsID, pca=pca, tsne=tsne, umap=umap, info=info)
}


# Return a list of assays if the default assay is not "RNA"
ConvertSeuratSCEtoAnndata <- function(path, assay = 'RNA') {
    assay_names <- NULL
    default_assay <- NULL
    adata_path <- paste0(tools::file_path_sans_ext(path), ".h5ad")
    suffix <- tolower(GetSuffix(path))
    
    print("Inside ConvertSeuratSCEtoAnndata R function")
    srat <- LoadSeurat(path)

    print("srat object is loaded")
    default_assay <- DefaultAssay(srat)
    assay_names <- names(srat@assays)

    if (!is.null(assay) && assay %in% assay_names && assay != 'RNA') {
        DefaultAssay(srat) <- assay
        SeuratToAnndata(srat, adata_path, assay=assay)
    }
    else{
        SeuratToAnndata(srat, adata_path, assay=default_assay)
    }

    # if(suffix == "h5Seurat" || suffix == "h5seurat"){
    #     if(!is.null(assay) && assay %in% assay_names && assay != 'RNA') {
    #         DefaultAssay(srat) <- assay
    #         SaveH5Seurat(srat, filename = path, overwrite = TRUE, verbose = FALSE)
    #     }
    #     adata_path <- Convert(path, dest = "h5ad", assay=assay, overwrite = TRUE, verbose = FALSE)
    # } else if(suffix == "rds" || suffix == "robj"){
    #     seurat_path <- paste0(tools::file_path_sans_ext(path), ".h5Seurat")
    #     SaveH5Seurat(srat, filename = seurat_path, overwrite = TRUE, verbose = FALSE)
    #     adata_path <- Convert(seurat_path, dest = "h5ad" , overwrite = TRUE, verbose = FALSE)
    # }
    srat <- NULL

    list(default_assay=default_assay, assay_names=assay_names, adata_path=adata_path) # Check if the assay_names is NULL to verify is the function runs successfully
}


ConvertToAnndata <- function(path, assay = 'RNA') {
    adata_path <- NULL
    suffix <- tolower(GetSuffix(path))
    srat <- LoadSeurat(path)
    seurat_path <- paste0(tools::file_path_sans_ext(path), "_", assay, ".h5seurat")
    if(suffix == "h5Seurat" || suffix == "h5seurat"){
        if(assay != 'RNA') {
            DefaultAssay(srat) <- assay
            SaveH5Seurat(srat, filename = seurat_path, overwrite = TRUE, verbose = FALSE)
            adata_path <- Convert(seurat_path, dest = "h5ad", assay=assay, overwrite = TRUE, verbose = FALSE)
        } else {
            adata_path <- Convert(path, dest = "h5ad", assay=assay, overwrite = TRUE, verbose = FALSE)
        }
    } else if(suffix == "rds"){
        seurat_path <- paste0(tools::file_path_sans_ext(path), ".h5Seurat")
        SaveH5Seurat(srat, filename = seurat_path, overwrite = TRUE, verbose = FALSE)
        adata_path <- Convert(seurat_path, dest = "h5ad" , overwrite = TRUE, verbose = FALSE)
    } 
    adata_path
}


SeuratToAnndata <- function(obj, out_file=NULL, assay="RNA", main_layer="counts", transfer_layers="scale.data", drop_single_values=FALSE, drop_na_values=TRUE) {
    # print("inside s to a")
    # print(out_file)
    main_layer <- match.arg(main_layer, c("data", "counts", "scale.data"))
    transfer_layers <- transfer_layers[
        transfer_layers %in% c("data", "counts", "scale.data")
    ]
    transfer_layers <- transfer_layers[transfer_layers != main_layer]

    if (compareVersion(as.character(obj@version), "3.0.0") < 0) {
        obj <- Seurat::UpdateSeuratObject(object=obj)
    }

    X <- Seurat::GetAssayData(object=obj, assay=assay, layer=main_layer)

    # Change the names of metadata to AnnData naming convention
    if(paste0("nCount_", assay) %in% names(obj@meta.data)) names(obj@meta.data)[names(obj@meta.data) ==paste0("nCount_", assay)] <-"n_counts"
    if(paste0("nFeature_", assay) %in% names(obj@meta.data)) names(obj@meta.data)[names(obj@meta.data) ==paste0("nFeature_", assay)] <-"n_genes"
    if("percent.mt" %in% names(obj@meta.data)) names(obj@meta.data)[names(obj@meta.data) =="percent.mt"] <-"pct_counts_mt"
    if("percent.rb" %in% names(obj@meta.data)) names(obj@meta.data)[names(obj@meta.data) =="percent.rb"] <-"pct_counts_rb"
    if("percent.hb" %in% names(obj@meta.data)) names(obj@meta.data)[names(obj@meta.data) =="percent.hb"] <-"pct_counts_hb"
    # if("seurat_clusters" %in% names(obj@meta.data)) names(obj@meta.data)[names(obj@meta.data) =="seurat_clusters"] <-"leiden"

    obs <- .regularise_df(obj@meta.data, drop_single_values=drop_single_values, drop_na_values=drop_na_values)

    var <- .regularise_df(Seurat::GetAssay(obj, assay=assay)@meta.features, drop_single_values=drop_single_values, drop_na_values=drop_na_values)

    colnames(var) <- sub("vst.variable", "highly_variable", colnames(var))

    obsm <- NULL
    reductions <- names(obj@reductions)
    tryCatch({
        if (length(reductions) > 0) {
            obsm <- sapply(
            reductions,
            function(name) as.matrix(Seurat::Embeddings(obj, reduction=name)),
            simplify = FALSE
            )
            names(obsm) <- paste0("X_", tolower(names(obj@reductions)))
        }
    }, error = function(e) {
        print(paste0("An error happened when saving obsm, skipped: ", e$message))
    }) 

    layers <- list()
    for (layer in transfer_layers) {
        mat <- Seurat::GetAssayData(object=obj, assay=assay, layer=layer)
        if (all(dim(mat) == dim(X))) layers[[layer]] <- Matrix::t(mat)
    }

    adata <- AnnData(
        X = Matrix::t(X),
        obs = obs,
        var = var,
        obsm = obsm,
        layers = layers
    )

    if (!is.null(out_file)) {
        write_h5ad(adata, out_file, compression = "gzip")
        # print("AnnData object is saved successfully.")
    }

    adata
}

# save_as_anndata <- function(srat, path, assay = 'RNA'){
#     anndata_path <- gsub("h5seurat", "h5ad", path, ignore.case = TRUE)
#     DefaultAssay(srat) <- assay
#     srat = DietSeurat(
#         srat,
#         counts = TRUE, # so, raw counts save to adata.layers['counts']
#         data = TRUE, # so, log1p counts save to adata.X when scale.data = False, else adata.layers['data']
#         scale.data = FALSE, # if only scaled highly variable gene, the export to h5ad would fail. set to false
#         features = rownames(srat), # export all genes, not just top highly variable genes
#         assays = assay,
#         dimreducs = c("pca","umap"),
#         graphs = c("RNA_nn", "RNA_snn"), # to RNA_nn -> distances, RNA_snn -> connectivities
#         misc = TRUE
#         )
#     if(!MuDataSeurat::WriteH5AD(srat, anndata_path, assay=assay)){
#         anndata_path <- NULL
#     }
#     srat <- NULL
#     anndata_path
# }


#' Automatically detect delimiters in a text file
#'
#' This helper function was written expressly for \code{\link{set_physical}} to
#' be able to automate its \code{recordDelimiter} argument.
#'
#' @param path (character) File to search for a delimiter
#' @param nchar (numeric) Maximum number of characters to read from disk when
#' searching
#'
#' @return (character) If found, the delimiter, it not, \\r\\n
DetectDelim <- function(path, nchar = 1e3) {
  # only look for delimiter if the file exists
  if (file.exists(path)) {
    # readChar() will error on non-character data so
    chars <- tryCatch(
      {
        readChar(path, nchar)
      },
      error = function(e) {
        NA
      }
    )
    search <- regexpr("[,|\\t|;||]+", chars, perl = TRUE)

    if (!is.na(search) && search >= 0) {
      return(substr(chars, search, search + attr(search, "match.length") - 1))
    }
  }
  # readChar() will error on non-character data 
}

py_to_r_ifneedbe <- function(x) {
    if (inherits(x, "python.builtin.object")) {
        py_to_r(x)
    } else {
        x
    }
}


SeuratToCSV <- function(srat, srat_path, assay = 'RNA', slot = "counts"){
    if(assay != 'RNA') slot ="data"
    csv_path <- gsub(".h5Seurat", paste("_", assay, ".csv", sep = ""), srat_path)
    if(!file.exists(csv_path)){
        write.table(as.matrix(GetAssayData(object = srat, assay = assay, slot = slot)), 
        csv_path, sep = ',', row.names = T, col.names = T, quote = F)
    } else{
        print("CSV file already exists.")
    }
    csv_path
}


PlotIntegratedClusters <- function (srat) { 
  ## take an integrated Seurat object, plot distributions over orig.ident
  library(Seurat)
  library(patchwork)
  library(ggplot2)
  library(reshape2)
  library(RColorBrewer)
  
  
  count_table <- table(srat@meta.data$seurat_clusters, srat@meta.data$orig.ident)
  count_mtx   <- as.data.frame.matrix(count_table)
  count_mtx$cluster <- rownames(count_mtx)
  melt_mtx <- melt(count_mtx)
  melt_mtx$cluster <- as.factor(melt_mtx$cluster)

  cluster_size <- aggregate(value ~ cluster, data = melt_mtx, FUN = sum)
  
  sorted_labels <- paste(sort(as.integer(levels(cluster_size$cluster)),decreasing = T))
  cluster_size$cluster <- factor(cluster_size$cluster,levels = sorted_labels)
  melt_mtx$cluster <- factor(melt_mtx$cluster,levels = sorted_labels)
  
  colnames(melt_mtx)[2] <- "dataset"
  
  
  p1 <- ggplot(cluster_size, aes(y= cluster,x = value)) + geom_bar(position="dodge", stat="identity",fill = "grey60") + 
    theme_bw() + scale_x_log10() + xlab("Cells per cluster, log10 scale") + ylab("")
  p2 <- ggplot(melt_mtx,aes(x=cluster,y=value,fill=dataset)) + 
    geom_bar(position="fill", stat="identity") + theme_bw() + coord_flip() + 
    scale_fill_brewer(palette = "Set2") +
    ylab("Fraction of cells in each dataset") + xlab("Cluster number") + theme(legend.position="top")
  
  p2 + p1 + plot_layout(widths = c(3,1))
  }


load_metadata <- function(seurat_obj) {
    metadata <- list()  # Create an empty list to hold metadata
    
    # Get the Default Assay
    metadata$default_assay <- DefaultAssay(object = seurat_obj)
    
    # Get the names of all assays
    metadata$assay_names <- names(seurat_obj@assays)
    if (is.null(metadata$assay_names)) {
        # Return an empty array (vector)
        metadata$assay_names <- character(0)
    }
    
    # Get the dimensions of the Seurat object
    metadata$seurat_dims <- dim(seurat_obj)
    
    # Get the number of genes
    metadata$num_genes <- metadata$seurat_dims[1]
    
    # Get the number of cells
    metadata$num_cells <- metadata$seurat_dims[2]
    
    # Get the list of dimensional reductions
    metadata$dimensional_reductions <- names(seurat_obj@reductions)
    if (is.null(metadata$dimensional_reductions)) {
        # Return an empty array (vector)
        metadata$dimensional_reductions <- character(0)
    }
    
    # Return the metadata list
    metadata
}


# AnnotateDroplet <- function(srat){
#     set.seed(123)
#     sce <- scDblFinder(
#         as.SingleCellExperiment(srat)
#         ) 
#     doublet_score = sce$scDblFinder.score
#     doublet_class = sce$scDblFinder.class
#     list(doublet_score=doublet_score, doublet_class=doublet_class)
# }


IsNormalized <- function(Expression_Matrix, min_genes=200){
    is_normalized <- FALSE 
    if (max(Expression_Matrix) < min_genes | min(Expression_Matrix) < 0) {
        is_normalized <- TRUE
    }
    is_normalized
}


#' Regularise dataframe
#'
#' This function checks if certain columns of a dataframe is of a single value
#' and drop them if required
#'
#' @param df Input data frame, usually cell metadata table (data.frame-like
#'   object)
#' @param drop_single_values Drop columns with only a single value (logical)
#'
#' @return Dataframe
.regularise_df <- function(df, drop_single_values=FALSE, drop_na_values=TRUE) {
  if (ncol(df) == 0) df[["name"]] <- rownames(df)
  if (drop_single_values) {
    k_singular <- sapply(df, function(x) length(unique(x)) == 1)
    if (sum(k_singular) > 0) {
      warning(
        paste("Dropping single category variables:"),
        paste(colnames(df)[k_singular], collapse = ", ")
      )
    }
    df <- df[, !k_singular, drop = F]
    if (ncol(df) == 0) df[["name"]] <- rownames(df)
  }
 if (drop_na_values) {
    k_na <- sapply(df, function(x) sum(is.na(x))==length(x))
    if (sum(k_na) > 0) {
      warning(
        paste("Dropping NA category variables:"),
        paste(colnames(df)[k_na], collapse = ", ")
      )
    }
    df <- df[, !k_na, drop = F]
    if (ncol(df) == 0) df[["name"]] <- rownames(df)
  }
  return(df)
}


#' Prepare cell metadata
#'
#' This function prepare cell metadata from AnnData.obs
#'
#' @param obs_pd Input AnnData.obs dataframe
#' @param assay Assay name, default "RNA" (str)
#'
#' @return AnnData object
#'
#' @import reticulate
.obs2metadata <- function(obs_pd, assay = "RNA") {
  obs_df <- .regularise_df(obs_pd, drop_single_values=FALSE, drop_na_values=TRUE)
  colnames(obs_df) <- sub("n_counts", paste0("nCounts_", assay), colnames(obs_df))
  colnames(obs_df) <- sub("n_genes", paste0("nFeatures_", assay), colnames(obs_df))
  if("pct_counts_mt" %in% colnames(obs_df)) colnames(obs_df) <- sub("pct_counts_mt", "percent.mt", colnames(obs_df))
  if("pct_counts_rb" %in% colnames(obs_df)) colnames(obs_df) <- sub("pct_counts_rb", "percent.rb", colnames(obs_df))
  if("pct_counts_hb" %in% colnames(obs_df)) colnames(obs_df) <- sub("pct_counts_hb", "percent.hb", colnames(obs_df))
  return(obs_df)
}


#' Prepare feature metadata
#'
#' This function prepare feature metadata from AnnData.var
#'
#' @param var_pd Input AnnData.var dataframe
#'
#' @return AnnData object
#'
#' @import reticulate
.var2feature_metadata <- function(var_pd) {
  var_df <- .regularise_df(var_pd, drop_single_values=FALSE, drop_na_values=TRUE)
  colnames(var_df) <- sub("dispersions_norm", "mvp.dispersion.scaled", colnames(var_df))
  colnames(var_df) <- sub("dispersions", "mvp.dispersion", colnames(var_df))
  colnames(var_df) <- sub("means", "mvp.mean", colnames(var_df))
  colnames(var_df) <- sub("highly_variable", "vst.variable", colnames(var_df))
  return(var_df)
}


.uns2misc <- function(ad, target_uns_keys = list()) {
  uns_keys <- intersect(target_uns_keys, ad$uns_keys())
  misc <- sapply(uns_keys, function(x) ad$uns[x], simplify = FALSE, USE.NAMES = TRUE)
  return(misc)
}


#' Convert AnnData object to Seurat object
#'
#' This function converts an AnnData object to a Seurat object
#'
#' @param inFile Path to an input AnnData object on disk (str)
#' @param outFile Save output Seurat to this file if specified (str or NULL)
#' @param assay Name of assay in Seurat object to store expression values,
#'   default "RNA" (str)
#' @param main_layer Name of slot in `assay` to store AnnData.X, can be
#'   "counts", "data", "scale.data", default "counts" (str)
#' @param use_seurat Use Seurat::ReadH5AD() to do the conversion, default FALSE (logical)
#' @param lzf Whether AnnData is compressed by `lzf`, default FALSE (logical)
#'
#' @return Seurat object
#'
#' @import reticulate
#' @import Matrix
AnndataToSeurat <- function(adata, outFile = NULL, main_layer = "counts", assay = "RNA", project_name = "Seurat Project", target_uns_keys = list(), complete = TRUE) {
  main_layer <- match.arg(main_layer, c("counts", "data", "scale.data"))
  sp <- reticulate::import("scipy.sparse", convert = FALSE)
  
  obs_df <- .obs2metadata(adata$obs)
  var_df <- .var2feature_metadata(adata$var)
  X <- t(adata$X)
  if ("dgCMatrix" %in% class(X) || "dgRMatrix" %in% class(X)){
    X <- as.matrix(X)
  }
  colnames(X) <- rownames(obs_df)
  rownames(X) <- rownames(var_df)

#   if ('scale.data' %in% names(adata$layers)){
#     srat <- CreateSeuratObject(counts = X, data = t(adata$layers['scale.data']), project = project_name, meta.data = obs_df)
#     message("X -> counts; scale.data -> data")
#   } else {
#     srat <- CreateSeuratObject(counts = X, project = project_name, meta.data = obs_df)
#     message("X -> counts")
#   }

  srat <- CreateSeuratObject(counts = X, project = project_name, meta.data = obs_df)
  srat[[assay]]@meta.features <- var_df
  message("X -> counts")

  if(complete){
    # Add AnnData layers to assays
    for (layer in names(adata$layers)){
        if (layer != 'scale.data'){
            layer_data <- t(adata$layers[layer])
            if ("dgCMatrix"  %in% class(layer_data) || "dgRMatrix" %in% class(layer_data)){
                layer_data <- as.matrix(layer_data)
            }
            srat[[layer]] <- CreateAssayObject(data=layer_data)
        }
        message("Adding AnnData layers to Seurat assays")
    }

    DefaultAssay(srat) <- assay

    # Add dimension reductions
    embed_names <- unlist(adata$obsm_keys())
    if (length(embed_names) > 0) {
        embeddings <- sapply(embed_names, function(x) as.matrix(adata$obsm[[x]]), simplify = FALSE, USE.NAMES = TRUE)
        names(embeddings) <- embed_names
        for (name in embed_names) {
            rownames(embeddings[[name]]) <- colnames(srat[[assay]])
        }

        dim.reducs <- vector(mode = "list", length = length(embeddings))
        for (i in seq(length(embeddings))) {
            name <- embed_names[i]
            embed <- embeddings[[name]]
            key <- switch(name,
            sub("_(.*)", "\\L\\1", sub("^X_", "", toupper(name)), perl = T),
            "X_pca" = "PC",
            "X_tsne" = "tSNE",
            "X_umap" = "UMAP"
            )
            colnames(embed) <- paste0(key, "_", seq(ncol(embed)))
            dim.reducs[[i]] <- Seurat::CreateDimReducObject(
            embeddings = embed,
            loadings = new("matrix"),
            assay = assay,
            stdev = numeric(0L),
            key = paste0(key, "_")
            )
        }
        names(dim.reducs) <- sub("X_", "", embed_names)

        for (name in names(dim.reducs)) {
            srat[[name]] <- dim.reducs[[name]]
            message("Adding AnnData embeddings to Seurat assays")
        } 
    }

    srat@misc <- .uns2misc(adata, target_uns_keys = target_uns_keys)
  }
  
  # if (!is.null(outFile)) SaveH5Seurat(srat, filename = outFile, overwrite = TRUE, verbose = FALSE)
  if (!is.null(outFile)) saveRDS(object = srat, file = outFile)

  srat
}


SaveSeurat <- function(srat, output){
    tryCatch({
        SaveH5Seurat(srat, filename=output, overwrite=TRUE, verbose=FALSE)
    }, error = function(e) {
        print(paste0("Failed to save Seurat object to h5seurat, changing file format to RDS: ", e$message))
        output = gsub("h5seurat", "rds", output)
        saveRDS(object=srat, file=output)
    })
    output
}


CleanSeurat <- function(srat){
    # Scanpy
    if('outlier' %in% names(srat@meta.data) && 'mt_outlier' %in% names(srat@meta.data)){
        srat <- subset(srat, subset = outlier == FALSE)
        srat <- subset(srat, subset = mt_outlier == FALSE)
    }

    if('predicted_doublets' %in% names(srat@meta.data)){
        srat <- subset(srat, subset = predicted_doublets == FALSE)
    }

    # Bioconductor
    if('discard' %in% names(srat@meta.data)){
        srat <- subset(srat, subset = discard == FALSE)
    }

    # Seurat
    if('doublet_class' %in% names(srat@meta.data)){
        srat <- subset(srat, subset = doublet_class == 'Singlet')
    }

    # if('vst.variable' %in% names(srat[['RNA']]@meta.features)){
    #     srat <- srat[VariableFeatures(object = srat), ]
    # }
    srat
}

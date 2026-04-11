# library(ggplot2)
# library(SingleR)
library(dplyr)
library(celldex)
library(RColorBrewer)
library("here")
# source(here::here('api/tools/formating/formating.R')) # Unit test
source(here::here('tools/formating/formating.R'))
library(RhpcBLASctl)
blas_set_num_threads(1)
omp_set_num_threads(1)


clustering <- function(path, labels, dims=1:10){ # labels: column name of labels in srat@meta.data
    srat <- tryCatch(
        LoadSeurat(path),
        error = function(e) {
            stop("The file format is not supported.")
            print(e)
        }
    )
    srat <- CleanSeurat(srat)
    srat <- FindVariableFeatures(srat, selection.method = "vst")
    srat <- ScaleData(srat, features = rownames(srat))

    # PCA
    # srat <- RunPCA(srat, features = VariableFeatures(srat), ndims.print = 6:10, nfeatures.print = 10)
    srat <- RunPCA(srat, features = VariableFeatures(srat))

    srat <- FindNeighbors(srat, dims=dims)
    srat <- FindClusters(srat, resolution = 0.5)
    srat

    # TSNE
    # srat <- RunTSNE(srat, dims=dims)
    # UMAP
    srat <- RunUMAP(srat, dims=dims)

    umap <- Embeddings(object = srat, reduction = "umap")
    output <- paste0(tools::file_path_sans_ext(path), ".rds")
    saveRDS(object = srat, file = output)

    list(labels=as.list(srat@meta.data[labels]), labels_pred=as.list(srat@meta.data["seurat_clusters"]), umap=umap)
}
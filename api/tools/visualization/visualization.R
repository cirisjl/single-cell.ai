library(Seurat)
library(ggplot2)
library(patchwork)
library(RhpcBLASctl)
blas_set_num_threads(1)
omp_set_num_threads(1)

seurat_umap <- function(srat, assay = 'RNA', title = NULL) {
    DefaultAssay(srat) <- assay
    # srat <- NormalizeData(srat, verbose = F)
    srat <- FindVariableFeatures(srat, selection.method = "vst", nfeatures = 2000, verbose = F)
    srat <- ScaleData(srat, verbose = F)
    srat <- RunPCA(srat, npcs = 30, verbose = F)
    srat <- RunUMAP(srat, reduction = "pca", dims = 1:30, verbose = F)
    plot <- DimPlot(srat,reduction = "umap")

    if(!is.null(title)){
        plot + plot_annotation(title = title)
    }
    
    plot
}


seurat_cluster_umap <- function(srat, assay = 'RNA', title = NULL) {
    DefaultAssay(srat) <- assay
    # srat <- NormalizeData(srat, verbose = F)
    srat <- FindVariableFeatures(srat, selection.method = "vst", nfeatures = 2000, verbose = F)
    srat <- ScaleData(srat, verbose = F)
    srat <- RunPCA(srat, npcs = 30, verbose = F)
    srat <- RunUMAP(srat, reduction = "pca", dims = 1:30, verbose = F)

    srat <- FindNeighbors(srat, dims = 1:30, k.param = 10, verbose = F)
    srat <- FindClusters(srat, verbose = F)
    plot <- DimPlot(srat, label = T) + NoLegend()

    if(!is.null(title)){
        plot + plot_annotation(title = title)
    }
    
    plot
}
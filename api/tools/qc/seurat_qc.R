library(ggplot2)
library(SingleR)
library(dplyr)
library(celldex)
library(RColorBrewer)
library(stringr)
library(DoubletFinder)
library(RhpcBLASctl)
blas_set_num_threads(1)
omp_set_num_threads(1)
library("here")
source(here::here('tools/formating/formating.R')) # production
# source("/ps/Machine-learning-development-environment-for-single-cell-sequencing-data-analyses/api/tools/formating/formating.R") # test


RunSeuratQC <- function(input, output, unique_id, adata_path=NULL, assay='RNA', min_genes=200, max_genes=0, min_UMI_count=0, max_UMI_count=0, percent_mt_max=5, percent_rb_min=0, resolution=0.5, dims=10, doublet_rate=0.075, n_hvg=2000, regress_cell_cycle=FALSE) {
    srat <- tryCatch(
        LoadSeurat(input, raw=TRUE),
        error = function(e) {
            # stop("The file format is not supported.")
            # print(e)
            RedisError(unique_id, paste0("The file format is not supported: ", e$message))
            stop(paste0("The file format is not supported: ", e$message))
        }
    )

    RedisInfo(unique_id, str(srat))

    default_assay <- NULL
    assay_names <- NULL
    ddl_assay_names <- TRUE

    if(!is.null(srat)){
        assay_names <- names(srat@assays)
        
        if(length(assay_names)==1){
            assay <- DefaultAssay(srat) # If there is only one assay, then no matter if assay is provided, set assay to default assay
        } else if (assay %in% assay_names){
            DefaultAssay(srat) <- assay # If there is more than one assay, and the user provides assay, then set default assay to assay
        } 
        default_assay <- DefaultAssay(srat)
        RedisInfo(unique_id, paste0("Setting default_assay to ", default_assay))

        if(IsNormalized(srat[[default_assay]]$counts, min_genes=min_genes)){
            RedisError(unique_id, "Seurat QC only takes raw counts, not normalized data.")
            stop("Seurat QC only takes raw counts, not normalized data.")
        }

        # Check either the default assay of the Seurat object is "RNA" or the assay is provided by the user.
        if(default_assay==assay){
            # DefaultAssay(srat) <- assay
            if(!paste0("nCount_", default_assay) %in% names(x = srat[[]])) srat[[paste0("nCount_", default_assay)]] <- colSums(x = srat[[default_assay]], slot = "counts")  # nCount of the default assay
            if(!paste0("nFeature_", default_assay) %in% names(x = srat[[]])) srat[[paste0("nFeature_", default_assay)]] <- colSums(x = GetAssayData(object = srat[[default_assay]], slot = "counts") > 0)  # nFeature of the default assay
            
            # Calculate the percentage of mitocondrial per cell and add to the metadata.
            RedisInfo(unique_id, "Calculating the percentage of mitocondrial per cell and add to the metadata.")
            if(! "percent.mt" %in% names(x = srat[[]])) srat[["percent.mt"]] <- PercentageFeatureSet(srat, pattern = "^MT-")
            # Calculate the proportion gene expression that comes from ribosomal proteins.
            RedisInfo(unique_id, "Calculating the proportion gene expression that comes from ribosomal proteins.")
            if(! "percent.rb" %in% names(x = srat[[]])) srat[["percent.rb"]] <- PercentageFeatureSet(srat, pattern = "^RP[SL]")

            # Percentage hemoglobin genes - includes all genes starting with HB except HBP.
            RedisInfo(unique_id, "Calculating the percentage hemoglobin genes - includes all genes starting with HB except HBP.")
            if(! "percent.hb" %in% names(x = srat[[]])) srat[["percent.hb"]] <- PercentageFeatureSet(srat, pattern = "^HB[^(P)]")
            if(! "percent.plat" %in% names(x = srat[[]])) srat[["percent.plat"]] <- PercentageFeatureSet(srat, pattern = "PECAM1|PF4")

            RedisInfo(unique_id, "Filtering low quality genes/cells.")
            srat <- subset(srat, subset = paste0("nFeature_", default_assay) > min_genes & paste0("nCount_", default_assay) > min_UMI_count & percent.mt < percent_mt_max)
            if(max_genes != 0) srat <- subset(srat, subset = paste0("nFeature_", default_assay) < max_genes)
            if(max_UMI_count != 0) srat <- subset(srat, subset = paste0("nCount_", default_assay) < max_UMI_count)
            if(percent_rb_min != 0)  srat <- subset(srat, subset = percent.rb > percent_rb_min)
            RedisInfo(unique_id, "Normalizing dataset using logCP10k.")
            srat <- NormalizeData(srat, normalization.method = "LogNormalize", scale.factor = 10000)
            RedisInfo(unique_id, "Finding variable features.")
            srat <- FindVariableFeatures(srat, selection.method = "vst", nfeatures = n_hvg)
            srat <- subset(srat, features=VariableFeatures(srat)) # Only keep variable features
            RedisInfo(unique_id, "Scaling dataset.")
            srat <- ScaleData(srat, features = rownames(srat))

            # PCA
            # srat <- RunPCA(srat, features = VariableFeatures(srat), ndims.print = 6:10, nfeatures.print = 10)
            tryCatch({
                RedisInfo(unique_id, "Running PCA.")
                srat <- RunPCA(srat, features=VariableFeatures(object=srat))
            }, error = function(e) {
                RedisWarning(unique_id, paste0("An error occurred when running t-SNE/UMAP, please try a different parameter n_pcs later, skipped: ", e$message))
            }) 

            if(regress_cell_cycle){
                tryCatch({
                    RedisInfo(unique_id, "Regressing cell cycle.")
                    srat <- RegressCellCycle(srat)
                }, error = function(e) {
                    RedisWarning(unique_id, paste0("An error occurred when regressing cell cycle, skipped: ", e$message))
                }) 
            }

            tryCatch({
                RedisInfo(unique_id, "Finding neighbors.")
                srat <- FindNeighbors(srat, dims=1:dims)
                RedisInfo(unique_id, "Running clustering.")
                srat <- FindClusters(srat, resolution=resolution)
                # TSNE
                RedisInfo(unique_id, "Running TSNE.")
                srat <- RunTSNE(srat, dims=1:dims)
                # UMAP
                RedisInfo(unique_id, "Running UMAP.")
                srat <- RunUMAP(srat, dims=1:dims)
            }, error = function(e) {
                RedisWarning(unique_id, paste0("An error occurred when running t-SNE/UMAP, please try a different parameter n_neighbors later, skipped: ", e$message))
            }) 

            # Add the doublet annotation
            if(doublet_rate!=0 & (! "doublet_class" %in% names(x = srat[[]]))){
                tryCatch({
                    RedisInfo(unique_id, "Annotating doublets.")
                    ## pK Identification (no ground-truth)
                    set.seed(123)
                    sweep.res.list <- paramSweep(srat, PCs=1:10, sct=FALSE)
                    sweep.stats <- summarizeSweep(sweep.res.list, GT=FALSE)
                    bcmvn <- find.pK(sweep.stats)
                    ## Homotypic Doublet Proportion Estimate
                    nExp_poi <- round(doublet_rate*nrow(srat@meta.data)) ## Assuming 7.5% doublet formation rate - tailor for your dataset
                    # Run DoubletFinder with varying classification stringencies
                    srat <- doubletFinder(srat, PCs = 1:10, pN = 0.25, pK = 0.09, nExp = nExp_poi, sct = FALSE)
                    # Change the column names of doublet for metadata
                    colnames(srat@meta.data)[str_starts(colnames(srat@meta.data),"pANN_")] <- "doublet_score"
                    colnames(srat@meta.data)[str_starts(colnames(srat@meta.data),"DF.classifications_")] <- "doublet_class"
                }, error = function(e) {
                    RedisWarning(unique_id, paste0("An error occurred when running DoubletFinder, skipped: ", e$message))
                })               
            } 

            if('doublet_class' %in% names(srat@meta.data)){
                RedisInfo(unique_id, "Removing doublets...")
                srat <- subset(srat, subset = doublet_class == 'Singlet')
            }

            output <- SaveSeurat(srat, output)
            RedisInfo(unique_id, "Seurat object is saved successfully.")
            
            if(!is.null(adata_path)){    
                RedisInfo(unique_id, "Converting Seurat object to AnnData object.") 
                annData <- SeuratToAnndata(srat, out_file=adata_path, assay=assay)
            }
            ddl_assay_names <- FALSE
            rm(srat)
            gc()
        }
    }
    tools <- sessionInfo()
    list(default_assay=default_assay, assay_names=assay_names, output=output, adata_path=adata_path, ddl_assay_names=ddl_assay_names, tools=tools)
}


# RunSeuratQC <- function(srat, output, nFeature_min=200, nFeature_max=0, percent_mt_max=5, percent_rb_min=0, path_of_scrublet_calls=here::here('api/tools/qc/scrublet_calls.tsv'), dims=1:10, regress_cell_cycle=FALSE) {
#     default_assay <- NULL
#     assay_names <- NULL
#     metadata <- NULL
#     HVGsID <- NULL
#     nGenes <- 0
#     nCells <- 0
#     genes <- NULL
#     cells <- NULL
#     pca <- NULL
#     tsne <- NULL
#     umap <- NULL

#     if (!is.null(srat)){
#         default_assay <- DefaultAssay(srat)
#         # print(default_assay)
        
#         if(!paste0("nCount_", default_assay) %in% names(x = srat[[]])) srat[[paste0("nCount_", default_assay)]] <- colSums(x = srat[[default_assay]], slot = "counts")  # nCount of the default assay
#         if(!paste0("nFeature_", default_assay) %in% names(x = srat[[]])) srat[[paste0("nFeature_", default_assay)]] <- colSums(x = GetAssayData(object = srat[[default_assay]], slot = "counts") > 0)  # nFeature of the default assay
        
#         # Calculate the percentage of mitocondrial per cell and add to the metadata.
#         if(! "percent.mt" %in% names(x = srat[[]])) srat[["percent.mt"]] <- PercentageFeatureSet(srat, pattern = "^MT-")
#         # Calculate the proportion gene expression that comes from ribosomal proteins.
#         if(! "percent.rb" %in% names(x = srat[[]])) srat[["percent.rb"]] <- PercentageFeatureSet(srat, pattern = "^RP[SL]")

#         # Percentage hemoglobin genes - includes all genes starting with HB except HBP.
#         if(! "percent.hb" %in% names(x = srat[[]])) srat[["percent.hb"]] <- PercentageFeatureSet(srat, pattern = "^HB[^(P)]")
#         if(! "percent.plat" %in% names(x = srat[[]])) srat[["percent.plat"]] <- PercentageFeatureSet(srat, pattern = "PECAM1|PF4")

#         # Add the doublet annotation
#         doublets <- read.table(path_of_scrublet_calls, header = F, row.names = 1)
#         colnames(doublets) <- c("Doublet_score", "Is_doublet")
#         if(! "Is_doublet" %in% names(x = srat[[]])) {
#             srat <- AddMetaData(srat, doublets)
#         }
#         srat[['Is_doublet']] <- !is.na(srat[['Is_doublet']])

#         # print(head(srat@meta.data))

#         srat <- subset(srat, subset = paste0("nFeature_", default_assay) > nFeature_min & percent.mt < percent_mt_max)
#         if(nFeature_max != 0) srat <- subset(srat, subset = paste0("nFeature_", default_assay) < nFeature_max)
#         if(percent_rb_min != 0)  srat <- subset(srat, subset = percent.rb > percent_rb_min)
#         srat <- subset(srat, subset = Is_doublet != 'True')
#         srat <- NormalizeData(srat, normalization.method = "LogNormalize", scale.factor = 10000)
#         srat <- FindVariableFeatures(srat, selection.method = "vst")
#         srat <- ScaleData(srat, features = rownames(srat))

#         # PCA
#         srat <- RunPCA(srat, features = VariableFeatures(srat), ndims.print = 6:10, nfeatures.print = 10)

#         if(regress_cell_cycle){
#             RegressCellCycle(srat)
#         }

#         srat <- FindNeighbors(srat, dims=dims)
#         srat <- FindClusters(srat, resolution = 0.5)
#         # TSNE
#         srat <- RunTSNE(srat, dims=dims)
#         # UMAP
#         srat <- RunUMAP(srat, dims=dims)

#         assay_names <- names(srat@assays)
#         default_assay <- DefaultAssay(srat)
#         metadata <- srat@meta.data
#         nCells <- ncol(srat)
#         nGenes <- nrow(srat)
#         genes <- rownames(srat)
#         cells <- Cells(srat)
#         HVGsID <- srat[[assay]]@var.features
#         if('pca' %in% names(srat@reductions)) pca <- Embeddings(object = srat, reduction = "pca")
#         if('tsne' %in% names(srat@reductions)) tsne <- Embeddings(object = srat, reduction = "tsne")
#         if('umap' %in% names(srat@reductions)) umap <- Embeddings(object = srat, reduction = "umap")
#     }

#     SaveH5Seurat(srat, filename=output, overwrite=TRUE, verbose=FALSE)
#     print("Seurat object is saved successfully.")
#     rm(srat)
#     gc()
#     list(default_assay=default_assay, assay_names=assay_names, metadata=metadata, nCells=nCells, nGenes=nGenes, genes=genes, cells=cells, HVGsID=HVGsID, pca=pca, tsne=tsne, umap=umap)
# }


RegressCellCycle <- function(srat){
    # Read in the expression matrix The first row is a header row, the first column is rownames
    # exp.mat <- read.table(file = "../tools/qc/nestorawa_forcellcycle_expressionMatrix.txt", header = TRUE,
    #     as.is = TRUE, row.names = 1)

    # A list of cell cycle markers, from Tirosh et al, 2015, is loaded with Seurat.  We can
    # segregate this list into markers of G2/M phase and markers of S phase
    # s.genes <- cc.genes$s.genes
    # g2m.genes <- cc.genes$g2m.genes

    # srat <- CellCycleScoring(srat, s.features = s.genes, g2m.features = g2m.genes, set.ident = TRUE)
    srat <- CellCycleScoring(srat, g2m.features = cc.genes$g2m.genes, s.features = cc.genes$s.genes, set.ident = TRUE)
    srat <- ScaleData(srat, vars.to.regress = c("S.Score", "G2M.Score"), features = rownames(srat))
    
    srat
}
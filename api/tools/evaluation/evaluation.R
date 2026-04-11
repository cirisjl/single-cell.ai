apply_Seurat <- function(sce, params, resolution) {
  (seed <- round(1e6*runif(1)))
  tryCatch({
    dat <- counts(sce)
    st <- system.time({
      data <- CreateSeuratObject(dat, min.cells = params$min.cells,
                                 min.genes = params$min.genes, project = "scRNAseq", 
                                 display.progress = FALSE) 
      data <- NormalizeData(object = data, normalization.method = "LogNormalize", 
                            scale.factor = 1e4, display.progress = FALSE)
      data <- FindVariableFeatures(data, selection.method = "vst", nfeatures = 2000)
      data <- ScaleData(object = data, display.progress = FALSE)
      data <- RunPCA(object = data, pc.genes = rownames(data@data), do.print = FALSE, 
                     pcs.compute = max(params$dims.use), seed.use = seed)
      data <- FindNeighbors(data, dims = params$dims.use)
      data <- FindClusters(data, resolution = resolution)
      cluster <- data$seurat_clusters
    })
    
    st <- c(user.self = st[["user.self"]], sys.self = st[["sys.self"]], 
            user.child = st[["user.child"]], sys.child = st[["sys.child"]],
            elapsed = st[["elapsed"]])
    list(st = st, cluster = cluster, est_k = NA)
  }, error = function(e) {
    list(st = c(user.self = NA, sys.self = NA, user.child = NA, sys.child = NA,
                elapsed = NA), 
         cluster = structure(rep(NA, ncol(sce)), names = colnames(sce)),
         est_k = NA)
  })
}



apply_CIDR <- function(sce, params, k) {
  tryCatch({
    dat <- counts(sce)
    st <- system.time({
      sData <- scDataConstructor(dat, tagType = "raw")
      sData <- determineDropoutCandidates(sData)
      sData <- wThreshold(sData)
      sData <- scDissim(sData, threads = 1)
      sData <- scPCA(sData, plotPC = FALSE)
      sData <- nPC(sData)
      
      ## Cluster with preset number of clusters
      sDataC <- scCluster(object = sData, nCluster = k, 
                          nPC = sData@nPC, cMethod = "ward.D2")
      cluster <- sDataC@clusters
      names(cluster) <- colnames(sDataC@tags)
    })
    ## Determine number of clusters automatically
    sDataA <- scCluster(object = sData, n = max(params$range_clusters),
                        nPC = sData@nPC, cMethod = "ward.D2")
    est_k <- sDataA@nCluster
    
    st <- c(user.self = st[["user.self"]], sys.self = st[["sys.self"]], 
            user.child = st[["user.child"]], sys.child = st[["sys.child"]],
            elapsed = st[["elapsed"]])
    list(st = st, cluster = cluster, est_k = est_k)
  }, error = function(e) {
    list(st = c(user.self = NA, sys.self = NA, user.child = NA, sys.child = NA,
                elapsed = NA), 
         cluster = structure(rep(NA, ncol(sce)), names = colnames(sce)),
         est_k = NA)
  })
}

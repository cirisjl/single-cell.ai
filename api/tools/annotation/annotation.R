library(scater)
library(AnnotationDbi)
library(optparse)
library(anndata)
library(Seurat)
library(SingleCellExperiment)
library(SeuratDisk)
library(SeuratData)
library(patchwork)
library(loomR)

source("../formating/formatting.R")

# Make the option list
option_list <- list(
   make_option(c("-i", "--input path"), type = "character", default = NULL,
              action = "store", help = "Input file path to annotation data."
  ),
  make_option(c("-s", "--species"), type = "character", default = c("huaman", "mouse"),
              action = "store", help = "Species of the database for annotation. Allowed input is human or mouse."
  ),
  make_option(c("-o", "--output"), type = "character", default = "./",
              action = "store", help = "Output folder path."
  )
)
args <- parse_args(OptionParser(option_list=option_list))

# Set altExp to contain ERCC, removing ERCC features from the main object
sce <- LoadSCE(args$i)
altExp(sce,"ERCC") <- sce[grep("^ERCC-",rownames(sce)), ]
sce <- sce[grep("^ERCC-",rownames(sce),invert = T), ]

# Map ENSEMBL IDs to gene symbols
if (args$s == "mouse") {
  library(EnsDb.Mmusculus.v79) 
  ENSDB <- "EnsDb.Mmusculus.v79"
  library(org.Mm.eg.db)  #library(org.Hs.eg.db) if human
  EGDB <- "org.Mm.eg.db"
} else if (args$s == "human") {
  library(EnsDb.Hsapiens.v86)
  ENSDB <- "EnsDb.Hsapiens.v86"
  library(org.Hs.eg.db)
  EGDB <- "org.Hs.eg.db"
} else {
  stop('You must set SPECIES to either "mouse" or "human" at the start of this code block!')
}

gene_names <- mapIds(get(EGDB), keys=rownames(sce), keytype="ENSEMBL", columns="SYMBOL",column="SYMBOL")
ensdb_genes <- genes(get(ENSDB))

rowData(sce)$SYMBOL <- gene_names
MT_names <- ensdb_genes[seqnames(ensdb_genes) == "MT"]$gene_id
is_mito <- rownames(sce) %in% MT_names
table(is.na(gene_names))
table(is_mito)
print("Remove all genes for which no symbols were found.")
sce <- sce[! is.na(rowData(sce)$SYMBOL),] # Remove all genes for which no symbols were found

print("Check if we can find mitochondrial proteins in the newly annotated symbols.")
grep("^MT-",rowData(sce)$SYMBOL,value = T) # Check if we can find mitochondrial proteins in the newly annotated symbols
grep("^RP[LS]",rowData(sce)$SYMBOL,value = T)
grep("ATP8",rowData(sce)$SYMBOL,value = T) # Quick search for mitochondrial protein ATP8, which is also called MT-ATP8


# Save sce object
saveRDS(sce, file = args$o)
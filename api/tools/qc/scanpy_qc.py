import os
import numpy as np
import scanpy as sc
import warnings
warnings.filterwarnings('ignore')
# sys.path.append('..')
from scipy.stats import median_abs_deviation
from tools.formating.formating import is_normalized, check_nonnegative_integers
from tools.annotation.annotation import *
from scipy.sparse import csr_matrix
sc.settings.verbosity=3             # verbosity: errors (0), warnings (1), info (2), hints (3)
# sc.logging.print_header()
# sc.settings.set_figure_params(dpi=80, facecolor='white')
from utils.redislogger import redislogger


def run_scanpy_qc(adata, unique_id, min_genes=200, max_genes=None, min_cells=3, pct_counts_mt=3, target_sum=1e4, n_top_genes=None, expected_doublet_rate=0.076, regress_cell_cycle=False, species='mouse'):
        if adata is None:
            raise ValueError("Failed to load AnnData object.")
        # AnnData information
        redislogger.info(unique_id, adata.__str__())

        # if is_normalized(adata.X, min_genes) and not check_nonnegative_integers(adata.X):
        #     redislogger.info(unique_id, "adata.X is not raw counts.")
        #     if "raw_counts" in adata.layers.keys():
        #         redislogger.info(unique_id, "Use layer 'raw_counts' instead. Copy adata.X to layer 'normalized_X'.")
        #         adata.layers["X_normalized"] = adata.X.copy()
        #         adata.X = adata.layers['raw_counts'].copy()
        #     elif "counts" in adata.layers.keys():
        #         redislogger.info(unique_id, "Use layer 'counts' instead. Copy adata.X to layer 'normalized_X'.")
        #         adata.layers["X_normalized"] = adata.X.copy()
        #         adata.X = adata.layers['counts'].copy()
        #     elif adata.raw is not None:
        #         redislogger.info(unique_id, "Use adata.raw.X instead. Copy adata.X to layer 'normalized_X'.")
        #         adata.layers["X_normalized"] = adata.X.copy()
        #         adata.X = adata.raw.X.copy()
        #     else:
        #         raise ValueError("Scanpy QC only take raw counts, not normalized data.")

        redislogger.info(unique_id, "Check if adata.var.index is gene symbols.")
        if is_ensembl(adata.var_names[0]):
            redislogger.info(unique_id, "Convert Ensembl IDs to gene symbols.")
            if species is not None:
                try:
                    ensembl_ids = adata.var.index.tolist()
                    symbol_ids = ensembl_to_symbol(ensembl_ids, species=species)
                    adata.var['gene_symbols'] = symbol_ids
                    adata.var['ensembl_ids'] = ensembl_ids
                    adata.var = adata.var.set_index('gene_symbols')
                except Exception as e:
                    redislogger.warning(unique_id, f"An error occurred when converting Ensembl IDs to gene symbols, skipped: {e}")
            else:
                redislogger.warning(unique_id, "{species} is not supported by ensembl_to_symbol(), skipped.")
        
        adata.var_names_make_unique()

        # Filtering low quality reads
        redislogger.info(unique_id, "Filtering low quality reads.")
        sc.pp.filter_cells(adata, min_genes=min_genes)
        if max_genes is not None and max_genes != 0:
            sc.pp.filter_cells(adata, max_genes=max_genes)
        sc.pp.filter_genes(adata, min_cells=min_cells)
        # mitochondrial genes
        redislogger.info(unique_id, "Mark mitochondrial genes.")
        adata.var['mt']=adata.var_names.str.startswith('MT-')
        # ribosomal genes
        redislogger.info(unique_id, "Mark ribosomal genes.")
        adata.var["ribo"] = adata.var_names.str.startswith(("RPS", "RPL"))
        # hemoglobin genes
        redislogger.info(unique_id, "Mark hemoglobin genes.")
        adata.var["hb"] = adata.var_names.str.contains(("^HB[^(P)]"))

        sc.pp.calculate_qc_metrics(adata, qc_vars=["mt", "ribo", "hb"], inplace=True, percent_top=[20], log1p=True)

        redislogger.info(unique_id, "Caculating outliers.")
        adata.obs["outlier"] = (is_outlier(adata, 'log1p_total_counts', 5) +\
            is_outlier(adata, 'log1p_n_genes_by_counts', 5) +\
            is_outlier(adata, 'pct_counts_in_top_20_genes', 5) +\
            is_outlier(adata, 'pct_counts_mt', pct_counts_mt, upper_only = True)
        )
        redislogger.info(unique_id, f"Number of outliers: {adata.obs.outlier.value_counts()}")
    
        # Calculate mitochondrial outliers separately can cause over-filtering
        # adata.obs["mt_outlier"] = is_outlier(adata, "pct_counts_mt", 3, upper_only=True) | (
        #     adata.obs["pct_counts_mt"] > 8
        # )  
        # redislogger.info(unique_id, f"Number of MT-outliers: {adata.obs.mt_outlier.value_counts()}")

        redislogger.info(unique_id, f"Total number of cells: {adata.n_obs}")
        # adata = adata[(~adata.obs.outlier) & (~adata.obs.mt_outlier)].copy()

        redislogger.info(unique_id, f"Number of cells after filtering of low quality cells: {adata.n_obs}")

        # adata=adata[adata.obs.n_genes_by_counts < 2500, :]
        # adata=adata[adata.obs.pct_counts_mt < 5, :]

        # adata.raw = adata # Freeze the state in `.raw`
        adata.layers["raw_counts"] = adata.X.copy() # Preserve raw counts

        try:
            if expected_doublet_rate !=0 and 'predicted_doublets' not in adata.obs.keys():
                redislogger.info(unique_id, "Anotating doublelets.")
                # import scrublet as scr
                scrub = sc.pp.scrublet(adata, expected_doublet_rate=expected_doublet_rate)
                # adata.obs['doublet_scores'], adata.obs['predicted_doublets'] = scrub.scrub_doublets(min_counts=2, min_cells=3, 
                #                                                         min_gene_variability_pctl=85, n_prin_comps=30)
                # adata.obs['predicted_doublets'].value_counts()

                # Second method: doubletdetection
                adata = run_doubletdetection(adata)
                # adata=adata[adata.obs.predicted_doublets=="False", :]
        except Exception as e:
            redislogger.warning(unique_id, f"An error occurred when running Scrublet, skipped: {e}")
        
        redislogger.info(unique_id, f"Normalizing dataset usig log{target_sum}.")
        sc.pp.normalize_total(adata, target_sum=target_sum)
        sc.pp.log1p(adata)
        redislogger.info(unique_id, "Finding highly variable genes.")
        sc.pp.highly_variable_genes(adata, n_top_genes=n_top_genes)

        adata=adata[:, adata.var.highly_variable] # Do the filtering
        sc.pp.regress_out(adata, ['total_counts', 'pct_counts_mt'])
        sc.pp.scale(adata, max_value=10)

        # Regress both S score and G2M score for cell cycle
        if(regress_cell_cycle):
            try:
                redislogger.info(unique_id, "Regressing cell cycle.")
                adata = regress_cell_cycle(adata)
            except Exception as e:
                redislogger.warning(unique_id, f"An error occurred when regressing cell cycle, skipped: {e}")
        
        # sc.pp.pca(adata)
        # sc.pp.neighbors(adata)
        # sc.tl.umap(adata)

        adata.layers["logCP10K"] = adata.X.copy()
        # adata.X = adata.layers["raw_counts"].copy()

        # Converrt dense martrix to sparse matrix
        if isinstance(adata.X, np.ndarray):
            adata.X = csr_matrix(adata.X)

        redislogger.info(unique_id, "Scanpy Quality Control is completed.")

        # return adata, output
        return adata


def is_outlier(adata, metric: str, nmads: int, upper_only = False):
    M = adata.obs[metric]
    if not upper_only:
        return (M < np.median(M) - nmads * median_abs_deviation(M)) | (
            np.median(M) + nmads * median_abs_deviation(M) < M
        )
    return (M > np.median(M) + nmads * median_abs_deviation(M))


def regress_cell_cycle(adata):
    # Load cell cycle genes defined in Tirosh et al, 2015. It is a list of 97 genes, represented by their gene symbol.
    cell_cycle_genes = [x.strip() for x in open(os.path.abspath(os.path.join(os.path.dirname(__file__), 'regev_lab_cell_cycle_genes.txt')))]

    # Define two lists, genes associated to the S phase and genes associated to the G2M phase
    s_genes = cell_cycle_genes[:43]
    g2m_genes = cell_cycle_genes[43:]
    cell_cycle_genes = [x for x in cell_cycle_genes if x in adata.var_names]

    # Perform cell cycle scoring. Cell cycle scoring adds three slots in data, a score for S phase, a score for G2M phase and the predicted cell cycle phase.
    sc.tl.score_genes_cell_cycle(adata, s_genes=s_genes, g2m_genes=g2m_genes)

    adata_cc_genes = adata[:, cell_cycle_genes]
    sc.tl.pca(adata_cc_genes)
    # sc.pl.pca_scatter(adata_cc_genes, color='phase')

    # Regress out both S score and G2M score
    sc.pp.regress_out(adata, ['S_score', 'G2M_score'])
    sc.pp.scale(adata)

    # Reproject dataset using cell cycle genes again. Since we regressed the scores, no effect of cell cycle is now evident.
    adata_cc_genes = adata[:, cell_cycle_genes]
    sc.tl.pca(adata_cc_genes)
    # sc.pl.pca_scatter(adata_cc_genes, color='phase')

    return adata


def run_doubletdetection(adata):
    import doubletdetection

    clf = doubletdetection.BoostClassifier(
    n_iters=10,
    clustering_algorithm="louvain",
    standard_scaling=True,
    pseudocount=0.1,
    n_jobs=-1)
    doublets = clf.fit(adata.X).predict(p_thresh=1e-3, voter_thresh=0.5)
    doublet_score = clf.doublet_score()

    adata.obs["clf_doublet"] = doublets
    adata.obs["clf_score"] = doublet_score

    return adata

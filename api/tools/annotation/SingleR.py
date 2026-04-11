import singlecellexperiment as sce
import celldex
import singler
import scanpy as sc
from tools.formating.formating import load_anndata, reset_x_to_raw
from celldex import list_references, search_references
from exceptions.custom_exceptions import CeleryTaskException

def run_singler(adata, SingleR_ref, user_ref=None, user_refdata=None, user_label=None):
    adata = reset_x_to_raw(adata)
    sce_adata = sce.SingleCellExperiment.from_anndata(adata)
    mat = sce_adata.assay("X")
    features = [str(x) for x in sce_adata.row_names]

    if len(SingleR_ref) == 1:
        res = search_references(SingleR_ref[0])
        ref_data = celldex.fetch_reference(SingleR_ref[0], res["version"][0], realize_assays=True)
        if 'label.main' in ref_data.get_column_data().column_names:
            results = singler.annotate_single(
                test_data = mat,
                test_features = features,
                ref_data = ref_data,
                ref_labels = ref_data.get_column_data().column("label.main"),
            )
            adata.obs["SingleR_main"] = results.column("best")
        if 'label.fine' in ref_data.get_column_data().column_names:
            results = singler.annotate_single(
                test_data = mat,
                test_features = features,
                ref_data = ref_data,
                ref_labels = ref_data.get_column_data().column("label.fine"),
            )
            adata.obs["SingleR_fine"] = results.column("best")

    elif len(SingleR_ref) > 1:
        ref_data = []
        ref_labels = []
        if 'label.main' in ref_data.get_column_data().column_names:
            for ref in SingleR_ref:
                res = search_references(ref)
                reference = celldex.fetch_reference(ref, res["version"][0], realize_assays=True)
                ref_data.append(reference)
                ref_labels.append(reference.get_column_data().column("label.main"))
            single_results, integrated = singler.annotate_integrated(
                mat,
                ref_data = ref_data,
                ref_labels = ref_labels,
                test_features = features,
                num_threads = 5
            )
            adata.obs["SingleR_main"] = integrated.column("best")
        if 'label.fine' in ref_data.get_column_data().column_names:
            for ref in SingleR_ref:
                res = search_references(ref)
                reference = celldex.fetch_reference(ref, res["version"][0], realize_assays=True)
                ref_data.append(reference)
                ref_labels.append(reference.get_column_data().column("label.fine"))
            single_results, integrated = singler.annotate_integrated(
                mat,
                ref_data = ref_data,
                ref_labels = ref_labels,
                test_features = features,
                num_threads = 5
            )
            adata.obs["SingleR_fine"] = integrated.column("best")   
    
    if user_ref is not None and user_label is not None:
        adatas = [load_anndata(input) for input in user_ref]
        dater = sc.concat(adatas, join='outer')
        sc.pp.filter_genes(dater, min_cells = 10)
        dater = dater[~dater.obs[user_label].isna()]
        dater = reset_x_to_raw(dater)
        ref_data = sce.SingleCellExperiment.from_anndata(dater)

        built = singler.train_single(
            ref_data = ref_data.assay("X"),
            ref_labels = ref_data.get_column_data().column(user_label),
            ref_features = ref_data.get_row_names(),
            test_features = features,
        )

        output = singler.classify_single(mat, ref_prebuilt=built)
        adata.obs["SingleR_user_ref"] = output.column("best")    
    elif user_refdata is not None and user_label is not None:
        dater = sc.concat(user_refdata, join='outer')
        sc.pp.filter_genes(dater, min_cells = 10)
        dater = dater[~dater.obs[user_label].isna()]
        dater = reset_x_to_raw(dater)
        ref_data = sce.SingleCellExperiment.from_anndata(dater)

        built = singler.train_single(
            ref_data = ref_data.assay("X"),
            ref_labels = ref_data.get_column_data().column(user_label),
            ref_features = ref_data.get_row_names(),
            test_features = features,
        )

        output = singler.classify_single(mat, ref_prebuilt=built)
        adata.obs["SingleR_user_ref"] = output.column("best")

    return adata
import celltypist
import scanpy as sc
import os
import numpy as np
from celltypist import models
from exceptions.custom_exceptions import CeleryTaskException
from tools.formating.formating import load_anndata, reset_x_to_raw
models.get_all_models()


def run_celltypist(adata, model_name, refs = None, ref_adata = None, labels = None, species = 'mouse'):
    if model_name is None and (refs is None or labels is None) and (ref_adata is None or labels is None):
        raise CeleryTaskException(f"CellTypist annotation is failed due to empty model_name ({model_name}) and empty user reference ({refs}) or cell labels ({labels}).")

    adata = reset_x_to_raw(adata)
    sc.pp.filter_genes(adata, min_cells = 10)
    sc.pp.normalize_total(adata, target_sum=1e4) #not recommended for typical pp
    sc.pp.log1p(adata)
    
    if type(adata.X) != np.ndarray:
        adata.X = adata.X.toarray()
        
    if model_name is not None:
        model = celltypist.Model.load(model_name)
        if species.lower() == 'mouse' and "Mouse" not in model_name:
            model.convert()
        
        predictions = celltypist.annotate(adata, model=model, majority_voting=True)
        predictions_adata = predictions.to_adata()
        adata.obs["celltypist_label"] = predictions_adata.obs.loc[adata.obs.index, "predicted_labels"]
        adata.obs["celltypist_score"] = predictions_adata.obs.loc[adata.obs.index, "conf_score"]

    if refs is not None and labels is not None:
        for input in refs:
            try:
                name = os.path.basename(input).split(".")[0]
                ref_ad = load_anndata(input)
                ref_ad = reset_x_to_raw(ref_ad)
                sc.pp.filter_genes(ref_ad, min_cells = 10)
                sc.pp.normalize_total(ref_ad, target_sum = 1e4) #Note this is only for cell annotation, recommended by authors but not best
                sc.pp.log1p(ref_ad)

                ref_ad = ref_ad[~ref_ad.obs[labels].isna()]
                ref_model = celltypist.train(ref_ad, labels = labels, n_jobs = 4, use_SGD = False, feature_selection = True, top_genes = 300)
                ref_predictions = celltypist.annotate(adata, model=ref_model, majority_voting=False)
                ref_predictions_adata = ref_predictions.to_adata()
                adata.obs["celltypist_ref_label"] = ref_predictions_adata.obs.loc[adata.obs.index, "predicted_labels"]
                adata.obs["celltypist_ref_score"] = ref_predictions_adata.obs.loc[adata.obs.index, "conf_score"]
            except Exception as e:
                print(e)
                continue
    
    elif ref_adata is not None and labels is not None:
        ref_adata = reset_x_to_raw(ref_adata)
        sc.pp.filter_genes(ref_adata, min_cells = 10)
        sc.pp.normalize_total(ref_adata, target_sum = 1e4) #Note this is only for cell annotation, recommended by authors but not best
        sc.pp.log1p(ref_adata)

        ref_adata = ref_adata[~ref_adata.obs[labels].isna()]
        ref_model = celltypist.train(ref_adata, labels = labels, n_jobs = 4, use_SGD = False, feature_selection = True, top_genes = 300)
        ref_predictions = celltypist.annotate(adata, model=ref_model, majority_voting=False)
        ref_predictions_adata = ref_predictions.to_adata()
        adata.obs["celltypist_ref_label"] = ref_predictions_adata.obs.loc[adata.obs.index, "predicted_labels"]
        adata.obs["celltypist_ref_score"] = ref_predictions_adata.obs.loc[adata.obs.index, "conf_score"]

    return adata
            
    

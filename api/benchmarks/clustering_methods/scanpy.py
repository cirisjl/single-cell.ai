# Seed for reproducibility
import sys
sys.path.append('..')
# from tools.formating.formating import *
from tools.reduction.reduction import run_dimension_reduction, run_clustering
from tools.evaluation.monitor import *
from tools.evaluation.clustering import clustering_metrics


def scanpy_clustering(adata, labels, layer=None):
    # Start monitoring
    monitor = Monitor(1)
    sys_info = monitor.get_sys_info()

    adata, msg = run_dimension_reduction(adata, layer=layer, skip_tsne=True, skip_3d=True)
    adata = run_clustering(adata)
    
    # Stop monitoring
    time_points, cpu_usage, mem_usage, gpu_usage, gpu_mem_usage = monitor.stop()

    if layer is None: layer = "X"
    # asw_score, nmi_score, ari_score = clustering_metrics(adata.obs[labels], adata.obs["leiden"], adata.obsp['connectivities'])
    asw_score, nmi_score, ari_score, fm_score = clustering_metrics(adata.obs[labels], adata.obs["leiden"], adata.obsm[layer + '_umap'])

    return sys_info, asw_score, nmi_score, ari_score, fm_score, time_points, cpu_usage, mem_usage, gpu_usage, gpu_mem_usage
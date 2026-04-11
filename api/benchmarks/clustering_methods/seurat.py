import sys
sys.path.append('..')
from tools.evaluation.monitor import *
from tools.evaluation.clustering import clustering_metrics
import os
import numpy as np
import pandas as pd
import rpy2.robjects as ro
from rpy2.robjects.packages import importr
from rpy2.robjects import pandas2ri
from rpy2.robjects.conversion import localconverter

ro.r['source'](os.path.abspath(os.path.join(os.path.dirname(__file__), 'seurat.R')))


def seurat_clustering(path, labels, layer=None):
    # Start monitoring
    monitor = Monitor(1)
    sys_info = monitor.get_sys_info()

    seurat_clustering_r = ro.globalenv['clustering']
    results = seurat_clustering_r(path, labels)
    results = list(results)
    labels = list(results[0][0])
    labels_pred = list(results[1][0])
    with localconverter(ro.default_converter + pandas2ri.converter):
        umap = ro.conversion.rpy2py(results[2])
    
    # Stop monitoring
    time_points, cpu_usage, mem_usage, gpu_usage, gpu_mem_usage = monitor.stop()

    if layer is None: layer = "X"
    asw_score, nmi_score, ari_score, fm_score = clustering_metrics(labels, labels_pred, umap)

    return sys_info, asw_score, nmi_score, ari_score, fm_score, time_points, cpu_usage, mem_usage, gpu_usage, gpu_mem_usage
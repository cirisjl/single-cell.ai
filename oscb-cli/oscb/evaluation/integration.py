from scib.metrics import metrics

# https://github.com/theislab/scib/blob/main/scib/metrics/metrics.py
# https://scib.readthedocs.io/en/latest/api/scib.metrics.metrics_all.html
def integration_metrics(adata, adata_int, batch_key='batch', label_key='cell_type', species="mouse"):
    """All metrics

    :Biological conservation:
        + HVG overlap :func:`~scib.metrics.hvg_overlap`
        + Cell type ASW :func:`~scib.metrics.silhouette`
        + Isolated label ASW :func:`~scib.metrics.isolated_labels`
        + Isolated label F1 :func:`~scib.metrics.isolated_labels`
        + NMI cluster/label :func:`~scib.metrics.nmi`
        + ARI cluster/label :func:`~scib.metrics.ari`
        + Cell cycle conservation :func:`~scib.metrics.cell_cycle`
        + cLISI (cell type Local Inverse Simpson's Index) :func:`~scib.metrics.clisi_graph`
        + Trajectory conservation :func:`~scib.metrics.trajectory_conservation`

    :Batch correction:
        + Graph connectivity :func:`~scib.metrics.graph_connectivity`
        + Batch ASW :func:`~scib.metrics.silhouette_batch`
        + Principal component regression :func:`~scib.metrics.pcr_comparison`
        + kBET (k-nearest neighbour batch effect test) :func:`~scib.metrics.kBET`
        + iLISI (integration Local Inverse Simpson's Index) :func:`~scib.metrics.ilisi_graph`

    :param adata: unintegrated, preprocessed anndata object
    :param adata_int: integrated anndata object
    :param batch_key: name of batch column in adata.obs and adata_int.obs
    :param label_key: name of biological label (cell type) column in adata.obs and adata_int.obs
    :param kwargs:
        Parameters to pass on to :func:`~scib.metrics.metrics` function:

            + ``embed``
            + ``cluster_key``
            + ``cluster_nmi``
            + ``nmi_method``
            + ``nmi_dir``
            + ``si_metric``
            + ``organism``
            + ``n_isolated``
            + ``subsample``
            + ``type_``
    """

    metrics_all = metrics(adata, adata_int, batch_key=batch_key, label_key=label_key, cluster_nmi=None, ari_=True, nmi_=True, nmi_method='arithmetic', nmi_dir=None, silhouette_=True, si_metric='euclidean', pcr_=True, cell_cycle_=True, organism=species, hvg_score_=True, isolated_labels_=True, isolated_labels_f1_=True, isolated_labels_asw_=True, n_isolated=True, graph_conn_=True, trajectory_=False, kBET_=True)
    biological_conservation_metrics = ['NMI_cluster/label', 'ARI_cluster/label', 'ASW_label', 'cell_cycle_conservation','isolated_label_F1', 'isolated_label_silhouette', 'hvg_overlap']
    # metrics_dict = metrics_all.dropna().to_dict()[0]
    metrics_dict = metrics_all.fillna(0).to_dict()[0]

    for key, value in metrics_dict.items():
        metrics_dict[key] = float('{:.4f}'.format(value))

    bc_total = 0
    for key in biological_conservation_metrics:
        bc_total += metrics_dict[key]
    biological_conservation_score = float('{:.4f}'.format(bc_total/len(biological_conservation_metrics)))

    metrics_dict['Biological Conservation'] = biological_conservation_score

    return metrics_dict
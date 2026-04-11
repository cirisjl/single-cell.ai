from sklearn.metrics import adjusted_rand_score as ARI
from sklearn.metrics import normalized_mutual_info_score as NMI
from sklearn.metrics import silhouette_score
from sklearn.metrics import fowlkes_mallows_score as FM

def clustering_metrics(labels, labels_pred, embedding):
    asw_score = silhouette_score(embedding, labels)
    nmi_score = NMI(labels, labels_pred)
    ari_score = ARI(labels, labels_pred)
    fm_score = FM(labels, labels_pred)
    asw_score = float('{:.4f}'.format(asw_score))
    nmi_score = float('{:.4f}'.format(nmi_score))
    ari_score = float('{:.4f}'.format(ari_score))
    fm_score = float('{:.4f}'.format(fm_score))

    print(
        "Clustering Scores:\nSilhouette: %.4f\nNMI: %.4f\nARI: %.4f\nFowlkes Mallows: %.4f"
        % (asw_score, nmi_score, ari_score, fm_score)
    )
    return asw_score, nmi_score, ari_score, fm_score
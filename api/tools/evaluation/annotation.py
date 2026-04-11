import numpy as np
import sklearn.preprocessing
from sklearn.metrics import f1_score, accuracy_score


def annotation_metrics(labels, labels_pred):
    print("Encode labels", flush=True)
    labels = labels.astype('category')
    labels_pred = labels_pred.astype('category')
    if labels.isna().any():
        labels = labels.cat.add_categories(['Unkown'])
        labels = labels.fillna('Unkown')
    if labels_pred.isna().any():
        labels_pred = labels_pred.cat.add_categories(['Unkown'])
        labels_pred = labels_pred.fillna('Unkown')
    cats = list(labels.dtype.categories) + list(labels_pred.dtype.categories)
    encoder = sklearn.preprocessing.LabelEncoder().fit(cats)
    labels = encoder.transform(labels)
    labels_pred = encoder.transform(labels_pred)

    print("Compute prediction accuracy", flush=True)
    accuracy = accuracy_score(labels, labels_pred)
    accuracy = float('{:.4f}'.format(accuracy))

    print("Compute F1 score", flush=True)
    f1_macro = float('{:.4f}'.format(f1_score(
            labels, labels_pred, 
            average='macro'
        )))
    f1_micro = float('{:.4f}'.format(f1_score(
            labels, labels_pred, 
            average='micro'
        )))
    f1_weighted = float('{:.4f}'.format(f1_score(
            labels, labels_pred, 
            average='weighted'
        )))

    return accuracy, f1_macro, f1_micro, f1_weighted

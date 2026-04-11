import magic
import pandas as pd

def magic_impute(counts, genes = None):
    magic_operator = magic.MAGIC()
    data_magic = None
    if genes is not None:
        data_magic = magic_operator.fit_transform(counts, genes = genes)
    else:        
        data_magic = magic_operator.fit_transform(counts)

    return data_magic


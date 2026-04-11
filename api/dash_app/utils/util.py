import pandas as pd
import numpy as np


def create_dataframe(adata):
    # Access the data matrix
    data_matrix = adata.X

    if not isinstance(data_matrix, np.ndarray):
        data_matrix = data_matrix.toarray()

    # Access the row and column names
    row_names = adata.obs_names
    column_names = adata.var_names

    # Convert to a pandas DataFrame
    df = pd.DataFrame(data_matrix, index=row_names, columns=column_names)

    return df


def is_valid_query_param(query_param):
    # Check if the query parameter is not empty and meets specific criteria
    if query_param is None or not query_param.strip():
        return False

    # Add any additional validation logic here if needed

    return True

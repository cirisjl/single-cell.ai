import base64
import gzip
import json
import pandas as pd
import numpy as np
from io import BytesIO

def gzip_str(to_gzip: str) -> str:
    out = BytesIO()
    with gzip.GzipFile(fileobj=out, mode='w') as f: 
        f.write(to_gzip.encode())
    return base64.b64encode(out.getvalue()).decode()


def gunzip_str(to_ungzip: str) -> str:
    compressed = base64.b64decode(to_ungzip) 
    with gzip.GzipFile(fileobj=BytesIO(compressed)) as f: 
        return f.read().decode()
    

def gzip_dict(to_gzip: dict) -> str:
    # to_gzip = replace_nan(to_gzip)
    jsonStr = json.dumps(to_gzip)
    return gzip_str(jsonStr)


def gunzip_dict(to_ungzip: str) -> dict:
    jsonStr = gunzip_str(to_ungzip)
    return json.loads(jsonStr)


def gzip_df(to_gzip: pd.DataFrame) -> str:
    # dropping null value columns to avoid errors 
    # to_gzip.dropna(inplace = True) 
    # to_gzip = to_gzip.fillna(None)
    # converting to dict 
    dfDict = to_gzip.to_dict('list') 
    return gzip_dict(dfDict)


def gunzip_df(to_ungzip: str) -> pd.DataFrame:
    dfDict = gunzip_dict(to_ungzip)
    return pd.DataFrame.from_dict(dfDict)


def gzip_list(to_gzip: list) -> str:
    to_gzip = str(to_gzip)
    return gzip_str(to_gzip)


def gunzip_list(to_ungzip: str) -> list:
    str_list = gunzip_str(to_ungzip)
    return eval(str_list)


def replace_nan(dictionary):
    for key, value in dictionary.items():
        if isinstance(value, dict):
            replace_nan(value)
        elif isinstance(value, float) and np.isnan(value):
            dictionary[key] = None 
import requests
from tqdm import tqdm
import os
from pathlib import Path
import hashlib
import re
from muon import MuData
import muon as mu
import numpy as np
import pandas as pd
import scanpy as sc
import anndata as ad
import mudata as md
from .utils import *
import json


class FileDownloader:
    def __init__(self, chunk_size=8192):
        self.chunk_size = chunk_size
        self.session = requests.Session()

    def get_filename_from_response(self, headers):
        """
        Extracts filename from Content-Disposition header or URL.
        """
        # print(headers)
        if "content-disposition" in headers:
            cd = headers["content-disposition"]
            match = re.search(r"filename\*?=['\"]?(.*?)['\"]?(?:;|$)", cd)
            if match:
                filename = match.group(1)
                # Handle potential encoding if filename* is used
                if filename.startswith("utf-8''"):
                    filename = filename.split("''", 1)[1]
                    filename = requests.utils.unquote(filename)
                return filename
        return None

    def get_metadata_from_response(self, headers):
        """
        Extracts filename from Content-Disposition header or URL.
        """
        # print(headers)
        if "X-File-Metadata" in headers:
            metadata = json.loads(headers["X-File-Metadata"])
            return metadata

        return None
        
    def get_file_size(self, response):
        # response = self.session.head(url)
        return int(response.headers.get('content-length', 0))
    
    def get_file_hash(self, file_path):
        sha256_hash = hashlib.sha256()
        with open(file_path, "rb") as f:
            for byte_block in iter(lambda: f.read(4096), b""):
                sha256_hash.update(byte_block)
        return sha256_hash.hexdigest()
    
    def download(self, url, data_dict, data_folder='downloads/', verify_hash=None):
        try:
            response = self.session.post(url, json=data_dict, stream=True)
            response.raise_for_status()  # Raise an exception for bad status codes (4xx or 5xx)
            total_size = self.get_file_size(response)
            file_name = self.get_filename_from_response(response.headers)
            metadata = self.get_metadata_from_response(response.headers)
            local_file_path = os.path.join(data_folder, file_name)
            local_file_path = Path(local_file_path)
            # Make dir
            local_file_path.parent.mkdir(parents=True, exist_ok=True)

            # Progress bar
            progress = tqdm(total=total_size,
                           unit='B',
                           unit_scale=True,
                           desc=local_file_path.name)
            
            with local_file_path.open('wb') as f:
                for chunk in response.iter_content(chunk_size=self.chunk_size):
                    if chunk:
                        f.write(chunk)
                        progress.update(len(chunk))
            progress.close()
            
            # File validation
            if verify_hash:
                downloaded_hash = self.get_file_hash(local_file_path)
                if downloaded_hash != verify_hash:
                    raise ValueError("File hash verification failed.")
                    
            print(f"File downloaded successfully to: {local_file_path}")
            
            return local_file_path, metadata
            
        except Exception as e:
            progress.close()
            print(f"Download failed: {str(e)}")
            if local_file_path.exists():
                local_file_path.unlink()
            return None

    def download_multiple(self, url_list, data_folder):
        results = []
        for url in url_list:
            filename = url.split('/')[-1]
            local_file_path = Path(data_folder) / filename
            success = self.download(url, local_file_path)
            results.append({
                'url': url,
                'success': success,
                'local_file_path': str(local_file_path)
            })
        return results



def DataLoader(benchmarks_id, data_folder='downloads/', server_endpoint=server_endpoint+'download'):  
    dataset_id, task = get_dataset_id(benchmarks_id)
    if task is not None:
        print(f"Downloading dataset for {task} Benchmarks.")
    else:
        print("Downloading dataset.")
    data_dict = {
        "dataset_id": benchmarks_id
    }

    downloader = FileDownloader()
    adata_path, metadata = downloader.download(server_endpoint, data_dict, data_folder=data_folder)
    if metadata is not None:
        print("Benchmarks metadata:")
        for key, value in metadata.items():
            print(f"{key}: {value}")

    if os.path.isfile(adata_path):
        if str(adata_path).endswith(".h5mu"):
            mdata = mu.read_h5mu(adata_path)
            return mdata
        else:
            adata = sc.read_h5ad(adata_path)
            return adata
    else:
        return None


def split_data(adata):
    train_adata = adata[adata.obs.split_idx.str.contains('train'), :].copy()
    test_adata = adata[adata.obs.split_idx.str.contains('test'), :].copy()

    return train_adata, test_adata
import os
import sys
import zipfile
import rarfile
import tarfile
from tarfile import is_tarfile
from utils.redislogger import *


# zip files
def extract_zip_all(unique_id, zip_file_path):
    extract_path = os.path.dirname(zip_file_path)
    try:
        with zipfile.ZipFile(zip_file_path,'r') as zip_ref:
            file_list = zip_ref.namelist()
            zip_ref.extractall(extract_path)
            if len(file_list) == 1:
                extract_path = os.path.dirname(zip_file_path) + "/" + file_list[0]
                
            os.remove(zip_file_path) # Delete the zip file
    except Exception as e:
        redislogger.error(unique_id, f'An error occurred: {e}')
        return None
        
    return extract_path

# rar files
def extract_rar_all(unique_id, rar_file_path):
    extract_path = os.path.dirname(rar_file_path)
    try:
        with rarfile.RarFile(rar_file_path,'r') as rar_ref:
            file_list = rar_ref.namelist()
            rar_ref.extractall(extract_path)
            if len(file_list) == 1:
                extract_path = os.path.dirname(rar_file_path) + "/" + file_list[0]
                
            os.remove(rar_file_path) # Delete the zip file
    except Exception as e:
        redislogger.error(unique_id, f'An error occurred: {e}')
        return None
        
    return extract_path
    
# tar, tar.gz, bz2, xz files
def extract_tar_all(unique_id, gz_file_path):
    extract_path = os.path.dirname(gz_file_path)
    try:
        with tarfile.open(gz_file_path,'r') as tar_ref:
            file_list = tar_ref.getnames()
            tar_ref.extractall(extract_path)
            extract_path = os.path.dirname(gz_file_path) + "/" + file_list[0]
            subfolder = traversal_subfolder(extract_path)
            if subfolder is not None or len(subfolder) != 0:
                extract_path += '/' + subfolder[0]
                
            os.remove(gz_file_path) # Delete the zip file
    except Exception as e:
        redislogger.error(unique_id, f'An error occurred: {e}')
        return None
        
    return extract_path

# Find the deepest subfolder
def traversal_subfolder(path):
    list = []
    if (os.path.exists(path)):
        files = os.listdir(path)
        for file in files:
            m = os.path.join(path, file)
            if (os.path.isdir(m)):
                h = os.path.split(m)
                list.append(h[1])
        return list

# Unzip file if it's compressed, toherwise return its original path
# unique_id can be job_id, user_id or process_id used for tracking logs
def unzip_file_if_compressed(unique_id, file_path):
    # Return the path immediately if it is a directory
    if os.path.isdir(file_path):
        # redislogger.info(unique_id, f"The given input is a directory, skipping unzipping: {file_path}")
        redislogger.info(unique_id, f"The given input is a directory, skipping unzipping.")
        return file_path

    extract_path = file_path
    if os.path.exists(file_path):
        try:
            if file_path.endswith(".zip"):
                redislogger.info(unique_id, "Extracting ZIP file ...")
                extract_path = extract_zip_all(unique_id, file_path)
            elif file_path.endswith(".rar"):
                redislogger.info(unique_id, "Extracting RAR file ...")
                extract_path = extract_rar_all(unique_id, file_path)
            elif is_tarfile(file_path) or file_path.endswith(".gz"):
                redislogger.info(unique_id, "Extracting GZ file ...")
                extract_path = extract_tar_all(unique_id, file_path)

        except Exception as e:
            redislogger.error(unique_id, f"Error extracting {file_path}: {str(e)}")
            extract_path = file_path  # Return the original path in case of error

    return extract_path
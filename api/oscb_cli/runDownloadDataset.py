from pymongo import MongoClient
import os  
import traceback 

from tools.run_qc import run_qc
from tools.run_normalization import run_normalization
from tools.run_imputation import run_imputation
from schemas.schemas import *


def run_download_dataset(job_id, ds: dict, random_state=0):
    """
    This function receives job_id, a dataset dictionary, and an optional random_state.
    It queries the MongoDB database for the given dataset_id and retrieves the adata_path.
    """
    
    process_type = None
    method = None
    user_id = ds.get('user_id')
    dataset_id = ds.get('dataset_id')  # Get dataset_id from the dictionary
    
    
    if ds.get('process_type') and ds.get('method'):
        process_type = ds.get('process_type')
        method = ds.get('method')

    if not dataset_id:
        raise ValueError("dataset_id is missing from the input dictionary.")

    try:
        # Call the function to query MongoDB by dataset_id
        adata_path = query_mongo_by_dataset_id(dataset_id)

        if process_type and method:
            # Get the directory of the input path
            directory = os.path.dirname(adata_path)
            # Append 'output/' to the directory
            output_directory = os.path.join(directory, "output/")

            # Check if the output directory exists, if not, create it
            if not os.path.exists(output_directory):
                os.makedirs(output_directory)
                print(f"Output directory created: {output_directory}")
            else:
                print(f"Output directory already exists: {output_directory}")
            
            if process_type == "quality_control":
                print("Inside the quality control method")

                dataset_obj = Dataset(
                    input=adata_path,
                    userID = user_id,
                    method = method,
                    datasetId = dataset_id,
                    dataset = dataset_id,
                    output = output_directory,
                    qc_params = QCParameters(methods = [method])
                )
                print(dataset_obj)

                qc_results = run_qc(job_id, dataset_obj.model_dump())

                print(qc_results)

                if qc_results and qc_results["adata_path"]:
                    adata_path = qc_results["adata_path"]

            elif process_type == "normalization":
                print("Inside the Normalization Process")
     
                dataset_obj = Dataset(
                    input=adata_path,
                    userID = user_id,
                    method = method,
                    datasetId = dataset_id,
                    dataset = dataset_id,
                    output = output_directory,
                    normalization_params = normalizationParameters(methods = [method])
                )
                print(dataset_obj)

                qc_results = run_normalization(job_id, dataset_obj.model_dump())

                print(qc_results)

                if qc_results and qc_results["adata_path"]:
                    adata_path = qc_results["adata_path"]

            elif process_type == "imputation":
                print("Inside the Imputation Process")
     
                dataset_obj = Dataset(
                    input=adata_path,
                    userID = user_id,
                    method = method,
                    datasetId = dataset_id,
                    dataset = dataset_id,
                    output = output_directory,
                    imputation_params = imputationParameters(methods = [method])
                )
                print(dataset_obj)

                qc_results = run_imputation(job_id, dataset_obj.model_dump())

                print(qc_results)

                if qc_results and qc_results["adata_path"]:
                    adata_path = qc_results["adata_path"]


    except ValueError as e:
        print(f"Error querying MongoDB for dataset_id {dataset_id}: {e}")
        return None  

    except Exception as e:
        # Handle any other unforeseen errors
        print(f"An unexpected error occurred: {e}")
        return None 

    # Return the adata_path if found
    return {"adata_path": adata_path}


def query_mongo_by_dataset_id(dataset_id, db_name="your_database_name", collection_name="your_collection_name"):

    mongo_url = os.getenv("MONGO_URL", "mongodb://oscbdb:65530")
    db_name = "oscb"
    collection_name = "user_datasets"

    """
    Query MongoDB for a document using the given dataset_id and return the adata_path if found.
    """
    # MongoDB connection
    client = MongoClient(mongo_url) 
    db = client[db_name]  # Database name
    collection = db[collection_name]  # Collection name
    
    # Query MongoDB for the document with the given dataset_id
    document = collection.find_one({"Id": dataset_id})
    
    if not document:
        raise ValueError(f"No document found for dataset_id: {dataset_id}")
    
    # Extract adata_path
    adata_path = document.get("adata_path")
    
    if not adata_path:
        raise ValueError(f"'adata_path' is missing in the document for dataset_id: {dataset_id}")
    
    return adata_path
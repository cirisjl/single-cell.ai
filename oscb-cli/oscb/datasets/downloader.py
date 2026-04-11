import os
import time
import requests
from tqdm import tqdm
import platform
import hashlib
import re
import urllib.parse
import asyncio
import websockets
from termcolor import colored


# Define the base URL for the API
base_url = "http://clgpu015.clemson.cloudlab.us:5005/api"

ws_base_url = "ws://clgpu015.clemson.cloudlab.us:5005/wsapi"  # WebSocket base URL


def DownloadDataset(dataset_id, file_folder = 'datasets/', process_type = "quality_control", method = "scanpy"):
    user_id = get_persistent_machine_id()
    # Step 1: Submit the task
    submit_url = f"{base_url}/dataset/download"
    payload = {
        "dataset_id": dataset_id,
        "user_id": user_id,
        "process_type":process_type,
        "method":method
    }

    response = requests.post(submit_url, json=payload)

    if response.status_code != 200:
        print(f"Error submitting the task: {response.status_code}, {response.text}")
        return

    task_info = response.json()
    job_id = task_info.get("job_id")
    if not job_id:
        print("Task submission failed: Missing job ID.")
        return

    print(f"Task submitted successfully. Job ID: {job_id}")

    # Start a coroutine to fetch logs in real time
    asyncio.run(run_parallel_tasks(ws_base_url, job_id, dataset_id, file_folder))


async def run_parallel_tasks(ws_base_url, job_id, dataset_id, file_folder):
    """
    Run the WebSocket log fetching and task status polling concurrently.
    """

     # Create an event to track task completion status
    task_completed_event = asyncio.Event()

    print("task completed event")
    print(task_completed_event)

    # Start the websocket log fetching task
    log_task = asyncio.create_task(fetch_logs_from_websocket(ws_base_url, job_id, task_completed_event))  # Run the websocket log fetch within the event loop
    
    # Poll the task status and download the dataset
    await poll_task_status_and_download(dataset_id, file_folder, job_id, task_completed_event)
    
    # Wait for the log task to finish
    await log_task


async def fetch_logs_from_websocket(base_url, job_id, task_completed_event):
    """
    Connect to WebSocket and display logs for the given job ID in real-time.
    Close the WebSocket connection when the task is completed.
    """
    
    print("logs - task completed event")
    print(task_completed_event)
    ws_url = f"{base_url}/log/{job_id}"
    try:
        async with websockets.connect(ws_url) as websocket:
            print(f"Connected to WebSocket for job ID: {job_id}. Receiving logs...\n")
            while not task_completed_event.is_set():  # Keep receiving logs until task is completed
                try:
                    message = await asyncio.wait_for(websocket.recv(), timeout=5)  # Timeout to recheck the event
                    logs = message.split("<br/>")
                    for log in logs:
                        log = log.strip()  # Remove any leading/trailing whitespace
                        if not log:
                            continue  # Skip empty lines
                        
                        # Color-code based on log level
                        if "ERROR" in log:
                            print(colored(log, "red"))
                        elif "WARNING" in log:
                            print(colored(log, "yellow"))
                        elif "SUCCESS" in log:
                            print(colored(log, "green"))
                        elif "CRITICAL" in log:
                            print(colored(log, "magenta"))
                        elif "DEBUG" in log:
                            print(colored(log, "white"))
                        elif "TRACE" in log:
                            print(colored(log, "blue"))
                        else:  # Default for INFO or unclassified logs
                            print(colored(log, "cyan"))
                except asyncio.TimeoutError:
                    # Periodically check if the event is set
                    if task_completed_event.is_set():
                        break
             # After task is complete, explicitly close the connection
            print("Task completed, closing WebSocket connection.")
            await websocket.close()  # Explicitly close the WebSocket connection
    except websockets.exceptions.ConnectionClosed as e:
        print(f"WebSocket connection closed unexpectedly: {e}")
    except Exception as e:
        print(f"Error occurred while fetching logs from WebSocket: {e}")
    finally:
        # Ensure WebSocket is closed in case of any error or after the task is completed
        if websocket.state == websockets.protocol.State.OPEN:
            await websocket.close()
            print("WebSocket connection explicitly closed.")

async def poll_task_status_and_download(dataset_id, file_folder, job_id, task_completed_event):
    # Define the base URL for the API
    # base_url = "http://130.127.133.115:5005/api"

    task_status_url = f"{base_url}/job/downloadDataset/{job_id}"
    filename = None  # Initialize task_result

    while not task_completed_event.is_set():
        try:
            # Make a GET request to check task status
            response = requests.get(task_status_url)
 
            # Check if the file is ready for download
            if response.headers.get("content-disposition"):
                content_disposition = response.headers.get("content-disposition")
                print(f"Content-Disposition: {content_disposition}")
        
                # First, try to extract the filename* parameter (URL-encoded)
                filename_match = re.search(r'filename\*=(?P<encoding>[a-zA-Z0-9-]+)\'\'(?P<filename>.+)', content_disposition)
                
                if filename_match:
                    # URL decode the filename if it is URL-encoded
                    filename = urllib.parse.unquote(filename_match.group("filename"))
                    print(f"Task completed. File ready for download: {filename}")
                    task_completed_event.set()  # Mark as completed
                    break  # Move to download step

                # If filename* is not found, fall back to regular filename field
                else:
                    filename_match = re.search(r'filename="([^"]+)"', content_disposition)
                    if filename_match:
                        filename = filename_match.group(1)
                        print(f"Task completed. File ready for download: {filename}")
                        task_completed_event.set()  # Mark as completed
                        break  # Move to download step
                    else:
                        print("Filename not found in content-disposition header.")
                        task_completed_event.set()  # Mark as completed if filename is missing
                        return  # Return early, if no filename is found

            # Parse the JSON response
            task_result = response.json() if response.text.strip() else None

            if not task_result:
                print("No valid task response from the server. Exiting!")
                return

            # Handle task statuses
            job_status = task_result.get("job_status")
            status = task_result.get("status")

            if job_status == "SUCCESS":
                if status == "Task result does not contain a file path":
                    print("Task completed, but no file to download.")
                if status == "Invalid Response for the Task Submitted":
                    print("Invalid Response for the Task Submitted")
                task_completed_event.set()  # Task is completed, exit the loop
                return
            elif job_status == "FAILURE":
                error_message = task_result.get("error_message", "Unknown error occurred.")
                print(f"Task failed: {error_message}")
                task_completed_event.set()  # Mark as completed if there's an error
                return
            else:
                print("Task is still processing. Waiting...")
                await asyncio.sleep(5)  # Wait before polling again

        except requests.RequestException as e:
            print(f"Error occurred while checking task status: {e}")
            return


    print("status task completed event")
    print(task_completed_event)
    # Step 3: Download the file
    if filename is None:
        print("No valid filename found. Exiting!")
        return

    download_dir = os.path.abspath(file_folder)

    # Make sure the destination directory exists
    if not os.path.exists(download_dir):
        os.makedirs(download_dir)

    download_path = os.path.join(download_dir, filename)

    # Now perform the download
    file_response = requests.get(task_status_url, stream=True)

    if file_response.status_code == 200:
        total_size = int(file_response.headers.get('content-length', 0))
        progress_bar = tqdm(total=total_size, unit="B", unit_scale=True, desc=filename)
        with open(download_path, 'wb') as file:
            for chunk in file_response.iter_content(chunk_size=1024):
                file.write(chunk)
                progress_bar.update(len(chunk))

        print(f"\nFile downloaded successfully: {download_path}")
    else:
        print(f"Error downloading the file: {file_response.status_code}, {file_response.text}")


def get_persistent_machine_id():
    # Generate a new unique ID based on system properties
    system_properties = f"{platform.node()}-{platform.system()}-{platform.processor()}-{platform.machine()}"
    hashed_id = hashlib.sha256(system_properties.encode()).hexdigest()
    return hashed_id


if __name__ == "__main__":
    dataset_id = "m-FACS_Aorta-Tabula-2018"
    file_folder = "data"
    process_type = "quality_control"
    method = "scanpy"

    DownloadDataset(dataset_id, file_folder, process_type, method)
    # DownloadDataset(dataset_id, file_folder)

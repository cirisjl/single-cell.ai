import React, { useState, useEffect } from 'react';
import { CELERY_BACKEND_API, STORAGE } from '../../../constants/declarations';
import { getCookie, isUserAuth } from '../../../utils/utilFunctions';
import { useNavigate } from 'react-router-dom';
import ReactSelect from 'react-select';
import { ScaleLoader } from 'react-spinners';
import axios from 'axios';


function ValidationTaskComponent({ setTaskStatus, taskData, setTaskData, setActiveTask, activeTask }) {
  const [validationLoading, setValidationLoading] = useState(false);

  const [validationStatus, setValidationStatus] = useState('');

  const jwtToken = getCookie('jwtToken');
  const navigate = useNavigate();


  useEffect(() => {
    isUserAuth(jwtToken)
      .then((authData) => {
        if (authData.isAdmin) {
          if (taskData.validation.status !== 'completed') {
            setValidationLoading(true);
            let username = authData.username;
            let newDirectoryPath = taskData.upload.newDirectoryPath;
            let files = taskData.upload.files;

            let inputFiles = [];
            for (let file of files) {
              let path = STORAGE + "/" + username + "/" + newDirectoryPath + "/" + file;
              inputFiles.push(path);
            }

            setTaskData((prevTaskData) => ({
              ...prevTaskData,
              validation: {
                ...prevTaskData.validation,
                inputFiles: inputFiles,
                token: authData.username
              },
            }));

            if (inputFiles.length === 1 && (inputFiles[0].toLowerCase().endsWith('.h5seurat') || inputFiles[0].toLowerCase().endsWith('.rds') || inputFiles[0].toLowerCase().endsWith('.robj'))) {
              let file = inputFiles[0];
              const requestData = {
                inputFiles: [{ fileDetails: file }]
              };

              axios.post(`${CELERY_BACKEND_API}/convert/publishDatasets/validation`, requestData)
                .then(function (response) {
                  let data = response.data[0];
                  if (data.format === 'h5seurat') {
                    if (data.assay_names && data.assay_names.length > 1) {
                      setTaskData((prevTaskData) => ({
                        ...prevTaskData,
                        validation: {
                          ...prevTaskData.validation,
                          seuratFile: {
                            ...prevTaskData.validation.seuratFile,
                            default_assay: data.default_assay,
                            assay_names: data.assay_names,
                            file: data.inputfile
                          },
                          displayAssayNames: true
                        }
                      }));
                      setValidationLoading(false);
                      return;
                    } else {
                      let fileDetails = {
                        fileDetails: data.inputfile,
                        format: data.format,
                        adata_path: data.inputfile,
                        default_assay: data.default_assay
                      };
                      // Add the fileDetails directly to the fileMappings
                      setTaskData((prevTaskData) => ({
                        ...prevTaskData,
                        validation: {
                          ...prevTaskData.validation,
                          fileMappings: [
                            ...prevTaskData.validation.fileMappings,
                            fileDetails,
                          ],
                          status: 'completed'
                        },
                      }));
                      setValidationStatus("Dataset has been loaded and validated.")
                      setValidationLoading(false);
                      setTaskStatus((prevTaskStatus) => ({
                        ...prevTaskStatus,
                        2: true, // Mark Task 2 as completed 
                      }));

                      // The current task is finished, so make the next task active
                      setActiveTask(3); // Move to the next task (or update it to the appropriate task)
                    }
                  }
                })
                .catch(error => {
                  setValidationStatus("Issue with validating the dataset" + error.response);
                  console.error('API Error:', error.response);
                });
            } else {
              let pathToUse;

              if (inputFiles.length > 1) {
                const firstFilePath = inputFiles[0];
                pathToUse = firstFilePath.substring(0, firstFilePath.lastIndexOf('/'));
              } else if (inputFiles.length === 1) {
                // Only one file, use its complete path
                pathToUse = inputFiles[0];
              }

              let fileDetails = {
                fileDetails: pathToUse,
                format: "h5ad",
                adata_path: pathToUse,
              };
              // Add the fileDetails directly to the fileMappings
              setTaskData((prevTaskData) => ({
                ...prevTaskData,
                validation: {
                  ...prevTaskData.validation,
                  fileMappings: [
                    ...prevTaskData.validation.fileMappings,
                    fileDetails,
                  ],
                },
              }));
              setValidationStatus("Dataset has been loaded and validated.")

              // validation step is successful, move to next task as there are no seurat or rds datasets
              setTaskData((prevTaskData) => ({
                ...prevTaskData,
                validation: {
                  ...prevTaskData.validation,
                  status: 'completed'
                },
              }));

              setTaskStatus((prevTaskStatus) => ({
                ...prevTaskStatus,
                2: true, // Mark Task 2 as completed 
              }));

              // The current task is finished, so make the next task active
              setActiveTask(3); // Move to the next task (or update it to the appropriate task)
            }
          }
        } else {
          console.warn("Unauthorized - you must be an admin to access this page");
          navigate("/accessDenied");
        }
      })
      .catch((error) => {
        console.error(error);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);



  const handleAssaySelection = selectedOption => {
    setTaskData(prevTaskData => ({
      ...prevTaskData,
      validation: {
        ...prevTaskData.validation,
        selectedAssayName: (selectedOption ? selectedOption.value : null)
      },
    }));
  };

  const handleAssaySelectionSubmit = () => {
    console.log("");
  };

  useEffect(() => {
    console.log(taskData);
  }, [taskData]);

  const handleTaskCompletion = async () => {
    //   try {
    //       if(taskData.validation.status !== 'completed') {

    //         // Prepare the data to send to the backend
    //         const dataToSend = [];

    //         taskData.validation.seuratFiles.forEach((file) => {
    //           // Check if any assays are selected for this file
    //           if (file.selectedAssays && file.selectedAssays.length > 0) {
    //             file.selectedAssays.forEach((assay) => {
    //               // Create an entry with the complete file details and assay name
    //               dataToSend.push({
    //                 fileDetails: file.value,
    //                 assay: assay.value,
    //               });
    //             });
    //           }
    //         });

    //         const requestData = {
    //           "inputFiles": dataToSend
    //         }

    //         const hasSelectedAssays = taskData.validation.seuratFiles.every((file) => file.selectedAssays && file.selectedAssays.length > 0);

    //         if (!hasSelectedAssays) {
    //           setErrorMessage("Please select at least one assay for each Seurat file within available assays.");
    //           return;
    //         }

    //         // set Validation loading to true.
    //         setValidationLoading(true);

    //       // Send the data to the backend API
    //       const response = await fetch(`${CELERY_BACKEND_API}/convert/publishDatasets/validation`, {
    //         method: 'POST',
    //         headers: {
    //           'Content-Type': 'application/json',
    //         },
    //         body: JSON.stringify(requestData),
    //       });

    //       if (response.ok) {
    //       // Handle the response from the API
    //       const responseData = await response.json();

    //       if (responseData && responseData.length > 0) {
    //         responseData.forEach((entry) => {

    //           setTaskData(prevTaskData => ({
    //             ...prevTaskData,
    //             quality_control: {
    //               ...prevTaskData.quality_control,
    //               qc_results: [
    //                 ...prevTaskData.quality_control.qc_results,
    //                 entry, // Adding the entire result
    //               ],
    //             },
    //           }));

    //         });

    //         // Update the fileMappings state with the new list
    //         setTaskData((prevTaskData) => ({
    //           ...prevTaskData,
    //           validation: {
    //             ...prevTaskData.validation,
    //             // fileMappings: newFileMappings,
    //             status: 'completed'
    //           },
    //         }));
    //         // After the API call is complete, you can update the task status
    //         setTaskStatus((prevTaskStatus) => ({
    //           ...prevTaskStatus,
    //           2: true, // Mark Task 3 as completed (or update it to the appropriate task)
    //         }));

    //         // The current task is finished, so make the next task active
    //         setActiveTask(3); // Move to the next task (or update it to the appropriate task)
    //         setValidationLoading(false);
    //       } else {
    //         setValidationLoading(false);
    //         console.error('Error making API call:', response.status);
    //       }
    //     }
    //   } else {
    //     setActiveTask(3); // Move to the next task (or update it to the appropriate task)
    //   }
    // } catch (error) {
    //     console.error('Error making API call:', error);
    //   }
  };



  return (
    <div className='validation-task'>
      {validationLoading ? (
        <div className="spinner-container">
          <ScaleLoader color="#36d7b7" loading={validationLoading} />
        </div>
      ) : (
        taskData.validation.displayAssayNames && (
          <div>
            <h3>Default Assay: {taskData.validation.seuratFile.default_assay}</h3>
            <p>Do you want to change the default assay?</p>
            <ReactSelect
              id="assaySelection"
              placeholder="Select an Assay"
              options={taskData.validation.seuratFile.assay_names.map(name => ({ value: name, label: name }))}
              onChange={handleAssaySelection}
            />

            <div className='navigation-buttons'>
              <div className="previous">
                <button type="submit" className="btn btn-info button" onClick={() => setActiveTask(activeTask - 1)}>
                  Previous
                </button>
              </div>
              <div className="next-upon-success">
                <button type="submit" className="btn btn-info button" onClick={handleAssaySelectionSubmit}>
                  Next
                </button>
              </div>
            </div>
          </div>
        )
      )}

      {validationStatus && !taskData.validation.displayAssayNames && (
        <div>
          <p>{validationStatus}</p>

          <div className='navigation-buttons'>
            <div className="previous">
              <button type="submit" className="btn btn-info button" onClick={() => setActiveTask(activeTask - 1)}>
                Previous
              </button>
            </div>
            <div className="next-upon-success">
              <button type="submit" className="btn btn-info button" onClick={handleTaskCompletion}>
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ValidationTaskComponent;

import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import { Card, CardContent, Typography, Button } from '@mui/material';
import { CELERY_BACKEND_API, WEB_SOCKET_URL } from '../../../constants/declarations';
import AlertMessageComponent from './alertMessageComponent';
// import axios from 'axios';
// import ReactPlotly from './reactPlotly';
// import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
// import {faFile} from "@fortawesome/free-solid-svg-icons";
import DatasetSelectionDialog from './datasetsDialog';
import TableComponent from './labelTableComponent';
import useWebSockets from './useWebSockets';

function TaskBuilderTaskComponent({ setTaskStatus, taskData, setTaskData, setActiveTask, activeTask }) {

  const [message, setMessage] = useState('');
  const [hasMessage, setHasMessage] = useState(message !== '' && message !== undefined);
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState({});
  const [jobId, setjobId] = useState("");


  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectionMode, setSelectionMode] = useState(''); // or 'multiple'

  const taskOptions = [
    { label: "Clustering", value: "CL" },
    { label: "Imputation", value: "IM" },
    { label: "Batch Integration", value: "BI" },
    { label: "Trajectory", value: "TJ" },
    { label: "Cell-Cell Communication", value: "CCC" },
    { label: "Multimodal Data Integration", value: "MI" },
    // { label: "Gene regulatory relations", value: "GRR" },
    { label: "Cell Type Annotation", value: "CT" },
    // { label: "Spatial", value: "SP" }
  ];

  const celltypistOptions = [
    { label: "Human_Placenta_Decidua.pkl", value: "Human_Placenta_Decidua.pkl" },
    { label: "Adult_Mouse_Gut.pkl", value: "Adult_Mouse_Gut.pkl" },
    { label: "Human_Longitudinal_Hippocampus.pkl", value: "Human_Longitudinal_Hippocampus.pkl" },
    { label: "Adult_Human_Skin.pkl", value: "Adult_Human_Skin.pkl" },
    { label: "Fetal_Human_AdrenalGlands.pkl", value: "Fetal_Human_AdrenalGlands.pkl" },
    { label: "Immune_All_Low.pkl", value: "Immune_All_Low.pkl" },
    { label: "Human_Developmental_Retina.pkl", value: "Human_Developmental_Retina.pkl" },
    { label: "Human_Endometrium_Atlas.pkl", value: "Human_Endometrium_Atlas.pkl" },
    { label: "COVID19_Immune_Landscape.pkl", value: "COVID19_Immune_Landscape.pkl" },
    { label: "Developing_Human_Organs.pkl", value: "Developing_Human_Organs.pkl" },
    { label: "Mouse_Postnatal_DentateGyrus.pkl", value: "Mouse_Postnatal_DentateGyrus.pkl" },
    { label: "Developing_Human_Hippocampus.pkl", value: "Developing_Human_Hippocampus.pkl" },
    { label: "Mouse_Isocortex_Hippocampus.pkl", value: "Mouse_Isocortex_Hippocampus.pkl" },
    { label: "Human_AdultAged_Hippocampus.pkl", value: "Human_AdultAged_Hippocampus.pkl" },
    { label: "Adult_Pig_Hippocampus.pkl", value: "Adult_Pig_Hippocampus.pkl" },
    { label: "Adult_Human_MTG.pkl", value: "Adult_Human_MTG.pkl" },
    { label: "Cells_Human_Tonsil.pkl", value: "Cells_Human_Tonsil.pkl" },
    { label: "Healthy_Mouse_Liver.pkl", value: "Healthy_Mouse_Liver.pkl" },
    { label: "Human_IPF_Lung.pkl", value: "Human_IPF_Lung.pkl" },
    { label: "Cells_Fetal_Lung.pkl", value: "Cells_Fetal_Lung.pkl" },
    { label: "Mouse_Whole_Brain.pkl", value: "Mouse_Whole_Brain.pkl" },
    { label: "Adult_CynomolgusMacaque_Hippocampus.pkl", value: "Adult_CynomolgusMacaque_Hippocampus.pkl" },
    { label: "Human_Embryonic_YolkSac.pkl", value: "Human_Embryonic_YolkSac.pkl" },
    { label: "Developing_Mouse_Hippocampus.pkl", value: "Developing_Mouse_Hippocampus.pkl" },
    { label: "Cells_Intestinal_Tract.pkl", value: "Cells_Intestinal_Tract.pkl" },
    { label: "Fetal_Human_Pituitary.pkl", value: "Fetal_Human_Pituitary.pkl" },
    { label: "Adult_Human_Vascular.pkl", value: "Adult_Human_Vascular.pkl" },
    { label: "Autopsy_COVID19_Lung.pkl", value: "Autopsy_COVID19_Lung.pkl" },
    { label: "Healthy_COVID19_PBMC.pkl", value: "Healthy_COVID19_PBMC.pkl" },
    { label: "Healthy_Human_Liver.pkl", value: "Healthy_Human_Liver.pkl" },
    { label: "COVID19_HumanChallenge_Blood.pkl", value: "COVID19_HumanChallenge_Blood.pkl" },
    { label: "Adult_RhesusMacaque_Hippocampus.pkl", value: "Adult_RhesusMacaque_Hippocampus.pkl" },
    { label: "Nuclei_Lung_Airway.pkl", value: "Nuclei_Lung_Airway.pkl" },
    { label: "Developing_Human_Gonads.pkl", value: "Developing_Human_Gonads.pkl" },
    { label: "Developing_Human_Brain.pkl", value: "Developing_Human_Brain.pkl" },
    { label: "Healthy_Adult_Heart.pkl", value: "Healthy_Adult_Heart.pkl" },
    { label: "Adult_COVID19_PBMC.pkl", value: "Adult_COVID19_PBMC.pkl" },
    { label: "Cells_Adult_Breast.pkl", value: "Cells_Adult_Breast.pkl" },
    { label: "Immune_All_High.pkl", value: "Immune_All_High.pkl" },
    { label: "Lethal_COVID19_Lung.pkl", value: "Lethal_COVID19_Lung.pkl" },
    { label: "Fetal_Human_Skin.pkl", value: "Fetal_Human_Skin.pkl" },
    { label: "Adult_Human_PrefrontalCortex.pkl", value: "Adult_Human_PrefrontalCortex.pkl" },
    { label: "Human_PF_Lung.pkl", value: "Human_PF_Lung.pkl" },
    { label: "Adult_Mouse_OlfactoryBulb.pkl", value: "Adult_Mouse_OlfactoryBulb.pkl" },
    { label: "Human_Lung_Atlas.pkl", value: "Human_Lung_Atlas.pkl" },
    { label: "Pan_Fetal_Human.pkl", value: "Pan_Fetal_Human.pkl" },
    { label: "Cells_Lung_Airway.pkl", value: "Cells_Lung_Airway.pkl" },
    { label: "Fetal_Human_Retina.pkl", value: "Fetal_Human_Retina.pkl" },
    { label: "Human_Colorectal_Cancer.pkl", value: "Human_Colorectal_Cancer.pkl" },
    { label: "Mouse_Dentate_Gyrus.pkl", value: "Mouse_Dentate_Gyrus.pkl" },
    { label: "Developing_Mouse_Brain.pkl", value: "Developing_Mouse_Brain.pkl" },
    { label: "Adult_Human_PancreaticIslet.pkl", value: "Adult_Human_PancreaticIslet.pkl" },
    { label: "Developing_Human_Thymus.pkl", value: "Developing_Human_Thymus.pkl" },
    { label: "Fetal_Human_Pancreas.pkl", value: "Fetal_Human_Pancreas.pkl" }
  ]

  const singlerOptions = [
    { label: "dice", value: "dice" },
    { label: "blueprint_encode", value: "blueprint_encode" },
    { label: "immgen", value: "immgen" },
    { label: "mouse_rnaseq", value: "mouse_rnaseq" },
    { label: "hpca", value: "hpca" },
    { label: "novershtern_hematopoietic", value: "novershtern_hematopoietic" },
    { label: "monaco_immune", value: "monaco_immune" }
  ]

  const handleOpenDialog = (mode) => {
    if (selectionMode !== mode) {
      // Reset selectedDatasets in taskData when the selection mode changes
      setTaskData(prevTaskData => ({
        ...prevTaskData,
        task_builder: {
          ...prevTaskData.task_builder,
          selectedDatasets: {}, // Resetting selectedDatasets when the mode changes
        },
      }));
    }
    setSelectionMode(mode);
    setIsDialogOpen(true);
  };

  const updateTaskDataWithResults = (data) => {
    // Update taskData state with results
    // For example, setting archive_path
    setTaskData(prevTaskData => ({
      ...prevTaskData,
      task_builder: {
        ...prevTaskData.task_builder,
        selectedDatasets: {
          ...prevTaskData.task_builder.selectedDatasets,
          [data.datasetId]: {
            ...prevTaskData.task_builder.selectedDatasets[data.datasetId],
            dataSplit: {
              ...prevTaskData.task_builder.selectedDatasets[data.datasetId].dataSplit,
              adataPath: data.adata_path,
              dataSplitPerformed: true,
            }
          }
        }
      }
    }));
  };
  const handleStatusMessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      console.log("Task Response");
      console.log(data);
      if (data.task_status && (data.task_status === "SUCCESS" || data.task_status === "FAILURE")) {
        if (data.task_status === "SUCCESS") {
          updateTaskDataWithResults(data.task_result); // Update your state with results
          setLoading(prevLoading => ({ ...prevLoading, [data.task_result.datasetId]: false }));
        }
        // Close WebSocket connection for this jobId
        closeWebSocket(jobId);
      }
    } catch (error) {
      console.error("Error parsing status message:", error);
      // setLoading(prevLoading => ({ ...prevLoading, [datasetId]: false })); 
    }
  };

  const { closeWebSocket } = useWebSockets(jobId, handleStatusMessage, WEB_SOCKET_URL);

  const handleSelectDatasets = async (newSelectedDatasets) => {
    // Initialize additional parameters for new datasets
    Object.keys(newSelectedDatasets).forEach(key => {
      if (!taskData.task_builder.selectedDatasets[key]) {
        newSelectedDatasets[key] = {
          ...newSelectedDatasets[key],
          taskType: null,
          taskLabel: '',
          dataSplit: {
            trainFraction: 0,
            validationFraction: 0,
            testFraction: 1,
            dataSplitPerformed: false,
            adataPath: ''
          }
        };
      }
    });

    setTaskData(prevTaskData => ({
      ...prevTaskData,
      task_builder: {
        ...prevTaskData.task_builder,
        selectedDatasets: newSelectedDatasets
      },
    }));
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
  };

  const handleDataSplit = async (adata_path, datasetId) => {
    try {
      const dataset = taskData.task_builder.selectedDatasets[datasetId];
      if (!dataset.taskType) {
        setMessage('You must select taskType before the data split!');
        setHasMessage(true);
        setIsError(true);
        return;
      }
      setLoading(prevLoading => ({ ...prevLoading, [datasetId]: true })); // Set loading to true for the specific dataset

      const userData = {
        benchmarksId: dataset.taskType.value + "-" + datasetId,
        datasetId: datasetId,
        userId: dataset.Owner,
        adata_path: adata_path || '',
        train_fraction: dataset.dataSplit.trainFraction,
        validation_fraction: dataset.dataSplit.validationFraction,
        test_fraction: dataset.dataSplit.testFraction,
        label: dataset.taskLabel.value || null, // Ensure label is set correctly
        task_type: dataset.taskType.label || null,
      };

      const totalFraction = userData.train_fraction + userData.validation_fraction + userData.test_fraction;

      if (totalFraction !== 1) {
        setHasMessage(true);
        setMessage("The sum of train, validation, and test fractions must equal 1.");
        setLoading(false);
        setIsError(true);
        return;
      }

      console.log(userData);

      // Make the API call
      const response = await fetch(`${CELERY_BACKEND_API}/benchmarks/data-split`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (response.ok) {
        const result = await response.json();
        const jobId = result.job_id;
        setjobId(jobId);

        // Update only the specific dataset's dataSplit parameters
        setTaskData(prevTaskData => ({
          ...prevTaskData,
          task_builder: {
            ...prevTaskData.task_builder,
            selectedDatasets: {
              ...prevTaskData.task_builder.selectedDatasets,
              [datasetId]: {
                ...prevTaskData.task_builder.selectedDatasets[datasetId],
                dataSplit: {
                  ...prevTaskData.task_builder.selectedDatasets[datasetId].dataSplit,
                  dataSplitPerformed: true,
                  adataPath: result.adata_path,
                }
              }
            }
          }
        }));
      } else {
        const error = await response.json();
        console.error(error.error); // Handle the error
        setLoading(prevLoading => ({ ...prevLoading, [datasetId]: false })); // Set loading to false for the specific dataset
      }
    } catch (error) {
      console.error('Error:', error);
      setLoading(prevLoading => ({ ...prevLoading, [datasetId]: false })); // Set loading to false for the specific dataset
    }
  };


  const handleTaskCompletion = () => {
    // Check if all datasets have a task type, label and data split performed
    const allDatasetsValid = Object.values(taskData.task_builder.selectedDatasets).every(dataset =>
      dataset.taskType &&
      ((dataset.taskType.value === 'CL' && dataset.taskLabel) || dataset.taskType.value === 'IM' || (dataset.taskType.value === 'BI' && dataset.taskLabel && dataset.batch_key) || (dataset.taskType.value === 'TJ' && dataset.taskLabel && dataset.BMTraj && dataset.originGroup) || (dataset.taskType.value === 'CCC' && dataset.taskLabel && dataset.cccTarget) || (dataset.taskType.value === 'CT' && dataset.taskLabel && dataset.celltypist_model && dataset.SingleR_ref && dataset.dataSplit.dataSplitPerformed) || (dataset.taskType.value === 'MI' && dataset.mod1 && dataset.mod2 && dataset.taskLabel && dataset.batch_key)) // && dataset.dataSplit.dataSplitPerformed
    );

    if (allDatasetsValid) {
      setTaskStatus(prevTaskStatus => ({
        ...prevTaskStatus,
        5: true, // Mark Task 5 as completed
      }));

      setActiveTask(5);
    } else {
      setMessage('Please ensure that the task type, label, and data split for each dataset are valid.');
      setHasMessage(true);
      setIsError(true);
    }
  };


  const handleTaskTypeChange = (datasetId, newTaskType) => {
    setTaskData(prevTaskData => ({
      ...prevTaskData,
      task_builder: {
        ...prevTaskData.task_builder,
        selectedDatasets: {
          ...prevTaskData.task_builder.selectedDatasets,
          [datasetId]: {
            ...prevTaskData.task_builder.selectedDatasets[datasetId],
            taskType: newTaskType
          }
        }
      }
    }));
  };


  const handleDataSplitChange = (datasetId, parameter, value) => {
    setTaskData(prevTaskData => ({
      ...prevTaskData,
      task_builder: {
        ...prevTaskData.task_builder,
        selectedDatasets: {
          ...prevTaskData.task_builder.selectedDatasets,
          [datasetId]: {
            ...prevTaskData.task_builder.selectedDatasets[datasetId],
            dataSplit: {
              ...prevTaskData.task_builder.selectedDatasets[datasetId].dataSplit,
              [parameter]: value
            }
          }
        }
      }
    }));
  };

  useEffect(() => {
    console.log(taskData);
  }, [taskData]);


  const handleLabelChange = (datasetId, selectedOption) => {
    setTaskData(prevTaskData => ({
      ...prevTaskData,
      task_builder: {
        ...prevTaskData.task_builder,
        selectedDatasets: {
          ...prevTaskData.task_builder.selectedDatasets,
          [datasetId]: {
            ...prevTaskData.task_builder.selectedDatasets[datasetId],
            taskLabel: selectedOption
          }
        }
      }
    }));
  };


  const handleCCCLabelChange = (datasetId, selectedOption) => {
    setTaskData(prevTaskData => ({
      ...prevTaskData,
      task_builder: {
        ...prevTaskData.task_builder,
        selectedDatasets: {
          ...prevTaskData.task_builder.selectedDatasets,
          [datasetId]: {
            ...prevTaskData.task_builder.selectedDatasets[datasetId],
            cccTarget: selectedOption
          }
        }
      }
    }));
  };


  const handleCellTypistModelChange = (datasetId, selectedOption) => {
    setTaskData(prevTaskData => ({
      ...prevTaskData,
      task_builder: {
        ...prevTaskData.task_builder,
        selectedDatasets: {
          ...prevTaskData.task_builder.selectedDatasets,
          [datasetId]: {
            ...prevTaskData.task_builder.selectedDatasets[datasetId],
            celltypist_model: selectedOption
          }
        }
      }
    }));
  };


  const handleSingleRRefChange = (datasetId, selectedOption) => {
    setTaskData(prevTaskData => ({
      ...prevTaskData,
      task_builder: {
        ...prevTaskData.task_builder,
        selectedDatasets: {
          ...prevTaskData.task_builder.selectedDatasets,
          [datasetId]: {
            ...prevTaskData.task_builder.selectedDatasets[datasetId],
            SingleR_ref: selectedOption
          }
        }
      }
    }));
  };


  const handleBatchKeyChange = (datasetId, selectedOption) => {
    setTaskData(prevTaskData => ({
      ...prevTaskData,
      task_builder: {
        ...prevTaskData.task_builder,
        selectedDatasets: {
          ...prevTaskData.task_builder.selectedDatasets,
          [datasetId]: {
            ...prevTaskData.task_builder.selectedDatasets[datasetId],
            batch_key: selectedOption
          }
        }
      }
    }));
  };


  const handleBMTrajChange = (datasetId, selectedOption) => {
    setTaskData(prevTaskData => ({
      ...prevTaskData,
      task_builder: {
        ...prevTaskData.task_builder,
        selectedDatasets: {
          ...prevTaskData.task_builder.selectedDatasets,
          [datasetId]: {
            ...prevTaskData.task_builder.selectedDatasets[datasetId],
            BMTraj: selectedOption
          }
        }
      }
    }));
  };


  const handleOriginGroupChange = (datasetId, selectedOption) => {
    setTaskData(prevTaskData => ({
      ...prevTaskData,
      task_builder: {
        ...prevTaskData.task_builder,
        selectedDatasets: {
          ...prevTaskData.task_builder.selectedDatasets,
          [datasetId]: {
            ...prevTaskData.task_builder.selectedDatasets[datasetId],
            originGroup: selectedOption
          }
        }
      }
    }));
  };


  const handleMod1Change = (datasetId, selectedOption) => {
    setTaskData(prevTaskData => ({
      ...prevTaskData,
      task_builder: {
        ...prevTaskData.task_builder,
        selectedDatasets: {
          ...prevTaskData.task_builder.selectedDatasets,
          [datasetId]: {
            ...prevTaskData.task_builder.selectedDatasets[datasetId],
            mod1: selectedOption
          }
        }
      }
    }));
  };


  const handleMod2Change = (datasetId, selectedOption) => {
    setTaskData(prevTaskData => ({
      ...prevTaskData,
      task_builder: {
        ...prevTaskData.task_builder,
        selectedDatasets: {
          ...prevTaskData.task_builder.selectedDatasets,
          [datasetId]: {
            ...prevTaskData.task_builder.selectedDatasets[datasetId],
            mod2: selectedOption
          }
        }
      }
    }));
  };


  const onSelectDataset = (dataset) => {
    let datasetId = dataset.Id;
    let currentSelectedDatasets = { ...taskData.task_builder.selectedDatasets };

    if (currentSelectedDatasets[datasetId]) {
      delete currentSelectedDatasets[datasetId];
    } else {
      if (selectionMode === "single") {
        currentSelectedDatasets = {};
      }
      currentSelectedDatasets[datasetId] = dataset;
    }

    // Call onSelect with the updated selected datasets
    handleSelectDatasets(currentSelectedDatasets);
  };

  // Function to handle selection of sub-items
  const onSelectSubItem = (mainItem, subItem) => {
    const mainItemId = mainItem.Id;
    let currentSelectedDatasets = { ...taskData.task_builder.selectedDatasets };

    // Check if the main item is already selected
    if (currentSelectedDatasets[mainItemId]) {
      // If sub-item is already selected, deselect it
      if (currentSelectedDatasets[mainItemId].selectedSubItem?.process_id === subItem.process_id) {
        delete currentSelectedDatasets[mainItemId];
      } else {
        // Update the selected main item with the selected sub-item
        currentSelectedDatasets[mainItemId] = {
          ...mainItem,
          selectedSubItem: subItem
        };
      }
    } else {
      // Select the main item and the sub-item
      currentSelectedDatasets = {
        [mainItemId]: {
          ...mainItem,
          selectedSubItem: subItem
        }
      };
    }

    Object.keys(currentSelectedDatasets).forEach(key => {
      currentSelectedDatasets[key] = {
        ...currentSelectedDatasets[key],
        taskType: null,
        taskLabel: '',
        dataSplit: {
          trainFraction: 0,
          validationFraction: 0,
          testFraction: 1,
          dataSplitPerformed: false,
          adataPath: ''
        }
      };
    });
    setTaskData(prevTaskData => ({
      ...prevTaskData,
      task_builder: {
        ...prevTaskData.task_builder,
        selectedDatasets: currentSelectedDatasets
      },
    }));

  };


  return (
    <div className='task-builder-task'>
      <div>
        <div>
          <div>
            <button onClick={() => handleOpenDialog('single')}>Select Single Dataset</button>
            <button onClick={() => handleOpenDialog('multiple')}>Select Multiple Datasets</button>
          </div>
          {isDialogOpen && (
            <DatasetSelectionDialog
              onSelect={onSelectDataset}
              multiple={selectionMode === 'multiple'}
              onClose={handleCloseDialog}
              isVisible={isDialogOpen !== false}
              selectedDatasets={taskData.task_builder.selectedDatasets}
              onSelectSubItem={onSelectSubItem}
            />
          )}
        </div>
      </div>
      {hasMessage && <AlertMessageComponent message={message} setHasMessage={setHasMessage} setMessage={setMessage} isError={isError} />}
      <div>

        {Object.entries(taskData.task_builder.selectedDatasets).length > 0 && (
          <div className="metadata-section">
            <Typography variant="h6" component="h6">Select task type and choose the label for each dataset accordingly.</Typography>
            {Object.entries(taskData.task_builder.selectedDatasets).map(([key, dataset], index) => (
              <Card key={index} className="metadata-item">
                <CardContent>
                  <Typography variant="h6" component="h6">Dataset {index + 1} : {dataset.Id}</Typography>
                  <Typography variant="body2" component="p">
                    <label>
                      <p>Please Choose the Task Type:</p>
                      <Select
                        value={dataset.taskType}
                        options={taskOptions}
                        onChange={(selectedOption) => handleTaskTypeChange(key, selectedOption)}
                      />
                    </label>
                  </Typography>

                  {dataset && dataset.taskType && dataset.cell_metadata_head && (dataset.taskType.value === 'CL' || dataset.taskType.value === 'CT' || dataset.taskType.value === 'BI' || dataset.taskType.value === 'CCC' || dataset.taskType.value === 'TJ' || dataset.taskType.value === 'MI') &&
                    (<Typography variant="body2" component="p">
                      <label>
                        <p>Please Choose the Cell Type Label:</p>
                        <Select
                          options={Object.keys(JSON.parse(dataset.cell_metadata_head)).map((key) => ({
                            label: key,
                            value: key,
                          }))}
                          onChange={(selectedOption) => handleLabelChange(key, selectedOption)}
                          value={dataset.taskLabel}
                        />
                      </label>
                    </Typography>)}

                  {/* 
                  {dataset.tablePlot && (
                    <>
                      <h2>Table: </h2>
                      <ReactPlotly plot_data={dataset.tablePlot} />
                    </>
                  )} */}

                  <div className="label-table-container">
                    <TableComponent cellMetadataObs={JSON.parse(dataset.cell_metadata_head)} />
                  </div>

                  {dataset && dataset.taskType && dataset.cell_metadata_head && (dataset.taskType.value === 'BI' || dataset.taskType.value === 'MI') && (<Typography variant="body2" component="p">
                    <label>
                      <p>Please Choose the Batch Key:</p>
                      <Select
                        value={dataset.batch_key}
                        options={Object.keys(JSON.parse(dataset.cell_metadata_head)).map((key) => ({
                          label: key,
                          value: key,
                        }))}
                        onChange={(selectedOption) => handleBatchKeyChange(key, selectedOption)}
                      />
                    </label>
                  </Typography>)}

                  {dataset && dataset.taskType && dataset.taskType.value === 'CT' && (<Typography variant="body2" component="p">
                    <label>
                      <p>Please Choose the CellTypist Model:</p>
                      <Select
                        value={dataset.celltypist_model}
                        options={celltypistOptions}
                        onChange={(selectedOption) => handleCellTypistModelChange(key, selectedOption)}
                      />
                    </label>
                  </Typography>)}

                  {dataset && dataset.taskType && dataset.taskType.value === 'CT' && (<Typography variant="body2" component="p">
                    <label>
                      <p>Please Choose the SingleR Reference(s):</p>
                      <Select
                        value={dataset.SingleR_ref}
                        isMulti
                        options={singlerOptions}
                        onChange={(selectedOption) => handleSingleRRefChange(key, selectedOption)}
                      />
                    </label>
                  </Typography>)}

                  {dataset && dataset.taskType && dataset.uns && dataset.taskType.value === 'TJ' && (<Typography variant="body2" component="p">
                    <label>
                      <p>Please Choose the Label for Trajectory:</p>
                      <Select
                        value={dataset.BMTraj}
                        options={dataset.uns.map((key, index) => ({
                          label: key,
                          value: key,
                        }))}
                        onChange={(selectedOption) => handleBMTrajChange(key, selectedOption)}
                      />
                    </label>
                  </Typography>)}

                  {dataset && dataset.taskType && dataset.uns && dataset.taskType.value === 'TJ' && (<Typography variant="body2" component="p">
                    <label>
                      <p>Please Choose the Origin Group for Trajectory:</p>
                      <Select
                        value={dataset.originGroup}
                        options={dataset.uns.map((key, index) => ({
                          label: key,
                          value: key,
                        }))}
                        onChange={(selectedOption) => handleOriginGroupChange(key, selectedOption)}
                      />
                    </label>
                  </Typography>)}

                  {dataset && dataset.taskType && dataset.uns && dataset.taskType.value === 'CCC' && (<Typography variant="body2" component="p">
                    <label>
                      <p>Please Choose the Label for Cell-Cell Communication:</p>
                      <Select
                        value={dataset.cccTarget}
                        options={dataset.uns.map((key, index) => ({
                          label: key,
                          value: key,
                        }))}
                        onChange={(selectedOption) => handleCCCLabelChange(key, selectedOption)}
                      />
                    </label>
                  </Typography>)}

                  {dataset && dataset.taskType && dataset.mod_keys && dataset.taskType.value === 'MI' && (<Typography variant="body2" component="p">
                    <label>
                      <p>Please Choose the Key for Modality 1:</p>
                      <Select
                        value={dataset.mod1}
                        options={dataset.mod_keys.map((key, index) => ({
                          label: key,
                          value: key,
                        }))}
                        onChange={(selectedOption) => handleMod1Change(key, selectedOption)}
                      />
                    </label>
                  </Typography>)}

                  {dataset && dataset.taskType && dataset.mod_keys && dataset.taskType.value === 'MI' && (<Typography variant="body2" component="p">
                    <label>
                      <p>Please Choose the Key for Modality 2:</p>
                      <Select
                        value={dataset.mo2}
                        options={dataset.mod_keys.map((key, index) => ({
                          label: key,
                          value: key,
                        }))}
                        onChange={(selectedOption) => handleMod2Change(key, selectedOption)}
                      />
                    </label>
                  </Typography>)}

                  <Typography variant="body2" component="p" style={{ marginTop: '20px' }}>
                    Data Split Parameters
                  </Typography>

                  <Typography variant="body2" component="p">

                    {/* Slider input for Train Fraction */}
                    <label>
                      <p>Train Fraction:</p>
                      <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.01}
                        value={dataset.dataSplit.trainFraction}
                        onChange={(e) => handleDataSplitChange(key, 'trainFraction', parseFloat(e.target.value))}

                      />
                      {dataset.dataSplit.trainFraction}
                    </label>

                    {/* Slider input for Validation Fraction */}
                    <label>
                      <p> Validation Fraction:</p>
                      <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.01}
                        value={dataset.dataSplit.validationFraction}
                        onChange={(e) => handleDataSplitChange(key, 'validationFraction', parseFloat(e.target.value))}

                      />
                      {dataset.dataSplit.validationFraction}
                    </label>

                    {/* Slider input for Test Fraction */}
                    <label>
                      <p>Test Fraction:</p>
                      <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.01}
                        value={dataset.dataSplit.testFraction}
                        onChange={(e) => handleDataSplitChange(key, 'testFraction', parseFloat(e.target.value))}

                      />
                      {dataset.dataSplit.testFraction}
                    </label>


                    <Button
                      onClick={() => handleDataSplit(dataset.adata_path, key)}
                      disabled={dataset.dataSplit.dataSplitPerformed || loading[key]} // Use dataset-specific loading state
                      variant="contained"
                      color="primary"
                      style={{ marginTop: '20px' }}
                    >
                      {loading[key] ? 'Processing, please wait...' : 'Perform Data Split'}
                    </Button>

                  </Typography>

                  {dataset.dataSplit.dataSplitPerformed && (
                    <Typography variant="body2" component="p">
                      <b>AnnData Path: </b>{dataset.dataSplit.adataPath}
                    </Typography>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className='navigation-buttons'>
          {/* <div className="previous">
              <button type="submit" className="btn btn-info button" onClick={() => setActiveTask(activeTask - 1)}>
                Previous
              </button>
            </div> */}
          <div className="next-upon-success">
            <button type="submit" className="btn btn-info button" onClick={handleTaskCompletion}>
              Next
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

export default TaskBuilderTaskComponent;

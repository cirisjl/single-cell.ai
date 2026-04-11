import React, { useState, useEffect } from 'react';
import InputDataComponent from '../../Tools/inputDataCollection';
import InputRefDataComponent from '../../Tools/inputRefDataCollection';
import Schema from '../../../../schema/react-json-schema/Workflows/annotationWorkflow.json'
import { uiSchema } from '../../../../schema/UI-schema/Workflows/annotationWorkflow';
import Form from '@rjsf/core';
import validator from '@rjsf/validator-ajv8';
import SelectComponent from '../../Tools/components/selectComponent';
import GeneRangeSlider from '../../Tools/components/geneRangeSlider';
import MultiSelectComponent from '../../Tools/components/multiselectComponent';
import RangeSlider from '../../Tools/components/sliderComponent';
import SwitchComponent from '../../Tools/components/switchComponent';
import UseDefaultSwitch from '../../Tools/components/useDefaultSwitch';
import ClusterLabelInput from '../../Tools/components/customInputComponent';
import Toggle from 'react-toggle';
import 'react-toggle/style.css';
import AlertMessageComponent from '../../../publishDatasets/components/alertMessageComponent';
import { CELERY_BACKEND_API } from '../../../../constants/declarations';
import { useNavigate } from 'react-router-dom';
import { isUserAuth, getCookie } from '../../../../utils/utilFunctions';
import Chatbot from "../../../RightNavigation/Chatbot";


export function AnnotationWorkFlowComponent(props) {
  const [selectedDatasets, setSelectedDatasets] = useState({});
  const [selectedRefDatasets, setSelectedRefDatasets] = useState({});
  const [, setSelectedDataset] = useState([]);
  const [, setSelectedRefDataset] = useState([]);
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [formErrors, setFormErrors] = useState("");
  const [formData, setFormData] = useState({});

  const [message, setMessage] = useState('');
  const [hasMessage, setHasMessage] = useState(message !== '' && message !== undefined);
  const [isError, setIsError] = useState(false);
  const [, setLoading] = useState(false);
  const [presetQuestions, setPresetQuestions] = useState(null);

  const [dynamicOptions, setDynamicOptions] = useState({
    layers: [], // Add layers as a dynamic option
    obs_names: [], // Add obs_names as a dynamic option
    obs_names_ref: [], // Add obs_names as a dynamic option
    embeddings: [], // Add embeddings as a dynamic option
    species: [],
    organ_part: [],
  });

  const navigate = useNavigate();

  const extractDir = (inputFile) => {
    const fileLocParts = inputFile.split('/');
    fileLocParts.pop(); // Remove the file name from the array
    const output = fileLocParts.join('/'); // Join the remaining parts with '/'
    return output;
  };

  const filterCategoryMap = {
    annotation: '/workflows/annotation',
    // Add more filter categories and their corresponding URL paths as needed
  };

  const onDeleteDataset = (id) => {
    const currentSelectedDatasets = { ...selectedDatasets };

    if (currentSelectedDatasets[id]) {
      delete currentSelectedDatasets[id];
    }
    setSelectedDatasets(currentSelectedDatasets);
    setDynamicOptions((prevOptions) => ({
      ...prevOptions,
      layers: [],
      obs_names: [],
      embeddings: [],
      species: [],
      organ_part: [],
    }));
  };

  const onSelectDataset = (dataset) => {
    let datasetId = dataset.Id;
    let currentSelectedDatasets = { ...selectedDatasets };

    if (currentSelectedDatasets[datasetId]) {
      delete currentSelectedDatasets[datasetId];
    } else {
      // if(props.selectedWorkflow !== "annotation") {
      //   currentSelectedDatasets = {};
      // }
      currentSelectedDatasets[datasetId] = dataset;
    }
    setSelectedDatasets(currentSelectedDatasets)
  };

  // Fetch layer options when dataset_id changes
  useEffect(() => {
    if (Object.keys(selectedDatasets).length > 0) {

      let layers = getLayersArray(selectedDatasets) || [];
      let obs_names = getObsNamesArray(selectedDatasets) || [];
      let embeddings = getEmbeddingsArray(selectedDatasets) || [];
      let species = getSpeciesArray(selectedDatasets) || [];
      let organ_part = getOrganPartArray(selectedDatasets) || [];

      setPresetQuestions(getPresetQuestions(selectedDatasets));

      setDynamicOptions((prevOptions) => ({
        ...prevOptions,
        layers: layers, // Update layers dynamically
        obs_names: obs_names, // Update obs_names dynamically
        embeddings: embeddings, // Update embeddings dynamically
        species: species,
        organ_part: organ_part,
      }));
    } else {
      setDynamicOptions((prevOptions) => ({
        ...prevOptions,
        layers: [], // Reset layers if no datasets are selected
        obs_names: [], // Reset obs_names if no datasets are selected
        embeddings: [], // Reset embeddings if no datasets are selected
        species: [],
        organ_part: [],
      }));
    }
  }, [selectedDatasets]);


  const widgets = {
    SelectComponent: SelectComponent,
    geneRangeSlider: GeneRangeSlider,
    MultiSelectComponent: MultiSelectComponent,
    toggle: (props) => (
      <Toggle
        checked={props.value}
        onChange={(e) => props.onChange(e.target.checked)}
      />
    ),
    GeneRangeSlider: GeneRangeSlider,
    RangeSlider: RangeSlider,
    SwitchComponent: SwitchComponent,
    ClusterLabelInput: ClusterLabelInput,
    UseDefaultSwitch: UseDefaultSwitch
  };

  // Function to handle selection of sub-items
  const onSelectSubItem = (mainItem, subItem) => {
    const mainItemId = mainItem.Id;
    let currentSelectedDatasets = { ...selectedDatasets };

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
    setSelectedDatasets(currentSelectedDatasets);
  };


  const onSelectRefDataset = (dataset) => {
    let datasetId = dataset.Id;
    let currentSelectedRefDatasets = { ...selectedRefDatasets };

    if (currentSelectedRefDatasets[datasetId]) {
      delete currentSelectedRefDatasets[datasetId];
    } else {
      currentSelectedRefDatasets = {};
      currentSelectedRefDatasets[datasetId] = dataset;
    }
    setSelectedRefDatasets(currentSelectedRefDatasets)
  };

  // Fetch layer options when dataset_id changes
  useEffect(() => {
    if (Object.keys(selectedRefDatasets).length > 0) {
      let obs_names = getObsNamesArray(selectedRefDatasets) || [];

      setDynamicOptions((prevOptions) => ({
        ...prevOptions,
        obs_names_ref: obs_names, // Update obs_names dynamically
      }));
    } else {
      setDynamicOptions((prevOptions) => ({
        ...prevOptions,
        obs_names_ref: [],
      }));
    }
  }, [selectedRefDatasets]);


  // Function to handle selection of sub-items
  const onSelectRefSubItem = (mainItem, subItem) => {
    const mainItemId = mainItem.Id;
    let currentSelectedRefDatasets = { ...selectedRefDatasets };

    // Check if the main item is already selected
    if (currentSelectedRefDatasets[mainItemId]) {
      // If sub-item is already selected, deselect it
      if (currentSelectedRefDatasets[mainItemId].selectedSubItem?.process_id === subItem.process_id) {
        delete currentSelectedRefDatasets[mainItemId];
      } else {
        // Update the selected main item with the selected sub-item
        currentSelectedRefDatasets[mainItemId] = {
          ...mainItem,
          selectedSubItem: subItem
        };
      }
    } else {
      // Select the main item and the sub-item
      currentSelectedRefDatasets = {
        [mainItemId]: {
          ...mainItem,
          selectedSubItem: subItem
        }
      };
    }

    setSelectedRefDatasets(currentSelectedRefDatasets);
  };


  const onDeleteRefDataset = (id) => {
    const currentSelectedRefDatasets = { ...selectedRefDatasets };

    if (currentSelectedRefDatasets[id]) {
      delete currentSelectedRefDatasets[id];
    }
    setSelectedRefDatasets(currentSelectedRefDatasets);
    setDynamicOptions((prevOptions) => ({
      ...prevOptions,
      obs_names_ref: [],
    }));
  };

  const getSpeciesArray = (dataMap) => {
    let speciesArray = [];
    Object.values(dataMap).forEach((dataset) => {
      // console.log("dataset", dataset);
      if (dataset.selectedSubItem?.Species) {
        speciesArray.push(dataset.selectedSubItem.Species);
      } else if (dataset?.Species) {
        speciesArray.push(dataset.Species);
      }
    });
    return [...new Set(speciesArray)]; // Remove duplicates
  };

  const getOrganPartArray = (dataMap) => {
    let organPartArray = [];
    console.log("dataMap", dataMap);
    Object.values(dataMap).forEach((dataset) => {
      console.log("dataset", dataset);
      if (dataset.selectedSubItem?.["Organ Part"]) {
        organPartArray.push(dataset.selectedSubItem["Organ Part"]);
      } else if (dataset?.["Organ Part"]) {
        organPartArray.push(dataset["Organ Part"]);
      }
    });
    return [...new Set(organPartArray)]; // Remove duplicates
  };

  const getObsNamesArray = (dataMap) => {
    let obsNamesArray = [null];
    Object.values(dataMap).forEach((dataset) => {
      // console.log("dataset", dataset);
      if (dataset.selectedSubItem?.obs_names) {
        obsNamesArray.push(...dataset.selectedSubItem.obs_names);
      } else if (dataset?.obs_names) {
        obsNamesArray.push(...dataset.obs_names);
      }
    });
    return [...new Set(obsNamesArray)]; // Remove duplicates
  };

  const getEmbeddingsArray = (dataMap) => {
    let embeddingsArray = [null];

    Object.values(dataMap).forEach((dataset) => {
      // console.log("dataset", dataset);
      if (dataset.selectedSubItem?.embeddings) {
        embeddingsArray.push(...dataset.selectedSubItem.embeddings);
      } else if (dataset?.embeddings) {
        embeddingsArray.push(...dataset.embeddings);
      }
    });

    return [...new Set(embeddingsArray)]; // Remove duplicates
  };


  const getLayersArray = (dataMap) => {
    let layersArray = [null];

    Object.values(dataMap).forEach((dataset) => {
      // console.log("dataset", dataset);
      if (dataset.selectedSubItem?.layers) {
        layersArray.push(...dataset.selectedSubItem.layers);
      } else if (dataset?.layers) {
        layersArray.push(...dataset.layers);
      }
    });

    return [...new Set(layersArray)]; // Remove duplicates
  };


  const getPresetQuestions = (dataMap) => {
    let presetQuestionsList = [];
    Object.values(dataMap).forEach((dataset) => {
      if (dataset.selectedSubItem?.Species && dataset.selectedSubItem?.["Organ Part"] && dataset.selectedSubItem?.['Cell Count Estimate']) {
        presetQuestionsList.push({ title: "What is the recommendation for **Min Genes** and **Max Genes**?", "prompt": "Suggest Min Genes and Max Genes of " + dataset.selectedSubItem?.['Cell Count Estimate'] + " " + dataset.selectedSubItem?.Species + " " + dataset.selectedSubItem?.["Organ Part"] + " cells in single-cell RNA sequence quality control." });
        presetQuestionsList.push({ title: "What is the recommendation for **Min Cells**?", "prompt": "Suggest Min Cells of " + dataset.selectedSubItem?.['Cell Count Estimate'] + " " + dataset.selectedSubItem?.Species + " " + dataset.selectedSubItem?.["Organ Part"] + " cells in single-cell RNA sequence quality control." });
        presetQuestionsList.push({ title: "What is the recommendation for **Percentage of Counts in Mitochondrial Genes**?", "prompt": "Suggest Percentage of Counts in Mitochondrial Genes of " + dataset.selectedSubItem?.['Cell Count Estimate'] + " " + dataset.selectedSubItem?.Species + " " + dataset.selectedSubItem?.["Organ Part"] + " cells in single-cell RNA sequence quality control." });
        presetQuestionsList.push({ title: "What is the recommendation for **Expected Doublet Rate**?", "prompt": "Suggest Expected Doublet Rate of " + dataset.selectedSubItem?.['Cell Count Estimate'] + " " + dataset.selectedSubItem?.Species + " " + dataset.selectedSubItem?.["Organ Part"] + " cells in single-cell RNA sequence quality control." });
        presetQuestionsList.push({ title: "What is the recommendation for **n_neighbors**?", "prompt": "Suggest n_neighbors of " + dataset.selectedSubItem?.['Cell Count Estimate'] + " " + dataset.selectedSubItem?.Species + " " + dataset.selectedSubItem?.["Organ Part"] + " cells in single-cell RNA sequence dimension reduction and clustering." });
        presetQuestionsList.push({ title: "What is the recommendation for **n_pcs**?", "prompt": "Suggest n_pcs of " + dataset.selectedSubItem?.['Cell Count Estimate'] + " " + dataset.selectedSubItem?.Species + " " + dataset.selectedSubItem?.["Organ Part"] + " cells in single-cell RNA sequence dimension reduction and clustering." });
        presetQuestionsList.push({ title: "What is the recommendation for Clustering **Resolution**?", "prompt": "Suggest cluster resolution of " + dataset.selectedSubItem?.['Cell Count Estimate'] + " " + dataset.selectedSubItem?.Species + " " + dataset.selectedSubItem?.["Organ Part"] + " cells in single-cell RNA sequence dimension reduction and clustering." });
      }
      else if (dataset?.Species && dataset?.["Organ Part"] && dataset?.['Cell Count Estimate']) {
        presetQuestionsList.push({ title: "What is the recommendation for **Min Genes** and **Max Genes**?", "prompt": "Suggest Min Genes and Max Genes of " + dataset?.['Cell Count Estimate'] + " " + dataset?.Species + " " + dataset?.["Organ Part"] + " cells in single-cell RNA sequence quality control." });
        presetQuestionsList.push({ title: "What is the recommendation for **Min Cells**?", "prompt": "Suggest Min Cells of " + dataset?.['Cell Count Estimate'] + " " + dataset?.Species + " " + dataset?.["Organ Part"] + " cells in single-cell RNA sequence quality control." });
        presetQuestionsList.push({ title: "What is the recommendation for **Percentage of Counts in Mitochondrial Genes**?", "prompt": "Suggest Percentage of Counts in Mitochondrial Genes of " + dataset?.['Cell Count Estimate'] + " " + dataset?.Species + " " + dataset?.["Organ Part"] + " cells in single-cell RNA sequence quality control." });
        presetQuestionsList.push({ title: "What is the recommendation for **Expected Doublet Rate**?", "prompt": "Suggest Expected Doublet Rate of " + dataset?.['Cell Count Estimate'] + " " + dataset?.Species + " " + dataset?.["Organ Part"] + " cells in single-cell RNA sequence quality control." });
        presetQuestionsList.push({ title: "What is the recommendation for **n_neighbors**?", "prompt": "Suggest n_neighbors of " + dataset?.['Cell Count Estimate'] + " " + dataset?.Species + " " + dataset?.["Organ Part"] + " cells in single-cell RNA sequence dimension reduction and clustering." });
        presetQuestionsList.push({ title: "What is the recommendation for **n_pcs**?", "prompt": "Suggest n_pcs of " + dataset?.['Cell Count Estimate'] + " " + dataset?.Species + " " + dataset?.["Organ Part"] + " cells in single-cell RNA sequence dimension reduction and clustering." });
        presetQuestionsList.push({ title: "What is the recommendation for Clustering **Resolution**?", "prompt": "Suggest cluster resolution of " + dataset?.['Cell Count Estimate'] + " " + dataset?.Species + " " + dataset?.["Organ Part"] + " cells in single-cell RNA sequence dimension reduction and clustering." });
      }
    });
    return presetQuestionsList;
  };


  const handleSubmit = ({ formData }) => {
    formData = formData.parameters;
    if (formData['annotation_params'].methods.includes("scVI") && Object.keys(selectedRefDatasets).length < 1) {
      setFormErrors("Please select one reference dataset for scVI annotation before submitting the form.");
      console.log("Failed to submit the form");
    }

    if (formData['annotation_params'].methods.includes("CellTypist") && Object.keys(selectedRefDatasets).length < 1 && formData['annotation_params'].celltypist_model && formData['annotation_params'].celltypist_model.trim().length === 0) {
      setFormErrors("Please select a CellTypist model before submitting the form");
      console.log("Failed to submit the form");
    }

    if (formData['annotation_params'].methods.includes("SingleR") && Object.keys(selectedRefDatasets).length < 1 && formData['annotation_params'].SingleR_ref && formData['annotation_params'].SingleR_ref.length === 0) {
      setFormErrors("Please select a SingleR reference before submitting the form");
      console.log("Failed to submit the form");
    }

    if ((formData["integration_params"].methods.includes("Seurat") || formData["integration_params"].methods.includes("Liger")) && Object.keys(selectedDatasets).length < 2) {
      setFormErrors("Please select at least two datasets for Seurat or Liger integration before submitting the form.");
      console.log("Failed to submit the form.");
    }

    if ((formData["integration_params"].methods.includes("scVI") || formData["integration_params"].methods.includes("Harmony")) && Object.keys(selectedDatasets).length === 1 && formData["integration_params"].batch_key === "") {
      setFormErrors("Please select Batch_Key if you only select one dataset for scVI or Harmony integration before submitting the form.");
      console.log("Failed to submit the form.");
    }

    if (Object.keys(selectedDatasets).length === 0) {
      setFormErrors("Please select a dataset before submitting the form.");
      console.log("Failed to submit the form.");
    }

    console.log("In submit function");
    console.log("Submitted data:", formData);
    console.log(selectedDatasets);
    // Verify the authenticity of the user
    isUserAuth(getCookie('jwtToken'))
      .then((authData) => {
        if (authData.isAuth) {
          // Prepare the data to send. For workflow we only use a single dataset for annotation.
          //TODO - Change this logic accordingly based on other workflows in the future
          formData.userID = authData.username;
          console.log("Adding user data");
          if (Object.keys(selectedDatasets).length > 0) {
            const datasetsArray = Object.values(selectedDatasets);
            const titlesArray = datasetsArray.map(dataset => dataset.Title);
            const idsArray = datasetsArray.map(dataset => dataset.Id);
            formData.dataset = titlesArray;
            formData.datasetIds = idsArray;

            let inputArray = datasetsArray.map(dataset => {
              // Check if selectedSubItem is present and has a non-null adata_path
              let adataPath;
              if (dataset.selectedSubItem && dataset.selectedSubItem.adata_path) {
                adataPath = dataset.selectedSubItem.adata_path;
              } else {
                adataPath = dataset.adata_path;
              }
              return adataPath;
            });

            formData.input = inputArray;           // if the input file is at location /usr/src/storage/dataset1/filename.h5ad
            const directory = extractDir(formData.input[0]);
            formData.output = directory + "/annotation";
          }

          if (Object.keys(selectedRefDatasets).length > 0) {
            // console.log(selectedRefDatasets);
            const refDatasetsArray = Object.values(selectedRefDatasets);
            const titlesArray = refDatasetsArray.map(dataset => dataset.Title);
            const idsArray = refDatasetsArray.map(dataset => dataset.Id);
            formData.refDataset = titlesArray;
            formData.refDatasetIds = idsArray;
            // console.log(titlesArray);
            // console.log(idsArray);

            let refInputArray = refDatasetsArray.map(dataset => {
              // Check if selectedSubItem is present and has a non-null adata_path
              let adataPath;
              if (dataset.selectedSubItem && dataset.selectedSubItem.adata_path) {
                adataPath = dataset.selectedSubItem.adata_path;
              } else {
                adataPath = dataset.adata_path;
              }
              return adataPath;
            });

            formData.user_refs = refInputArray;
            // console.log(refInputArray); 
          }

          let methodMap = {};

          if (formData["qc_params"] && formData["qc_params"].methods) {
            let method = "";
            // iterate methods array inside qc_params and add it to methods string with comma delimiter 
            formData["qc_params"].methods.forEach((item, index) => {
              if (index === 0) {
                method = item;
              } else {
                method = method + ", " + item;
              }
            });
            methodMap["Quality Control"] = method;
          }

          if (formData["integration_params"] && formData["integration_params"].methods) {
            let method = "";
            // iterate methods array inside integration_params and add it to methods string with comma delimiter
            formData["integration_params"].methods.forEach((item, index) => {
              if (index === 0) {
                method = item;
              } else {
                method = method + ", " + item;
              }
            });
            methodMap["Integration"] = method;
          }

          if (formData["annotation_params"] && formData["annotation_params"].methods) {
            let method = "";
            // iterate methods array inside annotation_params and add it to methods string with comma delimiter
            formData["annotation_params"].methods.forEach((item, index) => {
              if (index === 0) {
                method = item;
              } else {
                method = method + ", " + item;
              }
            });
            methodMap["Annotation"] = method;
          }

          console.log("Method map: ", methodMap);
          let job_description = "";
          if (typeof formData.dataset === 'string') {
            job_description = props.selectedWorkflow.charAt(0).toUpperCase() + ' workflow for ' + formData.dataset;
          } else if (Array.isArray(formData.dataset)) {
            if (formData.dataset.length > 1) {
              let datasets = formData.dataset.join(', ');
              job_description = props.selectedWorkflow.charAt(0).toUpperCase() + ' workflow for ' + datasets;
            } else if (formData.dataset.length === 1) {
              job_description = props.selectedWorkflow.charAt(0).toUpperCase() + ' workflow for ' + formData.dataset[0];
            }
          }
          formData.species = formData.species || getSpeciesArray(selectedDatasets)[0] || '';
          formData.organ_part = formData.organ_part || getOrganPartArray(selectedDatasets)[0] || '';

          console.log("Job description: ", job_description);
          console.log(props.selectedWorkflow);
          const RELATIVE_PATH = filterCategoryMap[props.selectedWorkflow];
          console.log(CELERY_BACKEND_API + RELATIVE_PATH);
          fetch(CELERY_BACKEND_API + RELATIVE_PATH, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData),
          })
            .then(response => {
              // Check the status code
              if (response.ok) {
                return response.json();
              } else {
                throw new Error('Error while making a call to the celery Tools API');
              }
            })
            .then(response => {

              const jobId = response.job_id;
              console.log(jobId);

              setHasMessage(true);
              setMessage(response.status ? response.status : "Job Successfully Submitted.");
              setIsError(false);
              navigate("/mydata/workflowTaskDetails", { state: { job_id: jobId, methodMap: methodMap, datasetURL: formData.input, description: job_description, process: props.selectedWorkflow } });
              // let datasetName = "";
              // if (typeof formData.dataset === 'string') {
              //   datasetName = formData.dataset
              // } else if (Array.isArray(formData.dataset)) {
              //   if (formData.dataset.length > 1) {
              //     datasetName = formData.dataset.join('_');
              //   } else if (formData.dataset.length === 1) {
              //     datasetName = formData.dataset[0];
              //   }
              // }

              //   // After a successfull task creation, store the intermediate task information in the mongoDB task_results collection
              //   const taskId = response.task_id;
              //   let method = "";

              //   if(filterCategory === "reduction") {
              //     method = "Reduction";
              //   } else if(filterCategory === "formatting") {
              //     method = "Formatting";
              //   } else if(parametersKey[filterCategory]) {
              //     method = formData[parametersKey[filterCategory]].methods[0];
              //   } else {
              //     method = formData.methods[0];
              //   }

              //   const output = formData.output;

              //   // Make API call to store the task information
              //   const requestBody = {
              //     datasetTitle: formData.dataset,
              //     taskId: taskId,
              //     method: method,
              //     datasetURL: formData.input,
              //     tool: filterCategory,
              //     outputPath: output,
              //     Owner: authData.username,
              //     status: 'Processing'
              //   };

              // fetch(`${SERVER_URL}/createTask`, {
              //   method: 'POST',
              //   headers: {
              //     'Content-Type': 'application/json'
              //   },
              //   body: JSON.stringify(requestBody)
              // })
              // .then(response => {
              //   if (response.ok) {
              //     if (response.status === 200) {
              //       console.log('Task created successfully!');
              //       setLoading(false);
              //       setSuccessMessage('Form submitted successfully!');
              //       setErrorMessage('');
              //       navigate("/mydata/taskDetails", { state: { taskId: taskId, method: method, datasetURL: formData.input, datasetTitle: formData.dataset, tool: filterStaticCategoryMap[filterCategory] } });
              //     } else if (response.status === 400) {
              //       response.json().then(data => {
              //         console.error('Validation error:', data.error);
              //         setErrorMessage(data.error); // Set specific error message based on response
              //       });
              //     } else {
              //       throw new Error('Unexpected response from server');
              //     }
              //   } else {
              //     throw new Error('Failed to submit form: ' + response.statusText);
              //   }
              // })
              // .catch(error => {
              //   console.error('API request failed:', error);
              //   setLoading(false);
              //   setHasMessage(true);
              //   setMessage('An error occurred while submitting the form: ' + error.message);
              //   setIsError(true);
              // });
            })
            .catch(error => {
              // Handle any errors that occur during the API call
              console.error("Form submission error:", error);
              setLoading(false);
              setHasMessage(true);
              setMessage("Form submission error:", error);
              setIsError(true);
            });
        } else {
          console.warn("Unauthorized - please login first to continue");
          navigate("/routing");
        }
      })
      .catch((error) => {
        setHasMessage(true);
        setMessage("An error occurred while submitting the form.");
        setIsError(true);
      });
  };


  const handleDatasetChange = event => {
    let value = event.target.value;
    if (value !== "") {
      setSelectedDataset(event.target.value);
    } else {
      setSelectedDataset([]);
    }
  };


  const handleMultipleDatasetChange = (event) => {
    const selectedValues = Array.from(event.target.selectedOptions)
      .filter(option => option.value !== "") // Filter out options with empty value
      .map(option => option.value);

    setSelectedOptions(selectedValues);
    console.log(selectedOptions);
  };


  const handleRefDatasetChange = event => {
    let value = event.target.value;
    if (value !== "") {
      setSelectedRefDataset(event.target.value);
    } else {
      setSelectedRefDataset([]);
    }
  };


  const handleMultipleRefDatasetChange = (event) => {
    const selectedValues = Array.from(event.target.selectedOptions)
      .filter(option => option.value !== "") // Filter out options with empty value
      .map(option => option.value);

    setSelectedOptions(selectedValues);
    console.log(selectedOptions);
  };

  return (
    <div className='tools-container workflow-container common-class-tools-and-workflows'>

      {hasMessage && <AlertMessageComponent message={message} setHasMessage={setHasMessage} setMessage={setMessage} isError={isError} />}

      <div className="separator heading">
        <div className="stripe"></div>
        <h2 className="h-sm font-weight-bold">
          Datasets
        </h2>
        <div className="stripe"></div>
      </div>

      <div>
        <InputDataComponent handleDatasetChange={handleDatasetChange} handleMultipleDatasetChange={handleMultipleDatasetChange}
          formErrors={formErrors} filterCategory={props.selectedWorkflow} selectedDatasets={selectedDatasets}
          onSelectDataset={onSelectDataset} onDeleteDataset={onDeleteDataset} onSelectSubItem={onSelectSubItem} />
      </div>

      <div className="separator heading">
        <div className="stripe"></div>
        <h2 className="h-sm font-weight-bold">
          Reference Datasets
        </h2>
        <div className="stripe"></div>
      </div>

      <div>
        <InputRefDataComponent handleDatasetChange={handleRefDatasetChange} handleMultipleDatasetChange={handleMultipleRefDatasetChange}
          formErrors={formErrors} filterCategory={props.selectedWorkflow} selectedDatasets={selectedRefDatasets}
          onSelectDataset={onSelectRefDataset} onDeleteDataset={onDeleteRefDataset} onSelectSubItem={onSelectRefSubItem} />
      </div>

      <div className="form-component">
        <Form
          schema={Schema}
          uiSchema={uiSchema(dynamicOptions)}
          widgets={widgets}
          formData={formData}
          onChange={({ formData }) => setFormData(formData)}
          onSubmit={handleSubmit}
          onError={(errors) => console.log("Form errors:", errors)}
          validator={validator}
        />
      </div>
      <Chatbot presetQuestions={presetQuestions} />
    </div>
  )
};
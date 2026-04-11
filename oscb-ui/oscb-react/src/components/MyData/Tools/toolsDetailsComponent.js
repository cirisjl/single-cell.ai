import React, { useState, useEffect } from 'react';
import { getCookie, isUserAuth } from '../../../utils/utilFunctions';
import { useNavigate } from 'react-router-dom';
import Form from 'react-jsonschema-form';
import Toggle from 'react-toggle';
import 'react-toggle/style.css';
import InputDataComponent from './inputDataCollection';
import InputRefDataComponent from './inputRefDataCollection';
import { CELERY_BACKEND_API, defaultQcParams, defaultNormalizationParams, defaultReductionParams } from '../../../constants/declarations';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner } from '@fortawesome/free-solid-svg-icons';
import GeneRangeSlider from './components/geneRangeSlider';
import RangeSlider from './components/sliderComponent';
import SwitchComponent from './components/switchComponent';
import UseDefaultSwitch from './components/useDefaultSwitch';
import MultiSelectComponent from './components/multiselectComponent';
import SelectComponent from './components/selectComponent';
import ClusterLabelInput from './components/customInputComponent';
import Chatbot from "../../RightNavigation/Chatbot";


export default function ToolsDetailsComponent(props) {
  const filterName = props.filter;
  const filterCategory = props.category;
  const [selectedDatasets, setSelectedDatasets] = useState({});


  const filterCategoryMap = {
    quality_control: '/tools/qc',
    normalization: '/tools/normalize',
    imputation: '/tools/impute',
    integration: '/tools/integrate',
    annotation: '/tools/annotate',
    formatting: '/tools/convert',
    visualization: '/tools/reduce',
    // Add more filter categories and their corresponding URL paths as needed
  };

  const parametersKey = {
    quality_control: 'qc_params',
    normalization: 'normalization_params',
    imputation: 'imputation_params',
    integration: 'integration_params',
    annotation: 'annotation_params',
    visualization: 'reduction_params'
  };

  const filterStaticCategoryMap = {
    quality_control: 'Quality Control',
    normalization: 'Normalization',
    imputation: 'Imputation',
    integration: 'Integration',
    annotation: 'Annotation',
    formatting: 'Formatting',
    visualization: 'Visualization'
    // Add more filter categories and their corresponding Names as needed
  };

  console.log(filterName);

  let jwtToken = getCookie('jwtToken');
  const [formData, setFormData] = useState({});
  const [useDefault, setUseDefault] = useState(true);
  // let useDefault = true;
  const [filterSchema, setFilterSchema] = useState(null);
  const [UIfilterSchema, setUIFilterSchema] = useState(null);
  const [, setSelectedDataset] = useState([]);
  const [, setSelectedRefDataset] = useState([]);
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  //For dynamic Loading of the schema
  const [presetQuestions, setPresetQuestions] = useState(null);
  const [selectedRefDatasets, setSelectedRefDatasets] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    setPresetQuestions([
      { title: `What is ${filterStaticCategoryMap[filterCategory]} of single-cell sequencing data analysis ?`, "prompt": `Explain ${filterStaticCategoryMap[filterCategory]} in single-cell sequencing data analysis.` },
      { title: `What is the purpose of the ${filterStaticCategoryMap[filterCategory]} task?`, "prompt": `Explain the purpose of the ${filterStaticCategoryMap[filterCategory]} task in single-cell sequencing data analysis.` },
      { title: `How do I interpret the results of the ${filterStaticCategoryMap[filterCategory]} task?`, "prompt": `How do I interpret the results of the ${filterStaticCategoryMap[filterCategory]} task in single-cell sequencing data analysis?` },
      { title: `Are there any best practices for using the ${filterStaticCategoryMap[filterCategory]} task?`, "prompt": `Are there any best practices for using the ${filterStaticCategoryMap[filterCategory]} task in single-cell sequencing data analysis?` }
    ]);
    console.log("presetQuestions:", presetQuestions);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterCategory]);

  const navigate = useNavigate();

  const [dynamicOptions, setDynamicOptions] = useState({
    outputFormatOptions: ["AnnData", "SingleCellExperiment", "Seurat", "CSV"],
    speciesOptions: ["human", "mouse"],
    layers: [], // Add layers as a dynamic option
    obs_names: [], // Add obs_names as a dynamic option
    obs_names_ref: [], // Add obs_names as a dynamic option
    embeddings: [], // Add embeddings as a dynamic option
    species: [],
    organ_part: [],
  });

  const onSelectDataset = (dataset) => {
    let datasetId = dataset.Id;
    let currentSelectedDatasets = { ...selectedDatasets };

    if (currentSelectedDatasets[datasetId]) {
      delete currentSelectedDatasets[datasetId];
    } else {
      if (filterCategory !== "integration") {
        currentSelectedDatasets = {};
      }
      currentSelectedDatasets[datasetId] = dataset;
    }
    if (filterCategory === "quality_control") {
      // Check if any of the selected datasets should trigger hiding for Seurat
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

      console.log("obs_names: ", getObsNamesArray(selectedDatasets));
      console.log("species: ", getSpeciesArray(selectedDatasets));
      console.log("organ_part: ", getOrganPartArray(selectedDatasets));
      console.log("selectedDatasets: ", selectedDatasets);

      setPresetQuestions(getPresetQuestions(selectedDatasets));
      // setPresetQuestions((prevQuestions) => ({
      //   ...prevQuestions,
      //   ...getPresetQuestions(selectedDatasets),
      // }));
      console.log("presetQuestions:", presetQuestions);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDatasets]);

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
      console.log("dataset for presetQuestions:", dataset);
      if (dataset.selectedSubItem?.Species && dataset.selectedSubItem?.["Organ Part"] && dataset.selectedSubItem?.['Cell Count Estimate']) {
        if (filterCategory === "quality_control") {
          presetQuestionsList.push({ title: "What is the recommendation for **Min Genes** and **Max Genes**?", "prompt": "Suggest Min Genes and Max Genes of " + dataset.selectedSubItem?.['Cell Count Estimate'] + " " + dataset.selectedSubItem?.Species + " " + dataset.selectedSubItem?.["Organ Part"] + " cells in single-cell RNA sequence quality control." });
          presetQuestionsList.push({ title: "What is the recommendation for **Min Cells**?", "prompt": "Suggest Min Cells of " + dataset.selectedSubItem?.['Cell Count Estimate'] + " " + dataset.selectedSubItem?.Species + " " + dataset.selectedSubItem?.["Organ Part"] + " cells in single-cell RNA sequence quality control." });
          presetQuestionsList.push({ title: "What is the recommendation for **Percentage of Counts in Mitochondrial Genes**?", "prompt": "Suggest Percentage of Counts in Mitochondrial Genes of " + dataset.selectedSubItem?.['Cell Count Estimate'] + " " + dataset.selectedSubItem?.Species + " " + dataset.selectedSubItem?.["Organ Part"] + " cells in single-cell RNA sequence quality control." });
          presetQuestionsList.push({ title: "What is the recommendation for **Expected Doublet Rate**?", "prompt": "Suggest Expected Doublet Rate of " + dataset.selectedSubItem?.['Cell Count Estimate'] + " " + dataset.selectedSubItem?.Species + " " + dataset.selectedSubItem?.["Organ Part"] + " cells in single-cell RNA sequence quality control." });
        }

        presetQuestionsList.push({ title: "What is the recommendation for **n_neighbors**?", "prompt": "Suggest n_neighbors of " + dataset.selectedSubItem?.['Cell Count Estimate'] + " " + dataset.selectedSubItem?.Species + " " + dataset.selectedSubItem?.["Organ Part"] + " cells in single-cell RNA sequence dimension reduction and clustering." });
        presetQuestionsList.push({ title: "What is the recommendation for **n_pcs**?", "prompt": "Suggest n_pcs of " + dataset.selectedSubItem?.['Cell Count Estimate'] + " " + dataset.selectedSubItem?.Species + " " + dataset.selectedSubItem?.["Organ Part"] + " cells in single-cell RNA sequence dimension reduction and clustering." });
        presetQuestionsList.push({ title: "What is the recommendation for Clustering **Resolution**?", "prompt": "Suggest cluster resolution of " + dataset.selectedSubItem?.['Cell Count Estimate'] + " " + dataset.selectedSubItem?.Species + " " + dataset.selectedSubItem?.["Organ Part"] + " cells in single-cell RNA sequence dimension reduction and clustering." });
      } else if (dataset?.Species && dataset?.["Organ Part"] && dataset?.['Cell Count Estimate']) {
        if (filterCategory === "quality_control") {
          presetQuestionsList.push({ title: "What is the recommendation for **Min Genes** and **Max Genes**?", "prompt": "Suggest Min Genes and Max Genes of " + dataset?.['Cell Count Estimate'] + " " + dataset?.Species + " " + dataset?.["Organ Part"] + " cells in single-cell RNA sequence quality control." });
          presetQuestionsList.push({ title: "What is the recommendation for **Min Cells**?", "prompt": "Suggest Min Cells of " + dataset?.['Cell Count Estimate'] + " " + dataset?.Species + " " + dataset?.["Organ Part"] + " cells in single-cell RNA sequence quality control." });
          presetQuestionsList.push({ title: "What is the recommendation for **Percentage of Counts in Mitochondrial Genes**?", "prompt": "Suggest Percentage of Counts in Mitochondrial Genes of " + dataset?.['Cell Count Estimate'] + " " + dataset?.Species + " " + dataset?.["Organ Part"] + " cells in single-cell RNA sequence quality control." });
          presetQuestionsList.push({ title: "What is the recommendation for **Expected Doublet Rate**?", "prompt": "Suggest Expected Doublet Rate of " + dataset?.['Cell Count Estimate'] + " " + dataset?.Species + " " + dataset?.["Organ Part"] + " cells in single-cell RNA sequence quality control." });
        }

        presetQuestionsList.push({ title: "What is the recommendation for **n_neighbors**?", "prompt": "Suggest n_neighbors of " + dataset?.['Cell Count Estimate'] + " " + dataset?.Species + " " + dataset?.["Organ Part"] + " cells in single-cell RNA sequence dimension reduction and clustering." });
        presetQuestionsList.push({ title: "What is the recommendation for **n_pcs**?", "prompt": "Suggest n_pcs of " + dataset?.['Cell Count Estimate'] + " " + dataset?.Species + " " + dataset?.["Organ Part"] + " cells in single-cell RNA sequence dimension reduction and clustering." });
        presetQuestionsList.push({ title: "What is the recommendation for Clustering **Resolution**?", "prompt": "Suggest cluster resolution of " + dataset?.['Cell Count Estimate'] + " " + dataset?.Species + " " + dataset?.["Organ Part"] + " cells in single-cell RNA sequence dimension reduction and clustering." });
      }
    });
    return presetQuestionsList;
  };

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


  const extractDir = (inputFile) => {
    const fileLocParts = inputFile.split('/');
    fileLocParts.pop(); // Remove the file name from the array
    const output = fileLocParts.join('/'); // Join the remaining parts with '/'
    return output;
  };

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
    UseDefaultSwitch: UseDefaultSwitch,
    ClusterLabelInput: ClusterLabelInput
  };

  const onSubmit = ({ formData }) => {

    // Handle form submission here
    formData = formData.parameters;

    if (filterCategory === "annotation") {
      if (formData[parametersKey[filterCategory]].methods.includes("scVI") && Object.keys(selectedRefDatasets).length < 1) {
        setFormErrors("Please select one reference dataset for scVI annotation before submitting the form.");
        console.log("Failed to submit the form.");
      }
    }

    // Perform form validation and set formErrors accordingly
    if (filterCategory === "integration") {
      if ((formData[parametersKey[filterCategory]].methods.includes("Seurat") || formData[parametersKey[filterCategory]].methods.includes("Liger")) && Object.keys(selectedDatasets).length < 2) {
        setFormErrors("Please select at least two datasets for Seurat or Liger integration before submitting the form.");
        console.log("Failed to submit the form.");
      }
      // if ((formData[parametersKey[filterCategory]].methods.includes("scVI") || formData[parametersKey[filterCategory]].methods.includes("Harmony")) && Object.keys(selectedDatasets).length === 1 && formData[parametersKey[filterCategory]].batch_key === "") {
      if (formData[parametersKey[filterCategory]].batch_key === "") {
        setFormErrors("Please select Batch_Key if you only select one dataset for scVI or Harmony integration before submitting the form.");
        console.log("Failed to submit the form.");
      }
      // if (Object.keys(selectedDatasets).length === 0){
      //   setFormErrors("Please select a dataset before submitting the form.");
      //   console.log("Failed to submit the form.");
      // }
    }

    // if(filterCategory !== "integration" && Object.keys(selectedDatasets).length === 0) {
    if (Object.keys(selectedDatasets).length === 0) {
      setFormErrors("Please select a dataset before submitting the form.");
      console.log("Failed to submit the form");
    } else {
      setLoading(true);
      if (filterCategory === "integration") {
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

        formData.input = inputArray;  // if the input file is at location /usr/src/storage/dataset1/filename.h5ad
        const directory = extractDir(formData.input[0]);
        formData.output = directory + "/integration";
      } else {
        const dataset = Object.values(selectedDatasets)[0]; // Assuming single dataset for non-integration category
        formData.dataset = dataset.Title;
        formData.datasetId = dataset.Id;
        // Check if selectedSubItem is present and has a non-null adata_path
        let adata_path;
        if (dataset.selectedSubItem && dataset.selectedSubItem.adata_path) {
          adata_path = dataset.selectedSubItem.adata_path;
        } else {
          adata_path = dataset.adata_path;
        }

        if (adata_path) {
          formData.input = adata_path;
          const directory = extractDir(formData.input);
          formData.output = directory + "/" + filterCategory;
        }
      }

      if (filterCategory === "annotation") {
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

      let method = "";

      if (filterCategory === "visualization") {
        method = ["UMAP", "t-SNE"];
      } else if (filterCategory === "formatting") {
        method = ["Convert"];
      } else if (parametersKey[filterCategory]) {
        method = formData[parametersKey[filterCategory]].methods;
      } else {
        method = formData.methods;
      }

      let job_description = "";
      if (typeof formData.dataset === 'string') {
        if (typeof method === 'string') {
          job_description = method + ' ' + filterStaticCategoryMap[filterCategory] + ' for ' + formData.dataset;
        } else {
          job_description = method.join(', ') + ' ' + filterStaticCategoryMap[filterCategory] + ' for ' + formData.dataset;
        }
      } else if (Array.isArray(formData.dataset)) {
        if (formData.dataset.length > 1) {
          let datasets = formData.dataset.join(', ');
          if (typeof method === 'string') {
            job_description = method + ' ' + filterStaticCategoryMap[filterCategory] + ' for ' + datasets;
          } else {
            job_description = method.join(', ') + ' ' + filterStaticCategoryMap[filterCategory] + ' for ' + datasets;
          }
        } else if (formData.dataset.length === 1) {
          if (typeof method === 'string') {
            job_description = method + ' ' + filterStaticCategoryMap[filterCategory] + ' for ' + formData.dataset[0];
          } else {
            job_description = method.join(', ') + ' ' + filterStaticCategoryMap[filterCategory] + ' for ' + formData.dataset[0];
          }
        }
      }

      formData.description = job_description;
      formData.method = method;
      formData.process = filterStaticCategoryMap[filterCategory];
      formData.species = formData.species || getSpeciesArray(selectedDatasets)[0] || '';
      formData.organ_part = formData.organ_part || getOrganPartArray(selectedDatasets)[0] || '';

      // Verify the authenticity of the user
      isUserAuth(jwtToken)
        .then((authData) => {
          if (authData.isAuth) {
            formData.userID = authData.username;

            const RELATIVE_PATH = filterCategoryMap[filterCategory];
            console.log("formData: ", formData)
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
                // After a successfull task creation, store the intermediate task information in the mongoDB task_results collection
                const jobId = response.job_id;
                console.log('Task created successfully!');
                setLoading(false);
                setSuccessMessage('Form submitted successfully!');
                setErrorMessage('');
                navigate("/mydata/taskDetails", { state: { job_id: jobId, method: formData.method, datasetURL: formData.input, description: formData.description, process: filterStaticCategoryMap[filterCategory] } });
                this.forceUpdate();
              })
              .catch(error => {
                // Handle any errors that occur during the API call
                console.error("Form submission error:", error);
                setLoading(false);
                setSuccessMessage('');
                setErrorMessage('An error occurred while submitting the form.');
              });
          } else {
            console.warn("Unauthorized - please login first to continue");
            navigate("/routing");
          }
        })
        .catch((error) => {
          console.error(error);
          setLoading(false);
          setSuccessMessage('');
          setErrorMessage('An error occurred while submitting the form.');
        }
        );
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setSuccessMessage('');
    }, 3000);
    // Return a cleanup function to cancel the timeout when the component unmounts
    return () => clearTimeout(timeoutId);
  }, [successMessage]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setErrorMessage('');
    }, 3000);
    // Return a cleanup function to cancel the timeout when the component unmounts
    return () => clearTimeout(timeoutId);
  }, [errorMessage]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setFormErrors('');
    }, 3000);
    // Return a cleanup function to cancel the timeout when the component unmounts
    return () => clearTimeout(timeoutId);
  }, [formErrors]);


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


  useEffect(() => {
    import(`./../../../schema/react-json-schema/Tools/${filterCategory}/${filterName}.json`)
      .then((module) => {
        setFilterSchema(JSON.parse(JSON.stringify(module.default)));
        // setFilterSchema({...module.default});

        console.log("react json schema")
        console.log(filterSchema);
      })
      .catch((error) => {
        console.error('Error loading filter schema:', error);
        setFilterSchema(null);
      });

    import(`./../../../schema/UI-schema/Tools/${filterCategory}/${filterName}.js`)
      .then((module) => {
        if (typeof module.uiSchema === 'function') {
          // Pass dynamicOptions if uiSchema is a function
          setUIFilterSchema(module.uiSchema(dynamicOptions));
        } else {
          // If not a function, set the UI schema directly
          setUIFilterSchema(module.uiSchema);
        }
        console.log("React JSON UI schema with dynamic options", UIfilterSchema);
      })
      .catch((error) => {
        console.error('Error loading UI filter schema:', error);
        setUIFilterSchema(null);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterName, filterCategory, dynamicOptions]);

  const handleChange = ({ formData }) => {

    // Choose the appropriate default parameters based on the category
    let defaultParams;
    let paramsKey;
    if (filterCategory === 'quality_control') {
      defaultParams = defaultQcParams;
      paramsKey = 'qc_params';

    } else if (filterCategory === 'normalization') {
      defaultParams = defaultNormalizationParams;
      paramsKey = 'normalization_params';

    } else if (filterCategory === 'visualization') {
      defaultParams = defaultReductionParams;
      paramsKey = 'reduction_params';
    } else {
      // For other categories, we do not reset parameters, just set formData
      setFormData(formData);
      return;
    }

    const currentToolParams = formData.parameters[paramsKey] || {};

    // Determine if there's a change in the use_default toggle
    const useDefaultChanged = useDefault !== currentToolParams.use_default;

    // Check for any changes in default parameters
    let defaultParamsChanged = Object.keys(defaultParams).some(key => {
      return JSON.stringify(currentToolParams[key]) !== JSON.stringify(defaultParams[key]);
    });

    if (useDefaultChanged) {
      if (currentToolParams.use_default) {
        // If use_default is toggled to true, reset only the default parameters
        const resetParams = {};
        Object.keys(defaultParams).forEach(key => {
          resetParams[key] = defaultParams[key];
        });
        formData.parameters[paramsKey] = {
          ...formData.parameters[paramsKey],
          ...resetParams
        };
      }
    } else if (defaultParamsChanged) {
      // If any default parameters have changed and use_default was previously true, set it to false
      formData.parameters[paramsKey].use_default = false;
    }

    setUseDefault(formData.parameters[paramsKey].use_default);
    setFormData(formData);
  };

  return (
    <div className='tools-container common-class-tools-and-workflows'>
      {loading && (
        <div className='message-box loadingIcon' style={{ backgroundColor: '#bdf0c0' }}>
          <div style={{ textAlign: 'center' }}>
            <FontAwesomeIcon icon={faSpinner} spin />
            <p>Loading...</p>
          </div>
        </div>
      )}
      {successMessage && (
        <div className='message-box success' id="tooltip" style={{ backgroundColor: '#bdf0c0' }}>
          <div style={{ textAlign: 'center' }}>
            <p>{successMessage}</p>
          </div>
        </div>
      )}
      {errorMessage && (
        <div className='message-box error' id="tooltip" style={{ backgroundColor: '#f0c0c0' }}>
          <div style={{ textAlign: 'center' }}>
            <p>{errorMessage}</p>
          </div>
        </div>
      )}
      <div className="separator heading">
        <div className="stripe"></div>
        <h2 className="h-sm font-weight-bold">
          Datasets
        </h2>
        <div className="stripe"></div>
      </div>
      <div>
        <InputDataComponent handleDatasetChange={handleDatasetChange} handleMultipleDatasetChange={handleMultipleDatasetChange}
          formErrors={formErrors} filterCategory={filterCategory} filterName={filterName} selectedDatasets={selectedDatasets}
          onSelectDataset={onSelectDataset} onDeleteDataset={onDeleteDataset} onSelectSubItem={onSelectSubItem} />
      </div>
      {filterCategory === "annotation" && (
        <div className="separator heading">
          <div className="stripe"></div>
          <h2 className="h-sm font-weight-bold">
            Reference Datasets
          </h2>
          <div className="stripe"></div>
        </div>
      )}
      {filterCategory === "annotation" && (
        <div>
          <InputRefDataComponent handleDatasetChange={handleRefDatasetChange} handleMultipleDatasetChange={handleMultipleRefDatasetChange}
            formErrors={formErrors} filterCategory={filterCategory} filterName={filterName} selectedDatasets={selectedRefDatasets}
            onSelectDataset={onSelectRefDataset} onDeleteDataset={onDeleteRefDataset} onSelectSubItem={onSelectRefSubItem} />
        </div>
      )}

      {filterSchema && UIfilterSchema ? (
        <div className="form-component">
          <Form
            schema={filterSchema}
            formData={formData}
            widgets={widgets}
            onChange={handleChange}
            uiSchema={UIfilterSchema}
            onSubmit={onSubmit}
            key={JSON.stringify(formData)} // Helps in re-rendering the form with updated data
          />
        </div>
      ) : (
        <div>No Schema for this tool.</div>
      )}
      <Chatbot presetQuestions={presetQuestions} />
    </div>
  )
};

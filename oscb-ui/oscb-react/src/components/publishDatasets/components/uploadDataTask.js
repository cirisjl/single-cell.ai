import React from 'react';
import UppyUploader from '../../MyData/uppy';
import { getCookie, isUserAuth, createUniqueFolderName, moveFilesToNewDirectory } from '../../../utils/utilFunctions';
import { NODE_API_URL } from '../../../constants/declarations';
import axios from 'axios';
import { useState, useEffect, useCallback } from 'react';
import close_icon from '../../../assets/close_icon_u86.svg';
import close_icon_hover from '../../../assets/close_icon_u86_mouseOver.svg';
import { faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/Delete';
import { styled } from '@mui/material/styles';
import { Select, MenuItem } from '@mui/material';
import { FormControl } from '@mui/material';
import CreatableSelect from 'react-select/creatable';


function UploadDataTaskComponent({ setTaskStatus, taskData, setTaskData, setActiveTask, activeTask }) {

  let pwd = "tempStorage/";

  // State to manage error messages
  const [fileError, setFileError] = useState('');
  // const [titleError, setTitleError] = useState('');
  const [errors, setErrors] = useState({});
  const [errorMessage, setErrorMessage] = useState('');
  const [hoveredErrPopup, setHoveredErrPopup] = useState(false);
  const [username, setUsername] = useState('');
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState(taskData.upload.files);
  let [selectedAliases, setSelectedAliases] = useState(taskData.upload.files);
  const acceptedMultiFileNames = ['molecules.txt', 'annotation.txt', 'barcodes.tsv', 'genes.tsv', 'matrix.mtx', 'barcodes.tsv.gz', 'genes.tsv.gz', 'matrix.mtx.gz', 'features.tsv', 'features.tsv.gz'];
  const acceptedMultiFileSets = [
    ['molecules.txt', 'annotation.txt'],
    ['barcodes.tsv', 'genes.tsv', 'matrix.mtx'],
    ['barcodes.tsv.gz', 'genes.tsv.gz', 'matrix.mtx.gz'],
    ['barcodes.tsv', 'features.tsv', 'matrix.mtx'],
    ['barcodes.tsv.gz', 'features.tsv.gz', 'matrix.mtx.gz']
  ];



  const [options, setOptions] = useState(
    {
      Species: [],
    },
  )
  const [newOptions, setNewOptions] = useState([]);

  // Custom styled components
  const ScrollableListContainer = styled('div')(({ theme }) => ({
    maxHeight: '400px', // Fixed height of the container
    overflowY: 'auto', // Enable vertical scrolling
    border: `1px solid ${theme.palette.divider}`, // Add border to distinguish the container
    borderRadius: theme.shape.borderRadius, // Use theme's border radius
    marginTop: theme.spacing(2),
  }));

  const CustomListItem = styled(ListItem)(({ theme }) => ({
    '&:hover': {
      backgroundColor: theme.palette.action.hover,
    },
    cursor: 'pointer', // Change cursor on hover to indicate an item is clickable
  }));

  useEffect(() => {
    // Function to check authentication and set user details
    const checkAuthentication = async () => {
      if (getCookie('jwtToken') === undefined || getCookie('jwtToken') === '') {
        // Navigate to the login page
        window.location.href = '/routing';
      } else {
        try {
          const authData = await isUserAuth(getCookie('jwtToken'));
          if (authData.isAuth) {
            setUsername(authData.username);
            fetchDefaultOptions();
          } else {
            console.warn("Token expired! Please login again");
            window.location.href = '/routing';
          }
        } catch (error) {
          console.error('Error during authentication:', error);
        }
      }
    };

    // Function to fetch default options
    const fetchDefaultOptions = async () => {
      try {
        const response = await fetch(`${NODE_API_URL}/options`);
        if (!response.ok) {
          console.error('Error fetching default options');
          return;
        }
        const data = await response.json();

        const optionsData = {};
        const fieldNames = [
          'Species'
        ];

        fieldNames.forEach(fieldName => {
          if (data[fieldName]) {
            optionsData[fieldName] = data[fieldName].map(option => ({
              value: option.abbreviation,
              label: option.name
            }));
          }
        });

        setOptions(optionsData);
      } catch (error) {
        console.error('Error fetching default options:', error);
      }
    };

    // Call the authentication check function
    checkAuthentication();
  }, []);



  // Handle CreatableSelect changes
  const handleSelectChange = (name, selectedOption) => {
    // Update the specie in the taskData state
    setTaskData((prevTaskData) => ({
      ...prevTaskData,
      upload: {
        ...prevTaskData.upload,
        [name]: selectedOption,
      },
    }));
  };

  const optionAlreadyCreated = useCallback((fieldName, inputValue) => {
    return newOptions.some(
      (option) => option.field === fieldName && option.name === inputValue
    );
  }, [newOptions]);

  const addNewOptionToMongoDB = useCallback((fieldName, optionName) => {
    axios
      .post(`${NODE_API_URL}/addNewOption`, {
        field: fieldName,
        name: optionName,
        username: username
      })
      .then((response) => {
        console.log(`New option "${optionName}" added to MongoDB for field "${fieldName}"`);
      })
      .catch((error) => {
        console.error('Error adding new option to MongoDB:', error);
      });
  }, [username]);

  const handleCreateOption = useCallback((fieldName, inputValue) => {
    // Check if the option has already been created to prevent duplicate calls
    if (!optionAlreadyCreated(fieldName, inputValue)) {
      addNewOptionToMongoDB(fieldName, inputValue);
    }

    const newOption = { value: inputValue, label: inputValue };

    // Update options state
    setOptions((prevOptions) => {
      const updatedOptions = { ...prevOptions };
      updatedOptions[fieldName] = [...(updatedOptions[fieldName] || []), newOption];
      return updatedOptions;
    });

    // Determine if the field should be treated as an array or a single value field
    // (formData previously set here is removed to fix unused variable)

    // Update newOptions state
    setNewOptions((prevNewOptions) => [
      ...prevNewOptions,
      { field: fieldName, name: inputValue }
    ]);
  }, [optionAlreadyCreated, addNewOptionToMongoDB]);


  function getAliasOptions(fileName) {
    if (fileName.endsWith('.txt')) {
      return ['molecules', 'annotation'];
    } else if (fileName.endsWith('.tsv')) {
      return ['genes', 'cells', 'features'];
    } else if (fileName.endsWith('.tsv.gz')) {
      return ['genes', 'cells', 'features'];
    } else if (fileName.endsWith('.mtx')) {
      return ['matrix'];
    } else if (fileName.endsWith('.mtx.gz')) {
      return ['matrix'];
    }
    else {
      return [];
    }
  };

  function getStandardFileName(fileName, fileType) {
    const acceptedFileTypes = ["molecules", "annotation", "cells", "genes", "matrix", "features"];
    if (!acceptedFileTypes.includes(fileType)) {
      return fileName;
    }
    const txt = { "molecules": "molecules.txt", "annotation": "annotation.txt" }
    const tsv = { "cells": "barcodes.tsv", "genes": "genes.tsv", "features": "features.tsv" }
    const tsv_gz = { "cells": "barcodes.tsv.gz", "genes": "genes.tsv.gz", "features": "features.tsv.gz" }
    const mtx = { "matrix": "matrix.mtx" }
    const mtx_gz = { "matrix": "matrix.mtx.gz" }

    if (fileName.endsWith('.txt')) {
      return txt[fileType];
    } else if (fileName.endsWith('.tsv')) {
      return tsv[fileType];
    } else if (fileName.endsWith('.tsv.gz')) {
      return tsv_gz[fileType];
    } else if (fileName.endsWith('.mtx')) {
      return mtx[fileType];
    } else if (fileName.endsWith('.mtx.gz')) {
      return mtx_gz[fileType];
    }
  };

  const handleMouseOver = () => {
    setHoveredErrPopup(true);
  };

  const handleMouseOut = () => {
    setHoveredErrPopup(false);
  };

  const handleCrossButtonClick = () => {
    setErrorMessage('');
  }
  // Handle the title input change
  const handleTitleChange = (e) => {
    const newTitle = e.target.value;
    // setTitleError('');

    // Update the title in the taskData state
    setTaskData((prevTaskData) => ({
      ...prevTaskData,
      upload: {
        ...prevTaskData.upload,
        title: newTitle,
      },
    }));
  };

  useEffect(() => {
    setSelectedFiles(taskData.upload.files);
    setSelectedAliases(taskData.upload.files)
  }, [taskData.upload.files]); // Dependency array

  const removeFile = async (item, indexToRemove) => {
    try {
      // Send request to backend to delete the file
      await axios.delete(`${NODE_API_URL}/storage/delete-file?fileName=${item}&authToken=${getCookie('jwtToken')}&newDirectoryPath=tempStorage`);

      // If successful, update the state to remove the file from the list
      setSelectedFiles(selectedFiles.filter((_, index) => index !== indexToRemove));
      setSelectedAliases(selectedAliases.filter((_, index) => index !== indexToRemove));
      const newTaskDataFiles = taskData.upload.files.filter((_, index) => index !== indexToRemove);
      // Update the taskData state
      setTaskData(previousTaskData => ({
        ...previousTaskData,
        upload: {
          ...previousTaskData.upload,
          files: newTaskDataFiles
        }
      }));


    } catch (error) {
      console.error("Error deleting file:", error);
      // Handle error (e.g., show error message to the user)
    }
  };
  const handleTask1Completion = async () => {
    // Validate file upload and title input
    if (taskData.upload.files === undefined || taskData.upload.files.length === 0) {
      setFileError('Please upload a file.');
    } else {
      setFileError('');
    }
    if (selectedFiles.length > 1) {
      let isFileSelectionValid = false;
      acceptedMultiFileSets.forEach(function (multiFileSet) {
        for (let i = 0; i < multiFileSet.length; i++) {
          if (!selectedAliases.includes(multiFileSet[i])) {
            break;
          }
          else if (i === multiFileSet.length - 1)
            isFileSelectionValid = true;
        }
      });
      console.log('Selected Aliases: ' + selectedAliases);
      if (!isFileSelectionValid) {
        setErrorMessage("The set of selected files do not comply with the standard multi-file dataset requirements.");
        return;
      }
      for (let i = 0; i < selectedFiles.length; i++) {
        const fileName = selectedFiles[i];
        if (!acceptedMultiFileNames.includes(fileName)) {
          selectedFiles[i] = selectedAliases[i];

          fetch(`${NODE_API_URL}/storage/renameFile?oldName=tempStorage/${fileName}&newName=tempStorage/${selectedFiles[i]}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
          })
          console.log("Make an API Call to rename the files that are stored");
        }
      }
      // Update the state of the task in the taskData state
      setTaskData((prevTaskData) => ({
        ...prevTaskData,
        upload: {
          ...prevTaskData.upload,
          files: selectedAliases
        },
      }));
    }
    else if (selectedFiles.length === 1) {
      const acceptedFormats = [".tsv", ".csv", ".txt.gz", ".txt", ".h5ad", ".h5mu", "rds", "h5seurat", "h5Seurat", "tsv.gz", "mtx.gz", "h5", "xlsx", "hdf5", "gz", "Robj", "zip", "rar", "tar", "tar.bz2", "tar.xz"];
      if (!acceptedFormats.some(format => selectedFiles[0].endsWith(format))) {
        setErrorMessage("The selected file is not of an accepted standard format.");
        return;
      }
    }

    if (!taskData.upload.title) {
      // setTitleError('Title is required.');
      setErrors('Title is required.');
      setErrorMessage("Title is required.");
      return;
    } else {
      setErrors('');
    }

    if (!taskData.upload.Species || (taskData.upload.Species && taskData.upload.Species === '')) {
      setErrors('Species is required.');
      setErrorMessage("Species is required.");
      return;
    } else {
      setErrors('');
    }

    // If both file and title are provided, continue to the next step
    if ((taskData.upload.files !== undefined && taskData.upload.files.length !== 0) && taskData.upload.title !== undefined) {

      try {
        if (taskData.upload.status !== 'completed') {
          // Create a new directory with the title name
          const newDirectoryName = createUniqueFolderName(taskData.upload.title);

          let isMultiFileDataset = taskData.upload.files.length > 1 ? true : false;

          let newDirectoryPath = `${newDirectoryName}`;
          // Move the uploaded files from tempStorage to the new directory
          await moveFilesToNewDirectory(newDirectoryPath, true);

          // Update the state of the task in the taskData state
          setTaskData((prevTaskData) => ({
            ...prevTaskData,
            upload: {
              ...prevTaskData.upload,
              status: 'completed',
              newDirectoryPath: newDirectoryPath,
              isMultiFileDataset: isMultiFileDataset
            },
          }));

          setTaskStatus((prevTaskStatus) => ({
            ...prevTaskStatus,
            1: true, // Mark Task 1 as completed
          }));

        }

        //The current task is finished, so make the next task active
        setActiveTask(2);

      } catch (error) {
        console.error('Error moving files:', error);
        // Handle the error as needed (e.g., display an error message to the user)
      }
    }
    console.log(taskData);
  };

  return (
    <div className='upload-task'>
      {(errorMessage !== '') && (
        <div className='message-box' style={{ backgroundColor: 'lightpink', zIndex: 9999 }}>
          <div style={{ textAlign: 'center' }}>
            <p>{errorMessage}</p>
            <div style={{ position: "absolute", right: "12px", top: "20px", cursor: "pointer" }}>
              <img src={hoveredErrPopup ? close_icon_hover : close_icon} alt="close-icon" onMouseOver={handleMouseOver} onMouseOut={handleMouseOut} onClick={handleCrossButtonClick} />
            </div>
          </div>
        </div>)}
      <div className="separator heading">
        <div className="stripe"></div>
        <h2 className="h-sm font-weight-bold">Upload</h2>
        <div className="stripe"></div>
      </div>
      <div className='uppy-uploader-component'>
        <div className="info-icon" onClick={() => { setIsInfoModalOpen(true); }}>
          <FontAwesomeIcon icon={faInfoCircle} size="1.2x" />
        </div>
        <span>Choose your file*</span>
        {isInfoModalOpen && <div className="modal" style={{ zIndex: 9999, width: "30%", height: "40%" }}>
          <div className='clear-icon'>
            <img src={hoveredErrPopup ? close_icon_hover : close_icon} alt="close-icon" onMouseOver={handleMouseOver} onMouseOut={handleMouseOut} onClick={() => setIsInfoModalOpen(false)} />
          </div>
          <div className="modal-content">
            <div>
              <p>
                Accepted Formats for Single-file Datasets: csv, tsv, txt, txt.gz, h5ad, rds, h5, hdf5, h5mu, h5seurat, Robj, zip, gz
              </p>
              <p>
                Standard File Structure for Multi-file Datasets:
              </p>
              <ul>
                <li>Molecules(txt)&nbsp;+&nbsp;Annotation(txt)</li>
                <li>Barcodes(Alias name: cells, extension:tsv)&nbsp;+&nbsp;Genes(Alias name: genes, extension:tsv)&nbsp;+&nbsp;Matrix(mtx)</li>
                <li>Barcodes(Alias name: cells, extension:tsv.gz)&nbsp;+&nbsp;Genes(Alias name: genes, extension:tsv.gz)&nbsp;+&nbsp;Matrix(mtx.gz)</li>
                <li>Barcodes(Alias name: cells, extension:tsv)&nbsp;+&nbsp;Features(Alias name: features, extension:tsv)&nbsp;+&nbsp;Matrix(mtx)</li>
                <li>Barcodes(Alias name: cells, extension:tsv.gz)&nbsp;+&nbsp;Features(Alias name: features, extension:tsv.gz)&nbsp;+&nbsp;Matrix(mtx.gz)</li>
              </ul>
            </div>
          </div>
        </div>}
        <UppyUploader toPublishDataset={true} isUppyModalOpen={true} pwd={pwd} authToken={getCookie('jwtToken')} publicDatasetFlag={true} setFileError={setFileError} setTaskData={setTaskData} />

        {selectedFiles.length > 0 &&
          <div id="files-selected">
            <ScrollableListContainer>
              <List dense>
                {selectedFiles.length > 1 ? (
                  <>
                    {selectedFiles.map((item, index) => {
                      const showDropdown = !acceptedMultiFileNames.includes(item);
                      return (
                        <div key={index} className="file-selections">
                          <CustomListItem key={index}>
                            <IconButton edge="start" aria-label="delete" onClick={() => removeFile(item, index)}>
                              <DeleteIcon />
                            </IconButton>
                            {showDropdown && (
                              <FormControl sx={{ m: 1, minWidth: 120 }} size="small">
                                <Select
                                  displayEmpty
                                  value={selectedAliases[index]}
                                  onChange={(e) => {
                                    const updatedAliases = [...selectedAliases];
                                    updatedAliases[index] = getStandardFileName(item, e.target.value);
                                    setSelectedAliases(updatedAliases);
                                  }}
                                  renderValue={(selected) => {
                                    if (selected && selected.length === 0) {
                                      return <em>Set a standard file type</em>;
                                    }
                                    return selected;
                                  }}
                                >
                                  {getAliasOptions(item).map((alias, aliasIndex) => (
                                    <MenuItem key={aliasIndex} value={alias}>{alias}</MenuItem>
                                  ))}
                                </Select>
                              </FormControl>
                            )}
                            <ListItemText primary={item} />
                          </CustomListItem>
                        </div>
                      );
                    })}
                  </>
                ) : (
                  <CustomListItem>
                    <IconButton edge="start" aria-label="delete" onClick={() => removeFile(selectedFiles[0], 0)}>
                      <DeleteIcon />
                    </IconButton>
                    <ListItemText primary={selectedFiles[0]} />
                  </CustomListItem>
                )}
              </List>
            </ScrollableListContainer>
            {selectedFiles.length > 1 &&
              <div style={{ color: 'red' }}>
                Notice: Files will be renamed to standard names of their corresponding type.
              </div>
            }
          </div>
        }
        {fileError && <div className="error-message"><span className="error-tooltip">{fileError}</span></div>}
      </div>

      <div className="modal-uploadMyData">
        <div>
          <p>
            Accepted Formats for Single-file Datasets: csv, tsv, txt, txt.gz, h5ad, rds, h5, hdf5, h5mu, h5seurat, Robj, zip, gz
          </p>
          <p>
            Standard File Structure for Multi-file Datasets:
          </p>
          <ul>
            <li>Molecules(txt)&nbsp;+&nbsp;Annotation(txt)</li>
            <li>Barcodes(Alias name: cells, extension:tsv)&nbsp;+&nbsp;Genes(Alias name: genes, extension:tsv)&nbsp;+&nbsp;Matrix(mtx)</li>
            <li>Barcodes(Alias name: cells, extension:tsv.gz)&nbsp;+&nbsp;Genes(Alias name: genes, extension:tsv.gz)&nbsp;+&nbsp;Matrix(mtx.gz)</li>
            <li>Barcodes(Alias name: cells, extension:tsv)&nbsp;+&nbsp;Features(Alias name: features, extension:tsv)&nbsp;+&nbsp;Matrix(mtx)</li>
            <li>Barcodes(Alias name: cells, extension:tsv.gz)&nbsp;+&nbsp;Features(Alias name: features, extension:tsv.gz)&nbsp;+&nbsp;Matrix(mtx.gz)</li>
          </ul>
        </div>
      </div>

      <div className="separator heading">
        <div className="stripe"></div>
        <h2 className="h-sm font-weight-bold">Parameters</h2>
        <div className="stripe"></div>
      </div>

      {/* Dataset */}
      <div className="form-field">
        <div>
          <label className="form-label">Title:</label>
          <span className="ui-form-title-message warning"> * required, name of the dataset. </span>
        </div>
        <input
          type="text"
          name="Title"
          required
          value={taskData.upload.title}
          onChange={handleTitleChange}
          className={`form-input ${errors.Title ? 'error' : ''}`}
        />
        {errors.Title && <div className="error-tooltip">{errors.Title}</div>}
      </div>

      {/* Species (CreatableSelect) */}
      <div className="form-field">
        <div>
          <label className="form-label">Species:</label>
          <span className="ui-form-title-message warning"> * required </span>
        </div>
        <CreatableSelect
          name="Species"
          value={taskData.upload.Species}
          isClearable
          isSearchable
          required
          onChange={(selectedOption) => handleSelectChange('Species', selectedOption)} // Use handleSelectChange              
          onCreateOption={(inputValue) => handleCreateOption('Species', inputValue)}
          options={options.Species} // Set options to the fetched options
          className={`form-input ${errors.Species ? 'error' : ''}`}
        />
        {errors.Species && <div className="error-tooltip">{errors.Species}</div>}
      </div>

      <div className='next-upon-success'>
        <button type="submit" className="btn btn-info button" onClick={handleTask1Completion}>Next</button>
      </div>
    </div>
  );
}

export default UploadDataTaskComponent;

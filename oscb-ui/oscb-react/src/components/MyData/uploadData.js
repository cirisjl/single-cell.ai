import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFolderOpen } from "@fortawesome/free-solid-svg-icons";
import { faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import './ModalWindow.css';
import { getCookie, isUserAuth, copyFilesToPrivateStorage, fetchUserProjectsList } from '../../utils/utilFunctions';
// import Form from "@rjsf/core";
import close_icon from '../../assets/close_icon_u86.svg';
import close_icon_hover from '../../assets/close_icon_u86_mouseOver.svg';
import React from "react";
import ToggleSwitch from "../ToggleSwitch";
import axios from 'axios';
import { CELERY_BACKEND_API } from '../../constants/declarations'
import ReactSelect from 'react-select';
import { ScaleLoader } from 'react-spinners';
import { Select, MenuItem } from '@mui/material';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/Delete';
import { styled } from '@mui/material/styles';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import { FormControl } from '@mui/material';
import { NODE_API_URL } from '../../constants/declarations'
// import schema from "../../schema/react-json-schema/uploadDataSchema.json";
// import RightRail from "../RightNavigation/rightRail";
// import updateSchema from "./../updateDataSchema.json";
import FilePreviewModal from "./filePreviewModal";
import FileManagerModal from "./fileManagerModal";
import useWebSocketToCheckStatus from "../common_components/webSocketForStatus";
import UserProjectsDropdown from "../common_components/UserProjectsList";

export default function UploadData({ taskStatus, setTaskStatus, taskData, setTaskData, activeTask, setActiveTask, flow }) {
    const [isFileManagerOpen, setIsFileManagerOpen] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState(taskData?.upload?.files);
    const [userProjectsList, setUserProjectsList] = useState([]);
    const [selectedUserProject, setSelectedUserProject] = useState(taskData?.upload?.project_name || '');
    const [sampleValue, setSampleValue] = useState('');
    const [pwd, setPwd] = useState('/');
    let jwtToken = getCookie('jwtToken');
    const [, setFormData] = useState({});
    const [isButtonDisabled, setIsButtonDisabled] = useState(false);
    const [enabledCheckboxes, setEnabledCheckboxes] = useState([]);
    const [tempFileList, setTempFileList] = useState([]);
    const [errorMessage, setErrorMessage] = useState('');
    const navigate = useNavigate();
    const [hoveredErrPopup, setHoveredErrPopup] = useState(false);
    const location = useLocation();
    let mode = location.state?.mode || '';
    let formInfo = location.state?.formInfo || '';
    const [currentFileList] = useState(formInfo?.files?.map(file => file.file_loc) || []);
    const [previewBoxOpen, setPreviewBoxOpen] = useState(false);
    const [fileToPreview, setFileToPreview] = useState(null);
    const [fileNames, setFileNames] = useState([]);
    const [dirNames, setDirNames] = useState([]);
    const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
    const [isAdminuser, setIsAdminuser] = useState(false);
    const [publicdataset, setPublicdataset] = useState(taskData?.upload?.makeItpublic);

    const [isLoading, setIsLoading] = useState(false);
    const [currentStatus, setCurrentStatus] = useState(null); // Set to null initially
    const [jobId, setjobId] = useState('');
    const [metadataResult, setMetadataResult] = useState({});

    let [selectedAliases, setSelectedAliases] = useState([]);
    const acceptedMultiFileNames = ['molecules.txt', 'annotation.txt', 'barcodes.tsv', 'genes.tsv', 'matrix.mtx', 'barcodes.tsv.gz', 'genes.tsv.gz', 'matrix.mtx.gz', 'features.tsv', 'features.tsv.gz'];
    const acceptedMultiFileSets = [
        ['molecules.txt', 'annotation.txt'],
        ['barcodes.tsv', 'genes.tsv', 'matrix.mtx'],
        ['barcodes.tsv.gz', 'genes.tsv.gz', 'matrix.mtx.gz'],
        ['barcodes.tsv', 'features.tsv', 'matrix.mtx'],
        ['barcodes.tsv.gz', 'features.tsv.gz', 'matrix.mtx.gz']
    ];

    // Handle the sample input change
    const handleSampleChange = (e) => {
        setSampleValue(e.target.value);
    };

    const handleProjectChange = (project_name) => {
        setSelectedUserProject(project_name);
    };

    const handleProjectFocus = () => {
        isUserAuth(jwtToken)
            .then(async (authData) => {
                try {
                    const userProjects = await fetchUserProjectsList(authData.username);
                    setUserProjectsList(userProjects);
                } catch (fetchErr) {
                    console.error("Error fetching user projects:", fetchErr);
                }
            })
            .catch((error) => console.error(error));
    }

    const handleStatusMessage = (event) => {
        try {
            const data = JSON.parse(event.data);
            if (data.task_status) {
                setCurrentStatus(data.task_status);
                if (data.task_status === "SUCCESS" || data.task_status === "FAILURE") {
                    setMetadataResult(data);
                }
            }
        } catch (error) {
            setIsLoading(false);
            console.error("Error parsing status message:", error);
        }
    };

    const { closeWebSockets } = useWebSocketToCheckStatus(jobId, handleStatusMessage, setIsLoading);

    // Custom styled components
    const ScrollableListContainer = styled('div')(({ theme }) => ({
        maxHeight: '400px', // Fixed height of the container
        overflowY: 'auto', // Enable vertical scrolling
        border: `1px solid ${theme.palette.divider}`, // Add border to distinguish the container
        borderRadius: theme.shape.borderRadius, // Use theme's border radius
        marginTop: theme.spacing(2),
    }));

    const removeFile = async (item, indexToRemove) => {
        try {

            // If successful, update the state to remove the file from the list
            setSelectedFiles(selectedFiles.filter((_, index) => index !== indexToRemove));
            setSelectedAliases(selectedAliases.filter((_, index) => index !== indexToRemove));

        } catch (error) {
            console.error("Error deleting file:", error);
            // Handle error (e.g., show error message to the user)
        }
    };

    const CustomListItem = styled(ListItem)(({ theme }) => ({
        '&:hover': {
            backgroundColor: theme.palette.action.hover,
        },
        cursor: 'pointer', // Change cursor on hover to indicate an item is clickable
    }));

    const [publicDatasetFlag, setPublicDatasetFlag] = useState(false);

    useEffect(() => {
        // Check if pwd starts with "publicDatasets" or contains "publicDatasets"
        const containsPublicDatasets = pwd.startsWith('publicDatasets') || pwd.startsWith('/publicDatasets');

        // Update the state of publicDatasets accordingly
        setPublicDatasetFlag(containsPublicDatasets);
    }, [pwd]); // Run this effect whenever pwd changes

    const handleMouseOver = () => {
        setHoveredErrPopup(true);
    };

    const handleMouseOut = () => {
        setHoveredErrPopup(false);
    };

    const handleCrossButtonClick = () => {
        setErrorMessage('');
    }
    useEffect(() => {
        isUserAuth(jwtToken)
            .then(async (authData) => {
                console.log(authData)
                if (authData.isAuth) {
                    setIsAdminuser(authData.isAdmin);

                    try {
                        const userProjects = await fetchUserProjectsList(authData.username);
                        setUserProjectsList(userProjects);
                    } catch (fetchErr) {
                        console.error("Error fetching user projects:", fetchErr);
                    }

                } else {
                    console.warn("Unauthorized - pLease login first to continue");
                    navigate("/routing");
                }
            })
            .catch((error) => console.error(error));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        const hookForUpdate = async () => {
            if (mode === 'update') {
                console.log('Mode: ' + mode);
                formInfo.makeItpublic = (formInfo.makeItpublic !== null) ? formInfo.makeItpublic : publicdataset;
                formInfo.reference = (formInfo.reference !== null) ? formInfo.reference : '';
                formInfo.summary = (formInfo.summary !== null) ? formInfo.summary : '';
                setSelectedFiles(currentFileList);
                setFormData(formInfo);
            }
        };
        hookForUpdate();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);


    useEffect(() => {
        const timeoutId = setTimeout(() => {
            setErrorMessage('');
        }, 30000);
        // Return a cleanup function to cancel the timeout when the component unmounts
        return () => clearTimeout(timeoutId);
    }, [errorMessage]);

    useEffect(() => {
        setSelectedAliases(selectedFiles.map(file => {
            const parts = file.split('/');
            return parts[parts.length - 1];
        }));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedFiles]);



    const toggleSwitchForPublicDatasets = () => {
        setPublicdataset((prevState) => !prevState)
    }

    // toggle modal window visibility
    const toggleModal = async () => {
        await setIsFileManagerOpen(!isFileManagerOpen);

        const defaultUploadValues = {
            files: [],
            final_files: {},
            displayAssayNames: false,
            assayNames: [],
            makeItpublic: false,
            authToken: '',
        };

        // Reset taskData.upload to default values
        setTaskData(prevTaskData => ({
            ...prevTaskData,
            upload: defaultUploadValues,
        }));

        if (!isFileManagerOpen) {
            setSelectedFiles([]);
            setTempFileList([]);
            fetchDirContents();
        }
    }

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


    const fetchDirContents = async (subdir) => {

        enabledCheckboxes.forEach((checkboxId) => {
            try {

                const checkbox = document.getElementById(checkboxId);
                checkbox.checked = false;
            }
            catch (e) {
                console.log('Exception: ' + e);
            }
        });


        let newDir = ''
        jwtToken = getCookie('jwtToken');

        if (subdir === "publicDatasets") {
            newDir = subdir;
            setPwd(newDir)
        } else if (pwd === "publicDatasets" && subdir === "..") {
            newDir = ""
            setPwd(newDir)
        }
        else if (subdir === '..') {
            let slashIndex = pwd.lastIndexOf('/');
            newDir = slashIndex !== -1 ? pwd.substring(0, slashIndex) : pwd;
            setPwd(newDir)
        }
        else if (subdir) {
            newDir = pwd + '/' + subdir;
            setPwd(pwd + '/' + subdir);
        }
        else
            newDir = pwd

        fetch(`${NODE_API_URL}/getDirContents?dirPath=${newDir}&authToken=${jwtToken}`)
            .then(response => {
                if (response.status === 403) {
                    throw new Error('Please log in first');
                }
                return response.json();
            })
            .catch(error => {
                setIsFileManagerOpen(false);
                if (error.message === 'Please log in first') {
                    navigate('/routing');
                } else {
                    console.error(error);
                }

            })
            .then(data => {
                setDirNames(data.Directories);
                setFileNames(data.Files);
            });

    }

    const handleAssaySelection = selectedOption => {
        setTaskData(prevTaskData => ({
            ...prevTaskData,
            upload: {
                ...prevTaskData.upload,
                selectedAssayName: (selectedOption ? selectedOption.value : null)
            },
        }));
    };

    const handleAssaySelectionSubmit = async () => {


        if (taskData.upload.selectedAssayName === '') {
            setErrorMessage('Please select the default assay to continue');
            return;
        }
        setIsLoading(true); // Start loading

        // if (taskData.upload.selectedAssayName === taskData.upload.default_assay) {
        //     setTaskStatus((prevTaskStatus) => ({
        //         ...prevTaskStatus,
        //         1: true, // Mark Task 1 as completed
        //     }));

        //     setTaskData((prevTaskData) => ({
        //         ...prevTaskData,
        //         upload: {
        //             ...prevTaskData.upload,
        //             status: 'completed',
        //         },
        //     }));

        //     setTaskData(prevTaskData => ({
        //         ...prevTaskData,
        //         upload: {
        //             ...prevTaskData.upload,
        //             final_files: {
        //                 ...prevTaskData.upload.final_files,
        //                 status: 'completed',
        //             },
        //         },
        //     }));

        //     //The current task is finished, so make the next task active
        //     setActiveTask(2);
        // } else {

        // Construct your API payload
        let payload = {
            fileDetails: taskData.upload.inputUpdatedFiles,
            userID: taskData.upload.authToken
        };

        // Include assay_name in the payload only if it is not null
        if (taskData.upload.selectedAssayName) {
            payload.assay_name = taskData.upload.selectedAssayName;
        }

        // const response = await axios.post(`${CELERY_BACKEND_API}/tools/metadata`, payload));
        // const taskInfo = response.data;
        // const jobId = taskInfo.job_id;
        // setjobId(jobId);

        // Make the API call
        axios.post(`${CELERY_BACKEND_API}/tools/metadata`, payload)
            .then(response => {
                console.log(response.data);
                let data = response.data;
                const jobId = data.job_id;
                setjobId(jobId);
                // Handle your response here
                // console.log(response.data);
                // let data = response.data;
                // setTaskData(prevTaskData => ({
                //     ...prevTaskData,
                //     upload: {
                //         ...prevTaskData.upload,
                //         final_files: {
                //             ...prevTaskData.upload.final_files,
                //             inputFiles: data.inputfile,
                //             adata_path: data.adata_path,
                //             format: data.format,
                //             default_assay: data.default_assay,
                //             cell_metadata: data.cell_metadata,
                //             cell_metadata_head: data.cell_metadata_head,
                //             obs_names: data.obs_names,
                //             nCells: data.nCells,
                //             nGenes: data.nGenes,
                //             layers: data.layers,
                //             info: data.info,
                //             adata_size: data.adata_size,
                //             embeddings: data.embeddings,
                //             status: 'completed',
                //         },
                //     },
                // }));

                // setTaskStatus((prevTaskStatus) => ({
                //     ...prevTaskStatus,
                //     1: true, // Mark Task 1 as completed
                // }));

                // //The current task is finished, so make the next task active
                // setActiveTask(2);
                // setIsLoading(false);
            })
            .catch(error => {
                console.error('There was an error with the conversion:', error);
                setIsLoading(false);
            });
        // }
    };

    useEffect(() => {
        if (currentStatus === "SUCCESS" || currentStatus === "FAILURE") {
            if (currentStatus === "SUCCESS") {
                if (metadataResult.task_result.assay_names && metadataResult.task_result.assay_names.length > 1) {
                    setTaskData(prevTaskData => ({
                        ...prevTaskData,
                        upload: {
                            ...prevTaskData.upload,
                            displayAssayNames: true,
                            assayNames: metadataResult.task_result.assay_names,
                            default_assay: metadataResult.task_result.default_assay,
                            inputUpdatedFiles: metadataResult.task_result.inputfile,
                            project_name: selectedUserProject
                        },
                    }));
                }
                else {
                    setTaskData(prevTaskData => ({
                        ...prevTaskData,
                        upload: {
                            ...prevTaskData.upload,
                            final_files: {
                                ...prevTaskData.upload.final_files,
                                inputFiles: metadataResult.task_result.inputfile,
                                adata_path: metadataResult.task_result.adata_path,
                                format: metadataResult.task_result.format,
                                default_assay: metadataResult.task_result.default_assay ? metadataResult.task_result.default_assay : undefined,
                                cell_metadata: metadataResult.task_result.cell_metadata,
                                cell_metadata_head: metadataResult.task_result.cell_metadata_head,
                                obs_names: metadataResult.task_result.obs_names,
                                nCells: metadataResult.task_result.nCells,
                                nGenes: metadataResult.task_result.nGenes,
                                layers: metadataResult.task_result.layers,
                                info: metadataResult.task_result.info,
                                adata_size: metadataResult.task_result.adata_size,
                                embeddings: metadataResult.task_result.embeddings,
                                status: 'completed'
                            },
                            project_name: selectedUserProject

                        },

                    }));

                    console.log("State Contents: " + metadataResult.task_result);
                    setTaskStatus((prevTaskStatus) => ({
                        ...prevTaskStatus,
                        1: true, // Mark Task 1 as completed
                    }));

                    //The current task is finished, so make the next task active
                    setActiveTask(2);
                    setIsButtonDisabled(true);
                    setTimeout(() => {
                        setIsButtonDisabled(false);
                    }, 5000);
                }
            }
            else if (currentStatus === "FAILURE") {
                console.error("Metadata API Call is failed.")
            }
            setIsLoading(false);
            closeWebSockets();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentStatus]);

    const handleSubmit = (event) => {

        if (taskData.upload.final_files.status !== 'completed') {
            isUserAuth(jwtToken)
                .then((authData) => {
                    if (authData.isAuth) {
                        if (selectedFiles === undefined || selectedFiles.length === 0) {
                            setErrorMessage('Select at least one file.');
                            return;
                        }
                        else if (jwtToken === undefined || jwtToken.length === 0) {
                            setErrorMessage('Please log in first.');
                            return;
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
                                const file = selectedFiles[i];
                                const lastSlashIndex = file.lastIndexOf('/');
                                const fileName = file.substring(lastSlashIndex + 1, file.length);
                                if (!acceptedMultiFileNames.includes(fileName)) {
                                    if (lastSlashIndex !== -1) {
                                        const prefix = file.substring(0, lastSlashIndex + 1);
                                        selectedFiles[i] = prefix + selectedAliases[i];
                                    } else {
                                        selectedFiles[i] = selectedAliases[i]; // No slash found, push the original string
                                    }
                                    fetch(`${NODE_API_URL}/renameFile?oldName=${file}&newName=${selectedFiles[i]}&authToken=${jwtToken}`, {
                                        method: 'POST',
                                        headers: {
                                            'Content-Type': 'application/json'
                                        },
                                    })
                                }
                            }
                        }
                        else {
                            const acceptedFormats = [".tsv", ".csv", ".txt.gz", ".txt", ".h5ad", ".h5mu", "rds", "h5seurat", "h5Seurat", "tsv.gz", "mtx.gz", "h5", "xlsx", "hdf5", "gz", "Robj", "zip", "rar", "tar", "tar.bz2", "tar.xz"];
                            if (!acceptedFormats.some(format => selectedFiles[0].endsWith(format))) {
                                setErrorMessage("The selected file is not of an accepted standard format.");
                                return;
                            }
                        }

                        // Update the state of the task in the taskData state
                        setTaskData((prevTaskData) => ({
                            ...prevTaskData,
                            upload: {
                                ...prevTaskData.upload,
                                files: selectedFiles,
                                makeItpublic: publicdataset,
                                authToken: authData.username,
                                project_name: selectedUserProject
                            },
                        }));

                        if (selectedFiles && selectedFiles.length > 0) {

                            let filesFromPublic = false;

                            // Logic to Copy files from public storage to user private storage if it is a public Dataset.
                            for (const file of selectedFiles) {

                                if (file.startsWith("publicDataset") || file.startsWith("/publicDatasets")) {
                                    filesFromPublic = true;
                                    break;
                                }
                            }

                            if (filesFromPublic) {
                                copyFilesToPrivateStorage(selectedFiles, authData.username)
                                    .then(response => {
                                        if (response.success) {
                                            console.log(response.message);
                                        } else {
                                            console.error(response.message);
                                        }
                                    })
                                    .catch(error => {
                                        console.error("Error:", error.message);
                                    });
                            }

                            if (filesFromPublic) {
                                for (let i = 0; i < selectedFiles.length; i++) {
                                    selectedFiles[i] = selectedFiles[i].replace(/^\/?publicDatasets\//, '/');
                                }
                            }

                            let updatedFiles = selectedFiles.map(file => "/usr/src/app/storage/" + authData.username + file);

                            let needAPICall = true;

                            // if(updatedFiles.length === 1) {
                            //     // If the length is one, that means it is not a dataset with combinations.
                            //     let file = updatedFiles[0];

                            //     if(file.toLowerCase().endsWith('h5ad')) {
                            //         //Add the result to taskData
                            //     // Properly update taskData using setTaskData
                            //         setTaskData(prevTaskData => ({
                            //             ...prevTaskData,
                            //             upload: {
                            //                 ...prevTaskData.upload,
                            //                 final_files: {
                            //                     ...prevTaskData.upload.final_files,
                            //                     inputFiles: updatedFiles,
                            //                     adata_path: updatedFiles[0],
                            //                     format: 'h5ad',
                            //                     status: 'completed'
                            //                 },
                            //             },
                            //         }));

                            //         setTaskStatus((prevTaskStatus) => ({
                            //             ...prevTaskStatus,
                            //             1: true, // Mark Task 1 as completed
                            //         }));

                            //         //The current task is finished, so make the next task active
                            //         setActiveTask(2);   

                            //     } else {
                            //         needAPICall = true;
                            //     }
                            // } else {
                            //     needAPICall = true;
                            // }

                            if (needAPICall) {
                                setIsLoading(true); // Start loading

                                const data = {
                                    fileDetails: updatedFiles,
                                    userID: authData.username,
                                    sample: sampleValue
                                };

                                axios.post(`${CELERY_BACKEND_API}/tools/metadata`, data)
                                    .then(function (response) {
                                        console.log(response.data);
                                        let data = response.data;
                                        const jobId = data.job_id;
                                        setjobId(jobId);
                                        // if (data.format === 'h5seurat') {
                                        //     if (data.assay_names && data.assay_names.length > 1) {
                                        //         setTaskData(prevTaskData => ({
                                        //             ...prevTaskData,
                                        //             upload: {
                                        //                 ...prevTaskData.upload,
                                        //                 displayAssayNames: true,
                                        //                 assayNames: data.assay_names,
                                        //                 default_assay: data.default_assay,
                                        //                 // cell_metadata: data.cell_metadata,
                                        //                 // cell_metadata_head: data.cell_metadata_head,
                                        //                 // obs_names: data.obs_names,
                                        //                 // nCells: data.nCells,
                                        //                 // nGenes: data.nGenes,
                                        //                 // layers: data.layers,
                                        //                 // info: data.info,
                                        //                 // adata_size: data.adata_size,
                                        //                 // embeddings: data.embeddings,
                                        //             },
                                        //         }));
                                        //         return;
                                        //     } else {
                                        //         setTaskData(prevTaskData => ({
                                        //             ...prevTaskData,
                                        //             upload: {
                                        //                 ...prevTaskData.upload,
                                        //                 final_files: {
                                        //                     ...prevTaskData.upload.final_files,
                                        //                     inputFiles: data.inputfile,
                                        //                     adata_path: data.adata_path,
                                        //                     format: data.format,
                                        //                     default_assay: data.default_assay,
                                        //                     cell_metadata: data.cell_metadata,
                                        //                     cell_metadata_head: data.cell_metadata_head,
                                        //                     obs_names: data.obs_names,
                                        //                     nCells: data.nCells,
                                        //                     nGenes: data.nGenes,
                                        //                     layers: data.layers,
                                        //                     info: data.info,
                                        //                     adata_size: data.adata_size,
                                        //                     embeddings: data.embeddings,
                                        //                     status: 'completed'
                                        //                 },
                                        //             },
                                        //         }));
                                        //     }
                                        // } else {
                                        //     //set the task Data and make the task active
                                        //     setTaskData(prevTaskData => ({
                                        //         ...prevTaskData,
                                        //         upload: {
                                        //             ...prevTaskData.upload,
                                        //             final_files: {
                                        //                 ...prevTaskData.upload.final_files,
                                        //                 inputFiles: data.inputfile,
                                        //                 adata_path: data.adata_path,
                                        //                 format: data.format,
                                        //                 cell_metadata: data.cell_metadata,
                                        //                 cell_metadata_head: data.cell_metadata_head,
                                        //                 obs_names: data.obs_names,
                                        //                 nCells: data.nCells,
                                        //                 nGenes: data.nGenes,
                                        //                 layers: data.layers,
                                        //                 info: data.info,
                                        //                 adata_size: data.adata_size,
                                        //                 embeddings: data.embeddings,
                                        //                 status: 'completed'
                                        //             },
                                        //         },
                                        //     }));
                                        // }

                                        // setTaskStatus((prevTaskStatus) => ({
                                        //     ...prevTaskStatus,
                                        //     1: true, // Mark Task 1 as completed
                                        // }));

                                        // //The current task is finished, so make the next task active
                                        // setActiveTask(2);

                                        // setIsButtonDisabled(true);
                                        // setTimeout(() => {
                                        //     setIsButtonDisabled(false);
                                        // }, 5000);

                                        // setIsLoading(false);
                                    })
                                    .catch(function (error) {
                                        console.log(error);
                                        setIsLoading(false);
                                    });
                            }
                        }
                        // formData['makeItpublic'] = publicdataset
                        // formData['authToken'] = jwtToken;
                        // formData['files'] = selectedFiles;

                        // if (mode === 'update') {
                        //     formData.currentFileList = currentFileList;
                        //     fetch(`${NODE_API_URL}/updateDataset`, {
                        //         method: 'PUT',
                        //         headers: {
                        //             'Content-Type': 'application/json'
                        //         },
                        //         body: JSON.stringify(formData),
                        //     })
                        //         .then(response => {
                        //             if (response.status === 200) {
                        //                 navigate('/dashboard', { state: { message: 'Dataset updated successfully.', title: formData['title'] } });
                        //             }
                        //             else {
                        //                 console.log('Error updating dataset:', response);
                        //             }
                        //         })
                        //         .catch(error => {
                        //             setErrorMessage('Error updating dataset.');
                        //             console.error('Error updating dataset:', error);
                        //         });
                        //     return;
                        // }
                        // fetch(`${NODE_API_URL}/createDataset`, {
                        //     method: 'POST',
                        //     headers: {
                        //         'Content-Type': 'application/json'
                        //     },
                        //     body: JSON.stringify(formData),
                        // })
                        //     .then(response => {
                        //         if (response.status === 201) {
                        //             navigate('/dashboard', { state: { message: 'Dataset created successfully.', title: formData['title']  } });
                        //         }
                        //         else if (response.status === 400) {
                        //             setErrorMessage(`Dataset '${formData.title}' already exists. Choose a different name.`);
                        //         }
                        //         else {
                        //             console.log('Error creating dataset:', response);
                        //         }
                        //     })
                        //     .catch(error => {
                        //         setErrorMessage('Error creating dataset.');
                        //         console.error('Error creating dataset:', error);
                        //     });

                    } else {
                        console.warn("Unauthorized - pLease login first to continue");
                        navigate("/routing");
                    }
                })
                .catch((error) => console.error(error));
        } else {
            setTaskStatus((prevTaskStatus) => ({
                ...prevTaskStatus,
                1: true, // Mark Task 1 as completed
            }));

            //The current task is finished, so make the next task active
            setActiveTask(2);
        }
    };

    if (jwtToken === '' || jwtToken === undefined) {
        navigate("/routing");
    }

    else return (
        <div className="uploadMyData-container">
            <div className="uploadmydata">
                {(errorMessage !== '') && (
                    <div className='message-box' style={{ backgroundColor: 'lightpink', zIndex: 9999 }}>
                        <div style={{ textAlign: 'center' }}>
                            <p>{errorMessage}</p>
                            <div style={{ position: "absolute", right: "12px", top: "20px", cursor: "pointer" }}>
                                <img src={hoveredErrPopup ? close_icon_hover : close_icon} alt="close-icon" onMouseOver={handleMouseOver} onMouseOut={handleMouseOut} onClick={handleCrossButtonClick} />
                            </div>
                        </div>
                    </div>)}
                <div>
                    <h1 style={{ textAlign: "left" }}><span>{(mode === 'update' ? 'Update Dataset' : "Upload Dataset")}</span></h1>
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
                    {previewBoxOpen && <FilePreviewModal selectedFile={fileToPreview} setPreviewBoxOpen={setPreviewBoxOpen} jwtToken={jwtToken} forResultFile={false} />}
                    {isFileManagerOpen && <FileManagerModal setFileToPreview={setFileToPreview} tempFileList={tempFileList} setEnabledCheckboxes={setEnabledCheckboxes} fileNames={fileNames} dirNames={dirNames} jwtToken={jwtToken} fetchDirContents={fetchDirContents} pwd={pwd} setPwd={setPwd} setPreviewBoxOpen={setPreviewBoxOpen} selectedFiles={selectedFiles} setSelectedFiles={setSelectedFiles} setErrorMessage={setErrorMessage} setTempFileList={setTempFileList} enabledCheckboxes={enabledCheckboxes} toggleModal={toggleModal} isAdminuser={isAdminuser} publicDatasetFlag={publicDatasetFlag} taskData={taskData} />}
                    <div>        <div>
                        <div id="upload-data-div">
                            <div className="info-icon" onClick={() => { setIsInfoModalOpen(true); }}>
                                <FontAwesomeIcon icon={faInfoCircle} size="1.2x" />
                            </div>
                            <b>Choose your files *</b> <br />
                            {selectedFiles && selectedFiles.length > 0 &&
                                <div id="files-selected">
                                    <ScrollableListContainer>
                                        <List dense>
                                            {selectedFiles.length > 1 ? (
                                                <>
                                                    {selectedFiles.map((item, index) => {
                                                        const itemName = item.substring(item.lastIndexOf('/') + 1);
                                                        const showDropdown = !acceptedMultiFileNames.includes(itemName);
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
                                    {selectedFiles && selectedFiles.length > 1 &&
                                        <div style={{ color: 'red' }}>
                                            Notice: Files will be renamed to standard names of their corresponding type.
                                        </div>
                                    }
                                </div>
                            }
                            <div className="folder-button">
                                <button type="button" onClick={toggleModal} style={{ fontSize: "1em", padding: "10px", borderRadius: "5px" }}>
                                    <FontAwesomeIcon icon={faFolderOpen} />
                                </button>
                            </div>
                        </div>

                        <div className="publish-dataset-div">
                            <React.Fragment>
                                <ToggleSwitch label="Do you want to publish this dataset as public dataset ?" toggleSwitchForPublicDatasets={toggleSwitchForPublicDatasets} defaultValue={taskData.upload.makeItpublic} />
                            </React.Fragment>
                        </div>

                        <br />
                        {/* <h2 style={{ textAlign: "left" }}><span>Parameters</span></h2>


                        <Form
                            schema={(mode === 'update') ? updateSchema : schema}
                            formData={formData}
                            onChange={({ formData }) => setFormData(formData)}
                            onSubmit={handleSubmit}
                            SubmitButton={SubmitButton}
                        /> */}

                        <div>
                            <Box
                                component="form"
                                sx={{ '& > :not(style)': { m: 1, width: '100%', maxWidth: '100%' } }}
                                noValidate
                                autoComplete="off"
                            >
                                <TextField id="root_sample" fullWidth label="Sample (Optional)" variant="outlined" value={sampleValue} onChange={handleSampleChange} helperText="Please add your sample name here if needed. This field will also be used for batch integration." />

                                <br />
                                <UserProjectsDropdown userProjectsList={userProjectsList} onProjectChange={handleProjectChange} handleFocus={handleProjectFocus} selectedUserProject={selectedUserProject} />
                                <br />
                                <Link to="/projectAdminPanel" target="_blank">
                                    <Button variant="outlined" size="medium">Manage Projects</Button>
                                </Link>
                                <br />
                            </Box>

                        </div>

                        {
                            isLoading ? (

                                <div className="spinner-container">
                                    <ScaleLoader color="#36d7b7" loading={isLoading} />
                                </div>
                            ) : (
                                taskData.upload.displayAssayNames && (
                                    <div>
                                        <h3>Default Assay: {taskData.upload.default_assay}</h3>
                                        <p>Do you want to change the default assay?</p>
                                        <ReactSelect
                                            id="assaySelection"
                                            placeholder="Select an Assay"
                                            options={taskData.upload.assayNames.map(name => ({ value: name, label: name }))}
                                            onChange={handleAssaySelection}
                                        />
                                        <div className='next-upon-success'>
                                            <button type="submit" className="btn btn-info button" disabled={isButtonDisabled} onClick={handleAssaySelectionSubmit}>Next</button>
                                        </div>
                                    </div>
                                )
                            )
                        }


                        {!taskData.upload.displayAssayNames && (
                            <div className='next-upon-success'>
                                <button type="submit" className="btn btn-info button" disabled={isButtonDisabled} onClick={handleSubmit}>Next</button>
                            </div>
                        )}

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

                    </div></div>
                </div >
            </div>
        </div>
    )
}
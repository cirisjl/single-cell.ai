import React, { useState, useEffect } from 'react';
import {
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import { getCookie, isUserAuth } from '../../utils/utilFunctions';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { NavLink } from "react-router-dom";
import close_icon from '../../assets/close_icon_u86.svg';
import close_icon_hover from '../../assets/close_icon_u86_mouseOver.svg';
import styled from 'styled-components';
import { FLASK_BACKEND_API, NODE_API_URL } from '../../constants/declarations'


export function Preview(props) {

  const navigate = useNavigate();
  const [htmlContent, setHtmlContent] = useState('');
  const [loadedPanels, setLoadedPanels] = useState([]);
  const [, setExpandedPanels] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadedHtmlContent, setLoadedHtmlContent] = useState({});
  let jwtToken = getCookie('jwtToken');
  const [datasets, setDatasets] = useState([]);
  const [message, setMessage] = useState(props.message);
  const [hasMessage, setHasMessage] = useState(message !== '' && message !== undefined);
  const [datasetToDelete, setDatasetToDelete] = useState('');
  const [isDeleteConfBoxOpen, setIsDeleteConfBoxOpen] = useState(false);
  const [deleteToggle, setDeleteToggle] = useState(false);

  const [hovered, setHovered] = useState(false);
  const MyDeleteIcon = styled(DeleteIcon)`color: #888;&:hover{ color: #555; }&:active { color: #333; }`;
  const MyEditIcon = styled(EditIcon)`color: #888;&:hover{ color: #555; }&:active { color: #333; }`;

  const handleMouseOver = () => {
    setHovered(true);
  };

  const handleMouseOut = () => {
    setHovered(false);
  };

  const handleCrossButtonClick = () => {
    setDatasetToDelete('');
    setIsDeleteConfBoxOpen(false);
  }

  const handleDeleteConfirmClick = async (event) => {
    if (jwtToken) {
      const deleteDataset = async () => {
        await axios.delete(NODE_API_URL + `/deleteDataset?authToken=${jwtToken}&dataset=${datasetToDelete}`);
        setMessage('Dataset deleted successfully.');
      };
      await deleteDataset();
      setHasMessage(true);
      setDeleteToggle(!deleteToggle);
    } else {
      navigate('/routing');
    }
    setIsDeleteConfBoxOpen(false);
  }

  useEffect(() => {
    setIsDeleteConfBoxOpen(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [datasetToDelete])

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setMessage('');
      setHasMessage(false);
    }, 5000);
    // Return a cleanup function to cancel the timeout when the component unmounts
    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [message]);

  const handlePanelExpanded = (path, files) => {
    if (!loadedPanels.includes(path)) {
      setIsLoading(true);

      // Check if the htmlContent for this path has already been loaded
      if (loadedHtmlContent[path]) {
        // If it has, set the htmlContent from state and expand the panel
        setHtmlContent(loadedHtmlContent[path]);
        setExpandedPanels(prev => [...prev, { path, expanded: true }]);
        setIsLoading(false);
      } else {
        // If it hasn't, make a call to the Flask API to get the HTML content

        // If user is not logged In - navigate to login page
        if (jwtToken === null || jwtToken === undefined || jwtToken === '') {
          navigate("/routing");
        }

        // Else verify the authenticity of the user
        isUserAuth(jwtToken)
          .then((authData) => {
            if (authData.isAuth) {
              fetch(FLASK_BACKEND_API + '/preview/dataset', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ path: path, files: files, username: authData.username }),
              })
                .then(response => response.text())
                .then(data => {
                  setHtmlContent(data);
                  setLoadedHtmlContent(prev => ({ ...prev, [path]: data }));
                  setIsLoading(false);
                  setExpandedPanels(prev => [...prev, { path, expanded: true }]);
                });
            } else {
              console.warn("Unauthorized - pLease login first to continue");
              navigate("/routing");
            }
          })
          .catch((error) => console.error(error));
      }
      setLoadedPanels(prev => [...prev, path]);
    } else {
      setExpandedPanels(prev => prev.map(p => p.path === path ? { ...p, expanded: !p.expanded } : p));
    }
  };

  useEffect(() => {
    if (jwtToken) {
      const fetchData = async () => {
        const response = await axios.get(NODE_API_URL + "/preview/datasets?authToken=" + jwtToken);
        setDatasets(Object.values(response.data));
      };
      fetchData();
    } else {
      navigate("/routing");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jwtToken, navigate, deleteToggle]);

  return (
    <div className='preview-dataset-container'>
      {hasMessage && (
        <div className='message-box' style={{ backgroundColor: '#bdf0c0' }}>
          <div style={{ textAlign: 'center' }}>
            <p>{message}</p>
          </div>
        </div>)}
      {isDeleteConfBoxOpen && datasetToDelete !== '' && (
        <div className='login-container comn-container-auth'>
          <div className='clear-icon'>
            <img src={hovered ? close_icon_hover : close_icon} alt="close-icon" onMouseOver={handleMouseOver} onMouseOut={handleMouseOut} onClick={handleCrossButtonClick} />
          </div>
          <div className='inner-container-auth'>
            <p>Are you sure you want to delete this dataset? <br /><br /> <NavLink className="span-class-link" onClick={handleDeleteConfirmClick}>Yes</NavLink>&nbsp;&nbsp;<NavLink className="span-class-link" onClick={handleCrossButtonClick}>No</NavLink></p>
          </div>
        </div>
      )}
      {datasets.length === 0 ? (<h3>Sorry, there are no datasets available to preview</h3>) : (
        datasets.map(dataset => (
          <div key={dataset.id}>
            <Accordion key={dataset.id} onChange={() => handlePanelExpanded(dataset.direc, dataset.files)}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls="panel-content" id="panel-header">
                <div className="panel-summary">
                  <div className="panel-icons">
                    <MyEditIcon onClick={(event) => {
                      event.stopPropagation();
                      navigate('/mydata/update-dataset', { state: { formInfo: dataset, mode: 'update' } });
                    }} />
                    <MyDeleteIcon onClick={(event) => {
                      event.stopPropagation();
                      setDatasetToDelete(dataset.title);
                    }} />
                  </div>
                  <h3>Title: {dataset.title}</h3>
                  <p>Reference: {dataset.reference}</p>
                  <p>Summary: {dataset.summary}</p>
                  <p>ParentDirec: {dataset.direc}</p>
                  <p>Files: </p>
                  <ul>
                    {dataset.files.map(file => (
                      <li key={file.file_id}>{file.file_loc}</li>
                    ))}
                  </ul>
                </div>
              </AccordionSummary>
              <AccordionDetails>
                {isLoading ? (
                  <CircularProgress />
                ) : (
                  <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
                )}
              </AccordionDetails>
            </Accordion>
          </div>
        ))
      )}
    </div>
  )
};

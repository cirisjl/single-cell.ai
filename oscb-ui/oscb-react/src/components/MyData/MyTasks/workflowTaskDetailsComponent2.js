import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import useWebSocket from './useWebSocket'; // Custom hook for WebSocket
import {
  Container, Typography, Chip, Box, CircularProgress, Paper, Grid, TextField, Button,
  Card, CardContent, Link, CardHeader
} from '@mui/material';
import { green, red, yellow } from '@mui/material/colors';
import RightRail from '../../RightNavigation/rightRail';
import LogComponent from '../../common_components/liveLogs';
import axios from 'axios';
import { Octokit } from "@octokit/rest";
import AlertMessageComponent from '../../publishDatasets/components/alertMessageComponent';
import { ScaleLoader } from 'react-spinners';
import FormControl from '@mui/material/FormControl';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import ReactPlotly from '../../publishDatasets/components/reactPlotly';
import { getCookie, plotUmapObs, gunzipDict } from '../../../utils/utilFunctions';
import { faAngleDown, faAngleRight } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Descriptions } from 'antd';
import { styled } from '@mui/material/styles';
import ArrowForwardIosSharpIcon from '@mui/icons-material/ArrowForwardIosSharp';
import MuiAccordion from '@mui/material/Accordion';
import MuiAccordionSummary from '@mui/material/AccordionSummary';
import MuiAccordionDetails from '@mui/material/AccordionDetails';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';


//GitImports
import { CELERY_BACKEND_API, NODE_API_URL, WEB_SOCKET_URL, owner, repo } from '../../../constants/declarations';
import { Select, MenuItem, InputLabel } from '@mui/material';
import TaskImageGallery from './taskImageGallery';


// Initialize Octokit with your GitHub personal access token
const octokit = new Octokit({ auth: process.env.REACT_APP_TOKEN });

let jwtToken = getCookie('jwtToken');


const Accordion = styled((props) => (
  <MuiAccordion disableGutters elevation={0} square {...props} />
))(({ theme }) => ({
  border: `1px solid ${theme.palette.divider}`,
  '&:not(:last-child)': {
    borderBottom: 0,
  },
  '&::before': {
    display: 'none',
  },
}));

const AccordionSummary = styled((props) => (
  <MuiAccordionSummary
    expandIcon={<ArrowForwardIosSharpIcon sx={{ fontSize: '0.9rem' }} />}
    {...props}
  />
))(({ theme }) => ({
  backgroundColor: 'rgba(0, 0, 0, .03)',
  flexDirection: 'row-reverse',
  '& .MuiAccordionSummary-expandIconWrapper.Mui-expanded': {
    transform: 'rotate(90deg)',
  },
  '& .MuiAccordionSummary-content': {
    marginLeft: theme.spacing(1),
  },
  ...theme.applyStyles('dark', {
    backgroundColor: 'rgba(255, 255, 255, .05)',
  }),
}));

const AccordionDetails = styled(MuiAccordionDetails)(({ theme }) => ({
  padding: theme.spacing(2),
  borderTop: '1px solid rgba(0, 0, 0, .125)',
}));

function StatusChip({ status }) {
  const getStatusColor = () => {
    switch (status?.toLowerCase()) { // Ensure status is defined
      case 'success': return green[500];
      case 'failure': return red[500];
      case 'started': return yellow[700];
      default: return yellow[700];
    }
  };

  return status ? (
    <Chip label={status.toUpperCase()} style={{ backgroundColor: getStatusColor(), color: '#fff' }} />
  ) : (
    <Chip label="In Progress" style={{ backgroundColor: yellow[700], color: '#fff' }} />
  );
}


function getFileNameFromURL(fileUrl) {
  if (fileUrl) {
    try {
      const filename = fileUrl.substring(fileUrl.lastIndexOf('/') + 1);
      return filename;
    }
    catch (e) {
      console.error(e);
    }
  } else {
    return '';
  }
};


function downloadFile(fileUrl) {
  const apiUrl = `${NODE_API_URL}/download`;
  const pwd = "jobResults";

  if (fileUrl) {
    fetch(`${apiUrl}?fileUrl=${fileUrl}&authToken=${jwtToken}&pwd=${pwd}`)
      .then(response => {
        return response.blob();
      })
      .then(blob => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        const filename = fileUrl.substring(fileUrl.lastIndexOf('/') + 1);
        link.href = url;
        link.download = filename;

        document.body.appendChild(link);
        link.click();
        // Remove the link from the DOM
        // document.body.removeChild(link);
      })
      .catch(error => {
        console.error('Error downloading file:', error);
      });
  }
}


function WorkflowTaskDetailsComponent() {
  const location = useLocation();
  const { job_id, methodMap, datasetURL, description, process, output, results, status } = location.state || {};
  const [taskStatus, setTaskStatus] = useState(null); // Set to null initially
  const [taskOutput, setTaskOutput] = useState(null); // Set to null initially
  const [taskPPStatus, setTaskPPStatus] = useState(null); // Set to null initially
  const [taskPPOutput, setTaskPPOutput] = useState(null); // Set to null initially
  const [liveLogs, setLiveLogs] = useState('');
  const [loading, setLoading] = useState(true);
  const [toolResultsFromMongo, setToolResultsFromMongo] = useState([]);
  const [uName, setUName] = useState(null);
  const [uIat, setUIat] = useState(null);
  const [taskResult, setTaskResult] = useState("");
  const [message, setMessage] = useState('');
  const [hasMessage, setHasMessage] = useState(message !== '' && message !== undefined);
  const [isError, setIsError] = useState(false);
  const [plotDimension, setPlotDimension] = useState('2D');
  const [tsnePlotDimension, setTsnePlotDimension] = useState('2D');
  const [tsneClusteringPlotType, setTsneClusteringPlotType] = useState('');
  const [tsnePlotData, setTsnePlotData] = useState(null); // State to store the fetched plot data
  const [atacPlotDimension, setAtacPlotDimension] = useState('2D');
  const [clusteringAtacPlotType, setAtacClusteringPlotType] = useState('');
  const [atacPlotData, setAtacPlotData] = useState(null); // State to store the fetched plot data

  const [userComment, setUserComment] = useState(''); // State for user comment
  const [isSaving, setIsSaving] = useState(false); // State to indicate save operation
  const [isSent, setIsSent] = useState(false); // State to disable button after success
  const [commentSuccessMessage, setCommentSuccessMessage] = useState('');
  const [showErrorLog, setShowErrorLog] = useState(true); // State to show/hide the error log card
  let plotLoaded = false;
  const [clusteringPlotType, setClusteringPlotType] = useState('');
  const [plotData, setPlotData] = useState(null); // State to store the fetched plot data
  const [loadingPlot, setLoadingPlot] = useState(false); // State to handle loading spinner
  const [expandLoading, setExpandLoading] = useState({}); // Store loading states for each accordion
  const [details, setDetails] = useState({}); // Store fetched details
  const [ppJobId, setppJobId] = useState(null);

  const [sectionsVisibility, setSectionsVisibility] = useState({
    preprocessResults: true
  });

  const [expanded, setExpanded] = useState(false);

  const toggleSectionVisibility = (section) => {
    setSectionsVisibility((prevVisibility) => ({
      ...prevVisibility,
      [section]: !prevVisibility[section],
    }));
  };

  const fetchPlotData = async (plotType, cell_metadata, twoDArray, threeDArray, plotName) => {
    setLoadingPlot(true); // Set loading to true before making the API call

    const selectedCellType = null

    try {
      let plot = null;
      let plot_3d = null;

      if (twoDArray) {
        plot = plotUmapObs(cell_metadata, twoDArray, plotType, [], selectedCellType, 2, plotName);
      }
      if (threeDArray) {
        plot_3d = plotUmapObs(cell_metadata, threeDArray, plotType, [], selectedCellType, 3, plotName);
      }

      // If the plotName is 'tsne', we can handle it here if needed
      if (plotName === 'tsne') {
        if (plot || plot_3d) {
          // If tsne plots are available, we can set them in the plotData state
          setTsnePlotData({ tsne_plot: plot, tsne_plot_3d: plot_3d });
        }
      } else if (plotName === 'umap') {
        if (plot || plot_3d) {
          // If umap plots are available, we can set them in the plotData state
          setPlotData({ umap_plot: plot, umap_plot_3d: plot_3d });
        }
      } else if (plotName === 'atac_umap') {
        if (plot || plot_3d) {
          // If ATAC umap plots are available, we can set them in the plotData state
          setAtacPlotData({ atac_umap_plot: plot, atac_umap_plot_3d: plot_3d });
        }
      }
    } catch (error) {
      console.error('Error fetching plot data:', error);
      alert(`Error fetching plot data: ${error}`);
    } finally {
      setLoadingPlot(false);
    }
  };

  // A utility function to safely sanitize logs before using dangerouslySetInnerHTML
  const createMarkup = (logs) => {
    return { __html: logs };
  };

  const cardStyle = {
    height: '100%', // Makes the cards take the full height of their container
    display: 'flex', // Allows child items to be flex items
    flexDirection: 'column', // Stacks child items vertically
  };

  const cardContentStyle = {
    flexGrow: 1, // Allows the content to expand and fill the space
    overflow: 'auto' // Adds scroll for overflow content
  };

  const fetchProcessResults = async (processIds, record_type) => {
    if (!processIds.length) return;
    // closeWebSockets(); // Close existing WebSocket connections before fetching new data

    try {
      const response = await axios.post(`${CELERY_BACKEND_API}/getPreProcessResultsMain`, { process_ids: processIds, record_type: record_type });
      console.log('Process Results:', response.data);
      setToolResultsFromMongo(response.data);
      setLoading(false);
    } catch (error) {
      console.error('There was a problem with the axios operation:', error.response ? error.response.data : error.message);
      setLoading(false);
      setHasMessage(true);
      setMessage("Failed to retrieve pre processed results from MongoDB");
      setIsError(true);
    }
  };

  const handleChange = (processId) => async (event, isExpanded) => {
    // Update the expanded accordion state: expanded if open, false if collapsed
    setExpanded(isExpanded ? processId : false);

    // Fetch data only when accordion is expanded and data is not already fetched
    if (isExpanded && !details[processId]) {
      // Set loading state for the specific accordion
      setExpandLoading((prevLoading) => ({ ...prevLoading, [processId]: true }));

      try {
        // // Make the API call to fetch the pre-process result for the given process ID
        // const response = await fetch(`${CELERY_BACKEND_API}/getPreProcessResults`, {
        //   method: 'POST',
        //   headers: {
        //     'Content-Type': 'application/json',
        //   },
        //   body: JSON.stringify({
        //     process_ids: [processId], // Pass the processId dynamically
        //   }),
        // });

        // // Check if the response is OK (status code 200-299)
        // if (!response.ok) {
        //   const errorMessage = await response.json();
        //   console.error('Error:', errorMessage.error);
        //   alert(`Error: ${errorMessage.error}`);
        //   return;
        // }

        const response = await axios.post(`${CELERY_BACKEND_API}/getPreProcessResults`, { process_ids: [processId] });
        const taskInfo = response.data;
        const jobId = taskInfo.job_id;
        setppJobId(jobId);
      } catch (error) {
        console.error('There was a problem with the axios operation:', error.response ? error.response.data : error.message);
        setLoading(false);
        setHasMessage(true);
        setMessage("Failed to retrieve pre-processed results from MongoDB.");
        setIsError(true);
      }
    }
  };

  // WebSocket listener
  useEffect(() => {
    if (taskPPStatus === "SUCCESS") {
      const preProcessResult = taskPPOutput[0]
      // console.log(preProcessResult);
      const processId = preProcessResult.process_id;

      // Only set plotData if at least one plot exists
      if (preProcessResult.umap_plot || preProcessResult.umap_plot_3d) {
        setPlotData({ umap_plot: preProcessResult.umap_plot, umap_plot_3d: preProcessResult.umap_plot_3d })
      } else {
        setPlotData(null);
      }

      if (preProcessResult.atac_umap_plot || preProcessResult.atac_umap_plot_3d) {
        setAtacPlotData({ atac_umap_plot: preProcessResult.atac_umap_plot, atac_umap_plot_3d: preProcessResult.atac_umap_plot_3d })
      } else {
        setAtacPlotData(null);
      }

      // Only set plotData if at least one plot exists
      if (preProcessResult.tsne_plot || preProcessResult.tsne_plot_3d) {
        setTsnePlotData({ tsne_plot: preProcessResult.tsne_plot, tsne_plot_3d: preProcessResult.tsne_plot_3d })
      } else {
        setTsnePlotData(null);
      }

      // Store the fetched data for the current process_id
      setDetails((prevDetails) => ({
        ...prevDetails,
        [processId]: preProcessResult, // Store fetched data for the corresponding process_id
      }));

      setExpandLoading((prevLoading) => ({ ...prevLoading, [processId]: false }));
      closeWebSockets();
    }
    else if (taskPPStatus === "FAILURE") {
      setMessage("Loading pre-process results is Failed");
      setHasMessage(true);
      setIsError(true);
      setExpandLoading((prevLoading) => ({ ...prevLoading, [details.processId]: false }));
      closeWebSockets();
    }
  }, [taskPPStatus]);

  const handlePPStatusMessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      if (data.task_status) {
        setTaskPPStatus(data.task_status);
        if (data.task_status?.toLowerCase() === "success" || data.task_status?.toLowerCase() === "failure") {
          if (data.task_status?.toLowerCase() === "success") {
            if (data.task_result) {
              setTaskPPOutput(data.task_result);
            }
          } else {
            setLoading(false);
          }
        }
      }
    } catch (error) {
      setLoading(false);
      console.error("Error parsing status message:", error);
    }
  };

  const handleStatusMessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      if (status?.toLowerCase() === "success" || status?.toLowerCase() === "failure") {
        setTaskStatus(status);
        if (status?.toLowerCase() === "success" && !plotLoaded) {
          // if (results.process_ids && (process === "Quality Control" || process === "Normalization" || process === "Visualization")) {
          if (results.process_ids) {
            console.log("results: ", results)
            setTaskResult(results);
            fetchProcessResults(results.process_ids, "table");
            plotLoaded = true;
          } else {
            setLoading(false);
          }
        }
      } else if (data.task_status) {
        setTaskStatus(data.task_status);
        if (data.task_status?.toLowerCase() === "success" || data.task_status?.toLowerCase() === "failure") {
          if (data.task_status?.toLowerCase() === "success" && !plotLoaded) {
            if (data.task_result.process_ids) {
              console.log("data.task_result: ", data.task_result)
              fetchProcessResults(data.task_result.process_ids, "table");
              plotLoaded = true;
            } else {
              setLoading(false);
            }

            if (data.task_result.output) {
              setTaskOutput(data.task_result.output);
              setTaskResult(data.task_result);
            }
          } else {
            setLoading(false);
          }
        }
      }
    } catch (error) {
      setLoading(false);
      console.error("Error parsing status message:", error);
    }
  };

  useEffect(() => {
    async function fetchFiles() {
      if (status?.toLowerCase() === "success" && output) {
        setTaskOutput(output);
        setTaskResult(results);
      }
      else {
        try {
          const taskInfoResponse = await fetch(`${CELERY_BACKEND_API}/task/${job_id}`);
          const taskInfoData = await taskInfoResponse.json();
          // console.log("taskInfoData", taskInfoData);
          setTaskResult(taskInfoData.task_result);
          // console.log("taskInfoData.task_result", taskInfoData.task_result);
          // if (taskInfoData.task_result.output) {
          //   setTaskOutput(taskInfoData.task_result.output);
          // }

          if (jwtToken) {
            fetch(NODE_API_URL + "/protected", { //to get username, id
              method: 'GET',
              credentials: 'include',
              headers: { 'Authorization': `Bearer ${jwtToken}` },
            })
              .then((response) => response.json())
              .then((data) => {

                if (data.authData !== null) {
                  // console.log("userdata: ", data.authData);
                  setUName(data.authData.username);
                  setUIat(data.authData.iat);
                }
              })
              .catch((error) => {
                console.error(error);
              })
          }
        } catch (error) {
          console.error('Error fetching task status:', error);
        }
      }
    }
    fetchFiles();
  }, [job_id]);


  const handleLogMessage = (event) => {
    setLiveLogs((prevLogs) => prevLogs + event.data);
    // Auto-scroll to the bottom of the logs
    const logsElement = document.getElementById("_live_logs");
    if (logsElement) {
      logsElement.scrollTop = logsElement.scrollHeight;
    }
  };

  const saveErrorLogData = async () => {
    try {
      const response = await axios.post(`${NODE_API_URL}/errorlogdata`, {
        name: uName,
        id: uIat,
        taskResult: taskResult,
        taskStatus: taskStatus,
        job_id: job_id,
        userComments: userComment
      });

      if (response.status === 200) {
        setCommentSuccessMessage('Feedback sent successfully.');
        setIsSaving(false);
        setIsSent(true);
        setShowErrorLog(false); // Hide the error log card
      } else {
        setCommentSuccessMessage('Failed to send feedback.');
        setIsSaving(false);
      }
    } catch (error) {
      console.error('Error saving comment:', error);
      setCommentSuccessMessage('Failed to send feedback.');
      setIsSaving(false);
    }
  };

  const createGitHubIssue = async () => {
    try {
      const response = await octokit.issues.create({
        //owner: 'SAYEERA', // Replace with your GitHub username
        //repo: 'issues-list', // Replace with your repository name
        owner: owner,
        repo: repo,
        title: `Issue for Job ID: ${job_id}`,
        body: `
            User Name:${uName}
            User ID: ${uIat}
            Job Result: ${taskResult}
            Job Status: ${taskStatus}
            Job ID: ${job_id}
            User Comments: ${userComment}
        `
      });
      console.log("Git response: ", response);
      if (response.status === 201) {
        console.log('GitHub issue created successfully:', response.data.html_url);
      } else {
        console.error('Failed to create GitHub issue:', response);
      }
    } catch (error) {
      console.error('Error creating GitHub issue:', error);
    }
  };

  const handleSaveComment = async () => {
    setIsSaving(true);
    setIsSent(false);
    await saveErrorLogData();
    await createGitHubIssue();
  };

  // Use the WebSocket hook
  // const { closeWebSockets } = useWebSocket(job_id, handleStatusMessage, handleLogMessage);
  useWebSocket(job_id, handleStatusMessage, handleLogMessage);

  const { closeWebSockets } = useWebSocket(ppJobId, handlePPStatusMessage);

  return (

    <div className="task-details-container eighty-twenty-grid">

      {hasMessage && <AlertMessageComponent message={message} setHasMessage={setHasMessage} setMessage={setMessage} isError={isError} />}

      <div className="main-content">
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
          <Box display="flex" justifyContent="center">
            <Typography variant="h4" gutterBottom component="div">
              Job Details for Job ID: {job_id || 'Loading ...'}
            </Typography>
          </Box>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card raised sx={cardStyle}>
                <CardHeader title="Dataset Information" />
                <CardContent sx={cardContentStyle}>
                  <Typography variant="subtitle1"><strong>Job Description:</strong></Typography>
                  <Typography variant="body1" gutterBottom>{description || 'Not available'}</Typography>
                  <Typography variant="subtitle1"><strong>Dataset:</strong></Typography>
                  <Typography variant="body1" gutterBottom>
                    { /* <Button onClick={downloadFile(datasetURL)}>
                      {getFileNameFromURL(datasetURL) || 'Not available'}
                    </Button> */ }
                    {Array.isArray(datasetURL) ?
                      (datasetURL.map((inpput, index) => (
                        <a href="#" download onClick={(e) => { e.preventDefault(); downloadFile(inpput) }} style={{ marginLeft: '10px', textAlign: 'center' }}>
                          {getFileNameFromURL(inpput) || 'Not available'}
                        </a>
                      ))
                      ) :
                      (<a href="#" download onClick={(e) => { e.preventDefault(); downloadFile(datasetURL) }} style={{ marginLeft: '10px', textAlign: 'center' }}>
                        {getFileNameFromURL(datasetURL) || 'Not available'}
                      </a>)
                    }
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card raised sx={cardStyle}>
                <CardHeader title="Execution Details" />
                <CardContent sx={cardContentStyle}>
                  <Grid container spacing={2}> {/* Create a Grid container to layout details side by side */}
                    <Grid item xs={6}>
                      <Typography variant="subtitle1" gutterBottom><strong>Workflow:</strong></Typography>
                      <Typography variant="body1">{process || 'Not available'}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="subtitle1" gutterBottom><strong>Method:</strong></Typography>
                      {methodMap && Object.keys(methodMap).length > 0 ? (
                        Object.entries(methodMap).map(([key, value]) => (
                          <Typography variant="body1" key={key}>{key}: {value}</Typography>
                        ))
                      ) : (
                        <Typography variant="body2" color="textSecondary">Not available</Typography>
                      )}
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="subtitle1" gutterBottom><strong>Status:</strong></Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <StatusChip status={taskStatus} />
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>


            {(status?.toLowerCase() !== "success" && status?.toLowerCase() !== "failure") && <Grid item xs={12}  >
              <Card raised sx={cardStyle}>
                <CardHeader title="Live Logs" />
                <CardContent sx={cardContentStyle}>
                  <LogComponent wsLogs={liveLogs} />
                </CardContent>
              </Card>
            </Grid>}

            {taskStatus?.toLowerCase() === "success" && taskOutput && (
              <Grid item xs={12}  >
                <Card raised sx={cardStyle}>
                  <CardHeader title="Task Results" />
                  <CardContent sx={cardContentStyle}>
                    {
                      taskOutput.map((output, index) => (
                        Object.keys(output).map((key) => (
                          <><Typography variant="subtitle1"><strong>{key}: </strong></Typography>
                            <Typography variant="body1" gutterBottom>
                              {<a href="#" download onClick={(e) => { e.preventDefault(); downloadFile(output[key]); }} style={{ marginLeft: '10px', textAlign: 'center' }}>
                                {getFileNameFromURL(output[key]) || 'Not available'}
                              </a>}
                            </Typography></>
                        ))
                      )
                      )}
                    {taskResult && taskResult.wf_results && taskResult.wf_results.figures && (
                      <div>
                        <Typography variant="subtitle1"><strong>Figures: </strong></Typography>
                        <TaskImageGallery figures={taskResult.wf_results.figures} />
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            )}

            {/* {showErrorLog && (    */}
            {taskStatus?.toLowerCase() === "failure" && (
              <Grid item xs={12}>
                <Card raised sx={cardStyle}>
                  <CardHeader title="Error Feedback" />
                  <CardContent sx={cardContentStyle}>
                    <Typography variant="subtitle1"><strong>User Name:</strong> {uName}</Typography>
                    <Typography variant="subtitle1"><strong>User ID:</strong> {uIat}</Typography>
                    { /*<Typography variant="subtitle1"><strong>Task Result:</strong> {taskResult}</Typography>*/}
                    <Typography variant="subtitle1"><strong>Job Status:</strong> {taskStatus}</Typography>
                    <Typography variant="subtitle1"><strong>Job ID:</strong> {job_id}</Typography>
                    <Typography variant="subtitle1"><strong>User Comments:</strong></Typography>
                    <TextField
                      fullWidth
                      multiline
                      rows={4}
                      variant="outlined"
                      value={userComment}
                      onChange={(e) => setUserComment(e.target.value)}
                      placeholder="Enter your comments here."
                    />
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={handleSaveComment}
                      disabled={isSaving || isSent} // Disable button if saving
                      sx={{ mt: 2 }}
                    >
                      {isSaving ? 'Sending' : 'Send Feedback'}
                    </Button>
                    {commentSuccessMessage && (
                      <Typography variant="body1" color="success.main" sx={{ mt: 2 }}>
                        {commentSuccessMessage}
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            )}

          </Grid>
        </Container>

        {loading ? (
          <div className="spinner-container">
            <ScaleLoader color="#36d7b7" loading={loading} />
          </div>
        ) : (
          <div align="center">
            <div className='section'>
              <div className='section-heading' onClick={() => toggleSectionVisibility('preprocessResults')}>
                <h3>Details for each method</h3>
                <span className="category-icon">
                  <FontAwesomeIcon
                    icon={sectionsVisibility.preprocessResults ? faAngleDown : faAngleRight}
                  />
                </span>
              </div>
              <div className='section-content' style={{ display: sectionsVisibility.preprocessResults ? 'block' : 'none' }}>
                <React.Fragment>
                  <Card className="workflow-results">
                    <CardContent>
                      <div>
                        {toolResultsFromMongo.length > 0 ? (
                          toolResultsFromMongo.map((preProcessResult, index) => (
                            <Accordion
                              key={preProcessResult.process_id}
                              expanded={expanded === preProcessResult.process_id}
                              onChange={(event, isExpanded) => handleChange(preProcessResult.process_id)(event, isExpanded)}
                            >
                              <AccordionSummary
                                expandIcon={<ExpandMoreIcon />}
                                aria-controls={`panel${index}-content`}
                                id={`panel${index}-header`}
                              >
                                <Typography>{preProcessResult.description}</Typography>
                              </AccordionSummary>

                              {/* Conditionally render AccordionDetails only when expanded */}
                              {expanded === preProcessResult.process_id && (
                                <AccordionDetails>
                                  {expandLoading[preProcessResult.process_id] ? (
                                    <Typography>Loading...</Typography> // Show loading state while fetching
                                  ) : details[preProcessResult.process_id] ? (
                                    <div>
                                      <Descriptions title="Pre Process Result" bordered column={1}>
                                        <Descriptions.Item label="Description">{details[preProcessResult.process_id].description}</Descriptions.Item>
                                        <Descriptions.Item label="Stage">{details[preProcessResult.process_id].stage}</Descriptions.Item>
                                        <Descriptions.Item label="Process">{details[preProcessResult.process_id].process}</Descriptions.Item>
                                        <Descriptions.Item label="Method">{details[preProcessResult.process_id].method}</Descriptions.Item>
                                        <Descriptions.Item label="Parameters">
                                          {details[preProcessResult.process_id]?.parameters ? (  // Check if parameters exist
                                            <Descriptions title="parameters">
                                              {Object.entries(details[preProcessResult.process_id].parameters).map(([key, value]) => (
                                                <Descriptions.Item key={key} label={key}>
                                                  {value}
                                                </Descriptions.Item>
                                              ))}
                                            </Descriptions>
                                          ) : (
                                            <span>No parameters available.</span>  // Optional: Display a message if no parameters
                                          )}
                                        </Descriptions.Item>


                                        <Descriptions.Item label="Files">
                                          <div>
                                            {details[preProcessResult.process_id].adata_path && (
                                              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                                                <span style={{ marginRight: '8px' }}>AnnData File:</span>
                                                <a href="#"
                                                  download
                                                  onClick={(e) => { e.preventDefault(); downloadFile(details[preProcessResult.process_id]["adata_path"]) }}
                                                  style={{
                                                    cursor: 'pointer',
                                                    textDecoration: 'underline',
                                                    color: 'blue'
                                                  }}
                                                >
                                                  {getFileNameFromURL(details[preProcessResult.process_id]["adata_path"]) || 'Not available'}
                                                </a>
                                              </div>
                                            )}
                                            {details[preProcessResult.process_id].seurat_path && (
                                              <div style={{ display: 'flex', alignItems: 'center' }}>
                                                <span style={{ marginRight: '8px' }}>Seurat File:</span>
                                                <a href="#"
                                                  download
                                                  onClick={(e) => { e.preventDefault(); downloadFile(details[preProcessResult.process_id]["seurat_path"]) }}
                                                  style={{
                                                    cursor: 'pointer',
                                                    textDecoration: 'underline',
                                                    color: 'blue'
                                                  }}
                                                >
                                                  {getFileNameFromURL(details[preProcessResult.process_id]["seurat_path"]) || 'Not available'}
                                                </a>
                                              </div>
                                            )}
                                          </div>
                                        </Descriptions.Item>

                                      </Descriptions>
                                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                        <p>Plots:</p>
                                        <React.Fragment key="plots">
                                          {(details[preProcessResult.process_id].umap_plot || details[preProcessResult.process_id].umap_plot_3d) && (
                                            <>
                                              <h2>UMAP Plot</h2>
                                              <div style={{ display: 'flex', alignItems: 'center' }}>
                                                <FormControl>
                                                  <RadioGroup
                                                    row
                                                    aria-labelledby="demo-row-radio-buttons-group-label"
                                                    name="row-radio-buttons-group"
                                                    value={plotDimension}
                                                    onChange={(event) => setPlotDimension(event.target.value)}
                                                  >
                                                    <FormControlLabel value="2D" control={<Radio color="secondary" />} label="2D" />
                                                    <FormControlLabel value="3D" control={<Radio color="secondary" />} label="3D" />
                                                  </RadioGroup>
                                                </FormControl>

                                                <FormControl sx={{ m: 1, minWidth: 120 }} size="small">
                                                  <InputLabel id="plot-options-label">Color</InputLabel>
                                                  <Select
                                                    labelId="plot-options-label"
                                                    id="plot-options"
                                                    value={clusteringPlotType}
                                                    onChange={(event) => {
                                                      const selectedPlotType = event.target.value;
                                                      setClusteringPlotType(selectedPlotType);
                                                      fetchPlotData(selectedPlotType, details[preProcessResult.process_id].obs, details[preProcessResult.process_id].umap, details[preProcessResult.process_id].umap_3d, "umap"); // Call the API as soon as the selection changes
                                                    }}
                                                  >
                                                    {Array.isArray(details[preProcessResult.process_id].obs_names) && (
                                                      details[preProcessResult.process_id].obs_names.map((key, idx) => (
                                                        <MenuItem key={idx} value={key}>{key}</MenuItem>
                                                      ))
                                                    )}
                                                  </Select>
                                                </FormControl>

                                              </div>
                                              {loadingPlot ? (
                                                <div>Loading plot data...</div>
                                              ) : plotData ? (
                                                <>
                                                  {plotDimension === '2D' ? (
                                                    plotData && plotData.umap_plot ? (
                                                      <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                                                        <ReactPlotly plot_data={plotData.umap_plot} />
                                                      </div>
                                                    ) : (
                                                      <div style={{ textAlign: 'center', width: '100%' }}>2D UMAP plot does not exist.</div>
                                                    )
                                                  ) : plotDimension === '3D' ? (
                                                    plotData && plotData.umap_plot_3d ? (
                                                      <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                                                        <ReactPlotly plot_data={plotData.umap_plot_3d} />
                                                      </div>
                                                    ) : (
                                                      <div style={{ textAlign: 'center', width: '100%' }}>3D UMAP plot does not exist.</div>
                                                    )
                                                  ) : null}
                                                </>
                                              ) : (
                                                <div>No plot data available</div>
                                              )}

                                            </>
                                          )}

                                          {(details[preProcessResult.process_id].atac_umap_plot || details[preProcessResult.process_id].atac_umap_plot_3d) && (
                                            <>
                                              <h2>ATAC UMAP Plot</h2>
                                              <div style={{ display: 'flex', alignItems: 'center' }}>
                                                <FormControl>
                                                  <RadioGroup
                                                    row
                                                    aria-labelledby="demo-row-radio-buttons-group-label"
                                                    name="row-radio-buttons-group"
                                                    value={plotDimension}
                                                    onChange={(event) => setAtacPlotDimension(event.target.value)}
                                                  >
                                                    <FormControlLabel value="2D" control={<Radio color="secondary" />} label="2D" />
                                                    <FormControlLabel value="3D" control={<Radio color="secondary" />} label="3D" />
                                                  </RadioGroup>
                                                </FormControl>

                                                <FormControl sx={{ m: 1, minWidth: 120 }} size="small">
                                                  <InputLabel id="plot-options-label">Color</InputLabel>
                                                  <Select
                                                    labelId="plot-options-label"
                                                    id="plot-options"
                                                    value={clusteringAtacPlotType}
                                                    onChange={(event) => {
                                                      const selectedPlotType = event.target.value;
                                                      setAtacClusteringPlotType(selectedPlotType);
                                                      fetchPlotData(selectedPlotType, details[preProcessResult.process_id].atac_obs, details[preProcessResult.process_id].atac_umap, details[preProcessResult.process_id].atac_umap_3d, "atac_umap"); // Call the API as soon as the selection changes
                                                    }}
                                                  >
                                                    {Array.isArray(details[preProcessResult.process_id].atac_obs_names) && (
                                                      details[preProcessResult.process_id].atac_obs_names.map((key, idx) => (
                                                        <MenuItem key={idx} value={key}>{key}</MenuItem>
                                                      ))
                                                    )}
                                                  </Select>
                                                </FormControl>

                                              </div>
                                              {loadingPlot ? (
                                                <div>Loading plot data...</div>
                                              ) : atacPlotData ? (
                                                <>
                                                  {atacPlotDimension === '2D' ? (
                                                    atacPlotData && atacPlotData.atac_umap_plot ? (
                                                      <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                                                        <ReactPlotly plot_data={atacPlotData.atac_umap_plot} />
                                                      </div>
                                                    ) : (
                                                      <div style={{ textAlign: 'center', width: '100%' }}>2D UMAP plot does not exist.</div>
                                                    )
                                                  ) : atacPlotDimension === '3D' ? (
                                                    atacPlotData && atacPlotData.atac_umap_plot_3d ? (
                                                      <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                                                        <ReactPlotly plot_data={atacPlotData.atac_umap_plot_3d} />
                                                      </div>
                                                    ) : (
                                                      <div style={{ textAlign: 'center', width: '100%' }}>3D UMAP plot does not exist.</div>
                                                    )
                                                  ) : null}
                                                </>
                                              ) : (
                                                <div>No plot data available</div>
                                              )}

                                            </>
                                          )}

                                          {(details[preProcessResult.process_id].tsne_plot || details[preProcessResult.process_id].tsne_plot_3d) && (
                                            <>
                                              <h2>tsne Plot</h2>
                                              <div style={{ display: 'flex', alignItems: 'center' }}>
                                                <FormControl>
                                                  <RadioGroup
                                                    row
                                                    aria-labelledby="demo-row-radio-buttons-group-label"
                                                    name="row-radio-buttons-group"
                                                    value={tsnePlotDimension}
                                                    onChange={(event) => setTsnePlotDimension(event.target.value)}
                                                  >
                                                    <FormControlLabel value="2D" control={<Radio color="secondary" />} label="2D" />
                                                    <FormControlLabel value="3D" control={<Radio color="secondary" />} label="3D" />
                                                  </RadioGroup>
                                                </FormControl>

                                                <FormControl sx={{ m: 1, minWidth: 120 }} size="small">
                                                  <InputLabel id="plot-options-label">Color</InputLabel>
                                                  <Select
                                                    labelId="plot-options-label"
                                                    id="plot-options"
                                                    value={tsneClusteringPlotType}
                                                    onChange={(event) => {
                                                      const selectedPlotType = event.target.value;
                                                      setTsneClusteringPlotType(selectedPlotType);
                                                      fetchPlotData(selectedPlotType, details[preProcessResult.process_id].obs, details[preProcessResult.process_id].tsne, details[preProcessResult.process_id].tsne_3d, "tsne"); // Call the API as soon as the selection changes
                                                    }}
                                                  >
                                                    {Array.isArray(details[preProcessResult.process_id].obs_names) && (
                                                      details[preProcessResult.process_id].obs_names.map((key, idx) => (
                                                        <MenuItem key={idx} value={key}>{key}</MenuItem>
                                                      ))
                                                    )}
                                                  </Select>
                                                </FormControl>

                                              </div>
                                              {loadingPlot ? (
                                                <div>Loading plot data...</div>
                                              ) : tsnePlotData ? (
                                                <>
                                                  {tsnePlotDimension === '2D' ? (
                                                    tsnePlotData && tsnePlotData.tsne_plot ? (
                                                      <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                                                        <ReactPlotly plot_data={tsnePlotData.tsne_plot} />
                                                      </div>
                                                    ) : (
                                                      <div style={{ textAlign: 'center', width: '100%' }}>2D t-SNE plot does not exist.</div>
                                                    )
                                                  ) : tsnePlotDimension === '3D' ? (
                                                    tsnePlotData && tsnePlotData.tsne_plot_3d ? (
                                                      <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                                                        <ReactPlotly plot_data={tsnePlotData.tsne_plot_3d} />
                                                      </div>
                                                    ) : (
                                                      <div style={{ textAlign: 'center', width: '100%' }}>3D t-SNE plot does not exist.</div>
                                                    )
                                                  ) : null}
                                                </>
                                              ) : (
                                                <div>No plot data available</div>
                                              )}

                                            </>
                                          )}
                                          {details[preProcessResult.process_id].violin_plot && (
                                            <>
                                              <h2>Violin Plot</h2>
                                              <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                                                <ReactPlotly plot_data={details[preProcessResult.process_id].violin_plot} />
                                              </div>
                                            </>
                                          )}
                                          {details[preProcessResult.process_id].scatter_plot && (
                                            <>
                                              <h2>Scatter Plot</h2>
                                              <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                                                <ReactPlotly plot_data={details[preProcessResult.process_id].scatter_plot} />
                                              </div>
                                            </>
                                          )}
                                          {details[preProcessResult.process_id].highest_expr_genes_plot && (
                                            <>
                                              <h2>Highest Expression Genes Plot</h2>
                                              <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                                                <ReactPlotly plot_data={details[preProcessResult.process_id].highest_expr_genes_plot} />
                                              </div>
                                            </>
                                          )}
                                        </React.Fragment>
                                      </div>

                                    </div>
                                  ) : (
                                    <Typography>No details available</Typography> // Fallback if no data
                                  )}
                                </AccordionDetails>
                              )}
                            </Accordion>
                          ))
                        ) : (
                          <p>No task results.</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </React.Fragment>
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="right-rail">
        <RightRail />
      </div>
    </div>
  );
}

export default WorkflowTaskDetailsComponent;

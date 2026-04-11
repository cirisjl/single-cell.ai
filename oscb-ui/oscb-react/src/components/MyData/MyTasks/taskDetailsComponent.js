import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
// import { Octokit } from "@octokit/rest";
import axios from 'axios';
import { ScaleLoader } from 'react-spinners';

// MUI Imports
import {
  Container, Typography, Chip, Box, Card, CardContent, Grid,
  TextField, Button, CardHeader, Select, MenuItem, InputLabel,
  FormControl, Radio, RadioGroup, FormControlLabel
} from '@mui/material';
import { green, red, yellow } from '@mui/material/colors';

// Custom/Project Imports
import RightRail from '../../RightNavigation/rightRail';
import LogComponent from '../../common_components/liveLogs';
import AlertMessageComponent from '../../publishDatasets/components/alertMessageComponent';
import ReactPlotly from '../../publishDatasets/components/reactPlotly';
import TaskImageGallery from './taskImageGallery';
import Chatbot from "../../RightNavigation/Chatbot";
import AnnotationTable from './annotationPanel';
import OutlierTable from './outlierPanel';
import { getCookie, plotUmapObs, gunzipDict, ShowVitessce } from '../../../utils/utilFunctions';
import { CELERY_BACKEND_API, NODE_API_URL } from '../../../constants/declarations';
import useWebSocket from './useWebSocket'; // Custom hook for WebSocket

// Initialize Octokit
// const octokit = new Octokit({ auth: process.env.REACT_APP_TOKEN });
const jwtToken = getCookie('jwtToken');

// --- Helpers ---

const StatusChip = ({ status }) => {
  const getStatusColor = () => {
    switch (status?.toLowerCase()) {
      case 'success': return green[500];
      case 'failure': return red[500];
      case 'started': return yellow[700];
      default: return yellow[700];
    }
  };

  return (
    <Chip
      label={status ? status.toUpperCase() : "PROCESSING"}
      style={{ backgroundColor: getStatusColor(), color: '#fff' }}
    />
  );
};

const getFileNameFromURL = (fileUrl) => {
  if (!fileUrl) return '';
  try {
    return fileUrl.substring(fileUrl.lastIndexOf('/') + 1);
  } catch (e) {
    console.error(e);
    return '';
  }
};

const panelStyle = {
  maxHeight: '150px',       // Restricts the height
  overflowY: 'auto',        // Adds a scrollbar ONLY if content exceeds maxHeight
  textAlign: 'left',
  border: '1px solid #ccc',
  padding: '16px',
  borderRadius: '8px',
  backgroundColor: '#f9f9f9'
};

const downloadFile = (fileUrl) => {
  const apiUrl = `${NODE_API_URL}/download`;
  const pwd = "jobResults";

  if (fileUrl) {
    fetch(`${apiUrl}?fileUrl=${encodeURIComponent(fileUrl)}&authToken=${encodeURIComponent(jwtToken || '')}&pwd=${pwd}`)
      .then(response => response.blob())
      .then(blob => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = getFileNameFromURL(fileUrl);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      })
      .catch(error => console.error('Error downloading file:', error));
  }
};

// Reusable Plot Component
const InteractivePlot = ({
  title,
  dimension,
  setDimension,
  plotType,
  setPlotType,
  options,
  onOptionChange,
  plotData2D,
  plotData3D
}) => {
  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h5" gutterBottom align="center">{title}</Typography>

      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2, mb: 2 }}>
        <FormControl component="fieldset">
          <RadioGroup
            row
            value={dimension}
            onChange={(e) => setDimension(e.target.value)}
          >
            <FormControlLabel value="2D" control={<Radio color="secondary" />} label="2D" />
            <FormControlLabel value="3D" control={<Radio color="secondary" />} label="3D" />
          </RadioGroup>
        </FormControl>

        <FormControl sx={{ minWidth: 150 }} size="small">
          <InputLabel>Color</InputLabel>
          <Select
            value={plotType}
            label="Color"
            onChange={(e) => {
              setPlotType(e.target.value);
              onOptionChange(e.target.value);
            }}
          >
            {options?.map((key, idx) => (
              <MenuItem key={`${key}-${idx}`} value={key}>{key}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <Box sx={{ width: '100%', minHeight: '400px', display: 'flex', justifyContent: 'center' }}>
        {dimension === '2D' ? (
          plotData2D ? <ReactPlotly plot_data={plotData2D} /> : <Typography>2D Plot not available</Typography>
        ) : (
          plotData3D ? <ReactPlotly plot_data={plotData3D} /> : <Typography>3D Plot not available</Typography>
        )}
      </Box>
    </Box>
  );
};

// // --- Auto-reconnect WebSocket Hook (merged, replaces calling hooks inside effects) ---
// function useAutoReconnectWebSocket(jobId, { onStatus, onLog, enabled = true, stop = false } = {}) {
//   const wsRef = useRef(null);
//   const webSocketLog = useRef(null);
//   const retryRef = useRef(0);
//   const closedByUserRef = useRef(false);
//   const jobIdRef = useRef(jobId);

//   jobIdRef.current = jobId;

//   const cleanup = useCallback(() => {
//     const ws = wsRef.current;
//     wsRef.current = null;
//     if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
//       closedByUserRef.current = true;
//       try { ws.close(); } catch { }
//     }
//   }, []);

//   useEffect(() => {
//     if (!enabled || !jobId || stop) {
//       cleanup();
//       return;
//     }

//     closedByUserRef.current = false;
//     retryRef.current = 0;

//     let cancelled = false;

//     const connect = () => {
//       if (cancelled) return;
//       if (!jobIdRef.current) return;

//       const ws = new WebSocket(`${WEB_SOCKET_URL}/taskCurrentStatus/${jobIdRef.current}`);
//       wsRef.current = ws;
//       console.log("Connecting to WebSocket:", ws.url);

//       ws.onopen = () => {
//         retryRef.current = 0;
//       };

//       ws.onmessage = (event) => {
//         // Heuristic: logs are usually plain text; status is JSON
//         // You can tighten this by routing to separate endpoints, but this keeps your existing behavior.
//         const text = event?.data;

//         // Try JSON first
//         try {
//           const data = JSON.parse(text);
//           onStatus?.({ data, rawEvent: event });
//           return;
//         } catch {
//           // Not JSON => treat as log line
//           onLog?.(event);
//         }
//       };

//       ws.onerror = () => {
//         // error will usually be followed by close
//       };

//       ws.onclose = () => {
//         if (cancelled) return;
//         if (closedByUserRef.current) return;
//         if (!enabled || stop) return;

//         // exponential backoff with jitter, capped
//         retryRef.current += 1;
//         const base = Math.min(15000, 500 * Math.pow(2, Math.min(6, retryRef.current)));
//         const jitter = Math.floor(Math.random() * 250);
//         const delay = base + jitter;

//         setTimeout(() => {
//           if (!cancelled && enabled && !stop && jobIdRef.current) connect();
//         }, delay);
//       };
//     };

//     connect();

//     return () => {
//       cancelled = true;
//       cleanup();
//     };
//   }, [jobId, enabled, stop, cleanup, onStatus, onLog]);
// }

// --- Main Component ---
function TaskDetailsComponent() {
  const location = useLocation();
  const navigate = useNavigate();

  // State from router
  const routerState = location.state || {};
  const {
    job_id: routerJobId,
    status: routerStatus,
    output: routerOutput,
    description,
    datasetURL,
    process,
    method,
  } = routerState;

  // Local state (init from router state)
  const [jobId, setJobId] = useState(routerJobId || null);
  const [taskStatus, setTaskStatus] = useState(routerStatus || null);
  const [taskOutput, setTaskOutput] = useState(routerOutput || null);
  const [liveLogs, setLiveLogs] = useState('');
  const [loading, setLoading] = useState(true);
  const [, setLoadingPlot] = useState(false);

  // Data State
  const [toolResultsFromMongo, setToolResultsFromMongo] = useState([]);
  const [taskResult, setTaskResult] = useState(null);
  const [processIds, setProcessIds] = useState([]);
  const [presetQuestions, setPresetQuestions] = useState(null);

  // User/Auth State
  const [uName, setUName] = useState(null);
  const [uIat, setUIat] = useState(null);

  // Plot State
  const [plotData, setPlotData] = useState(null); // UMAP
  const [tsnePlotData, setTsnePlotData] = useState(null); // t-SNE
  const [atacPlotData, setAtacPlotData] = useState(null); // ATAC

  // UI Controls
  const [plotDimension, setPlotDimension] = useState('2D');
  const [clusteringPlotType, setClusteringPlotType] = useState('');

  const [tsnePlotDimension, setTsnePlotDimension] = useState('2D');
  const [tsneClusteringPlotType, setTsneClusteringPlotType] = useState('');

  const [atacPlotDimension, setAtacPlotDimension] = useState('2D');
  const [atacClusteringPlotType, setAtacClusteringPlotType] = useState('');

  // Feedback State
  const [userComment, setUserComment] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [commentSuccessMessage, setCommentSuccessMessage] = useState('');

  // Alert State
  const [message, setMessage] = useState('');
  const [hasMessage, setHasMessage] = useState(false);
  const [isError, setIsError] = useState(false);

  // PP socket
  const [ppJobId, setppJobId] = useState(null);
  const [ppStarted, setPpStarted] = useState(false);

  const isTerminalState = useCallback((s) => ["success", "failure"].includes((s || '').toLowerCase()), []);
  const isJobFinished = useMemo(() => isTerminalState(taskStatus), [taskStatus, isTerminalState]);
  const activeWsJobId = useMemo(() => (jobId && !isJobFinished) ? jobId : null, [jobId, isJobFinished]);

  // Sync router state on mount (and when route changes with new state)
  useEffect(() => {
    if (!routerState) return;

    setJobId(routerJobId || null);
    setTaskStatus(routerStatus || null);
    setTaskOutput(routerOutput || null);

    const fetchUserInfo = async () => {
      if (!jwtToken) return;
      try {
        const response = await fetch(NODE_API_URL + "/protected", {
          headers: { Authorization: `Bearer ${jwtToken}` },
        });
        const data = await response.json();
        if (data?.authData) {
          setUName(data.authData.username);
          setUIat(data.authData.iat);
        }
      } catch (e) {
        console.error(e);
      }
    };

    fetchUserInfo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routerJobId]);

  // Reset when a NEW job id is set (either from router or tool submit)
  useEffect(() => {
    if (!jobId) return;

    setToolResultsFromMongo([]);
    setTaskResult(null);
    setProcessIds([]);
    setppJobId(null);
    setPpStarted(false);

    setLoading(true);
    setLoadingPlot(false);
    setLiveLogs("");

    setPlotData(null);
    setTsnePlotData(null);
    setAtacPlotData(null);
    console.log("Resetting state for new jobId:", jobId);
    console.log("Current routerJobId:", routerJobId);
    console.log("Current activeWsJobId:", activeWsJobId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId]);

  const fetchPlotData = useCallback(async (plotType, cell_metadata, twoDArray, threeDArray, plotName) => {
    setLoadingPlot(true);
    const selectedCellType = null;

    try {
      let plot = null;
      let plot_3d = null;
      const inflated = gunzipDict(cell_metadata);

      if (twoDArray) plot = plotUmapObs(inflated, twoDArray, plotType, [], selectedCellType, 2, plotName);
      if (threeDArray) plot_3d = plotUmapObs(inflated, threeDArray, plotType, [], selectedCellType, 3, plotName);

      if (plotName === 'tsne') {
        if (plot || plot_3d) setTsnePlotData({ tsne_plot: plot, tsne_plot_3d: plot_3d });
      } else if (plotName === 'umap') {
        if (plot || plot_3d) setPlotData({ umap_plot: plot, umap_plot_3d: plot_3d });
      } else if (plotName === 'atac_umap') {
        if (plot || plot_3d) setAtacPlotData({ atac_umap_plot: plot, atac_umap_plot_3d: plot_3d });
      }
    } catch (error) {
      console.error('Error fetching plot data:', error);
      alert(`Error fetching plot data: ${error}`);
    } finally {
      setLoadingPlot(false);
    }
  }, []);

  const handleStatusMessage = useCallback(({ data }) => {
    // console.log("WS message received", data);
    // console.log("taskStatus:", taskStatus);
    // console.log("routerStatus:", routerStatus);
    // console.log("routerJobId:", routerJobId);
    // console.log("jobId:", jobId);
    // console.log("activeWsJobId:", activeWsJobId);
    // console.log("isJobFinished:", isJobFinished);

    const currentStatus = routerJobId !== activeWsJobId ? data?.task_status : routerStatus || data?.task_status || taskStatus;
    console.log("Determined currentStatus:", currentStatus);

    if (!currentStatus) return;

    setTaskStatus(currentStatus);

    const lower = currentStatus.toLowerCase();
    if (!isTerminalState(lower)) return;

    if (lower === "success") {
      const resultData = data?.task_result; // NO fallback to router state
      setLoading(false);
      setLoadingPlot(false);

      if (resultData?.process_ids?.length) {
        setTaskResult(resultData);
        setProcessIds(resultData.process_ids);
      }

      if (resultData?.output) {
        setTaskOutput(resultData.output);
        console.log("Task output in handleStatusMessage:", resultData.output);
      }
    } else {
      setLoading(false);
      setLoadingPlot(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTerminalState, routerStatus, taskStatus]);

  const handleLogMessage = useCallback((event) => {
    setLiveLogs((prev) => prev + event.data);
    const logsElement = document.getElementById("_live_logs");
    if (logsElement) logsElement.scrollTop = logsElement.scrollHeight;
  }, []);

  // // MAIN auto-reconnect WS (stops automatically when terminal)
  // useAutoReconnectWebSocket(activeWsJobId, {
  //   onStatus: handleStatusMessage,
  //   onLog: handleLogMessage,
  //   enabled: !!activeWsJobId,
  //   stop: !activeWsJobId,
  // });

  useWebSocket(activeWsJobId, handleStatusMessage, handleLogMessage, setLoading)

  // Fetch initial snapshot (helps if you refresh page mid-run)
  useEffect(() => {
    if (!jobId) return;

    const fetchJobData = async () => {
      try {
        const response = await fetch(`${CELERY_BACKEND_API}/task/${jobId}`);
        const data = await response.json();
        console.log("Initial job data fetched in handleStatusMessage:", data);

        if (data?.task_status) setTaskStatus(data.task_status);
        if (data?.task_result) {
          setTaskResult(data.task_result);
          if (data.task_result?.output) setTaskOutput(data.task_result.output);
          if (data.task_result?.process_ids?.length) {
            setProcessIds(data.task_result.process_ids);
            console.log("Process IDs found on initial fetch:", data.task_result.process_ids);
          }
          if (isTerminalState(data?.task_status)) {
            setLoading(false);
          }
        }
      } catch (e) {
        setLoading(false);
        console.error("Error fetching task:", e);
      }
    };

    fetchJobData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId]);

  // Kick off preprocess results job once per processIds
  useEffect(() => {
    if (!processIds.length || ppStarted) return;

    const fetchProcessResults = async () => {
      try {
        const response = await axios.post(
          `${CELERY_BACKEND_API}/getPreProcessResults`,
          { process_ids: processIds }
        );
        const data = response.data;
        console.log("Preprocess results response:", data);
        setppJobId(data.job_id);
        setPpStarted(true);
      } catch (error) {
        console.error(error);
        setLoading(false);
      }
    };

    fetchProcessResults();
  }, [processIds, ppStarted]);

  // PP auto-reconnect WS
  const handlePpStatus = useCallback(({ data }) => {
    console.log("PP WS message received", data);
    if (data?.task_status === "SUCCESS") {
      const resultArr = Array.isArray(data.task_result) ? data.task_result : [];
      setToolResultsFromMongo(resultArr);
      if (resultArr?.[0]?.preset_questions) setPresetQuestions(resultArr[0].preset_questions);
      if (resultArr?.[0]?.output) setTaskOutput(resultArr[0].output);

      setLoading(false);
      setppJobId(null);
      // setProcessIds([]);
      // setPpStarted(false);
    } else if (data?.task_status === "FAILURE") {
      console.error("PP Task Failed");
      setHasMessage(true);
      setMessage("Pre-process task failed.");
      setIsError(true);
      setLoading(false);
      // setppJobId(null);
      // setPpStarted(false);
    }
  }, []);

  // useAutoReconnectWebSocket(ppJobId, {
  //   onStatus: handlePpStatus,
  //   enabled: !!ppJobId,
  //   stop: !ppJobId,
  // });

  useWebSocket(ppJobId, handlePpStatus, handleLogMessage, setLoading)

  // --- Actions ---
  const handleDelete = () => {
    if (!window.confirm("Are you sure to delete this job?")) return;

    axios.post(`${CELERY_BACKEND_API}/job/revoke/${jobId}`)
      .then(() => axios.delete(`${NODE_API_URL}/deleteJob?jobID=${jobId}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${jwtToken}`,
          },
        }))
      .then(() => navigate('/myJobs'))
      .catch(error => console.error('Error deleting job:', error));
  };

  const handleSaveComment = async () => {
    setIsSaving(true);
    setIsSent(false);

    try {
      const res = await axios.post(`${NODE_API_URL}/errorlogdata`, {
        name: uName,
        id: uIat,
        taskResult,
        taskStatus,
        job_id: routerJobId,
        userComments: userComment
      });

      // Issue creation
      const data = await axios.post(`${NODE_API_URL}/issues`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: `Issue for Job ID: ${routerJobId}`,
            body: `User: ${uName}\nJob ID: ${routerJobId}\nStatus: ${taskStatus}\nComment: ${userComment}`
          }),
        }
      );

      console.log(`Issue created: ${data.html_url}`);
      if (res.status === 200 && data.status === 200) {
        setCommentSuccessMessage('Feedback sent successfully.');
        setIsSent(true);
      }
    } catch (error) {
      console.error('Error saving comment:', error);
      setCommentSuccessMessage('Failed to send feedback.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToolSubmit = async (data, endpoint) => {
    const root = Array.isArray(toolResultsFromMongo) ? toolResultsFromMongo[0] : null;

    const commonData = {
      ...data,
      cluster_id: root?.[endpoint === 'outliercorrection' ? 'outlier_panel' : 'annotation_panel']?.cluster_id,
      process_id: root?.process_id,
      job_id: routerJobId,
      obsSets: root?.obsSets,
      obsEmbedding: root?.obsEmbedding,
      adata_path: root?.adata_path,
      zarr_path: root?.zarr_path,
      layer: root?.layer,
      datasetId: root?.datasetId,
      userID: uName,
    };

    console.log(`Submitting data to ${endpoint}:`, commonData);

    try {
      const response = await axios.post(`${CELERY_BACKEND_API}/tools/${endpoint}`, commonData);

      // Start NEW job cycle
      console.log("Tool submission response:", response.data);
      setJobId(response.data.job_id);

      // hard reset derived states (jobId effect will also reset)
      setToolResultsFromMongo([]);
      setProcessIds([]);
      setppJobId(null);
      setPpStarted(false);

      setTaskOutput(null);
      setTaskResult(null);
      setTaskStatus(null);

      setLoading(true);
    } catch (error) {
      console.error('Error submitting tool data:', error);
      setHasMessage(true);
      setMessage(`Failed to submit ${endpoint} data.`);
      setIsError(true);
      setLoading(false);
    }
  };

  const commonCardStyle = { height: '100%', display: 'flex', flexDirection: 'column' };
  const commonContentStyle = { flexGrow: 1, overflow: 'auto' };

  return (
    <div className="task-details-container eighty-twenty-grid">
      {hasMessage && (
        <AlertMessageComponent
          message={message}
          setHasMessage={setHasMessage}
          setMessage={setMessage}
          isError={isError}
        />
      )}

      <div className="main-content">
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
          <Box display="flex" justifyContent="center" mb={2}>
            <Typography variant="h4">Job Details for Job ID: {jobId || 'Loading ...'}</Typography>
          </Box>

          <Grid container spacing={3}>
            {/* Card 1: Dataset Info */}
            <Grid item xs={12} md={6}>
              <Card raised sx={commonCardStyle}>
                <CardHeader title="Dataset Information" />
                <CardContent sx={commonContentStyle}>
                  <Typography variant="subtitle1"><strong>Job Description:</strong></Typography>
                  <Typography variant="body1" gutterBottom>{description || 'Not available'}</Typography>

                  <Typography variant="subtitle1"><strong>Dataset:</strong></Typography>
                  <Box>
                    {(datasetURL ? (Array.isArray(datasetURL) ? datasetURL : [datasetURL]) : []).map((url, i) => (
                      <div key={i}>
                        <button type="button"
                          style={{ background: 'none', border: 'none', padding: 0, font: 'inherit', cursor: 'pointer', textDecoration: 'underline', color: '#1976d2' }}
                          onClick={(e) => { e.preventDefault(); downloadFile(url); }}
                        >
                          {getFileNameFromURL(url) || 'Download File'}
                        </button>
                      </div>
                    ))}
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Card 2: Execution Details */}
            <Grid item xs={12} md={6}>
              <Card raised sx={commonCardStyle}>
                <CardHeader title="Execution Details" />
                <CardContent sx={commonContentStyle}>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="subtitle1"><strong>Process:</strong></Typography>
                      <Typography variant="body1">{process || 'N/A'}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="subtitle1"><strong>Method:</strong></Typography>
                      {
                        method && Array.isArray(method) ? (method.map((value, index) => (<Typography variant="body1">{value}</Typography>))) :
                          (typeof (method) !== 'string' && Object.keys(method).length > 0 ? (
                            Object.entries(method).map(([key, value]) => (<Typography variant="body1" key={key}>{key}: {value}</Typography>)))
                            : (<Typography variant="body1">{method}</Typography>))
                      }
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="subtitle1"><strong>Status:</strong></Typography>
                      <StatusChip status={taskStatus} />
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="subtitle1"><strong>Action:</strong></Typography>
                      <Button
                        variant="contained"
                        color="error"
                        size="small"
                        onClick={handleDelete}
                      >
                        {isTerminalState(taskStatus) ? 'Delete' : 'Terminate'}
                      </Button>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* Live Logs (Only if not done) */}
            {!isTerminalState(taskStatus) && (
              <Grid item xs={12}>
                <Card raised sx={commonCardStyle}>
                  <CardHeader title="Live Logs" />
                  <CardContent sx={commonContentStyle}>
                    <LogComponent wsLogs={liveLogs} />
                  </CardContent>
                </Card>
              </Grid>
            )}

            {/* Results Section */}
            {String(taskStatus || '').toLowerCase() === "success" && taskOutput && (
              <Grid item xs={12}>
                <Card raised sx={commonCardStyle}>
                  <CardHeader title="Task Results" />
                  <CardContent sx={commonContentStyle}>
                    {Array.isArray(taskOutput) && taskOutput.map((out, idx) => (
                      <Box key={idx} mb={1}>
                        {Object.entries(out || {}).map(([key, val]) => (
                          <div key={key}>
                            <Typography variant="subtitle1" display="inline"><strong>{key}: </strong></Typography>
                            <button type="button"
                              style={{ background: 'none', border: 'none', padding: 0, font: 'inherit', cursor: 'pointer', color: '#1976d2', textDecoration: 'underline' }}
                              onClick={(e) => { e.preventDefault(); downloadFile(val); }}
                            >
                              {getFileNameFromURL(val)}
                            </button>
                          </div>
                        ))}
                      </Box>
                    ))}
                    {taskResult?.figures && (
                      <Box mt={2}>
                        <Typography variant="subtitle1"><strong>Figures: </strong></Typography>
                        <TaskImageGallery figures={taskResult.figures} />
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            )}

            {/* Error Feedback */}
            {String(taskStatus || '').toLowerCase() === "failure" && (
              <Grid item xs={12}>
                <Card raised sx={commonCardStyle}>
                  <CardHeader title="Error Feedback" />
                  <CardContent sx={commonContentStyle}>
                    <Typography><strong>User:</strong> {uName}</Typography>
                    <Typography><strong>Job ID:</strong> {routerJobId}</Typography>
                    <TextField
                      fullWidth multiline rows={4} variant="outlined" sx={{ mt: 2 }}
                      value={userComment}
                      onChange={(e) => setUserComment(e.target.value)}
                      placeholder="Enter your comments here."
                    />
                    <Button
                      variant="contained" sx={{ mt: 2 }}
                      onClick={handleSaveComment}
                      disabled={isSaving || isSent}
                    >
                      {isSaving ? 'Sending...' : 'Send Feedback'}
                    </Button>
                    {commentSuccessMessage && (
                      <Typography color="success.main" sx={{ mt: 1 }}>{commentSuccessMessage}</Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            )}
          </Grid>
        </Container>

        {/* Dynamic Plots & Analysis Tools */}
        {loading ? (
          <div className="spinner-container">
            <ScaleLoader color="#36d7b7" loading={loading} />
          </div>
        ) : (
          Array.isArray(toolResultsFromMongo) && toolResultsFromMongo.length > 0 && (
            <div align="center">
              {toolResultsFromMongo.map((result, index) => (
                <React.Fragment key={index}>
                  {/* UMAP */}
                  {(result.umap_plot || result.umap_plot_3d) && (
                    <InteractivePlot
                      title="UMAP"
                      dimension={plotDimension}
                      setDimension={setPlotDimension}
                      plotType={clusteringPlotType}
                      setPlotType={setClusteringPlotType}
                      options={result.obs_names}
                      onOptionChange={(val) => fetchPlotData(val, result.obs, result.umap, result.umap_3d, "umap")}
                      plotData2D={plotData?.umap_plot || result.umap_plot}
                      plotData3D={plotData?.umap_plot_3d || result.umap_plot_3d}
                    />
                  )}

                  {/* ATAC UMAP */}
                  {(result.atac_umap_plot || result.atac_umap_plot_3d) && (
                    <InteractivePlot
                      title="ATAC UMAP"
                      dimension={atacPlotDimension}
                      setDimension={setAtacPlotDimension}
                      plotType={atacClusteringPlotType}
                      setPlotType={setAtacClusteringPlotType}
                      options={result.atac_obs_names}
                      onOptionChange={(val) => fetchPlotData(val, result.atac_obs, result.atac_umap, result.atac_umap_3d, "atac_umap")}
                      plotData2D={atacPlotData?.atac_umap_plot || result.atac_umap_plot}
                      plotData3D={atacPlotData?.atac_umap_plot_3d || result.atac_umap_plot_3d}
                    />
                  )}

                  {/* t-SNE */}
                  {(result.tsne_plot || result.tsne_plot_3d) && (
                    <InteractivePlot
                      title="t-SNE"
                      dimension={tsnePlotDimension}
                      setDimension={setTsnePlotDimension}
                      plotType={tsneClusteringPlotType}
                      setPlotType={setTsneClusteringPlotType}
                      options={result.obs_names}
                      onOptionChange={(val) => fetchPlotData(val, result.obs, result.tsne, result.tsne_3d, "tsne")}
                      plotData2D={tsnePlotData?.tsne_plot || result.tsne_plot}
                      plotData3D={tsnePlotData?.tsne_plot_3d || result.tsne_plot_3d}
                    />
                  )}

                  {/* Static plots */}
                  {result.violin_plot && <><Typography variant="h5">Violin</Typography><ReactPlotly plot_data={result.violin_plot} /></>}
                  {result.scatter_plot && <><Typography variant="h5">Scatter</Typography><ReactPlotly plot_data={result.scatter_plot} /></>}
                  {result.highest_expr_genes_plot && <><Typography variant="h5">Highest Expression Genes</Typography><ReactPlotly plot_data={result.highest_expr_genes_plot} /></>}

                  {/* Vitessce */}
                  {result.zarr_path && (
                    <>
                      <Typography variant="h5" sx={{ mt: 4 }}>Gene Expression</Typography>
                      <Box sx={{ width: '100%', height: '920px' }}>
                        <ShowVitessce
                          processId={result.process_id}
                          description={result.description}
                          zarrPath={result.zarr_path}
                          initialFeatureFilterPath={result.initialFeatureFilterPath}
                          obsEmbedding={result.obsEmbedding}
                          obsSets={result.obsSets}
                        />
                      </Box>
                    </>
                  )}

                  {/* Tool Panels */}
                  {process === "Quality Control" && result?.outlier_panel && (
                    <Grid item xs={12} sx={{ mt: 4 }}>
                      <Card raised sx={commonCardStyle}>
                        <CardHeader title="Outlier Correction" />
                        <CardContent sx={commonContentStyle}>
                          <OutlierTable
                            key={result.job_id || `outlier-${index}`}
                            data={result.outlier_panel.table || []}
                            onSubmit={(data) => handleToolSubmit(data, 'outliercorrection')}
                          />
                        </CardContent>
                      </Card>
                    </Grid>
                  )}

                  {process !== "Quality Control" && result?.annotation_panel && (
                    <Grid item xs={12} sx={{ mt: 4 }}>
                      <Card raised sx={commonCardStyle}>
                        <CardHeader title="Manual Annotation" />
                        <CardContent sx={commonContentStyle}>
                          <AnnotationTable
                            key={result.job_id || `annotation-${index}`}
                            data={result.annotation_panel.table || []}
                            cellTypeOptions={result.annotation_panel.unique_labels || []}
                            onSubmit={(data) => handleToolSubmit(data, 'manualannotattion')}
                          />
                        </CardContent>
                      </Card>
                    </Grid>
                  )}

                  {/* Tools */}
                  {String(taskStatus || '').toLowerCase() === "success" && result?.tools && (
                    <Grid item xs={12}>
                      <Card raised sx={commonCardStyle}>
                        <CardHeader title="Tools" />
                        <CardContent sx={commonContentStyle}>
                          <div style={panelStyle}>
                            <pre>
                              {JSON.stringify(result?.tools, null, 2)}
                            </pre>
                          </div>
                        </CardContent>
                      </Card>
                    </Grid>
                  )}
                </React.Fragment>
              ))}
            </div>
          )
        )}
      </div>

      <div className="right-rail">
        <RightRail />
        <Chatbot presetQuestions={presetQuestions} />
      </div>
    </div>
  );
}

export default TaskDetailsComponent;
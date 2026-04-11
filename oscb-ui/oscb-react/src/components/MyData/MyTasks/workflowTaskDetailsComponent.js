import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import useWebSocket from './useWebSocket';
import {
  Container, Typography, Chip, Box, Grid, TextField, Button,
  Card, CardContent, CardHeader, Select, MenuItem, InputLabel,
  FormControl, Radio, RadioGroup, FormControlLabel
} from '@mui/material';
import { green, red, yellow } from '@mui/material/colors';
import RightRail from '../../RightNavigation/rightRail';
import LogComponent from '../../common_components/liveLogs';
import axios from 'axios';
// import { Octokit } from "@octokit/rest";
import AlertMessageComponent from '../../publishDatasets/components/alertMessageComponent';
import { ScaleLoader } from 'react-spinners';
import ReactPlotly from '../../publishDatasets/components/reactPlotly';
import { getCookie, plotUmapObs, gunzipDict, ShowVitessce } from '../../../utils/utilFunctions';
import { faAngleDown, faAngleRight } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Descriptions } from 'antd';
import { styled } from '@mui/material/styles';
import ArrowForwardIosSharpIcon from '@mui/icons-material/ArrowForwardIosSharp';
import MuiAccordion from '@mui/material/Accordion';
import MuiAccordionSummary from '@mui/material/AccordionSummary';
import MuiAccordionDetails from '@mui/material/AccordionDetails';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Chatbot from "../../RightNavigation/Chatbot";

// GitImports & Constants
import { CELERY_BACKEND_API, NODE_API_URL } from '../../../constants/declarations';
import TaskImageGallery from './taskImageGallery';
import AnnotationTable from './annotationPanel';
import OutlierTable from './outlierPanel';

// const octokit = new Octokit({ auth: process.env.REACT_APP_TOKEN });
const jwtToken = getCookie('jwtToken');

// --- Styled Components ---
const Accordion = styled((props) => (
  <MuiAccordion disableGutters elevation={0} square {...props} />
))(({ theme }) => ({
  border: `1px solid ${theme.palette.divider}`,
  '&:not(:last-child)': { borderBottom: 0 },
  '&::before': { display: 'none' },
}));

const panelStyle = {
  maxHeight: '150px',       // Restricts the height
  overflowY: 'auto',        // Adds a scrollbar ONLY if content exceeds maxHeight
  border: '1px solid #ccc',
  padding: '16px',
  borderRadius: '8px',
  backgroundColor: '#f9f9f9'
};

const AccordionSummary = styled((props) => (
  <MuiAccordionSummary expandIcon={<ArrowForwardIosSharpIcon sx={{ fontSize: '0.9rem' }} />} {...props} />
))(({ theme }) => ({
  backgroundColor: 'rgba(0, 0, 0, .03)',
  flexDirection: 'row-reverse',
  '& .MuiAccordionSummary-expandIconWrapper.Mui-expanded': { transform: 'rotate(90deg)' },
  '& .MuiAccordionSummary-content': { marginLeft: theme.spacing(1) },
  ...theme.applyStyles('dark', { backgroundColor: 'rgba(255, 255, 255, .05)' }),
}));

const AccordionDetails = styled(MuiAccordionDetails)(({ theme }) => ({
  padding: theme.spacing(2),
  borderTop: '1px solid rgba(0, 0, 0, .125)',
}));

const cardStyle = { height: '100%', display: 'flex', flexDirection: 'column' };
const cardContentStyle = { flexGrow: 1, overflow: 'auto' };

// --- Helper Functions & Small Components ---
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
      label={(status || "In Progress").toUpperCase()}
      style={{ backgroundColor: getStatusColor(), color: '#fff' }}
    />
  );
};

const getFileNameFromURL = (fileUrl) => fileUrl ? fileUrl.substring(fileUrl.lastIndexOf('/') + 1) : '';

const downloadFile = (fileUrl) => {
  if (!fileUrl) return;
  const apiUrl = `${NODE_API_URL}/download`;
  const pwd = "jobResults";

  fetch(`${apiUrl}?fileUrl=${fileUrl}&authToken=${jwtToken}&pwd=${pwd}`)
    .then(res => res.blob())
    .then(blob => {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = getFileNameFromURL(fileUrl);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    })
    .catch(err => console.error('Error downloading file:', err));
};

// Reusable Download Link Component to prevent repetitive a-tags
const DownloadLink = ({ url, label }) => (
  <button type="button"
    onClick={(e) => { e.preventDefault(); downloadFile(url); }}
    style={{ background: 'none', border: 'none', padding: 0, font: 'inherit', cursor: 'pointer', textDecoration: 'underline', color: 'blue', marginLeft: '10px' }}
  >
    {label || getFileNameFromURL(url) || 'Not available'}
  </button>
);

const InteractivePlot = ({ title, dimension, setDimension, plotType, setPlotType, options, onOptionChange, plotData2D, plotData3D }) => (
  <Box sx={{ mb: 4 }}>
    <Typography variant="h5" gutterBottom align="center">{title}</Typography>
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2, mb: 2 }}>
      <FormControl component="fieldset">
        <RadioGroup row value={dimension} onChange={(e) => setDimension(e.target.value)}>
          <FormControlLabel value="2D" control={<Radio color="secondary" />} label="2D" />
          <FormControlLabel value="3D" control={<Radio color="secondary" />} label="3D" />
        </RadioGroup>
      </FormControl>

      <FormControl sx={{ minWidth: 150 }} size="small">
        <InputLabel>Color</InputLabel>
        <Select value={plotType} label="Color" onChange={(e) => { setPlotType(e.target.value); onOptionChange(e.target.value); }}>
          {options?.map((key, idx) => <MenuItem key={`${key}-${idx}`} value={key}>{key}</MenuItem>)}
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

// --- Subcomponent for Process Accordion Item ---
// By extracting this, every process gets its OWN state for plot visualization
const ProcessAccordionItem = ({ processData, process, handleToolSubmit }) => {
  const [plotData, setPlotData] = useState({ umap_plot: processData.umap_plot, umap_plot_3d: processData.umap_plot_3d });
  const [tsnePlotData, setTsnePlotData] = useState({ tsne_plot: processData.tsne_plot, tsne_plot_3d: processData.tsne_plot_3d });
  const [atacPlotData, setAtacPlotData] = useState({ atac_umap_plot: processData.atac_umap_plot, atac_umap_plot_3d: processData.atac_umap_plot_3d });

  const [plotDimension, setPlotDimension] = useState('2D');
  const [clusteringPlotType, setClusteringPlotType] = useState('');
  const [tsnePlotDimension, setTsnePlotDimension] = useState('2D');
  const [tsneClusteringPlotType, setTsneClusteringPlotType] = useState('');
  const [atacPlotDimension, setAtacPlotDimension] = useState('2D');
  const [atacClusteringPlotType, setAtacClusteringPlotType] = useState('');

  const fetchPlotData = useCallback(async (plotType, cell_metadata, twoDArray, threeDArray, plotName) => {
    try {
      let plot = null, plot_3d = null;
      const inflated = gunzipDict(cell_metadata);

      if (twoDArray) plot = plotUmapObs(inflated, twoDArray, plotType, [], null, 2, plotName);
      if (threeDArray) plot_3d = plotUmapObs(inflated, threeDArray, plotType, [], null, 3, plotName);

      if (plotName === 'tsne') setTsnePlotData({ tsne_plot: plot, tsne_plot_3d: plot_3d });
      else if (plotName === 'umap') setPlotData({ umap_plot: plot, umap_plot_3d: plot_3d });
      else if (plotName === 'atac_umap') setAtacPlotData({ atac_umap_plot: plot, atac_umap_plot_3d: plot_3d });
    } catch (error) {
      console.error('Error fetching plot data:', error);
      alert(`Error fetching plot data: ${error}`);
    }
  }, []);

  return (
    <div>
      <Descriptions title="Pre Process Result" bordered column={1}>
        <Descriptions.Item label="Description">{processData.description}</Descriptions.Item>
        <Descriptions.Item label="Stage">{processData.stage}</Descriptions.Item>
        <Descriptions.Item label="Process">{processData.process}</Descriptions.Item>
        <Descriptions.Item label="Method">{processData.method}</Descriptions.Item>
        <Descriptions.Item label="Parameters">
          {processData?.parameters ? (
            <Descriptions title="parameters">
              {Object.entries(processData.parameters).map(([key, value]) => (
                <Descriptions.Item key={key} label={key}>{value}</Descriptions.Item>
              ))}
            </Descriptions>
          ) : <span>No parameters available.</span>}
        </Descriptions.Item>
        {processData?.tools && (
          <Descriptions.Item label="Tools">
            <div style={panelStyle}>
              <pre>
                {JSON.stringify(processData?.tools, null, 2)}
              </pre>
            </div>
          </Descriptions.Item>
        )}
        <Descriptions.Item label="Files">
          <div>
            {processData.adata_path && <div><span style={{ marginRight: '8px' }}>AnnData File:</span><DownloadLink url={processData.adata_path} /></div>}
            {processData.seurat_path && <div><span style={{ marginRight: '8px' }}>Seurat File:</span><DownloadLink url={processData.seurat_path} /></div>}
          </div>
        </Descriptions.Item>
      </Descriptions>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <p>Plots:</p>

        {/* UMAP */}
        {(processData.umap_plot || processData.umap_plot_3d) && (
          <InteractivePlot
            title="UMAP" dimension={plotDimension} setDimension={setPlotDimension}
            plotType={clusteringPlotType} setPlotType={setClusteringPlotType}
            options={processData.obs_names}
            onOptionChange={(val) => fetchPlotData(val, processData.obs, processData.umap, processData.umap_3d, "umap")}
            plotData2D={plotData?.umap_plot} plotData3D={plotData?.umap_plot_3d}
          />
        )}

        {/* ATAC UMAP */}
        {(processData.atac_umap_plot || processData.atac_umap_plot_3d) && (
          <InteractivePlot
            title="ATAC UMAP" dimension={atacPlotDimension} setDimension={setAtacPlotDimension}
            plotType={atacClusteringPlotType} setPlotType={setAtacClusteringPlotType}
            options={processData.atac_obs_names}
            onOptionChange={(val) => fetchPlotData(val, processData.atac_obs, processData.atac_umap, processData.atac_umap_3d, "atac_umap")}
            plotData2D={atacPlotData?.atac_umap_plot} plotData3D={atacPlotData?.atac_umap_plot_3d}
          />
        )}

        {/* t-SNE */}
        {(processData.tsne_plot || processData.tsne_plot_3d) && (
          <InteractivePlot
            title="t-SNE" dimension={tsnePlotDimension} setDimension={setTsnePlotDimension}
            plotType={tsneClusteringPlotType} setPlotType={setTsneClusteringPlotType}
            options={processData.obs_names}
            onOptionChange={(val) => fetchPlotData(val, processData.obs, processData.tsne, processData.tsne_3d, "tsne")}
            plotData2D={tsnePlotData?.tsne_plot} plotData3D={tsnePlotData?.tsne_plot_3d}
          />
        )}

        {/* Static plots */}
        {processData.violin_plot && <><Typography variant="h5">Violin</Typography><ReactPlotly plot_data={processData.violin_plot} /></>}
        {processData.scatter_plot && <><Typography variant="h5">Scatter</Typography><ReactPlotly plot_data={processData.scatter_plot} /></>}
        {processData.highest_expr_genes_plot && <><Typography variant="h5">Highest Expression Genes</Typography><ReactPlotly plot_data={processData.highest_expr_genes_plot} /></>}

        {/* Vitessce */}
        {processData.zarr_path && (
          <>
            <Typography variant="h5" sx={{ mt: 4 }}>Gene Expression</Typography>
            <Box sx={{ width: '100%', height: '920px' }}>
              <ShowVitessce
                processId={processData.process_id}
                description={processData.description}
                zarrPath={processData.zarr_path}
                initialFeatureFilterPath={processData.initialFeatureFilterPath}
                obsEmbedding={processData.obsEmbedding}
                obsSets={processData.obsSets}
              />
            </Box>
          </>
        )}

        {/* Tool Panels */}
        {process === "Quality Control" && processData?.outlier_panel && (
          <Grid item xs={12} sx={{ mt: 4 }}>
            <Card raised sx={cardStyle}>
              <CardHeader title="Outlier Correction" />
              <CardContent sx={cardContentStyle}>
                <OutlierTable data={processData.outlier_panel.table || []} onSubmit={(data) => handleToolSubmit(data, 'outliercorrection')} />
              </CardContent>
            </Card>
          </Grid>
        )}

        {process !== "Quality Control" && processData?.annotation_panel && (
          <Grid item xs={12} sx={{ mt: 4 }}>
            <Card raised sx={cardStyle}>
              <CardHeader title="Manual Annotation" />
              <CardContent sx={cardContentStyle}>
                <AnnotationTable
                  data={processData.annotation_panel.table || []}
                  cellTypeOptions={processData.annotation_panel.unique_labels || []}
                  onSubmit={(data) => handleToolSubmit(data, 'manualannotattion')}
                />
              </CardContent>
            </Card>
          </Grid>
        )}
      </div>
    </div>
  );
};


// --- Main Component ---
export default function WorkflowTaskDetailsComponent() {
  const location = useLocation();
  const navigate = useNavigate();
  const { job_id, methodMap, datasetURL, description, process, output, results, status } = location.state || {};

  const [taskStatus, setTaskStatus] = useState(null);
  const [taskOutput, setTaskOutput] = useState(null);
  const [liveLogs, setLiveLogs] = useState('');
  const [loading, setLoading] = useState(true);
  const [toolResultsFromMongo, setToolResultsFromMongo] = useState([]);

  const [uName, setUName] = useState(null);
  const [uIat, setUIat] = useState(null);
  const [taskResult, setTaskResult] = useState("");
  const [message, setMessage] = useState('');
  const [hasMessage, setHasMessage] = useState(false);
  const [isError, setIsError] = useState(false);

  const [userComment, setUserComment] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [commentSuccessMessage, setCommentSuccessMessage] = useState('');
  const [showErrorLog, setShowErrorLog] = useState(true);

  const [expandLoading, setExpandLoading] = useState({});
  const [details, setDetails] = useState({});
  const [ppJobId, setppJobId] = useState(null);
  const [presetQuestions, setPresetQuestions] = useState(null);
  const [activePreProcessResults, setActivePreProcessResults] = useState(null);
  const [sectionsVisibility, setSectionsVisibility] = useState({ preprocessResults: true });
  const [expanded, setExpanded] = useState(false);

  const isTerminalState = useCallback((s) => ["success", "failure"].includes((s || '').toLowerCase()), []);
  const toggleSectionVisibility = (section) => setSectionsVisibility((prev) => ({ ...prev, [section]: !prev[section] }));

  const fetchProcessResults = async (processIds, record_type) => {
    if (!processIds.length) return;
    try {
      const response = await axios.post(`${CELERY_BACKEND_API}/getPreProcessResultsMain`, { process_ids: processIds, record_type });
      setToolResultsFromMongo(response.data);
    } catch (error) {
      console.error('API Error:', error);
      setMessage("Failed to retrieve pre processed results from MongoDB");
      setHasMessage(true);
      setIsError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (processId) => async (event, isExpanded) => {
    setExpanded(isExpanded ? processId : false);
    if (isExpanded && !details[processId]) {
      setExpandLoading((prev) => ({ ...prev, [processId]: true }));
      try {
        const response = await axios.post(`${CELERY_BACKEND_API}/getPreProcessResults`, { process_ids: [processId] });
        setppJobId(response.data.job_id);
      } catch (error) {
        console.error('API Error:', error);
        setMessage("Failed to retrieve pre-processed results.");
        setHasMessage(true);
        setIsError(true);
        setExpandLoading((prev) => ({ ...prev, [processId]: false }));
      }
    }
  };

  const handleDelete = () => {
    if (!window.confirm("Are you sure to delete this job?")) return;
    axios.post(`${CELERY_BACKEND_API}/job/revoke/${job_id}`)
      .then(() => axios.delete(`${NODE_API_URL}/deleteJob?jobID=${job_id}`,
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

  const handleStatusMessage = useCallback(({ data }) => {
    const currentStatus = status || data?.task_status || taskStatus;
    if (!currentStatus) return;
    setTaskStatus(currentStatus);

    if (isTerminalState(currentStatus.toLowerCase())) {
      setLoading(false);
      if (currentStatus.toLowerCase() === "success") {
        if (results?.process_ids) {
          setTaskResult(results);
          fetchProcessResults(results.process_ids, "table");
        } else if (data.task_result?.process_ids) {
          const resultData = data.task_result;
          fetchProcessResults(resultData.process_ids, "table");
          if (resultData.output) {
            setTaskOutput(resultData.output);
            setTaskResult(resultData);
          }
        }
      }
    }
  }, [isTerminalState, status, taskStatus, results]); // added results to dependencies

  useEffect(() => {
    async function fetchFiles() {
      if (status?.toLowerCase() === "success" && output) {
        setTaskOutput(output);
        setTaskResult(results);
      } else {
        try {
          const res = await fetch(`${CELERY_BACKEND_API}/task/${job_id}`);
          const data = await res.json();
          setTaskResult(data.task_result);
        } catch (error) { console.error('Error fetching task status:', error); }
      }
    }
    const fetchUserInfo = async () => {
      if (!jwtToken) return;
      try {
        const res = await fetch(NODE_API_URL + "/protected", { headers: { Authorization: `Bearer ${jwtToken}` } });
        const data = await res.json();
        if (data?.authData) { setUName(data.authData.username); setUIat(data.authData.iat); }
      } catch (e) { console.error(e); }
    };
    fetchUserInfo();
    fetchFiles();
  }, [job_id, status, output, results]);

  const handleLogMessage = useCallback((event) => {
    setLiveLogs((prev) => prev + event.data);
    const logsElement = document.getElementById("_live_logs");
    if (logsElement) logsElement.scrollTop = logsElement.scrollHeight;
  }, []);

  const handleSaveComment = async () => {
    setIsSaving(true);
    setIsSent(false);
    try {
      const res = await axios.post(`${NODE_API_URL}/errorlogdata`, {
        name: uName,
        id: uIat,
        taskResult,
        taskStatus,
        job_id,
        userComments: userComment
      });

      // Issue creation
      const data = await axios.post(`${NODE_API_URL}/issues`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: `Issue for Job ID: ${job_id}`,
            body: `User: ${uName}\nJob ID: ${job_id}\nStatus: ${taskStatus}\nComment: ${userComment}`
          }),
        }
      );

      console.log(`Issue created: ${data.html_url}`);
      if (res.status === 200 && data.status === 200) {
        setCommentSuccessMessage('Feedback sent successfully.');
        setIsSent(true);
        setShowErrorLog(false);
      }
    } catch (error) {
      setCommentSuccessMessage('Failed to send feedback.');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePpStatus = useCallback(({ data }) => {
    if (data?.task_status === "SUCCESS") {
      const preProcessResult = data.task_result[0];
      const processId = preProcessResult.process_id;

      setActivePreProcessResults(preProcessResult);
      if (preProcessResult?.preset_questions) setPresetQuestions(preProcessResult.preset_questions);
      if (preProcessResult?.output) setTaskOutput(preProcessResult.output);

      setDetails((prev) => ({ ...prev, [processId]: preProcessResult }));
      setExpandLoading((prev) => ({ ...prev, [processId]: false })); // FIXED: processId was erroneously details.processId
      setppJobId(null);
    } else if (data?.task_status === "FAILURE") {
      setMessage("Loading pre-process results is Failed");
      setHasMessage(true);
      setIsError(true);
      setExpandLoading((prev) => ({ ...prev, [details.processId]: false }));
      setLoading(false);
      setppJobId(null);
    }
  }, [details.processId]);

  const handleToolSubmit = async (data, endpoint) => {
    const root = activePreProcessResults;
    const commonData = {
      ...data,
      cluster_id: root?.[endpoint === 'outliercorrection' ? 'outlier_panel' : 'annotation_panel']?.cluster_id,
      process_id: root?.process_id,
      description: `Manual ${endpoint === 'outliercorrection' ? 'Outlier Correction' : 'Annotation'} for ${root?.datasetId}`,
      job_id: null,
      obsSets: root?.obsSets, obsEmbedding: root?.obsEmbedding,
      adata_path: root?.adata_path, zarr_path: root?.zarr_path,
      layer: root?.layer, datasetId: root?.datasetId, userID: uName,
    };

    try {
      const res = await axios.post(`${CELERY_BACKEND_API}/tools/${endpoint}`, commonData);
      navigate("/mydata/taskDetails", { state: { job_id: res.data.job_id, method: "Manual Annotation", datasetURL: commonData.adata_path, description: commonData.description, process: "Annotation" } });
    } catch (error) {
      setMessage(`Failed to submit ${endpoint} data.`);
      setHasMessage(true);
      setIsError(true);
    }
  };

  useWebSocket(job_id, handleStatusMessage, handleLogMessage, setLoading);
  useWebSocket(ppJobId, handlePpStatus, handleLogMessage, setLoading);

  return (
    <div className="task-details-container eighty-twenty-grid">
      {hasMessage && <AlertMessageComponent message={message} setHasMessage={setHasMessage} setMessage={setMessage} isError={isError} />}

      <div className="main-content">
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
          <Box display="flex" justifyContent="center">
            <Typography variant="h4" gutterBottom>Job Details for Job ID: {job_id || 'Loading ...'}</Typography>
          </Box>

          <Grid container spacing={3}>
            {/* Dataset Information Card */}
            <Grid item xs={12} md={6}>
              <Card raised sx={cardStyle}>
                <CardHeader title="Dataset Information" />
                <CardContent sx={cardContentStyle}>
                  <Typography variant="subtitle1"><strong>Job Description:</strong></Typography>
                  <Typography variant="body1" gutterBottom>{description || 'Not available'}</Typography>
                  <Typography variant="subtitle1"><strong>Dataset:</strong></Typography>
                  <Typography variant="body1" gutterBottom>
                    {Array.isArray(datasetURL)
                      ? datasetURL.map((input, idx) => <DownloadLink key={idx} url={input} />)
                      : <DownloadLink url={datasetURL} />
                    }
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Execution Details Card */}
            <Grid item xs={12} md={6}>
              <Card raised sx={cardStyle}>
                <CardHeader title="Execution Details" />
                <CardContent sx={cardContentStyle}>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="subtitle1" gutterBottom><strong>Workflow:</strong></Typography>
                      <Typography variant="body1">{process || 'Not available'}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="subtitle1" gutterBottom><strong>Method:</strong></Typography>
                      {methodMap && Object.keys(methodMap).length > 0 ? (
                        Object.entries(methodMap).map(([key, value]) => <Typography variant="body1" key={key}>{key}: {value}</Typography>)
                      ) : <Typography variant="body2" color="textSecondary">Not available</Typography>}
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="subtitle1" gutterBottom><strong>Status:</strong></Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><StatusChip status={taskStatus} /></Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="subtitle1" gutterBottom><strong>Action:</strong></Typography>
                      <Button variant="contained" color="error" onClick={handleDelete}>
                        {(status && ["success", "failure"].includes(status.toLowerCase())) ? 'Delete' : 'Terminate'}
                      </Button>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* Live Logs Card */}
            {!["success", "failure"].includes(status?.toLowerCase()) && (
              <Grid item xs={12}>
                <Card raised sx={cardStyle}>
                  <CardHeader title="Live Logs" />
                  <CardContent sx={cardContentStyle}><LogComponent wsLogs={liveLogs} /></CardContent>
                </Card>
              </Grid>
            )}

            {/* Task Results Card */}
            {taskStatus?.toLowerCase() === "success" && taskOutput && (
              <Grid item xs={12}>
                <Card raised sx={cardStyle}>
                  <CardHeader title="Task Results" />
                  <CardContent sx={cardContentStyle}>
                    {taskOutput.map((outputObj, index) => (
                      Object.keys(outputObj).map((key) => (
                        <div key={`${index}-${key}`}>
                          <Typography variant="subtitle1"><strong>{key}: </strong></Typography>
                          <Typography variant="body1" gutterBottom><DownloadLink url={outputObj[key]} /></Typography>
                        </div>
                      ))
                    ))}
                    {taskResult?.wf_results?.figures && (
                      <div>
                        <Typography variant="subtitle1"><strong>Figures: </strong></Typography>
                        <TaskImageGallery figures={taskResult.wf_results.figures} />
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            )}

            {/* Error Feedback Card */}
            {taskStatus?.toLowerCase() === "failure" && showErrorLog && (
              <Grid item xs={12}>
                <Card raised sx={cardStyle}>
                  <CardHeader title="Error Feedback" />
                  <CardContent sx={cardContentStyle}>
                    <Typography variant="subtitle1"><strong>User Name:</strong> {uName}</Typography>
                    <Typography variant="subtitle1"><strong>User ID:</strong> {uIat}</Typography>
                    <Typography variant="subtitle1"><strong>Job Status:</strong> {taskStatus}</Typography>
                    <Typography variant="subtitle1"><strong>Job ID:</strong> {job_id}</Typography>
                    <Typography variant="subtitle1" sx={{ mt: 2 }}><strong>User Comments:</strong></Typography>
                    <TextField fullWidth multiline rows={4} variant="outlined" value={userComment} onChange={(e) => setUserComment(e.target.value)} placeholder="Enter your comments here." />
                    <Button variant="contained" color="primary" onClick={handleSaveComment} disabled={isSaving || isSent} sx={{ mt: 2 }}>
                      {isSaving ? 'Sending...' : 'Send Feedback'}
                    </Button>
                    {commentSuccessMessage && <Typography variant="body1" color="success.main" sx={{ mt: 2 }}>{commentSuccessMessage}</Typography>}
                  </CardContent>
                </Card>
              </Grid>
            )}
          </Grid>
        </Container>

        {/* Process Results Section */}
        {loading ? (
          <div className="spinner-container"><ScaleLoader color="#36d7b7" loading={loading} /></div>
        ) : (
          <div align="center">
            <div className='section'>
              <div className='section-heading' onClick={() => toggleSectionVisibility('preprocessResults')}>
                <h3>Details for each method</h3>
                <span className="category-icon"><FontAwesomeIcon icon={sectionsVisibility.preprocessResults ? faAngleDown : faAngleRight} /></span>
              </div>
              <div className='section-content' style={{ display: sectionsVisibility.preprocessResults ? 'block' : 'none' }}>
                <Card className="workflow-results">
                  <CardContent>
                    {toolResultsFromMongo.length > 0 ? (
                      toolResultsFromMongo.map((preProcessResult, index) => (
                        <Accordion
                          key={preProcessResult.process_id}
                          expanded={expanded === preProcessResult.process_id}
                          onChange={handleChange(preProcessResult.process_id)}
                        >
                          <AccordionSummary expandIcon={<ExpandMoreIcon />} id={`panel${index}-header`}>
                            <Typography>{preProcessResult.description}</Typography>
                          </AccordionSummary>

                          {expanded === preProcessResult.process_id && (
                            <AccordionDetails>
                              {expandLoading[preProcessResult.process_id] ? (
                                <Typography>Loading...</Typography>
                              ) : details[preProcessResult.process_id] ? (
                                <ProcessAccordionItem
                                  processData={details[preProcessResult.process_id]}
                                  process={process}
                                  handleToolSubmit={handleToolSubmit}
                                />
                              ) : (
                                <Typography>No details available</Typography>
                              )}
                            </AccordionDetails>
                          )}
                        </Accordion>
                      ))
                    ) : <p>No task results.</p>}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="right-rail">
        <RightRail />
        <Chatbot presetQuestions={presetQuestions} />
      </div>
    </div>
  );
}
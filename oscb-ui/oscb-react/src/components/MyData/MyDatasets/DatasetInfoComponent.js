import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import { CELERY_BACKEND_API, NODE_API_URL, WEB_SOCKET_URL } from '../../../constants/declarations';
import { ScaleLoader } from 'react-spinners';
import AlertMessageComponent from '../../publishDatasets/components/alertMessageComponent';
import { Card, CardContent, Typography } from '@mui/material';
import { faAngleDown, faAngleRight } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { downloadFile, getFileNameFromURL, getCookie, plotUmapObs, gunzipDict, ShowVitessce } from '../../../utils/utilFunctions';
import RightRail from '../../RightNavigation/rightRail';
import DatasetDetailsTable from '../../Benchmarks/components/DatasetDetailsTable';
import { Descriptions } from 'antd';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { styled } from '@mui/material/styles';
import ArrowForwardIosSharpIcon from '@mui/icons-material/ArrowForwardIosSharp';
import MuiAccordion from '@mui/material/Accordion';
import MuiAccordionSummary from '@mui/material/AccordionSummary';
import MuiAccordionDetails from '@mui/material/AccordionDetails';
import ReactPlotly from '../../publishDatasets/components/reactPlotly';
import { FormControl, RadioGroup, FormControlLabel, Radio, Select, MenuItem, InputLabel } from '@mui/material';


const panelStyle = {
  maxHeight: '150px',       // Restricts the height
  overflowY: 'auto',        // Adds a scrollbar ONLY if content exceeds maxHeight
  border: '1px solid #ccc',
  padding: '16px',
  borderRadius: '8px',
  backgroundColor: '#f9f9f9'
};

const DatasetInfoComponent = () => {
  const location = useLocation();
  const [datasetId, setDatasetId] = useState(null);
  const [datasetDetails, setDatasetDetails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [hasMessage, setHasMessage] = useState(false);
  const [isError, setIsError] = useState(false);
  const [plotDimension, setPlotDimension] = useState('2D');
  const [tsnePlotDimension, setTsnePlotDimension] = useState('2D');
  const [clusteringPlotType, setClusteringPlotType] = useState('');
  const [tsneClusteringPlotType, setTsneClusteringPlotType] = useState('');
  const [plotData, setPlotData] = useState(null); // State to store the fetched plot data
  const [tsnePlotData, setTsnePlotData] = useState(null); // State to store the fetched plot data
  const [atacPlotDimension, setAtacPlotDimension] = useState('2D');
  const [clusteringAtacPlotType, setAtacClusteringPlotType] = useState('');
  const [atacPlotData, setAtacPlotData] = useState(null); // State to store the fetched plot data
  const [loadingPlot, setLoadingPlot] = useState(false); // State to handle loading spinner
  const [expanded, setExpanded] = useState(false);
  const [details, setDetails] = useState({}); // Store fetched details
  const [expandLoading, setExpandLoading] = useState({}); // Store loading states for each accordion
  const [ppJobId, setppJobId] = useState(null);
  const [copiedState, setCopiedState] = useState(false);

  const handleCopy = () => {
    setCopiedState(true);
    setTimeout(() => setCopiedState(false), 2000); // Reset after 2 seconds
  };

  const fetchPlotData = async (plotType, cell_metadata, twoDArray, threeDArray, plotName) => {
    setLoadingPlot(true); // Set loading to true before making the API call
    // const worker = new Worker(new URL("./../../utils/worker.js", import.meta.url));
    // Access the first element of the datasetDetails array
    const selectedCellType = datasetDetails[0]?.datasetDetails?.['Selected Cell Types'];
    if (!selectedCellType || !selectedCellType.label) {
      throw new Error("Selected Cell Type or label is missing");
    }

    try {
      let plot = null;
      let plot_3d = null;

      cell_metadata = gunzipDict(cell_metadata);
      // console.log("cell_metadata after gunzip:", cell_metadata);
      // console.log("twoDArray:", twoDArray);

      if (twoDArray) {
        plot = plotUmapObs(cell_metadata, twoDArray, plotType, [], selectedCellType.label, 2, plotName);
        // worker.postMessage({ obs: cell_metadata, umap: twoDArray, clustering_plot_type: plotType, selected_cell_intersection: [], annotation: selectedCellType.label, n_dim: 2, plotName: plotName });
        // console.log("发送给 Worker 的数据:", { obs: cell_metadata, umap: twoDArray, clustering_plot_type: plotType, selected_cell_intersection: [], annotation: selectedCellType.label, n_dim: 2, plotName: plotName });
      }
      if (threeDArray) {
        // worker.postMessage({ obs: cell_metadata, umap: threeDArray, clustering_plot_type: plotType, selected_cell_intersection: [], annotation: selectedCellType.label, n_dim: 3, plotName: plotName });
        // console.log("发送给 Worker 的数据:", { obs: cell_metadata, umap: twoDArray, clustering_plot_type: plotType, selected_cell_intersection: [], annotation: selectedCellType.label, n_dim: 3, plotName: plotName });
        plot_3d = plotUmapObs(cell_metadata, threeDArray, plotType, [], selectedCellType.label, 3, plotName);
      }

      // worker.onmessage = (event) => {
      //   console.log("event.data from worker:", event.data);
      //   if (twoDArray) {
      //     plot = event.data;
      //     console.log("从 Worker 收到2D的结果:", event.data);
      //   }
      //   if (threeDArray) {
      //     plot_3d = event.data;
      //     console.log("从 Worker 收到3D的结果:", event.data);
      //   }
      // };

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

    // return () => {
    //   worker.terminate();
    // };

  };


  //  // Function to make an API call based on the dropdown option and dimension
  // const fetchPlotData = async (plotType, cell_metadata, umap, umap_3d) => {
  //   setLoadingPlot(true); // Set loading to true before making the API call

  //   // Access the first element of the datasetDetails array
  //   const selectedCellType = datasetDetails[0]?.datasetDetails?.['Selected Cell Types'];
  //   if (!selectedCellType || !selectedCellType.label) {
  //     throw new Error("Selected Cell Type or label is missing");
  //   }

  //   try {
  //     const response = await axios.post(`${CELERY_BACKEND_API}/plotumap/`, {
  //       process_ids: [process_id],
  //       clustering_plot_type: plotType,
  //       annotation: selectedCellType.label,
  //     });

  //     console.log("API Call Success");

  //     console.log(response);
  //     const data = response.data[0];

  //     console.log("plot data");
  //     console.log(data);
  //     console.log(response.data);

  //     if(data.umap_plot && data.umap_plot_3d) {
  //       setPlotData({umap_plot: data.umap_plot, umap_plot_3d: data.umap_plot_3d});
  //     }
  //   } catch (error) {
  //     console.error('Error fetching plot data:', error);
  //   } finally {
  //     setLoadingPlot(false); 
  //   }
  // };

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

  const handleChange = (processId) => async (event, isExpanded) => {
    // Update the expanded accordion state: expanded if open, false if collapsed
    setExpanded(isExpanded ? processId : false);

    // Fetch data only when accordion is expanded and data is not already fetched
    if (isExpanded && !details[processId]) {
      // Set loading state for the specific accordion
      setExpandLoading((prevLoading) => ({ ...prevLoading, [processId]: true }));
      // setLoading(true);

      try {
        const response = await axios.post(`${CELERY_BACKEND_API}/getPreProcessResults`, { process_ids: [processId] });
        // console.log('Process Results:', response.data);
        const taskInfo = response.data;
        // let geneMetadata = gunzipDict(taskInfo.gene_metadata);
        // console.log("geneMetadata:", geneMetadata);
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
    if (!ppJobId) return;

    const statusUrl = `${WEB_SOCKET_URL}/taskCurrentStatus/${ppJobId}`;
    // console.log("Connecting to WebSocket for pre-process results:", statusUrl);
    const ws = new WebSocket(statusUrl);
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.task_status) {
        if (data.task_status === "SUCCESS") {
          const preProcessResult = data.task_result[0];
          console.log(preProcessResult);
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

          console.log("details:", details);

          setExpandLoading((prevLoading) => ({ ...prevLoading, [processId]: false }));
          // setLoading(false);
          setppJobId(null); // Reset ppJobId after handling

        } else if (data.task_status === "FAILURE") {
          setMessage("Loading pre-process results is Failed");
          setHasMessage(true);
          setIsError(true);
          setExpandLoading((prevLoading) => ({ ...prevLoading, [details.processId]: false }));
          // setLoading(false);
          setppJobId(null); // Reset ppJobId after handling
        }
      }
    };
    ws.onerror = (err) => {
      setMessage("Loading pre-process results is Failed");
      setHasMessage(true);
      setIsError(true);
      setExpandLoading((prevLoading) => ({ ...prevLoading, [details.processId]: false }));
      setLoading(false);
      console.error("WebSocket error:", err);
      setppJobId(null); // Reset ppJobId after handling
    }
    ws.onclose = () => console.log("WebSocket closed.");

    return () => ws.close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ppJobId]);

  const [sectionsVisibility, setSectionsVisibility] = useState({
    metadataInfo: true,
    preprocessResults: true
  });

  const toggleSectionVisibility = (section) => {
    setSectionsVisibility((prevVisibility) => ({
      ...prevVisibility,
      [section]: !prevVisibility[section],
    }));
  };

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const id = queryParams.get('datasetId');
    setDatasetId(id);

    if (id) {
      // Fetch the dataset based on datasetId using axios
      axios.post(`${NODE_API_URL}/item/getDatasetInfoWithPreProcessResults`, { datasetId: id })
        .then(response => {
          setDatasetDetails(response.data);
          setMessage(`Successfully fetched details for the dataset ID: ${id}.`);
          setHasMessage(true);
          setIsError(false);
          setLoading(false);
        })
        .catch(error => {
          console.error(`Error fetching dataset details for dataset ID ${id}:`, error);
          setMessage(`Error fetching dataset details for dataset ID ${id}.`);
          setHasMessage(true);
          setIsError(true);
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [location.search]);

  if (loading) {
    return (
      <div className="spinner-container">
        <ScaleLoader color="#36d7b7" loading={loading} />
      </div>
    );
  }

  return (
    <div className="single-dataset-details-page eighty-twenty-grid">
      <div className="main-content">
        {hasMessage && (
          <AlertMessageComponent message={message} setHasMessage={setHasMessage} setMessage={setMessage} isError={isError} />
        )}
        <h1>Details for dataset Id: {datasetId}&nbsp;&nbsp;
          <CopyToClipboard text={datasetId} onCopy={() => handleCopy()}>
            <button style={{
              // position: 'absolute',
              // top: '50%',
              background: 'lightgrey',
              color: 'black',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              // padding: '5px 10px',
            }}>{copiedState ? 'Copied!' : 'Copy'}</button>
          </CopyToClipboard>
        </h1>
        {datasetDetails.length > 0 ? (
          datasetDetails.map((detail, index) => (
            <div key={index}>
              <div className='section'>
                <div className='section-heading' onClick={() => toggleSectionVisibility('metadataInfo')}>
                  <h3>Dataset Metadata</h3>
                  <span className="category-icon">
                    <FontAwesomeIcon
                      icon={sectionsVisibility.metadataInfo ? faAngleDown : faAngleRight}
                    />
                  </span>
                </div>
                <div className='section-content' style={{ display: sectionsVisibility.metadataInfo ? 'block' : 'none' }}>
                  <Card className="dataset-info-results">
                    <CardContent>
                      <DatasetDetailsTable
                        datasetDetails={detail.datasetDetails}
                        downloadFile={downloadFile}
                        getFileNameFromURL={getFileNameFromURL}
                      />
                    </CardContent>
                  </Card>
                </div>
              </div>
              <div className='section'>
                <div className='section-heading' onClick={() => toggleSectionVisibility('preprocessResults')}>
                  <h3>Pre Process Results</h3>
                  <span className="category-icon">
                    <FontAwesomeIcon
                      icon={sectionsVisibility.preprocessResults ? faAngleDown : faAngleRight}
                    />
                  </span>
                </div>
                <div className='section-content' style={{ display: sectionsVisibility.preprocessResults ? 'block' : 'none' }}>
                  <React.Fragment>
                    <Card className="dataset-info-results">
                      <CardContent>
                        <div>
                          {detail.preProcessResults.length > 0 ? (
                            detail.preProcessResults.map((preProcessResult, index) => (
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
                                          {details[preProcessResult.process_id]?.tools && (
                                            <Descriptions.Item label="Tools">
                                              <div style={panelStyle}>
                                                <pre>
                                                  {JSON.stringify(details[preProcessResult.process_id]?.tools, null, 2)}
                                                </pre>
                                              </div>
                                            </Descriptions.Item>
                                          )}

                                          {/* Additional file download links if available */}
                                          {/* <Descriptions.Item label="Files">
                                      <Descriptions>
                                        {details[preProcessResult.process_id].adata_path && (
                                          <Descriptions.Item label="AnnData File:">
                                            <a
                                              download
                                              onClick={() => { downloadFile(details[preProcessResult.process_id]["adata_path"]) }}
                                              style={{
                                                textAlign: 'center',
                                                cursor: 'pointer',
                                                textDecoration: 'underline',
                                                color: 'blue'
                                              }}
                                            >
                                              {getFileNameFromURL(details[preProcessResult.process_id]["adata_path"]) || 'Not available'}
                                            </a>
                                          </Descriptions.Item>
                                        )}
                                        {details[preProcessResult.process_id].seurat_path && (
                                          <Descriptions.Item label="Seurat File">
                                            <a
                                              download
                                              onClick={() => { downloadFile(details[preProcessResult.process_id]["seurat_path"]) }}
                                              style={{
                                                textAlign: 'center',
                                                cursor: 'pointer',
                                                textDecoration: 'underline',
                                                color: 'blue'
                                              }}
                                            >
                                              {getFileNameFromURL(details[preProcessResult.process_id]["seurat_path"]) || 'Not available'}
                                            </a>
                                          </Descriptions.Item>
                                        )}
                                            </Descriptions>
                                    </Descriptions.Item> */}
                                          <Descriptions.Item label="Files">
                                            <div>
                                              {details[preProcessResult.process_id].adata_path && (
                                                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                                                  <span style={{ marginRight: '8px' }}>AnnData File:</span>
                                                  <button type="button"
                                                    onClick={(e) => { e.preventDefault(); downloadFile(details[preProcessResult.process_id]["adata_path"]) }}
                                                    style={{
                                                      background: 'none',
                                                      border: 'none',
                                                      padding: 0,
                                                      font: 'inherit',
                                                      cursor: 'pointer',
                                                      textDecoration: 'underline',
                                                      color: 'blue'
                                                    }}
                                                  >
                                                    {getFileNameFromURL(details[preProcessResult.process_id]["adata_path"]) || 'Not available'}
                                                  </button>
                                                </div>
                                              )}
                                              {details[preProcessResult.process_id].seurat_path && (
                                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                                  <span style={{ marginRight: '8px' }}>Seurat File:</span>
                                                  <button type="button"
                                                    onClick={(e) => { e.preventDefault(); downloadFile(details[preProcessResult.process_id]["seurat_path"]) }}
                                                    style={{
                                                      background: 'none',
                                                      border: 'none',
                                                      padding: 0,
                                                      font: 'inherit',
                                                      cursor: 'pointer',
                                                      textDecoration: 'underline',
                                                      color: 'blue'
                                                    }}
                                                  >
                                                    {getFileNameFromURL(details[preProcessResult.process_id]["seurat_path"]) || 'Not available'}
                                                  </button>
                                                </div>
                                              )}
                                            </div>
                                          </Descriptions.Item>

                                        </Descriptions>
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                          {/* <p>Plots:</p> */}
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
                                                        <div style={{ textAlign: 'center', width: '100%' }}>2D  t-SNE plot does not exist.</div>
                                                      )
                                                    ) : tsnePlotDimension === '3D' ? (
                                                      tsnePlotData && tsnePlotData.tsne_plot_3d ? (
                                                        <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                                                          <ReactPlotly plot_data={tsnePlotData.tsne_plot_3d} />
                                                        </div>
                                                      ) : (
                                                        <div style={{ textAlign: 'center', width: '100%' }}>3D  t-SNE plot does not exist.</div>
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
                                            {details[preProcessResult.process_id].zarr_path && (
                                              <>
                                                <h2>Gene Expression</h2>
                                                <div style={{ display: 'flex', justifyContent: 'center', width: '100%', height: '920px' }}>
                                                  <ShowVitessce
                                                    processId={details[preProcessResult.process_id].process_id}
                                                    description={details[preProcessResult.process_id].description}
                                                    zarrPath={details[preProcessResult.process_id].zarr_path}
                                                    initialFeatureFilterPath={details[preProcessResult.process_id].initialFeatureFilterPath}
                                                    obsEmbedding={details[preProcessResult.process_id].obsEmbedding}
                                                    obsSets={details[preProcessResult.process_id].obsSets}
                                                  />
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
                            <p>No Pre Process Results to show for the dataset.</p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </React.Fragment>
                </div>
              </div>
            </div>
          ))
        ) : (
          <p>No data found</p>
        )}
      </div>

      <div>
        {(getCookie('jwtToken') !== undefined || getCookie('jwtToken') !== '') && (<div className="right-rail">
          <RightRail />
        </div>)}
      </div>
    </div>
  );
};

export default DatasetInfoComponent;

import React, { useEffect, useState } from 'react';
import { CELERY_BACKEND_API, NODE_API_URL } from '../../../constants/declarations';
import { ScaleLoader } from 'react-spinners';
import AlertMessageComponent from './alertMessageComponent';
import BenchmarksPlots from './benchmarksPlots';
import useWebSocket from '../../MyData/MyTasks/useWebSocket';
import { Typography, Card, CardContent } from '@mui/material';
import LogComponent from '../../common_components/liveLogs';
import axios from 'axios';


function BenchmarksTaskComponent({ setTaskStatus, taskData, setTaskData, setActiveTask, activeTask }) {

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [hasMessage, setHasMessage] = useState(message !== '' && message !== undefined);
  const [wsLogs, setWsLogs] = useState('');
  const [currentStatus, setCurrentStatus] = useState(null); // Set to null initially
  const [jobId, setjobId] = useState('');
  const [celeryTaskResults, setCeleryTaskResults] = useState({});

  const fetchBenchmarksResults = async (benchmarksId) => {
    if (!benchmarksId) return;

    try {
      const response = await axios.post(`${NODE_API_URL}/getBenchmarksResults`, { benchmarksId });
      console.log('Benchmarks Results:', response.data);
      const benchmarksResults = response.data;
      if (Array.isArray(benchmarksResults)) {

        // Update the benchmarks section in taskData with the received results
        setTaskData((prevTaskData) => ({
          ...prevTaskData,
          benchmarks: {
            benchmarks_results: benchmarksResults,
          },
        }));
      } else {
        console.error('Invalid response format');
        setMessage('Invalid response format');
        setHasMessage(true);
        setIsError(true);
      }
      setLoading(false);
    } catch (error) {
      console.error('There was a problem with the axios operation:', error.response ? error.response.data : error.message);
      setLoading(false);
      setHasMessage(true);
      setMessage("Failed to retrieve pre processed results from MongoDB");
      setIsError(true);
    }
  };

  const handleTaskCompletion = () => {

    // Update the fileMappings state with the new list
    setTaskData((prevTaskData) => ({
      ...prevTaskData,
      benchmarks: {
        ...prevTaskData.benchmarks,
        status: 'completed'
      },
    }));

    // After Task 6 is successfully completed, update the task status
    setTaskStatus((prevTaskStatus) => ({
      ...prevTaskStatus,
      6: true, // Mark Task 6 as completed
    }));
    //The current task is finished, so make the next task active
    setActiveTask(6);
  };


  const handleStatusMessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      if (data.task_status) {
        setCurrentStatus(data.task_status);
        if (data.task_status === "SUCCESS" || data.task_status === "FAILURE") {
          setCeleryTaskResults(data);
        }
      }
    } catch (error) {
      setLoading(false);
      console.error("Error parsing status message:", error);
    }
  };

  const handleLogMessage = (event) => {
    setWsLogs((prevLogs) => prevLogs + event.data);
    // Auto-scroll to the bottom of the logs
    const logsElement = document.getElementById("_live_logs");
    if (logsElement) {
      logsElement.scrollTop = logsElement.scrollHeight;
    }
  };



  const { closeWebSockets } = useWebSocket(jobId, handleStatusMessage, handleLogMessage, setLoading);

  useEffect(() => {
    if (taskData.benchmarks.status !== 'completed') {

      if (taskData.task_builder && taskData.task_builder.selectedDatasets) {
        setLoading(true);

        const selectedDatasets = taskData.task_builder.selectedDatasets;

        let body = Object.entries(selectedDatasets).map(([key, dataset], index) => ({
          benchmarksId: dataset.taskType.value + "-" + dataset.Id,
          datasetId: dataset.Id,
          userID: dataset.Owner,
          task_type: dataset.taskType.label,
          // adata_path: dataset.dataSplit.adataPath,
          adata_path: dataset.adata_path,
          label: dataset?.taskLabel?.label || '',
          ccc_target: dataset?.cccTarget?.label || '',
          batch_key: dataset?.batch_key?.label || '',
          bm_traj: dataset?.BMTraj?.label || '',
          origin_group: dataset?.originGroup?.label || '',
          celltypist_model: dataset?.celltypist_model?.label || '',
          SingleR_ref: dataset?.SingleR_ref?.map(item => item.label) || [],
          mod1: dataset?.mod1?.label || '',
          mod2: dataset?.mod2?.label || '',
          species: dataset?.Species?.label.toLowerCase() || 'mouse',
        }));
        const postBody = body[0];

        fetch(`${CELERY_BACKEND_API}/benchmarks/create`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(postBody),
        })
          .then((response) => response.json())
          .then((data) => {
            const jobId = data.job_id;
            setjobId(jobId);
          })
          .catch((error) => {
            console.error('Error during API call:', error);
            setMessage(`Error during API call: ${error}`);
            setHasMessage(true);
            setIsError(true);
            setLoading(false);
          });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (currentStatus === "SUCCESS" || currentStatus === "FAILURE") {
      closeWebSockets(); // Close WebSockets when task is done
      if (currentStatus === "SUCCESS") {
        fetchBenchmarksResults(celeryTaskResults.task_result.benchmarksId);
        setMessage("Benchmarks Process is Successful");
        setHasMessage(true);
        setIsError(false);
      } else if (currentStatus === "FAILURE") {
        setMessage("Benchmarks Process is Failed");
        setHasMessage(true);
        setIsError(true);
      }
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStatus]); // Empty dependency array ensures this runs on mount and unmount only


  return (
    <div className='benchmarks-task'>

      {hasMessage && <AlertMessageComponent message={message} setHasMessage={setHasMessage} setMessage={setMessage} isError={isError} />}

      <LogComponent wsLogs={wsLogs} />

      {loading ? (
        <div className="spinner-container">
          <ScaleLoader color="#36d7b7" loading={loading} />
        </div>
      ) : (
        <>
          {/* Iterate over benchmarks_results and call BenchmarksPlot */}
          {taskData.benchmarks &&
            taskData.benchmarks.benchmarks_results &&
            taskData.benchmarks.benchmarks_results.map((result, index) => (
              <React.Fragment key={index}>
                <Card key={index} className="benchmarks-results">
                  <CardContent>
                    <Typography variant="body2">Benchmark Results for {result.datasetId}</Typography>
                    <BenchmarksPlots
                      benchmarksPlot={result.benchmarks_plot}
                      utilizationPlot={result.utilization_plot}
                    />
                  </CardContent>
                </Card>
              </React.Fragment>
            ))}

          <div className='navigation-buttons'>
            <div className="previous">
              <button type="submit" className="btn btn-info button" onClick={() => setActiveTask(activeTask - 1)}>
                Previous
              </button>
            </div>
            <div className="next-upon-success">
              <button type="submit" className="btn btn-info button" onClick={handleTaskCompletion}>
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default BenchmarksTaskComponent;

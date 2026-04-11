import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import { NODE_API_URL } from '../../../constants/declarations';
import { ScaleLoader } from 'react-spinners';
import AlertMessageComponent from '../../publishDatasets/components/alertMessageComponent';
import { Card, CardContent, Typography } from '@mui/material';
import { faAngleDown, faAngleRight } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { downloadFile, getFileNameFromURL, getCookie } from '../../../utils/utilFunctions';
import BenchmarksPlots from '../../publishDatasets/components/benchmarksPlots';
import DatasetDetailsTable from './DatasetDetailsTable';
import TaskInfoTable
  from './TaskInfoTable';
import RightRail from '../../RightNavigation/rightRail';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import Chatbot from "../../RightNavigation/Chatbot";


const BenchmarksViewDetailsComponent = () => {
  const location = useLocation();
  const [benchmarksId, setBenchmarksId] = useState(null);
  const [benchmarksDetails, setBenchmarksDetails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [hasMessage, setHasMessage] = useState(false);
  const [isError, setIsError] = useState(false);
  const [copiedState, setCopiedState] = useState(false);
  const [presetQuestions, setPresetQuestions] = useState(null);

  const handleCopy = () => {
    setCopiedState(true);
    setTimeout(() => setCopiedState(false), 2000); // Reset after 2 seconds
  };

  const [sectionsVisibility, setSectionsVisibility] = useState({
    metadataInfo: true,
    taskInfo: true,
    benchmarks: true,
  });

  const toggleSectionVisibility = (section) => {
    setSectionsVisibility((prevVisibility) => ({
      ...prevVisibility,
      [section]: !prevVisibility[section],
    }));
  };

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const id = queryParams.get('benchmarksId');
    setBenchmarksId(id);

    if (id) {
      // Fetch the dataset based on benchmarksId using axios
      axios.post(`${NODE_API_URL}/single/getBenchmarksResultsWithDatasetDetails`, { benchmarksId: id })
        .then(response => {
          setBenchmarksDetails(response.data);
          if (response.data[0]?.task_type) {
            setPresetQuestions([
              { title: `How do I interpret the results of the ${response.data[0]?.task_type} task?`, "prompt": `How do I interpret the results of the ${response.data[0]?.task_type} task in single-cell sequencing data analysis?` }
            ]);
            console.log("presetQuestions:", presetQuestions);
          }
          setMessage(`Successfully fetched details for the benchmarks ID - ${id}.`);
          setHasMessage(true);
          setIsError(false);
          setLoading(false);
        })
        .catch(error => {
          console.error(`Error fetching benchmarks details for benchmark ID - ${id}:`, error);
          setMessage(`Error fetching benchmarks details for benchmark ID - ${id}.`);
          setHasMessage(true);
          setIsError(true);
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  if (loading) {
    return (
      <div className="spinner-container">
        <ScaleLoader color="#36d7b7" loading={loading} />
      </div>
    );
  }

  return (
    <div className="single-benchmark-details-page eighty-twenty-grid">
      <div className="main-content">
        {hasMessage && (
          <AlertMessageComponent message={message} setHasMessage={setHasMessage} setMessage={setMessage} isError={isError} />
        )}
        <h1>Details for BenchmarksId: {benchmarksId}&nbsp;&nbsp;
          <CopyToClipboard text={benchmarksId} onCopy={() => handleCopy()}>
            <button style={{
              //position: 'absolute',
              background: 'lightgrey',
              color: 'black',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              // padding: '5px 10px',
            }}>{copiedState ? 'Copied!' : 'Copy'}</button>
          </CopyToClipboard>
        </h1>
        {benchmarksDetails.length > 0 ? (
          benchmarksDetails.map((detail, index) => (
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
                  <Card className="benchmarks-results">
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
                <div className='section-heading' onClick={() => toggleSectionVisibility('taskInfo')}>
                  <h3>Task Info</h3>
                  <span className="category-icon">
                    <FontAwesomeIcon
                      icon={sectionsVisibility.taskInfo ? faAngleDown : faAngleRight}
                    />
                  </span>
                </div>
                <div className='section-content' style={{ display: sectionsVisibility.taskInfo ? 'block' : 'none' }}>
                  <Card className="benchmarks-results">
                    <CardContent>
                      <TaskInfoTable
                        detail={detail}
                        downloadFile={downloadFile}
                        getFileNameFromURL={getFileNameFromURL}
                      />
                    </CardContent>
                  </Card>
                </div>
              </div>
              <div className='section'>
                <div className='section-heading' onClick={() => toggleSectionVisibility('benchmarks')}>
                  <h3>Benchmarks</h3>
                  <span className="category-icon">
                    <FontAwesomeIcon
                      icon={sectionsVisibility.benchmarks ? faAngleDown : faAngleRight}
                    />
                  </span>
                </div>
                <div className='section-content' style={{ display: sectionsVisibility.benchmarks ? 'block' : 'none' }}>
                  <React.Fragment>
                    <Card className="benchmarks-results">
                      <CardContent>
                        <Typography variant="body2">Benchmark Results for {detail.datasetId}</Typography>
                        <BenchmarksPlots
                          benchmarksPlot={detail.benchmarks_plot}
                          utilizationPlot={detail.utilization_plot}
                        />
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
          <Chatbot presetQuestions={presetQuestions} />
        </div>)}
      </div>
    </div>
  );
};

export default BenchmarksViewDetailsComponent;

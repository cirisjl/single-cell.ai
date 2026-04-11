// import leftNav from "../components/leftNav";
import IntermediateFiles from "../components/MyData/intermediatefiles";
import RightRail from "../components/RightNavigation/rightRail";
import { useLocation } from 'react-router-dom';
import React, { useState, useEffect } from 'react';

export default function ResultFiles() {
    const location = useLocation();
    const [jobId, setjobId] = useState('');
    const [resultsPath, setResultsPath] = useState('');
    const [taskTitle, setTaskTitle] = useState('');

    useEffect(() => {
        const searchParams = new URLSearchParams(location.search);
        const jobId = searchParams.get('jobId');
        const resultsPath = searchParams.get('results_path');
        const taskTitle = searchParams.get('task_title');
        setjobId(jobId);
        setResultsPath(resultsPath);    
        setTaskTitle(taskTitle);

      }, [location.search]);


    return(
        <div className="page-container">
            <div className="left-nav">
                {/* <LeftNav /> */}
            </div>
            <div className="main-content">
                <IntermediateFiles jobId={jobId} results_path={resultsPath} task_title={taskTitle}/>
            </div>
            <div className="right-rail">
                <RightRail />
            </div>
        </div>
    )
}
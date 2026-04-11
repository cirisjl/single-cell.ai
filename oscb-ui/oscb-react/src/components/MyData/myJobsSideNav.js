import React, { useState, useEffect } from 'react';
import moment from 'moment';
import { faArrowUpRightFromSquare, faAngleRight, faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { getCookie } from '../../utils/utilFunctions';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import { useNavigate } from 'react-router-dom';
import TextWithEllipsis from '../RightNavigation/textWithEllipsis';
import {
    Accordion,
    AccordionSummary,
    AccordionDetails
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { NODE_API_URL, WEB_SOCKET_URL } from '../../constants/declarations'

const MyJobsSideNav = () => {
    const [expanded, setExpanded] = useState(false);
    const [tasks, setTasks] = useState([]);
    const [changesFound, setChangesFound] = useState(false);
    let jwtToken = getCookie('jwtToken');
    const navigate = useNavigate();

    useEffect(() => {
        if (jwtToken && expanded) {
            const fetchTasks = async () => {
                const response = await fetch(`${NODE_API_URL}/getJobs?top=5`,
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${jwtToken}`,
                        }
                    }
                );
                const data = await response.json();
                console.log(data);
                data.results.sort((a, b) => b['Created on'] - a['Created on']);
                setTasks(data.results);

                // Create a list to store incomplete tasks
                const incompleteTasks = [];

                // Iterate over each task and check if its status is null
                data.results.forEach(task => {
                    if (task.Status === null) {
                        incompleteTasks.push(task.job_id);
                    }
                });

                if (incompleteTasks && incompleteTasks.length > 0) {
                    let webSocketParam = incompleteTasks.join(',');
                    const socket = new WebSocket(`${WEB_SOCKET_URL}/taskStatus/${webSocketParam}`);
                    socket.onopen = () => {
                        console.log('Socket connected');
                    };
                    socket.onclose = () => {
                        console.log('Socket disconnected');
                    };

                    let finishedTasks = [];
                    let failedTasks = [];
                    socket.onmessage = async (event) => {
                        const data = JSON.parse(event.data);
                        Object.keys(data).forEach(jobId => {
                            const status = data[jobId];
                            if (status === 'Success') {
                                finishedTasks.push(jobId);
                            }
                            else if (status === 'Failure') {
                                failedTasks.push(jobId);
                            }
                        });
                        if (finishedTasks.length + failedTasks.length > 0) {
                            // await updateTaskStatus(failedTasks, 'Failure');
                            // await updateTaskStatus(finishedTasks, 'Success');
                            // Close the WebSocket connection
                            socket.close(1000, 'See you again!');
                            setChangesFound(!changesFound);
                        }
                    };
                }
            };
            fetchTasks();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [changesFound, expanded]);

    // const updateTaskStatus = async (jobIds, status) => {
    //     try {
    //         const jobIdString = jobIds.join(',');
    //         const response = await fetch(`${NODE_API_URL}/updateTaskStatus`, {
    //             method: 'PUT',
    //             headers: {
    //                 'Content-Type': 'application/json'
    //             },
    //             body: JSON.stringify({
    //                 jobIds: jobIdString,
    //                 status: status
    //             })
    //         });
    //         const data = await response.json();
    //         console.log(data);
    //         return data; // return the data from the function
    //     } catch (error) {
    //         console.error(error);
    //         throw error; // throw the error so that the caller can handle it
    //     }
    // };

    const toggleExpand = () => {
        setExpanded(!expanded);
    };

    if (jwtToken)
        return (
            <div className="expandable">
                <div className="header" onClick={toggleExpand}>
                    <span className={`arrow ${expanded ? 'expanded' : ''}`}>
                        <FontAwesomeIcon icon={faAngleRight} />
                    </span>
                    <span className="title">My Jobs</span>
                    &nbsp;
                    <FontAwesomeIcon
                        icon={faArrowUpRightFromSquare}
                        className="hoverable-icon"
                        onClick={() => { navigate('/myJobs') }}
                        style={{ textAlign: 'right' }}
                    />
                </div>
                {expanded && (
                    <div className="content">
                        <div style={{ maxHeight: '360px', overflow: 'auto' }}>

                            {tasks && tasks.length === 0 ? (
                                <div>
                                    <div>
                                        <div role="alert" aria-live="polite" aria-atomic="true" className="alert m-2 alert-info">
                                            <h4 className="mb-1">
                                                <FontAwesomeIcon icon={faInfoCircle} />
                                                <span>Your job list is empty.</span>
                                            </h4>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <ul>
                                    {tasks.map((task, index) => (
                                        <div key={tasks.job_id}>
                                            <Accordion key={tasks.job_id}>
                                                <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls="panel-content" id="panel-header">
                                                    <div className="panel-summary">
                                                        <div className='task-summary'>
                                                            <div className='display-flex'>
                                                                {task.Status === 'Success' ? (
                                                                    <CheckCircleIcon style={{ color: 'green' }} />
                                                                ) : task.Status === 'Failure' ? (
                                                                    <CancelIcon style={{ color: 'red' }} />
                                                                ) : (
                                                                    <HourglassEmptyIcon style={{ color: 'gray' }} />
                                                                )}
                                                                <p><TextWithEllipsis text={task.Description} maxLength={23} /></p>
                                                            </div>
                                                            <span className='time-stamp-display'>- {moment.utc(task['Created on']).local().format("YYYY-MM-DD HH:mm:ss")}</span>
                                                        </div>
                                                        {/* <li style={{
                                    backgroundColor: 'transparent', // Set initial background color
                                    transition: 'background-color 0.3s', // Add transition effect
                                    cursor: 'pointer' // Show pointer cursor on hover
                                }}
                                    onMouseEnter={(e) => { e.target.style.backgroundColor = '#f2f2f2' }} // Change background color on hover
                                    onMouseLeave={(e) => { e.target.style.backgroundColor = 'transparent' }} // Revert back to initial background color on mouse leave 
                                    key={index}> */}
                                                        {/* <a
                                        href={`/resultfiles?jobId=${task.job_id}&results_path=${task.results_path}`}
                                        style={{ textDecoration: 'none', color: 'inherit' }}
                                    > 
                                        {task.Status === 'Success' ? (
                                        <CheckCircleIcon style={{ color: 'green' }} />
                                    ) : task.Status === 'Failed' ? (
                                        <CancelIcon style={{ color: 'red' }} />
                                    ) : (
                                        <HourglassEmptyIcon style={{ color: 'gray' }} />
                                    )}
                                    &nbsp;{task.job_id}
                                    </a> */}
                                                        {/* </li> */}
                                                    </div>
                                                </AccordionSummary>
                                                <AccordionDetails>
                                                    <button type="button"
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            if (task.Category && task.Category.toLowerCase() === 'workflow') {
                                                                navigate("/mydata/workflowTaskDetails", {
                                                                    state: {
                                                                        job_id: task.job_id,
                                                                        methodMap: task.Method,
                                                                        datasetURL: task.datasetURL,
                                                                        description: task.Description,
                                                                        process: task.Process,
                                                                        output: task.output,
                                                                        results: task.results,
                                                                        status: task.Status
                                                                    }
                                                                });
                                                            } else {
                                                                navigate("/mydata/taskDetails", {
                                                                    state: {
                                                                        job_id: task.job_id,
                                                                        method: task.Method,
                                                                        datasetURL: task.datasetURL,
                                                                        description: task.Description,
                                                                        process: task.Process,
                                                                        output: task.output,
                                                                        results: task.results,
                                                                        status: task.Status
                                                                    }
                                                                });
                                                            }
                                                        }}
                                                        // href={`/mydata/taskDetails?jobId=${task.job_id}`}
                                                        style={{ background: 'none', border: 'none', padding: 0, font: 'inherit', color: 'inherit', cursor: 'pointer', textAlign: 'left' }}
                                                    >
                                                        <span className='font-size'><b>Task Id</b> - {task.job_id}</span>
                                                    </button>
                                                </AccordionDetails>
                                            </Accordion>
                                        </div>
                                    ))
                                    }
                                </ul>
                            )}
                        </div>
                    </div>
                )}
            </div>
        );
};

export default MyJobsSideNav;
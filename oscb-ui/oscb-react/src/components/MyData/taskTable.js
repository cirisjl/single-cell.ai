import { faEye, faTrash } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useEffect, useState, useMemo } from 'react';
import { Button, Table, Popconfirm } from 'antd';
import axios from 'axios';
import moment from 'moment';
import { getCookie } from '../../utils/utilFunctions';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import { faQuestionCircle } from '@fortawesome/free-solid-svg-icons';
import Intl from 'intl';
import 'intl/locale-data/jsonp/en-US';
import { useNavigate } from 'react-router-dom';
import { NODE_API_URL, WEB_SOCKET_URL, CELERY_BACKEND_API } from '../../constants/declarations'
import { ScaleLoader } from 'react-spinners';
// import Button from '@mui/material/Button';


const TaskTable = () => {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [changesFound, setChangesFound] = useState(false);
    const [colFilters, setColFilters] = useState({});
    const [globalSearchTerm, setGlobalSearchTerm] = useState('');
    const [filteredInfo, setFilteredInfo] = useState({});
    const [sortedInfo, setSortedInfo] = useState({});
    const handleChange = (pagination, filters, sorter) => {
        console.log('Various parameters', pagination, filters, sorter);
        setPagination({
            ...pagination,
        });
        setFilteredInfo(filters);
        setSortedInfo(sorter);
    };

    // const clearFilters = () => {
    //     setFilteredInfo({});
    //     console.log('Cleared filters', filteredInfo);
    // };

    // const clearAll = () => {
    //     setFilteredInfo({});
    //     setSortedInfo({});
    //     console.log('Cleared all', sortedInfo);
    // };

    let jwtToken = getCookie('jwtToken');
    const navigate = useNavigate();
    const timestampScheme = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        hour12: true
    };

    const sortByDateWithNulls = (a, b, dateField) => {
        // Handle null values:
        if ((a === null || a === 'N/A') && (b === null || b === 'N/A')) {
            return 0; // Both are null, considered equal for sorting purposes
        }
        if (a === 'N/A' || a === null) {
            return 1; // 'a' is null, move it to the end
        }
        if (b === 'N/A' || b === null) {
            return -1; // 'b' is null, move it to the end
        }

        const dateA = a[dateField] ? new Date(a[dateField]) : null;
        const dateB = b[dateField] ? new Date(b[dateField]) : null;

        return dateA.getTime() - dateB.getTime();
    };

    const objectToString = (input) => {
        if (typeof input === "object") {
            input = JSON.stringify(input).replaceAll('{', '').replaceAll('}', '').replaceAll('[', '').replaceAll(']', '').replaceAll('"', '');
        }
        return input;
    }

    const stringToDate = (input) => {
        if (input && input !== 'N/A') {
            return new Intl.DateTimeFormat('en-US', timestampScheme).format(new Date(moment.utc(input).local()));
        } else {
            return 'N/A';
        }
    }

    const sortByObject = (a, b, dateField) => {
        // Handle null values:
        if (typeof a[dateField] === "object") {
            a[dateField] = JSON.stringify(a[dateField]);
        }
        if (typeof b[dateField] === "object") {
            b[dateField] = JSON.stringify(b[dateField]);
        }

        return a[dateField].localeCompare(b[dateField]);
    };

    const [pagination, setPagination] = useState({
        current: 1,
        // position: ["topCenter"],
        pageSize: 10, // default number of rows per page
        pageSizeOptions: ['5', '10', '20', '50'], // options for the number of rows per page
        showSizeChanger: true, // show the dropdown to select page size
    });

    const fetchJobs = async (currentPage, searchQuery) => {
        setLoading(true);
        try {
            const response = await fetch(`${NODE_API_URL}/getJobs?q=${searchQuery}&page=${currentPage}`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${jwtToken}`,
                    },
                }
            );
            let data = await response.json();
            data.results.sort((a, b) => a['Created on'] - b['Created on']);
            console.log(data);
            const jobResults = data.results.map(item => ({
                ...item,
                Method: objectToString(item.Method),
                methodMap: item.Method // Copying the 'Method' column to 'methodMap'
            }));
            setJobs(jobResults);
            data.facets.Method = data.facets.Method.map(item => ({
                ...item,
                _id: objectToString(item._id),
            }));
            setColFilters(data.facets);
            // setPagination(data.pagination);
            setPagination({
                ...pagination,
            });
            setLoading(false)
            console.log('Fetched jobs:', data);

            // Create a list to store incomplete jobs
            const incompleteTasks = [];

            // Iterate over each task and check if its status is null
            data.results.forEach(task => {
                if (task.Status === null) {
                    incompleteTasks.push(task.job_id);
                }
            });

            if (incompleteTasks.length > 0) {
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
        } catch (error) {
            console.error('Error fetching data:', error);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchJobs(pagination.current, globalSearchTerm);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleSearchSubmit = (event) => {
        event.preventDefault();
        fetchJobs(1, globalSearchTerm);
        console.log("Search Handled");
    };

    const handleDelete = (jobID, pagination) => {
        console.log("Delete job: ", jobID);
        // const confirmDelete = window.confirm("Are you sure to delete this job?");
        // if (!confirmDelete) {
        //     return; // If user clicks cancel, do nothing
        // }
        axios.post(`${CELERY_BACKEND_API}/job/revoke/${jobID}`)
            .then(response => {
                axios.delete(`${NODE_API_URL}/deleteJob?jobID=${jobID}`,
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${jwtToken}`,
                        },
                    }
                ).then(response => {
                    console.log('Job is deleted successfully');
                    fetchJobs(pagination.current, globalSearchTerm);
                })
                    .catch(error => {
                        console.error('Error deleting job:', error);
                    });
            })
            .catch(error => {
                console.error('Error deleting job:', error);
            });
    };

    const columns = useMemo(() => {
        if (jobs.length === 0) {
            return [];
        }

        // const baseColumns = Object.keys(jobs[0])
        //     .filter(key => visibleColumns[key])
        //     .map(key => ({
        //         title: key,
        //         dataIndex: key,
        //         key: key,
        //         render: value => {
        //             let res = '';
        //             if (value && typeof value === 'object' && value.label) {
        //                 res = value.label;
        //             } else {
        //                 res = value;
        //             }
        //             return (
        //                 <div 
        //                     data-title={res} 
        //                     className="cell-ellipsis"
        //                     title={res}
        //                 >
        //                     {res}
        //                 </div>
        //             );
        //         }
        //     }));

        const baseColumns = [
            {
                title: 'Description',
                dataIndex: 'Description',
                key: 'Description',
                width: 200,
                fixed: 'left',
                showSorterTooltip: { target: 'full-header' },
                filters: colFilters['Description'].map(filter => ({ text: filter._id + " (" + filter.count + ")", value: filter._id })),
                filteredValue: filteredInfo.Description || null,
                // specify the condition of filtering result
                // here is that finding the name started with `value`
                // onFilter: (value, record) => record.Description.indexOf(value) === 0,
                onFilter: (value, record) => record.Description.includes(value),
                // sorter: (a, b) => a.Description.length - b.Description.length,
                sorter: (a, b) => a.Description.localeCompare(b.Description),
                sortOrder: sortedInfo.columnKey === 'Description' ? sortedInfo.order : null,
                // sortDirections: ['descend'],
                ellipsis: true,
            },
            {
                title: 'Category',
                dataIndex: 'Category',
                key: 'Category',
                showSorterTooltip: { target: 'full-header' },
                filters: colFilters['Category'].map(filter => ({ text: filter._id + " (" + filter.count + ")", value: filter._id })),
                filteredValue: filteredInfo.Category || null,
                // specify the condition of filtering result
                // here is that finding the name started with `value`
                filterSearch: true,
                // onFilter: (value, record) => record.Category.indexOf(value) === 0,
                onFilter: (value, record) => record.Category.includes(value),
                // sorter: (a, b) => a.Category.length - b.Category.length,
                sorter: (a, b) => a.Category.localeCompare(b.Category),
                // sorter: (a, b) => customSorter(a, b, 'Category', sortedInfo.order),
                sortOrder: sortedInfo.columnKey === 'Category' ? sortedInfo.order : null,
                // sortDirections: ['ascend', 'descend'],
                // sortDirections: ['descend'],
                ellipsis: true,
            },
            {
                title: 'Process',
                dataIndex: 'Process',
                key: 'Process',
                showSorterTooltip: { target: 'full-header' },
                filterSearch: true,
                filters: colFilters['Process'].map(filter => ({ text: filter._id + " (" + filter.count + ")", value: filter._id })),
                filteredValue: filteredInfo.Process || null,
                // specify the condition of filtering result
                // here is that finding the name started with `value`
                // onFilter: (value, record) => record.Process.indexOf(value) === 0,
                onFilter: (value, record) => record.Process.includes(value),
                // sorter: (a, b) => a.Process.length - b.Process.length,
                sorter: (a, b) => a.Process.localeCompare(b.Process),
                sortOrder: sortedInfo.columnKey === 'Process' ? sortedInfo.order : null,
                // sortDirections: ['descend'],
                ellipsis: true,
            },
            {
                title: 'Method',
                dataIndex: 'Method',
                key: 'Method',
                showSorterTooltip: { target: 'full-header' },
                filterSearch: true,
                filters: colFilters['Method'].map(filter => ({ text: objectToString(filter._id) + " (" + filter.count + ")", value: filter._id })),
                filteredValue: filteredInfo.Method || null,
                // specify the condition of filtering result
                // here is that finding the name started with `value`
                // onFilter: (value, record) => record.Method.indexOf(value) === 0,
                onFilter: (value, record) => record.Method.includes(value),
                // sorter: (a, b) => a.Method.length - b.Method.length,
                sorter: (a, b) => sortByObject(a, b, 'Method'),
                sortOrder: sortedInfo.columnKey === 'Method' ? sortedInfo.order : null,
                // sortDirections: ['descend'],
                ellipsis: true,
                render: value => (
                    <div>
                        {objectToString(value)}
                    </div>
                )
            },
            {
                title: 'job_id',
                dataIndex: 'job_id',
                key: 'job_id',
                showSorterTooltip: { target: 'full-header' },
                filterSearch: true,
                filters: colFilters['job_id'].map(filter => ({ text: filter._id + " (" + filter.count + ")", value: filter._id })),
                filteredValue: filteredInfo.job_id || null,
                // specify the condition of filtering result
                // here is that finding the name started with `value`
                // onFilter: (value, record) => record.job_id.indexOf(value) === 0,
                onFilter: (value, record) => record.job_id.includes(value),
                sorter: (a, b) => a.job_id.localeCompare(b.job_id),
                // sorter: (a, b) => a.job_id.length - b.job_id.length,
                sortOrder: sortedInfo.columnKey === 'job_id' ? sortedInfo.order : null,
                // sortDirections: ['descend'],
                ellipsis: true,
            },
            {
                title: 'Created on',
                dataIndex: 'Created on',
                key: 'Created on',
                defaultSortOrder: 'descend',
                filterSearch: true,
                filters: colFilters['Created on'].map(filter => ({ text: stringToDate(filter._id) + " (" + filter.count + ")", value: filter._id })),
                filteredValue: filteredInfo['Created on'] || null,
                // onFilter: (value, record) => record['Created on'].includes(value),
                onFilter: (value, record) => record['Created on'].includes(value),
                // sorter: (a, b) => new Date(a['Created on']).getTime() - new Date(b['Created on']).getTime(),
                // sorter: (a, b) => a['Created on'] - b['Created on'],
                sorter: (a, b) => sortByDateWithNulls(a, b, 'Created on'),
                sortOrder: sortedInfo.columnKey === 'Created on' ? sortedInfo.order : null,
                ellipsis: true,
                render: value => (
                    <div>
                        {stringToDate(value)}
                    </div>
                )
            },
            {
                title: 'Completed on',
                dataIndex: 'Completed on',
                key: 'Completed on',
                defaultSortOrder: 'descend',
                filterSearch: true,
                filters: colFilters['Completed on'].map(filter => ({ text: stringToDate(filter._id) + " (" + filter.count + ")", value: filter._id })),
                filteredValue: filteredInfo['Completed on'] || null,
                // onFilter: (value, record) => record['Completed on'].includes(value),
                onFilter: (value, record) => record['Completed on'].includes(value),
                // sorter: (a, b) => new Date(a['Completed on']).getTime() - new Date(b['Completed on']).getTime(),
                sorter: (a, b) => sortByDateWithNulls(a, b, 'Completed on'),
                sortOrder: sortedInfo.columnKey === 'Completed on' ? sortedInfo.order : null,
                ellipsis: true,
                render: value => (
                    <div>
                        {stringToDate(value)}
                    </div>
                )
            },
            {
                title: 'Status',
                key: 'Status',
                showSorterTooltip: { target: 'full-header' },
                filterSearch: true,
                filters: colFilters['Status'].map(filter => ({ text: filter._id + " (" + filter.count + ")", value: filter._id })),
                filteredValue: filteredInfo.Status || null,
                // specify the condition of filtering result
                // here is that finding the name started with `value`
                onFilter: (value, record) => record.Status.includes(value),
                // onFilter: (value, record) => record.Status.indexOf(value) === 0,
                // sorter: (a, b) => a.Status.length - b.Status.length,
                sorter: (a, b) => a.Status.localeCompare(b.Status),
                sortOrder: sortedInfo.columnKey === 'Status' ? sortedInfo.order : null,
                // sortDirections: ['descend'],
                render: record => (
                    <div style={{ textAlign: 'center' }}>
                        {record.Status === 'Success' ? (
                            <CheckCircleIcon style={{ color: 'green' }} />
                        ) : record.Status === 'Failure' ? (
                            <CancelIcon style={{ color: 'red' }} />
                        ) : (
                            <HourglassEmptyIcon style={{ color: 'gray' }} />
                        )}
                    </div>
                )
            },
        ];

        const actionColumn = {
            title: 'Actions',
            key: 'actions',
            fixed: 'right',
            width: 150,
            render: item => {
                return (
                    <div className="action-buttons" style={{ display: 'flex', justifyContent: 'space-between', gap: '20px' }}>
                        <Popconfirm
                            title={`Are you sure you want to delete this Job?`}
                            onConfirm={() => handleDelete(item["Job ID"], pagination)}
                            okText="Yes"
                            cancelText="No"
                        >
                            <Button className="action-button"> <FontAwesomeIcon icon={faTrash} /> </Button>
                        </Popconfirm>

                        <Button
                            onClick={() => {
                                if (item["Category"] && item["Category"].toLowerCase() === 'workflow') {
                                    navigate("/mydata/workflowTaskDetails", {
                                        state: {
                                            job_id: item["job_id"],
                                            methodMap: item["methodMap"],
                                            datasetURL: item["datasetURL"],
                                            description: item["Description"],
                                            process: item["Process"],
                                            output: item["output"],
                                            results: item["results"],
                                            status: item["Status"]
                                        }
                                    });
                                } else {
                                    navigate("/mydata/taskDetails", {
                                        state: {
                                            job_id: item["job_id"],
                                            method: item["methodMap"],
                                            datasetURL: item["datasetURL"],
                                            description: item["Description"],
                                            process: item["Process"],
                                            output: item["output"],
                                            results: item["results"],
                                            status: item["Status"]
                                        }
                                    });
                                }
                            }}
                            className="action-button">
                            <FontAwesomeIcon icon={faEye} />
                        </Button>
                    </div>
                );
            }
        };

        return [...baseColumns, actionColumn];
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [jobs, pagination]);

    useEffect(() => {
        if (!jwtToken)
            navigate('/routing');
        fetchJobs(1);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [changesFound]);


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


    if (jwtToken)
        return (
            <><h1 style={{ textAlign: "left" }}>My Jobs</h1>

                <div className='study-keyword-search'>
                    <span className="text-search search-title">Search by text <FontAwesomeIcon icon={faQuestionCircle} /></span>
                    <div>
                        <p><form onSubmit={handleSearchSubmit} style={{
                            display: 'flex',       // Puts children in a row
                            alignItems: 'center',  // Centers them vertically
                            gap: '8px'             // Adds a small space between the input and button
                        }}>
                            <input
                                type="text"
                                autoComplete="off"
                                className="w-full dark:bg-gray-950 pl-8 form-input-alt h-9 pr-3 focus:shadow-xl"
                                placeholder="Search..."
                                value={globalSearchTerm}
                                onChange={(e) => setGlobalSearchTerm(e.target.value)}
                            />
                            <button type="submit" aria-label="Search" style={{ cursor: "pointer" }}>
                                <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                    <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z" />
                                </svg>
                            </button>
                            {/* <button type="submit">Search</button> */}
                            { /* <svg className="absolute left-2.5 text-gray-400 top-1/2 transform -translate-y-1/2" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" aria-hidden="true" focusable="false" role="img" width="1em" height="1em" preserveAspectRatio="xMidYMid meet" viewBox="0 0 32 32">
                            <path d="M30 28.59L22.45 21A11 11 0 1 0 21 22.45L28.59 30zM5 14a9 9 0 1 1 9 9a9 9 0 0 1-9-9z" fill="currentColor"></path>
                        </svg> */}
                        </form></p>
                    </div>
                </div>

                <div className='table-results'>
                    {/* <Space style={{ marginBottom: 16 }}>
                    <Button onClick={clearFilters}>Clear filters</Button>  
                    <Button onClick={clearAll}>Clear filters and sorters</Button>
                </Space> */}

                    {loading ? (
                        <div className="spinner-container">
                            <ScaleLoader color="#36d7b7" loading={loading} />
                        </div>
                    ) : jobs && jobs.length > 0 ? (
                        <Table
                            className="table-container"
                            columns={columns}
                            dataSource={jobs}
                            rowKey="job_id"
                            pagination={pagination}
                            onChange={handleChange}
                            showSorterTooltip={{ target: 'sorter-icon' }}
                            onRow={(record,) => {
                                return {
                                    onDoubleClick: () => {
                                        if (record["Category"] && record["Category"].toLowerCase() === 'workflow') {
                                            navigate("/mydata/workflowTaskDetails", {
                                                state: {
                                                    job_id: record["job_id"],
                                                    methodMap: record["Method"],
                                                    datasetURL: record["datasetURL"],
                                                    description: record["Description"],
                                                    process: record["Process"],
                                                    output: record["output"],
                                                    results: record["results"],
                                                    status: record["Status"]
                                                }
                                            });
                                        } else {
                                            navigate("/mydata/taskDetails", {
                                                state: {
                                                    job_id: record["job_id"],
                                                    method: record["Method"],
                                                    datasetURL: record["datasetURL"],
                                                    description: record["Description"],
                                                    process: record["Process"],
                                                    output: record["output"],
                                                    results: record["results"],
                                                    status: record["Status"]
                                                }
                                            });
                                        }
                                    }
                                };
                            }}
                        />) : (
                        <div>
                            <p>No job found.</p>
                        </div>
                    )}
                    <div className="pagination-info">
                        <span>* Click the <strong>column headers</strong> to apply <strong>*filters</strong> or <strong>sort</strong> the table.</span><br />
                        <span>* Click <FontAwesomeIcon icon={faTrash} /> to <strong>remove</strong> jobs.</span><br />
                        <span>
                            * Click <FontAwesomeIcon icon={faEye} /> or <strong>double-click</strong> the row to view job details
                        </span>
                    </div>

                </div>
            </>
        );
};

export default TaskTable;
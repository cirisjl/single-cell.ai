import { faEdit, faEye, faTrash, faClipboard } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useState } from 'react';
// import { useTable, useRowSelect } from 'react-table';
import Button from '@mui/material/Button';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Checkbox from '@mui/material/Checkbox';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import ListItemText from '@mui/material/ListItemText';
import { Table } from 'antd';
import axios from 'axios';
import { CELERY_BACKEND_API } from '../../../constants/declarations'
import { CopyToClipboard } from 'react-copy-to-clipboard';


const ResultsTable = ({ data, onSelectDataset, onDeleteDataset, selectedDatasets, multiple, pagination, onSelectSubItem, username = null, isAdmin = false, enableClick = true, showCheckbox = true, showEdit = true, showDelete = true }) => {
    const [anchorEl, setAnchorEl] = useState(null);
    const [subItemsData, setSubItemsData] = useState({});
    const [copiedState, setCopiedState] = useState(false);

    const handleCopy = () => {
        setCopiedState(true);
        setTimeout(() => setCopiedState(false), 2000); // Reset after 2 seconds
    };

    const [paginationState, setPagination] = useState({
        current: 1,
        position: ["topCenter"],
        pageSize: 10, // default number of rows per page
        pageSizeOptions: ['5', '10', '20', '50'], // options for the number of rows per page
        showSizeChanger: true, // show the dropdown to select page size
    });

    // Handle pagination change (page number and page size)
    const handleTableChange = (pagination) => {
        setPagination({
            ...pagination,
        });
    };

    const sortColumn = (a, b, dateField) => {
        if (!a[dateField]) return 1;
        if (!b[dateField]) return -1;
        if (a[dateField] === b[dateField]) return 0;

        if (dateField === 'Submission Date') {
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
        }
        else if (typeof a[dateField] === 'number' && typeof b[dateField] === 'number') {
            return a[dateField] - b[dateField];
        }
        else if (typeof a[dateField] === 'string' && typeof b[dateField] === 'string') {
            return a[dateField].localeCompare(b[dateField]);
        }
        else if (typeof a[dateField] === 'object' || typeof b[dateField] === 'object') {
            // Handle null values:
            if (typeof a[dateField] === "object") {
                a[dateField] = JSON.stringify(a[dateField]);
            }
            if (typeof b[dateField] === "object") {
                b[dateField] = JSON.stringify(b[dateField]);
            }
            return a[dateField].localeCompare(b[dateField]);
        }
        return 0;
    };

    // Destructure the pagination object for easier access to its properties
    // const { page, pageSize, totalCount } = pagination;

    // Calculate the starting and ending result numbers for the current page
    // const startResult = (page - 1) * pageSize + 1;
    // const endResult = Math.min(page * pageSize, totalCount); // Ensure not to exceed totalCount

    const [visibleColumns, setVisibleColumns] = useState({
        // 'Benchmarks ID': true,
        'Dataset ID': true,
        // 'Task': true,
        'Title': true,
        'Category': true,
        'Species': true,
        'Cell Count Estimate': true,
        'Organ Part': true,
        'Development Stage': false, // Optional initially not visible
        'Author': false, // Optional initially not visible
        'Submission Date': false, // Optional initially not visible
        'Source': false, // Optional initially not visible
    });

    const handleMenuClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const toggleColumnVisibility = (column) => {
        console.log("Toggle Column visibility");
        setVisibleColumns(prevVisibleColumns => ({
            ...prevVisibleColumns,
            [column]: !prevVisibleColumns[column],
        }));
    };

    const resetColumnVisibility = () => {
        setVisibleColumns({
            // 'Benchmarks ID': true,
            'Dataset ID': true,
            // 'Task': true,
            'Title': true,
            'Species': true,
            'Cell Count Estimate': true,
            'Organ Part': true,
            'Development Stage': false,
            'Author': false,
            'Submission Date': false,
            'Source': false,
        });
    };

    const handleVisualize = (datasetId) => {
        console.log("Dataset Id: ", datasetId);
        window.open(`/mydata/view-dataset-info?datasetId=${datasetId}`, '_blank');
    };

    const handleEdit = (datasetId) => {
        console.log("Edit dataset Id: ", datasetId);
        window.open(`/mydata/edit-dataset-info?datasetId=${datasetId}`, '_blank');
    };

    const columns = React.useMemo(() => {
        if (data.length === 0) {
            return [];
        }

        const baseColumns = Object.keys(data[0])
            .filter(key => visibleColumns[key])
            .map(key => ({
                title: key,
                dataIndex: key,
                key: key,
                sorter: (a, b) => sortColumn(a, b, key),
                render: value => {
                    let res = '';
                    if (value && typeof value === 'object' && value.label) {
                        res = value.label;
                    } else {
                        res = value;
                    }
                    return (
                        <div
                            data-title={res}
                            className="cell-ellipsis"
                            title={res}
                        >
                            {res}
                        </div>
                    )

                }
            }));

        const actionColumn = {
            title: 'Actions',
            key: 'actions',
            render: item => {
                return (
                    <div className="action-buttons">
                        {showCheckbox && (<input
                            type="checkbox"
                            style={{ cursor: 'pointer' }}
                            onChange={() => onSelectDataset(item)}
                            checked={!!selectedDatasets[item["Id"]]}
                        // disabled={showCheckbox}
                        // disabled={isDisabled() && !isSelected(item["Id"])} // Disable if multiple is false and a dataset is already selecte
                        />)}
                        {username && username === item["Owner"] && showEdit && (<button
                            onClick={() => handleEdit(item["Id"])}
                            // disabled={showEdit}
                            className="action-button">
                            <FontAwesomeIcon icon={faEdit} />
                        </button>)}

                        {username && (isAdmin || username === item["Owner"]) && showEdit && showDelete && (<button
                            onClick={() => onDeleteDataset(item["Id"], item)}
                            className="action-button">
                            <FontAwesomeIcon icon={faTrash} />
                        </button>)}

                        <CopyToClipboard text={item["Id"]} onCopy={() => handleCopy()}>
                            <button className="action-button">
                                <FontAwesomeIcon icon={faClipboard} />
                            </button>
                        </CopyToClipboard>

                        <button
                            onClick={() => handleVisualize(item["Id"])}
                            className="action-button">
                            <FontAwesomeIcon icon={faEye} />
                        </button>


                    </div>
                );
            }
        };
        return [actionColumn, ...baseColumns];
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data, selectedDatasets, visibleColumns]);

    const fetchSubItems = async (process_ids) => {
        const process_ids_key = process_ids.join(',');

        // Check if data already exists for this process_ids_key
        if (subItemsData[process_ids_key]) {
            return; // Data already exists, no need to fetch again
        }

        try {
            const response = await axios.post(CELERY_BACKEND_API + '/getPreProcessResultsMain', { process_ids: process_ids, record_type: "table" });
            setSubItemsData(prevData => ({
                ...prevData,
                [process_ids_key]: response.data // Store the result with concatenated process_ids as key
            }));
        } catch (error) {
            console.error("Error fetching sub-items:", error);
        }
    };


    const expandedRowRender = (record) => {

        const process_ids_key = record.process_ids.join(',');

        // Fetch sub-items only if not already fetched
        if (!subItemsData[process_ids_key]) {
            fetchSubItems(record.process_ids);
        }
        const subColumns = [
            {
                title: 'Description',
                dataIndex: 'description',
                key: 'description',
            },
            {
                title: 'Stage',
                dataIndex: 'stage',
                key: 'stage',
            },
            {
                title: 'Process',
                dataIndex: 'process',
                key: 'process',
            },
            {
                title: 'Method',
                dataIndex: 'method',
                key: 'method',
            },
            {
                title: 'nCells',
                dataIndex: 'nCells',
                key: 'nCells',
            },
            {
                title: 'Action',
                key: 'operation',
                render: (text, subRecord) => (
                    showCheckbox && <Checkbox
                        onChange={() => onSelectSubItem(record, subRecord)}
                        // disabled={showCheckbox}
                        checked={selectedDatasets[record.Id]?.selectedSubItem?.process_id === subRecord.process_id}
                    />
                ),
            },
        ];

        const subData = subItemsData[process_ids_key] || [];
        return <Table columns={subColumns} dataSource={subData} pagination={false} />;
    };

    return (
        <div>
            {copiedState && (
                <div className='message-box success' id="tooltip" style={{ backgroundColor: '#bdf0c0' }}>
                    <div style={{ textAlign: 'center' }}>
                        <p>Dataset ID is copied!</p>
                    </div>
                </div>
            )}
            {/* Dropdown for editing columns */}
            <div className="dropdown">
                <div className='total-results-count'>
                    {/* Do not remove this div. It will remove styles. If you want to remove this div, Add alternate styles to the edit columns without breaking it. */}
                </div>
                <Button variant="contained" aria-controls="edit-columns-menu" aria-haspopup="true" onClick={handleMenuClick} >
                    Edit Columns
                </Button>
                <Menu
                    id="edit-columns-menu"
                    anchorEl={anchorEl}
                    keepMounted
                    open={Boolean(anchorEl)}
                    onClose={handleMenuClose}
                    style={{ height: "400px" }} // Adjusts the vertical position
                    anchorOrigin={{
                        vertical: 'bottom',
                        horizontal: 'right',
                    }}
                    transformOrigin={{
                        vertical: 'top',
                        horizontal: 'right',
                    }}
                    getContentAnchorEl={null} // This will make anchorOrigin work as expected
                >
                    <FormGroup>
                        {Object.keys(visibleColumns).map((column) => (
                            <MenuItem key={column} onClick={(event) => event.stopPropagation()}>
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            checked={visibleColumns[column]}
                                            onChange={() => toggleColumnVisibility(column)}
                                            onClick={(event) => event.stopPropagation()} // Prevent triggering the menu item's onClick
                                        />
                                    }
                                    label={column}
                                // Remove the onClick here to avoid overriding Checkbox's behavior
                                />
                            </MenuItem>
                        ))}
                        {/* Reset Menu Item */}
                        <MenuItem onClick={resetColumnVisibility}>
                            <ListItemText primary="Reset" />
                        </MenuItem>
                    </FormGroup>
                </Menu>
            </div>

            <Table
                className="table-container"
                columns={columns}
                dataSource={data}
                rowKey="Id"
                pagination={paginationState}
                onChange={handleTableChange}
                onRow={(record) => {
                    return {
                        onDoubleClick: () => {
                            if (enableClick) {
                                window.open(`/mydata/view-dataset-info?datasetId=${record['Id']}`, '_blank');
                            }
                        }
                    };
                }}
                expandable={{
                    expandedRowRender: (record) => {
                        fetchSubItems(record.process_ids); // Pass process_ids array
                        return expandedRowRender(record);
                    },
                    rowExpandable: (record) => Array.isArray(record.process_ids) && record.process_ids.length > 0,
                }}
            />
            {<div className="pagination-info">
                <span>* Click the <strong>column headers</strong> to apply <strong>*filters</strong> or <strong>sort</strong> the table.</span><br />
                <span>* Click <strong>+</strong> to expand a row and view the detailed outputs of each processed result.</span><br />
                {showEdit && (<span>* Click <FontAwesomeIcon icon={faEdit} /> to <strong>Edit</strong> dataset.<br /></span>)}
                {showDelete && (<span>* Click <FontAwesomeIcon icon={faTrash} /> to <strong>Delete</strong> dataset.<br /></span>)}
                <span>* Click <FontAwesomeIcon icon={faClipboard} /> to copy <strong>Dataset ID</strong>.</span><br />
                <span>* Click <FontAwesomeIcon icon={faEye} /> </span>
                {enableClick && (
                    <span> or <strong>double-click</strong> the row </span>
                )}
                <span>to view details.</span>
            </div>}
        </div>
    );
};

export default ResultsTable;

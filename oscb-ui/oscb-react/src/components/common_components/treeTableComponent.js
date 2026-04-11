import { faEye, faClipboard } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useState, useMemo } from 'react';
import { Table } from 'antd';
import Checkbox from '@mui/material/Checkbox';
import Menu from '@mui/material/Menu';
import Button from '@mui/material/Button';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import MenuItem from '@mui/material/MenuItem';
import ListItemText from '@mui/material/ListItemText';
import { CopyToClipboard } from 'react-copy-to-clipboard';

const TreeTable = ({ data, onSelectDataset, selectedDatasets, multiple, pagination }) => {
    const [anchorEl, setAnchorEl] = useState(null);
    const [copiedState, setCopiedState] = useState(false);

    const handleCopy = () => {
        setCopiedState(true);
        setTimeout(() => setCopiedState(false), 2000); // Reset after 2 seconds
    };

    // Destructure the pagination object for easier access to its properties
    // const { page, pageSize, totalCount } = pagination;

    // // Calculate the starting and ending result numbers for the current page
    // const startResult = (page - 1) * pageSize + 1;
    // const endResult = Math.min(page * pageSize, totalCount); // Ensure not to exceed totalCount

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

    const [visibleColumns, setVisibleColumns] = useState({
        'Benchmarks ID': true,
        'Dataset ID': true,
        'Task': true,
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
        console.log(visibleColumns[column]);
    };

    const resetColumnVisibility = () => {
        setVisibleColumns({
            'Benchmarks ID': true,
            'Dataset ID': true,
            'Task': true,
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

    const handleVisualize = (benchmarksId) => {
        console.log("Visualizing benchmarksId: ", benchmarksId);
        window.open(`/benchmarks/viewDetails?benchmarksId=${benchmarksId}`, '_blank');
    };

    const columns = useMemo(() => {
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
                    );
                }
            }));

        const actionColumn = {
            title: 'Actions',
            key: 'actions',
            render: item => {
                return (
                    <div className="action-buttons">
                        { /* <Checkbox
                            style={{ cursor: 'pointer' }}
                            onChange={() => onSelectDataset(item)}
                            checked={!!selectedDatasets[item["Benchmarks ID"]]}
                        /> */}

                        <CopyToClipboard text={item["Benchmarks ID"]} onCopy={() => handleCopy()}>
                            <button className="action-button">
                                <FontAwesomeIcon icon={faClipboard} />
                            </button>
                        </CopyToClipboard>

                        <Button
                            onClick={() => handleVisualize(item["Benchmarks ID"])}
                            className="action-button"
                        >
                            <FontAwesomeIcon icon={faEye} />
                        </Button>
                    </div>
                );
            }
        };

        return [actionColumn, ...baseColumns];
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data, visibleColumns]);

    return (
        <div>
            {copiedState && (
                <div className='message-box success' id="tooltip" style={{ backgroundColor: '#bdf0c0' }}>
                    <div style={{ textAlign: 'center' }}>
                        <p>Benchmarks ID is copied!</p>
                    </div>
                </div>
            )}
            {/* Dropdown for editing columns */}
            <div className="dropdown">
                <div className='total-results-count'>
                    {/* Do not remove this div. It will remove styles. If you want to remove this div, Add alternate styles to the edit columns without breaking it. */}
                </div>
                <Button variant="contained" onClick={handleMenuClick}>
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
                onRow={(record,) => {
                    return {
                        onDoubleClick: () => {
                            window.open(`/benchmarks/viewDetails?benchmarksId=${record['Benchmarks ID']}`, '_blank');
                        }
                    };
                }}
            />
            <div className="pagination-info">
                <span>* Click the <strong>column headers</strong> to apply <strong>*filters</strong> or <strong>sort</strong> the table.</span><br />
                <span>* Click <FontAwesomeIcon icon={faClipboard} /> to copy <strong>Benchmarks ID</strong>.</span><br />
                <span>
                    * Click <FontAwesomeIcon icon={faEye} /> or <strong>double-click</strong> the row to view details
                </span>
            </div>
        </div>
    );
};

export default TreeTable;

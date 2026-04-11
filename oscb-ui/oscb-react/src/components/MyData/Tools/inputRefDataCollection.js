import { faDatabase } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useState } from 'react';
import { FormHelperText } from '@mui/material';
import Tooltip from '@mui/material/Tooltip';
import DatasetSelectionDialog from '../../publishDatasets/components/datasetsDialog';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/Delete';
import { styled } from '@mui/material/styles';



// Custom styled components
const ScrollableListContainer = styled('div')(({ theme }) => ({
    maxHeight: '400px', // Fixed height of the container
    overflowY: 'auto', // Enable vertical scrolling
    border: `1px solid ${theme.palette.divider}`, // Add border to distinguish the container
    borderRadius: theme.shape.borderRadius, // Use theme's border radius
    marginTop: theme.spacing(2),
}));

const CustomListItem = styled(ListItem)(({ theme }) => ({
    '&:hover': {
        backgroundColor: theme.palette.action.hover,
    },
    cursor: 'pointer', // Change cursor on hover to indicate an item is clickable
}));

export default function InputRefDataComponent(props) {

    const [isDialogOpen, setIsDialogOpen] = useState(false);


    let selectedDatasets = props.selectedDatasets;

    let onDeleteDataset = props.onDeleteDataset;

    const filterCategory = props.filterCategory;

    const handleOpenDialog = (mode) => {
        setIsDialogOpen(true);
    };
    const handleCloseDialog = () => {
        setIsDialogOpen(false);
    };

    return (
        <div className='inputData-management'>
            <div id="upload-data-div">
                <div className='wrap-div-row common-row-wrap'>
                    <div className='icons-wrap-input'>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Tooltip title="Select Datasets">
                                <button className="database-icon-input" type="button" onClick={handleOpenDialog} fdprocessedid="s89ftr">
                                    <FontAwesomeIcon icon={faDatabase} />
                                </button>
                            </Tooltip>
                            <div className='common-row-wrap'>
                                <b>Choose the reference dataset</b> <span data-v-22825496="" className="ui-form-title-message warning"> * required for scVI </span>
                                <br />
                            </div>
                        </div>
                        <div className="task-builder-task">
                            {isDialogOpen && (
                                <DatasetSelectionDialog
                                    onSelect={props.onSelectDataset}
                                    multiple={filterCategory === "annotation"}
                                    onClose={handleCloseDialog}
                                    isVisible={isDialogOpen !== false}
                                    selectedDatasets={props.selectedDatasets}
                                    fromToolsPage={true}
                                    onSelectSubItem={props.onSelectSubItem}
                                />
                            )}
                        </div>

                    </div>
                </div>

                {Object.keys(selectedDatasets).length > 0 &&
                    <div className='datasets-input-select'>
                        <ScrollableListContainer>
                            <List dense>
                                {Object.values(selectedDatasets).map((dataset) => (
                                    <CustomListItem key={dataset.Id}>
                                        <IconButton edge="start" aria-label="delete" onClick={() => onDeleteDataset(dataset.Id)}>
                                            <DeleteIcon />
                                        </IconButton>
                                        <ListItemText primary={dataset.Title} />
                                    </CustomListItem>
                                ))}
                            </List>
                        </ScrollableListContainer>

                        {props.formErrors && <FormHelperText>{props.formErrors}</FormHelperText>}
                    </div>
                }
            </div>
        </div>
    )
};

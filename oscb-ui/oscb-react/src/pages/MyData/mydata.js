// import LeftNav from "../components/leftNav";
import DatasetTable from "../../components/MyData/datasetTable";
import RightRail from "../../components/RightNavigation/rightRail";
import StorageChart from "../../components/MyData/storageChart";
import { getCookie, isUserAuth } from "../../utils/utilFunctions";
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';


export default function MyData() {

    const navigate = useNavigate();
    const filterCategory = null;

    const [selectedDatasets, setSelectedDatasets] = useState({});
    const [username, setUsername] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        let jwtToken = getCookie('jwtToken');
        if (!jwtToken) {
            // Navigate to the login page using window.location.href
            navigate('/routing');
        } else {
            // If the token exists, verify authenticity
            isUserAuth(jwtToken).then((authData) => {
                setUsername(authData.username);
                setIsAdmin(authData.isAdmin);
            })
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const onSelectDataset = (dataset) => {
        let datasetId = dataset.Id;
        let currentSelectedDatasets = { ...selectedDatasets };

        if (currentSelectedDatasets[datasetId]) {
            delete currentSelectedDatasets[datasetId];
        } else {
            if (filterCategory !== "integration") {
                currentSelectedDatasets = {};
            }
            currentSelectedDatasets[datasetId] = dataset;
        }
        if (filterCategory === "quality_control") {
            // Do nothing
        }
        setSelectedDatasets(currentSelectedDatasets)
    };

    // Function to handle selection of sub-items
    const onSelectSubItem = (mainItem, subItem) => {
        const mainItemId = mainItem.Id;
        let currentSelectedDatasets = { ...selectedDatasets };

        // Check if the main item is already selected
        if (currentSelectedDatasets[mainItemId]) {
            // If sub-item is already selected, deselect it
            if (currentSelectedDatasets[mainItemId].selectedSubItem?.process_id === subItem.process_id) {
                delete currentSelectedDatasets[mainItemId];
            } else {
                // Update the selected main item with the selected sub-item
                currentSelectedDatasets[mainItemId] = {
                    ...mainItem,
                    selectedSubItem: subItem
                };
            }
        } else {
            // Select the main item and the sub-item
            currentSelectedDatasets = {
                [mainItemId]: {
                    ...mainItem,
                    selectedSubItem: subItem
                }
            };
        }

        setSelectedDatasets(currentSelectedDatasets);
    };

    return (
        <div className="page-container">
            <div className="left-nav">
                {/* <LeftNav /> */}
            </div>
            <div className="main-content">
                <StorageChart />
                <div className="task-builder-task">
                    <DatasetTable
                        onSelect={onSelectDataset}
                        onClose={null}
                        isVisible={true}
                        selectedDatasets={selectedDatasets}
                        fromToolsPage={true}
                        onSelectSubItem={onSelectSubItem}
                        username={username}
                        isAdmin={isAdmin}
                        enableClick={true}
                        showCheckbox={false}
                        showEdit={true}
                        showDelete={true}
                    />
                </div>
            </div>
            <div className="right-rail">
                <RightRail />
            </div>
        </div>
    )
}
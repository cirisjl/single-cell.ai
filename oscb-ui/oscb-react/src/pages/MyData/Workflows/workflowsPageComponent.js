import LeftNavComponent from "../../../components/MyData/Workflows/components/leftnavComponent";
import { WorkflowsComponent } from "../../../components/MyData/Workflows/workflowsComponent"
import RightRail from "../../../components/RightNavigation/rightRail"
import useUserAuthCheck from "../../../components/common_components/userAuthCheckComponent";
import React, {useState} from 'react'

export default function WorkflowsPageComponent() {

    const [selectedWorkflow, setSelectedWorkflow] = useState("");
    const [uniqueFilter, setUniqueFilter] = useState("");

    const handleFilterSelection = (category, filter) => {
        setUniqueFilter(category+ "_" + filter);
        setSelectedWorkflow(filter);
        console.log(category + filter);
    };


    useUserAuthCheck();

    return(
        <div className="page-container">
            <div className="left-nav">
                <LeftNavComponent selectedWorkflow={selectedWorkflow} setSelectedWorkflow={setSelectedWorkflow} handleFilterSelection={handleFilterSelection}/>
            </div>
            {/* Render the selected filter details in the middle of the page */}
            {selectedWorkflow && (
                <div className="filter-details-tools main-content">
                    <WorkflowsComponent selectedWorkflow={selectedWorkflow} uniqueFilter={uniqueFilter} />
                </div>
            )}
            {!selectedWorkflow && (
                <div className="tool-message">
                    <p>Please select a <strong>Workflow</strong> from left to start.</p>
                </div>
            )}
            <div className="right-rail">
                <RightRail />
            </div>
        </div>
    )
}
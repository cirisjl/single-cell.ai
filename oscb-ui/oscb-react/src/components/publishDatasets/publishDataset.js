import RightRail from "../RightNavigation/rightRail";
import LeftNav from "./components/leftNav";
import MiddleContent from "./components/mainContent";
import React from 'react';
import './publishDatasets.css'; // Import a CSS file for styles

export default function PublishDataset({ taskStatus, setTaskStatus, taskData, setTaskData, activeTask, setActiveTask, flow, setFlow }) {

    return (
        <div className="page-container">
            <div className="left-nav">
                <LeftNav activeTask={activeTask} setActiveTask={setActiveTask} taskStatus={taskStatus} taskData={taskData} setTaskData={setTaskData} flow={flow} />
            </div>
            <div className="main-content">
                <MiddleContent activeTask={activeTask} setActiveTask={setActiveTask} setTaskStatus={setTaskStatus} taskData={taskData} setTaskData={setTaskData} taskStatus={taskStatus} setFlow={setFlow} flow={flow} />
            </div>
            <div className="right-rail">
                <RightRail />
            </div>
        </div>
    )
}
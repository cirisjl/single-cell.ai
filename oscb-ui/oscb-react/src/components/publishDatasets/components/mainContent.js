import React from 'react';
import UploadDataTaskComponent from './uploadDataTask';
import ReviewTaskComponent from './reviewTask';
import QualityControlTaskComponent from './qualityControlTask';
import TaskBuilderTaskComponent from './taskBuilderTask';
import BenchmarksTaskComponent from './benchmarksTask';
import MyForm from '../../Form/Components/customComponent';

function MiddleContent({ activeTask, setActiveTask, setTaskStatus, taskData, setTaskData, taskStatus, setFlow, flow }) {
  const taskComponents = {
    1: <UploadDataTaskComponent setTaskStatus={setTaskStatus} taskData={taskData} setTaskData={setTaskData} setActiveTask={setActiveTask} activeTask={activeTask} />,
    // 2: <ValidationTaskComponent setTaskStatus={setTaskStatus} taskData={taskData} setTaskData={setTaskData} setActiveTask = {setActiveTask} activeTask={activeTask}/>,
    2: <QualityControlTaskComponent setTaskStatus={setTaskStatus} taskData={taskData} setTaskData={setTaskData} setActiveTask={setActiveTask} activeTask={activeTask} />,
    // 4: <GetMetaDataComponent setTaskStatus={setTaskStatus} taskData={taskData} setTaskData={setTaskData} setActiveTask = {setActiveTask} activeTask={activeTask}/>,
    3: <MyForm setTaskStatus={setTaskStatus} taskData={taskData} setTaskData={setTaskData} setActiveTask={setActiveTask} activeTask={activeTask} setFlow={setFlow} flow={flow} />,
    4: <TaskBuilderTaskComponent setTaskStatus={setTaskStatus} taskData={taskData} setTaskData={setTaskData} setActiveTask={setActiveTask} activeTask={activeTask} />,
    5: <BenchmarksTaskComponent setTaskStatus={setTaskStatus} taskData={taskData} setTaskData={setTaskData} setActiveTask={setActiveTask} activeTask={activeTask} />,
    6: <ReviewTaskComponent setTaskStatus={setTaskStatus} taskData={taskData} setTaskData={setTaskData} setActiveTask={setActiveTask} activeTask={activeTask} />,
    // Add other task components here
  };

  return (
    <main>
      {taskComponents[activeTask]}

    </main>
  );
}

export default MiddleContent;

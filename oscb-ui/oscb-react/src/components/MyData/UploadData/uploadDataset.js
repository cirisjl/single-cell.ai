import React, { useState } from 'react';
import '../../publishDatasets/publishDatasets.css'; // Import a CSS file for styles
import RightRail from "../../RightNavigation/rightRail";
import LeftNav from "../../publishDatasets/components/leftNav";
import UploadData from '../uploadData';
import MyForm from '../../Form/Components/customComponent';

export default function UploadDataset() {

  const [uploadMyDataStatus, setUploadMyDataStatus] = useState({
    1: false,
    2: false,
  });

  const [activeTask, setActiveTask] = useState(1); // Initialize with the first task

  const flow = 'uploadMyData';

  const [taskData, setTaskData] = useState({
    upload: {
      files: [],
      makeItpublic: false,
      final_files: {},
      displayAssayNames: false,
      assayNames: [],
      default_assay: '',
      selectedAssayName: '',
      project_name: ''
    },

    metadata: {
      formData: {
        Dataset: '',
        Downloads: '',
        Title: '',
        Author: '',
        'Reference (paper)': '',
        Abstract: '',
        DOI: '',
        Species: '',
        'Cell Count Estimate': '',
        'Sample Type': '',
        'Anatomical Entity': '',
        'Organ Part': '',
        'Model Organ': '',
        'Selected Cell Types': [],
        'Library Construction Method': '',
        'Nucleic Acid Source': '',
        'Paired End': false,
        'Analysis Protocol': '',
        'Disease Status (Specimen)': [],
        'Disease Status (Donor)': [],
        'Development Stage': [],
        'Donor Count': 0,
        'Source': '',
        'Source Key': '',
        'Submission Date': '', // Set your initial date placeholder here    
      },
      taskOptions: [],
      options: {
        Task: [],
        Author: '',
        Species: [],
        'Sample Type': [],
        'Anatomical Entity': [],
        'Organ Part': [],
        'Model Organ': [],
        'Selected Cell Types': [],
        'Library Construction Method': [],
        'Nucleic Acid Source': [],
        'Disease Status (Specimen)': [],
        'Disease Status (Donor)': [],
        'Development Stage': [],
        'Cell Count Estimate': [],
        'Source': []
      },
      newOptions: []
    },
  });

  return (
    <div className="page-container">
      <div className="left-nav">
        <LeftNav activeTask={activeTask} setActiveTask={setActiveTask} taskStatus={uploadMyDataStatus} taskData={taskData} setTaskData={setTaskData} flow={flow} />
      </div>
      <div className="main-content">
        {activeTask === 1 && <div><UploadData taskStatus={uploadMyDataStatus} setTaskStatus={setUploadMyDataStatus} taskData={taskData} setTaskData={setTaskData} activeTask={activeTask} setActiveTask={setActiveTask} flow={flow} /></div>}
        {activeTask === 2 && <div><MyForm taskStatus={uploadMyDataStatus} setTaskStatus={setUploadMyDataStatus} taskData={taskData} setTaskData={setTaskData} activeTask={activeTask} setActiveTask={setActiveTask} flow={flow} /></div>}
      </div>
      <div className="right-rail">
        <RightRail />
      </div>
    </div>
  )
}
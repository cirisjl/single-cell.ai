import React, { useState } from 'react';
import '../../publishDatasets/publishDatasets.css'; // Import a CSS file for styles
import RightRail from "../../RightNavigation/rightRail";
import EditForm from '../../Form/Components/EditForm';

export default function EditDataset() {
      const [taskData, setTaskData] = useState({
        metadata: {
          formData: {
            Dataset: '',
            Downloads: '',
            Title: '',
            Author: '',
            'Reference (paper)':'',
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
            'Sample Type':[],
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
    
    return(
        <div className="page-container">
            <div className="left-nav">
            </div>
            <div className="main-content">
                <div><EditForm taskStatus={uploadMyDataStatus} setTaskStatus={setUploadMyDataStatus} taskData={taskData} setTaskData={setTaskData} activeTask={activeTask} setActiveTask={setActiveTask} flow={flow}/></div>
            </div>
            <div className="right-rail">
                <RightRail />
            </div>
        </div>
    )
}
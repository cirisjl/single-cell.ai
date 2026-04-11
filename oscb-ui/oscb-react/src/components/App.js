import './App.css';
import {
  BrowserRouter,
  Route, 
  Routes
} from 'react-router-dom'
import React from 'react';

// import Layouts
import RootLayout from './../layouts/rootLayout'

// import Pages
import GetStarted from './../pages/getStarted'
import Competitions from './../pages/competitions'
import Datasets from './../pages/datasets'
import Updates from './../pages/updates'
import Benchmarks from './../pages/benchmarks'
import Leaderboards from './../pages/leaderboards'
import MyData from '../pages/MyData/mydata'
import Team from './../pages/team'
import Doc from './../pages/doc'
import PreviewDatasets from '../pages/MyData/previewDatasets'
import UploadData from './MyData/uploadData';
import Login from '../pages/login/login';
import SignUp from '../pages/login/signup';
import RoutingTemplate from '../pages/login/loginRouting';
import WorkflowsPageComponent from '../pages/MyData/Workflows/workflowsPageComponent';
import ToolsComponentPage from '../pages/MyData/Tools/toolsComponentPage';
import MyJobs from '../pages/myJobs';
import ResultFiles from '../pages/ResultFiles';
import FlaskDashboard from './MyData/dashboard';
import NewApp from './Form/Components/component2';
import MyForm from './Form/Components/customComponent';
import AccessDenied from './AccessDeniedPage';
import ManageOptions from './Form/Components/editablePageOptions';
// import PublishDataset from './publishDatasets/publishDataset';
import FlowControl from './publishDatasets/flowControl';
import TaskResultsComponent from './Benchmarks/taskResultsComponent';
import UploadDataset from './MyData/UploadData/uploadDataset';
import SessionReminder from './Session/sessionManager';
// import { SessionProvider } from './Session/context/sessionContext'; 
import ForgotPasswordPage from '../pages/login/ForgotPasswordPage'
import ResetPasswordPage from '../pages/login/ResetPasswordPage';
// import QualityControlParameters from './publishDatasets/components/qualityControlParameters';
import TaskDetailsComponent from './MyData/MyTasks/taskDetailsComponent';
// import TaskDetailsWrapper from "./MyData/MyTasks/TaskDetailsWrapper.js";
import WorkflowTaskDetailsComponent from './MyData/MyTasks/workflowTaskDetailsComponent';
// import HandleVisualize from './publishDatasets/components/handleVisualize';
import TreeTableComponent from './common_components/treeTableComponent';
import BenchmarksViewDetailsComponent from './Benchmarks/components/benchmarksViewDetailsComponent';
import DatasetInfoComponent from './MyData/MyDatasets/DatasetInfoComponent';
import EditCustomForm from './Form/Components/editCustomFormComponent';
import ProjectAdminPanel from './Projects/projectInfo';

function App() {
  
  return (
    <>
    <div className="session-manager-component"><SessionReminder/> </div>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RootLayout/>}>
          <Route path="/" element={<GetStarted/>} />
          <Route path='getStarted'   element={<GetStarted/>} />
          <Route path="updates"      element={<Updates/>} />
          <Route path="competitions" element={<Competitions/>}/>
          <Route path="datasets" element={<Datasets/>} />
          <Route path="benchmarks"   element={<Benchmarks/>}/>
          <Route path="benchmarks/uploads"   element={<FlowControl/>}/>
          <Route path="benchmarks/clustering"   element={<TaskResultsComponent task_type="Clustering"/>}/>
          <Route path="benchmarks/imputation" element={<TaskResultsComponent task_type="Imputation" />} />
          <Route path="benchmarks/batch-integration" element={<TaskResultsComponent task_type="Batch Integration" />} />
          <Route path="benchmarks/multimodal-data-integration" element={<TaskResultsComponent task_type="Multimodal Data Integration" />} />         
          <Route path="benchmarks/trajectory" element={<TaskResultsComponent task_type="Trajectory" />} />
          <Route path="benchmarks/cell-cell-communication" element={<TaskResultsComponent task_type="Cell-Cell Communication" />} />
          <Route path="benchmarks/cell-type-annotation" element={<TaskResultsComponent task_type="Cell Type Annotation" />} />
          <Route path="benchmarks/viewDetails" element={<BenchmarksViewDetailsComponent />} />
          <Route path="leaderboards" element={<Leaderboards/>}/>
          <Route path="mydata"       element={<MyData/>}></Route>
          <Route path="mydata/view-dataset-info"  element={<DatasetInfoComponent/>}></Route>
          <Route path="mydata/edit-dataset-info"  element={<EditCustomForm/>}></Route>
          <Route path="mydata/upload-data"       element={<UploadDataset/>}></Route>
          <Route path="mydata/update-dataset"       element={<UploadData/>}></Route>
          <Route path="mydata/preview-datasets" element={<PreviewDatasets/>}></Route>
          <Route path="mydata/taskDetails"       element={<TaskDetailsComponent/>}></Route>
          {/* <Route path="/mydata/taskDetails" element={<TaskDetailsWrapper />} /> */}
          <Route path="mydata/workflowTaskDetails"       element={<WorkflowTaskDetailsComponent/>}></Route>
          <Route path="mydata/workflows" element={<WorkflowsPageComponent/>}></Route>
          <Route path="mydata/tools" element={<ToolsComponentPage/>}></Route>
          <Route path="team"         element={<Team/>}/>
          <Route path="dashboard"         element={<FlaskDashboard/>}/>
          <Route path="doc" element={<Doc/>}/>
          <Route path="login"         element={<Login/>}/>
          <Route path="signup"         element={<SignUp/>}/>
          <Route path="routing"         element={<RoutingTemplate/>}/>
          <Route path="myJobs"         element={<MyJobs/>}/>
          <Route path="resultfiles"         element={<ResultFiles/>}/>
          <Route path="new"         element={<NewApp/>}/>
          <Route path="custom"         element={<MyForm/>}/>
          <Route path="accessDenied"         element={<AccessDenied/>}/>
          <Route path="manageOptions"         element={<ManageOptions/>}/>
          <Route path="testapi"         element={<TreeTableComponent/>}/>
          <Route path="forgot-password" element={<ForgotPasswordPage />} />
          <Route path="reset/:token"         element={<ResetPasswordPage/>}/>
          <Route path="projectAdminPanel"         element={<ProjectAdminPanel></ProjectAdminPanel>}/>
          {/* <Route path="publishDataset"         element={<PublishDataset/>}/> */}

        </Route>
      </Routes>
    </BrowserRouter>
    </>
  );
}

export default App

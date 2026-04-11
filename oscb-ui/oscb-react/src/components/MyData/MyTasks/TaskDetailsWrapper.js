import { useLocation } from "react-router-dom";
import TaskDetailsComponent from "./taskDetailsComponent";

function TaskDetailsWrapper() {
    const location = useLocation();
    const jobId = location.state?.job_id;

    return <TaskDetailsComponent key={jobId || location.key} />;
}

export default TaskDetailsWrapper;
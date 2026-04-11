// import leftNav from "../components/leftNav";
import React, { useEffect } from 'react';
import TaskTable from "../components/MyData/taskTable";
import RightRail from "../components/RightNavigation/rightRail";
import { getCookie } from "../utils/utilFunctions";
import { useNavigate } from 'react-router-dom';


export default function MyJobs() {
    const navigate = useNavigate();
    useEffect(() => {
        let jwtToken = getCookie('jwtToken');
        if (jwtToken === undefined || jwtToken === '') {
            navigate('/routing');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className="page-container">
            <div className="left-nav">
                {/* <LeftNav /> */}
            </div>
            <div className="main-content">
                <TaskTable />
            </div>
            <div className="right-rail">
                <RightRail />
            </div>
        </div>
    )
}
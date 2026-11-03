// import leftNav from "../components/leftNav";
import React, { useEffect } from 'react';
import TaskTable from "../components/MyData/taskTable";
import RightRail from "../components/RightNavigation/rightRail";
import { getCookie } from "../utils/utilFunctions";
import { useLocation, useNavigate } from 'react-router-dom';


export default function MyJobs() {
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        let jwtToken = getCookie('jwtToken');
        if (jwtToken === undefined || jwtToken === '') {
            // Remember this page so the login screen can return here.
            navigate('/login', {
                replace: true,
                state: { from: location },
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [navigate, location]);

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
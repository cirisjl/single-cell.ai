import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { getCookie } from "../../utils/utilFunctions";
import { getStorageDetails } from '../../utils/utilFunctions';
import { faDatabase, faSquareCheck } from "@fortawesome/free-solid-svg-icons";
import MyJobsSideNav from "../MyData/myJobsSideNav";
// import Chatbot from "./Chatbot";

function RightRail() {
    const [isUserLoggedIn, setIsUserLoggedIn] = useState(false);
    const [usedStorage, setUsedStorage] = useState(0);
    const [totalStorage, setTotalStorage] = useState(5);

    useEffect(() => {
        const userCookie = getCookie('jwtToken');

        if (userCookie !== '') {
            setIsUserLoggedIn(true);
        }

    }, [isUserLoggedIn]);

    useEffect(() => {
        const jwtToken = getCookie('jwtToken'); // Assuming you have a function to get the JWT token

        getStorageDetails(jwtToken)
            .then(data => {
                setUsedStorage(data.usedStorage);
                setTotalStorage(data.totalStorage);
            });
    }, []);

    return (
        <div>
            {isUserLoggedIn && (
                <div className="right-container border-l border-gray-100 right-rail-container">
                    <div className="rightpane-1">
                        <div className="search-window">
                            <div className="row1-search-window rows-search-window">
                                <div className="left-side-of-container">
                                    <span className="rightpane-text rightpane-text-history">Storage</span>
                                </div>
                            </div>
                            {/* <div className="row2-search-window rows-search-window">
                    <input
                        type="text"
                        placeholder="Search Datasets..."
                        className="w-full dark:bg-gray-950 pl-8 form-input-alt h-9 pr-3 focus:shadow-xl"
                    />
                    <FontAwesomeIcon className="right-rail-search-svg" icon={faAngleDoubleDown} />
                    <FontAwesomeIcon className="right-rail-search-svg" icon={faXmark} />
                </div> */}
                        </div>
                        <div className="row4-search-window">
                            <div className="left-side-of-container">
                                <FontAwesomeIcon icon={faDatabase} title="History size" /><p className="storage-span">{usedStorage} GB/{totalStorage} GB</p>
                            </div>
                            <div className="right-side-of-container">
                                {/* <FontAwesomeIcon icon={faLocationDot} title="Show active"/>
                        <FontAwesomeIcon icon={faArrowsRotate} title="Last Refreshed" />*/}
                            </div>
                        </div>
                        <div className="row5-search-window border-b">
                            <div className="left-side-of-container">
                                <FontAwesomeIcon icon={faSquareCheck} />
                                {/* <FontAwesomeIcon icon={faCompress} />*/}
                            </div>
                            <div className="right-side-of-container">
                                {/* <FontAwesomeIcon icon={faGear} />*/}
                            </div>
                        </div>
                    </div>
                    <div className="results-window">
                        <MyJobsSideNav />
                        {/* {isUserLoggedIn && <Chatbot presetQuestions={presetQuestions} />} */}
                    </div>
                </div>
            )
            }
        </div>
    );
}

export default RightRail;

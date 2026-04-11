import { Outlet, Link, NavLink } from "react-router-dom"
import Authentication from "../components/Authentication/AuthForm";
// import Chatbot from "../components/RightNavigation/Chatbot";
// import SearchBox from "../components/Header/searchBar"
import React, { useState, useEffect } from "react";
import { deleteCookie, getCookie, isUserAuth } from "../utils/utilFunctions";
import { useNavigate } from 'react-router-dom';


export default function RootLayout() {

    const navigate = useNavigate();

    const [isLoginReq, setIsLoginReq] = useState(false);
    const [isUserLoggedIn, setIsUserLoggedIn] = useState(false);
    const [username, setUsername] = useState('');
    const [isAdmin, setIsAdmin] = useState(false);

    const handleAuth = (event) => {
        event.preventDefault();
        setIsLoginReq(!isLoginReq);
    };
    const [hoveredChildIndex, setHoveredChildIndex] = useState(null);


    const handleMouseOver = (event) => {
        setHoveredChildIndex(parseInt(event.currentTarget.dataset.index));
    };

    const handleMouseOut = () => {
        setHoveredChildIndex(null);
    };

    const handleLogoutClick = () => {
        if (deleteCookie('jwtToken'))
            setIsUserLoggedIn(false);
        navigate('/getStarted');
        window.location.reload();

    }


    useEffect(() => {
        const jwtToken = getCookie('jwtToken');
        if (jwtToken) {
            // If the token exists, verify authenticity
            isUserAuth(jwtToken).then((authData) => {
                setIsUserLoggedIn(true);
                setUsername(authData.username);
                setIsAdmin(authData.isAdmin);
            })
        }
    }, [isUserLoggedIn]);

    // useEffect(() => {
    //     const handleCookieChange = () => {
    //       const newCookieValue = document.cookie
    //         .split('; ')
    //         .find(row => row.startsWith('jwtToken='))
    //         ?.split('=')[1];

    //       setIsUserLoggedIn(Boolean(newCookieValue));
    //     };

    //     // Listen for changes to the cookie value
    //     window.addEventListener('change', handleCookieChange);

    //     // Clean up the event listener when the component unmounts
    //     return () => {
    //       window.removeEventListener('change', handleCookieChange);
    //     };
    //   }, []);

    return (
        <div className="container">
            <div className="auth-form-container">
                <Authentication isLoginReq={isLoginReq} handleAuth={handleAuth} />
            </div>
            <div className="header-container">
                <header className="border-b border-gray-100">
                    <div className="px-4 flex h-16 items-center">
                        <div className="flex flex-1 items-center">
                            <a className="mr-5 flex flex-none items-center lg:mr-6" href="/"><img src={require("../assets/logo.png")} alt="" /><span className="hidden whitespace-nowrap text-lg font-bold md:block">SINGLE-CELL.AI</span></a>
                            {/* <div className="relative flex-1 lg:max-w-sm mr-2 sm:mr-4 lg:mr-6">
                                <SearchBox placeHolder="Search models, datasets, users..."/>
                            </div> */}
                        </div>

                        {/* <div className="header-right"> */}
                        <nav aria-label="Main" className="ml-auto hidden lg:block">
                            <ul className="flex items-center space-x-2">
                                <li data-index="0" onMouseOver={handleMouseOver} onMouseOut={handleMouseOut}>
                                    <NavLink to="getStarted" className="group flex items-center py-0.5 dark:hover:text-gray-400 hover:text-indigo-700 whitespace-nowrap" >
                                        <svg className="mr-1 text-gray-400 group-hover:text-indigo-500" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" aria-hidden="true" focusable="false" role="img" width="1em" height="1em" preserveAspectRatio="xMidYMid meet" viewBox="0 0 24 24">
                                            <path className="uim-quaternary" d="M20.23 7.24L12 12L3.77 7.24a1.98 1.98 0 0 1 .7-.71L11 2.76c.62-.35 1.38-.35 2 0l6.53 3.77c.29.173.531.418.7.71z" opacity=".25" fill="currentColor"></path>
                                            <path className="uim-tertiary" d="M12 12v9.5a2.09 2.09 0 0 1-.91-.21L4.5 17.48a2.003 2.003 0 0 1-1-1.73v-7.5a2.06 2.06 0 0 1 .27-1.01L12 12z" opacity=".5" fill="currentColor"></path>
                                            <path className="uim-primary" d="M20.5 8.25v7.5a2.003 2.003 0 0 1-1 1.73l-6.62 3.82c-.275.13-.576.198-.88.2V12l8.23-4.76c.175.308.268.656.27 1.01z" fill="currentColor"></path>
                                        </svg>
                                        Get Started
                                    </NavLink>
                                </li>
                                {/* <li data-index="2">
                                    <NavLink to="competitions" className="group flex items-center py-0.5 dark:hover:text-gray-400 hover:text-indigo-700">
                                        <svg className="mr-1 text-gray-400 group-hover:text-blue-500" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" aria-hidden="true" focusable="false" role="img" width="1em" height="1em" viewBox="0 0 25 25">
                                            <path opacity=".5" d="M6.016 14.674v4.31h4.31v-4.31h-4.31ZM14.674 14.674v4.31h4.31v-4.31h-4.31ZM6.016 6.016v4.31h4.31v-4.31h-4.31Z" fill="currentColor"></path>
                                            <path opacity=".75" fillRule="evenodd" clipRule="evenodd" d="M3 4.914C3 3.857 3.857 3 4.914 3h6.514c.884 0 1.628.6 1.848 1.414a5.171 5.171 0 0 1 7.31 7.31c.815.22 1.414.964 1.414 1.848v6.514A1.914 1.914 0 0 1 20.086 22H4.914A1.914 1.914 0 0 1 3 20.086V4.914Zm3.016 1.102v4.31h4.31v-4.31h-4.31Zm0 12.968v-4.31h4.31v4.31h-4.31Zm8.658 0v-4.31h4.31v4.31h-4.31Zm0-10.813a2.155 2.155 0 1 1 4.31 0 2.155 2.155 0 0 1-4.31 0Z" fill="currentColor"></path>
                                            <path opacity=".25" d="M16.829 6.016a2.155 2.155 0 1 0 0 4.31 2.155 2.155 0 0 0 0-4.31Z" fill="currentColor"></path>
                                        </svg>
                                        Competition
                                    </NavLink>
                                 </li> */}
                                <li data-index="1" onMouseOver={handleMouseOver} onMouseOut={handleMouseOut}>
                                    <NavLink className="group flex items-center py-0.5 dark:hover:text-gray-400 hover:text-indigo-700">
                                        <svg className="text-gray-400 mr-1" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" aria-hidden="true" role="img" width="1em" height="1em" preserveAspectRatio="xMidYMid meet" viewBox="0 0 24 24">
                                            <path className="uim-tertiary" d="M15.273 18.728A6.728 6.728 0 1 1 22 11.999V12a6.735 6.735 0 0 1-6.727 6.728z" opacity=".5" fill="currentColor"></path>
                                            <path className="uim-primary" d="M8.727 18.728A6.728 6.728 0 1 1 15.455 12a6.735 6.735 0 0 1-6.728 6.728z" fill="currentColor"></path>
                                        </svg>
                                        Analyses
                                    </NavLink>
                                    <div className={hoveredChildIndex === 1 ? "suboptions-container" : "suboptions-container hide"}>
                                        <div className="rounded-xl border-gray-100 border styles-for-dropdown">
                                            <ul className="ul-suboptions">
                                                {isAdmin && (<li><NavLink to="manageOptions">Manage Form Options</NavLink></li>)}
                                                <li><NavLink to="mydata/upload-data">Upload Data</NavLink></li>
                                                <li><NavLink to="mydata">My Datasets</NavLink></li>
                                                <li><NavLink to="projectAdminPanel">My Projects</NavLink></li>
                                                <li><NavLink to="myJobs">My Jobs</NavLink></li>
                                                <li><NavLink to="mydata/workflows">Workflows</NavLink></li>
                                                <li><NavLink to="mydata/tools">Tools</NavLink></li>
                                            </ul>
                                        </div>
                                    </div>
                                </li>
                                <li data-index="2">
                                    <NavLink to="datasets" className="group flex items-center py-0.5 dark:hover:text-gray-400 hover:text-indigo-700">
                                        <svg className="mr-1 text-gray-400 group-hover:text-red-500" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" aria-hidden="true" focusable="false" role="img" width="1em" height="1em" preserveAspectRatio="xMidYMid meet" viewBox="0 0 25 25">
                                            <ellipse cx="12.5" cy="5" fill="currentColor" fillOpacity="0.25" rx="7.5" ry="2"></ellipse>
                                            <path d="M12.5 15C16.6421 15 20 14.1046 20 13V20C20 21.1046 16.6421 22 12.5 22C8.35786 22 5 21.1046 5 20V13C5 14.1046 8.35786 15 12.5 15Z" fill="currentColor" opacity="0.5"></path>
                                            <path d="M12.5 7C16.6421 7 20 6.10457 20 5V11.5C20 12.6046 16.6421 13.5 12.5 13.5C8.35786 13.5 5 12.6046 5 11.5V5C5 6.10457 8.35786 7 12.5 7Z" fill="currentColor" opacity="0.5"></path>
                                            <path d="M5.23628 12C5.08204 12.1598 5 12.8273 5 13C5 14.1046 8.35786 15 12.5 15C16.6421 15 20 14.1046 20 13C20 12.8273 19.918 12.1598 19.7637 12C18.9311 12.8626 15.9947 13.5 12.5 13.5C9.0053 13.5 6.06886 12.8626 5.23628 12Z" fill="currentColor"></path>
                                        </svg>
                                        Datasets
                                    </NavLink>
                                </li>
                                <li data-index="3" onMouseOver={handleMouseOver} onMouseOut={handleMouseOut}>
                                    <NavLink className="group flex items-center py-0.5 dark:hover:text-gray-400 hover:text-indigo-700">
                                        <svg className="text-gray-400 mr-1" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" aria-hidden="true" focusable="false" role="img" width="1em" height="1em" preserveAspectRatio="xMidYMid meet" viewBox="0 0 24 24">
                                            <path className="uim-quaternary" d="M6 23H2a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1z" opacity=".25" fill="currentColor"></path>
                                            <path className="uim-primary" d="M14 23h-4a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v20a1 1 0 0 1-1 1z" fill="currentColor"></path>
                                            <path className="uim-tertiary" d="M22 23h-4a1 1 0 0 1-1-1V10a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1z" opacity=".5" fill="currentColor"></path>
                                        </svg>
                                        Benchmarks
                                    </NavLink>
                                    <div className={hoveredChildIndex === 3 ? "suboptions-container" : "suboptions-container hide"}>
                                        <div className="rounded-xl border-gray-100 border styles-for-dropdown">
                                            <ul className="ul-suboptions">
                                                { /* <li><NavLink to="benchmarks">Overview</NavLink></li> */}
                                                <li><Link reloadDocument to="benchmarks/clustering">Clustering</Link></li>
                                                <li><Link reloadDocument to="benchmarks/imputation">Imputation</Link></li>
                                                <li><Link reloadDocument to="benchmarks/batch-integration">Batch Integration</Link></li>
                                                <li><Link reloadDocument to="benchmarks/multimodal-data-integration">Multimodal Data Integration</Link></li>
                                                <li><Link reloadDocument to="benchmarks/trajectory">Trajectory</Link></li>
                                                <li><Link reloadDocument to="benchmarks/cell-cell-communication">Cell-Cell Communication</Link></li>
                                                <li><Link reloadDocument to="benchmarks/cell-type-annotation">Cell Type Annotation</Link></li>
                                                {isAdmin && (<li><NavLink to="benchmarks/uploads">Create New Benchmarks</NavLink></li>)}
                                            </ul>
                                        </div>
                                    </div>
                                </li>
                                { /* <li data-index="4" onMouseOver={handleMouseOver} onMouseOut={handleMouseOut}>
                                    <NavLink to="leaderboards" className="group flex items-center py-0.5 dark:hover:text-gray-400 hover:text-indigo-700">
                                        <svg className="text-gray-400 mr-1" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" aria-hidden="true" focusable="false" role="img" width="1em" height="1em" preserveAspectRatio="xMidYMid meet" viewBox="0 0 24 24">
                                            <path className="uim-quaternary" d="M6 23H2a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1z" opacity=".25" fill="currentColor"></path>
                                            <path className="uim-primary" d="M14 23h-4a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v20a1 1 0 0 1-1 1z" fill="currentColor"></path>
                                            <path className="uim-tertiary" d="M22 23h-4a1 1 0 0 1-1-1V10a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1z" opacity=".5" fill="currentColor"></path>
                                        </svg>
                                        Leaderboards
                                    </NavLink>
                                </li> */ }
                                <li data-index="4">
                                    <NavLink to="updates" className="group flex items-center py-0.5 dark:hover:text-gray-400 hover:text-indigo-700">
                                        <svg class="w-6 h-6 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="lightgrey" viewBox="0 0 24 24">
                                            <path fill-rule="evenodd" d="M3.559 4.544c.355-.35.834-.544 1.33-.544H19.11c.496 0 .975.194 1.33.544.356.35.559.829.559 1.331v9.25c0 .502-.203.981-.559 1.331-.355.35-.834.544-1.33.544H15.5l-2.7 3.6a1 1 0 0 1-1.6 0L8.5 17H4.889c-.496 0-.975-.194-1.33-.544A1.868 1.868 0 0 1 3 15.125v-9.25c0-.502.203-.981.559-1.331ZM7.556 7.5a1 1 0 1 0 0 2h8a1 1 0 0 0 0-2h-8Zm0 3.5a1 1 0 1 0 0 2H12a1 1 0 1 0 0-2H7.556Z" clip-rule="evenodd" />
                                        </svg>
                                        Updates
                                    </NavLink>
                                </li>
                                <li data-index="5" onMouseOver={handleMouseOver} onMouseOut={handleMouseOut}>
                                    <NavLink to="doc" className="group flex items-center py-0.5 dark:hover:text-gray-400 hover:text-indigo-700">
                                        <svg class="w-6 h-6 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="lightgrey" viewBox="0 0 24 24">
                                            <path fill-rule="evenodd" d="M11 4.717c-2.286-.58-4.16-.756-7.045-.71A1.99 1.99 0 0 0 2 6v11c0 1.133.934 2.022 2.044 2.007 2.759-.038 4.5.16 6.956.791V4.717Zm2 15.081c2.456-.631 4.198-.829 6.956-.791A2.013 2.013 0 0 0 22 16.999V6a1.99 1.99 0 0 0-1.955-1.993c-2.885-.046-4.76.13-7.045.71v15.081Z" clip-rule="evenodd" />
                                        </svg>
                                        Docs
                                    </NavLink>
                                </li>
                                <li data-index="6">
                                    <NavLink to="team" className="group flex items-center py-0.5 dark:hover:text-gray-400 hover:text-indigo-700">
                                        <svg className="w-[32px] h-[32px] text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="lightgrey" viewBox="0 0 24 24">
                                            <path fill-rule="evenodd" d="M12 6a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Zm-1.5 8a4 4 0 0 0-4 4 2 2 0 0 0 2 2h7a2 2 0 0 0 2-2 4 4 0 0 0-4-4h-3Zm6.82-3.096a5.51 5.51 0 0 0-2.797-6.293 3.5 3.5 0 1 1 2.796 6.292ZM19.5 18h.5a2 2 0 0 0 2-2 4 4 0 0 0-4-4h-1.1a5.503 5.503 0 0 1-.471.762A5.998 5.998 0 0 1 19.5 18ZM4 7.5a3.5 3.5 0 0 1 5.477-2.889 5.5 5.5 0 0 0-2.796 6.293A3.501 3.501 0 0 1 4 7.5ZM7.1 12H6a4 4 0 0 0-4 4 2 2 0 0 0 2 2h.5a5.998 5.998 0 0 1 3.071-5.238A5.505 5.505 0 0 1 7.1 12Z" clip-rule="evenodd" />
                                        </svg>
                                        Teams
                                    </NavLink>
                                </li>
                                <li data-index="7" onMouseOver={handleMouseOver} onMouseOut={handleMouseOut}>
                                    <NavLink className="group flex items-center py-0.5 dark:hover:text-gray-400 hover:text-indigo-700">
                                        <svg className="w-[24px] h-[24px] text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="lightgrey" viewBox="0 0 24 24">
                                            <path fill-rule="evenodd" d="M12 20a7.966 7.966 0 0 1-5.002-1.756l.002.001v-.683c0-1.794 1.492-3.25 3.333-3.25h3.334c1.84 0 3.333 1.456 3.333 3.25v.683A7.966 7.966 0 0 1 12 20ZM2 12C2 6.477 6.477 2 12 2s10 4.477 10 10c0 5.5-4.44 9.963-9.932 10h-.138C6.438 21.962 2 17.5 2 12Zm10-5c-1.84 0-3.333 1.455-3.333 3.25S10.159 13.5 12 13.5c1.84 0 3.333-1.455 3.333-3.25S13.841 7 12 7Z" clip-rule="evenodd" />
                                        </svg>
                                        {isUserLoggedIn ? (<span>Hi, <strong>{username}</strong>!</span>) : (<span>Login/Sign Up</span>)}
                                    </NavLink>
                                    <div className={hoveredChildIndex === 7 ? "suboptions-container" : "suboptions-container hide"}>
                                        <div className="rounded-xl border-gray-100 border styles-for-dropdown">
                                            <ul className="ul-suboptions">
                                                {!isUserLoggedIn && (<li><NavLink to="SignUp">Sign Up</NavLink></li>)}
                                                {!isUserLoggedIn && (<li><NavLink to="forgot-password">Forgot Password</NavLink></li>)}
                                                {isUserLoggedIn && (<li><NavLink to="reset/:token">Reset Password</NavLink></li>)}
                                                {isUserLoggedIn ? (
                                                    <li><span style={{ cursor: 'pointer' }} onClick={handleLogoutClick}>Log Out</span></li>
                                                ) : (
                                                    <li><NavLink to="login">Log In</NavLink></li>
                                                )}
                                            </ul>
                                        </div>
                                    </div>
                                </li>
                            </ul>
                        </nav>
                    </div>
                </header>
            </div>
            <div className="main-container">
                <main>
                    <Outlet isUserLoggedIn={isUserLoggedIn} />
                </main>
            </div>
        </div>

    )
}

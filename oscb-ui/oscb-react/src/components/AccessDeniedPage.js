import {NavLink} from "react-router-dom";
import close_icon from '../assets/close_icon_u86.svg';
import close_icon_hover from '../assets/close_icon_u86_mouseOver.svg';
import { useNavigate } from 'react-router-dom';
import React, { useState } from 'react';


function AccessDenied (props) {

    const navigate = useNavigate();

    const [hovered, setHovered] = useState(false);

    const handleMouseOver = () => {
      setHovered(true);
    };
  
    const handleMouseOut = () => {
      setHovered(false);
    };

    const handleCrossButtonClick = () => {
        navigate("/");
    }

  return (
    <div className='login-container comn-container-auth'>
      <div className='clear-icon'>
        <img src={hovered ? close_icon_hover : close_icon} alt="close-icon" onMouseOver={handleMouseOver} onMouseOut={handleMouseOut} onClick={handleCrossButtonClick} />
      </div>
      <div className='inner-container-auth'>
        <p>Access Denied - You must be an admin to access this page</p>
        <p>Please navigate to <NavLink to="/getstarted" className="span-class-link">GetStarted</NavLink> page</p>
      </div>
    </div>
  );
};

export default AccessDenied;

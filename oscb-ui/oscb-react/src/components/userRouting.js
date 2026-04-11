import {NavLink} from "react-router-dom";
import close_icon from '../assets/close_icon_u86.svg';
import close_icon_hover from '../assets/close_icon_u86_mouseOver.svg';
import { useNavigate } from 'react-router-dom';
import React, { useState } from 'react';


function UserRouting (props) {

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
        <p>Please <NavLink to="/login" className="span-class-link">Login</NavLink> to access your data.</p>
        {/* <p>Don't have an account? <NavLink to="/SignUp" className="span-class-link">Sign Up</NavLink></p> */}
      </div>
    </div>
  );
};

export default UserRouting;

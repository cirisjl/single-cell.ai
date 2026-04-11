import React, { useState, useEffect } from 'react';
import { getCookie} from '../../utils/utilFunctions';
import {NavLink} from "react-router-dom"
import { useNavigate } from 'react-router-dom'; 
import { NODE_API_URL  } from '../../constants/declarations'


function LoginPage (props) {
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  const [errorMessage, setErrorMessage] = useState('');

  const handleUsernameChange = (e) => {
    setUsername(e.target.value);
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
  };

  const handleCheckboxChange = (e) => {
    setRememberMe(e.target.checked);
  };

  const handleLogin = (e) => {
    e.preventDefault();

    // Validate input
    if (!username || !password) {
      setErrorMessage('*Please enter both username and password');
      return;
    }


    fetch(NODE_API_URL + "/login", {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
      credentials: "include"
    }).then(response => response.json())
    .then(data => {
      if(data.status === 200) {
        navigate('/getStarted');
        window.location.reload();  
      } else {
        setErrorMessage(data.message);
      }
    }).catch(error => {
      setErrorMessage("An error occurred during login");
    });
  };
  
  useEffect(() => {
    const jwtToken = getCookie('jwtToken');

    if (jwtToken) {
          fetch(NODE_API_URL + "/protected", {
            method: 'GET',
            credentials: 'include', // send cookies with the request
            headers: { 'Authorization': `Bearer ${jwtToken}`},
          }) 
          .then((response) => response.json())
          .then((data) => {
            setUsername(data.authData.username);
            setPassword(data.authData.password);
            setRememberMe(true);
          })
          .catch((error) => console.error(error));
    }
  }, [rememberMe]);

  return (
    <div className='login-container comn-container-auth'>
      <div className='inner-container-auth'>

        <h1>Log in</h1>
        <p>Please enter your username and password to log in.</p>
        
        {errorMessage && <p style={{ color: 'red' }}>{errorMessage}</p>}
        <form onSubmit={handleLogin}>
          <div>
            <label htmlFor="username">Username:</label>
            <input type="text" id="username" className="form-input" value={username} autoComplete="username" onChange={handleUsernameChange} placeholder="Username"/>
          </div>
          <div>
            <label htmlFor="password">Password:</label>
            <input type="password" id="password" value={password} className="form-input" autoComplete="new-password" onChange={handlePasswordChange} placeholder="Password" />
          </div>
          <div className='checkbox'>
            <input type="checkbox" id="remember-me" checked={rememberMe} onChange={handleCheckboxChange} />
            <label htmlFor="remember-me">Remember Me</label>
          </div>
          <div className='forgot-password'>
            <NavLink to="/forgot-password" className='forgot-link'>Forgot Password?</NavLink>
          </div>
          <button type="submit" className='btn-widget'>Login</button>
        </form>

        <p>
          Don't have an account? <NavLink to="/signup" className="span-class-link">Sign Up</NavLink>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;

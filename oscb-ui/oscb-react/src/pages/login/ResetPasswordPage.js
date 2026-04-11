import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { NODE_API_URL  } from '../../constants/declarations';


const ResetPasswordPage = () => {
  const { token } = useParams();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');

  function sleep(time) {
    return new Promise(resolve => setTimeout(resolve, time));
  }

  const handleSubmit = (e) => {
    console.log(token);
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setMessage('The passwords you entered do not match, please try again.');
      return;
    }

    fetch(NODE_API_URL + "/reset-password", {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, newPassword, confirmPassword }),
    })
    .then(response => {
      if (!response.ok) {
        return response.json().then(error => { throw new Error(error.message) });
      }
      return response.json();
    })
    .then(data => {
      setMessage(data.message);
      sleep(5000);
      window.location.href = '/login';
    })
    .catch(error => {
      console.error('Error occurred:', error);
      setMessage('Your token is invalid or expired. Please use the "Forgot Password?" link to try again');
      sleep(5000);
      window.location.href = '/forgot-password';
    });
  };

  return (
    <div className="page-container">
      <div className="left-nav">
          {/* <LeftNav /> */}
      </div>
      <div className='login-container comn-container-auth'>
        <div className='inner-container-auth'>
          <h1>Reset Password</h1>
          <form onSubmit={handleSubmit}>
            <div>
              <label htmlFor="password">Password:</label>
              <input
                type='password'
                id='password'
                value={newPassword}
                className="form-input" 
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder='Please enter your new password'
                required
              />
            </div>
            <div>
              <label htmlFor="confirmPassword">Confirm Password:</label>
              <input
                type='password'
                id='confirmPassword'
                value={confirmPassword}
                className="form-input" 
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder='Please confirm your new password'
                required
              />
            </div>
            <div>
              <button type='submit' className='btn-widget'>Reset Password</button>
            </div> 
          </form>
          {message && <p>{message}</p>}
        </div>
      </div>
      <div className="right-rail">
          {/* <RightRail /> */}
      </div>
    </div>
  );
};

export default ResetPasswordPage;

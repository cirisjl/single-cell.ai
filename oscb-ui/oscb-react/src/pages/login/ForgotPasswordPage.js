import React, { useState } from 'react';
import { NODE_API_URL  } from '../../constants/declarations';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    fetch(NODE_API_URL + "/forgot-password", {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    .then(response => {
      if (!response.ok) {
        return response.json().then(error => { throw new Error(error.message) });
      }
      return response.json();
    })
    .then(data => {
      setMessage(data.message);
    })
    .catch(error => {
      console.error('Error occurred:', error);
      setMessage('The email you entered is not found in our system, please use the email you registered with.');
    });
  };

  return (
    <div className="page-container">
      <div className="left-nav">
          {/* <LeftNav /> */}
      </div>
      <div className='login-container comn-container-auth'>
        <div className='inner-container-auth'>
          <h1>Forgot Password</h1>
          <form onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email">email:</label>
            <input
              type='email'
              id="email"
              value={email}
              className="form-input" 
              onChange={handleEmailChange}
              placeholder='Please enter your email'
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

export default ForgotPasswordPage;
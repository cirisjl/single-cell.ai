import React, { useEffect } from 'react';

function AlertMessageComponent({ message, setHasMessage, setMessage, isError }) {

  const backgroundColor = isError ? '#f0c0c0' : '#bdf0c0';

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setMessage('');
      setHasMessage(false);
    }, 5000);
    // Return a cleanup function to cancel the timeout when the component unmounts
    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [message]);


  return (
    <div>
      {message &&
        <div className='message-box' style={{ backgroundColor: backgroundColor }}>
          <div style={{ textAlign: 'center' }}>
            <p>{message}</p>
          </div>
        </div>
      }
    </div>
  );
}

export default AlertMessageComponent;

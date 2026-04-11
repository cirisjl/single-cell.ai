import React, { useState, useEffect } from 'react';
import { getCookie, isUserAuth } from '../../utils/utilFunctions';
import { useNavigate } from 'react-router-dom';

import { FLASK_BACKEND_API } from '../../constants/declarations'


export default function FlaskDashboard(props) {
  const [flaskURL, setFlaskURL] = useState(null);


  const navigate = useNavigate();

  useEffect(() => {

    const jwtToken = getCookie('jwtToken');

    isUserAuth(jwtToken)
      .then((authData) => {
        if (authData.isAuth) {
          setFlaskURL(FLASK_BACKEND_API)
        } else {
          console.warn("Unauthorized - please login first to continue");
          navigate("/routing");
        }
      })
      .catch((error) => {
        console.error(error);
      }
      );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      {/* {dashApp && (
        <div dangerouslySetInnerHTML={{ __html: dashApp }} />
      )} */}
      {flaskURL && (
        <iframe title="Flask Dashboard" src={flaskURL} // Replace this with the Flask app URL
          width="100%"
          height="100vh"
          id="dashFrame"
          style={{ display: "initial", position: "relative" }}
        />
      )}
    </div>
  );
};
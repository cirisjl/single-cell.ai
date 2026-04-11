import { useEffect } from 'react';
import { isUserAuth, getCookie } from '../../utils/utilFunctions'
import { useNavigate } from 'react-router-dom';

function useAdminAuthCheck() {

  const navigate = useNavigate();

  useEffect(() => {
    if (!getCookie('jwtToken')) {
      console.warn("Please login to continue");
      navigate('/routing');
    }
    isUserAuth(getCookie('jwtToken'))
      .then((authData) => {
        if (authData.isAuth && authData.isAdmin) {
          console.log("User is admin and has access to this page");
        } else {
          console.warn("Unauthorized - you must be an admin to access this page");
          navigate("/accessDenied");
        }
      })
      .catch((error) => {
        console.error(error);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

export default useAdminAuthCheck;
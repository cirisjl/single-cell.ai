import { useEffect } from 'react';
import { isUserAuth, getCookie } from '../../utils/utilFunctions'
import { useNavigate } from 'react-router-dom';

function useUserAuthCheck() {

    const navigate = useNavigate();
    useEffect(() => {
        if (!getCookie('jwtToken')) {
            console.warn("Please login to continue");
            navigate('/login');
        }
        isUserAuth(getCookie('jwtToken'))
            .then((authData) => {
                if (authData.isAuth) {
                    console.log("User is authorised and has access to this page");
                } else {
                    console.warn("Please login to continue");
                    navigate('/login');
                }
            })
            .catch((error) => {
                console.error(error);
            });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
}

export default useUserAuthCheck;
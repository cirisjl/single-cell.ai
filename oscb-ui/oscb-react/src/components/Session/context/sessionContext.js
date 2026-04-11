import React, { createContext, useContext, useState , useEffect} from 'react';
import {NODE_API_URL} from '../../../constants/declarations';
import {getCookie, setCookie} from '../../../utils/utilFunctions';
import {jwtDecode} from 'jwt-decode';

const SessionContext = createContext();

export function useSession() {
    return useContext(SessionContext);
}

export const SessionProvider = ({ children }) => {
    const [isModalDismissed, setIsModalDismissed] = useState(false);
    const [token, setToken] = useState(getCookie('jwtToken'));

    const extendSession = async () => {
        try {
            const response = await fetch(`${NODE_API_URL}/refresh-token`, {
                method: 'GET',
                credentials: 'include',
                headers: { 'Authorization': `Bearer ${getCookie('jwtToken')}` },
            });
            if (!response.ok) throw new Error('Failed to refresh token');
            const data = await response.json();
            // Assume the new token is in the response and update accordingly
            // setCookie('jwtToken', data.token, 2); // Update the cookie with the new token
            setToken(getCookie('jwtToken'));
            setIsModalDismissed(false); // Allow modal to reappear in next session expiration check
            console.log("Session extended.");
        } catch (error) {
            console.error("Error extending session:", error);
        }
    };

        // Automatically navigate to /routing if the token has expired and no action was taken
        useEffect(() => {
            if (!token) return null; // Ensure there's a token to decode
            const interval = setInterval(() => {
                const { exp } = jwtDecode(token);
                const currentTime = Date.now() / 1000;
                if (exp < currentTime) {
                    window.location.href = '/routing'; // Change to use navigate from useNavigate if within component
                }
            }, 1000);
    
            return () => clearInterval(interval);
        }, [token]);

    return (
        <SessionContext.Provider value={{ isModalDismissed, setIsModalDismissed, extendSession, token, setToken }}>
            {children}
        </SessionContext.Provider>
    );
};

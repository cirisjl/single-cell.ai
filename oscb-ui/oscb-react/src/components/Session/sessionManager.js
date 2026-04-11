import React, { useState, useEffect, useCallback } from 'react';
import { jwtDecode } from 'jwt-decode';
import { getCookie, isUserAuth } from '../../utils/utilFunctions';
import { NODE_API_URL } from '../../constants/declarations'
// import { useNavigate } from 'react-router-dom';
import PopUpModal from './popupModal';

const SessionReminder = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const [token, setToken] = useState(() => getCookie('jwtToken'));
    // const navigate = useNavigate();
    const [timeLeft, setTimeLeft] = useState(null);


    useEffect(() => {
        const handleCountdown = () => {
            const { exp } = jwtDecode(token);
            const currentTime = Date.now() / 1000;
            const newTimeLeft = exp - currentTime;
            setTimeLeft(newTimeLeft);

            if (newTimeLeft <= 0) {
                setIsModalOpen(false);
                window.location.href = '/routing';
            }
        };

        let countdownInterval;
        if (isModalOpen) {
            countdownInterval = setInterval(handleCountdown, 1000);
        }

        return () => clearInterval(countdownInterval);
    }, [isModalOpen, token]);

    const extendSession = useCallback(async () => {
        isUserAuth(getCookie('jwtToken'))
            .then((authData) => {
                if (authData.isAuth) {
                    fetch(NODE_API_URL + "/refresh-token", {
                        method: 'GET',
                        credentials: 'include', // send cookies with the request
                        headers: { 'Authorization': `Bearer ${getCookie('jwtToken')}` },
                    })
                        .then((response) => {
                            if (!response.ok) {
                                throw new Error('Failed to refresh token');
                            }
                            return response.json();
                        })
                        .then((data) => {
                            setToken(getCookie('jwtToken'));
                            setIsModalOpen(false); // Close the modal
                            setTimeLeft(null); // Reset time left
                            console.log(data); // Log the response data
                        })
                        .catch((error) => {
                            console.error('Error refreshing token:', error);
                        });
                } else {
                    console.warn("Please login to continue");
                    window.location.href = '/routing';
                }
            })
            .catch((error) => {
                console.error('Error checking user authentication:', error);
            });
    }, []);

    useEffect(() => {
        if (!token) return;

        const { exp } = jwtDecode(token);
        const currentTime = Date.now() / 1000;
        const timeUntilModal = (exp - 300) - currentTime; // Time until 5 minutes before expiration

        if (timeUntilModal <= 0 && exp - currentTime > 0) {
            setIsModalOpen(true); // Show the modal immediately if within last 5 minutes
            setTimeLeft(exp - currentTime); // Update time left for the modal
        } else if (timeUntilModal > 0) {
            // Schedule showing the modal 5 minutes before the token expires
            const modalTimerId = setTimeout(() => {
                setIsModalOpen(true);
                setTimeLeft(60); // Set time left to 5 minutes
            }, timeUntilModal * 1000);

            return () => clearTimeout(modalTimerId);
        }
    }, [token]);

    useEffect(() => {
        // Define the function to handle user click
        const handleUserClick = () => {
            extendSession(); // Call to extend the session on every click
        };

        // Attach the event listener to the whole document
        document.addEventListener('click', handleUserClick);

        // Cleanup the event listener on component unmount
        return () => {
            document.removeEventListener('click', handleUserClick);
        };
    }, [extendSession]);

    const handleClose = () => {
        setIsModalOpen(false);
        // Setup redirection to occur after the token's remaining time expires
        const remainingTime = Math.max(0, Math.floor(timeLeft));
        setTimeout(() => {
            window.location.href = '/routing';
        }, remainingTime * 1000);
    };

    return (
        <div className="session-manager-component">
            <PopUpModal
                isOpen={isModalOpen}
                onClose={handleClose}
                onExtend={extendSession}
                timeLeft={Math.max(0, Math.floor(timeLeft || 0))}
            />
        </div>
    );
};

export default SessionReminder;

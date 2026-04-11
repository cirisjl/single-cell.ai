import { useState, useEffect } from 'react';
import { WEB_SOCKET_URL } from '../../../../constants/declarations';

export function useWebSocketManager(jobId, setLiveLogs) {
    const [logs, setLogs] = useState('');
    const [taskStatus, setTaskStatus] = useState('Processing');

    useEffect(() => {
        if (!jobId) return;

        const statusWs = new WebSocket(`${WEB_SOCKET_URL}/taskStatus/${jobId}`);
        const logWs = new WebSocket(`${WEB_SOCKET_URL}/log/${jobId}`);

        const handleStatusMessage = (event) => {
            const data = JSON.parse(event.data);
            if (data[jobId]) {
                setTaskStatus(data[jobId]);
                if (['Success', 'Failed'].includes(data[jobId])) {
                    statusWs.close();
                    logWs.close();
                    console.log("Web socket disconnected");
                }
            }
        };

        const handleLogMessage = (event) => {
            setLiveLogs(event.data);
        };

        statusWs.onmessage = handleStatusMessage;
        logWs.onmessage = handleLogMessage;

        statusWs.onopen = () => console.log('Status WebSocket Connected');
        logWs.onopen = () => console.log('Log WebSocket Connected');

        // Error handling can be more nuanced based on your app's requirements
        const handleError = (error) => console.error('WebSocket Error:', error);
        statusWs.onerror = handleError;
        logWs.onerror = handleError;

        // Cleanup function
        return () => {
            statusWs.close();
            logWs.close();
            console.log("websockets disconnected");
        };
    }, [jobId]); // Reconnect WebSockets if jobId changes

    return { taskStatus};
}

import { useEffect, useRef } from 'react';

function useWebSockets(jobId, handleStatusMessage, WEB_SOCKET_URL) {
    const webSocketsRef = useRef({});

    useEffect(() => {
        if (!jobId) return;

        const statusUrl = `${WEB_SOCKET_URL}/taskCurrentStatus/${jobId}`;
        if (!webSocketsRef.current[jobId]) {
            console.log("Opening new WebSocket connection for:", jobId);
            const ws = new WebSocket(statusUrl);
            ws.onopen = () => console.log('WebSocket Connected:', jobId);
            ws.onmessage = handleStatusMessage;
            ws.onerror = error => console.error('WebSocket Error:', jobId, error);
            ws.onclose = () => console.log('WebSocket Closed:', jobId);
            webSocketsRef.current[jobId] = ws;
        }

        return () => {
            // Cleanup function to close the WebSocket when component unmounts or jobId changes
            const ws = webSocketsRef.current[jobId];
            if (ws) {
                console.log('Cleaning up WebSocket:', jobId);
                ws.close();
                // eslint-disable-next-line react-hooks/exhaustive-deps
                delete webSocketsRef.current[jobId];
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [jobId]);

    const closeWebSocket = (id) => {
        const ws = webSocketsRef.current[id];
        if (ws) {
            console.log('Manually closing WebSocket:', id);
            ws.close();
            delete webSocketsRef.current[id];
        }
    };

    return { closeWebSocket };
}


export default useWebSockets;
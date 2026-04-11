import { useEffect, useRef } from 'react';
import { WEB_SOCKET_URL } from '../../constants/declarations';

function useWebSocketToCheckStatus(jobId, onStatusMessage, setLoading) {
  const webSocketStatus = useRef(null);

  useEffect(() => {
    if (!jobId) {
      console.log("No task ID available for WebSocket connection.");
      return; // Don't proceed if jobId is not set
    }

    // Setup WebSocket for task status updates
    const statusUrl = `${WEB_SOCKET_URL}/taskCurrentStatus/${jobId}`;
    console.log("Connecting to status WebSocket:", statusUrl);
    webSocketStatus.current = new WebSocket(statusUrl);
    webSocketStatus.current.onopen = () => console.log('WebSocket Status Connected:', jobId);
    webSocketStatus.current.onmessage = onStatusMessage;
    webSocketStatus.current.onerror = error => {
      setLoading(false);
      console.error('WebSocket Status Error:', error);
    };
    webSocketStatus.current.onclose = () => console.log('WebSocket for status closed:', jobId);

    return () => {
      // Cleanup on unmount or jobId change
      console.log('Cleaning up WebSockets for:', jobId);
      if (webSocketStatus.current) {
        webSocketStatus.current.close();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId]);

  const closeWebSockets = () => {
    // Function to manually close WebSockets from the component
    if (webSocketStatus.current) {
      webSocketStatus.current.close();
    }
  };

  return { closeWebSockets };
}

export default useWebSocketToCheckStatus;
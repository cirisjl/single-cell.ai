import { useEffect, useRef } from 'react';
import { WEB_SOCKET_URL } from '../../../constants/declarations';

function useWebSocket(jobId, onStatusMessage, onLogMessage, setLoading) {
  // 1. Refs to keep track of the socket instances
  const webSocketStatus = useRef(null);
  const webSocketLog = useRef(null);

  // 2. Refs to hold the LATEST version of your callbacks
  // This prevents "stale closures" without forcing the socket to reconnect
  const onStatusMessageRef = useRef(onStatusMessage);
  const onLogMessageRef = useRef(onLogMessage);

  // Keep the refs updated whenever the parent passes new functions
  useEffect(() => {
    onStatusMessageRef.current = onStatusMessage;
    onLogMessageRef.current = onLogMessage;
  }, [onStatusMessage, onLogMessage]);

  useEffect(() => {
    if (!jobId) return;

    // --- Status WebSocket Setup ---
    const statusUrl = `${WEB_SOCKET_URL}/taskCurrentStatus/${jobId}`;
    console.log("Connecting to status WebSocket:", statusUrl);

    const wsStatus = new WebSocket(statusUrl);
    webSocketStatus.current = wsStatus;

    wsStatus.onopen = () => console.log('WebSocket Status Connected:', jobId);

    // Use the ref here so we always call the latest function
    wsStatus.onmessage = (event) => {
      const text = event?.data;

      // Try JSON first
      try {
        const data = JSON.parse(text);
        if (onStatusMessageRef.current) {
          onStatusMessageRef.current({ data, rawEvent: event });
          return; // If it's JSON, we assume it's a status message and exit after handling
        }
      } catch (e) {
        // Not JSON => treat as log line
        onLogMessageRef.current(event);
      }
    };

    wsStatus.onclose = (event) => {
      console.log('WebSocket Status Closed:', event);
    };

    wsStatus.onerror = (error) => {
      console.error('WebSocket Status Error:', error);
      setLoading(false);
    };

    // --- Log WebSocket Setup ---
    const logUrl = `${WEB_SOCKET_URL}/log/${jobId}`;
    console.log("Connecting to log WebSocket:", logUrl);

    const wsLog = new WebSocket(logUrl);
    webSocketLog.current = wsLog;

    wsLog.onopen = () => console.log('WebSocket Log Connected:', jobId);

    wsLog.onmessage = (event) => {
      if (onLogMessageRef.current) {
        onLogMessageRef.current(event);
      }
    };

    wsLog.onerror = (error) => {
      console.error('WebSocket Log Error:', error);
      // We generally don't stop loading just because logs failed, 
      // but that depends on your UI requirements.
    };

    // --- Cleanup Function ---
    return () => {
      console.log('Cleaning up WebSockets for:', jobId);

      // We check readyState to avoid closing an already closed socket
      if (wsStatus && wsStatus.readyState === 1) {
        wsStatus.close();
      }
      if (wsLog && wsLog.readyState === 1) {
        wsLog.close();
      }
    };
    // The dependency array ONLY contains jobId. 
    // Changing callbacks or setLoading will NOT trigger a reconnection.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId]);

  const closeWebSockets = () => {
    if (webSocketStatus.current) webSocketStatus.current.close();
    if (webSocketLog.current) webSocketLog.current.close();
  };

  return { closeWebSockets };
}

export default useWebSocket;
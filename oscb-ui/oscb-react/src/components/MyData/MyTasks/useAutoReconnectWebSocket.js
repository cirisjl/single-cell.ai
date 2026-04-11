import { useEffect, useRef, useCallback, useState } from "react";

const DEFAULT_OPTIONS = {
    reconnect: true,
    maxRetries: 10,
    reconnectDelay: 1000, // base delay
    maxReconnectDelay: 15000,
    heartbeatInterval: null, // e.g., 20000 if needed
};

export default function useAutoReconnectWebSocket(
    url,
    {
        onOpen,
        onMessage,
        onClose,
        onError,
        shouldReconnect = () => true,
        options = {},
    } = {}
) {
    const config = { ...DEFAULT_OPTIONS, ...options };

    const wsRef = useRef(null);
    const retryCountRef = useRef(0);
    const reconnectTimeoutRef = useRef(null);
    const heartbeatRef = useRef(null);
    const manualCloseRef = useRef(false);

    const [readyState, setReadyState] = useState(WebSocket.CLOSED);

    const clearReconnectTimeout = () => {
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
        }
    };

    const clearHeartbeat = () => {
        if (heartbeatRef.current) {
            clearInterval(heartbeatRef.current);
            heartbeatRef.current = null;
        }
    };

    const connect = useCallback(() => {
        if (!url) return;

        manualCloseRef.current = false;

        const ws = new WebSocket(url);
        wsRef.current = ws;

        setReadyState(WebSocket.CONNECTING);

        ws.onopen = () => {
            retryCountRef.current = 0;
            setReadyState(WebSocket.OPEN);
            onOpen?.();

            if (config.heartbeatInterval) {
                heartbeatRef.current = setInterval(() => {
                    if (ws.readyState === WebSocket.OPEN) {
                        ws.send(JSON.stringify({ type: "ping" }));
                    }
                }, config.heartbeatInterval);
            }
        };

        ws.onmessage = (event) => {
            onMessage?.(event);
        };

        ws.onerror = (err) => {
            onError?.(err);
        };

        ws.onclose = (event) => {
            setReadyState(WebSocket.CLOSED);
            clearHeartbeat();
            onClose?.(event);

            if (
                config.reconnect &&
                !manualCloseRef.current &&
                retryCountRef.current < config.maxRetries &&
                shouldReconnect()
            ) {
                const delay = Math.min(
                    config.reconnectDelay * 2 ** retryCountRef.current,
                    config.maxReconnectDelay
                );

                retryCountRef.current += 1;

                reconnectTimeoutRef.current = setTimeout(() => {
                    connect();
                }, delay);
            }
        };
    }, [url, onOpen, onMessage, onClose, onError, shouldReconnect, config]);

    const disconnect = useCallback(() => {
        manualCloseRef.current = true;
        clearReconnectTimeout();
        clearHeartbeat();

        if (wsRef.current) {
            wsRef.current.close();
        }
    }, []);

    const reconnect = useCallback(() => {
        disconnect();
        retryCountRef.current = 0;
        connect();
    }, [disconnect, connect]);

    const sendMessage = useCallback((data) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(data);
        }
    }, []);

    useEffect(() => {
        connect();

        return () => {
            disconnect();
        };
    }, [connect, disconnect]);

    return {
        sendMessage,
        reconnect,
        disconnect,
        readyState,
        isConnected: readyState === WebSocket.OPEN,
    };
}
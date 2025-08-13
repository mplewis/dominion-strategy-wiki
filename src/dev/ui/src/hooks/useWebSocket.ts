import { useEffect, useRef, useState } from "react";

interface WebSocketMessage {
	type: string;
	payload?: unknown;
}

interface UseWebSocketOptions {
	url: string;
	onMessage?: (message: WebSocketMessage) => void;
	reconnectInterval?: number;
	maxReconnectAttempts?: number;
}

interface UseWebSocketReturn {
	isConnected: boolean;
	connectionError: string | null;
	send: (message: WebSocketMessage) => void;
	close: () => void;
}

/**
 * Custom hook for managing WebSocket connections with automatic reconnection.
 * Provides connection state management, message handling, and cleanup.
 */
export const useWebSocket = ({
	url,
	onMessage,
	reconnectInterval = 3000,
	maxReconnectAttempts = 5,
}: UseWebSocketOptions): UseWebSocketReturn => {
	const [isConnected, setIsConnected] = useState(false);
	const [connectionError, setConnectionError] = useState<string | null>(null);
	const wsRef = useRef<WebSocket | null>(null);
	const reconnectAttemptRef = useRef(0);
	const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
	const shouldReconnectRef = useRef(true);
	const onMessageRef = useRef(onMessage);

	// Update the callback ref when onMessage changes
	useEffect(() => {
		onMessageRef.current = onMessage;
	}, [onMessage]);

	useEffect(() => {
		const cleanup = () => {
			if (reconnectTimeoutRef.current) {
				clearTimeout(reconnectTimeoutRef.current);
				reconnectTimeoutRef.current = null;
			}
			if (wsRef.current) {
				wsRef.current.close();
				wsRef.current = null;
			}
		};

		const connect = () => {
			cleanup();

			try {
				const ws = new WebSocket(url);
				wsRef.current = ws;

				ws.onopen = () => {
					console.log("🔌 WebSocket connected");
					setIsConnected(true);
					setConnectionError(null);
					reconnectAttemptRef.current = 0;
				};

				ws.onmessage = (event) => {
					try {
						const message: WebSocketMessage = JSON.parse(event.data);
						onMessageRef.current?.(message);
					} catch (error) {
						console.error("Failed to parse WebSocket message:", error);
					}
				};

				ws.onclose = (event) => {
					console.log("🔌 WebSocket disconnected", event.code, event.reason);
					setIsConnected(false);
					wsRef.current = null;

					// Attempt reconnection if it wasn't a manual close and we haven't exceeded max attempts
					if (shouldReconnectRef.current && reconnectAttemptRef.current < maxReconnectAttempts) {
						reconnectAttemptRef.current++;
						console.log(
							`🔄 Attempting WebSocket reconnection ${reconnectAttemptRef.current}/${maxReconnectAttempts}...`,
						);

						reconnectTimeoutRef.current = setTimeout(() => {
							connect();
						}, reconnectInterval);
					} else if (reconnectAttemptRef.current >= maxReconnectAttempts) {
						setConnectionError("Failed to establish WebSocket connection after multiple attempts");
					}
				};

				ws.onerror = (error) => {
					console.error("WebSocket error:", error);
					setConnectionError("WebSocket connection error");
				};
			} catch (error) {
				console.error("Failed to create WebSocket:", error);
				setConnectionError("Failed to create WebSocket connection");
			}
		};

		shouldReconnectRef.current = true;
		connect();

		return () => {
			shouldReconnectRef.current = false;
			cleanup();
		};
	}, [url, maxReconnectAttempts, reconnectInterval]);

	const send = (message: WebSocketMessage) => {
		if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
			wsRef.current.send(JSON.stringify(message));
		} else {
			console.warn("WebSocket is not connected, cannot send message");
		}
	};

	const close = () => {
		shouldReconnectRef.current = false;
		if (reconnectTimeoutRef.current) {
			clearTimeout(reconnectTimeoutRef.current);
			reconnectTimeoutRef.current = null;
		}
		if (wsRef.current) {
			wsRef.current.close();
			wsRef.current = null;
		}
		setIsConnected(false);
	};

	return {
		isConnected,
		connectionError,
		send,
		close,
	};
};

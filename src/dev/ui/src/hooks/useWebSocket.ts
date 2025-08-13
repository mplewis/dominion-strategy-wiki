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

// Global singleton to prevent multiple connections in StrictMode
const globalWebSocketManager = {
	instance: null as WebSocket | null,
	url: null as string | null,
	listeners: new Set<(message: WebSocketMessage) => void>(),
	isConnected: false,
	connectionError: null as string | null,
	reconnectAttempt: 0,
	maxReconnectAttempts: 5,
	reconnectInterval: 3000,
	reconnectTimeout: null as NodeJS.Timeout | null,
	shouldReconnect: true,

	connect(url: string) {
		if (
			this.instance &&
			this.url === url &&
			(this.instance.readyState === WebSocket.CONNECTING || this.instance.readyState === WebSocket.OPEN)
		) {
			console.log("🔌 WebSocket already connecting/connected to", url);
			return;
		}

		this.cleanup();
		this.url = url;

		try {
			const ws = new WebSocket(url);
			this.instance = ws;

			ws.onopen = () => {
				console.log("🔌 WebSocket connected");
				this.isConnected = true;
				this.connectionError = null;
				this.reconnectAttempt = 0;
			};

			ws.onmessage = (event) => {
				try {
					const message: WebSocketMessage = JSON.parse(event.data);
					this.listeners.forEach((listener) => listener(message));
				} catch (error) {
					console.error("Failed to parse WebSocket message:", error);
				}
			};

			ws.onclose = (event) => {
				console.log("🔌 WebSocket disconnected", event.code, event.reason);
				this.isConnected = false;
				this.instance = null;

				if (this.shouldReconnect && this.reconnectAttempt < this.maxReconnectAttempts) {
					this.reconnectAttempt++;
					console.log(`🔄 Attempting WebSocket reconnection ${this.reconnectAttempt}/${this.maxReconnectAttempts}...`);

					this.reconnectTimeout = setTimeout(() => {
						this.connect(url);
					}, this.reconnectInterval);
				} else if (this.reconnectAttempt >= this.maxReconnectAttempts) {
					this.connectionError = "Failed to establish WebSocket connection after multiple attempts";
				}
			};

			ws.onerror = (error) => {
				console.error("WebSocket error:", error);
				this.connectionError = "WebSocket connection error";
			};
		} catch (error) {
			console.error("Failed to create WebSocket:", error);
			this.connectionError = "Failed to create WebSocket connection";
		}
	},

	cleanup() {
		if (this.reconnectTimeout) {
			clearTimeout(this.reconnectTimeout);
			this.reconnectTimeout = null;
		}
		if (this.instance) {
			this.instance.close();
			this.instance = null;
		}
	},

	addListener(callback: (message: WebSocketMessage) => void) {
		this.listeners.add(callback);
	},

	removeListener(callback: (message: WebSocketMessage) => void) {
		this.listeners.delete(callback);
	},

	send(message: WebSocketMessage) {
		if (this.instance && this.instance.readyState === WebSocket.OPEN) {
			this.instance.send(JSON.stringify(message));
		} else {
			console.warn("WebSocket is not connected, cannot send message");
		}
	},

	close() {
		this.shouldReconnect = false;
		this.cleanup();
		this.isConnected = false;
	},
};

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
	const [isConnected, setIsConnected] = useState(globalWebSocketManager.isConnected);
	const [connectionError, setConnectionError] = useState<string | null>(globalWebSocketManager.connectionError);
	const onMessageRef = useRef(onMessage);

	// Update the callback ref when onMessage changes
	useEffect(() => {
		onMessageRef.current = onMessage;
	}, [onMessage]);

	useEffect(() => {
		globalWebSocketManager.reconnectInterval = reconnectInterval;
		globalWebSocketManager.maxReconnectAttempts = maxReconnectAttempts;

		globalWebSocketManager.connect(url);

		const messageListener = (message: WebSocketMessage) => {
			onMessageRef.current?.(message);
		};
		globalWebSocketManager.addListener(messageListener);

		const syncState = () => {
			setIsConnected(globalWebSocketManager.isConnected);
			setConnectionError(globalWebSocketManager.connectionError);
		};
		syncState();
		// Poll for state changes (simple approach for now)
		const stateSync = setInterval(syncState, 100);

		return () => {
			globalWebSocketManager.removeListener(messageListener);
			clearInterval(stateSync);
		};
	}, [url, maxReconnectAttempts, reconnectInterval]);

	const send = (message: WebSocketMessage) => {
		globalWebSocketManager.send(message);
	};

	const close = () => {
		globalWebSocketManager.close();
	};

	return {
		isConnected,
		connectionError,
		send,
		close,
	};
};

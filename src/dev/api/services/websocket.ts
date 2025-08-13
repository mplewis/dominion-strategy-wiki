import type { IncomingMessage, Server } from "node:http";
import type { WebSocketServer, WebSocket as WSWebSocket } from "ws";
import { WebSocketServer as WSServer } from "ws";

export interface WebSocketMessage {
	type: string;
	payload?: unknown;
}

/**
 * WebSocket service for managing real-time communication with clients.
 * Handles connection management, message broadcasting, and cleanup.
 */
export class WebSocketService {
	private wss: WebSocketServer | null = null;
	private connections: Set<WSWebSocket> = new Set();

	/**
	 * Initializes the WebSocket server on the given HTTP server
	 */
	public init(server: Server): void {
		this.wss = new WSServer({ server });

		this.wss.on("connection", (ws: WSWebSocket, request: IncomingMessage) => {
			console.log(`WebSocket client connected from ${request.socket.remoteAddress}`);
			this.connections.add(ws);

			ws.on("close", () => {
				console.log("WebSocket client disconnected");
				this.connections.delete(ws);
			});

			ws.on("error", (error) => {
				console.error("WebSocket error:", error);
				this.connections.delete(ws);
			});

			// Send welcome message
			this.sendToClient(ws, {
				type: "connected",
				payload: { message: "WebSocket connection established" },
			});
		});
	}

	/**
	 * Broadcasts a message to all connected clients
	 */
	public broadcast(message: WebSocketMessage): void {
		const messageStr = JSON.stringify(message);
		let sentCount = 0;

		for (const ws of this.connections) {
			if (ws.readyState === ws.OPEN) {
				try {
					ws.send(messageStr);
					sentCount++;
				} catch (error) {
					console.error("Error sending WebSocket message:", error);
					this.connections.delete(ws);
				}
			} else {
				// Clean up closed connections
				this.connections.delete(ws);
			}
		}

		console.log(`Broadcasted message to ${sentCount} client${sentCount === 1 ? "" : "s"}: ${message.type}`);
	}

	/**
	 * Sends a message to a specific client
	 */
	private sendToClient(ws: WSWebSocket, message: WebSocketMessage): void {
		if (ws.readyState === ws.OPEN) {
			try {
				ws.send(JSON.stringify(message));
			} catch (error) {
				console.error("Error sending WebSocket message to client:", error);
				this.connections.delete(ws);
			}
		}
	}

	/**
	 * Gets the number of active connections
	 */
	public getConnectionCount(): number {
		// Clean up stale connections first
		for (const ws of this.connections) {
			if (ws.readyState !== ws.OPEN) {
				this.connections.delete(ws);
			}
		}
		return this.connections.size;
	}

	/**
	 * Closes all connections and shuts down the WebSocket server
	 */
	public close(): void {
		for (const ws of this.connections) {
			ws.close();
		}
		this.connections.clear();

		if (this.wss) {
			this.wss.close();
			this.wss = null;
		}
	}
}

export const webSocketService = new WebSocketService();

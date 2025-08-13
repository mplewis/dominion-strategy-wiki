import styled from "@emotion/styled";
import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";

/** Time in milliseconds to hide the status when idle */
const STATUS_HIDE_DELAY = 2000;

/** Status indicator container with color states */
const StatusContainer = styled.div<{ connected: boolean }>`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	padding: 0.5rem 0.75rem;
	font-size: 0.75rem;
	border-radius: 0.375rem;
	background-color: ${(props) => (props.connected ? "#dcfce7" : "#fef3c7")};
	color: ${(props) => (props.connected ? "#166534" : "#92400e")};
	border: 1px solid ${(props) => (props.connected ? "#bbf7d0" : "#fde68a")};
`;

/** Status dot indicator */
const StatusDot = styled.div<{ connected: boolean }>`
	width: 8px;
	height: 8px;
	border-radius: 50%;
	background-color: ${(props) => (props.connected ? "#16a34a" : "#d97706")};
`;

/** Props for the StatusIndicator component */
interface StatusIndicatorProps {
	isConnected: boolean;
	connectionError: string | null;
	message?: { type: string; payload?: unknown } | null;
}

/**
 * WebSocket status indicator with auto-hide functionality.
 * Shows connection status and hides after a delay when idle.
 */
export const StatusIndicator: React.FC<StatusIndicatorProps> = ({ isConnected, connectionError, message }) => {
	const [wsStatus, setWsStatus] = useState<string>("Connecting...");
	const [showStatus, setShowStatus] = useState<boolean>(true);
	const hideTimerRef = useRef<NodeJS.Timeout | null>(null);

	// Helper function to set status with auto-hide
	const setStatusWithHide = useCallback((status: string) => {
		setWsStatus(status);
		setShowStatus(true);

		// Clear existing timer
		if (hideTimerRef.current) {
			clearTimeout(hideTimerRef.current);
		}

		// Set new timer
		hideTimerRef.current = setTimeout(() => {
			setShowStatus(false);
			hideTimerRef.current = null;
		}, STATUS_HIDE_DELAY);
	}, []);

	// Handle WebSocket messages
	useEffect(() => {
		if (!message) return;

		if (message.type === "connected") {
			setStatusWithHide("Connected");
		} else if (message.type === "fileChanged") {
			const { filePath } = message.payload as { filePath: string };
			setStatusWithHide(`File changed: ${filePath}`);
		}
	}, [message, setStatusWithHide]);

	// Update status based on connection state
	useEffect(() => {
		if (connectionError) {
			setWsStatus(`Error: ${connectionError}`);
			setShowStatus(true);
			// Clear hide timer for persistent error display
			if (hideTimerRef.current) {
				clearTimeout(hideTimerRef.current);
				hideTimerRef.current = null;
			}
		} else if (isConnected) {
			setStatusWithHide("Connected");
		} else {
			setWsStatus("Connecting...");
			setShowStatus(true);
			// Clear hide timer for persistent connecting display
			if (hideTimerRef.current) {
				clearTimeout(hideTimerRef.current);
				hideTimerRef.current = null;
			}
		}
	}, [isConnected, connectionError, setStatusWithHide]);

	// Cleanup timer on unmount
	useEffect(() => {
		return () => {
			if (hideTimerRef.current) {
				clearTimeout(hideTimerRef.current);
			}
		};
	}, []);

	if (!showStatus) {
		return null;
	}

	return (
		<StatusContainer connected={isConnected}>
			<StatusDot connected={isConnected} />
			{wsStatus}
		</StatusContainer>
	);
};

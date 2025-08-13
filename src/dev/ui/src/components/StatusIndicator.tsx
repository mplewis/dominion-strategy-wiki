import styled from "@emotion/styled";
import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";

/** Time in milliseconds to hide the status when idle */
const STATUS_HIDE_DELAY = 2000;

/** Time in milliseconds for fade-out transition */
const FADE_OUT_DURATION = 300;

/** Extra time after fade completes to cleanly hide the element */
const FADE_OUT_TAIL = 500;

/** Color palette for status indicator states */
const COLORS = {
	// Success/Connected state (green)
	SUCCESS: {
		BACKGROUND: "#dcfce7",
		TEXT: "#166534",
		BORDER: "#bbf7d0",
		DOT: "#16a34a",
	},

	// Warning/Building/Connecting state (yellow)
	WARNING: {
		BACKGROUND: "#fef3c7",
		TEXT: "#92400e",
		BORDER: "#fde68a",
		DOT: "#d97706",
	},

	// Error/Disconnected state (red)
	ERROR: {
		BACKGROUND: "#fee2e2",
		TEXT: "#b91c1c",
		BORDER: "#fca5a5",
		DOT: "#dc2626",
	},
} as const;

function getColors(props: { connected: boolean; isBuilding: boolean; isError?: boolean }) {
	if (props.isError) {
		return COLORS.ERROR;
	}
	if (props.isBuilding) {
		return COLORS.WARNING;
	}
	if (props.connected) {
		return COLORS.SUCCESS;
	}
	return COLORS.WARNING;
}

/** Status indicator container with color states and fade transition */
const StatusContainer = styled.div<{ connected: boolean; isVisible: boolean; isBuilding: boolean; isError: boolean }>`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	padding: 0.5rem 0.75rem;
	font-size: 0.75rem;
	border-radius: 0.375rem;
	background-color: ${(props) => getColors(props).BACKGROUND};
	color: ${(props) => getColors(props).TEXT};
	border: 1px solid ${(props) => getColors(props).BORDER};
	opacity: ${(props) => (props.isVisible ? 1 : 0)};
	transition: opacity 800ms ease-out;
`;

/** Status dot indicator */
const StatusDot = styled.div<{ connected: boolean; isBuilding: boolean; isError: boolean }>`
	width: 8px;
	height: 8px;
	border-radius: 50%;
	background-color: ${(props) => getColors(props).DOT};
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
	const [isVisible, setIsVisible] = useState<boolean>(true);
	const [isBuilding, setIsBuilding] = useState<boolean>(false);
	const [isError, setIsError] = useState<boolean>(false);
	const hideTimerRef = useRef<NodeJS.Timeout | null>(null);
	const fadeTimerRef = useRef<NodeJS.Timeout | null>(null);

	// Helper function to set status with auto-hide and fade
	const setStatusWithHide = useCallback((status: string, building = false, error = false) => {
		setWsStatus(status);
		setShowStatus(true);
		setIsVisible(true);
		setIsBuilding(building);
		setIsError(error);

		// Clear existing timers
		if (hideTimerRef.current) {
			clearTimeout(hideTimerRef.current);
			hideTimerRef.current = null;
		}
		if (fadeTimerRef.current) {
			clearTimeout(fadeTimerRef.current);
			fadeTimerRef.current = null;
		}

		// Start fade out after delay
		hideTimerRef.current = setTimeout(() => {
			setIsVisible(false);
			hideTimerRef.current = null;

			// Actually hide the element after fade completes
			fadeTimerRef.current = setTimeout(() => {
				setShowStatus(false);
				fadeTimerRef.current = null;
			}, FADE_OUT_DURATION + FADE_OUT_TAIL);
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
		} else if (message.type === "buildStarted") {
			setStatusWithHide("Building...", true);
		} else if (message.type === "buildComplete") {
			const payload = message.payload as { success: boolean; filePath: string; buildDuration: number };
			setStatusWithHide(`Build completed in ${payload.buildDuration}ms`);
		} else if (message.type === "buildError") {
			const payload = message.payload as { success: boolean; error: string; filePath: string };
			setStatusWithHide(`Build failed: ${payload.error}`, false, true);
		}
	}, [message, setStatusWithHide]);

	// Update status based on connection state
	useEffect(() => {
		if (connectionError) {
			setWsStatus(`Error: ${connectionError}`);
			setShowStatus(true);
			setIsVisible(true);
			setIsError(true);
			setIsBuilding(false);
			// Clear timers for persistent error display
			if (hideTimerRef.current) {
				clearTimeout(hideTimerRef.current);
				hideTimerRef.current = null;
			}
			if (fadeTimerRef.current) {
				clearTimeout(fadeTimerRef.current);
				fadeTimerRef.current = null;
			}
		} else if (isConnected) {
			setStatusWithHide("Connected");
		} else {
			setWsStatus("Connecting...");
			setShowStatus(true);
			setIsVisible(true);
			setIsBuilding(true); // Use yellow styling for connecting
			setIsError(false);
			// Clear timers for persistent connecting display
			if (hideTimerRef.current) {
				clearTimeout(hideTimerRef.current);
				hideTimerRef.current = null;
			}
			if (fadeTimerRef.current) {
				clearTimeout(fadeTimerRef.current);
				fadeTimerRef.current = null;
			}
		}
	}, [isConnected, connectionError, setStatusWithHide]);

	// Cleanup timers on unmount
	useEffect(() => {
		return () => {
			if (hideTimerRef.current) {
				clearTimeout(hideTimerRef.current);
			}
			if (fadeTimerRef.current) {
				clearTimeout(fadeTimerRef.current);
			}
		};
	}, []);

	if (!showStatus) {
		return null;
	}

	return (
		<StatusContainer connected={isConnected} isVisible={isVisible} isBuilding={isBuilding} isError={isError}>
			<StatusDot connected={isConnected} isBuilding={isBuilding} isError={isError} />
			{wsStatus}
		</StatusContainer>
	);
};

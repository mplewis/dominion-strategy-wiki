import styled from "@emotion/styled";
import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";

/** Time in milliseconds to hide the status when idle */
const STATUS_HIDE_DELAY = 2000;

/** Time in milliseconds for fade-out transition */
const FADE_OUT_DURATION = 800;

/** Color palette for status indicator states */
const COLORS = {
	// Success/Connected state (green)
	SUCCESS_BACKGROUND: "#dcfce7",
	SUCCESS_TEXT: "#166534",
	SUCCESS_BORDER: "#bbf7d0",
	SUCCESS_DOT: "#16a34a",

	// Warning/Building/Connecting state (yellow)
	WARNING_BACKGROUND: "#fef3c7",
	WARNING_TEXT: "#92400e",
	WARNING_BORDER: "#fde68a",
	WARNING_DOT: "#d97706",
} as const;

// TODO: Unify colors into getColors(props) -> ...
// TODO: Red color and handling for build errors

/** Status indicator container with color states and fade transition */
const StatusContainer = styled.div<{ connected: boolean; isVisible: boolean; isBuilding: boolean }>`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	padding: 0.5rem 0.75rem;
	font-size: 0.75rem;
	border-radius: 0.375rem;
	background-color: ${(props) => {
		if (props.isBuilding) return COLORS.WARNING_BACKGROUND;
		return props.connected ? COLORS.SUCCESS_BACKGROUND : COLORS.WARNING_BACKGROUND;
	}};
	color: ${(props) => {
		if (props.isBuilding) return COLORS.WARNING_TEXT;
		return props.connected ? COLORS.SUCCESS_TEXT : COLORS.WARNING_TEXT;
	}};
	border: 1px solid
		${(props) => {
			if (props.isBuilding) return COLORS.WARNING_BORDER;
			return props.connected ? COLORS.SUCCESS_BORDER : COLORS.WARNING_BORDER;
		}};
	opacity: ${(props) => (props.isVisible ? 1 : 0)};
	transition: opacity 800ms ease-out;
`;

/** Status dot indicator */
const StatusDot = styled.div<{ connected: boolean; isBuilding: boolean }>`
	width: 8px;
	height: 8px;
	border-radius: 50%;
	background-color: ${(props) => {
		if (props.isBuilding) return COLORS.WARNING_DOT;
		return props.connected ? COLORS.SUCCESS_DOT : COLORS.WARNING_DOT;
	}};
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
	const hideTimerRef = useRef<NodeJS.Timeout | null>(null);
	const fadeTimerRef = useRef<NodeJS.Timeout | null>(null);

	// Helper function to set status with auto-hide and fade
	const setStatusWithHide = useCallback((status: string, building = false) => {
		setWsStatus(status);
		setShowStatus(true);
		setIsVisible(true);
		setIsBuilding(building);

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
			}, FADE_OUT_DURATION);
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
			setStatusWithHide(`Build failed: ${payload.error}`);
		}
	}, [message, setStatusWithHide]);

	// Update status based on connection state
	useEffect(() => {
		if (connectionError) {
			setWsStatus(`Error: ${connectionError}`);
			setShowStatus(true);
			setIsVisible(true);
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
		<StatusContainer connected={isConnected} isVisible={isVisible} isBuilding={isBuilding}>
			<StatusDot connected={isConnected} isBuilding={isBuilding} />
			{wsStatus}
		</StatusContainer>
	);
};

import styled from "@emotion/styled";
import type React from "react";
import type { CardSet } from "../types";
import { StatusIndicator } from "./StatusIndicator";

/** Main navigation container with shadow */
const Nav = styled.nav`
	background-color: white;
	box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
`;

/** Navigation content wrapper with centered layout */
const NavContainer = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	max-width: 80rem;
	margin: 0 auto;
	padding: 1rem 1.5rem;
`;

/** Main application title */
const Title = styled.h1`
	font-size: 1.875rem;
	font-weight: 500;
	color: #111827;
`;

/** Container for navigation controls */
const Controls = styled.div`
	display: flex;
	align-items: center;
	gap: 0.75rem;
`;

/** Styled select dropdown with hover/focus states */
const Select = styled.select<{ disabled?: boolean }>`
	padding: 0.625rem 1rem;
	background-color: white;
	border: 1px solid #e5e7eb;
	border-radius: 0.5rem;
	font-size: 0.875rem;
	color: #374151;
	box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
	transition: all 0.15s ease-in-out;
	opacity: ${(props) => (props.disabled ? 0.5 : 1)};
	cursor: ${(props) => (props.disabled ? "not-allowed" : "pointer")};

	&:focus {
		outline: none;
		box-shadow: 0 0 0 2px #3b82f6;
		border-color: transparent;
	}
`;

/** Styled button with hover/focus states */
const Button = styled.button<{ disabled?: boolean }>`
	padding: 0.625rem 1.5rem;
	background-color: #2563eb;
	color: white;
	font-size: 0.875rem;
	font-weight: 500;
	border-radius: 0.5rem;
	border: none;
	box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
	transition: all 0.15s ease-in-out;
	cursor: ${(props) => (props.disabled ? "not-allowed" : "pointer")};
	opacity: ${(props) => (props.disabled ? 0.5 : 1)};

	&:hover:not(:disabled) {
		background-color: #1d4ed8;
	}

	&:focus {
		outline: none;
		box-shadow:
			0 0 0 2px #3b82f6,
			0 0 0 4px #3b82f620;
	}
`;

/** Props for the Navigation component */
interface NavigationProps {
	selectedSet: string;
	cardSets: CardSet[];
	loading: boolean;
	wsConnected: boolean;
	connectionError: string | null;
	wsMessage?: { type: string; payload?: unknown } | null;
	onSetChange: (setId: string) => void;
	onRefresh: () => void;
}

/** Navigation bar with card set selector and refresh functionality */
export const Navigation: React.FC<NavigationProps> = ({
	selectedSet,
	cardSets,
	loading,
	wsConnected,
	connectionError,
	wsMessage,
	onSetChange,
	onRefresh,
}) => {
	return (
		<Nav>
			<NavContainer>
				<Title>Card Sandbox</Title>
				<Controls>
					<StatusIndicator isConnected={wsConnected} connectionError={connectionError} message={wsMessage} />
					<Select value={selectedSet} onChange={(e) => onSetChange(e.target.value)} disabled={loading}>
						<option value="">Select card set...</option>
						{cardSets.map((set) => (
							<option key={set.id} value={set.id}>
								{set.name}
							</option>
						))}
					</Select>
					<Button onClick={onRefresh} disabled={loading || !selectedSet}>
						Refresh
					</Button>
				</Controls>
			</NavContainer>
		</Nav>
	);
};

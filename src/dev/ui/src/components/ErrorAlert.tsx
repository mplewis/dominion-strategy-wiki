import React from "react";
import styled from "@emotion/styled";

/** Error alert container with red styling and border */
const AlertContainer = styled.div`
	background-color: #fef2f2;
	border-left: 4px solid #f87171;
	color: #b91c1c;
	padding: 1rem 1.5rem;
	border-radius: 0 0.5rem 0.5rem 0;
	margin-bottom: 1.5rem;
	box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
`;

/** Bold error title text */
const ErrorTitle = styled.div`
	font-weight: 500;
`;

/** Error message text with smaller font */
const ErrorMessage = styled.div`
	font-size: 0.875rem;
`;

/** Props for the ErrorAlert component */
interface ErrorAlertProps {
	message: string;
}

/** Error alert component displaying error messages with red styling */
export const ErrorAlert: React.FC<ErrorAlertProps> = ({ message }) => {
	return (
		<AlertContainer>
			<ErrorTitle>Error</ErrorTitle>
			<ErrorMessage>{message}</ErrorMessage>
		</AlertContainer>
	);
};

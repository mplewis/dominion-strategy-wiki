import styled from "@emotion/styled";
import type React from "react";

/** Centered container for loading spinner */
const LoadingContainer = styled.div`
	text-align: center;
	padding: 3rem 0;
`;

/** Gray loading text */
const LoadingText = styled.div`
	color: #6b7280;
	font-size: 1.125rem;
`;

/** Simple loading spinner component with "Loading..." text */
export const LoadingSpinner: React.FC = () => {
	return (
		<LoadingContainer>
			<LoadingText>Loading...</LoadingText>
		</LoadingContainer>
	);
};

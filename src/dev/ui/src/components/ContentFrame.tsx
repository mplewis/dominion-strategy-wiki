import styled from "@emotion/styled";
import type React from "react";
import type { WikiPageData } from "../types";

/** Main container with rounded corners and shadow */
const Container = styled.div`
	background-color: white;
	border-radius: 0.75rem;
	box-shadow:
		0 10px 15px -3px rgb(0 0 0 / 0.1),
		0 4px 6px -2px rgb(0 0 0 / 0.05);
	flex: 1;
	display: flex;
	flex-direction: column;
	overflow: hidden;
`;

/** Iframe container with full dimensions */
const FrameContainer = styled.div`
	position: relative;
	width: 100%;
	height: 100%;
	flex: 1;
	margin: 0 auto;
`;

/** Styled iframe without border */
const StyledIframe = styled.iframe`
	width: 100%;
	height: 100%;
	border: none;
`;

/** Props for the ContentFrame component */
interface ContentFrameProps {
	pageData: WikiPageData;
}

/** Content frame component that displays wiki page HTML in an iframe */
export const ContentFrame: React.FC<ContentFrameProps> = ({ pageData }) => {
	return (
		<Container>
			<FrameContainer>
				<StyledIframe srcDoc={pageData.html} title="Cards Gallery" />
			</FrameContainer>
		</Container>
	);
};

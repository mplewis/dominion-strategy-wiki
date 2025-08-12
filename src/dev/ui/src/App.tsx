import { useState, useEffect } from "react";
import styled from "@emotion/styled";
import api from "./api";
import { Navigation, ErrorAlert, LoadingSpinner, ContentFrame } from "./components";
import { CardSet, WikiPageData } from "./types";

/** Cookie name for storing the last selected card set */
const SELECTED_SET_COOKIE = "dominion_selected_set";

/** Gets a cookie value by name */
const getCookie = (name: string): string | null => {
	const value = `; ${document.cookie}`;
	const parts = value.split(`; ${name}=`);
	if (parts.length === 2) {
		return parts.pop()?.split(";").shift() || null;
	}
	return null;
};

/** Sets a cookie with the given name, value, and optional expiry days */
const setCookie = (name: string, value: string, days = 30): void => {
	const expires = new Date();
	expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
	document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
};

/** Main application container with column layout */
const AppContainer = styled.div`
	display: flex;
	flex-direction: column;
	min-height: 100vh;
	background-color: #f5f5f5;
`;

/** Content wrapper with centered max-width layout */
const ContentWrapper = styled.div`
	display: flex;
	flex-direction: column;
	flex: 1;
	padding: 20px;
	max-width: 80rem;
	margin: 0 auto;
	width: 100%;
`;

/** Main application component */
const App = () => {
	const [cardSets, setCardSets] = useState<CardSet[]>([]);
	const [selectedSet, setSelectedSet] = useState<string>("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string>("");
	const [pageData, setPageData] = useState<WikiPageData | null>(null);

	// Load card sets on mount
	useEffect(() => {
		loadCardSets();
	}, []);

	const loadCardSets = async () => {
		try {
			const sets = await api.getCardSets();
			setCardSets(sets);

			// Try to restore the last selected set from cookie
			const savedSet = getCookie(SELECTED_SET_COOKIE);
			if (savedSet && sets.some((set) => set.id === savedSet)) {
				setSelectedSet(savedSet);
			} else if (sets.length > 0) {
				setSelectedSet(sets[0].id);
			}
		} catch (err) {
			setError(`Failed to load card sets: ${err instanceof Error ? err.message : String(err)}`);
		}
	};

	const loadPageData = async (forceRefresh = false) => {
		if (!selectedSet) return;

		setLoading(true);
		setError("");

		try {
			const processed = await api.getWikiPage(selectedSet, forceRefresh);
			setPageData(processed);
		} catch (err) {
			setError(`Failed to load page data: ${err instanceof Error ? err.message : String(err)}`);
		} finally {
			setLoading(false);
		}
	};

	const handleSetChange = (setId: string) => {
		setSelectedSet(setId);
		setCookie(SELECTED_SET_COOKIE, setId);
	};

	const handleRefresh = () => {
		loadPageData(true);
	};

	// Load data when selection changes
	useEffect(() => {
		if (selectedSet) {
			loadPageData();
		}
	}, [selectedSet]);

	const renderContent = () => {
		if (loading) {
			return <LoadingSpinner />;
		}

		if (pageData) {
			return <ContentFrame pageData={pageData} />;
		}

		return null;
	};

	return (
		<AppContainer>
			<Navigation
				selectedSet={selectedSet}
				cardSets={cardSets}
				loading={loading}
				onSetChange={handleSetChange}
				onRefresh={handleRefresh}
			/>

			<ContentWrapper>
				{error && <ErrorAlert message={error} />}

				{selectedSet && renderContent()}
			</ContentWrapper>
		</AppContainer>
	);
};

export default App;

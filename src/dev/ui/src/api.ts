import type { WikiPageData } from "./types";

/** Base URL for API endpoints */
const API_BASE = "/api";

/** Makes a GET request to the API and returns typed data */
async function apiGet<T>(endpoint: string): Promise<T> {
	const response = await fetch(`${API_BASE}${endpoint}`);
	if (!response.ok) {
		const error = await response.json().catch(() => ({ error: "Network error" }));
		throw new Error(error.error || `HTTP ${response.status}`);
	}
	const result = await response.json();
	if (!result.success) {
		throw new Error(result.error || "API error");
	}
	return result.data;
}

/** Fetches all available card sets */
export async function getCardSets(): Promise<string[]> {
	return apiGet<string[]>("/card-sets");
}

/** Fetches processed wiki page data for a card set */
export async function getWikiPage(setId: string, forceRefresh: boolean): Promise<WikiPageData> {
	const query = forceRefresh ? "?refresh=true" : "";
	return apiGet<WikiPageData>(`/wiki/${setId}${query}`);
}

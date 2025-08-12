import type { CardSet, WikiPageData } from "./types";

/** Base URL for API endpoints */
const API_BASE = "/api";

/** Service for making API requests to the backend */
class ApiService {
	/** Makes a GET request to the API and returns typed data */
	async get<T>(endpoint: string): Promise<T> {
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

	/** Makes a DELETE request to the API and returns typed data */
	async delete<T>(endpoint: string): Promise<T> {
		const response = await fetch(`${API_BASE}${endpoint}`, { method: "DELETE" });
		if (!response.ok) {
			const error = await response.json().catch(() => ({ error: "Network error" }));
			throw new Error(error.error || `HTTP ${response.status}`);
		}
		const result = await response.json();
		if (!result.success) {
			throw new Error(result.error || "API error");
		}
		return result.data || result.message;
	}

	/** Fetches all available card sets */
	async getCardSets(): Promise<CardSet[]> {
		return this.get<CardSet[]>("/card-sets");
	}

	/** Fetches processed wiki page data for a card set */
	async getWikiPage(setId: string, forceRefresh = false): Promise<WikiPageData> {
		const query = forceRefresh ? "?refresh=true" : "";
		return this.get<WikiPageData>(`/wiki/${setId}${query}`);
	}
}

export default new ApiService();

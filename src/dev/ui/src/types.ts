/** Represents a Dominion card set with its ID and display name */
export interface CardSet {
	id: string;
	name: string;
}

/** Represents processed wiki page data ready for display */
export interface WikiPageData {
	html: string;
}

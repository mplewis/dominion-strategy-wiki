/** Width of card border in px */
export const CARD_BORDER_PX = 11;
/** Cookie expiration time in years */
export const COOKIE_EXPIRATION_YEARS = 1;

/** Maps image width (px) to appropriate border padding size (px) for card styling */
export const SIZE_MAPPINGS = [
	{ size: 75, padding: 4 },
	{ size: 100, padding: 5 },
	{ size: 120, padding: 6 },
	{ size: 150, padding: 8 },
	{ size: 160, padding: 9 },
	{ size: 320, padding: 11 },
	{ size: Infinity, padding: 21 },
] as const;

/** Map of expansion links with their display names */
export const EXPANSION_LINKS = [
	["Dominion (Base Set)", "Dominion"],
	["Intrigue", "Intrigue"],
	["Seaside", "Seaside"],
	["Alchemy", "Alchemy"],
	["Prosperity", "Prosperity"],
	["Cornucopia & Guilds", "Cornucopia & Guilds"],
	["Hinterlands", "Hinterlands"],
	["Dark Ages", "Dark Ages"],
	["Adventures", "Adventures"],
	["Empires", "Empires"],
	["Nocturne", "Nocturne"],
	["Renaissance", "Renaissance"],
	["Menagerie (expansion)", "Menagerie"],
	["Allies", "Allies"],
	["Plunder (expansion)", "Plunder"],
	["Rising Sun", "Rising Sun"],
	["Promo", "Promos"],
] as const;

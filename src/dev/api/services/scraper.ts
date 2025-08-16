import type { AxiosResponse } from "axios";
import * as axios from "axios";
import * as cheerio from "cheerio";
import cacheService from "./cache.js";

/** Base URL for the Dominion Strategy Wiki */
const WIKI_URL = "https://wiki.dominionstrategy.com";
/** User agent string sent with HTTP requests */
const USER_AGENT = "Dominion Wiki Dev Scraper (https://github.com/mplewis/dominion-strategy-wiki)";
/** Request timeout in milliseconds (30 seconds) */
const REQUEST_TIMEOUT = 30000;

/** Represents data for a scraped wiki page containing only the Cards gallery section */
export interface WikiPageData {
	/** The extracted Cards gallery HTML content */
	content: string;
	/** ISO timestamp of when the content was cached */
	timestamp: string;
	/** Original wiki page URL */
	url: string;
}

/**
 * Map of display names to wiki page names for Dominion card sets
 * Key: Human-readable display name (e.g., "Dark Ages")
 * Value: Wiki page name used in URLs (e.g., "Dark_Ages")
 */
export const CARD_SETS: Record<string, string> = {
	"Base Set": "Dominion_(Base_Set)",
	Intrigue: "Intrigue",
	Seaside: "Seaside",
	Alchemy: "Alchemy",
	Prosperity: "Prosperity",
	"Cornucopia & Guilds": "Cornucopia_%26_Guilds",
	Hinterlands: "Hinterlands",
	"Dark Ages": "Dark_Ages",
	Adventures: "Adventures",
	Empires: "Empires",
	Nocturne: "Nocturne",
	Renaissance: "Renaissance",
	Menagerie: "Menagerie_(expansion)",
	Allies: "Allies",
	Plunder: "Plunder_(expansion)",
	"Rising Sun": "Rising_Sun",
};

/** Extracts only the "Cards gallery" section from wiki HTML content */
export function extractCardsGallerySection(htmlContent: string): string {
	const $ = cheerio.load(htmlContent);

	const galleryHeading = $("h1, h2, h3, h4, h5, h6")
		.filter((_i, el) => {
			const text = $(el).text().trim();
			return text.includes("Cards gallery") || text.includes("Card gallery");
		})
		.first();

	if (galleryHeading.length === 0) {
		throw new Error("Cards gallery section not found in wiki page");
	}

	const headingTagName = galleryHeading.prop("tagName")?.toLowerCase();
	if (!headingTagName) {
		throw new Error("Could not determine heading tag name");
	}
	const headingLevel = parseInt(headingTagName.substring(1));

	const nextHeading = galleryHeading
		.nextAll("h1, h2, h3, h4, h5, h6")
		.filter((_i, el) => {
			const tagName = $(el).prop("tagName")?.toLowerCase();
			if (!tagName) return false;
			const level = parseInt(tagName.substring(1));
			return level <= headingLevel;
		})
		.first();

	let content = galleryHeading.prop("outerHTML") || "";
	let currentElement = galleryHeading.next();

	while (currentElement.length > 0) {
		if (nextHeading.length > 0 && currentElement.is(nextHeading)) {
			break;
		}

		content += currentElement.prop("outerHTML") || "";
		currentElement = currentElement.next();
	}

	// Create a new cheerio instance to process the extracted content and fix image URLs
	const $content = cheerio.load(`<div>${content}</div>`);

	// Convert relative image URLs to absolute URLs
	$content("img").each((_i, img) => {
		const $img = $content(img);
		const src = $img.attr("src");
		const srcset = $img.attr("srcset");

		if (src?.startsWith("/")) {
			$img.attr("src", `${WIKI_URL}${src}`);
		}

		if (srcset) {
			const fixedSrcset = srcset.replace(/\/images\/[^\s,]+/g, (match) => `${WIKI_URL}${match}`);
			$img.attr("srcset", fixedSrcset);
		}
	});

	// Convert relative links to absolute URLs
	$content("a").each((_i, link) => {
		const $link = $content(link);
		const href = $link.attr("href");

		if (href?.startsWith("/")) {
			$link.attr("href", `${WIKI_URL}${href}`);
		}
	});

	const processedContent = $content("div").html() || "";

	return `<!DOCTYPE html>
<html>
<head>
	<meta charset="utf-8">
	<title>Cards Gallery</title>
	<style>
		body { font-family: Arial, sans-serif; margin: 20px; }
	</style>
</head>
<body>
	${processedContent}
</body>
</html>`;
}

/**
 * Fetches a wiki page and extracts only the Cards gallery section
 * @param url - Full URL to the wiki page
 * @param forceRefresh - If true, bypasses cache and fetches fresh content
 * @returns Promise containing the extracted Cards gallery content
 */
export async function fetchWikiPage(url: string, forceRefresh = false): Promise<WikiPageData> {
	if (!forceRefresh) {
		const cached = await cacheService.getPageCache(url);
		if (cached) {
			return cached;
		}
	}

	const response: AxiosResponse<string> = await axios.get(url, {
		headers: {
			"User-Agent": USER_AGENT,
		},
		timeout: REQUEST_TIMEOUT,
	});

	const fullContent = response.data;
	const cardsGalleryContent = extractCardsGallerySection(fullContent);
	const cacheResult = await cacheService.setPageCache(url, cardsGalleryContent);

	return {
		content: cardsGalleryContent,
		timestamp: cacheResult.timestamp,
		url,
	};
}

/**
 * Gets card set information by display name
 * @param displayName - Human-readable name (e.g., "Dark Ages")
 * @returns Object with name and URL, or null if not found
 */
export function getCardSetInfo(displayName: string): { name: string; url: string } | null {
	const pageId = CARD_SETS[displayName];
	if (!pageId) return null;

	return {
		name: displayName,
		url: `${WIKI_URL}/index.php/${pageId}`,
	};
}

/**
 * Gets all available card sets with their display names and URLs
 * @returns Array of card set objects with id, name, and url
 */
export function getAvailableCardSets(): Array<{ id: string; name: string; url: string }> {
	return Object.keys(CARD_SETS).map((displayName) => ({
		id: displayName,
		name: displayName,
		url: `${WIKI_URL}/index.php/${CARD_SETS[displayName]}`,
	}));
}

/**
 * Fetches a wiki page by card set display name and extracts Cards gallery
 * @param displayName - Human-readable card set name (e.g., "Dark Ages")
 * @param forceRefresh - If true, bypasses cache and fetches fresh content
 * @returns Promise containing the extracted Cards gallery content
 */
export async function getWikiPageBySetId(displayName: string, forceRefresh = false): Promise<WikiPageData> {
	const cardSet = getCardSetInfo(displayName);
	if (!cardSet) {
		throw new Error(`Unknown card set: ${displayName}`);
	}

	return fetchWikiPage(cardSet.url, forceRefresh);
}

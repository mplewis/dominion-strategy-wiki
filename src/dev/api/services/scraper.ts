import type { AxiosResponse } from "axios";
import * as axios from "axios";
import * as cheerio from "cheerio";
import cacheService from "./cache.js";

/** Base URL for the Dominion Strategy Wiki */
export const WIKI_URL = "https://wiki.dominionstrategy.com";
/** User agent string sent with HTTP requests */
export const USER_AGENT = "Dominion Wiki Dev Scraper (https://github.com/mplewis/dominion-strategy-wiki)";
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

export enum ExtractGoal {
	pageContent = "PAGE_CONTENT",
	cardsGallery = "CARDS_GALLERY",
}

/**
 * Map of display names to wiki page names for Dominion card sets
 * Key: Human-readable display name (e.g., "Dark Ages")
 * Value:
 * 	 - page: Wiki page name used in URLs (e.g., "Dark_Ages")
 *   - fullContent: If true, extract the full page content. If unset, extract only the "Cards gallery" section.
 */
export const CARD_SETS: Record<string, { page: string; extract: ExtractGoal }> = {
	"Base Set": { page: "Dominion_(Base_Set)", extract: ExtractGoal.cardsGallery },
	Intrigue: { page: "Intrigue", extract: ExtractGoal.cardsGallery },
	Seaside: { page: "Seaside", extract: ExtractGoal.cardsGallery },
	Alchemy: { page: "Alchemy", extract: ExtractGoal.cardsGallery },
	Prosperity: { page: "Prosperity", extract: ExtractGoal.cardsGallery },
	"Cornucopia & Guilds": { page: "Cornucopia_%26_Guilds", extract: ExtractGoal.cardsGallery },
	Hinterlands: { page: "Hinterlands", extract: ExtractGoal.cardsGallery },
	"Dark Ages": { page: "Dark_Ages", extract: ExtractGoal.cardsGallery },
	Adventures: { page: "Adventures", extract: ExtractGoal.cardsGallery },
	Empires: { page: "Empires", extract: ExtractGoal.cardsGallery },
	Nocturne: { page: "Nocturne", extract: ExtractGoal.cardsGallery },
	Renaissance: { page: "Renaissance", extract: ExtractGoal.cardsGallery },
	Menagerie: { page: "Menagerie_(expansion)", extract: ExtractGoal.cardsGallery },
	Allies: { page: "Allies", extract: ExtractGoal.cardsGallery },
	Plunder: { page: "Plunder_(expansion)", extract: ExtractGoal.cardsGallery },
	"Rising Sun": { page: "Rising_Sun", extract: ExtractGoal.cardsGallery },
	Promos: { page: "Promo", extract: ExtractGoal.cardsGallery },
	"All Cards": { page: "Legacy_All_Cards_Navbox", extract: ExtractGoal.pageContent },
};

/** Extracts the full page body content from the #content div */
export function extractPageBodySection(htmlContent: string): string {
	const $ = cheerio.load(htmlContent);

	const contentDiv = $("#content");
	if (contentDiv.length === 0) {
		throw new Error("Content section (#content) not found in wiki page");
	}

	return `<!DOCTYPE html>
<html>
<head>
	<meta charset="utf-8">
	<title>Page Content</title>
</head>
<body>
	${contentDiv.html()}
</body>
</html>`;
}

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

	// Convert relative image URLs to local proxy URLs
	$content("img").each((_i, img) => {
		const $img = $content(img);
		const src = $img.attr("src");

		// Redirect non-image resources to pull directly from the wiki
		if (!src?.startsWith("/images/")) {
			$img.attr("src", `${WIKI_URL}${src}`);
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
export async function fetchWikiPage(
	url: string,
	extractGoal: ExtractGoal,
	forceRefresh: boolean,
): Promise<WikiPageData> {
	if (!forceRefresh) {
		const cached = await cacheService.getPageCache(url);
		if (cached) return cached;
	}

	const response: AxiosResponse<string> = await axios.get(url, {
		headers: { "User-Agent": USER_AGENT },
		timeout: REQUEST_TIMEOUT,
	});

	const fullContent = response.data;
	const cardsGalleryContent =
		extractGoal === ExtractGoal.cardsGallery
			? extractCardsGallerySection(fullContent)
			: extractPageBodySection(fullContent);
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
	const { page } = CARD_SETS[displayName];
	if (!page) return null;

	return {
		name: displayName,
		url: `${WIKI_URL}/index.php/${page}`,
	};
}

/**
 * Fetches a wiki page by card set display name and extracts Cards gallery
 * @param displayName - Human-readable card set name (e.g., "Dark Ages")
 * @param forceRefresh - If true, bypasses cache and fetches fresh content
 * @returns Promise containing the extracted Cards gallery content
 */
export async function getWikiPageBySetId(
	displayName: string,
	extractGoal: ExtractGoal,
	forceRefresh: boolean,
): Promise<WikiPageData> {
	const cardSet = getCardSetInfo(displayName);
	if (!cardSet) throw new Error(`Unknown card set: ${displayName}`);
	return fetchWikiPage(cardSet.url, extractGoal, forceRefresh);
}

import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as cheerio from "cheerio";
import { log } from "../../logging.js";
import buildService from "./builder.js";
import cacheService from "./cache.js";

/** Current file path for ES modules */
const __filename = fileURLToPath(import.meta.url);

/** Directory containing this file */
const __dirname = path.dirname(__filename);

/** URL for the MediaWiki Common.css file */
const COMMON_CSS_URL = "https://wiki.dominionstrategy.com/index.php/MediaWiki:Common.css?action=raw";

/** URL for the MediaWiki Main Page to extract sidebar */
const MAIN_PAGE_URL = "https://wiki.dominionstrategy.com/index.php/Main_Page";

/** Fetches and extracts the MediaWiki sidebar HTML from the Main Page */
async function getSidebarTemplate(forceRefresh: boolean): Promise<string> {
	await cacheService.init();
	if (!forceRefresh) {
		const cached = await cacheService.getPageCache(MAIN_PAGE_URL);
		if (cached) return cached.content;
	}

	try {
		const response = await fetch(MAIN_PAGE_URL);
		if (!response.ok) {
			throw new Error(`HTTP ${response.status}: ${response.statusText}`);
		}
		const htmlContent = await response.text();

		const $ = cheerio.load(htmlContent);
		const sidebarHtml = $("#mw-panel").html();
		if (!sidebarHtml) {
			throw new Error("Could not find #mw-panel in the fetched page");
		}

		const html = `<div id="mw-panel">${sidebarHtml}</div>`;
		await cacheService.setPageCache(MAIN_PAGE_URL, html);
		return html;
	} catch (error) {
		log.error({ error: error.message }, "Failed to fetch sidebar from wiki");
		throw new Error(`Cannot load sidebar from wiki: ${error.message}`);
	}
}

/** Reads and returns CSS for layout positioning of sidebar and content */
async function getLayoutCss(): Promise<string> {
	try {
		const templatePath = path.join(__dirname, "../templates/layout.css");
		return await readFile(templatePath, "utf-8");
	} catch (error) {
		log.error({ error: error.message }, "Failed to read layout CSS template");
		throw new Error(`Cannot load layout CSS template: ${error.message}`);
	}
}

/** Fetches and caches the common CSS content from the wiki */
async function getCommonCssContent(forceRefresh: boolean): Promise<string> {
	await cacheService.init();
	if (!forceRefresh) {
		const cached = await cacheService.getPageCache(COMMON_CSS_URL);
		if (cached) return cached.content;
	}

	const response = await fetch(COMMON_CSS_URL);
	if (!response.ok) {
		throw new Error(`HTTP ${response.status}: ${response.statusText}`);
	}

	const cssContent = await response.text();
	await cacheService.setPageCache(COMMON_CSS_URL, cssContent);
	return cssContent;
}

/** Loads and returns the common JavaScript content, building if needed */
async function getCommonJsContent(): Promise<string> {
	try {
		return await buildService.getBuiltContent();
	} catch (error) {
		log.error({ error: error.message }, "Failed to get built common.js");
		throw new Error(`Cannot load common.js for injection: ${error.message}`);
	}
}

/** Injects CSS and JS assets into HTML content */
export async function injectAssets(htmlContent: string, forceRefresh: boolean): Promise<string> {
	const $ = cheerio.load(htmlContent);
	const [commonJsContent, commonCssContent, layoutCss] = await Promise.all([
		getCommonJsContent(),
		getCommonCssContent(forceRefresh),
		getLayoutCss(),
	]);
	$("head").append(`<style type="text/css">${layoutCss}</style>`);
	$("head").append(`<style type="text/css">${commonCssContent}</style>`);
	$("body").append(`<script type="text/javascript">${commonJsContent}</script>`);
	return $.html();
}

/** Processes wiki page HTML by injecting sidebar and common assets */
export async function processWikiPage(htmlContent: string, forceRefresh: boolean): Promise<string> {
	const sidebarHtml = await getSidebarTemplate(forceRefresh);
	const wrappedContent = `
		<div class="page-container">
			${sidebarHtml}
			<div class="content-area">
				${htmlContent}
			</div>
		</div>
	`;
	return await injectAssets(wrappedContent, forceRefresh);
}

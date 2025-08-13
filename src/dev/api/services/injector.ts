import * as cheerio from "cheerio";
import { log } from "../../logging.js";
import buildService from "./builder.js";
import cacheService from "./cache.js";

/** URL for the MediaWiki Common.css file */
const COMMON_CSS_URL = "https://wiki.dominionstrategy.com/index.php/MediaWiki:Common.css?action=raw";

/** Service for injecting common CSS and JS assets into wiki pages */
class InjectorService {
	/** Loads and returns the common JavaScript content, building if needed */
	private async getCommonJsContent(): Promise<string> {
		try {
			return await buildService.getBuiltContent();
		} catch (error) {
			log.error({ error: error.message }, "Failed to get built common.js");
			throw new Error(`Cannot load common.js for injection: ${error.message}`);
		}
	}

	/** Fetches and caches the common CSS content from the wiki */
	private async getCommonCssContent(): Promise<string> {
		await cacheService.init();
		const cached = await cacheService.getPageCache(COMMON_CSS_URL);
		if (cached) return cached.content;

		const response = await fetch(COMMON_CSS_URL);
		if (!response.ok) {
			throw new Error(`HTTP ${response.status}: ${response.statusText}`);
		}

		const cssContent = await response.text();
		await cacheService.setPageCache(COMMON_CSS_URL, cssContent);
		return cssContent;
	}

	/** Injects CSS and JS assets into HTML content */
	async injectAssets(htmlContent: string): Promise<string> {
		const $ = cheerio.load(htmlContent);

		const [commonJsContent, commonCssContent] = await Promise.all([
			this.getCommonJsContent(),
			this.getCommonCssContent(),
		]);

		$("head").append(`<style type="text/css">${commonCssContent}</style>`);
		$("body").append(`<script type="text/javascript">${commonJsContent}</script>`);
		return $.html();
	}

	/** Processes wiki page HTML by injecting common assets */
	async processWikiPage(htmlContent: string): Promise<string> {
		return await this.injectAssets(htmlContent);
	}
}

export default new InjectorService();

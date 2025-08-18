import type express from "express";
import type { Request, Response } from "express";

import { log } from "../logging.js";
import cacheService from "./services/cache.js";
import { processWikiPage } from "./services/injector.js";
import { CARD_SETS, getWikiPageBySetId } from "./services/scraper.js";

/**
 * Mounts all API routes on the provided Express application
 * @param app - Express application instance to mount routes on
 */
export function mountRoutes(app: express.Application) {
	// Get available card sets
	app.get("/api/card-sets", (_req: Request, res: Response) => {
		res.json({ success: true, data: Object.keys(CARD_SETS) });
	});

	// Get wiki page content by set ID
	app.get("/api/wiki/:setId", async (req: Request, res: Response) => {
		try {
			const { setId } = req.params;
			const forceRefresh = req.query.refresh === "true";
			const { extract } = CARD_SETS[setId];
			const pageData = await getWikiPageBySetId(setId, extract, forceRefresh);
			const html = await processWikiPage(pageData.content, forceRefresh);
			res.json({ success: true, data: { html } });
		} catch (error) {
			log.error({ error: error.message }, "Error processing wiki page");
			res.status(500).json({ success: false, error: error.message });
		}
	});

	// Proxy images through cache
	app.get("/images/*", async (req: Request, res: Response) => {
		try {
			const imagePath = req.path; // e.g., "/images/thumb/1/1e/Copper.jpg/200px-Copper.jpg"
			const wikiImageUrl = `https://wiki.dominionstrategy.com${imagePath}`;

			const cachedImagePath = await cacheService.getImageCache(wikiImageUrl);
			if (cachedImagePath) return res.sendFile(cachedImagePath);

			log.info({ url: wikiImageUrl }, "Fetching image from MediaWiki");
			const response = await fetch(wikiImageUrl);
			if (!response.ok) {
				return res.status(response.status).json({
					success: false,
					error: `Failed to fetch image: ${response.statusText}`,
				});
			}

			const imageBuffer = Buffer.from(await response.arrayBuffer());
			const contentType = response.headers.get("content-type") || "application/octet-stream";
			await cacheService.setImageCache(wikiImageUrl, imageBuffer);
			log.info({ url: wikiImageUrl, size: imageBuffer.length }, "Cached image");

			res.set("Content-Type", contentType);
			res.send(imageBuffer);
		} catch (error) {
			log.error({ error: error.message, path: req.path }, "Error proxying image");
			res.status(500).json({ success: false, error: error.message });
		}
	});
}

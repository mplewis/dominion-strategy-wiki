import { exec } from "node:child_process";
import { createServer } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import cors from "cors";
import express, { type NextFunction, type Request, type Response } from "express";

import cacheService from "./services/cache.js";
import { createFileWatcher } from "./services/file-watcher.js";
import injectorService from "./services/injector.js";
import { getAvailableCardSets, getWikiPageBySetId } from "./services/scraper.js";
import { webSocketService } from "./services/websocket.js";

/** Current file path for ES modules */
const __filename = fileURLToPath(import.meta.url);

/** Directory containing this file */
const __dirname = path.dirname(__filename);

/** Express application instance */
const app = express();

/** Port number for the server */
const PORT = process.env.PORT || 3001;

/** Promisified exec function for running shell commands */
const execAsync = promisify(exec);

/** Path to the UI source directory */
const UI_DIR = path.join(__dirname, "../ui");

/** Path to the UI build output directory */
const UI_DIST_DIR = path.join(UI_DIR, "dist");

// Middleware
app.use(cors());
app.use(express.json());

/** Builds the UI using Vite in development mode */
async function buildUI(): Promise<void> {
	try {
		// Build in development mode for better debugging and React DevTools
		await execAsync("npx vite build --mode development", { cwd: UI_DIR });
	} catch (error) {
		console.error("UI build failed:", error);
		throw error;
	}
}

/** Initializes and starts the Express server with all routes and middleware */
async function startServer() {
	await cacheService.init();

	// Initialize file watcher for src/wiki directory
	const wikiDir = path.join(__dirname, "../../../src/wiki");
	const fileWatcher = createFileWatcher(wikiDir);

	let buildInProgress = false;

	fileWatcher.on("fileChanged", async (event) => {
		const relativePath = path.relative(path.join(__dirname, "../../.."), event.filePath);
		console.log(`🔄 Wiki file changed: ${relativePath}`);

		if (buildInProgress) {
			console.log("Build already in progress, waiting...");
			return;
		}

		buildInProgress = true;

		try {
			console.log("Triggering rebuild due to source changes...");
			const startTime = Date.now();
			
			// Run the main build process
			await execAsync("pnpm build", { cwd: path.join(__dirname, "../../..") });
			
			const duration = Date.now() - startTime;
			console.log(`Build completed successfully in ${duration}ms`);

			// Broadcast successful build completion to WebSocket clients
			webSocketService.broadcast({
				type: "buildComplete",
				payload: {
					success: true,
					filePath: relativePath,
					eventType: event.eventType,
					timestamp: event.timestamp.toISOString(),
					buildDuration: duration,
				},
			});

			// Also send fileChanged event for backward compatibility
			webSocketService.broadcast({
				type: "fileChanged",
				payload: {
					filePath: relativePath,
					eventType: event.eventType,
					timestamp: event.timestamp.toISOString(),
				},
			});

		} catch (error) {
			console.error("Build failed:", error);
			
			// Broadcast build failure to WebSocket clients
			webSocketService.broadcast({
				type: "buildError",
				payload: {
					success: false,
					error: error.message,
					filePath: relativePath,
					eventType: event.eventType,
					timestamp: event.timestamp.toISOString(),
				},
			});
		} finally {
			buildInProgress = false;
		}
	});

	fileWatcher.start();

	// Build UI first
	await buildUI();

	// Routes
	// Get available card sets
	app.get("/api/card-sets", (_req: Request, res: Response) => {
		const cardSets = getAvailableCardSets();
		res.json({
			success: true,
			data: cardSets,
		});
	});

	// Serve built React app
	app.get("/api/wiki/:setId", async (req: Request, res: Response) => {
		try {
			const { setId } = req.params;
			const forceRefresh = req.query.refresh === "true";

			const pageData = await getWikiPageBySetId(setId, forceRefresh);
			const html = await injectorService.processWikiPage(pageData.content);

			res.json({
				success: true,
				data: {
					html,
				},
			});
		} catch (error) {
			console.error("Error processing wiki page:", error);
			res.status(500).json({
				success: false,
				error: error.message,
			});
		}
	});

	// Serve built React app
	app.use(express.static(UI_DIST_DIR));

	// Error handling middleware
	app.use((error: Error, _req: Request, res: Response, _next: NextFunction) => {
		console.error("Unhandled error:", error);
		res.status(500).json({
			success: false,
			error: "Internal server error",
		});
	});

	// Catch-all handler: send back React's index.html file for any non-API routes
	app.get("*", (_req: Request, res: Response) => {
		res.sendFile(path.join(UI_DIST_DIR, "index.html"));
	});

	// Create HTTP server and initialize WebSocket
	const server = createServer(app);
	webSocketService.init(server);

	server.listen(PORT, () => {
		console.log(`🚀 Dominion Wiki Dev Server running on port ${PORT}`);
		console.log(`📱 Web UI: http://localhost:${PORT}`);
		console.log(`🔌 WebSocket: ws://localhost:${PORT}`);
		console.log("🔌 API endpoints:");
		console.log("  GET  /api/card-sets - List available card sets");
		console.log("  GET  /api/wiki/:setId - Get processed wiki page");
	});
}

startServer().catch(console.error);

import { exec } from "node:child_process";
import { randomUUID } from "node:crypto";
import { createServer } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import cors from "cors";
import express, { type NextFunction, type Request, type Response } from "express";

import { log } from "../logging.js";
import { mountRoutes } from "./routes.js";
import cacheService from "./services/cache.js";
import { createFileWatcher, type FileChangeEvent } from "./services/file-watcher.js";
import { webSocketService } from "./services/websocket.js";

/** Current file path for ES modules */
const __filename = fileURLToPath(import.meta.url);

/** Directory containing this file */
const __dirname = path.dirname(__filename);

/** Root directory of the project */
const PROJECT_DIR = path.join(__dirname, "../../..");

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

/** Unique execution ID for detecting server restarts */
const EXEC_ID = randomUUID();

app.use(cors());
app.use(express.json());

let buildInProgress = false;

/** Rebuild the common.js files on file change */
async function rebuild(event: FileChangeEvent): Promise<void> {
	const relativePath = path.relative(PROJECT_DIR, event.filePath);
	log.info({ relativePath }, "Source file changed");
	if (buildInProgress) {
		log.info("Build already in progress, waiting...");
		return;
	}

	buildInProgress = true;
	try {
		log.info("Triggering rebuild due to source changes...");
		webSocketService.broadcast({
			type: "buildStarted",
			payload: {
				filePath: relativePath,
				eventType: event.eventType,
				timestamp: event.timestamp.toISOString(),
			},
		});

		const startTime = Date.now();
		await execAsync("pnpm build", { cwd: path.join(__dirname, "../../..") });
		const duration = Date.now() - startTime;
		log.info({ duration }, "Build completed successfully");

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
		webSocketService.broadcast({
			type: "fileChanged",
			payload: {
				filePath: relativePath,
				eventType: event.eventType,
				timestamp: event.timestamp.toISOString(),
			},
		});
	} catch (error) {
		log.error({ error: error.message, stderr: error.stderr, stdout: error.stdout }, "Build failed");
		webSocketService.broadcast({
			type: "buildError",
			payload: {
				success: false,
				error: "see console for details",
				filePath: relativePath,
				eventType: event.eventType,
				timestamp: event.timestamp.toISOString(),
			},
		});
	} finally {
		buildInProgress = false;
	}
}

/** Initializes and starts the Express server with all routes and middleware */
async function startServer() {
	await cacheService.init();

	const wikiDir = path.join(__dirname, "../../../src/wiki");
	const fileWatcher = createFileWatcher(wikiDir);
	fileWatcher.on("fileChanged", rebuild);
	fileWatcher.start();

	// Build UI in development mode for better debugging and React DevTools
	await execAsync("npx vite build --mode development", { cwd: UI_DIR });

	mountRoutes(app);

	app.use(express.static(UI_DIST_DIR));
	app.use((error: Error, _req: Request, res: Response, _next: NextFunction) => {
		log.error({ error: error.message }, "Unhandled error");
		res.status(500).json({
			success: false,
			error: "Internal server error",
		});
	});

	app.get("*", (_req: Request, res: Response) => {
		res.sendFile(path.join(UI_DIST_DIR, "index.html"));
	});

	const server = createServer(app);
	webSocketService.init(server, EXEC_ID);
	server.listen(PORT, () => {
		log.info({ url: `http://localhost:${PORT}` }, "Card Sandbox started");
	});
}

startServer().catch((error) => log.error({ error: error.message }, "Failed to start server"));

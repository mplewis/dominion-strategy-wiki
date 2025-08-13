import { exec } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { glob } from "glob";
import { log } from "../../logging.js";

/** Current file path for ES modules */
const __filename = fileURLToPath(import.meta.url);

/** Directory containing this file */
const __dirname = path.dirname(__filename);

/** Project root directory */
const PROJECT_ROOT = path.join(__dirname, "../../../..");

/** Async version of exec */
const execAsync = promisify(exec);

/** Timeout for build commands */
const BUILD_TIMEOUT = 30000; // 30 seconds

/** Build cache interface */
interface BuildCache {
	lastBuildTime: number;
	sourceFiles: Map<string, number>;
	buildInProgress: boolean;
}

/** Service for managing TypeScript builds with file watching */
class BuildService {
	private buildCache: BuildCache | null = null;
	private rebuildTimeout: NodeJS.Timeout | null = null;

	/** Gets all TypeScript source files in src/wiki */
	private async getSourceFiles(): Promise<string[]> {
		return await glob("src/wiki/**/*.ts", {
			absolute: true,
			ignore: ["**/*.d.ts", "**/*.test.ts"],
			cwd: PROJECT_ROOT,
		});
	}

	/** Gets modification time for a file */
	private async getFileModTime(filePath: string): Promise<number> {
		try {
			const stats = await fs.stat(filePath);
			return stats.mtime.getTime();
		} catch {
			return 0;
		}
	}

	/** Checks if rebuild is needed by comparing source file mtimes */
	private async shouldRebuild(): Promise<boolean> {
		const distPath = path.join(PROJECT_ROOT, "dist/common.js");

		try {
			await fs.access(distPath);
		} catch {
			log.info({ distPath }, "dist/common.js not found, triggering initial build");
			return true;
		}

		const sourceFiles = await this.getSourceFiles();

		if (!this.buildCache) {
			log.info("No build cache found, checking source files");
			return true;
		}

		for (const file of sourceFiles) {
			const currentModTime = await this.getFileModTime(file);
			const cachedModTime = this.buildCache.sourceFiles.get(file) || 0;

			if (currentModTime > cachedModTime) {
				log.info({ file: path.basename(file) }, "Source file changed");
				return true;
			}
		}

		return false;
	}

	/** Updates build cache with current source file times */
	private async updateBuildCache(): Promise<void> {
		const sourceFiles = await this.getSourceFiles();
		const fileMap = new Map<string, number>();

		for (const file of sourceFiles) {
			const modTime = await this.getFileModTime(file);
			fileMap.set(file, modTime);
		}
		this.buildCache = { lastBuildTime: Date.now(), sourceFiles: fileMap, buildInProgress: false };
	}

	/** Triggers pnpm build and waits for completion */
	private async triggerBuild(): Promise<void> {
		if (this.buildCache?.buildInProgress) {
			log.info("Build already in progress, waiting...");
			return;
		}

		if (!this.buildCache) {
			this.buildCache = { lastBuildTime: 0, sourceFiles: new Map(), buildInProgress: true };
		} else {
			this.buildCache.buildInProgress = true;
		}

		try {
			log.info("Triggering rebuild due to source changes...");
			const startTime = Date.now();
			await execAsync("pnpm build", { cwd: PROJECT_ROOT, timeout: BUILD_TIMEOUT });
			const duration = Date.now() - startTime;
			log.info({ duration }, "Build completed successfully");
			await this.updateBuildCache();
		} catch (error) {
			log.error({ error: error.message }, "Build failed");
			this.buildCache.buildInProgress = false;
			throw new Error(`Build failed: ${error.message}`);
		}
	}

	/** Ensures common.js is built and up to date */
	async ensureBuilt(): Promise<void> {
		if (this.rebuildTimeout) {
			clearTimeout(this.rebuildTimeout);
			this.rebuildTimeout = null;
		}

		if (await this.shouldRebuild()) await this.triggerBuild();
	}

	/** Gets the built JavaScript content, building if needed */
	async getBuiltContent(): Promise<string> {
		await this.ensureBuilt();
		const distPath = path.join(PROJECT_ROOT, "dist/common.js");
		try {
			const content = await fs.readFile(distPath, "utf8");
			return content;
		} catch (error) {
			throw new Error(`Cannot read built common.js: ${error.message}`);
		}
	}

	/** Schedules a debounced rebuild check */
	scheduleRebuildCheck(): void {
		if (this.rebuildTimeout) clearTimeout(this.rebuildTimeout);
		this.rebuildTimeout = setTimeout(async () => {
			try {
				if (await this.shouldRebuild()) await this.triggerBuild();
			} catch (error) {
				log.error({ error: error.message }, "Scheduled rebuild failed");
			}
		}, 100);
	}
}

export default new BuildService();

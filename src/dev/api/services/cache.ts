import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

/** Gets the system-appropriate cache directory based on the current platform */
function getSystemCacheDir(): string {
	const platform = os.platform();
	const homeDir = os.homedir();

	switch (platform) {
		case "darwin": // macOS
			return path.join(homeDir, "Library", "Caches");
		case "win32": // Windows
			return process.env.LOCALAPPDATA || path.join(homeDir, "AppData", "Local");
		default: // Linux and others
			return process.env.XDG_CACHE_HOME || path.join(homeDir, ".cache");
	}
}

/** Directory where all cache files are stored */
const CACHE_DIR = path.join(getSystemCacheDir(), "dominion-strategy-wiki");
/** Path to the cache metadata JSON file */
const META_FILE = path.join(CACHE_DIR, "meta.json");
/** Number of days before cache entries expire */
const CACHE_EXPIRY_DAYS = 7;

/** Internal metadata structure stored in the cache's meta.json file */
interface CacheMetadata {
	/** Map of cache keys to page cache entries */
	pages: Record<string, CacheEntry>;
	/** ISO timestamp of when the cache was first created */
	created: string;
}

/** Base cache entry information stored in metadata */
interface CacheEntry {
	/** Original URL of the cached resource */
	url: string;
	/** ISO timestamp of when the resource was cached */
	timestamp: string;
	/** Size of the cached content in bytes */
	size: number;
}

/** Represents a cached page retrieved from the cache */
interface CachedPage {
	/** The HTML content of the cached page */
	content: string;
	/** ISO timestamp of when the page was cached */
	timestamp: string;
	/** Original URL of the cached page */
	url: string;
}

/** Service for caching wiki pages and assets to disk */
class CacheService {
	private meta: CacheMetadata | null = null;

	/**
	 * Initializes the cache service by creating necessary directories and loading metadata
	 * @throws Error if cache initialization fails
	 */
	async init(): Promise<void> {
		await fs.mkdir(CACHE_DIR, { recursive: true });
		await fs.mkdir(path.join(CACHE_DIR, "html"), { recursive: true });

		try {
			const metaContent = await fs.readFile(META_FILE, "utf8");
			this.meta = JSON.parse(metaContent);
		} catch (_error) {
			this.meta = { pages: {}, created: new Date().toISOString() };
			await this.saveMeta();
		}
	}

	/**
	 * Saves the current cache metadata to disk
	 * @private
	 */
	private async saveMeta(): Promise<void> {
		await fs.writeFile(META_FILE, JSON.stringify(this.meta, null, 2));
	}

	/**
	 * Generates a filesystem-safe cache key from a URL
	 * @param url - The URL to generate a key for
	 * @returns A filesystem-safe string that can be used as a filename
	 * @private
	 */
	private generateCacheKey(url: string): string {
		return url.replace(/[^a-zA-Z0-9]/g, "_");
	}

	/**
	 * Checks if a cache entry has expired based on its timestamp
	 * @param timestamp - ISO timestamp string of when the entry was cached
	 * @returns True if the entry has expired, false otherwise
	 * @private
	 */
	private isExpired(timestamp: string): boolean {
		const expiry = new Date(timestamp);
		expiry.setDate(expiry.getDate() + CACHE_EXPIRY_DAYS);
		return new Date() > expiry;
	}

	/**
	 * Retrieves a cached page by URL if it exists and hasn't expired
	 * @param url - The URL of the page to retrieve from cache
	 * @returns The cached page data or null if not found or expired
	 */
	async getPageCache(url: string): Promise<CachedPage | null> {
		const key = this.generateCacheKey(url);
		const cacheInfo = this.meta?.pages[key];
		if (!cacheInfo || this.isExpired(cacheInfo.timestamp)) return null;

		try {
			const filePath = path.join(CACHE_DIR, "html", `${key}.html`);
			const content = await fs.readFile(filePath, "utf8");
			return { content, timestamp: cacheInfo.timestamp, url: cacheInfo.url };
		} catch (_error) {
			return null;
		}
	}

	/**
	 * Stores a page in the cache with the given URL and content
	 * @param url - The URL of the page to cache
	 * @param content - The HTML content to cache
	 * @returns Object containing the cache key and timestamp
	 * @throws Error if caching fails
	 */
	async setPageCache(url: string, content: string): Promise<{ key: string; timestamp: string }> {
		const key = this.generateCacheKey(url);
		const filePath = path.join(CACHE_DIR, "html", `${key}.html`);
		const timestamp = new Date().toISOString();
		await fs.writeFile(filePath, content, "utf8");

		if (this.meta) this.meta.pages[key] = { url, timestamp, size: content.length };
		await this.saveMeta();

		return { key, timestamp };
	}
}

export default new CacheService();

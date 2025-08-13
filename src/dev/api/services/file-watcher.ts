import { EventEmitter } from "node:events";
import * as fs from "node:fs";
import * as path from "node:path";

export interface FileChangeEvent {
	filePath: string;
	eventType: "change" | "rename";
	timestamp: Date;
}

export class FileWatcher extends EventEmitter {
	private watchedDirectory: string;
	private watchers: Map<string, fs.FSWatcher> = new Map();
	private debounceTimers: Map<string, NodeJS.Timeout> = new Map();
	private debounceDelay: number;
	private isWatching = false;

	constructor(directory: string, debounceDelay = 200) {
		super();
		this.watchedDirectory = path.resolve(directory);
		this.debounceDelay = debounceDelay;
	}

	public start(): void {
		if (this.isWatching) {
			console.warn("FileWatcher is already watching");
			return;
		}

		console.log(`Starting file watcher for: ${this.watchedDirectory}`);
		this.isWatching = true;
		this.watchDirectoryRecursive(this.watchedDirectory);
	}

	public stop(): void {
		if (!this.isWatching) {
			return;
		}

		console.log("Stopping file watcher");
		this.isWatching = false;

		for (const timer of this.debounceTimers.values()) {
			clearTimeout(timer);
		}
		this.debounceTimers.clear();

		for (const watcher of this.watchers.values()) {
			watcher.close();
		}
		this.watchers.clear();
	}

	private watchDirectoryRecursive(directory: string): void {
		try {
			const stats = fs.statSync(directory);
			if (!stats.isDirectory()) {
				return;
			}

			const watcher = fs.watch(directory, (eventType, filename) => {
				if (!filename) return;

				const fullPath = path.join(directory, filename);
				this.handleFileEvent(fullPath, eventType as "change" | "rename");
			});

			this.watchers.set(directory, watcher);

			const entries = fs.readdirSync(directory, { withFileTypes: true });
			for (const entry of entries) {
				if (entry.isDirectory()) {
					const subdirectory = path.join(directory, entry.name);
					this.watchDirectoryRecursive(subdirectory);
				}
			}
		} catch (error) {
			console.error(`Error watching directory ${directory}:`, error);
		}
	}

	private handleFileEvent(filePath: string, eventType: "change" | "rename"): void {
		if (!filePath.endsWith(".ts")) {
			return;
		}

		const existingTimer = this.debounceTimers.get(filePath);
		if (existingTimer) {
			clearTimeout(existingTimer);
		}

		const timer = setTimeout(() => {
			this.debounceTimers.delete(filePath);

			const event: FileChangeEvent = {
				filePath,
				eventType,
				timestamp: new Date(),
			};

			console.log(`File changed: ${path.relative(this.watchedDirectory, filePath)} (${eventType})`);
			this.emit("fileChanged", event);
		}, this.debounceDelay);

		this.debounceTimers.set(filePath, timer);
	}
}

export function createFileWatcher(directory: string, debounceDelay?: number): FileWatcher {
	return new FileWatcher(directory, debounceDelay);
}

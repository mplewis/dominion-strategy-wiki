import * as fs from "node:fs";
import * as path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { type FileChangeEvent, FileWatcher } from "./file-watcher.js";

describe("FileWatcher", () => {
	let tempDir: string;
	let watcher: FileWatcher;

	beforeEach(() => {
		// Create temporary directory for testing
		tempDir = fs.mkdtempSync(path.join(process.cwd(), "tmp", "file-watcher-test-"));
		watcher = new FileWatcher(tempDir, 50); // Short debounce for testing
	});

	afterEach(() => {
		watcher.stop();
		// Clean up temp directory
		fs.rmSync(tempDir, { recursive: true, force: true });
	});

	it("should detect TypeScript file changes", async () => {
		const events: FileChangeEvent[] = [];
		watcher.on("fileChanged", (event: FileChangeEvent) => {
			events.push(event);
		});

		watcher.start();

		// Create a TypeScript file
		const testFile = path.join(tempDir, "test.ts");
		fs.writeFileSync(testFile, "console.log('test');");

		// Wait for debounce
		await new Promise((resolve) => setTimeout(resolve, 100));

		expect(events).toHaveLength(1);
		expect(events[0].filePath).toBe(testFile);
		expect(["rename", "change"]).toContain(events[0].eventType); // File creation varies by OS
	});

	it("should ignore non-TypeScript files", async () => {
		const events: FileChangeEvent[] = [];
		watcher.on("fileChanged", (event: FileChangeEvent) => {
			events.push(event);
		});

		watcher.start();

		// Create a JavaScript file (should be ignored)
		const testFile = path.join(tempDir, "test.js");
		fs.writeFileSync(testFile, "console.log('test');");

		// Wait for potential events
		await new Promise((resolve) => setTimeout(resolve, 100));

		expect(events).toHaveLength(0);
	});

	it("should debounce multiple rapid changes", async () => {
		const events: FileChangeEvent[] = [];
		watcher.on("fileChanged", (event: FileChangeEvent) => {
			events.push(event);
		});

		watcher.start();

		const testFile = path.join(tempDir, "test.ts");

		// Make multiple rapid changes
		fs.writeFileSync(testFile, "console.log('test1');");
		fs.writeFileSync(testFile, "console.log('test2');");
		fs.writeFileSync(testFile, "console.log('test3');");

		// Wait for debounce to settle
		await new Promise((resolve) => setTimeout(resolve, 100));

		// Should only get one event due to debouncing
		expect(events.length).toBeLessThanOrEqual(2); // May get rename + change
	});

	it("should watch subdirectories recursively", async () => {
		const events: FileChangeEvent[] = [];
		watcher.on("fileChanged", (event: FileChangeEvent) => {
			events.push(event);
		});

		// Create subdirectory
		const subDir = path.join(tempDir, "subdir");
		fs.mkdirSync(subDir);

		watcher.start();

		// Create file in subdirectory
		const testFile = path.join(subDir, "nested.ts");
		fs.writeFileSync(testFile, "console.log('nested');");

		// Wait for debounce
		await new Promise((resolve) => setTimeout(resolve, 100));

		expect(events).toHaveLength(1);
		expect(events[0].filePath).toBe(testFile);
	});

	it("should handle start/stop correctly", () => {
		expect(() => watcher.start()).not.toThrow();
		expect(() => watcher.stop()).not.toThrow();
		expect(() => watcher.stop()).not.toThrow(); // Should handle multiple stops
	});

	it("should clean up resources on stop", async () => {
		const events: FileChangeEvent[] = [];
		watcher.on("fileChanged", (event: FileChangeEvent) => {
			events.push(event);
		});

		watcher.start();
		watcher.stop();

		// Create file after stopping - should not trigger events
		const testFile = path.join(tempDir, "after-stop.ts");
		fs.writeFileSync(testFile, "console.log('should not trigger');");

		// Wait to ensure no events are fired
		await new Promise((resolve) => setTimeout(resolve, 100));

		expect(events).toHaveLength(0);
	});
});

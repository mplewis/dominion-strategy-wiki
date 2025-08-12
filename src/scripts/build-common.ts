import { execSync } from "node:child_process";
import * as fs from "node:fs";
import { build } from "esbuild";

const TSCONFIG_PATH = "tsconfig.common.json";
const ENTRY_POINT = "dist/cjs/wiki/common.js";
const OUTPUT_FILE = "dist/common.js";
const HEADER_PATH = "src/wiki/header.txt";

async function buildCommon(): Promise<void> {
	console.log("Building TypeScript to CommonJS");
	execSync(`tsc -p ${TSCONFIG_PATH}`, { stdio: "inherit" });

	console.log("Bundling with esbuild");
	await build({
		entryPoints: [ENTRY_POINT],
		bundle: true,
		outfile: OUTPUT_FILE,
		format: "iife",
		platform: "browser",
		target: "es2017",
		minify: false,
		sourcemap: false,
	});

	if (fs.existsSync(HEADER_PATH)) {
		console.log(`Adding header to the bundled file: ${HEADER_PATH}`);
		const header = fs.readFileSync(HEADER_PATH, "utf8");
		const bundled = fs.readFileSync(OUTPUT_FILE, "utf8");
		fs.writeFileSync(OUTPUT_FILE, header + bundled);
	}

	console.log(`Build completed successfully: ${OUTPUT_FILE}`);
}

buildCommon();

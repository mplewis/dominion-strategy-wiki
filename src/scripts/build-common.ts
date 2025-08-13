import { execSync } from "node:child_process";
import * as fs from "node:fs";
import { build } from "esbuild";
import { log } from "./logging.js";

const TSCONFIG_PATH = "tsconfig.common.json";
const ENTRY_POINT = "dist/cjs/wiki/common.js";
const OUTPUT_FILE = "dist/common.js";
const HEADER_PATH = "src/wiki/header.txt";

async function buildCommon(): Promise<void> {
	log.info("Building TypeScript to CommonJS");
	execSync(`tsc -p ${TSCONFIG_PATH}`, { stdio: "inherit" });

	log.info("Bundling with esbuild");
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
		log.info({ headerPath: HEADER_PATH }, "Adding header to the bundled file");
		const header = fs.readFileSync(HEADER_PATH, "utf8");
		const bundled = fs.readFileSync(OUTPUT_FILE, "utf8");
		fs.writeFileSync(OUTPUT_FILE, header + bundled);
	}

	log.info({ outputFile: OUTPUT_FILE }, "Build completed successfully");
}

buildCommon();

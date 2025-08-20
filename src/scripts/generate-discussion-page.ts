import * as fs from "node:fs";
import * as path from "node:path";
import { log } from "./logging.js";

const TO_VET_DIR = "data/card-summaries/to-vet";
const TEMPLATE_FILE = "data/card-summaries/DISCUSSION_TEMPLATE.wiki";
const OUTPUT_FILE = "tmp/all-discussions.wiki";

async function main(): Promise<void> {
	const template = fs.readFileSync(TEMPLATE_FILE, "utf8");
	const cardFiles = fs
		.readdirSync(TO_VET_DIR)
		.filter((file) => file.endsWith(".wiki"))
		.sort();
	log.info({ count: cardFiles.length }, "Found card files to process");

	const discussions: string[] = [];
	for (const file of cardFiles) {
		const cardName = path.basename(file, ".wiki").replace(/_/g, " ");
		const cardPath = path.join(TO_VET_DIR, file);
		const cardContent = fs.readFileSync(cardPath, "utf8").trim();
		const discussion = template.replace(/<CARD_NAME>/g, cardName).replace(/<ARTICLE_CONTENT>/g, cardContent);
		discussions.push(discussion);
	}

	const combinedContent = discussions.join("\n\n");
	const outputDir = path.dirname(OUTPUT_FILE);
	if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
	fs.writeFileSync(OUTPUT_FILE, combinedContent);
	log.info({ outputFile: OUTPUT_FILE }, "Discussion page generated successfully");
}

main();

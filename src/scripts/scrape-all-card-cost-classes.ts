// Scrape all card classes from the wiki and save to tmp/cost-classes.json.
// Run with `pnpx tsx src/scripts/scrape-all-card-cost-classes.ts`

import * as fs from "node:fs/promises";
import * as path from "node:path";
import * as cheerio from "cheerio";
import { CARD_SETS, ExtractGoal, fetchWikiPage, WIKI_URL } from "../dev/api/services/scraper.js";

const reCost = /^cost(\$)?(\d\d)?([*+])?((\d\d)[Dd])?([Pp])?$/i;

async function scrapeAllCardCostClasses(): Promise<string[]> {
	const cardSets = Object.keys(CARD_SETS).map((name) => ({
		name,
		url: `${WIKI_URL}/index.php/${CARD_SETS[name]}`,
	}));
	console.log(`Scraping ${cardSets.length} card sets...`);

	const allCostClasses = new Set<string>();
	for (const cardSet of cardSets) {
		console.log(`Processing ${cardSet.name}...`);
		const pageData = await fetchWikiPage(cardSet.url, ExtractGoal.cardsGallery);
		const $ = cheerio.load(pageData.content);
		$(".cardcost").each((_i, element) => {
			const classList = $(element).attr("class")?.split(/\s+/) || [];
			for (const className of classList) {
				if (reCost.test(className)) allCostClasses.add(className);
			}
		});
	}
	return Array.from(allCostClasses).sort();
}

async function main(): Promise<void> {
	console.log("Starting card cost class scraping...");
	const costClasses = await scrapeAllCardCostClasses();

	console.log(`Found ${costClasses.length} unique cost classes:`);
	console.log(JSON.stringify(costClasses, null, 2));

	const outputPath = path.join(process.cwd(), "tmp", "cost-classes.json");
	await fs.writeFile(outputPath, JSON.stringify(costClasses, null, 2));
	console.log(`Results written to ${outputPath}`);
}

main();

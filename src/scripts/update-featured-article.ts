import "dotenv/config";
import * as fs from "node:fs";
import * as path from "node:path";

import {
	checkContent,
	createSession,
	getEditToken,
	getPageContent,
	getTemplateTypeForComponent,
	login,
	type MediaWikiConfig,
	type MediaWikiSession,
	queryComponentType,
	updatePage,
} from "./lib/mediawiki";
import { log } from "./logging.js";

const MEDIAWIKI_BASE_URL = "https://wiki.dominionstrategy.com";
const FEATURED_ARTICLE_TEMPLATE = "Template:Featured_article";
const FEATURED_ARTICLES_LIST = "List_of_Featured_Articles";

/** Get a required environment variable, throwing an error if it's not set */
function mustEnv(key: string): string {
	const value = process.env[key];
	if (!value) {
		throw new Error(`Environment variable ${key} is required but not set`);
	}
	return value;
}

/** Parse command line arguments */
function parseArgs(): { articlesDir: string; dryRun: boolean } {
	const args = process.argv.slice(2);
	const dryRun = !args.includes("--confirm-edit");
	const articlesDir = args.find((arg) => !arg.startsWith("--")) || "data/card-summaries/articles";
	return { articlesDir, dryRun };
}

/** Extract featured article names from the list page content */
export function parseListOfFeaturedArticles(content: string): string[] {
	const featured = new Set<string>();

	// Match templates: {{Card|Name}}, {{Event|Name}}, {{Project|Name}}, {{Landmark|Name}}, {{Set|Name}}
	const templateRegex = /\{\{(?:Card|Event|Project|Landmark|Set)\|([^}]+)\}\}/g;
	let match = templateRegex.exec(content);
	while (match !== null) {
		featured.add(match[1]);
		match = templateRegex.exec(content);
	}

	// Also look for plain links like [[Dominion Online]] (but not namespace links)
	const linkRegex = /\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g;
	match = linkRegex.exec(content);
	while (match !== null) {
		if (!match[1].includes(":")) featured.add(match[1]);
		match = linkRegex.exec(content);
	}

	return Array.from(featured);
}

/** Get available articles from the directory */
export function getAvailableArticles(articlesDir: string): string[] {
	const files = fs.readdirSync(articlesDir);
	return files
		.filter((file: string) => file.endsWith(".wiki"))
		.map((file: string) => file.replace(".wiki", "").replace(/_/g, " "));
}

/** Normalize article name for comparison */
export function normalizeArticleName(name: string): string {
	return name
		.replace(/[^A-Za-z0-9]/g, "")
		.toLowerCase()
		.trim();
}

/** Select a random unfeatured article */
export function selectRandomUnfeaturedArticle(available: string[], featured: string[]): string {
	const normalizedFeatured = featured.map(normalizeArticleName);
	const unfeatured = available.filter((article) => !normalizedFeatured.includes(normalizeArticleName(article)));
	if (unfeatured.length === 0) throw new Error("No unfeatured articles available");

	const randomIndex = Math.floor(Math.random() * unfeatured.length);
	return unfeatured[randomIndex];
}

/** Load article content from file */
function loadArticleContent(articlesDir: string, articleName: string): string {
	const filename = `${articleName.replace(/ /g, "_")}.wiki`;
	const filepath = path.join(articlesDir, filename);

	if (!fs.existsSync(filepath)) {
		throw new Error(`Article file not found: ${filepath}`);
	}

	return fs.readFileSync(filepath, "utf8");
}

/** Get current date in YYYY-MM-DD format */
export function getCurrentDate(): string {
	return new Date().toISOString().split("T")[0];
}

/** Add new entry to the featured articles list */
export async function addToFeaturedArticlesList(
	currentContent: string,
	articleName: string,
	date: string,
	templateType: string,
): Promise<string> {
	const newEntry = `|{{${templateType}|${articleName}}} || ${date}`;

	const lines = currentContent.split("\n");
	const headerIndex = lines.findIndex((line) => line.includes("! Card !! Date Featured"));
	if (headerIndex === -1) {
		throw new Error("Could not find featured articles table structure");
	}

	// Find the first separator line after the header
	let insertIndex = headerIndex + 1;
	while (insertIndex < lines.length && lines[insertIndex].trim() !== "|-") {
		insertIndex++;
	}

	if (insertIndex < lines.length && lines[insertIndex].trim() === "|-") {
		// Found existing separator, insert new entry and separator right after it
		insertIndex++;
		lines.splice(insertIndex, 0, newEntry, "|-");
	} else {
		// No separator found (empty table), insert before table close
		// Find the table close marker "|}"
		const tableCloseIndex = lines.findIndex((line, index) => index > headerIndex && line.trim() === "|}");
		if (tableCloseIndex !== -1) {
			lines.splice(tableCloseIndex, 0, "|-", newEntry);
		} else {
			// Fallback: insert after header
			lines.splice(headerIndex + 1, 0, "|-", newEntry);
		}
	}

	return lines.join("\n");
}

async function main(): Promise<void> {
	const { articlesDir, dryRun } = parseArgs();
	const articlesPath = path.resolve(articlesDir);

	log.info({ articlesPath, dryRun }, "Starting featured article update");

	if (!fs.existsSync(articlesPath)) {
		throw new Error(`Articles directory not found: ${articlesPath}`);
	}

	const config: MediaWikiConfig = {
		baseUrl: MEDIAWIKI_BASE_URL,
		username: dryRun ? "" : mustEnv("MEDIAWIKI_USERNAME"),
		password: dryRun ? "" : mustEnv("MEDIAWIKI_PASSWORD"),
	};

	const featuredListContent = await getPageContent(config, FEATURED_ARTICLES_LIST);
	const featuredArticles = parseListOfFeaturedArticles(featuredListContent);
	log.info({ count: featuredArticles.length }, "Found featured articles");

	const availableArticles = getAvailableArticles(articlesPath);
	log.info({ count: availableArticles.length }, "Found available articles");

	const selectedArticle = selectRandomUnfeaturedArticle(availableArticles, featuredArticles);
	log.info({ article: selectedArticle }, "Selected next featured article");

	const articleContent = loadArticleContent(articlesPath, selectedArticle);
	log.info({ length: articleContent.length }, "Loaded article content");

	const currentDate = getCurrentDate();

	const types = await queryComponentType(config, selectedArticle);
	const templateType = getTemplateTypeForComponent(types);
	const updatedListContent = await addToFeaturedArticlesList(
		featuredListContent,
		selectedArticle,
		currentDate,
		templateType,
	);
	const templateNeedsUpdate = !(await checkContent(config, FEATURED_ARTICLE_TEMPLATE, articleContent));
	const listNeedsUpdate = !(await checkContent(config, FEATURED_ARTICLES_LIST, updatedListContent));

	if (dryRun) {
		log.info("DRY RUN MODE - No changes will be made (use --confirm-edit to actually update the wiki)");
		log.info({ templateNeedsUpdate, listNeedsUpdate }, "Would update pages");
		log.info({ article: selectedArticle }, "Would feature article");
		log.info("New featured article content:");
		log.info(articleContent);
		log.info(
			{ value: `{{${templateType}|${selectedArticle}}} || ${currentDate}` },
			"Would add to featured articles list",
		);
		return;
	}

	if (!templateNeedsUpdate && !listNeedsUpdate) {
		log.info("No changes needed, both pages are already up to date");
		return;
	}

	log.info("Authenticating with MediaWiki");
	const session: MediaWikiSession = createSession();
	await login(config, session);
	await getEditToken(config, session);

	if (templateNeedsUpdate) {
		log.info("Updating featured article template");
		await updatePage(
			config,
			session,
			FEATURED_ARTICLE_TEMPLATE,
			articleContent,
			`Update featured article to ${selectedArticle}`,
		);
		log.info("Featured article template updated successfully");
	}

	if (listNeedsUpdate) {
		log.info("Updating featured articles list");
		await updatePage(
			config,
			session,
			FEATURED_ARTICLES_LIST,
			updatedListContent,
			`Add ${selectedArticle} to featured articles list`,
		);
		log.info("Featured articles list updated successfully");
	}

	log.info({ article: selectedArticle }, "Featured article update completed successfully");
}

if (require.main === module) main();

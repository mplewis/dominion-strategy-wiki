import * as fs from "node:fs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock fs module
vi.mock("node:fs", () => ({
	readdirSync: vi.fn(() => []),
	existsSync: vi.fn(() => true),
	readFileSync: vi.fn(() => "mock file content"),
}));

// Mock mediawiki module
vi.mock("./lib/mediawiki.js", async (importOriginal) => {
	// biome-ignore lint/suspicious/noExplicitAny: needed for module mocking
	const actual = (await importOriginal()) as any;
	return {
		...actual,
		queryComponentType: vi.fn(async () => ["Card"]),
		getTemplateTypeForComponent: vi.fn(() => "Card"),
		getPageContent: vi.fn(async () => "mock content"),
		checkContent: vi.fn(async () => true),
	};
});

import {
	addToFeaturedArticlesList,
	getAvailableArticles,
	normalizeArticleName,
	parseListOfFeaturedArticles,
	selectRandomUnfeaturedArticle,
} from "./update-featured-article.js";

describe("parseListOfFeaturedArticles", () => {
	it("extracts card names from {{Card|Name}} templates", () => {
		const content = `
		{| class="wikitable sortable" style="text-align:center;"
		! Card !! Date Featured
		|-
		|{{Card|Pillage}} || 2024-11-26
		|-
		|{{Card|Peasant}} || 2024-09-29
		|-
		|{{Card|Prince}} || 2022-04-25
		|}
		`;

		const result = parseListOfFeaturedArticles(content);
		expect(result).toContain("Pillage");
		expect(result).toContain("Peasant");
		expect(result).toContain("Prince");
	});

	it("extracts event names from {{Event|Name}} templates", () => {
		const content = `
		|-
		|{{Event|Pathfinding}} || 2021-09-19
		|-
		|{{Event|Triumph}} || 2021-08-14
		`;

		const result = parseListOfFeaturedArticles(content);
		expect(result).toContain("Pathfinding");
		expect(result).toContain("Triumph");
	});

	it("extracts project names from {{Project|Name}} templates", () => {
		const content = `
		|-
		|{{Project|Innovation}} || 2021-10-17
		|-
		|{{Project|Citadel}} || 2021-08-09
		`;

		const result = parseListOfFeaturedArticles(content);
		expect(result).toContain("Innovation");
		expect(result).toContain("Citadel");
	});

	it("extracts landmark names from {{Landmark|Name}} templates", () => {
		const content = `
		|-
		|{{Landmark|Battlefield}} || 2021-10-04
		`;

		const result = parseListOfFeaturedArticles(content);
		expect(result).toContain("Battlefield");
	});

	it("extracts set names from {{Set|Name}} templates", () => {
		const content = `
		|-
		|{{Set|Renaissance}} || 2019-02-01
		|-
		|{{Set|Nocturne}} || 2018-07-07
		`;

		const result = parseListOfFeaturedArticles(content);
		expect(result).toContain("Renaissance");
		expect(result).toContain("Nocturne");
	});

	it("extracts plain links like [[Dominion Online]]", () => {
		const content = `
		|-
		|[[Dominion Online]] || 2015-10-15
		`;

		const result = parseListOfFeaturedArticles(content);
		expect(result).toContain("Dominion Online");
	});

	it("ignores links with colons (namespace links)", () => {
		const content = `
		|-
		|[[File:SomeImage.jpg]] || 2021-01-01
		|-
		|[[Category:SomeCategory]] || 2021-01-01
		|-
		|{{Card|ValidCard}} || 2021-01-01
		`;

		const result = parseListOfFeaturedArticles(content);
		expect(result).not.toContain("File:SomeImage.jpg");
		expect(result).not.toContain("Category:SomeCategory");
		expect(result).toContain("ValidCard");
	});

	it("deduplicates when same article appears multiple times", () => {
		const content = `
		|-
		|{{Card|Prince}} || 2022-04-25
		|-
		|{{Card|Prince}} || 2016-05-12
		|-
		|[[Prince]] || 2015-01-01
		`;

		const result = parseListOfFeaturedArticles(content);
		const princeCount = result.filter((name) => name === "Prince").length;
		// Set deduplicates, so expect 1 regardless of how many times it appears
		expect(princeCount).toBe(1);
	});

	it("returns empty array for content with no featured articles", () => {
		const content = "This is just some random text with no templates.";
		const result = parseListOfFeaturedArticles(content);
		expect(result).toEqual([]);
	});
});

describe("getAvailableArticles", () => {
	it("extracts article names from .wiki files", () => {
		const mockFiles = [
			"Black_Market.wiki",
			"Village.wiki",
			"Chapel.wiki",
			"not-a-wiki-file.txt",
			"Another_Article.wiki",
		];
		vi.mocked(fs.readdirSync).mockReturnValue(mockFiles as never);

		const result = getAvailableArticles("/fake/path");
		expect(result).toContain("Black Market");
		expect(result).toContain("Village");
		expect(result).toContain("Chapel");
		expect(result).toContain("Another Article");
		expect(result).not.toContain("not-a-wiki-file.txt");
		expect(result).not.toContain("not-a-wiki-file");
	});

	it("converts underscores to spaces", () => {
		const mockFiles = ["Way_of_the_Monkey.wiki", "Sir_Michael.wiki"];
		vi.mocked(fs.readdirSync).mockReturnValue(mockFiles as never);

		const result = getAvailableArticles("/fake/path");
		expect(result).toContain("Way of the Monkey");
		expect(result).toContain("Sir Michael");
	});

	it("returns empty array when no .wiki files found", () => {
		const mockFiles = ["readme.txt", "config.json"];
		vi.mocked(fs.readdirSync).mockReturnValue(mockFiles as never);

		const result = getAvailableArticles("/fake/path");
		expect(result).toEqual([]);
	});
});

describe("normalizeArticleName", () => {
	it("removes all non-alphanumeric characters", () => {
		expect(normalizeArticleName("Black_Market")).toBe("blackmarket");
		expect(normalizeArticleName("Way of the Monkey")).toBe("wayofthemonkey");
		expect(normalizeArticleName("Village")).toBe("village");
		expect(normalizeArticleName("CHAPEL")).toBe("chapel");
		expect(normalizeArticleName("  Village  ")).toBe("village");
		expect(normalizeArticleName("\tChapel\n")).toBe("chapel");
		expect(normalizeArticleName("Sir-Michael's")).toBe("sirmichaels");
		expect(normalizeArticleName("Sir_Michael")).toBe("sirmichael");
		expect(normalizeArticleName("Dame Anna")).toBe("dameanna");
	});
});

describe("selectRandomUnfeaturedArticle", () => {
	const originalRandom = Math.random;

	beforeEach(() => {
		// Always select first item (index 0)
		Math.random = vi.fn(() => 0);
	});

	afterEach(() => {
		Math.random = originalRandom;
	});

	it("selects from unfeatured articles only", () => {
		const available = ["Village", "Chapel", "Black Market", "Witch"];
		const featured = ["village", "chapel"]; // normalized versions

		const result = selectRandomUnfeaturedArticle(available, featured);
		expect(["Black Market", "Witch"]).toContain(result);
	});

	it("is case insensitive when comparing featured articles", () => {
		const available = ["Village", "Chapel"];
		const featured = ["VILLAGE", "chapel"];

		const result = () => selectRandomUnfeaturedArticle(available, featured);
		expect(result).toThrow("No unfeatured articles available");
	});

	it("handles different formats in comparison", () => {
		const available = ["Black Market", "Way of the Monkey"];
		const featured = ["Black_Market"];

		const result = selectRandomUnfeaturedArticle(available, featured);
		expect(result).toBe("Way of the Monkey");
	});

	it("throws error when no unfeatured articles available", () => {
		const available = ["Village", "Chapel"];
		const featured = ["Village", "Chapel"];

		const result = () => selectRandomUnfeaturedArticle(available, featured);
		expect(result).toThrow("No unfeatured articles available");
	});
});

describe("addToFeaturedArticlesList", () => {
	it("adds new entry after table header", async () => {
		const currentContent = `This is a list of articles that have been '''featured''' on the main page.

== Featured Articles by date featured ==
{| class="wikitable sortable" style="text-align:center;"
! Card !! Date Featured
|-
|{{Card|Pillage}} || 2024-11-26
|-
|{{Card|Peasant}} || 2024-09-29
|}`;

		const result = await addToFeaturedArticlesList(currentContent, "Village", "2025-01-01", "Card");
		expect(result).toMatchInlineSnapshot(`
			"This is a list of articles that have been '''featured''' on the main page.

			== Featured Articles by date featured ==
			{| class="wikitable sortable" style="text-align:center;"
			! Card !! Date Featured
			|-
			|{{Card|Village}} || 2025-01-01
			|-
			|{{Card|Pillage}} || 2024-11-26
			|-
			|{{Card|Peasant}} || 2024-09-29
			|}"
		`);
	});

	it("preserves existing content structure", async () => {
		const currentContent = `Introduction text here.

== Featured Articles by date featured ==
{| class="wikitable sortable" style="text-align:center;"
! Card !! Date Featured
|-
|{{Card|Existing}} || 2024-01-01
|}

Footer text here.`;

		const result = await addToFeaturedArticlesList(currentContent, "NewCard", "2025-01-01", "Card");
		expect(result).toMatchInlineSnapshot(`
			"Introduction text here.

			== Featured Articles by date featured ==
			{| class="wikitable sortable" style="text-align:center;"
			! Card !! Date Featured
			|-
			|{{Card|NewCard}} || 2025-01-01
			|-
			|{{Card|Existing}} || 2024-01-01
			|}

			Footer text here."
		`);
	});

	it("throws error when table structure not found", async () => {
		const currentContent = "This content has no table structure.";
		await expect(() => addToFeaturedArticlesList(currentContent, "Village", "2025-01-01", "Card")).rejects.toThrow(
			"Could not find featured articles table structure",
		);
	});

	it("handles empty table correctly", async () => {
		const currentContent = `== Featured Articles by date featured ==
{| class="wikitable sortable" style="text-align:center;"
! Card !! Date Featured
|}`;

		const result = await addToFeaturedArticlesList(currentContent, "FirstCard", "2025-01-01", "Card");
		expect(result).toMatchInlineSnapshot(`
			"== Featured Articles by date featured ==
			{| class="wikitable sortable" style="text-align:center;"
			! Card !! Date Featured
			|-
			|{{Card|FirstCard}} || 2025-01-01
			|}"
		`);
	});

	it("uses correct template type for Events", async () => {
		const { queryComponentType, getTemplateTypeForComponent } = await import("./lib/mediawiki.js");

		// Mock to return Event type
		vi.mocked(queryComponentType).mockResolvedValueOnce(["Event"]);
		vi.mocked(getTemplateTypeForComponent).mockReturnValueOnce("Event");

		const currentContent = `== Featured Articles by date featured ==
{| class="wikitable sortable" style="text-align:center;"
! Card !! Date Featured
|}`;

		const result = await addToFeaturedArticlesList(currentContent, "Pathfinding", "2025-01-01", "Event");
		expect(result).toContain("{{Event|Pathfinding}}");
	});

	it("uses correct template type for Projects", async () => {
		const { queryComponentType, getTemplateTypeForComponent } = await import("./lib/mediawiki.js");

		// Mock to return Project type
		vi.mocked(queryComponentType).mockResolvedValueOnce(["Project"]);
		vi.mocked(getTemplateTypeForComponent).mockReturnValueOnce("Project");

		const currentContent = `== Featured Articles by date featured ==
{| class="wikitable sortable" style="text-align:center;"
! Card !! Date Featured
|}`;

		const result = await addToFeaturedArticlesList(currentContent, "Citadel", "2025-01-01", "Project");
		expect(result).toContain("{{Project|Citadel}}");
	});
});

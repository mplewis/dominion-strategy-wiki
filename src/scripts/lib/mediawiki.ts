import * as axios from "axios";

export interface MediaWikiConfig {
	baseUrl: string;
	username: string;
	password: string;
}

export interface MediaWikiSession {
	cookies: string[];
	editToken: string | null;
}

export interface CargoQueryResult {
	name: string;
	types: string[];
}

/** Prioritized wiki templates to return for cards that match more than one */
const WIKI_TEMPLATES = [
	{ type: "Event", template: "Event" },
	{ type: "Project", template: "Project" },
	{ type: "Landmark", template: "Landmark" },
	{ type: "Way", template: "Way" },
	{ type: "Boon", template: "Boon" },
	{ type: "Hex", template: "Hex" },
	{ type: "State", template: "State" },
	{ type: "Artifact", template: "Artifact" },
	{ type: "Trait", template: "Trait" },
];
/** If none match, use Template:Card */
const DEFAULT_WIKI_TEMPLATE = "Card";

/** Extract and store cookies from response headers */
// biome-ignore lint/suspicious/noExplicitAny: support arbitrary requests
function storeCookies(response: axios.AxiosResponse<any, any>, session: MediaWikiSession): void {
	const setCookieHeaders = response.headers["set-cookie"];
	if (setCookieHeaders) {
		for (const cookie of setCookieHeaders as string[]) {
			const cookiePart = cookie.split(";")[0];
			session.cookies.push(cookiePart);
		}
	}
}

/** Get cookie header string for requests */
function getCookieHeader(session: MediaWikiSession): string {
	return session.cookies.join("; ");
}

/** Get the current git commit hash */
function getGitCommitHash(): string {
	return process.env.GITHUB_SHA || "unknown";
}

/** Get the commit message title (first line only) */
function getCommitMessage(): string {
	const fullMessage = process.env.GITHUB_EVENT_HEAD_COMMIT_MESSAGE || "Unknown commit";
	return fullMessage.split("\n")[0];
}

/** Get the actor/author */
function getActor(): string {
	return process.env.GITHUB_ACTOR || "unknown";
}

/** Create a new MediaWiki session */
export function createSession(): MediaWikiSession {
	return {
		cookies: [],
		editToken: null,
	};
}

/** Login to MediaWiki */
export async function login(config: MediaWikiConfig, session: MediaWikiSession): Promise<void> {
	const apiUrl = `${config.baseUrl}/api.php`;

	const tokenResponse = await axios.get(apiUrl, {
		params: { action: "query", meta: "tokens", type: "login", format: "json" },
	});

	storeCookies(tokenResponse, session);
	const loginToken = tokenResponse.data.query.tokens.logintoken;

	const loginData = new URLSearchParams({
		action: "login",
		lgname: config.username,
		lgpassword: config.password,
		lgtoken: loginToken,
		format: "json",
	});

	const loginResponse = await axios.post(apiUrl, loginData, {
		headers: {
			Cookie: getCookieHeader(session),
			"Content-Type": "application/x-www-form-urlencoded",
		},
	});
	storeCookies(loginResponse, session);

	const result = loginResponse.data?.login?.result;

	if (result === "NeedToken") {
		// Some MediaWiki versions need a second attempt with fresh token
		return login(config, session);
	}

	if (result !== "Success") {
		const reason = loginResponse.data?.login?.reason || "Unknown error";
		throw new Error(`MediaWiki login failed: ${result} - ${reason}`);
	}
}

/** Get CSRF token for editing */
export async function getEditToken(config: MediaWikiConfig, session: MediaWikiSession): Promise<void> {
	const apiUrl = `${config.baseUrl}/api.php`;
	const response = await axios.get(apiUrl, {
		params: { action: "query", meta: "tokens", format: "json" },
		headers: { Cookie: getCookieHeader(session) },
	});
	session.editToken = response.data.query.tokens.csrftoken || null;
	if (!session.editToken) {
		throw new Error("Failed to obtain CSRF token");
	}
}

/** Get the content of a MediaWiki page */
export async function getPageContent(config: MediaWikiConfig, title: string): Promise<string> {
	const url = `${config.baseUrl}/index.php?title=${encodeURIComponent(title)}&action=raw`;
	const response = await axios.get(url);
	return response.data;
}

/** Update a MediaWiki page with new content */
export async function updatePage(
	config: MediaWikiConfig,
	session: MediaWikiSession,
	title: string,
	content: string,
	summary: string,
): Promise<{ result: string }> {
	const apiUrl = `${config.baseUrl}/api.php`;
	const commitHash = getGitCommitHash();
	const commitMessage = getCommitMessage();
	const actor = getActor();
	const repoUrl = "https://github.com/mplewis/dominion-strategy-wiki";
	const fullSummary = `${summary} - ${commitMessage} by @${actor} - ${repoUrl}/commit/${commitHash}`;

	const editData = new URLSearchParams({
		action: "edit",
		title: title,
		text: content,
		token: session.editToken || "",
		summary: fullSummary,
		format: "json",
	});

	const response = await axios.post(apiUrl, editData, {
		headers: {
			Cookie: getCookieHeader(session),
			"Content-Type": "application/x-www-form-urlencoded",
		},
	});

	if (response.data.edit && response.data.edit.result === "Success") {
		return response.data.edit;
	}
	throw new Error(`Edit failed: ${JSON.stringify(response.data)}`);
}

/** Check if the provided content equals the current page content */
export async function checkContent(config: MediaWikiConfig, title: string, content: string): Promise<boolean> {
	const currentContent = await getPageContent(config, title);
	return currentContent.trim() === content.trim();
}

/** Query the type of a game component using the Categories API */
export async function queryComponentType(config: MediaWikiConfig, name: string): Promise<string[]> {
	const apiUrl = `${config.baseUrl}/api.php`;
	const params = new URLSearchParams({
		action: "query",
		prop: "categories",
		titles: name,
		format: "json",
	});
	const response = await axios.get(apiUrl, { params });
	if (response.data.error) throw new Error(`MediaWiki API error: ${response.data.error.info}`);
	const pages = response.data.query?.pages;
	if (!pages) return [];

	// Get the first page (there should only be one)
	const pageId = Object.keys(pages)[0];
	const page = pages[pageId];
	if (!page.categories) return [];

	// Extract component types from categories
	const types: string[] = [];
	for (const category of page.categories) {
		const categoryTitle = category.title.replace("Category:", "");
		if (categoryTitle === "Event cards") {
			types.push("Event");
		} else if (categoryTitle === "Project cards") {
			types.push("Project");
		} else if (categoryTitle === "Landmark cards") {
			types.push("Landmark");
		} else if (categoryTitle === "Way cards") {
			types.push("Way");
		} else if (categoryTitle === "Boon cards") {
			types.push("Boon");
		} else if (categoryTitle === "Hex cards") {
			types.push("Hex");
		} else if (categoryTitle === "State cards") {
			types.push("State");
		} else if (categoryTitle === "Artifact cards") {
			types.push("Artifact");
		} else if (categoryTitle === "Trait cards") {
			types.push("Trait");
		}
	}

	// If no specific type found but has "Cards" category, default to Card
	if (types.length === 0) {
		// biome-ignore lint/suspicious/noExplicitAny: we don't know what's in there
		const hasCards = page.categories.some((cat: any) => cat.title.replace("Category:", "") === "Cards");
		if (hasCards) types.push("Card");
	}

	return types;
}

/** Determine the appropriate template type for a given component */
export function getTemplateTypeForComponent(types: string[]): string {
	for (const { type, template } of WIKI_TEMPLATES) {
		if (types.includes(type)) return template;
	}
	return DEFAULT_WIKI_TEMPLATE;
}

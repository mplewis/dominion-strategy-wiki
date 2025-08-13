#!/usr/bin/env node

require("dotenv/config");
const axios = require("axios");
const fs = require("node:fs");
const path = require("node:path");
const pino = require("pino");

const MEDIAWIKI_BASE_URL = "https://wiki.dominionstrategy.com";
const TARGET_PAGE_NAME = "MediaWiki:Common.js";
const MAX_PREVIEW_LENGTH = 500;
const GITHUB_REPO_URL = "https://github.com/mplewis/dominion-strategy-wiki";

const MEDIAWIKI_API_URL = `${MEDIAWIKI_BASE_URL}/api.php`;
const VERIFY_CONTENT_URL = `${MEDIAWIKI_BASE_URL}/index.php?title=${TARGET_PAGE_NAME}&action=raw`;

const log = pino({
	transport: {
		target: "pino-pretty",
		options: {
			colorize: true,
			translateTime: "HH:MM:ss",
			ignore: "pid,hostname",
		},
	},
});

/** Get a required environment variable, throwing an error if it's not set */
function mustEnv(key: string): string {
	const value = process.env[key];
	if (!value) {
		throw new Error(`Environment variable ${key} is required but not set`);
	}
	return value;
}

const MEDIAWIKI_USERNAME = mustEnv("MEDIAWIKI_USERNAME");
const MEDIAWIKI_PASSWORD = mustEnv("MEDIAWIKI_PASSWORD");
const COMPILED_JS_PATH = path.join(__dirname, "..", "common.js");

interface AxiosResponse {
	headers: Record<string, string | string[]>;
	data: {
		login?: { result: string; reason?: string };
		query?: { tokens: { logintoken?: string; csrftoken?: string } };
		edit?: { result: string };
	};
}

const cookies: string[] = [];
let editToken: string | null = null;

/** Extract and store cookies from response headers */
function storeCookies(response: AxiosResponse): void {
	const setCookieHeaders = response.headers["set-cookie"];
	if (setCookieHeaders) {
		for (const cookie of setCookieHeaders as string[]) {
			const cookiePart = cookie.split(";")[0];
			cookies.push(cookiePart);
		}
	}
}

/** Get cookie header string for requests */
function getCookieHeader(): string {
	return cookies.join("; ");
}

/** Get the current git commit hash */
function getGitCommitHash(): string {
	return process.env.GITHUB_SHA || "unknown";
}

/** Get the commit message */
function getCommitMessage(): string {
	return process.env.GITHUB_EVENT_HEAD_COMMIT_MESSAGE || "Unknown commit";
}

/** Get the actor/author */
function getActor(): string {
	return process.env.GITHUB_ACTOR || "unknown";
}

/** Login to MediaWiki */
async function login(): Promise<void> {
	log.info({ apiUrl: MEDIAWIKI_API_URL, username: MEDIAWIKI_USERNAME }, "Logging in to MediaWiki");

	const tokenResponse = await axios.get(MEDIAWIKI_API_URL, {
		params: { action: "query", meta: "tokens", type: "login", format: "json" },
	});

	storeCookies(tokenResponse);
	const loginToken = tokenResponse.data.query.tokens.logintoken;
	log.debug({ loginToken }, "Retrieved login token");

	const loginData = new URLSearchParams({
		action: "login",
		lgname: MEDIAWIKI_USERNAME,
		lgpassword: MEDIAWIKI_PASSWORD,
		lgtoken: loginToken,
		format: "json",
	});

	const loginResponse = await axios.post(MEDIAWIKI_API_URL, loginData, {
		headers: {
			Cookie: getCookieHeader(),
			"Content-Type": "application/x-www-form-urlencoded",
		},
	});
	storeCookies(loginResponse);

	const result = loginResponse.data?.login?.result;
	log.debug({ result, loginResponse: loginResponse.data }, "Login response received");

	if (result === "NeedToken") {
		log.info("Login requires token, retrying with new token");
		// Some MediaWiki versions need a second attempt with fresh token
		return login();
	}

	if (result !== "Success") {
		log.error({ response: loginResponse.data }, "Login failed");
		const reason = loginResponse.data?.login?.reason || "Unknown error";
		throw new Error(`MediaWiki login failed: ${result} - ${reason}`);
	}
	log.info("Login successful");
}

/** Get CSRF token for editing */
async function getEditToken(): Promise<void> {
	log.info("Getting edit token");
	const response = await axios.get(MEDIAWIKI_API_URL, {
		params: { action: "query", meta: "tokens", format: "json" },
		headers: { Cookie: getCookieHeader() },
	});
	editToken = response.data.query.tokens.csrftoken || null;
	if (!editToken) {
		throw new Error("Failed to obtain CSRF token");
	}
	log.info("Edit token obtained");
}

/** Update the MediaWiki page with new content */
async function updatePage(content: string): Promise<{ result: string }> {
	log.info({ page: TARGET_PAGE_NAME, contentLength: content.length }, "Updating page");

	const commitHash = getGitCommitHash();
	const commitMessage = getCommitMessage();
	const actor = getActor();
	const summary = `${commitMessage} by @${actor} - ${GITHUB_REPO_URL}/commit/${commitHash}`;

	const editData = new URLSearchParams({
		action: "edit",
		title: TARGET_PAGE_NAME,
		text: content,
		token: editToken || "",
		summary: summary,
		format: "json",
	});

	const response = await axios.post(MEDIAWIKI_API_URL, editData, {
		headers: {
			Cookie: getCookieHeader(),
			"Content-Type": "application/x-www-form-urlencoded",
		},
	});

	if (response.data.edit && response.data.edit.result === "Success") {
		log.info("Page updated successfully");
		return response.data.edit;
	}
	throw new Error(`Edit failed: ${JSON.stringify(response.data)}`);
}

/** Create a preview snippet of a string, truncating if necessary */
function snipPreview(s: string): string {
	return s.substring(0, MAX_PREVIEW_LENGTH) + (s.length > MAX_PREVIEW_LENGTH ? "…" : "");
}

/** Check if the provided content equals the current page content */
async function checkContent(content: string) {
	log.info({ url: VERIFY_CONTENT_URL }, "Checking current page content");
	const response = await axios.get(VERIFY_CONTENT_URL);
	const currentContent = response.data;
	const identical = currentContent.trim() === content.trim();
	return { currentContent, identical };
}

/** Verify the page content matches what we uploaded */
async function verifyContent(expectedContent: string): Promise<boolean> {
	log.info("Verifying uploaded content");
	const { identical, currentContent } = await checkContent(expectedContent);
	if (!identical) {
		log.error(
			{
				expectedLength: expectedContent.length,
				actualLength: currentContent.length,
				expectedPreview: snipPreview(expectedContent),
				actualPreview: snipPreview(currentContent),
			},
			"Content verification failed",
		);
		return false;
	}

	log.info("Content verification successful");
	return true;
}

async function main(): Promise<void> {
	const jsContent = fs.readFileSync(COMPILED_JS_PATH, "utf8");
	log.info({ path: COMPILED_JS_PATH, contentLength: jsContent.length }, "Loaded JavaScript content");

	const { identical } = await checkContent(jsContent);
	if (identical) {
		log.info("No changes detected, skipping deployment");
		return;
	}

	await login();
	await getEditToken();
	await updatePage(jsContent);

	const verified = await verifyContent(jsContent);
	if (!verified) process.exit(1);
	log.info("Deployment completed successfully");
}

main();

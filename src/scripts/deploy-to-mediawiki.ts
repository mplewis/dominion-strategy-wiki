#!/usr/bin/env node

require("dotenv/config");
const axios = require("axios");
const fs = require("node:fs");
const path = require("node:path");
const pino = require("pino");

const MEDIAWIKI_API_URL = "https://wiki.dominionstrategy.com/api.php";
const TARGET_PAGE = "MediaWiki:Common.js";

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
    throw new Error(
      `MediaWiki login failed: ${result} - ${loginResponse.data?.login?.reason || "Unknown error"}`
    );
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
  log.info({ page: TARGET_PAGE, contentLength: content.length }, "Updating page");

  const editData = new URLSearchParams({
    action: "edit",
    title: TARGET_PAGE,
    text: content,
    token: editToken || "",
    summary: "Automated update from GitHub Actions",
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

/** Verify the page content matches what we uploaded */
async function verifyContent(expectedContent: string): Promise<boolean> {
  log.info("Verifying uploaded content");

  const verifyUrl = `https://wiki.dominionstrategy.com/index.php?title=${TARGET_PAGE}&action=raw`;
  const response = await axios.get(verifyUrl);
  const actualContent = response.data;

  if (actualContent === expectedContent) {
    log.info("Content verification successful");
    return true;
  }

  log.error(
    {
      expectedLength: expectedContent.length,
      actualLength: actualContent.length,
    },
    "Content verification failed"
  );

  const maxPreviewLength = 500;
  const expectedPreview =
    expectedContent.substring(0, maxPreviewLength) +
    (expectedContent.length > maxPreviewLength ? "..." : "");
  const actualPreview =
    actualContent.substring(0, maxPreviewLength) +
    (actualContent.length > maxPreviewLength ? "..." : "");

  log.debug({ expectedPreview, actualPreview }, "Content preview diff");

  return false;
}

/** Main deployment function */
async function main(): Promise<void> {
  const jsContent = fs.readFileSync(COMPILED_JS_PATH, "utf8");
  log.info(
    { path: COMPILED_JS_PATH, contentLength: jsContent.length },
    "Loaded JavaScript content"
  );

  await login();
  await getEditToken();
  await updatePage(jsContent);

  const isVerified = await verifyContent(jsContent);
  if (!isVerified) {
    process.exit(1);
  }

  log.info("Deployment completed successfully");
}

main();

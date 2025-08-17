import { EXPANSION_LINKS } from "../core/config";

/**
 * Shows or hides Dominion expansion links in the sidebar based on user preference.
 * Can read setting from cookie if 'cookie' is passed as parameter.
 * @param show - Whether to show or hide the expansion links
 */
export function applySidebarExpansions(show: boolean): void {
	console.debug(`[applySidebarExpansions] Setting expansion visibility to:`, show);
	const elems = document.querySelectorAll(".showExpansionItem");
	console.debug(`[applySidebarExpansions] Found ${elems.length} expansion elements`);
	for (let i = 0; i < elems.length; i++) {
		const elem = elems[i] as HTMLElement;
		const displayValue = show ? "block" : "none";
		console.debug(`[applySidebarExpansions] Setting element ${i} display to: ${displayValue}`, elem);
		elem.style.display = displayValue;
	}
	console.debug(`[applySidebarExpansions] Completed setting visibility for all expansion elements`);
}

/**
 * Creates a navigation link for a specific Dominion expansion in the sidebar.
 * Uses MediaWiki's article path configuration to generate proper URLs.
 * @param link - The wiki page name/path for the expansion
 * @param title - Display text for the expansion link
 */
export function addExpansionLink(target: Element, link: string, title: string): void {
	console.debug(`[addExpansionLink] Adding expansion link - title: ${title}, link: ${link}`);
	console.debug(`[addExpansionLink] Target element:`, target);
	const optionLi = document.createElement("li");
	optionLi.classList.add("showExpansionItem");
	console.debug(`[addExpansionLink] Created LI element with class showExpansionItem`);
	// Access MediaWiki global safely
	const mwGlobal = (window as { mw?: { config: { values: { wgArticlePath: string } } } }).mw;
	console.debug(`[addExpansionLink] MediaWiki global object:`, mwGlobal);
	const urlBase = mwGlobal?.config?.values?.wgArticlePath?.replace("$1", "") || "";
	console.debug(`[addExpansionLink] URL base: ${urlBase}`);
	const fullUrl = `${urlBase}${link}`;
	optionLi.innerHTML = `<a href="${fullUrl}">${title}</a>`;
	console.debug(`[addExpansionLink] Set LI HTML: ${optionLi.innerHTML}`);
	target?.insertBefore(optionLi, null);
	console.debug(`[addExpansionLink] Inserted expansion link for ${title}`);
}

/**
 * Populates the sidebar with navigation links to all Dominion expansions.
 * Creates links for all major expansions from Base Set through Rising Sun plus Promos.
 * Only runs once per page load to avoid duplicates.
 */
export function addExpansionSidebarLinks(): void {
	console.debug(`[addExpansionSidebarLinks] Starting to add expansion sidebar links`);
	const pNavigationUl = document.querySelector("#p-navigation ul");
	console.debug(`[addExpansionSidebarLinks] Navigation UL element:`, pNavigationUl);
	const existingLinks = document.querySelector("#expansionSidebarLinks");
	console.debug(`[addExpansionSidebarLinks] Existing expansion links element:`, existingLinks);
	if (pNavigationUl && !existingLinks) {
		console.debug(`[addExpansionSidebarLinks] Creating expansion sidebar links container`);
		const expansionSidebarLinks = document.createElement("span");
		expansionSidebarLinks.id = "expansionSidebarLinks";
		pNavigationUl.insertBefore(expansionSidebarLinks, null);
		console.debug(
			`[addExpansionSidebarLinks] Inserted container, processing ${Object.keys(EXPANSION_LINKS).length} expansion links`,
			{ pNavigationUl },
		);
		console.debug(`[addExpansionSidebarLinks] Expansion links to add:`, EXPANSION_LINKS);
		for (const [link, title] of Object.entries(EXPANSION_LINKS)) {
			console.debug(`[addExpansionSidebarLinks] Processing expansion: ${title} -> ${link}`);
			addExpansionLink(expansionSidebarLinks, link, title);
		}
		console.debug(`[addExpansionSidebarLinks] Completed adding all expansion links`);
	} else {
		console.debug(`[addExpansionSidebarLinks] Skipping - either no navigation UL or links already exist`);
	}
}

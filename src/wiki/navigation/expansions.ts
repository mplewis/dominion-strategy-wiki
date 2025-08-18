import { EXPANSION_LINKS } from "../core/config";

/**
 * Shows or hides Dominion expansion links in the sidebar based on user preference.
 * Can read setting from cookie if 'cookie' is passed as parameter.
 * @param show - Whether to show or hide the expansion links
 */
export function applySidebarExpansions(show: boolean): void {
	const elems = document.querySelectorAll(".showExpansionItem");
	for (let i = 0; i < elems.length; i++) {
		const elem = elems[i] as HTMLElement;
		const displayValue = show ? "block" : "none";
		elem.style.display = displayValue;
	}
}

/**
 * Creates a navigation link for a specific Dominion expansion in the sidebar.
 * Uses MediaWiki's article path configuration to generate proper URLs.
 * @param link - The wiki page name/path for the expansion
 * @param title - Display text for the expansion link
 */
export function addExpansionLink(target: Element, link: string, title: string): void {
	const mwGlobal = (window as { mw?: { config: { values: { wgArticlePath: string } } } }).mw;
	const urlBase = mwGlobal?.config?.values?.wgArticlePath?.replace("$1", "") || "";
	const fullUrl = `${urlBase}${link}`;

	const optionLi = document.createElement("li");
	optionLi.classList.add("showExpansionItem");
	optionLi.innerHTML = `<a href="${fullUrl}">${title}</a>`;
	target.appendChild(optionLi);
}

/**
 * Populates the sidebar with navigation links to all Dominion expansions.
 * Creates links for all major expansions from Base Set through Rising Sun plus Promos.
 * Only runs once per page load to avoid duplicates.
 */
export function addExpansionSidebarLinks(): void {
	const existingLinks = document.querySelector("#expansionSidebarLinks");
	if (existingLinks) return;
	const pNavigationUl = document.querySelector("#p-navigation ul");
	if (!pNavigationUl) {
		console.warn("Target container not found: #p-navigation ul");
		return;
	}

	const expansionSidebarLinks = document.createElement("div");
	expansionSidebarLinks.id = "expansionSidebarLinks";
	pNavigationUl.appendChild(expansionSidebarLinks);
	for (const [link, title] of EXPANSION_LINKS) {
		addExpansionLink(expansionSidebarLinks, link, title);
	}
}

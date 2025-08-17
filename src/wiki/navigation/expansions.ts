import { EXPANSION_LINKS } from "../core/config";

/**
 * Shows or hides Dominion expansion links in the sidebar based on user preference.
 * Can read setting from cookie if 'cookie' is passed as parameter.
 * @param show - Whether to show or hide the expansion links
 */
export function applySidebarExpansions(show: boolean): void {
	const elems = document.querySelectorAll(".showExpansionItem");
	for (let i = 0; i < elems.length; i++) {
		(elems[i] as HTMLElement).style.display = show ? "block" : "none";
	}
}

/**
 * Creates a navigation link for a specific Dominion expansion in the sidebar.
 * Uses MediaWiki's article path configuration to generate proper URLs.
 * @param link - The wiki page name/path for the expansion
 * @param title - Display text for the expansion link
 */
export function addExpansionLink(link: string, title: string): void {
	const pNavigationUl = document.querySelector("#p-navigation ul");
	const optionLi = document.createElement("li");
	optionLi.classList.add("showExpansionItem");
	// Access MediaWiki global safely
	const mwGlobal = (window as { mw?: { config: { values: { wgArticlePath: string } } } }).mw;
	const urlBase = mwGlobal?.config?.values?.wgArticlePath?.replace("$1", "") || "";
	optionLi.innerHTML = `<a href="${urlBase}${link}">${title}</a>`;
	pNavigationUl?.insertBefore(optionLi, null);
}

/**
 * Populates the sidebar with navigation links to all Dominion expansions.
 * Creates links for all major expansions from Base Set through Rising Sun plus Promos.
 * Only runs once per page load to avoid duplicates.
 */
export function addExpansionSidebarLinks(): void {
	const pNavigationUl = document.querySelector("#p-navigation ul");
	if (pNavigationUl && !document.querySelector("#expansionSidebarLinks")) {
		const expansionSidebarLinks = document.createElement("span");
		expansionSidebarLinks.id = "expansionSidebarLinks";
		pNavigationUl.insertBefore(expansionSidebarLinks, null);
		for (const [link, title] of EXPANSION_LINKS) {
			addExpansionLink(link, title);
		}
	}
}

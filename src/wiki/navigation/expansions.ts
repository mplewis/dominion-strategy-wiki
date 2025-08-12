import { EXPANSION_LINKS } from "../core/config";
import { getCookie, setCookie } from "../core/cookies";

/**
 * Event handler for the 'Show Expansions' checkbox. Toggles visibility of
 * Dominion expansion links in the sidebar navigation and saves preference to cookie.
 * @returns {void}
 */
export function toggleSidebarExpansions(): void {
  const optionInput = document.querySelector("#showExpansionsChanger") as HTMLInputElement;
  let curVal = 0;
  if (optionInput?.checked) {
    curVal = 1;
  }
  setSidebarExpansions(curVal);
  setCookie("showexpansions", curVal);
}

/**
 * Shows or hides Dominion expansion links in the sidebar based on user preference.
 * Can read setting from cookie if 'cookie' is passed as parameter.
 * @param {string|number} curVal - Display setting: 1 to show, 0 to hide, 'cookie' to read from cookie
 * @returns {void}
 */
export function setSidebarExpansions(curVal: string | number): void {
  let actualVal: number;
  if (curVal === "cookie") {
    const cookieVal = getCookie("showexpansions");
    actualVal = cookieVal === "" ? 1 : Number.parseInt(cookieVal);
  } else {
    actualVal = typeof curVal === "string" ? Number.parseInt(curVal) : curVal;
  }
  const visibility = actualVal === 1 ? "block" : "none";
  const elems = document.querySelectorAll(".showExpansionItem");
  for (let i = 0; i < elems.length; i++) {
    (elems[i] as HTMLElement).style.display = visibility;
  }
}

/**
 * Creates a navigation link for a specific Dominion expansion in the sidebar.
 * Uses MediaWiki's article path configuration to generate proper URLs.
 * @param {string} link - The wiki page name/path for the expansion
 * @param {string} title - Display text for the expansion link
 * @returns {void}
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
 * @returns {void}
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

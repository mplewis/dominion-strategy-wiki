// Card modules
import { initCardPopups } from "../cards/popups";
import { initSorting } from "../cards/sorting";
import { addExpansionSidebarLinks } from "../navigation/expansions";
import { expandAllCardsElements } from "../navigation/sidebar";
import { initSiteOptions, triggerAllSiteOptions } from "./options";

/**
 * Main initialization function that sets up all wiki functionality.
 * Creates user preference checkboxes, initializes card popups, sorting, expansion links,
 * and applies saved user preferences from cookies.
 * @returns Promise that resolves when initialization is complete
 */
export async function initCommon(): Promise<void> {
	initCardPopups();

	await initSiteOptions();
	addExpansionSidebarLinks();
	await triggerAllSiteOptions();

	initSorting();
	expandAllCardsElements();
}

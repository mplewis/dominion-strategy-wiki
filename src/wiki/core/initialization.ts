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
	console.debug(`[initCommon] Starting common initialization`);
	console.debug(`[initCommon] Initializing card popups`);
	initCardPopups();
	console.debug(`[initCommon] Card popups initialized`);

	console.debug(`[initCommon] Initializing site options`);
	await initSiteOptions();
	console.debug(`[initCommon] Site options initialized`);

	console.debug(`[initCommon] Adding expansion sidebar links`);
	addExpansionSidebarLinks();
	console.debug(`[initCommon] Expansion sidebar links added`);

	console.debug(`[initCommon] Triggering all site options`);
	await triggerAllSiteOptions();
	console.debug(`[initCommon] All site options triggered`);

	console.debug(`[initCommon] Initializing sorting`);
	initSorting();
	console.debug(`[initCommon] Sorting initialized`);

	console.debug(`[initCommon] Expanding all cards elements`);
	expandAllCardsElements();
	console.debug(`[initCommon] All cards elements expanded`);

	console.debug(`[initCommon] Common initialization completed`);
}

// Card modules
import { changeBorder, setBlackBorder } from "../cards/borders";
import { setNavboxImages, toggleNavboxImages } from "../cards/images";
import { fixCardPopups } from "../cards/popups";
import { changeCardSortBy, initSorting, setCardSortBy } from "../cards/sorting";

import { addExpansionSidebarLinks, setSidebarExpansions, toggleSidebarExpansions } from "../navigation/expansions";
// Navigation modules
import { addSiteOption } from "../navigation/preferences";
import { clickThings } from "../navigation/sidebar";

/**
 * Main initialization function that sets up all wiki functionality.
 * Creates user preference checkboxes, initializes card popups, sorting, expansion links,
 * and applies saved user preferences from cookies.
 * @returns {void}
 */
export function initCommon(): void {
	console.log("File watcher test - initialization.ts initCommon() called");
	addSiteOption("cardsortby", "cardGallerySorter", "Sort by Cost:", 0, changeCardSortBy, setCardSortBy);
	addSiteOption("cardbordersize", "cardBorderChanger", "Card Border:", 0, changeBorder, setBlackBorder);
	fixCardPopups();
	addSiteOption(
		"hoverinsidecollapsibles",
		"hoverInsideCollapsibles",
		"Navbox Images:",
		0,
		toggleNavboxImages,
		setNavboxImages,
	);
	setNavboxImages("cookie");
	addSiteOption(
		"showexpansions",
		"showExpansionsChanger",
		"Show Expansions:",
		1,
		toggleSidebarExpansions,
		setSidebarExpansions,
	);
	addExpansionSidebarLinks();
	setSidebarExpansions("cookie");
	initSorting();
	setCardSortBy("cookie");
	clickThings();
}

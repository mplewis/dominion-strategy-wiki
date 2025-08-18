import { dominionStrategyStyleSheet } from "../core/stylesheets";

/**
 * Controls visibility of card hover images within collapsible navboxes by
 * managing CSS stylesheets. Can read setting from cookie if 'cookie' is passed.
 * @param curVal true to show images, false to hide
 * @returns {void}
 */
export function applyNavboxImages(show: boolean): void {
	if (show) {
		while (document.adoptedStyleSheets.pop()) {
			// Intentionally empty - just removing stylesheets
		}
	} else if (dominionStrategyStyleSheet) {
		document.adoptedStyleSheets.push(dominionStrategyStyleSheet);
	}
}

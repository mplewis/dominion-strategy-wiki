import { dominionStrategyStyleSheet } from "../core/stylesheets";

/**
 * Controls visibility of card hover images within collapsible navboxes by
 * managing CSS stylesheets. Can read setting from cookie if 'cookie' is passed.
 * @param curVal true to show images, false to hide
 * @returns {void}
 */
export function applyNavboxImages(show: boolean): void {
	console.debug(`[applyNavboxImages] Setting navbox images visibility to: ${show}`);
	console.debug(`[applyNavboxImages] Current adopted stylesheets count: ${document.adoptedStyleSheets.length}`);
	if (show) {
		console.debug(`[applyNavboxImages] Showing images - removing all adopted stylesheets`);
		let removedCount = 0;
		while (document.adoptedStyleSheets.pop()) {
			removedCount++;
			// Intentionally empty - just removing stylesheets
		}
		console.debug(`[applyNavboxImages] Removed ${removedCount} stylesheets`);
	} else if (dominionStrategyStyleSheet) {
		console.debug(`[applyNavboxImages] Hiding images - adding dominion strategy stylesheet`);
		document.adoptedStyleSheets.push(dominionStrategyStyleSheet);
		console.debug(`[applyNavboxImages] Added stylesheet, new count: ${document.adoptedStyleSheets.length}`);
	} else {
		console.debug(`[applyNavboxImages] Could not hide images - dominionStrategyStyleSheet not available`);
	}
}

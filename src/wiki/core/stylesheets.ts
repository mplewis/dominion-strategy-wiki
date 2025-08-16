/**
 * Browser-specific stylesheet initialization for the Dominion Strategy Wiki.
 * This module handles CSS injection safely in both browser and Node.js environments.
 */

// Only initialize stylesheet in browser environment to avoid Node.js test failures
export const dominionStrategyStyleSheet = typeof CSSStyleSheet !== "undefined" ? new CSSStyleSheet() : null;

// Apply CSS rules if we're in a browser environment
if (dominionStrategyStyleSheet) {
	dominionStrategyStyleSheet.replaceSync(
		".mw-collapsible span.card-popup a:hover+span,.mw-collapsible span.card-popup img{display:none;visibility:hidden;opacity:0}",
	);
}

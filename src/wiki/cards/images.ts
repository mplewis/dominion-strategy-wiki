import { getCookie, setCookie } from "../core/cookies";
import { dominionStrategyStyleSheet } from "../core/stylesheets";

/**
 * Event handler for the navbox images checkbox. Toggles whether card images
 * are visible when hovering inside collapsible navboxes and saves preference to cookie.
 * @returns {void}
 */
export function toggleNavboxImages(): void {
	const optionInput = document.querySelector("#hoverInsideCollapsibles");
	let curVal = 0;
	if ((optionInput as HTMLInputElement)?.checked) {
		curVal = 1;
	}
	setNavboxImages(curVal);
	setCookie("hoverinsidecollapsibles", curVal);
}

/**
 * Controls visibility of card hover images within collapsible navboxes by
 * managing CSS stylesheets. Can read setting from cookie if 'cookie' is passed.
 * @param {string|number} curVal - Display setting: 1 to show images, 0 to hide, 'cookie' to read from cookie
 * @returns {void}
 */
export function setNavboxImages(curVal: string | number): void {
	let actualVal: number;
	if (curVal === "cookie") {
		const cookieVal = getCookie("hoverinsidecollapsibles");
		actualVal = cookieVal === "" ? 0 : Number.parseInt(cookieVal);
	} else {
		actualVal = typeof curVal === "string" ? Number.parseInt(curVal) : curVal;
	}
	if (actualVal === 1) {
		while (document.adoptedStyleSheets.pop()) {
			// Intentionally empty - just removing stylesheets
		}
	} else if (dominionStrategyStyleSheet) {
		document.adoptedStyleSheets.push(dominionStrategyStyleSheet);
	}
}

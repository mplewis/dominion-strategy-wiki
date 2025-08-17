import { getCookie } from "../core/cookies";

/**
 * Creates a user preference checkbox option in the sidebar navigation.
 * Adds a checkbox with label that persists state via cookies and calls handlers on change.
 * @param {string} optionCookie - Cookie name to store the option value
 * @param {string} optionId - HTML ID for the checkbox element
 * @param {string} optionText - Display text for the checkbox label
 * @param {number} optionDefault - Default value if no cookie exists
 * @param {Function} optionFunc - Event handler function for checkbox changes
 * @param {Function} optionSetFunc - Function to apply the option setting
 * @returns {void}
 */
export function addSiteOption(
	optionCookie: string,
	optionId: string,
	optionText: string,
	optionDefault: number,
	optionFunc: () => void,
	optionSetFunc: (val: number | string) => void,
): void {
	if (!document.querySelector(`#${optionId}`)) {
		let curVal = getCookie(optionCookie);
		let checked = "";
		if (curVal === "") {
			curVal = optionDefault.toString();
		}
		if (Number.parseInt(curVal) > 0) {
			checked = "checked";
			optionSetFunc(Number.parseInt(curVal));
		}
		const pNavigationUl = document.querySelector("#p-navigation ul");
		const optionLi = document.createElement("li");
		optionLi.innerHTML = `<label for="${optionId}" style="cursor:pointer; user-select:none">${optionText}&nbsp;</label><input style="height:8px" type="checkbox" id="${optionId}" ${checked}>`;
		pNavigationUl?.insertBefore(optionLi, null);
		const optionInput = document.querySelector(`#${optionId}`);
		(optionInput as HTMLInputElement)?.addEventListener("change", optionFunc);
	}
}

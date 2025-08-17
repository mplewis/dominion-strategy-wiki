import { BORDER_SIZE_ENABLED, SIZE_MAPPINGS } from "../core/config";
import { getCookie, setCookie } from "../core/cookies";

/**
 * Calculates the appropriate border padding size based on image width.
 * Maps specific image widths to corresponding border padding values for card styling.
 * @param {number} width - The width of the image in pixels
 * @returns {number} The padding size in pixels, or 0 if width doesn't match predefined sizes
 */
export function getNewSize(width: number): number {
	return SIZE_MAPPINGS[width as keyof typeof SIZE_MAPPINGS] || 0;
}

/**
 * Event handler for the card border checkbox. Toggles black borders around card images
 * and saves the preference as a cookie with a 1-year expiration.
 * @returns {void}
 */
export function changeBorder(): void {
	const optionInput = document.querySelector("#cardBorderChanger");
	let curVal = 0;
	if ((optionInput as HTMLInputElement)?.checked) {
		curVal = BORDER_SIZE_ENABLED;
	}
	setCookie("cardbordersize", curVal);
	setBlackBorder(curVal);
}

/**
 * Applies or removes black borders around all card images on the page.
 * Creates a black border wrapper around eligible images or updates existing borders.
 * @param {number} bSize - Border size setting (0 = no border, >0 = show border)
 * @returns {void}
 */
export function setBlackBorder(bSize: number | string): void {
	const actualBSize = typeof bSize === "string" ? Number.parseInt(bSize) : bSize;
	const elems = document.querySelectorAll("img");
	for (let i = 0; i < elems.length; i++) {
		const elem = elems[i];
		const newSize = getNewSize(elem.offsetWidth);
		if (newSize > 0) {
			const actualSize = actualBSize === 0 ? 0 : newSize;
			if (elem.parentElement?.className !== "cardborderchanger") {
				elem.outerHTML = `<span class="cardborderchanger" style="display:inline-block; padding:${actualSize}px; border-radius:${
					actualSize - 1
				}px; background:black;">${elem.outerHTML}</span>`;
			} else if (elem.parentElement?.className === "cardborderchanger") {
				(elem.parentElement as HTMLElement).style.padding = `${actualSize}px`;
				(elem.parentElement as HTMLElement).style.borderRadius = `${actualSize - 1}px`;
			}
		}
	}
}

/**
 * Initializes black border for a specific card image when it's hovered.
 * Checks cookie setting and applies border if enabled. Used for card popup hover effects.
 * @param {Event} e - The mouse event (typically mouseover)
 * @returns {void}
 */
export function initBlackBorder(e: Event): void {
	const elem = (e.target as Element)?.parentElement?.parentElement?.querySelector("img") as HTMLImageElement;
	const curVal = getCookie("cardbordersize");
	if (Number.parseInt(curVal) > 0 && elem) {
		const newSize = getNewSize(elem.offsetWidth);
		if (newSize > 0) {
			if (elem.parentElement?.className !== "cardborderchanger") {
				elem.outerHTML = `<span class="cardborderchanger" style="display:inline-block; padding:${newSize}px; border-radius:${
					newSize - 1
				}px; background:black;">${elem.outerHTML}</span>`;
			} else if (elem.parentElement?.className === "cardborderchanger") {
				(elem.parentElement as HTMLElement).style.padding = `${newSize}px`;
				(elem.parentElement as HTMLElement).style.borderRadius = `${newSize - 1}px`;
			}
		}
	}
}

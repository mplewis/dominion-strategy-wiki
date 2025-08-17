import { SIZE_MAPPINGS } from "../core/config";
import { getCardBorderEnabled } from "../core/options";

/**
 * Calculates the appropriate border padding size based on image width.
 * Maps specific image widths to corresponding border padding values for card styling.
 * @param {number} width - The width of the image in pixels
 * @returns {number} The padding size in pixels
 */
export function getNewSize(width: number): number {
	for (const { size, padding } of SIZE_MAPPINGS) {
		if (width <= size) return padding;
	}
	return 0;
}

/**
 * Applies or removes black borders around all card images on the page.
 * Creates a black border wrapper around eligible images or updates existing borders.
 * @param {number} bSize - Border size setting (0 = no border, >0 = show border)
 * @returns {void}
 */
export function applyBlackBorder(bSize: number): void {
	console.debug(`[applyBlackBorder] Applying black border with size: ${bSize}`);
	// TODO: We don't really have to go through all images. If we fix this selector, we could just visit the card images.
	const imgs = document.querySelectorAll("img");
	console.debug(`[applyBlackBorder] Found ${imgs.length} images to process`);
	for (let i = 0; i < imgs.length; i++) {
		const elem = imgs[i];
		const newSize = getNewSize(elem.offsetWidth);
		console.debug(`[applyBlackBorder] Image ${i}: width=${elem.offsetWidth}, newSize=${newSize}`);
		if (newSize <= 0) {
			console.debug(`[applyBlackBorder] Skipping image ${i} - newSize <= 0`);
			continue;
		}

		const actualSize = bSize === 0 ? 0 : newSize;
		console.debug(
			`[applyBlackBorder] Image ${i}: actualSize=${actualSize}, parent className=${elem.parentElement?.className}`,
		);
		if (elem.parentElement?.className !== "cardborderchanger") {
			console.debug(`[applyBlackBorder] Creating new cardborderchanger wrapper for image ${i}`);
			elem.outerHTML = `<span class="cardborderchanger" style="display:inline-block; padding:${actualSize}px; border-radius:${
				actualSize - 1
			}px; background:black;">${elem.outerHTML}</span>`;
		} else if (elem.parentElement?.className === "cardborderchanger") {
			console.debug(`[applyBlackBorder] Updating existing cardborderchanger for image ${i}`);
			(elem.parentElement as HTMLElement).style.padding = `${actualSize}px`;
			(elem.parentElement as HTMLElement).style.borderRadius = `${actualSize - 1}px`;
		}
	}
	console.debug(`[applyBlackBorder] Completed processing all images`);
}

/**
 * Initializes black border for a specific card image when it's hovered.
 * Checks cookie setting and applies border if enabled. Used for card popup hover effects.
 * @param {Event} e - The mouse event (typically mouseover)
 * @returns {void}
 */
export async function initBlackBorder(e: Event): Promise<void> {
	const elem = (e.target as Element)?.parentElement?.parentElement?.querySelector("img") as HTMLImageElement;
	if (!elem) return;

	const enabled = await getCardBorderEnabled();
	if (!enabled) return;

	const newSize = getNewSize(elem.offsetWidth);
	if (newSize <= 0) return;

	if (elem.parentElement?.className !== "cardborderchanger") {
		elem.outerHTML = `<span class="cardborderchanger" style="display:inline-block; padding:${newSize}px; border-radius:${
			newSize - 1
		}px; background:black;">${elem.outerHTML}</span>`;
	} else if (elem.parentElement?.className === "cardborderchanger") {
		(elem.parentElement as HTMLElement).style.padding = `${newSize}px`;
		(elem.parentElement as HTMLElement).style.borderRadius = `${newSize - 1}px`;
	}
}

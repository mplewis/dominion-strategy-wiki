import { getCookie, setCookie } from "../core/cookies";

/**
 * Sorts card elements within a container by either name or cost.
 * Extracts card names and cost information from CSS classes, sorts accordingly,
 * and updates the DOM. Also manages visibility of sort toggle buttons.
 * @param {Element} startsort - Container element holding card elements to sort
 * @param {string} sortby - Sort method: 'sortbyname' or 'sortbycost'
 * @param {string} sortid - CSS class identifier for this sortable group
 * @returns {void}
 */
export function sortSortables(startsort: Element, sortby: string, sortid: string): void {
	const cards: [string, Element][] = [];
	let sameCost = true;
	let firstCost: string | undefined;
	const elems = startsort.querySelectorAll(".cardcost");
	for (let i = 0; i < elems.length; i++) {
		let sortstr = elems[i].querySelector("a")?.title || "";
		let isLandscape = false;
		for (let j = 0; j < elems[i].classList.length; j++) {
			const cl = elems[i].classList[j];
			if (cl === "landscape") {
				isLandscape = true;
				continue;
			}
			const re = /^cost(\$)?(\d\d)?([*+])?((\d\d)[Dd])?([Pp])?$/i;
			const found = cl.match(re);
			if (found) {
				if (i === 0) {
					firstCost = cl;
				} else if (cl !== firstCost) {
					sameCost = false;
				}
				if (sortby === "sortbycost") {
					let coststr: string;
					if (found[1] === undefined) {
						coststr = "-----";
					} else {
						coststr = found[2] !== undefined ? found[2] : "00";
						if (found[6] !== undefined) {
							coststr += "PP";
						} else {
							coststr += found[5] !== undefined ? found[5] : "00";
						}
						if (found[3] !== undefined) {
							coststr += found[3];
						} else {
							coststr += " ";
						}
					}
					sortstr = coststr + sortstr;
				}
			}
		}
		cards.push([(isLandscape ? "L" : "C") + sortstr, elems[i]]);
	}
	cards.sort();
	for (let i = 0; i < cards.length; i++) {
		startsort.insertBefore(cards[i][1] as Node, null);
	}
	let switchElems = document.querySelectorAll(`.switchsort.sortbyname.${sortid}`);
	for (let i = 0; i < switchElems.length; i++) {
		if (sameCost) {
			(switchElems[i] as HTMLElement).style.display = "none";
		} else if (sortby === "sortbyname") {
			(switchElems[i] as HTMLElement).classList.add("switchsort-active");
			(switchElems[i] as HTMLElement).style.cursor = "default";
		} else {
			(switchElems[i] as HTMLElement).classList.remove("switchsort-active");
			(switchElems[i] as HTMLElement).style.cursor = "pointer";
		}
	}
	switchElems = document.querySelectorAll(`.switchsort.sortbycost.${sortid}`);
	for (let i = 0; i < switchElems.length; i++) {
		if (sameCost) {
			(switchElems[i] as HTMLElement).style.display = "none";
		} else if (sortby === "sortbycost") {
			(switchElems[i] as HTMLElement).classList.add("switchsort-active");
			(switchElems[i] as HTMLElement).style.cursor = "default";
		} else {
			(switchElems[i] as HTMLElement).classList.remove("switchsort-active");
			(switchElems[i] as HTMLElement).style.cursor = "pointer";
		}
	}
}

/**
 * Event handler for sort toggle buttons. Extracts sorting parameters from
 * the clicked element's CSS classes and triggers sorting for all matching containers.
 * @param {Event} e - Click event from a sort toggle button
 * @returns {void}
 */
export function startSort(e: Event): void {
	let sortby = "";
	let sortid = "";
	for (let i = 0; i < (e.target as Element).classList.length; i++) {
		const re = /^sortby/i;
		const found = (e.target as Element).classList[i].match(re);
		if (found) {
			sortby = (e.target as Element).classList[i];
		}
		const re2 = /^sortid/i;
		const found2 = (e.target as Element).classList[i].match(re2);
		if (found2) {
			sortid = (e.target as Element).classList[i];
		}
	}
	const elems = document.querySelectorAll(`.startsort.${sortid}`);
	for (let i = 0; i < elems.length; i++) {
		sortSortables(elems[i], sortby, sortid);
	}
}

/**
 * Initializes the card sorting system by attaching click handlers to sort buttons
 * and triggering an initial alphabetical sort by clicking all 'sort by name' buttons.
 * @returns {void}
 */
export function initSorting(): void {
	let elems = document.querySelectorAll(".switchsort");
	for (let i = 0; i < elems.length; i++) {
		elems[i].addEventListener("click", startSort);
	}
	elems = document.querySelectorAll(".switchsort.sortbyname");
	for (let i = 0; i < elems.length; i++) {
		(elems[i] as HTMLElement).click();
	}
}

/**
 * Applies card sorting preference by programmatically clicking appropriate sort buttons.
 * Can read setting from cookie if 'cookie' is passed as parameter.
 * @param {string|number} curVal - Sort preference: 0/false for name, 1/true for cost, 'cookie' to read from cookie
 * @returns {void}
 */
export function setCardSortBy(curVal: string | number): void {
	let actualVal: number;
	if (curVal === "cookie") {
		const cookieVal = getCookie("cardsortby");
		actualVal = cookieVal === "" ? 0 : Number.parseInt(cookieVal);
	} else {
		actualVal = typeof curVal === "string" ? Number.parseInt(curVal) : curVal;
	}
	if (actualVal === 1) {
		const elems = document.querySelectorAll(".switchsort.sortbycost");
		for (let i = 0; i < elems.length; i++) {
			(elems[i] as HTMLElement).click();
		}
	} else {
		const elems = document.querySelectorAll(".switchsort.sortbyname");
		for (let i = 0; i < elems.length; i++) {
			(elems[i] as HTMLElement).click();
		}
	}
}

/**
 * Event handler for the card sort preference checkbox. Updates sorting method
 * between alphabetical and cost-based, saves preference to cookie.
 * @returns {void}
 */
export function changeCardSortBy(): void {
	const optionInput = document.querySelector("#cardGallerySorter");
	let curVal = 0;
	if ((optionInput as HTMLInputElement)?.checked) {
		curVal = 1;
	}
	setCookie("cardsortby", curVal);
	setCardSortBy(curVal);
}

import { getCookie, setCookie } from "../core/cookies";
import { type CardCost, compareParsedCosts, parseCostString } from "./cost-parser";

enum SortBy {
	Name = 0,
	Cost = 1,
}
type Sortable = {
	sortbyname: HTMLElement;
	sortbycost: HTMLElement;
	sortbyset: HTMLElement;
	startsort: HTMLElement;
	sortby: SortBy;
	groupsets: boolean;
};
const sortables: { [key: string]: Sortable } = {};

// Dummy card to stand in for cards which are missing data
const ZERO_COST_CARD: CardCost = { coinCost: 0, debtCost: 0, hasPotion: false, modifier: null };

/**
 * Sorts card elements within a container by either name or cost.
 * Extracts card names and cost information from CSS classes, sorts accordingly,
 * and updates the DOM. Also manages visibility of sort toggle buttons.
 * @param {string} sortid - CSS class identifier for this sortable group
 * @returns {void}
 */
export function sortSortables(sortid: string): void {
	// TODO: Replace [0] string with some more descriptive type
	// TODO: Make cards an array of Card[] and parse Cards
	const cards: [string, Element, CardCost | null][] = [];

	// Track if all cards have identical cost CSS classes to determine
	// visibility of "sort by cost" and "sort by name" buttons
	let allCardsHaveSameCost = true;
	// Track if all cards are from the same set to determine
	// visibility of "sort by set" button
	let allCardsHaveSameSet = true;

	// Store first card's cost class to compare against all others
	let firstCost: string | undefined;
	// Store first card's set class to compare against all others
	let firstSet: string | undefined;

	// Parse all cards with costs
	const elems = (sortables[sortid].startsort as Element).querySelectorAll(".cardcost");
	for (let i = 0; i < elems.length; i++) {
		let sortstr = elems[i].querySelector("a")?.title || "";
		const classList = Array.from(elems[i].classList);
		const cardKind = classList.includes("landscape") ? "L" : "C";
		const cost = parseCostString(...classList);

		for (let j = 0; j < classList.length; j++) {
			const cl = classList[j];

			if (parseCostString(cl) !== null) {
				if (i === 0) {
					firstCost = cl;
				} else if (cl !== firstCost) {
					allCardsHaveSameCost = false;
				}
			}

			const reSet = /^set(\d\d)$/i;
			const foundSet = cl.match(reSet);
			if (foundSet) {
				if (i === 0) {
					firstSet = cl;
				} else if (cl !== firstSet) {
					allCardsHaveSameSet = false;
				}
				if (sortables[sortid].groupsets) {
					sortstr = foundSet[1] + sortstr;
				}
			}
		}
		cards.push([cardKind + sortstr, elems[i], cost]);
	}

	if (sortables[sortid].sortby === SortBy.Cost) {
		cards.sort((a, b) => {
			// First compare by set if grouping is enabled
			if (sortables[sortid].groupsets) {
				const setComparison = a[0].localeCompare(b[0]);
				if (setComparison !== 0) return setComparison;
			}

			// Then compare by landscape vs portrait
			const aIsLandscape = a[0].startsWith("L");
			const bIsLandscape = b[0].startsWith("L");
			if (aIsLandscape !== bIsLandscape) {
				return aIsLandscape ? 1 : -1;
			}

			// Then compare by cost using the cost parser
			const costComparison = compareParsedCosts(a[2] || ZERO_COST_CARD, b[2] || ZERO_COST_CARD);
			if (costComparison !== 0) return costComparison;

			// Finally compare by name
			return a[0].localeCompare(b[0]);
		});
	} else {
		cards.sort((a, b) => a[0].localeCompare(b[0]));
	}

	for (let i = 0; i < cards.length; i++) {
		(sortables[sortid].startsort as Element).insertBefore(cards[i][1] as Node, null);
	}
	if (allCardsHaveSameCost) {
		(sortables[sortid].sortbyname as HTMLElement).style.display = "none";
		(sortables[sortid].sortbycost as HTMLElement).style.display = "none";
	} else {
		if (sortables[sortid].sortby === SortBy.Name) {
			(sortables[sortid].sortbyname as HTMLElement).classList.add("switchsort-active");
			(sortables[sortid].sortbyname as HTMLElement).style.cursor = "default";
			(sortables[sortid].sortbycost as HTMLElement).classList.remove("switchsort-active");
			(sortables[sortid].sortbycost as HTMLElement).style.cursor = "pointer";
		} else {
			(sortables[sortid].sortbyname as HTMLElement).classList.remove("switchsort-active");
			(sortables[sortid].sortbyname as HTMLElement).style.cursor = "pointer";
			(sortables[sortid].sortbycost as HTMLElement).classList.add("switchsort-active");
			(sortables[sortid].sortbycost as HTMLElement).style.cursor = "default";
		}
	}
	if (allCardsHaveSameSet) {
		sortables[sortid].sortbyset.style.display = "none";
	} else {
		if (sortables[sortid].groupsets) {
			(sortables[sortid].sortbyset as HTMLElement).classList.add("switchsort-active");
		} else {
			(sortables[sortid].sortbyset as HTMLElement).classList.remove("switchsort-active");
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
	let changed = false;
	if (sortby === "sortbyname") {
		if (sortables[sortid].sortby !== SortBy.Name) {
			sortables[sortid].sortby = SortBy.Name;
			changed = true;
		}
	}
	if (sortby === "sortbycost") {
		if (sortables[sortid].sortby !== SortBy.Cost) {
			sortables[sortid].sortby = SortBy.Cost;
			changed = true;
		}
	}
	if (sortby === "sortbyset") {
		sortables[sortid].groupsets = !sortables[sortid].groupsets;
		changed = true;
	}
	if (changed) {
		sortSortables(sortid);
	}
}

/**
 * Initializes the card sorting system by finding all controls and containers
 * related to each image gallery and saving the necessary information in the
 * sortables object.  It also attaches the click handlers and triggers an
 * initial sorting based on the current cookie value.
 * @returns {void}
 */
export function initSorting(): void {
	const elems = document.querySelectorAll(".startsort");
	for (let i = 0; i < elems.length; i++) {
		let sortid = "";
		for (let j = 0; j < elems[i].classList.length; j++) {
			const re = /^sortid/i;
			const found = elems[i].classList[j].match(re);
			if (found) {
				sortid = elems[i].classList[j];
			}
		}

		if (sortables[sortid] != null) {
			/* If we got here, there are multiple galleries with the same sorting id. */
			continue;
		}

		const cookieVal = getCookie("cardsortby");
		const sortby = cookieVal === "" ? SortBy.Name : Number.parseInt(cookieVal);
		const sortbyname = document.querySelectorAll(`.sortbyname.${sortid}`);
		const sortbycost = document.querySelectorAll(`.sortbycost.${sortid}`);
		const sortbyset = document.querySelectorAll(`.sortbyset.${sortid}`);
		const startsort = document.querySelectorAll(`.startsort.${sortid}`);
		sortables[sortid] = {
			sortbyname: sortbyname[0] as HTMLElement,
			sortbycost: sortbycost[0] as HTMLElement,
			sortbyset: sortbyset[0] as HTMLElement,
			startsort: startsort[0] as HTMLElement,
			sortby: sortby,
			groupsets: false,
		};
		sortbyname[0].addEventListener("click", startSort);
		sortbycost[0].addEventListener("click", startSort);
		sortbyset[0].addEventListener("click", startSort);
		(sortbyset[0] as HTMLElement).style.cursor = "pointer";
	}
	for (const sortid in sortables) {
		sortSortables(sortid);
	}
}

/**
 * Applies card sorting preference by programmatically clicking appropriate sort buttons.
 * @param {string|number} curVal - Sort preference: SortBy.Name for name, SortBy.Cost for cost
 * @returns {void}
 */
export function setCardSortBy(curVal: string | number): void {
	const actualVal = (typeof curVal === "string" ? Number.parseInt(curVal) : curVal) as SortBy;
	for (const sortid in sortables) {
		if (sortables[sortid].sortby !== actualVal) {
			sortables[sortid].sortby = actualVal;
			sortSortables(sortid);
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
	let curVal = SortBy.Name;
	if ((optionInput as HTMLInputElement)?.checked) {
		curVal = SortBy.Cost;
	}
	setCookie("cardsortby", curVal);
	setCardSortBy(curVal);
}

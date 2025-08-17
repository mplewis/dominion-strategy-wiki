import { getCardSortByCost } from "../core/options";
import { type CardCost, compareCardCosts, parseCostString } from "./cost-parser";

/** Sort method for card galleries */
export enum SortBy {
	Name = 0,
	Cost = 1,
}

/** Type of card for sorting purposes */
export enum CardKind {
	Landscape = "L",
	Card = "C",
}

/** Represents a card with its kind, name, set, DOM element, and cost information */
export type Card = {
	kind: CardKind;
	name: string;
	set: string;
	element: Element;
	cost: CardCost;
};

/** Contains all sorting controls and state for a card gallery */
type Sortable = {
	sortbyname: HTMLElement;
	sortbycost: HTMLElement;
	sortbyset: HTMLElement;
	startsort: HTMLElement;
	sortby: SortBy;
	groupsets: boolean;
};

/** Registry of all sortable card galleries on the page, keyed by sort ID */
const galleries: { [key: string]: Sortable } = {};

/** Dummy card to stand in for cards which are missing data */
export const ZERO_COST_CARD: CardCost = { coinCost: 0, debtCost: 0, hasPotion: false, modifier: null };

/**
 * Sorts an array of cards based on the specified sort method and grouping preference.
 * @param {Card[]} cards - Array of cards to sort
 * @param {SortBy} sortBy - Sort method (Name or Cost)
 * @param {boolean} groupSets - Whether to group cards by set
 * @returns {Card[]} New sorted array of cards
 */
export function sortCards(cards: Card[], sortBy: SortBy, groupSets: boolean): Card[] {
	const sortedCards = [...cards];
	sortedCards.sort((a, b) => {
		if (a.kind !== b.kind) {
			return a.kind === CardKind.Landscape ? 1 : -1;
		}

		if (groupSets) {
			const setComparison = a.set.localeCompare(b.set);
			if (setComparison !== 0) return setComparison;
		}

		if (sortBy === SortBy.Cost) {
			const costComparison = compareCardCosts(a.cost || ZERO_COST_CARD, b.cost || ZERO_COST_CARD);
			if (costComparison !== 0) return costComparison;
		}

		return a.name.localeCompare(b.name);
	});
	return sortedCards;
}

/**
 * Sorts card elements within a container by card attributes.
 * Extracts card names and cost information from CSS classes, sorts accordingly,
 * and updates the DOM. Also manages visibility of sort toggle buttons.
 * @param {string} sortid - CSS class identifier for this sortable group
 * @returns {void}
 */
export function sortGalleries(sortid: string): void {
	const cards: Card[] = [];

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
	const elems = (galleries[sortid].startsort as Element).querySelectorAll(".cardcost");
	for (let i = 0; i < elems.length; i++) {
		const sortstr = elems[i].querySelector("a")?.title || "";
		const classList = Array.from(elems[i].classList);
		const cardKind = classList.includes("landscape") ? CardKind.Landscape : CardKind.Card;
		const cost = parseCostString(...classList) || ZERO_COST_CARD;
		let cardSet = "";

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
				cardSet = foundSet[1];
				if (i === 0) {
					firstSet = cl;
				} else if (cl !== firstSet) {
					allCardsHaveSameSet = false;
				}
			}
		}
		cards.push({ kind: cardKind, name: sortstr, set: cardSet, element: elems[i], cost });
	}

	const sortedCards = sortCards(cards, galleries[sortid].sortby, galleries[sortid].groupsets);

	for (let i = 0; i < sortedCards.length; i++) {
		(galleries[sortid].startsort as Element).insertBefore(sortedCards[i].element as Node, null);
	}
	if (allCardsHaveSameCost) {
		(galleries[sortid].sortbyname as HTMLElement).style.display = "none";
		(galleries[sortid].sortbycost as HTMLElement).style.display = "none";
	} else {
		if (galleries[sortid].sortby === SortBy.Name) {
			(galleries[sortid].sortbyname as HTMLElement).classList.add("switchsort-active");
			(galleries[sortid].sortbyname as HTMLElement).style.cursor = "default";
			(galleries[sortid].sortbycost as HTMLElement).classList.remove("switchsort-active");
			(galleries[sortid].sortbycost as HTMLElement).style.cursor = "pointer";
		} else {
			(galleries[sortid].sortbyname as HTMLElement).classList.remove("switchsort-active");
			(galleries[sortid].sortbyname as HTMLElement).style.cursor = "pointer";
			(galleries[sortid].sortbycost as HTMLElement).classList.add("switchsort-active");
			(galleries[sortid].sortbycost as HTMLElement).style.cursor = "default";
		}
	}
	if (allCardsHaveSameSet) {
		galleries[sortid].sortbyset.style.display = "none";
	} else {
		if (galleries[sortid].groupsets) {
			(galleries[sortid].sortbyset as HTMLElement).classList.add("switchsort-active");
		} else {
			(galleries[sortid].sortbyset as HTMLElement).classList.remove("switchsort-active");
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
	/** CSS class indicating which sort button was clicked (e.g., "sortbyname", "sortbycost", "sortbyset") */
	let sortby = "";
	/** CSS class indicating which gallery container this applies to (e.g., "sortid1", "sortid2") */
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
		if (galleries[sortid].sortby !== SortBy.Name) {
			galleries[sortid].sortby = SortBy.Name;
			changed = true;
		}
	}
	if (sortby === "sortbycost") {
		if (galleries[sortid].sortby !== SortBy.Cost) {
			galleries[sortid].sortby = SortBy.Cost;
			changed = true;
		}
	}
	if (sortby === "sortbyset") {
		galleries[sortid].groupsets = !galleries[sortid].groupsets;
		changed = true;
	}
	if (changed) {
		sortGalleries(sortid);
	}
}

/**
 * Initializes the card sorting system by finding all controls and containers
 * related to each image gallery and saving the necessary information in the
 * sortables object.  It also attaches the click handlers and triggers an
 * initial sorting based on the current cookie value.
 * @returns {void}
 */
export async function initSorting(): Promise<void> {
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

		if (galleries[sortid] != null) {
			/* If we got here, there are multiple galleries with the same sorting id. */
			continue;
		}

		const sortByCost = await getCardSortByCost();
		const sortby = sortByCost ? SortBy.Cost : SortBy.Name;
		const sortbyname = document.querySelectorAll(`.sortbyname.${sortid}`);
		const sortbycost = document.querySelectorAll(`.sortbycost.${sortid}`);
		const sortbyset = document.querySelectorAll(`.sortbyset.${sortid}`);
		const startsort = document.querySelectorAll(`.startsort.${sortid}`);
		galleries[sortid] = {
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
	for (const sortid in galleries) {
		sortGalleries(sortid);
	}
}

/**
 * Applies card sorting preference to all galleries.
 * @param curVal - Sort preference: SortBy.Name for name, SortBy.Cost for cost
 * @returns {void}
 */
export function applyCardSortByCost(byCost: boolean): void {
	console.debug(`[applyCardSortByCost] Applying sort by cost: ${byCost}`);
	const sortBy = byCost ? SortBy.Cost : SortBy.Name;
	console.debug(`[applyCardSortByCost] Sort method: ${sortBy === SortBy.Cost ? "Cost" : "Name"}`);
	console.debug(`[applyCardSortByCost] Available galleries:`, Object.keys(galleries));
	for (const sortid in galleries) {
		console.debug(
			`[applyCardSortByCost] Checking gallery ${sortid}: current=${galleries[sortid].sortby}, new=${sortBy}`,
		);
		if (galleries[sortid].sortby !== sortBy) {
			console.debug(`[applyCardSortByCost] Updating gallery ${sortid} sort method`);
			galleries[sortid].sortby = sortBy;
			sortGalleries(sortid);
			console.debug(`[applyCardSortByCost] Completed sorting for gallery ${sortid}`);
		} else {
			console.debug(`[applyCardSortByCost] Gallery ${sortid} already has correct sort method`);
		}
	}
	console.debug(`[applyCardSortByCost] Completed applying sort preference to all galleries`);
}

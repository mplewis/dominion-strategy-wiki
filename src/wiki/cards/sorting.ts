import { getCookie, setCookie } from "../core/cookies";

type Sortable = {
	sortbyname: HTMLElement;
	sortbycost: HTMLElement;
	startsort: HTMLElement;
	sortby: number;
};
const sortables: { [key: string]: Sortable } = {};

/**
 * Sorts card elements within a container by either name or cost.
 * Extracts card names and cost information from CSS classes, sorts accordingly,
 * and updates the DOM. Also manages visibility of sort toggle buttons.
 * @param {Element} startsort - Container element holding card elements to sort
 * @param {string} sortby - Sort method: 'sortbyname' or 'sortbycost'
 * @param {string} sortid - CSS class identifier for this sortable group
 * @returns {void}
 */
export function sortSortables(sortid: string): void {
	const cards: [string, Element][] = [];
	let sameCost = true;
	let firstCost: string | undefined;
	const elems = (sortables[sortid].startsort as Element).querySelectorAll(".cardcost");
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
				if (sortables[sortid].sortby === 1) {
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
		(sortables[sortid].startsort as Element).insertBefore(cards[i][1] as Node, null);
	}
	if (sameCost) {
		(sortables[sortid].sortbyname as HTMLElement).style.display = "none";
		(sortables[sortid].sortbycost as HTMLElement).style.display = "none";
	} else {
		if (sortables[sortid].sortby === 0) {
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
		if (sortables[sortid].sortby !== 0) {
			sortables[sortid].sortby = 0;
			changed = true;
		}
	}
	if (sortby === "sortbycost") {
		if (sortables[sortid].sortby !== 1) {
			sortables[sortid].sortby = 1;
			changed = true;
		}
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
		const sortby = cookieVal === "" ? 0 : Number.parseInt(cookieVal);
		const sortbyname = document.querySelectorAll(`.sortbyname.${sortid}`);
		const sortbycost = document.querySelectorAll(`.sortbycost.${sortid}`);
		const startsort = document.querySelectorAll(`.startsort.${sortid}`);
		sortables[sortid] = {
			sortbyname: sortbyname[0] as HTMLElement,
			sortbycost: sortbycost[0] as HTMLElement,
			startsort: startsort[0] as HTMLElement,
			sortby: sortby,
		};
		sortbyname[0].addEventListener("click", startSort);
		sortbycost[0].addEventListener("click", startSort);
	}
	for (const sortid in sortables) {
		sortSortables(sortid);
	}
}

/**
 * Applies card sorting preference by programmatically clicking appropriate sort buttons.
 * @param {string|number} curVal - Sort preference: 0/false for name, 1/true for cost
 * @returns {void}
 */
export function setCardSortBy(curVal: string | number): void {
	const actualVal = typeof curVal === "string" ? Number.parseInt(curVal) : curVal;
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
	let curVal = 0;
	if ((optionInput as HTMLInputElement)?.checked) {
		curVal = 1;
	}
	setCookie("cardsortby", curVal);
	setCardSortBy(curVal);
}

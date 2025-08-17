/** Represents parsed cost information from a Dominion card cost CSS class */
export type CardCost = {
	coinCost: number | null;
	debtCost: number;
	hasPotion: boolean;
	modifier: "*" | "+" | null;
};

/**
 * Compares two CardCost objects for sorting purposes.
 * Returns negative value if a should come before b, positive if b should come before a, 0 if equal.
 * @param {CardCost} a - First cost to compare
 * @param {CardCost} b - Second cost to compare
 * @returns {number} Comparison result (-1, 0, or 1)
 */
export function compareCardCosts(a: CardCost, b: CardCost): number {
	if (a.coinCost !== b.coinCost) {
		// Costless cards are sorted before zero-cost cards
		if (a.coinCost === null) return -1;
		if (b.coinCost === null) return 1;
		return a.coinCost - b.coinCost;
	}

	if (a.hasPotion !== b.hasPotion) {
		return a.hasPotion ? 1 : -1;
	}

	if (a.debtCost !== b.debtCost) {
		return a.debtCost - b.debtCost;
	}

	if (a.modifier !== b.modifier) {
		if (!a.modifier && !b.modifier) return 0;
		if (!a.modifier) return -1;
		if (!b.modifier) return 1;
		return a.modifier.localeCompare(b.modifier);
	}

	return 0;
}

/**
 * Parses cost information from CSS class names using Dominion cost pattern.
 * Takes multiple strings and returns structured cost data for the first one that matches
 * the cost pattern, or null if none match.
 *
 * @param {...string} strings - CSS class names to check for cost patterns
 * @returns {CardCost | null} Parsed cost data or null if no cost pattern found
 */
export function parseCostString(...strings: string[]): CardCost | null {
	const reCost = /^cost(\$)?(\d\d)?([*+])?((\d\d)[Dd])?([Pp])?$/i;

	for (const str of strings) {
		const foundCost = str.match(reCost);
		if (foundCost) {
			const hasDollarSign = Boolean(foundCost[1]);
			const coinCost = (() => {
				if (!hasDollarSign) return null;
				if (foundCost[2]) return Number.parseInt(foundCost[2]);
				return 0;
			})();
			const debtCost = foundCost[5] ? Number.parseInt(foundCost[5]) : 0;
			const hasPotion = foundCost[6] !== undefined;
			const modifier = (foundCost[3] as "*" | "+" | undefined) ?? null;
			return { coinCost, debtCost, hasPotion, modifier };
		}
	}

	return null;
}

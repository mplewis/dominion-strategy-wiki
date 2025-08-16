/**
 * Represents parsed cost information from a Dominion card cost CSS class
 */
export type CardCost = {
	coinCost: number;
	debtCost: number;
	hasPotion: boolean;
	modifier: "*" | "+" | null;
};

/**
 * Compares two ParsedCost objects for sorting purposes.
 * Returns negative value if a should come before b, positive if b should come before a, 0 if equal.
 * @param {CardCost} a - First cost to compare
 * @param {CardCost} b - Second cost to compare
 * @returns {number} Comparison result (-1, 0, or 1)
 */
export function compareParsedCosts(a: CardCost, b: CardCost): number {
	if (a.coinCost !== b.coinCost) {
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
			const coinCost = foundCost[2] ? Number.parseInt(foundCost[2]) : 0;
			const debtCost = foundCost[5] ? Number.parseInt(foundCost[5]) : 0;
			const hasPotion = foundCost[6] !== undefined;
			const modifier = (foundCost[3] as "*" | "+" | undefined) ?? null;
			return { coinCost, debtCost, hasPotion, modifier };
		}
	}

	return null;
}

import { describe, expect, it } from "vitest";
import { parseCostString } from "./cost-parser.js";
import { type Card, CardKind, SortBy, sortCards, ZERO_COST_CARD } from "./sorting.js";

// Helper function to create mock cards
function card(name: string, kind: CardKind = CardKind.Card, set: string = "", costClass?: string): Card {
	const cost = costClass ? (parseCostString(costClass) ?? ZERO_COST_CARD) : ZERO_COST_CARD;
	const element = {} as Element; // Mock element since we don't use it in sorting logic
	return { kind, name, set, cost, element };
}

describe("sortCards", () => {
	it("sorts cards by cost then name", () => {
		const cards = [
			card("Witch", CardKind.Card, "01", "cost$05"),
			card("Adventurer", CardKind.Card, "01", "cost$06"),
			card("Bridge", CardKind.Card, "01", "cost$04"),
			card("Bandit", CardKind.Card, "01", "cost$05"),
		];

		const sorted = sortCards(cards, SortBy.Cost, false);
		expect(sorted.map((c) => c.name)).toEqual([
			"Bridge", // 4 cost
			"Bandit", // 5 cost (alphabetically first)
			"Witch", // 5 cost (alphabetically second)
			"Adventurer", // 6 cost
		]);
	});

	it("sorts landscape cards after portrait cards", () => {
		const cards = [
			card("Landscape", CardKind.Landscape, "01", "cost$04"),
			card("Portrait", CardKind.Card, "01", "cost$04"),
		];

		const sorted = sortCards(cards, SortBy.Cost, false);
		expect(sorted.map((c) => c.name)).toEqual(["Portrait", "Landscape"]);
	});

	it("handles cards with null costs", () => {
		const cards = [card("NoCost", CardKind.Card), card("WithCost", CardKind.Card, "01", "cost$03")];

		const sorted = sortCards(cards, SortBy.Cost, false);
		expect(sorted.map((c) => c.name)).toEqual([
			"NoCost", // Null cost treated as zero cost
			"WithCost", // 3 cost
		]);
	});

	it("groups by set when groupSets is true", () => {
		const cards = [
			card("Masquerade", CardKind.Card, "02", "cost$03"),
			card("Artisan", CardKind.Card, "01", "cost$06"),
			card("Bridge", CardKind.Card, "02", "cost$04"),
		];

		const sorted = sortCards(cards, SortBy.Cost, true);
		expect(sorted.map((c) => c.name)).toEqual([
			"Artisan", // Set 01
			"Masquerade", // Set 02, lower cost
			"Bridge", // Set 02, higher cost
		]);
	});

	it("ignores set grouping when groupSets is false", () => {
		const cards = [
			card("Shanty Town", CardKind.Card, "02", "cost$03"),
			card("Bureaucrat", CardKind.Card, "01", "cost$04"),
			card("Duke", CardKind.Card, "02", "cost$05"),
		];

		const sorted = sortCards(cards, SortBy.Cost, false);
		expect(sorted.map((c) => c.name)).toEqual([
			"Shanty Town", // 3 cost
			"Bureaucrat", // 4 cost
			"Duke", // 5 cost
		]);
	});
});

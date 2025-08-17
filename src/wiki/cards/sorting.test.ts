import { describe, expect, it } from "vitest";
import { parseCostString } from "./cost-parser.js";
import { type Card, CardKind, SortBy, sortCards, ZERO_COST_CARD } from "./sorting.js";

// Helper function to create mock cards
function card(name: string, kind: CardKind = CardKind.Card, set: string = "", costClass?: string): Card {
	const cost = costClass ? (parseCostString(costClass) ?? ZERO_COST_CARD) : ZERO_COST_CARD;
	const element = {} as Element; // Mock element since we don't use it in sorting logic
	return { kind, name, set, cost, element };
}

const CARD_LIBRARY = [
	// Base Set
	card("Village", CardKind.Card, "01", "cost$03"),
	card("Smithy", CardKind.Card, "01", "cost$04"),
	card("Witch", CardKind.Card, "01", "cost$05"),
	card("Artisan", CardKind.Card, "01", "cost$06"),

	// Empires
	card("Catapult", CardKind.Card, "02", "cost$03"),
	card("Temple", CardKind.Card, "02", "cost$04"),
	card("Archive", CardKind.Card, "02", "cost$05"),
	card("Arena", CardKind.Landscape, "02", "cost"),
	card("Delve", CardKind.Landscape, "02", "cost$02"),
	card("Ritual", CardKind.Landscape, "02", "cost$04"),

	// Rising Sun
	card("Aristocrat", CardKind.Card, "03", "cost$03"),
	card("Alley", CardKind.Card, "03", "cost$04"),
	card("Gold Mine", CardKind.Card, "03", "cost$05"),
	card("Samurai", CardKind.Card, "03", "cost$06"),
	card("Panic", CardKind.Landscape, "03", "cost"),
	card("Amass", CardKind.Landscape, "03", "cost$02"),
	card("Sea Trade", CardKind.Landscape, "03", "cost$04"),
];

describe("sortCards", () => {
	describe("when not sorting by set", () => {
		const bySet = false;

		describe("when sorting by name", () => {
			const sortBy = SortBy.Name;

			it("sorts cards as expected", () => {
				const sorted = sortCards(CARD_LIBRARY, sortBy, bySet);
				expect(sorted.map((c) => c.name)).toEqual([
					// Cards
					"Alley",
					"Archive",
					"Aristocrat",
					"Artisan",
					"Catapult",
					"Gold Mine",
					"Samurai",
					"Smithy",
					"Temple",
					"Village",
					"Witch",
					// Landscapes
					"Amass",
					"Arena",
					"Delve",
					"Panic",
					"Ritual",
					"Sea Trade",
				]);
			});
		});

		describe("when sorting by cost", () => {
			const sortBy = SortBy.Cost;

			it("sorts cards as expected", () => {
				const sorted = sortCards(CARD_LIBRARY, sortBy, bySet);
				expect(sorted.map((c) => c.name)).toEqual([
					// Cards
					// 3 cost
					"Aristocrat",
					"Catapult",
					"Village",
					// 4 cost
					"Alley",
					"Smithy",
					"Temple",
					// 5 cost
					"Archive",
					"Gold Mine",
					"Witch",
					// 6 cost
					"Artisan",
					"Samurai",

					// Landscapes
					// 0 cost
					"Arena",
					"Panic",
					// 2 cost
					"Amass",
					"Delve",
					// 4 cost
					"Ritual",
					"Sea Trade",
				]);
			});
		});
	});

	describe("when sorting by set", () => {
		const bySet = true;

		describe("when sorting by name", () => {
			const sortBy = SortBy.Name;

			it("sorts cards as expected", () => {
				const sorted = sortCards(CARD_LIBRARY, sortBy, bySet);
				expect(sorted.map((c) => c.name)).toEqual([
					// Cards
					// Base
					"Artisan",
					"Smithy",
					"Village",
					"Witch",
					// Empires
					"Archive",
					"Catapult",
					"Temple",
					// Rising Sun
					"Alley",
					"Aristocrat",
					"Gold Mine",
					"Samurai",

					// Landscapes
					// Empires
					"Arena",
					"Delve",
					"Ritual",
					// Rising Sun
					"Amass",
					"Panic",
					"Sea Trade",
				]);
			});
		});

		describe("when sorting by cost", () => {
			const sortBy = SortBy.Cost;

			it("sorts cards as expected", () => {
				const sorted = sortCards(CARD_LIBRARY, sortBy, bySet);
				expect(sorted.map((c) => c.name)).toEqual([
					// Cards
					// Base
					// 3 cost
					"Village",
					// 4 cost
					"Smithy",
					// 5 cost
					"Witch",
					// 6 cost
					"Artisan",

					// Empires
					// 3 cost
					"Catapult",
					// 4 cost
					"Temple",
					// 5 cost
					"Archive",

					// Rising Sun
					// 3 cost
					"Aristocrat",
					// 4 cost
					"Alley",
					// 5 cost
					"Gold Mine",
					// 6 cost
					"Samurai",

					// Landscapes
					// Empires
					// 0 cost
					"Arena",
					// 2 cost
					"Delve",
					// 4 cost
					"Ritual",
					// Rising Sun
					// 0 cost
					"Panic",
					// 2 cost
					"Amass",
					// 4 cost
					"Sea Trade",
				]);
			});
		});
	});
});

describe("sortCards (legacy tests)", () => {
	describe("when sorting by name", () => {
		it("sorts landscapes after cards", () => {
			const cards = [
				card("Way of the Butterfly", CardKind.Landscape),
				card("Artisan", CardKind.Card),
				card("Druid's Blessing", CardKind.Landscape),
				card("Chapel", CardKind.Card),
			];

			const sorted = sortCards(cards, SortBy.Name, false);
			expect(sorted.map((c) => c.name)).toEqual([
				"Artisan", // Card, alphabetically first
				"Chapel", // Card, alphabetically second
				"Druid's Blessing", // Landscape, alphabetically first
				"Way of the Butterfly", // Landscape, alphabetically second
			]);
		});
	});

	describe("when sorting by cost", () => {
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

		it("sorts landscapes after cards with mixed card types", () => {
			const cards = [
				card("Expensive Landscape", CardKind.Landscape, "01", "cost$06"),
				card("Cheap Card", CardKind.Card, "01", "cost$02"),
				card("Medium Landscape", CardKind.Landscape, "01", "cost$04"),
				card("Expensive Card", CardKind.Card, "01", "cost$06"),
			];

			const sorted = sortCards(cards, SortBy.Cost, false);
			expect(sorted.map((c) => c.name)).toEqual([
				"Cheap Card", // 2 cost card
				"Expensive Card", // 6 cost card (comes before landscapes of same cost)
				"Medium Landscape", // 4 cost landscape
				"Expensive Landscape", // 6 cost landscape
			]);
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

		it("maintains landscape after card ordering when grouping by set", () => {
			const cards = [
				card("Set1 Card", CardKind.Card, "01", "cost$03"),
				card("Set2 Card", CardKind.Card, "02", "cost$03"),
				card("Set1 Landscape", CardKind.Landscape, "01", "cost$03"),
				card("Set2 Landscape", CardKind.Landscape, "02", "cost$03"),
			];

			const sorted = sortCards(cards, SortBy.Cost, true);
			expect(sorted.map((c) => c.name)).toEqual([
				"Set1 Card", // Set 01, card
				"Set2 Card", // Set 02, card
				"Set1 Landscape", // Set 01, landscape
				"Set2 Landscape", // Set 02, landscape
			]);
		});
	});
});

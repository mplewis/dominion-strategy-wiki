import { describe, expect, it } from "vitest";
import { compareParsedCosts, parseCostString } from "./cost-parser.js";

// Scraped from all expansion pages on the wiki on 2025-08-16
const WIKI_COST_CLASSES = [
	"cost",
	"cost$00",
	"cost$00*",
	"cost$0004D",
	"cost$0005D",
	"cost$0006D",
	"cost$0008D",
	"cost$00P",
	"cost$01",
	"cost$02",
	"cost$02*",
	"cost$02+",
	"cost$02P",
	"cost$03",
	"cost$03*",
	"cost$03+",
	"cost$03P",
	"cost$04",
	"cost$04*",
	"cost$04+",
	"cost$0403D",
	"cost$04P",
	"cost$05",
	"cost$05*",
	"cost$06",
	"cost$06*",
	"cost$06P",
	"cost$07",
	"cost$07*",
	"cost$08",
	"cost$08*",
	"cost$0808D",
	"cost$09",
	"cost$10",
	"cost$11",
	"cost$14",
];

describe("parseCostString", () => {
	describe("multiple string inputs", () => {
		it("returns first matching cost class", () => {
			const result = parseCostString("landscape", "cost$05", "cost$03", "set09");
			expect(result?.coinCost).toBe(5);
		});

		it("returns null if no cost classes found", () => {
			const result = parseCostString("landscape", "cardname", "set09");
			expect(result).toBeNull();
		});
	});

	it.each([
		{
			desc: "simple coin costs",
			input: "cost$05",
			expected: { coinCost: 5, debtCost: 0, hasPotion: false, modifier: null },
		},
		{
			desc: "potion costs",
			input: "cost$03P",
			expected: { coinCost: 3, debtCost: 0, hasPotion: true, modifier: null },
		},
		{
			desc: "variable costs with +",
			input: "cost$02+",
			expected: { coinCost: 2, debtCost: 0, hasPotion: false, modifier: "+" },
		},
		{
			desc: "variable costs with *",
			input: "cost$06*",
			expected: { coinCost: 6, debtCost: 0, hasPotion: false, modifier: "*" },
		},
		{
			desc: "debt costs",
			input: "cost$0008D",
			expected: { coinCost: 0, debtCost: 8, hasPotion: false, modifier: null },
		},
		{
			desc: "coin + debt costs",
			input: "cost$0403D",
			expected: { coinCost: 4, debtCost: 3, hasPotion: false, modifier: null },
		},
		{
			desc: "cost with no coin amount",
			input: "cost",
			expected: { coinCost: null, debtCost: 0, hasPotion: false, modifier: null },
		},
		{
			desc: "zero cost",
			input: "cost$00",
			expected: { coinCost: 0, debtCost: 0, hasPotion: false, modifier: null },
		},
	])("parses $desc", ({ input, expected }) => {
		const result = parseCostString(input);
		expect(result).toEqual(expected);
	});

	it("parses all cost classes from the wiki", () => {
		WIKI_COST_CLASSES.forEach((costClass) => {
			const result = parseCostString(costClass);
			expect(result).toHaveProperty("coinCost");
			expect(result).toHaveProperty("debtCost");
			expect(result).toHaveProperty("hasPotion");
			expect(result).toHaveProperty("modifier");
		});
	});
});

describe("compareParsedCosts", () => {
	it.each([
		{ costA: "cost$04", costB: "cost$05", desc: "sorts simple coin costs numerically" },
		{ costA: "cost$03", costB: "cost$03P", desc: "sorts potion costs after regular costs" },
		{ costA: "cost$02", costB: "cost$02+", desc: "sorts variable costs with + after fixed costs" },
		{ costA: "cost$06*", costB: "cost$06+", desc: "sorts variable costs with * before +" },
		{ costA: "cost$00", costB: "cost$0008D", desc: "sorts debt costs after zero coin cost" },
		{ costA: "cost$04", costB: "cost$0403D", desc: "sorts mixed coin+debt after regular coin cost" },
	])("$desc", ({ costA, costB }) => {
		const parsedA = parseCostString(costA);
		const parsedB = parseCostString(costB);
		expect(parsedA && parsedB && compareParsedCosts(parsedA, parsedB) < 0).toBe(true);
	});

	it("sorts entire list of parsed cost classes correctly", () => {
		const parsedCosts = WIKI_COST_CLASSES.map((costClass) => ({
			original: costClass,
			parsed: parseCostString(costClass),
		})).filter((item) => item.parsed !== null);

		const sortedCosts = parsedCosts.sort((a, b) => {
			if (!a.parsed || !b.parsed) throw new Error("failed to parse cost class");
			return compareParsedCosts(a.parsed, b.parsed);
		});

		const sortedOriginals = sortedCosts.map((item) => item.original);
		expect(sortedOriginals).toEqual([
			"cost",
			"cost$00",
			"cost$00*",
			"cost$0004D",
			"cost$0005D",
			"cost$0006D",
			"cost$0008D",
			"cost$00P",
			"cost$01",
			"cost$02",
			"cost$02*",
			"cost$02+",
			"cost$02P",
			"cost$03",
			"cost$03*",
			"cost$03+",
			"cost$03P",
			"cost$04",
			"cost$04*",
			"cost$04+",
			"cost$0403D",
			"cost$04P",
			"cost$05",
			"cost$05*",
			"cost$06",
			"cost$06*",
			"cost$06P",
			"cost$07",
			"cost$07*",
			"cost$08",
			"cost$08*",
			"cost$0808D",
			"cost$09",
			"cost$10",
			"cost$11",
			"cost$14",
		]);
	});
});

// Constants for card border functionality
export const BORDER_SIZE_ENABLED = 11;
export const COOKIE_EXPIRATION_YEARS = 1;

// Maps image width (px) to appropriate border padding size (px) for card styling
export const SIZE_MAPPINGS = {
  75: 4,
  100: 5,
  120: 6,
  150: 8,
  160: 9,
  200: 11,
  320: 11,
  375: 21,
  800: 21,
} as const;

// Map of expansion links with their display names
export const EXPANSION_LINKS = new Map([
  ["Dominion (Base Set)", "Dominion"],
  ["Intrigue", "Intrigue"],
  ["Seaside", "Seaside"],
  ["Alchemy", "Alchemy"],
  ["Prosperity", "Prosperity"],
  ["Cornucopia & Guilds", "Cornucopia & Guilds"],
  ["Hinterlands", "Hinterlands"],
  ["Dark Ages", "Dark Ages"],
  ["Adventures", "Adventures"],
  ["Empires", "Empires"],
  ["Nocturne", "Nocturne"],
  ["Renaissance", "Renaissance"],
  ["Menagerie (expansion)", "Menagerie"],
  ["Allies", "Allies"],
  ["Plunder (expansion)", "Plunder"],
  ["Rising Sun", "Rising Sun"],
  ["Promo", "Promos"],
]);

// CSS stylesheet for navbox image control

export const dominionStrategyStyleSheet = new CSSStyleSheet();
dominionStrategyStyleSheet.replaceSync(
  ".mw-collapsible span.card-popup a:hover+span,.mw-collapsible span.card-popup img{display:none;visibility:hidden;opacity:0}"
);

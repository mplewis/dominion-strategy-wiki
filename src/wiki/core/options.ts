import { applyBlackBorder } from "../cards/borders";
import { applyNavboxImages } from "../cards/images";
import { applyCardSortByCost } from "../cards/sorting";
import { applySidebarExpansions } from "../navigation/expansions";
import { CARD_BORDER_PX, COOKIE_EXPIRATION_YEARS } from "./config";

/** Registry entry for a site option */
interface SiteOption {
	readonly key: string;
	readonly displayText: string;
	readonly defaultValue: boolean;
	readonly changeHandler: (value: boolean) => void;
	getValue: () => Promise<boolean>;
	setValue: (value: boolean) => Promise<void>;
}

/** Internal registry of all created site options */
const allSiteOptions: SiteOption[] = [];

/** Generate the key used to store cookie data for an option */
const cookieKey = (key: string) => `option_${key}`;

/** Generate the HTML ID used for the checkbox for an option */
const htmlIdFromKey = (key: string) => `option_${key}`;

/**
 * Retrieve the value of a specified cookie using the CookieStore API with fallback.
 * @param name - The name of the cookie to retrieve
 * @returns Promise that resolves to the cookie value, or null if not found
 */
async function getCookie(name: string): Promise<string | null> {
	const cookie = await cookieStore.get(name);
	return cookie?.value ?? null;
}

/**
 * Set a cookie with the specified name and value using the CookieStore API with fallback.
 * @param name - The name of the cookie
 * @param value - The value to store
 * @returns Promise that resolves when the cookie is set
 */
async function setCookie(name: string, value: string | number): Promise<void> {
	const cookieDate = new Date();
	cookieDate.setFullYear(cookieDate.getFullYear() + COOKIE_EXPIRATION_YEARS);
	await cookieStore.set({ name, value: String(value), expires: cookieDate.getTime(), sameSite: "strict" });
	return;
}

/**
 * Create a site option with getter/setter pair.
 * @param key - The key to use to determine which cookie key should store the value
 * @param displayText - Text for the sidebar checkbox
 * @param defaultValue - Default value if cookie is not set
 * @param changeHandler - Called when value is loaded or changed
 * @returns [getter, setter] tuple
 */
export function createSiteOption(
	key: string,
	displayText: string,
	defaultValue: boolean,
	changeHandler: (value: boolean) => void,
): [() => Promise<boolean>, (value: boolean) => Promise<void>] {
	const option = {
		key,
		displayText,
		defaultValue,
		changeHandler,
		async getValue() {
			const cookieValue = await getCookie(cookieKey(key));
			if (!cookieValue) return defaultValue;
			return Number.parseInt(cookieValue) > 0;
		},
		async setValue(value: boolean) {
			await setCookie(cookieKey(key), value ? 1 : 0);
			changeHandler(value);
		},
	};
	allSiteOptions.push(option);
	return [option.getValue, option.setValue];
}

/** Initialize a single site option by creating its UI and loading saved values */
async function initSiteOption(option: SiteOption) {
	if (document.querySelector(`#${htmlIdFromKey(option.key)}`)) return;
	const currentValue = await option.getValue();

	// Render checkbox
	const htmlId = htmlIdFromKey(option.key);
	const checked = currentValue ? "checked" : "";
	const pNavigationUl = document.querySelector("#p-navigation ul");
	const optionLi = document.createElement("li");
	optionLi.innerHTML = `<label for="${htmlId}" style="cursor:pointer; user-select:none">${option.displayText}&nbsp;</label><input style="height:8px" type="checkbox" id="${htmlId}" ${checked}>`;
	pNavigationUl?.insertBefore(optionLi, null);

	// Attach event handler
	const optionInput = document.querySelector(`#${htmlIdFromKey(option.key)}`) as HTMLInputElement;
	optionInput?.addEventListener("change", async () => {
		await option.setValue(optionInput.checked);
	});
}

/** Initialize all registered site options */
export async function initSiteOptions() {
	for (const option of allSiteOptions) {
		await initSiteOption(option);
	}
}

/** Trigger change handlers for the current values of all site options */
export async function triggerAllSiteOptions() {
	for (const option of allSiteOptions) {
		const value = await option.getValue();
		option.changeHandler(value);
	}
}

/** Sort by name or cost */
export const [getCardSortByCost, setCardSortByCost] = createSiteOption(
	"cardSortByCost",
	"Sort by Cost",
	false,
	(value: boolean) => {
		applyCardSortByCost(value);
	},
);

/** Toggle card borders */
export const [getCardBorderEnabled, setCardBorderEnabled] = createSiteOption(
	"cardBorder",
	"Card Border",
	false,
	(value: boolean) => {
		applyBlackBorder(value ? CARD_BORDER_PX : 0);
	},
);

/** Toggle on-hover images in navigation boxes */
export const [getOnHoverNavboxImagesEnabled, setOnHoverNavboxImagesEnabled] = createSiteOption(
	"navboxOnHoverImages",
	"Navbox On-Hover Images",
	false,
	(value: boolean) => {
		applyNavboxImages(value);
	},
);

/** Toggle expansion links in sidebar */
export const [getShowExpansions, setShowExpansions] = createSiteOption(
	"showExpansions",
	"Show Expansions",
	true,
	(value: boolean) => {
		applySidebarExpansions(value);
	},
);

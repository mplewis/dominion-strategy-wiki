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
	console.debug(`[getCookie] Getting cookie: ${name}`);
	const cookie = await cookieStore.get(name);
	console.debug(`[getCookie] Cookie result for ${name}:`, cookie);
	const result = cookie?.value ?? null;
	console.debug(`[getCookie] Returning value for ${name}:`, result);
	return result;
}

/**
 * Set a cookie with the specified name and value using the CookieStore API with fallback.
 * @param name - The name of the cookie
 * @param value - The value to store
 * @returns Promise that resolves when the cookie is set
 */
async function setCookie(name: string, value: string | number): Promise<void> {
	console.debug(`[setCookie] Setting cookie ${name} to:`, value);
	const cookieDate = new Date();
	cookieDate.setFullYear(cookieDate.getFullYear() + COOKIE_EXPIRATION_YEARS);
	console.debug(`[setCookie] Cookie expiration date:`, cookieDate);
	await cookieStore.set({ name, value: String(value), expires: cookieDate.getTime(), sameSite: "strict" });
	console.debug(`[setCookie] Cookie ${name} set successfully`);
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
			console.debug(`[SiteOption.getValue] Getting value for key: ${key}`);
			const cookieValue = await getCookie(cookieKey(key));
			console.debug(`[SiteOption.getValue] Cookie value for ${key}:`, cookieValue);
			if (!cookieValue) {
				console.debug(`[SiteOption.getValue] No cookie found, returning default:`, defaultValue);
				return defaultValue;
			}
			const result = Number.parseInt(cookieValue) > 0;
			console.debug(`[SiteOption.getValue] Parsed result for ${key}:`, result);
			return result;
		},
		async setValue(value: boolean) {
			console.debug(`[SiteOption.setValue] Setting value for ${key} to:`, value);
			await setCookie(cookieKey(key), value ? 1 : 0);
			console.debug(`[SiteOption.setValue] Calling change handler for ${key} with:`, value);
			changeHandler(value);
			console.debug(`[SiteOption.setValue] Change handler completed for ${key}`);
		},
	};
	allSiteOptions.push(option);
	return [option.getValue, option.setValue];
}

/** Initialize a single site option by creating its UI and loading saved values */
async function initSiteOption(option: SiteOption) {
	console.debug(`[initSiteOption] Initializing site option: ${option.key}`);
	const existingElement = document.querySelector(`#${htmlIdFromKey(option.key)}`);
	if (existingElement) {
		console.debug(`[initSiteOption] Element already exists for ${option.key}, skipping`);
		return;
	}
	const currentValue = await option.getValue();
	console.debug(`[initSiteOption] Current value for ${option.key}:`, currentValue);

	// Render checkbox
	const htmlId = htmlIdFromKey(option.key);
	const checked = currentValue ? "checked" : "";
	console.debug(`[initSiteOption] HTML ID: ${htmlId}, checked state: ${checked}`);
	const pNavigationUl = document.querySelector("#p-navigation ul");
	console.debug(`[initSiteOption] Navigation UL element:`, pNavigationUl);
	const optionLi = document.createElement("li");
	optionLi.innerHTML = `<label for="${htmlId}" style="cursor:pointer; user-select:none">${option.displayText}&nbsp;</label><input style="height:8px" type="checkbox" id="${htmlId}" ${checked}>`;
	console.debug(`[initSiteOption] Created LI element with HTML:`, optionLi.innerHTML);
	pNavigationUl?.insertBefore(optionLi, null);
	console.debug(`[initSiteOption] Inserted option into navigation for ${option.key}`);

	// Attach event handler
	const optionInput = document.querySelector(`#${htmlIdFromKey(option.key)}`) as HTMLInputElement;
	console.debug(`[initSiteOption] Found input element for ${option.key}:`, optionInput);
	optionInput?.addEventListener("change", async () => {
		console.debug(`[initSiteOption] Change event triggered for ${option.key}, new value:`, optionInput.checked);
		await option.setValue(optionInput.checked);
	});
	console.debug(`[initSiteOption] Event listener attached for ${option.key}`);
}

/** Initialize all registered site options */
export async function initSiteOptions() {
	console.debug(`[initSiteOptions] Starting initialization of ${allSiteOptions.length} site options`);
	console.debug(
		`[initSiteOptions] All site options:`,
		allSiteOptions.map((o) => o.key),
	);
	for (const option of allSiteOptions) {
		console.debug(`[initSiteOptions] Initializing option: ${option.key}`);
		await initSiteOption(option);
		console.debug(`[initSiteOptions] Completed initialization of: ${option.key}`);
	}
	console.debug(`[initSiteOptions] All site options initialized`);
}

/** Trigger change handlers for the current values of all site options */
export async function triggerAllSiteOptions() {
	console.debug(`[triggerAllSiteOptions] Triggering ${allSiteOptions.length} site options`);
	console.debug(
		`[triggerAllSiteOptions] Options to trigger:`,
		allSiteOptions.map((o) => o.key),
	);
	for (const option of allSiteOptions) {
		console.debug(`[triggerAllSiteOptions] Triggering option: ${option.key}`);
		const value = await option.getValue();
		console.debug(`[triggerAllSiteOptions] Got value for ${option.key}:`, value);
		console.debug(`[triggerAllSiteOptions] Calling change handler for ${option.key}`);
		option.changeHandler(value);
		console.debug(`[triggerAllSiteOptions] Change handler completed for ${option.key}`);
	}
	console.debug(`[triggerAllSiteOptions] All site options triggered`);
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

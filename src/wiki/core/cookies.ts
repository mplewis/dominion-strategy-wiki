import { COOKIE_EXPIRATION_YEARS } from "./config";

/**
 * Retrieves the value of a specified cookie from the browser's document.cookie string.
 * @param {string} cname - The name of the cookie to retrieve
 * @returns {string} The value of the cookie, or empty string if not found
 */
export function getCookie(cname: string): string {
	const name = `${cname}=`;
	const decodedCookie = decodeURIComponent(document.cookie);
	const ca = decodedCookie.split(";");
	for (let i = 0; i < ca.length; i++) {
		let c = ca[i];
		while (c.charAt(0) === " ") {
			c = c.substring(1);
		}
		if (c.indexOf(name) === 0) {
			return c.substring(name.length, c.length);
		}
	}
	return "";
}

/**
 * Sets a cookie with the specified name, value, and expiration.
 * @param {string} name - The name of the cookie
 * @param {string | number} value - The value to store
 * @returns {void}
 */
export function setCookie(name: string, value: string | number): void {
	const cookieDate = new Date();
	cookieDate.setFullYear(cookieDate.getFullYear() + COOKIE_EXPIRATION_YEARS);
	document.cookie = `${name}=${value}; expires=${cookieDate.toUTCString()};`;
}

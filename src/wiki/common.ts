import { initCommon } from "./core/initialization";

try {
	initCommon();
} catch {
	document.addEventListener("DOMContentLoaded", initCommon);
}

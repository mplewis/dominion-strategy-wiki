import { initCommon } from "./core/initialization";

console.log("File watcher test - common.ts loaded - UPDATED");

try {
	initCommon();
} catch {
	document.addEventListener("DOMContentLoaded", initCommon);
}

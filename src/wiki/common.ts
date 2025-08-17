import { initCommon } from "./core/initialization";

async function init() {
	try {
		await initCommon();
	} catch {
		document.addEventListener("DOMContentLoaded", async () => {
			await initCommon();
		});
	}
}

init();

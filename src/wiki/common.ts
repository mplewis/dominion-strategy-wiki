import { initCommon } from "./core/initialization";

(() => {
  try {
    initCommon();
  } catch (_error) {
    console.info("initCommon called too early!");
    // jQuery fallback for environments that need it
    if (typeof $ !== "undefined") {
      $(document).ready(initCommon);
    } else {
      document.addEventListener("DOMContentLoaded", initCommon);
    }
  }
})();

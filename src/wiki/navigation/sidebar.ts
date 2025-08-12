let clickedThings = false;

/**
 * Auto-expands collapsible elements on the Legacy All Cards Navbox page.
 * Uses recursive setTimeout to keep trying until the collapsible element is found and clicked.
 * @returns {void}
 */
export function clickThings(): void {
  if (window.location.href.search("Legacy_All_Cards_Navbox") !== -1) {
    const thingToClick = document.querySelector(".mw-collapsible-text");
    if (thingToClick) {
      (thingToClick as HTMLElement).click();
      clickedThings = true;
    } else if (!clickedThings) {
      setTimeout(clickThings);
    }
  }
}

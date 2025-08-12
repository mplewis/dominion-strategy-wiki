import { initBlackBorder } from "./borders";

/**
 * Adjusts the horizontal position of card popup tooltips to prevent them from
 * extending beyond the viewport boundaries. Positions popup to the left or right
 * based on available screen space.
 * @param {Event|Element} e - Either a mouse event or the popup element itself
 * @returns {void}
 */
export function fixCardPopup(e: Event | HTMLElement): void {
  let elem: HTMLElement | null;
  if ("target" in e && e.target) {
    elem = (e.target as Element).parentElement
      ?.nextElementSibling as HTMLElement;
  } else {
    elem = e as HTMLElement;
  }
  if (elem?.getBoundingClientRect().x > window.innerWidth / 2) {
    elem.style.left = `-${
      elem.offsetWidth -
      (elem.previousElementSibling as HTMLElement).offsetWidth +
      20
    }px`;
  } else {
    elem.style.left = "20px";
  }
}

/**
 * Initializes all card popup elements on the page by removing default tooltips,
 * adding mouse event listeners for positioning and border effects.
 * Processes both link and image elements within card popups.
 * @returns {void}
 */
export function fixCardPopups(): void {
  let elems = document.querySelectorAll(".card-popup > a");
  for (let i = 0; i < elems.length; i++) {
    (elems[i] as HTMLAnchorElement).title = "";
    elems[i].addEventListener("mouseover", fixCardPopup);
    elems[i].addEventListener("mouseover", initBlackBorder);
  }
  elems = document.querySelectorAll(".card-popup > span > img");
  for (let i = 0; i < elems.length; i++) {
    if (elems[i].parentElement) {
      fixCardPopup(elems[i].parentElement as HTMLElement);
    }
  }
}

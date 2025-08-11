/* Any JavaScript here will be loaded for all users on every page load. */

(function () {
  // Constants for card border functionality
  const BORDER_SIZE_ENABLED = 11;
  const COOKIE_EXPIRATION_YEARS = 1;
  // Maps image width (px) to appropriate border padding size (px) for card styling
  const SIZE_MAPPINGS = {
    75: 4,
    100: 5,
    120: 6,
    150: 8,
    160: 9,
    200: 11,
    320: 11,
    375: 21,
    800: 21,
  };

  var dominionStrategyStyleSheet = new CSSStyleSheet();
  dominionStrategyStyleSheet.replaceSync(
    ".mw-collapsible span.card-popup a:hover+span,.mw-collapsible span.card-popup img{display:none;visibility:hidden;opacity:0}"
  );

  /**
   * Retrieves the value of a specified cookie from the browser's document.cookie string.
   * @param {string} cname - The name of the cookie to retrieve
   * @returns {string} The value of the cookie, or empty string if not found
   */
  function getCookie(cname) {
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
   * Event handler for the card border checkbox. Toggles black borders around card images
   * and saves the preference as a cookie with a 1-year expiration.
   * @returns {void}
   */
  function changeBorder() {
    const optionInput = document.querySelector("#cardBorderChanger");
    let curVal = 0;
    if (optionInput.checked) {
      curVal = BORDER_SIZE_ENABLED;
    }
    const cookieDate = new Date();
    cookieDate.setFullYear(cookieDate.getFullYear() + COOKIE_EXPIRATION_YEARS);
    document.cookie = `cardbordersize=${curVal}; expires=${cookieDate.toUTCString()};`;
    setBlackBorder(curVal);
  }

  /**
   * Calculates the appropriate border padding size based on image width.
   * Maps specific image widths to corresponding border padding values for card styling.
   * @param {number} width - The width of the image in pixels
   * @returns {number} The padding size in pixels, or 0 if width doesn't match predefined sizes
   */
  function getNewSize(width) {
    return SIZE_MAPPINGS[width] || 0;
  }

  /**
   * Applies or removes black borders around all card images on the page.
   * Creates a black border wrapper around eligible images or updates existing borders.
   * @param {number} bSize - Border size setting (0 = no border, >0 = show border)
   * @returns {void}
   */
  function setBlackBorder(bSize) {
    const elems = document.querySelectorAll("img");
    for (let i = 0; i < elems.length; i++) {
      const elem = elems[i];
      let newSize = getNewSize(elem.offsetWidth);
      if (newSize > 0) {
        if (bSize === 0) {
          newSize = 0;
        }
        if (elem.parentElement.className !== "cardborderchanger") {
          elem.outerHTML = `<span class="cardborderchanger" style="display:inline-block; padding:${newSize}px; border-radius:${
            newSize - 1
          }px; background:black;">${elem.outerHTML}</span>`;
        } else if (elem.parentElement.className === "cardborderchanger") {
          elem.parentElement.style.padding = `${newSize}px`;
          elem.parentElement.style.borderRadius = `${newSize - 1}px`;
        }
      }
    }
  }

  /**
   * Initializes black border for a specific card image when it's hovered.
   * Checks cookie setting and applies border if enabled. Used for card popup hover effects.
   * @param {Event} e - The mouse event (typically mouseover)
   * @returns {void}
   */
  function initBlackBorder(e) {
    const elem = e.target.parentElement.parentElement.querySelector("img");
    const curVal = getCookie("cardbordersize");
    if (curVal > 0) {
      let newSize = getNewSize(elem.offsetWidth);
      if (newSize > 0) {
        if (elem.parentElement.className !== "cardborderchanger") {
          elem.outerHTML = `<span class="cardborderchanger" style="display:inline-block; padding:${newSize}px; border-radius:${
            newSize - 1
          }px; background:black;">${elem.outerHTML}</span>`;
        } else if (elem.parentElement.className === "cardborderchanger") {
          elem.parentElement.style.padding = `${newSize}px`;
          elem.parentElement.style.borderRadius = `${newSize - 1}px`;
        }
      }
    }
  }

  /**
   * Creates a user preference checkbox option in the sidebar navigation.
   * Adds a checkbox with label that persists state via cookies and calls handlers on change.
   * @param {string} optionCookie - Cookie name to store the option value
   * @param {string} optionId - HTML ID for the checkbox element
   * @param {string} optionText - Display text for the checkbox label
   * @param {number} optionDefault - Default value if no cookie exists
   * @param {Function} optionFunc - Event handler function for checkbox changes
   * @param {Function} optionSetFunc - Function to apply the option setting
   * @returns {void}
   */
  function addSiteOption(
    optionCookie,
    optionId,
    optionText,
    optionDefault,
    optionFunc,
    optionSetFunc
  ) {
    if (!document.querySelector(`#${optionId}`)) {
      let curVal = getCookie(optionCookie);
      let checked = "";
      if (curVal === "") {
        curVal = optionDefault;
      }
      if (curVal > 0) {
        checked = "checked";
        optionSetFunc(curVal);
      }
      const pNavigationUl = document.querySelector("#p-navigation ul");
      const optionLi = document.createElement("li");
      optionLi.innerHTML = `<label for="${optionId}" style="cursor:pointer; user-select:none">${optionText}&nbsp;</label><input style="height:8px" type="checkbox" id="${optionId}" ${checked}>`;
      pNavigationUl.insertBefore(optionLi, null);
      const optionInput = document.querySelector(`#${optionId}`);
      optionInput.addEventListener("change", optionFunc);
    }
  }

  /**
   * Adjusts the horizontal position of card popup tooltips to prevent them from
   * extending beyond the viewport boundaries. Positions popup to the left or right
   * based on available screen space.
   * @param {Event|Element} e - Either a mouse event or the popup element itself
   * @returns {void}
   */
  function fixCardPopup(e) {
    let elem;
    if (e.target) {
      elem = e.target.parentElement.nextElementSibling;
    } else {
      elem = e;
    }
    if (elem.getBoundingClientRect().x > window.innerWidth / 2) {
      elem.style.left = `-${
        elem.offsetWidth - elem.previousElementSibling.offsetWidth + 20
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
  function fixCardPopups() {
    let elems = document.querySelectorAll(".card-popup > a");
    for (let i = 0; i < elems.length; i++) {
      elems[i].title = "";
      elems[i].addEventListener("mouseover", fixCardPopup);
      elems[i].addEventListener("mouseover", initBlackBorder);
    }
    elems = document.querySelectorAll(".card-popup > span > img");
    for (let i = 0; i < elems.length; i++) {
      fixCardPopup(elems[i].parentElement);
    }
  }

  /**
   * Event handler for the 'Show Expansions' checkbox. Toggles visibility of
   * Dominion expansion links in the sidebar navigation and saves preference to cookie.
   * @returns {void}
   */
  function toggleSidebarExpansions() {
    const optionInput = document.querySelector("#showExpansionsChanger");
    let curVal = 0;
    if (optionInput.checked) {
      curVal = 1;
    }
    setSidebarExpansions(curVal);
    const cookieDate = new Date();
    cookieDate.setFullYear(cookieDate.getFullYear() + COOKIE_EXPIRATION_YEARS);
    document.cookie = `showexpansions=${curVal}; expires=${cookieDate.toUTCString()};`;
  }

  /**
   * Shows or hides Dominion expansion links in the sidebar based on user preference.
   * Can read setting from cookie if 'cookie' is passed as parameter.
   * @param {string|number} curVal - Display setting: 1 to show, 0 to hide, 'cookie' to read from cookie
   * @returns {void}
   */
  function setSidebarExpansions(curVal) {
    if (curVal === "cookie") {
      curVal = getCookie("showexpansions");
      if (curVal === "") {
        curVal = 1;
      }
    }
    let visibility = "none";
    if (curVal === 1) {
      visibility = "block";
    }
    const elems = document.querySelectorAll(".showExpansionItem");
    for (let i = 0; i < elems.length; i++) {
      elems[i].style.display = visibility;
    }
  }

  /**
   * Creates a navigation link for a specific Dominion expansion in the sidebar.
   * Uses MediaWiki's article path configuration to generate proper URLs.
   * @param {string} link - The wiki page name/path for the expansion
   * @param {string} title - Display text for the expansion link
   * @returns {void}
   */
  function addExpansionLink(link, title) {
    const pNavigationUl = document.querySelector("#p-navigation ul");
    const optionLi = document.createElement("li");
    optionLi.classList.add("showExpansionItem");
    const urlBase = mw.config.values.wgArticlePath.replace("$1", "");
    optionLi.innerHTML = `<a href="${urlBase}${link}">${title}</a>`;
    pNavigationUl.insertBefore(optionLi, null);
  }

  /**
   * Populates the sidebar with navigation links to all Dominion expansions.
   * Creates links for all major expansions from Base Set through Rising Sun plus Promos.
   * Only runs once per page load to avoid duplicates.
   * @returns {void}
   */
  function addExpansionSidebarLinks() {
    const pNavigationUl = document.querySelector("#p-navigation ul");
    if (pNavigationUl && !document.querySelector("#expansionSidebarLinks")) {
      const expansionSidebarLinks = document.createElement("span");
      expansionSidebarLinks.id = "expansionSidebarLinks";
      pNavigationUl.insertBefore(expansionSidebarLinks, null);
      addExpansionLink("Dominion (Base Set)", "Dominion");
      addExpansionLink("Intrigue", "Intrigue");
      addExpansionLink("Seaside", "Seaside");
      addExpansionLink("Alchemy", "Alchemy");
      addExpansionLink("Prosperity", "Prosperity");
      addExpansionLink("Cornucopia & Guilds", "Cornucopia & Guilds");
      addExpansionLink("Hinterlands", "Hinterlands");
      addExpansionLink("Dark Ages", "Dark Ages");
      addExpansionLink("Adventures", "Adventures");
      addExpansionLink("Empires", "Empires");
      addExpansionLink("Nocturne", "Nocturne");
      addExpansionLink("Renaissance", "Renaissance");
      addExpansionLink("Menagerie (expansion)", "Menagerie");
      addExpansionLink("Allies", "Allies");
      addExpansionLink("Plunder (expansion)", "Plunder");
      addExpansionLink("Rising Sun", "Rising Sun");
      addExpansionLink("Promo", "Promos");
    }
  }

  /**
   * Sorts card elements within a container by either name or cost.
   * Extracts card names and cost information from CSS classes, sorts accordingly,
   * and updates the DOM. Also manages visibility of sort toggle buttons.
   * @param {Element} startsort - Container element holding card elements to sort
   * @param {string} sortby - Sort method: 'sortbyname' or 'sortbycost'
   * @param {string} sortid - CSS class identifier for this sortable group
   * @returns {void}
   */
  function sortSortables(startsort, sortby, sortid) {
    const cards = [];
    let sameCost = true;
    let firstCost;
    const elems = startsort.querySelectorAll(".cardcost");
    for (let i = 0; i < elems.length; i++) {
      const cardname = elems[i].querySelector("a").title;
      if (sortby === "sortbyname") {
        cards.push([cardname, elems[i]]);
      }
      for (let j = 0; j < elems[i].classList.length; j++) {
        const cost = elems[i].classList[j];
        const re = /^cost(\$)?(\d\d)?([\*\+])?((\d\d)[Dd])?([Pp])?$/i;
        const found = cost.match(re);
        if (found) {
          if (i === 0) {
            firstCost = cost;
          } else if (cost !== firstCost) {
            sameCost = false;
          }
          if (sortby !== "sortbyname") {
            let coststr;
            if (found[1] === undefined) {
              coststr = "-----";
            } else {
              coststr = found[2] !== undefined ? found[2] : "00";
              if (found[6] !== undefined) {
                coststr += "PP";
              } else {
                coststr += found[5] !== undefined ? found[5] : "00";
              }
              if (found[3] !== undefined) {
                coststr += found[3];
              } else {
                coststr += " ";
              }
            }
            cards.push([coststr + cardname, elems[i]]);
          }
          break;
        }
      }
    }
    cards.sort();
    for (let i = 0; i < cards.length; i++) {
      startsort.insertBefore(cards[i][1], null);
    }
    let switchElems = document.querySelectorAll(
      `.switchsort.sortbyname.${sortid}`
    );
    for (let i = 0; i < switchElems.length; i++) {
      if (sortby === "sortbyname" || sameCost) {
        switchElems[i].style.display = "none";
      } else {
        switchElems[i].style.display = "";
      }
    }
    switchElems = document.querySelectorAll(`.switchsort.sortbycost.${sortid}`);
    for (let i = 0; i < switchElems.length; i++) {
      if (sortby === "sortbycost" || sameCost) {
        switchElems[i].style.display = "none";
      } else {
        switchElems[i].style.display = "";
      }
    }
  }

  /**
   * Event handler for sort toggle buttons. Extracts sorting parameters from
   * the clicked element's CSS classes and triggers sorting for all matching containers.
   * @param {Event} e - Click event from a sort toggle button
   * @returns {void}
   */
  function startSort(e) {
    let sortby = "";
    let sortid = "";
    for (let i = 0; i < e.target.classList.length; i++) {
      const re = /^sortby/i;
      const found = e.target.classList[i].match(re);
      if (found) {
        sortby = e.target.classList[i];
      }
      const re2 = /^sortid/i;
      const found2 = e.target.classList[i].match(re2);
      if (found2) {
        sortid = e.target.classList[i];
      }
    }
    const elems = document.querySelectorAll(`.startsort.${sortid}`);
    for (let i = 0; i < elems.length; i++) {
      sortSortables(elems[i], sortby, sortid);
    }
  }

  /**
   * Initializes the card sorting system by attaching click handlers to sort buttons
   * and triggering an initial alphabetical sort by clicking all 'sort by name' buttons.
   * @returns {void}
   */
  function initSorting() {
    let elems = document.querySelectorAll(".switchsort");
    for (let i = 0; i < elems.length; i++) {
      elems[i].addEventListener("click", startSort);
    }
    elems = document.querySelectorAll(".switchsort.sortbyname");
    for (let i = 0; i < elems.length; i++) {
      elems[i].click();
    }
  }

  /**
   * Applies card sorting preference by programmatically clicking appropriate sort buttons.
   * Can read setting from cookie if 'cookie' is passed as parameter.
   * @param {string|number} curVal - Sort preference: 0/false for name, 1/true for cost, 'cookie' to read from cookie
   * @returns {void}
   */
  function setCardSortBy(curVal) {
    if (curVal === "cookie") {
      curVal = getCookie("cardsortby");
      if (curVal === "") {
        curVal = 0;
      }
    }
    if (curVal === 1) {
      const elems = document.querySelectorAll(".switchsort.sortbycost");
      for (let i = 0; i < elems.length; i++) {
        elems[i].click();
      }
    } else {
      const elems = document.querySelectorAll(".switchsort.sortbyname");
      for (let i = 0; i < elems.length; i++) {
        elems[i].click();
      }
    }
  }

  /**
   * Event handler for the card sort preference checkbox. Updates sorting method
   * between alphabetical and cost-based, saves preference to cookie.
   * @returns {void}
   */
  function changeCardSortBy() {
    const optionInput = document.querySelector("#cardGallerySorter");
    let curVal = 0;
    if (optionInput.checked) {
      curVal = 1;
    }
    const cookieDate = new Date();
    cookieDate.setFullYear(cookieDate.getFullYear() + COOKIE_EXPIRATION_YEARS);
    document.cookie = `cardsortby=${curVal}; expires=${cookieDate.toUTCString()};`;
    setCardSortBy(curVal);
  }

  /**
   * Event handler for the navbox images checkbox. Toggles whether card images
   * are visible when hovering inside collapsible navboxes and saves preference to cookie.
   * @returns {void}
   */
  function toggleNavboxImages() {
    const optionInput = document.querySelector("#hoverInsideCollapsibles");
    let curVal = 0;
    if (optionInput.checked) {
      curVal = 1;
    }
    setNavboxImages(curVal);
    const cookieDate = new Date();
    cookieDate.setFullYear(cookieDate.getFullYear() + COOKIE_EXPIRATION_YEARS);
    document.cookie = `hoverinsidecollapsibles=${curVal}; expires=${cookieDate.toUTCString()};`;
  }

  /**
   * Controls visibility of card hover images within collapsible navboxes by
   * managing CSS stylesheets. Can read setting from cookie if 'cookie' is passed.
   * @param {string|number} curVal - Display setting: 1 to show images, 0 to hide, 'cookie' to read from cookie
   * @returns {void}
   */
  function setNavboxImages(curVal) {
    if (curVal === "cookie") {
      curVal = getCookie("hoverinsidecollapsibles");
      if (curVal === "") {
        curVal = 0;
      }
    }
    if (curVal === 1) {
      while (document.adoptedStyleSheets.pop());
    } else {
      document.adoptedStyleSheets.push(dominionStrategyStyleSheet);
    }
  }

  let clickedThings = false;
  /**
   * Auto-expands collapsible elements on the Legacy All Cards Navbox page.
   * Uses recursive setTimeout to keep trying until the collapsible element is found and clicked.
   * @returns {void}
   */
  function clickThings() {
    if (window.location.href.search("Legacy_All_Cards_Navbox") !== -1) {
      const thingToClick = document.querySelector(".mw-collapsible-text");
      if (thingToClick) {
        thingToClick.click();
        clickedThings = true;
      } else if (!clickedThings) {
        setTimeout(clickThings);
      }
    }
  }

  /**
   * Main initialization function that sets up all wiki functionality.
   * Creates user preference checkboxes, initializes card popups, sorting, expansion links,
   * and applies saved user preferences from cookies.
   * @returns {void}
   */
  function initCommon() {
    addSiteOption(
      "cardsortby",
      "cardGallerySorter",
      "Sort by Cost:",
      0,
      changeCardSortBy,
      setCardSortBy
    );
    addSiteOption(
      "cardbordersize",
      "cardBorderChanger",
      "Card Border:",
      0,
      changeBorder,
      setBlackBorder
    );
    fixCardPopups();
    addSiteOption(
      "hoverinsidecollapsibles",
      "hoverInsideCollapsibles",
      "Navbox Images:",
      0,
      toggleNavboxImages,
      setNavboxImages
    );
    setNavboxImages("cookie");
    addSiteOption(
      "showexpansions",
      "showExpansionsChanger",
      "Show Expansions:",
      1,
      toggleSidebarExpansions,
      setSidebarExpansions
    );
    addExpansionSidebarLinks();
    setSidebarExpansions("cookie");
    initSorting();
    setCardSortBy("cookie");
    clickThings();
  }

  try {
    initCommon();
  } catch (error) {
    console.log("initCommon called too early!");
    $(document).ready(initCommon);
  }
})();

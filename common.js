/* Any JavaScript here will be loaded for all users on every page load. */

(function () {
  var dominionStrategyStyleSheet = new CSSStyleSheet();
  dominionStrategyStyleSheet.replaceSync(
    ".mw-collapsible span.card-popup a:hover+span,.mw-collapsible span.card-popup img{display:none;visibility:hidden;opacity:0}"
  );

  function getCookie(cname) {
    var name = cname + "=";
    var decodedCookie = decodeURIComponent(document.cookie);
    var ca = decodedCookie.split(";");
    for (var i = 0; i < ca.length; i++) {
      var c = ca[i];
      while (c.charAt(0) == " ") {
        c = c.substring(1);
      }
      if (c.indexOf(name) == 0) {
        return c.substring(name.length, c.length);
      }
    }
    return "";
  }

  function changeBorder() {
    var optionInput = document.querySelector("#cardBorderChanger");
    var curVal = 0;
    if (optionInput.checked) {
      curVal = 11;
    }
    var CookieDate = new Date();
    CookieDate.setFullYear(CookieDate.getFullYear() + 1);
    document.cookie =
      "cardbordersize=" +
      curVal +
      "; expires=" +
      CookieDate.toUTCString() +
      ";";
    setBlackBorder(curVal);
  }

  function getNewSize(width) {
    var newSize = 0;
    switch (width) {
      case 75:
        newSize = 4;
        break;
      case 100:
        newSize = 5;
        break;
      case 120:
        newSize = 6;
        break;
      case 150:
        newSize = 8;
        break;
      case 160:
        newSize = 9;
        break;
      case 200:
        newSize = 11;
        break;
      case 320:
        newSize = 11;
        break;
      case 375:
        newSize = 21;
        break;
      case 800:
        newSize = 21;
        break;
    }
    return newSize;
  }

  function setBlackBorder(bSize) {
    var elems = document.querySelectorAll("img");
    for (var i = 0; i < elems.length; i++) {
      var elem = elems[i];
      var newSize = getNewSize(elem.offsetWidth);
      if (newSize > 0) {
        if (bSize == 0) {
          newSize = 0;
        }
        if (elem.parentElement.className != "cardborderchanger") {
          elem.outerHTML =
            '<span class="cardborderchanger" style="display:inline-block; padding:' +
            newSize +
            "px; border-radius:" +
            (newSize - 1) +
            'px; background:black;">' +
            elem.outerHTML +
            "</span>";
        } else if (elem.parentElement.className == "cardborderchanger") {
          elem.parentElement.style.padding = newSize + "px";
          elem.parentElement.style.borderRadius = newSize - 1 + "px";
        }
      }
    }
  }

  function initBlackBorder(e) {
    var elem = e.target.parentElement.parentElement.querySelector("img");
    var curVal = getCookie("cardbordersize");
    if (curVal > 0) {
      var newSize = getNewSize(elem.offsetWidth);
      if (newSize > 0) {
        if (elem.parentElement.className != "cardborderchanger") {
          elem.outerHTML =
            '<span class="cardborderchanger" style="display:inline-block; padding:' +
            newSize +
            "px; border-radius:" +
            (newSize - 1) +
            'px; background:black;">' +
            elem.outerHTML +
            "</span>";
        } else if (elem.parentElement.className == "cardborderchanger") {
          elem.parentElement.style.padding = newSize + "px";
          elem.parentElement.style.borderRadius = newSize - 1 + "px";
        }
      }
    }
  }

  function addSiteOption(
    optionCookie,
    optionId,
    optionText,
    optionDefault,
    optionFunc,
    optionSetFunc
  ) {
    if (!document.querySelector("#" + optionId)) {
      var curVal = getCookie(optionCookie);
      var checked = "";
      if (curVal == "") {
        curVal = optionDefault;
      }
      if (curVal > 0) {
        checked = "checked";
        optionSetFunc(curVal);
      }
      var pNavigationUl = document.querySelector("#p-navigation ul");
      var optionLi = document.createElement("li");
      optionLi.innerHTML =
        '<label for="' +
        optionId +
        '" style="cursor:pointer; user-select:none">' +
        optionText +
        '&nbsp;</label><input style="height:8px" type="checkbox" id="' +
        optionId +
        '" ' +
        checked +
        ">";
      pNavigationUl.insertBefore(optionLi, null);
      var optionInput = document.querySelector("#" + optionId);
      optionInput.addEventListener("change", optionFunc);
    }
  }

  function fixCardPopup(e) {
    var elem;
    if (e.target) {
      elem = e.target.parentElement.nextElementSibling;
    } else {
      elem = e;
    }
    if (elem.getBoundingClientRect().x > window.innerWidth / 2) {
      elem.style.left =
        "-" +
        (elem.offsetWidth - elem.previousElementSibling.offsetWidth + 20) +
        "px";
    } else {
      elem.style.left = "20px";
    }
  }

  function fixCardPopups() {
    var elems = document.querySelectorAll(".card-popup > a");
    for (var i = 0; i < elems.length; i++) {
      elems[i].title = "";
      elems[i].addEventListener("mouseover", fixCardPopup);
      elems[i].addEventListener("mouseover", initBlackBorder);
    }
    elems = document.querySelectorAll(".card-popup > span > img");
    for (i = 0; i < elems.length; i++) {
      fixCardPopup(elems[i].parentElement);
    }
  }

  function toggleSidebarExpansions() {
    var optionInput = document.querySelector("#showExpansionsChanger");
    var curVal = 0;
    if (optionInput.checked == true) {
      curVal = 1;
    }
    setSidebarExpansions(curVal);
    var CookieDate = new Date();
    CookieDate.setFullYear(CookieDate.getFullYear() + 1);
    document.cookie =
      "showexpansions=" +
      curVal +
      "; expires=" +
      CookieDate.toUTCString() +
      ";";
  }

  function setSidebarExpansions(curVal) {
    if (curVal == "cookie") {
      curVal = getCookie("showexpansions");
      if (curVal == "") {
        curVal = 1;
      }
    }
    var visibility = "none";
    if (curVal == 1) {
      visibility = "block";
    }
    var elems = document.querySelectorAll(".showExpansionItem");
    for (var i = 0; i < elems.length; i++) {
      elems[i].style.display = visibility;
    }
  }

  function addExpansionLink(link, title) {
    var pNavigationUl = document.querySelector("#p-navigation ul");
    var optionLi = document.createElement("li");
    optionLi.classList.add("showExpansionItem");
    var urlBase = mw.config.values.wgArticlePath.replace("$1", "");
    optionLi.innerHTML = '<a href="' + urlBase + link + '">' + title + "</a>";
    pNavigationUl.insertBefore(optionLi, null);
  }

  function addExpansionSidebarLinks() {
    var pNavigationUl = document.querySelector("#p-navigation ul");
    if (pNavigationUl && !document.querySelector("#expansionSidebarLinks")) {
      var expansionSidebarLinks = document.createElement("span");
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

  function sortSortables(startsort, sortby, sortid) {
    var cardsByName = [];
    var cardsByCostName = [];
    var hasNonZeroCost = false;
    var elems = startsort.querySelectorAll(".cardcost");
    for (var i = 0; i < elems.length; i++) {
      var cardname = elems[i].querySelector("a").title;
      cardsByName.push([cardname, elems[i]]);
      for (var j = 0; j < elems[i].classList.length; j++) {
        var costplus = elems[i].classList[j];
        var re = /^cost/i;
        var found = costplus.match(re);
        if (found) {
          var extrachar = "";
          var lastchar = costplus.charAt(costplus.length - 1).toLowerCase();
          if (
            lastchar != "*" &&
            lastchar != "+" &&
            lastchar != "p" &&
            lastchar != "d"
          ) {
            extrachar = "!";
          }
          var costpluscardname = costplus + extrachar + cardname;
          cardsByCostName.push([costpluscardname, elems[i]]);
          if (
            costplus != "cost$00" &&
            costplus != "cost$00*" &&
            costplus != "cost$00+" &&
            costplus != "cost"
          ) {
            hasNonZeroCost = true;
          }
        }
      }
    }
    var sortlist = [];
    if (sortby == "sortbyname") {
      cardsByName.sort(function (a, b) {
        var a0 = a[0].toLowerCase();
        var b0 = b[0].toLowerCase();
        if (a0 < b0) {
          return -1;
        }
        if (a0 > b0) {
          return 1;
        }
        return 0;
      });
      sortlist = cardsByName;
    } else {
      cardsByCostName.sort(function (a, b) {
        var a0 = a[0].toLowerCase();
        var b0 = b[0].toLowerCase();
        if (a0 < b0) {
          return -1;
        }
        if (a0 > b0) {
          return 1;
        }
        return 0;
      });
      sortlist = cardsByCostName;
    }
    for (i = 0; i < sortlist.length; i++) {
      startsort.insertBefore(sortlist[i][1], null);
    }
    elems = document.querySelectorAll(".switchsort.sortbyname." + sortid);
    for (i = 0; i < elems.length; i++) {
      if (sortby == "sortbyname" || !hasNonZeroCost) {
        elems[i].style.display = "none";
      } else {
        elems[i].style.display = "";
      }
    }
    elems = document.querySelectorAll(".switchsort.sortbycost." + sortid);
    for (i = 0; i < elems.length; i++) {
      if (sortby == "sortbycost" || !hasNonZeroCost) {
        elems[i].style.display = "none";
      } else {
        elems[i].style.display = "";
      }
    }
  }

  function startSort(e) {
    var sortby = "";
    var sortid = "";
    for (var i = 0; i < e.target.classList.length; i++) {
      var re = /^sortby/i;
      var found = e.target.classList[i].match(re);
      if (found) {
        sortby = e.target.classList[i];
      }
      var re2 = /^sortid/i;
      var found2 = e.target.classList[i].match(re2);
      if (found2) {
        sortid = e.target.classList[i];
      }
    }
    var elems = document.querySelectorAll(".startsort." + sortid);
    for (i = 0; i < elems.length; i++) {
      sortSortables(elems[i], sortby, sortid);
    }
  }

  function initSorting() {
    var elems = document.querySelectorAll(".switchsort");
    for (var i = 0; i < elems.length; i++) {
      elems[i].addEventListener("click", startSort);
    }
    elems = document.querySelectorAll(".switchsort.sortbyname");
    for (i = 0; i < elems.length; i++) {
      elems[i].click();
    }
  }

  function setCardSortBy(curVal) {
    if (curVal == "cookie") {
      curVal = getCookie("cardsortby");
      if (curVal == "") {
        curVal = 0;
      }
    }
    if (curVal == 1) {
      var elems = document.querySelectorAll(".switchsort.sortbycost");
      for (var i = 0; i < elems.length; i++) {
        elems[i].click();
      }
    } else {
      var elems = document.querySelectorAll(".switchsort.sortbyname");
      for (var i = 0; i < elems.length; i++) {
        elems[i].click();
      }
    }
  }

  function changeCardSortBy() {
    var optionInput = document.querySelector("#cardGallerySorter");
    var curVal = 0;
    if (optionInput.checked) {
      curVal = 1;
    }
    var CookieDate = new Date();
    CookieDate.setFullYear(CookieDate.getFullYear() + 1);
    document.cookie =
      "cardsortby=" + curVal + "; expires=" + CookieDate.toUTCString() + ";";
    setCardSortBy(curVal);
  }

  function toggleNavboxImages() {
    var optionInput = document.querySelector("#hoverInsideCollapsibles");
    var curVal = 0;
    if (optionInput.checked == true) {
      curVal = 1;
    }
    setNavboxImages(curVal);
    var CookieDate = new Date();
    CookieDate.setFullYear(CookieDate.getFullYear() + 1);
    document.cookie =
      "hoverinsidecollapsibles=" +
      curVal +
      "; expires=" +
      CookieDate.toUTCString() +
      ";";
  }

  function setNavboxImages(curVal) {
    if (curVal == "cookie") {
      curVal = getCookie("hoverinsidecollapsibles");
      if (curVal == "") {
        curVal = 0;
      }
    }
    if (curVal == 1) {
      while (document.adoptedStyleSheets.pop());
    } else {
      document.adoptedStyleSheets.push(dominionStrategyStyleSheet);
    }
  }

  var clickedThings = false;
  function clickThings() {
    if (window.location.href.search("Legacy_All_Cards_Navbox") != -1) {
      var thingToClick = document.querySelector(".mw-collapsible-text");
      if (thingToClick) {
        thingToClick.click();
        clickedThings = true;
      } else if (clickedThings == false) {
        setTimeout(clickThings);
      }
    }
  }

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

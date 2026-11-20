(function () {
  "use strict";

  var header = document.getElementById("siteHeader");
  var menuButton = document.getElementById("menuToggle");
  var navigation = document.getElementById("primaryNav");

  function syncHeader() {
    if (header) header.classList.toggle("is-scrolled", window.scrollY > 16);
  }

  function closeMenu() {
    if (!menuButton || !navigation) return;
    menuButton.setAttribute("aria-expanded", "false");
    menuButton.classList.remove("is-open");
    navigation.classList.remove("is-open");
  }

  if (menuButton && navigation && menuButton.dataset.alcanoxToolbarBound !== "true") {
    menuButton.addEventListener("click", function () {
      var isOpen = menuButton.getAttribute("aria-expanded") === "true";
      menuButton.setAttribute("aria-expanded", String(!isOpen));
      menuButton.classList.toggle("is-open", !isOpen);
      navigation.classList.toggle("is-open", !isOpen);
    });

    navigation.addEventListener("click", function (event) {
      if (event.target.closest("a")) closeMenu();
    });

    window.addEventListener("keydown", function (event) {
      if (event.key === "Escape") closeMenu();
    });
  }

  window.addEventListener("scroll", syncHeader, { passive: true });
  syncHeader();

  function prepareLinearStages() {
    document.querySelectorAll(".reveal").forEach(function (section) {
      var order = 0;
      Array.prototype.slice.call(section.children).forEach(function (child) {
        if (
          child.hidden ||
          child.hasAttribute("data-linear-static") ||
          child.getAttribute("aria-hidden") === "true" ||
          /^(CANVAS|SVG|SCRIPT|STYLE)$/.test(child.tagName) ||
          child.classList.contains("sr-only") ||
          child.classList.contains("matrix-sr-only")
        ) return;

        child.classList.add("linear-stage");
        child.style.setProperty("--linear-delay", (110 + Math.min(order, 5) * 74) + "ms");
        order += 1;
      });
    });
  }

  prepareLinearStages();

  var reveals = Array.prototype.slice.call(document.querySelectorAll(".reveal"));
  if (!reveals.length) return;

  if (!window.IntersectionObserver || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    reveals.forEach(function (element) { element.classList.add("is-visible"); });
    return;
  }

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.16 });

  reveals.forEach(function (element) { observer.observe(element); });
})();

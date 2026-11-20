(function () {
  var menuToggle = document.getElementById("menuToggle");
  var primaryNav = document.getElementById("primaryNav");

  if (!menuToggle || !primaryNav) return;
  if (menuToggle.dataset.alcanoxToolbarBound === "true") return;

  menuToggle.addEventListener("click", function () {
    var opened = primaryNav.classList.toggle("is-open");
    menuToggle.classList.toggle("is-open", opened);
    menuToggle.setAttribute("aria-expanded", String(opened));
  });

  primaryNav.querySelectorAll("a").forEach(function (link) {
    link.addEventListener("click", function () {
      primaryNav.classList.remove("is-open");
      menuToggle.classList.remove("is-open");
      menuToggle.setAttribute("aria-expanded", "false");
    });
  });
})();

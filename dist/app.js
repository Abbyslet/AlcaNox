(function () {
  var header = document.getElementById("siteHeader");
  var menuToggle = document.getElementById("menuToggle");
  var primaryNav = document.getElementById("primaryNav");
  var signalForm = document.getElementById("signalForm");
  var securityBrief = document.getElementById("securityBrief");
  var signalStatus = document.getElementById("signalStatus");
  var consoleTime = document.getElementById("consoleTime");
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function setHeaderState() {
    header.classList.toggle("is-scrolled", window.scrollY > 26);
  }

  function closeMenu() {
    if (!menuToggle || !primaryNav) return;
    menuToggle.classList.remove("is-open");
    menuToggle.setAttribute("aria-expanded", "false");
    primaryNav.classList.remove("is-open");
  }

  function scrollToTarget(selector) {
    var target = document.querySelector(selector);
    if (target) {
      target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    }
  }

  setHeaderState();
  window.addEventListener("scroll", setHeaderState, { passive: true });

  if (menuToggle && primaryNav) {
    menuToggle.addEventListener("click", function () {
      var opened = primaryNav.classList.toggle("is-open");
      menuToggle.classList.toggle("is-open", opened);
      menuToggle.setAttribute("aria-expanded", String(opened));
    });

    primaryNav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", closeMenu);
    });
  }

  document.querySelectorAll("[data-scroll-target]").forEach(function (button) {
    button.addEventListener("click", function () {
      scrollToTarget(button.getAttribute("data-scroll-target"));
    });
  });

  if (signalForm && securityBrief && signalStatus) {
    signalForm.addEventListener("submit", function (event) {
      event.preventDefault();
      var message = securityBrief.value.trim();

      signalStatus.classList.remove("is-success", "is-error");
      if (message.length < 8) {
        signalStatus.textContent = "Escribe un poco más para preparar el punto de partida.";
        signalStatus.classList.add("is-error");
        securityBrief.focus();
        return;
      }

      signalStatus.textContent = "Señal preparada. Este demo no guarda ni envía la información.";
      signalStatus.classList.add("is-success");
      securityBrief.value = "";
    });
  }

  if (!reduceMotion && "IntersectionObserver" in window) {
    var revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.16 }
    );

    document.querySelectorAll(".reveal").forEach(function (element) {
      revealObserver.observe(element);
    });

    document.querySelectorAll(".tilt-card").forEach(function (card) {
      card.addEventListener("pointermove", function (event) {
        var bounds = card.getBoundingClientRect();
        var x = (event.clientX - bounds.left) / bounds.width - 0.5;
        var y = (event.clientY - bounds.top) / bounds.height - 0.5;
        card.style.transform =
          "perspective(800px) rotateX(" + -y * 1.8 + "deg) rotateY(" + x * 1.8 + "deg)";
      });

      card.addEventListener("pointerleave", function () {
        card.style.transform = "";
      });
    });
  } else {
    document.querySelectorAll(".reveal").forEach(function (element) {
      element.classList.add("is-visible");
    });
  }

  function updateConsoleTime() {
    if (!consoleTime) return;
    var now = new Date();
    var hours = String(now.getHours()).padStart(2, "0");
    var minutes = String(now.getMinutes()).padStart(2, "0");
    var seconds = String(now.getSeconds()).padStart(2, "0");
    consoleTime.textContent = hours + ":" + minutes + ":" + seconds;
  }

  updateConsoleTime();
  window.setInterval(updateConsoleTime, 1000);
})();

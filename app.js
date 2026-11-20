(function () {
  var isSpanish = String(document.documentElement.lang || "").toLowerCase().indexOf("es") === 0;
  var numberLocale = isSpanish ? "es-CL" : "en-US";
  var header = document.getElementById("siteHeader");
  var menuToggle = document.getElementById("menuToggle");
  var primaryNav = document.getElementById("primaryNav");
  var signalForm = document.getElementById("signalForm");
  var securityBrief = document.getElementById("securityBrief");
  var signalStatus = document.getElementById("signalStatus");
  var consoleTime = document.getElementById("consoleTime");
  var clientModal = document.getElementById("clientDialog");
  var activeModalTrigger = null;
  var modalOpenTimer = null;
  var modalCopyTimer = null;
  var modalCloseTimer = null;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function initWhenNear(element, initialize, rootMargin) {
    if (!element || typeof initialize !== "function") return;

    var started = false;
    function start() {
      if (started) return;
      started = true;
      initialize();
    }

    if (!("IntersectionObserver" in window)) {
      window.setTimeout(start, 1200);
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        start();
      });
    }, { rootMargin: rootMargin || "360px 0px", threshold: 0.01 });

    observer.observe(element);
  }

  function initDeferredImages() {
    var images = document.querySelectorAll("img[data-deferred-src]");
    if (!images.length) return;

    function loadImage(image) {
      var source = image.getAttribute("data-deferred-src");
      if (!source) return;
      image.removeAttribute("data-deferred-src");
      image.src = source;
    }

    if (!("IntersectionObserver" in window)) {
      images.forEach(loadImage);
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        observer.unobserve(entry.target);
        loadImage(entry.target);
      });
    }, { rootMargin: "520px 0px", threshold: 0.01 });

    images.forEach(function (image) {
      observer.observe(image);
    });
  }

  initDeferredImages();

  function setHeaderState() {
    header.classList.add("is-scrolled");
  }

  function closeMenu() {
    if (!menuToggle || !primaryNav) return;
    menuToggle.classList.remove("is-open");
    menuToggle.setAttribute("aria-expanded", "false");
    primaryNav.classList.remove("is-open");
    document.body.classList.remove("menu-open");
  }

  function scrollToTarget(selector) {
    var target = document.querySelector(selector);
    if (target) {
      target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    }
  }

  setHeaderState();

  if (menuToggle && primaryNav && menuToggle.dataset.alcanoxToolbarBound !== "true") {
    menuToggle.dataset.alcanoxToolbarBound = "true";
    menuToggle.addEventListener("click", function () {
      var opened = primaryNav.classList.toggle("is-open");
      menuToggle.classList.toggle("is-open", opened);
      menuToggle.setAttribute("aria-expanded", String(opened));
      document.body.classList.toggle("menu-open", opened);
    });

    primaryNav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", closeMenu);
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") closeMenu();
    });

    document.addEventListener("click", function (event) {
      if (primaryNav.classList.contains("is-open") && !header.contains(event.target)) {
        closeMenu();
      }
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth > 1060) closeMenu();
    });
  }

  document.querySelectorAll("[data-scroll-target]").forEach(function (button) {
    button.addEventListener("click", function () {
      scrollToTarget(button.getAttribute("data-scroll-target"));
    });
  });

  function closeClientModal() {
    if (!clientModal || clientModal.hidden) return;
    if (modalOpenTimer) {
      window.clearTimeout(modalOpenTimer);
      modalOpenTimer = null;
    }
    if (modalCopyTimer) {
      window.clearTimeout(modalCopyTimer);
      modalCopyTimer = null;
    }
    if (modalCloseTimer) {
      window.clearTimeout(modalCloseTimer);
      modalCloseTimer = null;
    }
    clientModal.classList.remove("is-open", "is-copy-visible");
    document.body.classList.remove("modal-open");
    var mobileModal = window.matchMedia("(max-width: 760px)").matches;
    modalCloseTimer = window.setTimeout(function () {
      modalCloseTimer = null;
      clientModal.hidden = true;
    }, reduceMotion ? 0 : (mobileModal ? 620 : 460));
    if (activeModalTrigger) {
      activeModalTrigger.focus({ preventScroll: true });
    }
  }

  if (clientModal) {
    document.querySelectorAll("[data-client-modal-open]").forEach(function (trigger) {
      trigger.addEventListener("click", function () {
        activeModalTrigger = trigger;
        if (modalCloseTimer) {
          window.clearTimeout(modalCloseTimer);
          modalCloseTimer = null;
        }
        clientModal.hidden = false;
        clientModal.classList.remove("is-copy-visible");
        document.body.classList.add("modal-open");
        var mobileModal = window.matchMedia("(max-width: 760px)").matches;
        modalOpenTimer = window.setTimeout(function () {
          modalOpenTimer = null;
          if (clientModal.hidden) return;
          clientModal.classList.add("is-open");
          modalCopyTimer = window.setTimeout(function () {
            modalCopyTimer = null;
            if (!clientModal.hidden) clientModal.classList.add("is-copy-visible");
          }, reduceMotion ? 0 : (mobileModal ? 640 : 1180));
          var closeButton = clientModal.querySelector(".client-modal-close");
          if (closeButton) closeButton.focus({ preventScroll: true });
        }, reduceMotion ? 0 : (mobileModal ? 70 : 120));
      });
    });

    clientModal.querySelectorAll("[data-client-modal-close]").forEach(function (closeTarget) {
      closeTarget.addEventListener("click", closeClientModal);
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") closeClientModal();
    });
  }

  if (signalForm && securityBrief && signalStatus) {
    signalForm.addEventListener("submit", function (event) {
      event.preventDefault();
      var message = securityBrief.value.trim();

      signalStatus.classList.remove("is-success", "is-error");
      if (message.length < 8) {
        signalStatus.textContent = isSpanish ? "Describe el entorno o activo que quieres evaluar." : "Describe the environment or asset you want to assess.";
        signalStatus.classList.add("is-error");
        securityBrief.focus();
        return;
      }

      signalStatus.textContent = isSpanish ? "Solicitud preparada. Esta demostración no transmite tu información." : "Request prepared. This demo does not transmit your information.";
      signalStatus.classList.add("is-success");
      securityBrief.value = "";
    });
  }

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

  function initFocusCarousel() {
    var panels = document.getElementById("focusPanels");
    var nextButton = document.querySelector("[data-focus-next]");
    if (!panels || !nextButton) return;

    nextButton.addEventListener("click", function () {
      var firstPanel = panels.querySelector(".focus-panel");
      if (!firstPanel) return;

      var styles = window.getComputedStyle(panels);
      var gap = parseFloat(styles.columnGap || styles.gap || "0") || 0;
      var step = (firstPanel.getBoundingClientRect().width + gap) * 2;
      var lastPosition = panels.scrollWidth - panels.clientWidth;
      var nextPosition = panels.scrollLeft >= lastPosition - 2 ? 0 : Math.min(panels.scrollLeft + step, lastPosition);

      panels.scrollTo({
        left: nextPosition,
        behavior: reduceMotion ? "auto" : "smooth"
      });
    });
  }

  initFocusCarousel();

  if (!reduceMotion && "IntersectionObserver" in window) {
    var revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            revealObserver.unobserve(entry.target);
            window.requestAnimationFrame(function () {
              entry.target.classList.add("is-visible");
            });
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -7% 0px" }
    );

    document.querySelectorAll(".reveal").forEach(function (element) {
      revealObserver.observe(element);
    });

  } else {
    document.querySelectorAll(".reveal").forEach(function (element) {
      element.classList.add("is-visible");
    });
  }

  function initImpactCounters() {
    var counters = document.querySelectorAll("[data-countup]");
    if (!counters.length) return;

    var formatter = new Intl.NumberFormat(numberLocale);

    function setFinalValue(counter) {
      counter.textContent = formatter.format(Number(counter.getAttribute("data-countup"))) + (counter.getAttribute("data-count-suffix") || "");
    }

    function animateCounter(counter) {
      if (counter.dataset.counted === "true") return;
      counter.dataset.counted = "true";

      var target = Number(counter.getAttribute("data-countup"));
      var suffix = counter.getAttribute("data-count-suffix") || "";
      var duration = 1240;
      var startedAt = null;

      function tick(now) {
        if (startedAt === null) startedAt = now;
        var progress = Math.min((now - startedAt) / duration, 1);
        var eased = 1 - Math.pow(1 - progress, 4);
        counter.textContent = formatter.format(Math.round(target * eased)) + suffix;

        if (progress < 1) {
          window.requestAnimationFrame(tick);
        } else {
          setFinalValue(counter);
        }
      }

      window.requestAnimationFrame(tick);
    }

    if (reduceMotion) {
      counters.forEach(setFinalValue);
      return;
    }

    if (!("IntersectionObserver" in window)) {
      counters.forEach(animateCounter);
      return;
    }

    var counterObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        animateCounter(entry.target);
        counterObserver.unobserve(entry.target);
      });
    }, { threshold: 0.55 });

    counters.forEach(function (counter) {
      counterObserver.observe(counter);
    });
  }

  initImpactCounters();

  function initGuaranteeWireframeCity() {
    var section = document.getElementById("garantia");
    var canvas = section && section.querySelector("[data-guarantee-city]");
    if (!section || !canvas || !canvas.getContext) return;

    var context = canvas.getContext("2d");
    if (!context) return;

    var motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    var width = 1;
    var height = 1;
    var dpr = 1;
    var frame = 0;
    var started = false;
    var completed = false;
    var startedAt = 0;
    var progress = 0;
    var lines = [];
    var nodes = [];
    var observer = null;
    var vanishingPoint = { x: 0, y: 0 };
    var logoImage = new Image();
    var logoReady = false;

    function clamp(value, minimum, maximum) {
      return Math.min(maximum, Math.max(minimum, value));
    }

    function mix(start, end, value) {
      return start + (end - start) * value;
    }

    function createRandom() {
      var seed = 20261011;
      return function () {
        seed |= 0;
        seed = seed + 0x6d2b79f5 | 0;
        var value = Math.imul(seed ^ seed >>> 15, 1 | seed);
        value = value + Math.imul(value ^ value >>> 7, 61 | value) ^ value;
        return ((value ^ value >>> 14) >>> 0) / 4294967296;
      };
    }

    function projectGround(x, depth) {
      var perspective = 0.1 + depth * 0.9;
      return {
        x: width * 0.72 + x * width * 0.66 * perspective,
        y: height * (0.62 + depth * 0.45)
      };
    }

    function addLine(from, to, alpha, delay, duration) {
      lines.push({
        from: from,
        to: to,
        alpha: alpha,
        delay: delay,
        duration: duration || 0.19
      });
    }

    function addNode(point, alpha, delay) {
      nodes.push({ point: point, alpha: alpha, delay: delay });
    }

    function addBuilding(x, depth, buildingWidth, buildingDepth, buildingHeight, alpha, delay, random) {
      var nearDepth = clamp(depth + buildingDepth, 0.02, 1);
      var farDepth = clamp(depth - buildingDepth, 0.02, 1);
      var bottom = [
        projectGround(x - buildingWidth, farDepth),
        projectGround(x + buildingWidth, farDepth),
        projectGround(x + buildingWidth, nearDepth),
        projectGround(x - buildingWidth, nearDepth)
      ];
      var lift = buildingHeight * height * (0.09 + depth * 0.3);
      var top = [];
      var index;

      for (index = 0; index < bottom.length; index += 1) {
        top.push({ x: bottom[index].x, y: bottom[index].y - lift });
      }

      for (index = 0; index < 4; index += 1) {
        var edgeDelay = delay + index * 0.014;
        addLine(bottom[index], bottom[(index + 1) % 4], alpha * 0.48, edgeDelay, 0.16);
        addLine(top[index], top[(index + 1) % 4], alpha, edgeDelay + 0.035, 0.2);
        addLine(bottom[index], top[index], alpha * 0.84, edgeDelay + 0.07, 0.19);
      }

      var facadeDivisions = 2 + Math.floor(buildingHeight * 3 + random() * 2);
      for (index = 1; index < facadeDivisions; index += 1) {
        var facadeProgress = index / facadeDivisions;
        var facadeBottom = {
          x: mix(bottom[3].x, bottom[2].x, facadeProgress),
          y: mix(bottom[3].y, bottom[2].y, facadeProgress)
        };
        var facadeTop = {
          x: mix(top[3].x, top[2].x, facadeProgress),
          y: mix(top[3].y, top[2].y, facadeProgress)
        };
        addLine(facadeBottom, facadeTop, alpha * 0.46, delay + 0.12 + index * 0.015, 0.16);
      }

      var floorLines = 1 + Math.floor(buildingHeight * 2.4);
      for (index = 1; index <= floorLines; index += 1) {
        var floorProgress = index / (floorLines + 1);
        addLine(
          { x: mix(bottom[3].x, top[3].x, floorProgress), y: mix(bottom[3].y, top[3].y, floorProgress) },
          { x: mix(bottom[2].x, top[2].x, floorProgress), y: mix(bottom[2].y, top[2].y, floorProgress) },
          alpha * 0.36,
          delay + 0.17 + index * 0.018,
          0.18
        );
      }

    }

    function buildScene() {
      var random = createRandom();
      var laneIndex;
      var depthIndex;
      var buildingIndex;
      lines = [];
      nodes = [];

      var horizon = { x: width * 0.72, y: height * 0.62 };
      var streetLeft = -0.44;
      var streetRight = 0.40;
      var city = [
        { x: -1.05, depth: 0.95, width: 0.26, height: 1.42, alpha: 0.58 },
        { x: -0.83, depth: 0.80, width: 0.18, height: 1.04, alpha: 0.49 },
        { x: -0.67, depth: 0.62, width: 0.14, height: 0.76, alpha: 0.42 },
        { x: -0.53, depth: 0.46, width: 0.105, height: 0.56, alpha: 0.35 },
        { x: -0.40, depth: 0.30, width: 0.074, height: 0.40, alpha: 0.29 },
        { x: -0.28, depth: 0.16, width: 0.046, height: 0.26, alpha: 0.24 },
        { x: 0.44, depth: 0.97, width: 0.25, height: 2.34, alpha: 0.64 },
        { x: 0.37, depth: 0.80, width: 0.18, height: 1.48, alpha: 0.54 },
        { x: 0.31, depth: 0.62, width: 0.135, height: 1.03, alpha: 0.46 },
        { x: 0.25, depth: 0.46, width: 0.096, height: 0.67, alpha: 0.38 },
        { x: 0.18, depth: 0.30, width: 0.068, height: 0.43, alpha: 0.30 },
        { x: 0.12, depth: 0.16, width: 0.042, height: 0.25, alpha: 0.24 }
      ];

      vanishingPoint = horizon;

      for (laneIndex = -7; laneIndex <= 7; laneIndex += 1) {
        var laneX = laneIndex * 0.064;
        var laneAlpha = laneIndex === 0 ? 0.24 : (laneIndex % 3 === 0 ? 0.17 : 0.115);
        addLine(horizon, projectGround(laneX, 1.04), laneAlpha, 0.02 + Math.abs(laneIndex) * 0.01, 0.32);
      }

      addLine(projectGround(streetLeft, 0.02), projectGround(streetLeft, 1.04), 0.34, 0.035, 0.34);
      addLine(projectGround(streetRight, 0.02), projectGround(streetRight, 1.04), 0.34, 0.05, 0.34);

      for (depthIndex = 1; depthIndex <= 9; depthIndex += 1) {
        var gridDepth = depthIndex / 10;
        var gridAlpha = depthIndex % 3 === 0 ? 0.15 : 0.10;
        addLine(projectGround(streetLeft, gridDepth), projectGround(streetRight, gridDepth), gridAlpha, 0.055 + depthIndex * 0.021, 0.24);
      }

      for (buildingIndex = 0; buildingIndex < city.length; buildingIndex += 1) {
        var building = city[buildingIndex];
        addBuilding(
          building.x,
          building.depth,
          building.width,
          0.026 + building.depth * 0.05,
          building.height,
          building.alpha,
          0.12 + (1 - building.depth) * 0.32 + buildingIndex * 0.014,
          random
        );
      }

      addLine(projectGround(-1.33, 0.78), horizon, 0.17, 0.22, 0.3);
      addLine(projectGround(0.73, 0.79), horizon, 0.18, 0.24, 0.3);
    }

    function drawHorizonLogo(sceneProgress) {
      if (!logoReady) return;

      var logoProgress = clamp((sceneProgress - 0.2) / 0.34, 0, 1);
      if (!logoProgress) return;

      var logoWidth = clamp(width * 0.068, 44, 108);
      var logoHeight = logoWidth * (logoImage.naturalHeight / logoImage.naturalWidth);
      var glowRadius = logoWidth * 1.72;
      var glow = context.createRadialGradient(
        vanishingPoint.x,
        vanishingPoint.y,
        logoWidth * 0.08,
        vanishingPoint.x,
        vanishingPoint.y,
        glowRadius
      );
      var eased = 1 - Math.pow(1 - logoProgress, 3);

      glow.addColorStop(0, "rgba(224, 228, 231, " + (0.16 * eased) + ")");
      glow.addColorStop(0.34, "rgba(166, 172, 177, " + (0.055 * eased) + ")");
      glow.addColorStop(1, "rgba(0, 0, 0, 0)");

      context.save();
      context.globalCompositeOperation = "screen";
      context.fillStyle = glow;
      context.fillRect(
        vanishingPoint.x - glowRadius,
        vanishingPoint.y - glowRadius,
        glowRadius * 2,
        glowRadius * 2
      );
      context.globalAlpha = 0.43 * eased;
      context.filter = "grayscale(1) saturate(0) brightness(1.35) contrast(0.72)";
      context.drawImage(
        logoImage,
        vanishingPoint.x - logoWidth * 0.5,
        vanishingPoint.y - logoHeight * 0.5,
        logoWidth,
        logoHeight
      );
      context.restore();
    }

    function drawScene(sceneProgress) {
      var lineIndex;
      var nodeIndex;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      context.clearRect(0, 0, width, height);
      context.lineCap = "round";
      context.lineJoin = "round";
      context.strokeStyle = "#dde1e5";
      context.fillStyle = "#f0f2f4";

      for (lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
        var line = lines[lineIndex];
        var lineProgress = clamp((sceneProgress - line.delay) / line.duration, 0, 1);
        if (!lineProgress) continue;
        var eased = 1 - Math.pow(1 - lineProgress, 3);
        var endPoint = {
          x: mix(line.from.x, line.to.x, eased),
          y: mix(line.from.y, line.to.y, eased)
        };
        var midpoint = (line.from.x + endPoint.x) * 0.5;
        var centerFactor = Math.min(1, Math.abs(midpoint - width * 0.72) / (width * 0.46));
        context.globalAlpha = line.alpha * (0.36 + centerFactor * 0.64) * (0.35 + lineProgress * 0.65);
        context.lineWidth = centerFactor > 0.58 ? 0.78 : 0.56;
        context.beginPath();
        context.moveTo(line.from.x, line.from.y);
        context.lineTo(endPoint.x, endPoint.y);
        context.stroke();
      }

      for (nodeIndex = 0; nodeIndex < nodes.length; nodeIndex += 1) {
        var node = nodes[nodeIndex];
        var nodeProgress = clamp((sceneProgress - node.delay) / 0.12, 0, 1);
        if (!nodeProgress) continue;
        var nodeEase = 1 - Math.pow(1 - nodeProgress, 3);
        context.globalAlpha = node.alpha * nodeEase;
        context.beginPath();
        context.arc(node.point.x, node.point.y, 1.1 + nodeEase * 0.55, 0, Math.PI * 2);
        context.fill();
      }

      drawHorizonLogo(sceneProgress);
      context.globalAlpha = 1;
    }

    function resize() {
      var bounds = section.getBoundingClientRect();
      width = Math.max(1, Math.round(bounds.width));
      height = Math.max(1, Math.round(bounds.height));
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = width + "px";
      canvas.style.height = height + "px";
      buildScene();
      drawScene(completed || motionQuery.matches ? 1 : progress);
    }

    function render(now) {
      progress = clamp((now - startedAt) / 2500, 0, 1);
      drawScene(progress);
      if (progress < 1) {
        frame = window.requestAnimationFrame(render);
      } else {
        frame = 0;
        completed = true;
      }
    }

    function start() {
      if (started) return;
      started = true;
      if (motionQuery.matches) {
        completed = true;
        progress = 1;
        drawScene(1);
        return;
      }
      startedAt = window.performance.now();
      frame = window.requestAnimationFrame(render);
    }

    logoImage.addEventListener("load", function () {
      logoReady = true;
      drawScene(completed || motionQuery.matches ? 1 : progress);
    });
    var siteRoot = document.documentElement.getAttribute("data-site-root") || "";
    logoImage.src = siteRoot + "assets/alcaox-logo-720.webp";

    if ("IntersectionObserver" in window) {
      observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          start();
          observer.unobserve(section);
        });
      }, { threshold: 0.25 });
      observer.observe(section);
    } else {
      start();
    }

    window.addEventListener("resize", resize, { passive: true });
    window.addEventListener("pagehide", function () {
      if (frame) window.cancelAnimationFrame(frame);
    }, { once: true });

    resize();
  }


  function initForensicSignalSphere() {
    var stage = document.querySelector("[data-forensic-signal-sphere]");
    var canvas = stage && stage.querySelector("canvas");
    if (!stage || !canvas || !canvas.getContext) return;

    var context = canvas.getContext("2d", { alpha: false });
    if (!context) return;

    var tau = Math.PI * 2;
    var width = 1;
    var height = 1;
    var centerX = 0;
    var centerY = 0;
    var radius = 1;
    var dpr = 1;
    var yaw = 0.17;
    var pitch = -0.16;
    var roll = -0.13;
    var autoYaw = 0;
    var simulationTime = 0;
    var lastFrame = 0;
    var animationFrame = 0;
    var loopVersion = 0;
    var lastPaintAt = 0;
    var loopWatchdog = 0;
    var sphereVisible = !("IntersectionObserver" in window);
    var sphereMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    var routes = [];
    var mesh = [];
    var nodes = [];

    function createRandom() {
      var seed = 20261010;
      return function () {
        seed |= 0;
        seed = seed + 0x6d2b79f5 | 0;
        var value = Math.imul(seed ^ seed >>> 15, 1 | seed);
        value = value + Math.imul(value ^ value >>> 7, 61 | value) ^ value;
        return ((value ^ value >>> 14) >>> 0) / 4294967296;
      };
    }

    var random = createRandom();
    var impactPalettes = [
      { glow: "255, 72, 82", core: "#ff4f59", ring: "#ffc0c5" }
    ];

    function range(minimum, maximum) {
      return minimum + (maximum - minimum) * random();
    }

    function clamp(value, minimum, maximum) {
      return Math.min(maximum, Math.max(minimum, value));
    }

    function smooth(start, end, value) {
      var progress = clamp((value - start) / (end - start), 0, 1);
      return progress * progress * (3 - 2 * progress);
    }

    function roundedRoute(points, curveRadius) {
      var result = [];
      var radiusValue = curveRadius || 0.08;

      function appendLine(from, to) {
        var count = Math.max(2, Math.ceil(Math.hypot(to[0] - from[0], to[1] - from[1]) / 0.035));
        for (var index = 0; index < count; index += 1) {
          var progress = index / count;
          result.push([
            from[0] + (to[0] - from[0]) * progress,
            from[1] + (to[1] - from[1]) * progress
          ]);
        }
      }

      var current = points[0];
      for (var pointIndex = 1; pointIndex < points.length - 1; pointIndex += 1) {
        var previous = points[pointIndex - 1];
        var pivot = points[pointIndex];
        var next = points[pointIndex + 1];
        var distanceBefore = Math.hypot(previous[0] - pivot[0], previous[1] - pivot[1]);
        var distanceAfter = Math.hypot(next[0] - pivot[0], next[1] - pivot[1]);
        var beforeRadius = Math.min(radiusValue, distanceBefore * 0.42);
        var afterRadius = Math.min(radiusValue, distanceAfter * 0.42);
        var before = [
          pivot[0] + (previous[0] - pivot[0]) * beforeRadius / distanceBefore,
          pivot[1] + (previous[1] - pivot[1]) * beforeRadius / distanceBefore
        ];
        var after = [
          pivot[0] + (next[0] - pivot[0]) * afterRadius / distanceAfter,
          pivot[1] + (next[1] - pivot[1]) * afterRadius / distanceAfter
        ];

        appendLine(current, before);
        for (var curveIndex = 0; curveIndex <= 7; curveIndex += 1) {
          var curveProgress = curveIndex / 7;
          var inverse = 1 - curveProgress;
          result.push([
            inverse * inverse * before[0] + 2 * inverse * curveProgress * pivot[0] + curveProgress * curveProgress * after[0],
            inverse * inverse * before[1] + 2 * inverse * curveProgress * pivot[1] + curveProgress * curveProgress * after[1]
          ]);
        }
        current = after;
      }

      appendLine(current, points[points.length - 1]);
      result.push(points[points.length - 1]);
      return result;
    }

    for (var latitudeIndex = 0; latitudeIndex < 14; latitudeIndex += 1) {
      var latitude = -1.21 + latitudeIndex * 0.15;
      var latitudePoints = [];
      for (var latitudeSample = 0; latitudeSample <= 155; latitudeSample += 1) {
        var longitude = -Math.PI + tau * latitudeSample / 155;
        latitudePoints.push([longitude, latitude + 0.018 * Math.sin(longitude * 3 + latitudeIndex * 0.78)]);
      }
      mesh.push({ points: latitudePoints, alpha: range(0.045, 0.1), width: range(0.5, 0.85) });
    }

    for (var longitudeIndex = 0; longitudeIndex < 15; longitudeIndex += 1) {
      var meridian = -Math.PI + longitudeIndex * tau / 18;
      var longitudePoints = [];
      for (var longitudeSample = 0; longitudeSample <= 95; longitudeSample += 1) {
        var meshLatitude = -1.42 + 2.84 * longitudeSample / 95;
        longitudePoints.push([meridian + 0.026 * Math.cos(3 * meshLatitude + longitudeIndex * 0.3), meshLatitude]);
      }
      mesh.push({ points: longitudePoints, alpha: range(0.035, 0.08), width: range(0.48, 0.8) });
    }

    for (var sweepIndex = 0; sweepIndex < 8; sweepIndex += 1) {
      var sweepLatitude = -1.2 + sweepIndex * 0.2;
      var sweepPoints = [];
      for (var sweepSample = 0; sweepSample <= 155; sweepSample += 1) {
        var sweepLongitude = -Math.PI + tau * sweepSample / 155;
        sweepPoints.push([sweepLongitude, sweepLatitude + 0.09 * Math.sin(sweepLongitude * 1.25 + sweepIndex * 0.67)]);
      }
      mesh.push({ points: sweepPoints, alpha: range(0.03, 0.07), width: range(0.55, 0.95) });
    }

    for (var routeIndex = 0; routeIndex < 66; routeIndex += 1) {
      var routeLongitude = range(-3, 3);
      var routeLatitude = range(-1.28, 1.28);
      var routePoints = [[routeLongitude, routeLatitude]];
      var routeCount = Math.floor(range(5, 13));
      var horizontal = random() < 0.5;
      var isSignalRoute = routeIndex % 3 === 1;

      for (var routePointIndex = 1; routePointIndex < routeCount; routePointIndex += 1) {
        var delta = range(0.12, 0.42) * (random() < 0.5 ? -1 : 1);
        if (horizontal) routeLongitude = clamp(routeLongitude + delta, -3.35, 3.35);
        else routeLatitude = clamp(routeLatitude + delta * 0.75, -1.41, 1.41);
        routePoints.push([routeLongitude, routeLatitude]);
        horizontal = !horizontal;
      }

      var samples = roundedRoute(routePoints, range(0.035, 0.1));
      var route = {
        points: samples,
        alpha: range(0.16, 0.42),
        width: range(0.66, 1.1),
        phase: random(),
        speed: range(0.18, 0.32),
        targets: []
      };
      routes.push(route);

      if (isSignalRoute || random() < 0.92) {
        var middleIndex = Math.floor(samples.length * range(0.2, 0.8));
        var middlePoint = samples[middleIndex];
        var middleNode = { longitude: middlePoint[0], latitude: middlePoint[1], size: range(1.4, 3.1), ring: isSignalRoute || random() < 0.68, opacity: range(0.45, 0.96) };
        nodes.push(middleNode);
        if (middleNode.ring) {
          route.targets.push({
            progress: middleIndex / (samples.length - 1),
            node: middleNode,
            colorIndex: (routeIndex + route.targets.length) % impactPalettes.length
          });
        }
      }
      if (isSignalRoute || random() < 0.65) {
        var endIndex = isSignalRoute ? Math.max(1, Math.floor(samples.length * 0.9)) : samples.length - 1;
        var endPoint = samples[endIndex];
        var endNode = { longitude: endPoint[0], latitude: endPoint[1], size: range(1.1, 2.45), ring: isSignalRoute || random() < 0.7, opacity: range(0.4, 0.82) };
        nodes.push(endNode);
        if (endNode.ring) {
          route.targets.push({
            progress: endIndex / (samples.length - 1),
            node: endNode,
            colorIndex: (routeIndex + route.targets.length) % impactPalettes.length
          });
        }
      }
    }

    for (var noiseIndex = 0; noiseIndex < 46; noiseIndex += 1) {
      nodes.push({ longitude: range(-Math.PI, Math.PI), latitude: range(-1.3, 1.3), size: range(0.65, 1.65), ring: random() < 0.35, opacity: range(0.18, 0.5) });
    }

    function resize() {
      var bounds = stage.getBoundingClientRect();
      width = Math.max(1, Number.isFinite(bounds.width) ? bounds.width : 1);
      height = Math.max(1, Number.isFinite(bounds.height) ? bounds.height : 1);
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.ceil(width * dpr);
      canvas.height = Math.ceil(height * dpr);
      canvas.style.width = width + "px";
      canvas.style.height = height + "px";
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      centerX = width * 0.52;
      centerY = height * 0.5;
      radius = Math.min(height * 0.435, width * 0.435);
    }

    function project(longitude, latitude) {
      var latitudeCosine = Math.cos(latitude);
      var x = Math.sin(longitude) * latitudeCosine;
      var y = Math.sin(latitude);
      var z = Math.cos(longitude) * latitudeCosine;
      var yawCosine = Math.cos(yaw);
      var yawSine = Math.sin(yaw);
      var pitchCosine = Math.cos(pitch);
      var pitchSine = Math.sin(pitch);
      var rollCosine = Math.cos(roll);
      var rollSine = Math.sin(roll);
      var previousX = x;
      var previousY = y;

      x = previousX * yawCosine + z * yawSine;
      z = -previousX * yawSine + z * yawCosine;
      y = previousY * pitchCosine - z * pitchSine;
      z = previousY * pitchSine + z * pitchCosine;
      previousX = x;
      previousY = y;
      x = previousX * rollCosine - previousY * rollSine;
      y = previousX * rollSine + previousY * rollCosine;

      var scale = 1 + z * 0.065;
      return { x: centerX + x * radius * scale, y: centerY + y * radius * scale, normalizedX: x, normalizedY: y, z: z };
    }

    function visibilityAt(point) {
      var boundary = -0.16 - 0.96 * point.normalizedY;
      var cut = smooth(boundary - 0.15, boundary + 0.12, point.normalizedX);
      var facing = smooth(-0.36, 0.14, point.z);
      return cut * facing;
    }

    function drawLine(line) {
      var points = line.points;
      var previous = project(points[0][0], points[0][1]);
      var previousAlpha = visibilityAt(previous);
      context.lineWidth = line.width;
      context.lineCap = "round";
      context.lineJoin = "round";
      context.strokeStyle = "#f8f8ff";
      context.globalAlpha = line.alpha;
      context.beginPath();
      var drawingSegment = false;

      for (var pointIndex = 1; pointIndex < points.length; pointIndex += 1) {
        var point = project(points[pointIndex][0], points[pointIndex][1]);
        var pointAlpha = visibilityAt(point);
        var visibleAlpha = Math.min(pointAlpha, previousAlpha);
        if (visibleAlpha > 0.027) {
          if (!drawingSegment) {
            context.moveTo(previous.x, previous.y);
            drawingSegment = true;
          }
          context.lineTo(point.x, point.y);
        } else {
          drawingSegment = false;
        }
        previous = point;
        previousAlpha = pointAlpha;
      }
      context.stroke();
    }

    function drawNodes() {
      context.strokeStyle = "#ffffff";
      context.fillStyle = "#ffffff";

      for (var nodeIndex = 0; nodeIndex < nodes.length; nodeIndex += 1) {
        var node = nodes[nodeIndex];
        var point = project(node.longitude, node.latitude);
        var nodeAlpha = visibilityAt(point) * node.opacity;
        if (nodeAlpha < 0.055) continue;
        context.globalAlpha = nodeAlpha;
        if (node.ring) {
          context.lineWidth = 0.95;
          context.beginPath();
          context.arc(point.x, point.y, node.size, 0, tau);
          context.stroke();
        } else {
          context.beginPath();
          context.arc(point.x, point.y, node.size * 0.72, 0, tau);
          context.fill();
        }
      }
    }

    function drawSignalImpact(target, pulseAge) {
      var node = target.node;
      var palette = impactPalettes[target.colorIndex % impactPalettes.length];
      var point = project(node.longitude, node.latitude);
      if (!Number.isFinite(point.x) || !Number.isFinite(point.y) || !Number.isFinite(radius)) return;
      var targetAlpha = visibilityAt(point) * node.opacity;
      if (targetAlpha < 0.055) return;

      var intensity = Math.pow(1 - pulseAge, 0.78);
      var coreSize = Math.max(node.size * 2.05, radius * 0.0054);
      var glowSize = Math.max(node.size * 7.2, radius * (0.03 + pulseAge * 0.042));
      var glow = context.createRadialGradient(point.x, point.y, 0, point.x, point.y, glowSize);
      glow.addColorStop(0, "rgba(" + palette.glow + ", " + (1 * intensity * targetAlpha) + ")");
      glow.addColorStop(0.18, "rgba(" + palette.glow + ", " + (0.72 * intensity * targetAlpha) + ")");
      glow.addColorStop(0.58, "rgba(" + palette.glow + ", " + (0.2 * intensity * targetAlpha) + ")");
      glow.addColorStop(1, "rgba(" + palette.glow + ", 0)");
      context.globalAlpha = 1;
      context.fillStyle = glow;
      context.beginPath();
      context.arc(point.x, point.y, glowSize, 0, tau);
      context.fill();

      context.globalAlpha = Math.min(1, 1.4 * intensity * targetAlpha);
      context.fillStyle = palette.core;
      context.beginPath();
      context.arc(point.x, point.y, coreSize, 0, tau);
      context.fill();

      context.globalAlpha = Math.min(1, 1.18 * intensity * targetAlpha);
      context.strokeStyle = palette.ring;
      context.lineWidth = Math.max(1.2, radius * 0.0024);
      context.beginPath();
      context.arc(point.x, point.y, Math.max(node.size * 2.1, radius * (0.009 + pulseAge * 0.032)), 0, tau);
      context.stroke();

      context.globalAlpha = 0.42 * intensity * targetAlpha;
      context.lineWidth = Math.max(0.8, radius * 0.00125);
      context.beginPath();
      context.arc(point.x, point.y, Math.max(node.size * 3.2, radius * (0.014 + pulseAge * 0.046)), 0, tau);
      context.stroke();
    }

    function drawSignals(time) {
      context.save();
      context.globalCompositeOperation = "screen";
      for (var routeIndex = 1; routeIndex < routes.length; routeIndex += 3) {
        var route = routes[routeIndex];
        var loopPhase = (route.phase + time * route.speed) % 1;
        var routeDirection = loopPhase < 0.5 ? 1 : -1;
        var travelProgress = loopPhase < 0.5 ? loopPhase * 2 : (1 - loopPhase) * 2;
        var routeProgress = travelProgress * (route.points.length - 1);
        var currentIndex = Math.floor(routeProgress);
        var nextIndex = Math.min(currentIndex + 1, route.points.length - 1);
        var segmentProgress = routeProgress - currentIndex;
        var previousPoint = project(route.points[currentIndex][0], route.points[currentIndex][1]);
        var nextPoint = project(route.points[nextIndex][0], route.points[nextIndex][1]);
        var point = {
          x: previousPoint.x + (nextPoint.x - previousPoint.x) * segmentProgress,
          y: previousPoint.y + (nextPoint.y - previousPoint.y) * segmentProgress,
          normalizedX: previousPoint.normalizedX + (nextPoint.normalizedX - previousPoint.normalizedX) * segmentProgress,
          normalizedY: previousPoint.normalizedY + (nextPoint.normalizedY - previousPoint.normalizedY) * segmentProgress,
          z: previousPoint.z + (nextPoint.z - previousPoint.z) * segmentProgress
        };
        if (!Number.isFinite(point.x) || !Number.isFinite(point.y) || !Number.isFinite(point.z) || !Number.isFinite(radius)) continue;
        var signalAlpha = visibilityAt(point);
        if (signalAlpha < 0.11) continue;
        var signalSize = radius * 0.026;
        if (!Number.isFinite(signalSize) || signalSize <= 0) continue;
        var signalGradient = context.createRadialGradient(point.x, point.y, 0, point.x, point.y, signalSize);
        signalGradient.addColorStop(0, "rgba(255, 255, 255, " + 0.95 * signalAlpha + ")");
        signalGradient.addColorStop(0.12, "rgba(255, 255, 255, " + 0.52 * signalAlpha + ")");
        signalGradient.addColorStop(0.38, "rgba(255, 255, 255, " + 0.14 * signalAlpha + ")");
        signalGradient.addColorStop(1, "rgba(255, 255, 255, 0)");
        context.globalAlpha = 1;
        context.fillStyle = signalGradient;
        context.beginPath();
        context.arc(point.x, point.y, signalSize, 0, tau);
        context.fill();
        context.globalAlpha = Math.min(1, 1.05 * signalAlpha);
        context.fillStyle = "#ffffff";
        context.beginPath();
        context.arc(point.x, point.y, Math.max(1.65, radius * 0.00325), 0, tau);
        context.fill();

        var normalizedProgress = routeProgress / (route.points.length - 1);
        var impactWindow = 0.13;
        for (var targetIndex = 0; targetIndex < route.targets.length; targetIndex += 1) {
          var target = route.targets[targetIndex];
          var pulseAge = routeDirection > 0
            ? normalizedProgress - target.progress
            : target.progress - normalizedProgress;
          if (pulseAge >= 0 && pulseAge < impactWindow) drawSignalImpact(target, pulseAge / impactWindow);
        }
      }
      context.restore();
    }

    function draw(now) {
      if (!Number.isFinite(now)) now = lastFrame || 0;
      var delta = lastFrame ? Math.min(50, now - lastFrame) : 16;
      lastFrame = now;
      autoYaw += delta * 0.00042;
      simulationTime += delta / 1000;
      yaw = 0.17 + autoYaw;
      pitch = -0.16 + Math.sin(autoYaw * 0.38) * 0.075;
      roll = -0.13 + Math.cos(autoYaw * 0.24) * 0.035;

      context.globalCompositeOperation = "source-over";
      context.globalAlpha = 1;
      context.fillStyle = "#000000";
      context.fillRect(0, 0, width, height);

      for (var meshIndex = 0; meshIndex < mesh.length; meshIndex += 1) drawLine(mesh[meshIndex]);
      for (var routeIndex = 0; routeIndex < routes.length; routeIndex += 1) drawLine(routes[routeIndex]);
      drawNodes();
      drawSignals(simulationTime);
      context.globalAlpha = 1;
    }

    function scheduleSphereFrame(version) {
      animationFrame = window.requestAnimationFrame(function (now) {
        animateSphere(now, version);
      });
    }

    function animateSphere(now, version) {
      if (version !== loopVersion) return;
      lastPaintAt = now;
      scheduleSphereFrame(version);
      draw(now);
    }

    function canAnimateSphere() {
      return sphereVisible && !document.hidden && !sphereMotionQuery.matches;
    }

    function ensureSphereWatchdog() {
      if (loopWatchdog) return;
      loopWatchdog = window.setInterval(keepSphereAlive, 360);
    }

    function clearSphereWatchdog() {
      if (!loopWatchdog) return;
      window.clearInterval(loopWatchdog);
      loopWatchdog = 0;
    }

    function startSphereLoop(forceRestart) {
      if (!canAnimateSphere()) {
        stopSphereLoop();
        return;
      }
      if (animationFrame && !forceRestart) return;
      loopVersion += 1;
      if (animationFrame) window.cancelAnimationFrame(animationFrame);
      animationFrame = 0;
      lastFrame = 0;
      lastPaintAt = window.performance.now();
      scheduleSphereFrame(loopVersion);
      ensureSphereWatchdog();
    }

    function stopSphereLoop() {
      loopVersion += 1;
      if (animationFrame) window.cancelAnimationFrame(animationFrame);
      animationFrame = 0;
      clearSphereWatchdog();
    }

    function keepSphereAlive() {
      if (!canAnimateSphere()) return;
      if (!animationFrame || window.performance.now() - lastPaintAt > 480) {
        startSphereLoop(true);
      }
    }

    function syncSphereMotion() {
      if (canAnimateSphere()) {
        startSphereLoop();
      } else {
        stopSphereLoop();
        draw(window.performance.now());
      }
    }

    window.addEventListener("resize", function () {
      resize();
      lastFrame = 0;
    }, { passive: true });
    window.addEventListener("pagehide", function () {
      stopSphereLoop();
    });
    window.addEventListener("pageshow", function () {
      startSphereLoop();
    });
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) {
        stopSphereLoop();
      } else {
        startSphereLoop();
      }
    });
    if (sphereMotionQuery.addEventListener) {
      sphereMotionQuery.addEventListener("change", syncSphereMotion);
    } else if (sphereMotionQuery.addListener) {
      sphereMotionQuery.addListener(syncSphereMotion);
    }

    resize();
    if ("IntersectionObserver" in window) {
      var sphereObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          sphereVisible = entry.isIntersecting;
          if (sphereVisible) {
            startSphereLoop();
          } else {
            stopSphereLoop();
          }
        });
      }, { rootMargin: "160px 0px", threshold: 0.01 });
      sphereObserver.observe(stage);
    } else {
      startSphereLoop();
    }
  }

  initWhenNear(
    document.querySelector("[data-forensic-signal-sphere]"),
    initForensicSignalSphere,
    "520px 0px"
  );

  function updateConsoleTime() {
    if (!consoleTime) return;
    var now = new Date();
    var hours = String(now.getHours()).padStart(2, "0");
    var minutes = String(now.getMinutes()).padStart(2, "0");
    var seconds = String(now.getSeconds()).padStart(2, "0");
    consoleTime.textContent = hours + ":" + minutes + ":" + seconds;
  }

  if (consoleTime) {
    var consoleTimeInterval = 0;

    function syncConsoleTime() {
      if (consoleTimeInterval) {
        window.clearInterval(consoleTimeInterval);
        consoleTimeInterval = 0;
      }
      if (document.hidden) return;
      updateConsoleTime();
      consoleTimeInterval = window.setInterval(updateConsoleTime, 1000);
    }

    syncConsoleTime();
    document.addEventListener("visibilitychange", syncConsoleTime);
    window.addEventListener("pagehide", function () {
      if (consoleTimeInterval) window.clearInterval(consoleTimeInterval);
    }, { once: true });
  }

  function initHalftoneHero() {
    var surfaces = document.querySelectorAll("[data-halftone-surface]");

    // En móvil conservamos el mismo arte, pero se dibuja una vez y nunca entra al bucle.
    var mobileStatic = window.matchMedia("(max-width: 760px)").matches;
    if (document.querySelector(".hero-eclipse-backdrop--desktop")) return;

    surfaces.forEach(function (hero) {
    var canvas = hero.querySelector("[data-halftone-canvas]");
    if (!canvas || !canvas.getContext) return;

    var context = canvas.getContext("2d", { alpha: false });
    if (!context) return;

    var motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    var reduced = motionQuery.matches;
    var width = 1;
    var height = 1;
    var scale = 1;
    var frame = 0;
    var visible = true;
    var pointerX = 0.74;
    var pointerY = 0.38;
    var targetX = pointerX;
    var targetY = pointerY;
    var lastPointerAt = -Infinity;
    var pointerInitialized = false;
    var lastPaintAt = 0;
    var dotBuckets = [[], [], [], [], [], [], []];
    var dotStyles = dotBuckets.map(function (_, index) {
      return "rgba(244,248,243," + (0.035 + index / 6 * 0.42).toFixed(3) + ")";
    });

    function clamp(value, min, max) {
      return Math.min(Math.max(value, min), max);
    }

    function randomAt(x, y) {
      var value = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
      return value - Math.floor(value);
    }

    function nebulaDensity(x, y, time, lightX, lightY) {
      var nx = x / width;
      var ny = y / height;
      var dx = (nx - 0.76) / 0.9;
      var dy = (ny - 0.39) / 1.08;
      var radius = Math.sqrt(dx * dx + dy * dy);
      var halo = Math.exp(-Math.pow(radius - 0.255, 2) / 0.018);
      var ribbonCenter = 0.79 - nx * 0.32 + Math.sin(nx * 6.1 + time * 0.00022) * 0.026;
      var ribbon = Math.exp(-Math.pow(ny - ribbonCenter, 2) / 0.011);
      var flow =
        Math.sin(nx * 14.2 - time * 0.0002) * 0.09 +
        Math.sin(ny * 18.8 + nx * 8.4 + time * 0.00015) * 0.07 +
        (randomAt(Math.floor(nx * 72), Math.floor(ny * 72)) - 0.5) * 0.18;
      var field = Math.max(halo * 0.98, ribbon * 0.34) * (0.65 + flow);
      var centerClear = Math.exp(-(((nx - 0.5) * (nx - 0.5)) / 0.12 + ((ny - 0.58) * (ny - 0.58)) / 0.095));
      var pointDx = x - lightX;
      var pointDy = y - lightY;
      var pointerLight = Math.exp(-(pointDx * pointDx + pointDy * pointDy) / Math.pow(Math.min(width, height) * 0.18, 2)) * 0.22;
      return clamp(field * (1 - centerClear * 0.76) + pointerLight, 0, 1);
    }

    function drawPlanet(time) {
      var minSide = Math.min(width, height);
      var planetX = width * (0.76 + Math.sin(time * 0.0001) * 0.009);
      var planetY = height * (0.39 + Math.cos(time * 0.00011) * 0.008);
      var radius = minSide * 0.18;
      var halo = context.createRadialGradient(planetX, planetY, radius * 0.72, planetX, planetY, radius * 1.78);

      halo.addColorStop(0, "rgba(244,248,243,0)");
      halo.addColorStop(0.62, "rgba(244,248,243,0.018)");
      halo.addColorStop(1, "rgba(244,248,243,0)");
      context.fillStyle = halo;
      context.fillRect(planetX - radius * 1.85, planetY - radius * 1.85, radius * 3.7, radius * 3.7);

      context.beginPath();
      context.arc(planetX, planetY, radius, 0, Math.PI * 2);
      context.fillStyle = "#020302";
      context.fill();

      context.save();
      context.clip();
      var dotStep = Math.max(8, Math.round(minSide / 92));
      for (var py = planetY - radius; py <= planetY + radius; py += dotStep) {
        for (var px = planetX - radius; px <= planetX + radius; px += dotStep) {
          var ox = px - planetX;
          var oy = py - planetY;
          var distance = Math.sqrt(ox * ox + oy * oy);
          if (distance > radius) continue;
          var edge = 1 - distance / radius;
          var light = clamp(0.66 - ox / radius * 0.8 - oy / radius * 0.12, 0, 1);
          var texture = randomAt(Math.floor(px / dotStep), Math.floor(py / dotStep));
          var strength = light * edge * (0.3 + texture * 0.7);
          if (strength < 0.1) continue;
          context.beginPath();
          context.arc(px, py, 0.45 + strength * dotStep * 0.3, 0, Math.PI * 2);
          context.fillStyle = "rgba(244,248,243," + (strength * 0.2).toFixed(3) + ")";
          context.fill();
        }
      }
      context.restore();

      context.beginPath();
      context.arc(planetX, planetY, radius, Math.PI * 0.65, Math.PI * 1.46);
      context.strokeStyle = "rgba(244,248,243,0.26)";
      context.lineWidth = 1;
      context.stroke();
    }

    function draw(time) {
      context.setTransform(scale, 0, 0, scale, 0, 0);
      context.clearRect(0, 0, width, height);
      context.fillStyle = "#020302";
      context.fillRect(0, 0, width, height);

      var isPointerRecent = performance.now() - lastPointerAt < 1500;
      var baseX = width * 0.76;
      var baseY = height * 0.39;
      var wantedX = isPointerRecent ? targetX : baseX;
      var wantedY = isPointerRecent ? targetY : baseY;
      pointerX += (wantedX - pointerX) * (reduced ? 1 : 0.045);
      pointerY += (wantedY - pointerY) * (reduced ? 1 : 0.045);

      var step = Math.max(9, Math.round(Math.min(width, height) / 90));
      context.globalCompositeOperation = "screen";
      dotBuckets.forEach(function (bucket) { bucket.length = 0; });
      for (var y = -step; y < height + step; y += step) {
        for (var x = -step; x < width + step; x += step) {
          var density = nebulaDensity(x + step * 0.5, y + step * 0.5, time, pointerX, pointerY);
          if (density < 0.075) continue;
          var bucketIndex = Math.min(6, Math.floor(density * 6));
          var quantized = bucketIndex / 6;
          var dotRadius = step * (0.08 + Math.pow(quantized, 0.66) * 0.48);
          dotBuckets[bucketIndex].push(x + step * 0.5, y + step * 0.5, dotRadius);
        }
      }
      dotBuckets.forEach(function (bucket, bucketIndex) {
        if (!bucket.length) return;
        context.beginPath();
        for (var index = 0; index < bucket.length; index += 3) {
          var dotX = bucket[index];
          var dotY = bucket[index + 1];
          var dotRadius = bucket[index + 2];
          context.moveTo(dotX + dotRadius, dotY);
          context.arc(dotX, dotY, dotRadius, 0, Math.PI * 2);
        }
        context.fillStyle = dotStyles[bucketIndex];
        context.fill();
      });
      context.globalCompositeOperation = "source-over";
      drawPlanet(time);

      var vignette = context.createRadialGradient(width * 0.5, height * 0.5, Math.min(width, height) * 0.22, width * 0.5, height * 0.5, Math.max(width, height) * 0.76);
      vignette.addColorStop(0, "rgba(2,3,2,0)");
      vignette.addColorStop(1, "rgba(2,3,2,0.56)");
      context.fillStyle = vignette;
      context.fillRect(0, 0, width, height);
    }

    function resize() {
      var bounds = hero.getBoundingClientRect();
      width = Math.max(1, Math.round(bounds.width));
      height = Math.max(1, Math.round(bounds.height));
      scale = mobileStatic ? 1 : Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(width * scale);
      canvas.height = Math.round(height * scale);
      if (!pointerInitialized) {
        pointerX = width * 0.76;
        pointerY = height * 0.39;
        targetX = pointerX;
        targetY = pointerY;
        pointerInitialized = true;
      }
      draw(mobileStatic ? 0 : performance.now());
    }

    if (mobileStatic) {
      var mobileResizeFrame = 0;
      window.addEventListener("resize", function () {
        if (mobileResizeFrame) window.cancelAnimationFrame(mobileResizeFrame);
        mobileResizeFrame = window.requestAnimationFrame(function () {
          mobileResizeFrame = 0;
          resize();
        });
      }, { passive: true });
      resize();
      return;
    }

    function tick(time) {
      frame = 0;
      var pointerActive = performance.now() - lastPointerAt < 1500;
      var frameInterval = pointerActive ? 32 : 80;
      if (time - lastPaintAt < frameInterval) {
        frame = window.requestAnimationFrame(tick);
        return;
      }
      lastPaintAt = time;
      draw(time);
      if (!reduced && visible && !document.hidden) {
        frame = window.requestAnimationFrame(tick);
      }
    }

    function wake() {
      if (!reduced && visible && !document.hidden && !frame) {
        frame = window.requestAnimationFrame(tick);
      }
    }

    function handlePointerMove(event) {
      var bounds = hero.getBoundingClientRect();
      targetX = clamp(event.clientX - bounds.left, 0, bounds.width);
      targetY = clamp(event.clientY - bounds.top, 0, bounds.height);
      lastPointerAt = performance.now();
      wake();
    }

    function syncMotion() {
      reduced = motionQuery.matches;
      if (reduced && frame) {
        window.cancelAnimationFrame(frame);
        frame = 0;
      }
      draw(performance.now());
      wake();
    }

    if ("IntersectionObserver" in window) {
      var observer = new IntersectionObserver(function (entries) {
        visible = entries.some(function (entry) { return entry.isIntersecting; });
        wake();
      }, { threshold: 0.02 });

      observer.observe(hero);
    }
    window.addEventListener("resize", resize);
    hero.addEventListener("pointermove", handlePointerMove, { passive: true });
    document.addEventListener("visibilitychange", wake);
    if (motionQuery.addEventListener) {
      motionQuery.addEventListener("change", syncMotion);
    } else if (motionQuery.addListener) {
      motionQuery.addListener(syncMotion);
    }
    resize();
    wake();
    });
  }

  initHalftoneHero();

  function initThreatNews() {
    var grid = document.getElementById("threatNewsGrid");
    var status = document.getElementById("threatNewsStatus");
    var newsFeedUrl = "https://api.rss2json.com/v1/api.json?rss_url=" + encodeURIComponent("https://thehackernews.com/feeds/posts/default?alt=rss");
    var cacheKey = "alcanox-real-cyber-news-v1";
    var refreshInterval = 45 * 60 * 1000;
    var newsLoaded = false;
    var newsInterval = 0;

    if (!grid || !("fetch" in window)) {
      return;
    }

    function setNewsStatus(message) {
      if (status) status.textContent = message;
    }

    function cleanText(value) {
      return String(value || "").replace(/\s+/g, " ").trim();
    }

    function createElement(tagName, className, text) {
      var element = document.createElement(tagName);
      if (className) {
        element.className = className;
      }
      if (text) {
        element.textContent = text;
      }
      return element;
    }

    function requestJson(url, options) {
      return window.fetch(url, options).then(function (response) {
        if (!response.ok) {
          throw new Error("Source unavailable: " + response.status);
        }
        return response.json();
      });
    }

    function formatTime() {
      return new Intl.DateTimeFormat(numberLocale, {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
      }).format(new Date());
    }

    function getArticleImage(article) {
      var enclosure = article && article.enclosure ? article.enclosure : {};
      var imageUrl = cleanText(article.thumbnail || enclosure.link);
      return /^https:\/\//i.test(imageUrl) ? imageUrl : "";
    }

    function newsItems(feed) {
      var items = feed && Array.isArray(feed.items) ? feed.items : [];

      return items.map(function (article) {
        var title = cleanText(article.title);
        var summary = cleanText(article.description || article.content);
        var image = getArticleImage(article);
        return {
          key: cleanText(article.guid || article.link || title),
          source: "THE HACKER NEWS",
          title: title,
          summary: summary,
          date: article.pubDate,
          url: cleanText(article.link),
          image: image
        };
      }).filter(function (article) {
        return article.title && article.url && article.image;
      });
    }

    var featuredNewsItem = {
      key: "marketscreener-openai-agent-hugging-face-2026-07-24",
      source: "MARKETSCREENER / REUTERS",
      title: isSpanish
        ? "Un agente de IA pasó días hackeando una empresa y OpenAI no lo detectó hasta una semana después"
        : "Its AI agent spent days hacking a company, but sources say OpenAI did not notice for a week",
      summary: isSpanish
        ? "Un reporte de Reuters describe el incidente de un agente autónomo que escapó de su entorno de prueba y atacó Hugging Face."
        : "A Reuters report describes an autonomous agent escaping its test environment and attacking Hugging Face.",
      date: "2026-07-24T18:12:00-04:00",
      url: "https://www.marketscreener.com/news/its-ai-agent-spent-days-hacking-a-company-but-sources-say-openai-did-not-notice-for-a-week-ce7f51dfd08bf325?utm_source=chatgpt.com",
      image: "https://cdn.zonebourse.com/static/resize/768/432//images/reuters/2026-07/2026-07-24T092107Z_1_LYNXMPEM6N0Q8_RTROPTP_4_OPENAI-AI.JPG"
    };

    var secondFeaturedNewsItem = {
      key: "ap-anthropic-ai-hacking-campaign-china",
      source: "AP NEWS",
      title: isSpanish
        ? "Anthropic alerta sobre una campaña de hackeo impulsada por IA vinculada a China"
        : "Anthropic warns of AI-driven hacking campaign linked to China",
      summary: isSpanish
        ? "Anthropic afirma que una operación vinculada al gobierno chino usó IA para automatizar ataques contra decenas de objetivos globales."
        : "Anthropic says a China-linked operation used AI to automate attacks against dozens of global targets.",
      date: "",
      url: "https://apnews.com/article/ai-cyber-china-hacking-artificial-intelligence-anthropic-4e7e5b1a7df946169c72c1df58f90295",
      image: "https://dims.apnews.com/dims4/default/07faa97/2147483647/strip/true/crop/7140x4760%2B0%2B0/resize/320x213%21/quality/90/?url=https%3A%2F%2Fassets.apnews.com%2F1b%2F64%2F4725b1813107d7c394f846b8113b%2F06ebc31734a9484cb88b512396e13e49"
    };

    var thirdFeaturedNewsItem = {
      key: "reuters-ai-agents-hacker-scores-sites-2026-10-19",
      source: "REUTERS",
      title: isSpanish
        ? "Un hacker usó agentes de IA y unos pocos miles de dólares para entrar en decenas de sitios"
        : "How one hacker used AI agents and a few thousand dollars to break into scores of sites",
      summary: isSpanish
        ? "Una investigación de Reuters describe cómo un atacante automatizó intrusiones contra más de 100 sitios con agentes de IA."
        : "A Reuters investigation describes an attacker automating intrusions against more than 100 sites with AI agents.",
      date: "2026-10-19T06:10:00-04:00",
      url: "https://www.reuters.com/legal/government/how-one-hacker-used-ai-agents-few-thousand-dollars-break-into-scores-sites-2026-10-19/",
      image: "https://content-media.investing.com/trkd-images/LYNXMPEM9I0SK_L.jpg"
    };

    var fourthFeaturedNewsItem = {
      key: "reuters-spanish-watchdog-ai-agent-data-breach-2026-09-15",
      source: "REUTERS",
      title: isSpanish
        ? "El organismo español de datos publica el primer informe de una brecha vinculada a un agente de IA"
        : "Spanish data watchdog publicises first AI agent-linked data breach report",
      summary: isSpanish
        ? "La AEPD recibió la primera notificación de una brecha presuntamente ejecutada por un agente de IA que modificó datos personales y accedió a facturas."
        : "Spain's data watchdog received its first reported personal-data breach allegedly carried out by an AI agent.",
      date: "2026-09-15T17:24:00-03:00",
      url: "https://www.reuters.com/business/spanish-data-watchdog-publicises-first-ai-agent-linked-data-breach-report-2026-09-15/",
      image: "https://www.reuters.com/resizer/v2/YTZRBUMD7VOOXD7SLZNT45FAAI.jpg?auth=c3b574b5fe3e1ffe4d69af16e25fe2c01ac50aae70057c2cf3002404ae51d5b4&width=1200&quality=80"
    };

    var fifthFeaturedNewsItem = {
      key: "europapress-slopoly-ai-ransomware-2026-03-16",
      source: "EUROPA PRESS",
      title: isSpanish
        ? "Slopoly, generado con IA, permitió a los hackers mantenerse en un servidor una semana en un ataque de ransomware"
        : "AI-generated Slopoly let hackers remain on a server for a week during a ransomware attack",
      summary: isSpanish
        ? "IBM X-Force detectó un script PowerShell generado con IA que mantuvo acceso persistente a un servidor durante una semana."
        : "IBM X-Force detected an AI-generated PowerShell script that kept persistent access to a server for a week.",
      date: "",
      url: "https://www.europapress.es/portaltic/ciberseguridad/noticia-slopoly-generado-ia-permitio-hackers-mantenerse-servidor-semana-ataque-ransomware-20260316163914.html",
      image: "https://img.europapress.es/fotoweb/fotonoticia_20260316163914_690.jpg"
    };

    var sixthFeaturedNewsItem = {
      key: "mcafee-ai-written-code-malware-2026-03-18",
      source: "MCAFEE LABS",
      title: isSpanish
        ? "Nuevo estudio: los hackers usan código escrito con IA para propagar malware"
        : "New Research: Hackers Are Using AI-Written Code to Spread Malware",
      summary: isSpanish
        ? "McAfee detectó una campaña de descargas falsas con código probablemente generado con IA para distribuir malware y criptomineros."
        : "McAfee uncovered a fake-download campaign using code likely generated with AI to spread malware and cryptominers.",
      date: "",
      url: "https://www.mcafee.com/blogs/internet-security/new-research-hackers-are-using-ai-written-code-to-spread-malware/",
      image: "https://www.mcafee.com/blogs/wp-content/uploads/2024/05/1000x540_Blog_062223.png"
    };

    var seventhFeaturedNewsItem = {
      key: "greynoise-ai-orchestrated-papercut-ng-mf",
      source: "GREYNOISE",
      title: isSpanish
        ? "Agentes fuera de control: una campaña global contra PaperCut NG/MF orquestada por IA"
        : "Agents Gone Wild: An AI-Orchestrated Global Campaign Against PaperCut NG/MF",
      summary: isSpanish
        ? "GreyNoise documenta cómo cientos de agentes de IA automatizaron la explotación de PaperCut y comprometieron al menos 440 instancias en 48 países."
        : "GreyNoise documents how hundreds of AI agents automated PaperCut exploitation and compromised at least 440 instances across 48 countries.",
      date: "",
      url: "https://www.greynoise.io/blog/ai-orchestrated-campaign-against-papercut-ng-mf",
      image: "https://cdn.prod.website-files.com/667dd40ebb8095e89f27565d/6aa085a7d9cb35bd70b042cc_GreyNoise-Blog-PaperCut-1600x900.png"
    };

    var eighthFeaturedNewsItem = {
      key: "aws-ai-augmented-fortigate-devices-2026-02-20",
      source: "AWS SECURITY BLOG",
      title: isSpanish
        ? "Un actor de amenazas aumentado por IA accede a dispositivos FortiGate a escala"
        : "AI-augmented threat actor accesses FortiGate devices at scale",
      summary: isSpanish
        ? "Amazon Threat Intelligence observó más de 600 dispositivos FortiGate comprometidos en 55 países mediante puertos expuestos y credenciales débiles."
        : "Amazon Threat Intelligence observed more than 600 FortiGate devices compromised across 55 countries through exposed ports and weak credentials.",
      date: "",
      url: "https://aws.amazon.com/es/blogs/security/ai-augmented-threat-actor-accesses-fortigate-devices-at-scale/",
      image: "https://s4.itho.me/sites/default/files/field/image/_m33rguy16c.jpg"
    };

    var featuredNewsItems = [featuredNewsItem, secondFeaturedNewsItem, thirdFeaturedNewsItem, fourthFeaturedNewsItem, fifthFeaturedNewsItem, sixthFeaturedNewsItem, seventhFeaturedNewsItem, eighthFeaturedNewsItem];

    function saveCachedItems(items) {
      try {
        window.localStorage.setItem(cacheKey, JSON.stringify({
          updatedAt: new Date().toISOString(),
          items: items.slice(0, 8)
        }));
      } catch (error) {
      }
    }

    function getCachedItems() {
      try {
        var cached = JSON.parse(window.localStorage.getItem(cacheKey) || "{}");
        return cached && Array.isArray(cached.items) ? cached.items : [];
      } catch (error) {
        return [];
      }
    }

    function renderEmpty(message) {
      grid.replaceChildren();
      grid.appendChild(createElement("p", "threat-news-empty", message));
    }

    function createCard(item, index) {
      var card = createElement("a", "threat-news-card");
      var media = createElement("div", "threat-news-card-media");
      var image = document.createElement("img");
      var header = createElement("div", "threat-news-card-header");
      var title = createElement("h3", "threat-news-card-title", item.title);
      var summary = createElement("p", "threat-news-card-summary", item.summary);
      var footer = createElement("div", "threat-news-card-footer");
      var action = createElement("span", "threat-news-action", isSpanish ? "VER ARTÍCULO" : "VIEW REPORT");
      var source = createElement("span", "threat-news-source", item.source);

      card.classList.add("is-news-variant-" + (index % 3));
      media.classList.add("is-image-loading");
      media.setAttribute("aria-busy", "true");
      card.href = item.url;
      card.target = "_blank";
      card.rel = "noopener noreferrer";
      card.setAttribute("aria-label", (isSpanish ? "Abrir artículo: " : "Open article: ") + item.title);
      image.src = item.image;
      image.alt = "";
      image.loading = "lazy";
      image.decoding = "async";
      image.addEventListener("load", function () {
        media.classList.remove("is-image-loading");
        media.setAttribute("aria-busy", "false");
      });
      image.addEventListener("error", function () {
        media.classList.remove("is-image-loading");
        media.removeAttribute("aria-busy");
        card.classList.add("has-missing-image");
      });

      header.appendChild(source);
      footer.appendChild(action);
      media.appendChild(image);
      card.appendChild(media);
      card.appendChild(header);
      card.appendChild(title);
      card.appendChild(summary);
      card.appendChild(footer);

      return card;
    }

    function renderItems(items) {
      grid.replaceChildren();
      items.slice(0, 8).forEach(function (item, index) {
        grid.appendChild(createCard(item, index));
      });
    }

    function loadNews() {
      setNewsStatus(isSpanish ? "CARGANDO INTELIGENCIA…" : "LOADING INTELLIGENCE…");

      requestJson(newsFeedUrl).then(function (feed) {
        var liveItems = newsItems(feed);
        if (!liveItems.length) {
          throw new Error(isSpanish ? "La fuente no devolvió artículos con imágenes." : "The source returned no articles with images.");
        }

        var items = featuredNewsItems.concat(liveItems.filter(function (item) {
          return !featuredNewsItems.some(function (featuredItem) {
            return item.key === featuredItem.key;
          });
        }));
        renderItems(items);
        saveCachedItems(items);
        setNewsStatus((isSpanish ? "ACTUALIZADO " : "UPDATED ") + formatTime());
      }).catch(function () {
        var cachedItems = getCachedItems();
        var fallbackItems = featuredNewsItems.concat(cachedItems.filter(function (item) {
          return !featuredNewsItems.some(function (featuredItem) {
            return item.key === featuredItem.key;
          });
        }));
        renderItems(fallbackItems);
        setNewsStatus(cachedItems.length
          ? (isSpanish ? "ÚLTIMA CARGA DISPONIBLE" : "LAST AVAILABLE LOAD")
          : "");
      });
    }

    function activateNews() {
      if (newsLoaded) return;
      newsLoaded = true;
      loadNews();
      newsInterval = window.setInterval(loadNews, refreshInterval);
    }

    var newsSection = grid.closest(".threat-news-section") || grid;
    if ("IntersectionObserver" in window) {
      var newsObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          activateNews();
          newsObserver.disconnect();
        });
      }, { rootMargin: "800px 0px", threshold: 0.01 });
      newsObserver.observe(newsSection);
    } else {
      activateNews();
    }

    window.addEventListener("pagehide", function () {
      if (newsInterval) window.clearInterval(newsInterval);
    }, { once: true });
  }

  initThreatNews();

  function initSpecialtyTree() {
    var section = document.querySelector("[data-specialty-tree]");
    var stage = section && section.querySelector(".capability-tree-stage");
    var canvas = stage && stage.querySelector(".capability-tree-canvas");
    if (!section || !stage || !canvas || !canvas.getContext) return;

    var context = canvas.getContext("2d");
    if (!context) return;

    var motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    var reduced = motionQuery.matches;
    var width = 1;
    var height = 1;
    var pixelRatio = 1;
    var started = false;
    var startedAt = 0;
    var frame = 0;
    var completed = false;

    var branches = [
      { target: [0.135, 0.205], controlA: [0.45, 0.45], controlB: [0.3, 0.22], bend: -1 },
      { target: [0.06, 0.485], controlA: [0.42, 0.52], controlB: [0.25, 0.43], bend: 1 },
      { target: [0.2, 0.78], controlA: [0.44, 0.59], controlB: [0.3, 0.71], bend: -1 },
      { target: [0.845, 0.205], controlA: [0.55, 0.45], controlB: [0.7, 0.22], bend: 1 },
      { target: [0.94, 0.49], controlA: [0.58, 0.52], controlB: [0.79, 0.43], bend: -1 },
      { target: [0.79, 0.78], controlA: [0.56, 0.59], controlB: [0.7, 0.71], bend: 1 }
    ];

    function clamp(value, min, max) {
      return Math.min(Math.max(value, min), max);
    }

    function easeOut(value) {
      return 1 - Math.pow(1 - clamp(value, 0, 1), 3);
    }

    function pointOnCurve(branch, t) {
      var startX = width * 0.5;
      var startY = height * 0.52;
      var aX = width * branch.controlA[0];
      var aY = height * branch.controlA[1];
      var bX = width * branch.controlB[0];
      var bY = height * branch.controlB[1];
      var endX = width * branch.target[0];
      var endY = height * branch.target[1];
      var inv = 1 - t;

      return {
        x: inv * inv * inv * startX + 3 * inv * inv * t * aX + 3 * inv * t * t * bX + t * t * t * endX,
        y: inv * inv * inv * startY + 3 * inv * inv * t * aY + 3 * inv * t * t * bY + t * t * t * endY
      };
    }

    function curveTangent(branch, t) {
      var before = pointOnCurve(branch, Math.max(0, t - 0.012));
      var after = pointOnCurve(branch, Math.min(1, t + 0.012));
      var x = after.x - before.x;
      var y = after.y - before.y;
      var length = Math.sqrt(x * x + y * y) || 1;
      return { x: x / length, y: y / length };
    }

    function drawFork(branch, at, size) {
      var point = pointOnCurve(branch, at);
      var tangent = curveTangent(branch, at);
      var normal = { x: -tangent.y * branch.bend, y: tangent.x * branch.bend };
      var endX = point.x + tangent.x * size * 0.52 + normal.x * size;
      var endY = point.y + tangent.y * size * 0.52 + normal.y * size;

      context.beginPath();
      context.moveTo(point.x, point.y);
      context.quadraticCurveTo(
        point.x + tangent.x * size * 0.22 + normal.x * size * 0.45,
        point.y + tangent.y * size * 0.22 + normal.y * size * 0.45,
        endX,
        endY
      );
      context.strokeStyle = "rgba(230, 236, 228, 0.22)";
      context.lineWidth = 0.72;
      context.stroke();
    }

    function drawBranch(branch, index, progress) {
      if (progress <= 0) return;

      var steps = 76;
      var visible = Math.max(1, Math.floor(steps * progress));
      var previous = pointOnCurve(branch, 0);

      context.beginPath();
      context.moveTo(previous.x, previous.y);
      for (var step = 1; step <= visible; step += 1) {
        var point = pointOnCurve(branch, step / steps);
        context.lineTo(point.x, point.y);
      }
      context.strokeStyle = "rgba(233, 239, 231, " + (0.28 + index * 0.012).toFixed(3) + ")";
      context.lineWidth = 1.15;
      context.stroke();

      context.beginPath();
      context.moveTo(previous.x, previous.y);
      for (var detail = 1; detail <= visible; detail += 1) {
        var detailedPoint = pointOnCurve(branch, detail / steps);
        context.lineTo(detailedPoint.x, detailedPoint.y);
      }
      context.strokeStyle = "rgba(249, 251, 247, 0.23)";
      context.lineWidth = 0.38;
      context.stroke();

      if (progress > 0.44) drawFork(branch, 0.39, Math.min(width, height) * 0.055);
      if (progress > 0.66) drawFork(branch, 0.62, Math.min(width, height) * 0.043);

      var tip = pointOnCurve(branch, Math.min(progress, 1));
      context.beginPath();
      context.arc(tip.x, tip.y, progress >= 0.98 ? 2.2 : 1.6, 0, Math.PI * 2);
      context.fillStyle = "rgba(246, 249, 243, " + (progress >= 0.98 ? "0.9" : "0.68") + ")";
      context.fill();
    }

    function draw(progress) {
      context.clearRect(0, 0, width, height);
      context.lineCap = "round";
      context.lineJoin = "round";

      branches.forEach(function (branch, index) {
        var localProgress = easeOut((progress - index * 0.075) / 0.56);
        drawBranch(branch, index, localProgress);
      });

      var centerX = width * 0.5;
      var centerY = height * 0.52;
      var glow = context.createRadialGradient(centerX, centerY, 0, centerX, centerY, Math.min(width, height) * 0.16);
      glow.addColorStop(0, "rgba(242, 247, 240, 0.14)");
      glow.addColorStop(1, "rgba(242, 247, 240, 0)");
      context.fillStyle = glow;
      context.fillRect(centerX - Math.min(width, height) * 0.2, centerY - Math.min(width, height) * 0.2, Math.min(width, height) * 0.4, Math.min(width, height) * 0.4);
    }

    function resize() {
      var bounds = stage.getBoundingClientRect();
      width = Math.max(1, Math.round(bounds.width));
      height = Math.max(1, Math.round(bounds.height));
      pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * pixelRatio);
      canvas.height = Math.round(height * pixelRatio);
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      draw(completed || reduced ? 1 : started ? clamp((window.performance.now() - startedAt) / 1550, 0, 1) : 0);
    }

    function finish() {
      completed = true;
      stage.classList.add("is-grown");
      draw(1);
    }

    function animate(now) {
      var progress = clamp((now - startedAt) / 1550, 0, 1);
      draw(progress);
      if (progress < 1) {
        frame = window.requestAnimationFrame(animate);
      } else {
        finish();
      }
    }

    function start() {
      window.cancelAnimationFrame(frame);
      stage.classList.remove("is-grown");
      completed = reduced;
      if (reduced) {
        finish();
        return;
      }
      started = true;
      startedAt = window.performance.now();
      frame = window.requestAnimationFrame(animate);
    }

    function restart() {
      if (!started && !reduced) return;
      start();
    }

    stage.addEventListener("click", restart);
    window.addEventListener("resize", resize);
    motionQuery.addEventListener("change", function (event) {
      reduced = event.matches;
      start();
    });

    resize();
    if (reduced || !("IntersectionObserver" in window)) {
      start();
      return;
    }

    var treeObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting || started) return;
        started = true;
        start();
        treeObserver.disconnect();
      });
    }, { threshold: 0.2 });

    treeObserver.observe(section);
  }

  function initPhosphorValidation() {
    var figure = document.getElementById("figure");
    if (!figure || figure.querySelector("svg")) return;
    import("https://esm.sh/@lucasmarkes/hairline")
      .then(function (mod) {
        if (mod && mod.phosphor && figure.isConnected && !figure.querySelector("svg")) {
          mod.phosphor(figure);
        }
      })
      .catch(function () {});
  }

  initWhenNear(document.getElementById("figure"), initPhosphorValidation, "360px 0px");

  initWhenNear(document.querySelector("[data-specialty-tree]"), initSpecialtyTree, "420px 0px");

  window.requestAnimationFrame(function () {
    document.body.classList.add("is-ready");
  });
})();

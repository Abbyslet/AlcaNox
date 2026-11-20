(function () {
  "use strict";

  var section = document.getElementById("garantia");
  var stage = section && section.querySelector(".result-guarantee-ocean-stage");
  var surface = stage && (stage.querySelector(".leensfish-showcase-visual") || stage);
  var canvas = stage && stage.querySelector("[data-guarantee-ocean]");
  var logo = stage && stage.querySelector("[data-guarantee-ocean-logo]");
  if (!section || !stage || !canvas) return;

  var vertexSource = [
    "precision highp float;",
    "attribute vec4 aGeom;",
    "attribute vec4 aWave;",
    "attribute vec2 aShade;",
    "uniform float uTime;",
    "uniform float uFlow;",
    "uniform float uForce;",
    "uniform float uPixelRatio;",
    "varying float vAlpha;",
    "varying float vAccent;",
    "void main() {",
    "  float x = aGeom.x;",
    "  float depth = aGeom.y;",
    "  float t = uTime * 0.38;",
    "  float longWave = sin(aGeom.w + t * 0.34 + uFlow * 1.15);",
    "  float crossWave = sin(aWave.x - t * 0.58 - uFlow * 1.65);",
    "  float fineWave = sin(aWave.y + t * 0.82 + uFlow * 2.4);",
    "  float swell = longWave * 0.58 + crossWave * 0.28 + fineWave * 0.14;",
    "  float front = 0.04 + fract(uFlow * 0.48) * 1.34;",
    "  float ringDistance = abs(aWave.w - front);",
    "  float ring = 1.0 - smoothstep(0.0, 0.065, ringDistance);",
    "  float wake = 1.0 - smoothstep(0.0, 0.22, ringDistance);",
    "  float screenY = aGeom.z - swell * (0.085 + depth * 0.058);",
    "  screenY -= uFlow * (0.08 + depth * 0.03);",
    "  screenY -= wake * uForce * aShade.y;",
    "  float screenX = x * (1.01 + depth * 0.12) + sign(x) * wake * uForce * 0.018;",
    "  gl_Position = vec4(screenX, 1.0 - screenY * 2.0, 0.0, 1.0);",
    "  float crest = max(0.0, longWave);",
    "  crest *= crest; crest *= crest; crest *= crest; crest *= crest;",
    "  float seam = max(0.0, sin(aWave.z - t * 0.57 + uFlow * 0.85));",
    "  seam *= seam; seam *= seam; seam *= seam; seam *= seam;",
    "  float sparkle = max(0.0, crossWave);",
    "  sparkle *= sparkle; sparkle *= sparkle; sparkle *= sparkle; sparkle *= sparkle;",
    "  vAlpha = (0.075 + crest * 0.48 + seam * 0.19 + sparkle * 0.11 + ring * uForce * 0.78) * aShade.x;",
    "  vAccent = clamp(ring * uForce * 1.35, 0.0, 1.0);",
    "  gl_PointSize = max(1.0, uPixelRatio * (1.05 + depth * 0.56 + crest * 0.42 + ring * uForce * 0.3));",
    "}"
  ].join("\n");
  var fragmentSource = [
    "precision mediump float;",
    "varying float vAlpha;",
    "varying float vAccent;",
    "void main() {",
    "  vec2 point = gl_PointCoord - vec2(0.5);",
    "  float disc = 1.0 - smoothstep(0.06, 0.26, dot(point, point));",
    "  vec3 brand = mix(vec3(0.443, 0.616, 0.345), vec3(0.843, 0.929, 0.667), gl_PointCoord.x);",
    "  vec3 color = mix(vec3(0.91), brand, vAccent);",
    "  gl_FragColor = vec4(color, vAlpha * disc);",
    "}"
  ].join("\n");

  var motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
  var gl = null;
  var context2d = null;
  var program = null;
  var buffer = null;
  var uniforms = null;
  var count = 0;
  var frame = 0;
  var lastPaint = 0;
  var elapsed = 0;
  var visualScroll = 0;
  var lastTargetScroll = 0;
  var lastScrollAt = 0;
  var surge = 0;
  var inView = false;
  var disposed = false;
  var width = 0;
  var height = 0;
  var pixelRatio = 1;
  var sectionTop = 0;
  var quality = 1;
  var slowFrames = 0;
  var resizeObserver = null;
  var intersectionObserver = null;
  var lastLogoOpacity = -1;
  var lastLogoScale = -1;
  var initialized = false;

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function compile(type, source) {
    var shader = gl.createShader(type);
    if (!shader) return null;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }

  function releaseGraphics() {
    if (!gl) return;
    if (buffer) gl.deleteBuffer(buffer);
    if (program) gl.deleteProgram(program);
    buffer = null;
    program = null;
    uniforms = null;
  }

  function measureSection() {
    var bounds = section.getBoundingClientRect();
    sectionTop = window.scrollY + bounds.top;
  }

  function scrollFlow(scrollPosition) {
    return Math.max(0, (scrollPosition - sectionTop + window.innerHeight) / Math.max(1, window.innerHeight));
  }

  function smoothstep(start, end, value) {
    var fraction = clamp((value - start) / (end - start), 0, 1);
    return fraction * fraction * (3 - 2 * fraction);
  }

  function updateLogo(flow) {
    if (!logo) return;
    var reveal = motionPreference.matches ? 0.7 : smoothstep(0.18, 1.14, flow);
    var opacity = reveal * 0.19 + (motionPreference.matches ? 0 : surge * reveal * 0.02);
    var scale = 0.95 + reveal * 0.06 + (motionPreference.matches ? 0 : surge * 0.012);
    if (Math.abs(opacity - lastLogoOpacity) > 0.001) {
      logo.style.opacity = opacity.toFixed(3);
      lastLogoOpacity = opacity;
    }
    if (Math.abs(scale - lastLogoScale) > 0.001) {
      logo.style.transform = "translate3d(-50%, -50%, 0) scale(" + scale.toFixed(3) + ")";
      lastLogoScale = scale;
    }
  }

  function rebuildGrid() {
    if (!gl || !buffer) return;
    var baseColumns = width < 700
      ? clamp(Math.round(width * 0.62), 190, 260)
      : clamp(Math.round(width * 0.26), 300, 430);
    var baseRows = width < 700 ? 120 : clamp(Math.round(height * 0.23), 150, 195);
    var columns = Math.max(160, Math.round(baseColumns * quality));
    var rows = Math.max(90, Math.round(baseRows * quality));
    count = columns * rows;
    var grid = new Float32Array(count * 10);
    var offset = 0;
    for (var row = 0; row < rows; row++) {
      var depth = row / (rows - 1);
      var baseY = 0.22 + Math.pow(depth, 1.12) * 0.86;
      var depthFade = 1 - smoothstep(0.55, 1.02, depth) * 0.76;
      for (var column = 0; column < columns; column++) {
        var x = (column / (columns - 1) * 2 - 1) * 1.12;
        var seed = Math.sin(x * 127.1 + depth * 311.7) * 43758.5453;
        seed -= Math.floor(seed);
        grid[offset++] = x;
        grid[offset++] = depth;
        grid[offset++] = baseY;
        grid[offset++] = x * 5.2 + depth * 8.5 + Math.sin(x * 2.3 + depth * 3.1) * 0.7;
        grid[offset++] = x * 10.8 - depth * 12.4;
        grid[offset++] = x * 18.1 + depth * 27;
        grid[offset++] = x * 8.4 + depth * 17;
        grid[offset++] = Math.hypot(x * 0.86, (depth - 0.48) * 1.62);
        grid[offset++] = depthFade * (0.62 + seed * 0.64);
        grid[offset++] = 0.025 + 0.012 * Math.sin(x * 6);
      }
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, grid, gl.STATIC_DRAW);
  }

  function paintFallback(time, flow) {
    if (!context2d) return;
    var ctx = context2d;
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    var columns = Math.min(160, Math.round(width * 0.32));
    var rows = 70;
    var t = time * 0.38;
    var cycle = flow * 0.48 % 1;
    var force = Math.sin(cycle * Math.PI) * surge;
    var front = 0.04 + cycle * 1.34;
    for (var row = 0; row < rows; row++) {
      var depth = row / (rows - 1);
      for (var column = 0; column < columns; column++) {
        var x = (column / (columns - 1) * 2 - 1) * 1.12;
        var longWave = Math.sin(x * 5.2 + depth * 8.5 + t * 0.34 + Math.sin(x * 2.3 + depth * 3.1) * 0.7 + flow * 1.15);
        var crossWave = Math.sin(x * 10.8 - depth * 12.4 - t * 0.58 - flow * 1.65);
        var fineWave = Math.sin(x * 18.1 + depth * 27 + t * 0.82 + flow * 2.4);
        var swell = longWave * 0.58 + crossWave * 0.28 + fineWave * 0.14;
        var radius = Math.hypot(x * 0.86, (depth - 0.48) * 1.62);
        var ring = Math.exp(-Math.pow((radius - front) * 24, 2));
        var wake = Math.exp(-Math.pow((radius - front) * 7, 2));
        var y = 0.22 + Math.pow(depth, 1.12) * 0.86 - swell * (0.085 + depth * 0.058) - flow * (0.08 + depth * 0.03) - wake * force * (0.025 + 0.012 * Math.sin(x * 6));
        var crest = Math.pow(Math.max(0, longWave), 15);
        var seam = Math.pow(Math.max(0, Math.sin(x * 8.4 + depth * 17 - t * 0.57 + flow * 0.85)), 22);
        var brightness = (0.075 + crest * 0.48 + seam * 0.19 + ring * force * 0.78) * (1 - clamp((depth - 0.55) / 0.47, 0, 1) * 0.76);
        var screenX = x * (1.01 + depth * 0.12) + Math.sign(x) * wake * force * 0.018;
        var accent = clamp(ring * force * 1.35, 0, 1);
        var red = Math.round(232 + (154 - 232) * accent);
        var green = Math.round(232 + (191 - 232) * accent);
        var blue = Math.round(232 + (115 - 232) * accent);
        ctx.fillStyle = "rgba(" + red + "," + green + "," + blue + "," + brightness.toFixed(3) + ")";
        ctx.fillRect((screenX * 0.5 + 0.5) * canvas.width, y * canvas.height, pixelRatio, pixelRatio);
      }
    }
    if (canvas.style.visibility !== "visible") canvas.style.visibility = "visible";
  }

  function paint(time, flow) {
    if (disposed) return;
    updateLogo(scrollFlow(visualScroll));
    if (!canvas.width || !canvas.height) return;
    if (!gl || !program || !uniforms || !buffer) {
      paintFallback(time, flow);
      return;
    }
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(program);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.uniform1f(uniforms.time, time);
    gl.uniform1f(uniforms.flow, flow);
    gl.uniform1f(uniforms.force, Math.sin((flow * 0.48 % 1) * Math.PI) * surge);
    gl.uniform1f(uniforms.pixelRatio, pixelRatio);
    gl.drawArrays(gl.POINTS, 0, count);
    if (canvas.style.visibility !== "visible") canvas.style.visibility = "visible";
  }

  function resize() {
    if (disposed) return;
    measureSection();
    var bounds = surface.getBoundingClientRect();
    var nextWidth = Math.max(1, Math.round(bounds.width));
    var nextHeight = Math.max(1, Math.round(bounds.height));
    var ratio = clamp(Math.min(
      window.devicePixelRatio || 1,
      nextWidth < 700 ? 1.2 : 1.35,
      Math.sqrt(2600000 / (nextWidth * nextHeight))
    ), 0.5, 1.35);
    if (canvas.width === Math.round(nextWidth * ratio) && canvas.height === Math.round(nextHeight * ratio) && (count || context2d)) return;
    width = nextWidth;
    height = nextHeight;
    pixelRatio = ratio;
    canvas.width = Math.round(width * pixelRatio);
    canvas.height = Math.round(height * pixelRatio);
    visualScroll = window.scrollY;
    lastTargetScroll = visualScroll;
    surge = 0;
    rebuildGrid();
    paint(elapsed, motionPreference.matches ? 0 : scrollFlow(visualScroll));
  }

  function tick(timestamp) {
    if (disposed || !inView || document.hidden || motionPreference.matches) return;
    frame = window.requestAnimationFrame(tick);
    var targetScroll = window.scrollY;
    var interacting = timestamp - lastScrollAt < 240 || Math.abs(targetScroll - visualScroll) > 0.5 || surge > 0.02;
    if (timestamp - lastPaint < (interacting && gl ? 15 : 32)) return;
    if (interacting && gl && lastPaint && timestamp - lastPaint > 27) slowFrames += 1;
    else slowFrames = Math.max(0, slowFrames - 2);
    if (slowFrames >= 8 && quality > 0.55) {
      quality = quality === 1 ? 0.75 : 0.55;
      slowFrames = 0;
      rebuildGrid();
    }
    var dt = lastPaint ? clamp((timestamp - lastPaint) * 0.001, 0.001, 0.05) : 1 / 60;
    var impulse = clamp(Math.abs(targetScroll - lastTargetScroll) / Math.max(1, window.innerHeight * 0.12), 0, 1);
    surge = Math.max(surge * Math.exp(-dt * 5.8), impulse);
    visualScroll += (targetScroll - visualScroll) * (1 - Math.exp(-dt * 38));
    if (Math.abs(targetScroll - visualScroll) < 0.3) visualScroll = targetScroll;
    lastTargetScroll = targetScroll;
    elapsed += dt;
    lastPaint = timestamp;
    paint(elapsed, scrollFlow(visualScroll));
  }

  function sync() {
    if (frame) window.cancelAnimationFrame(frame);
    frame = 0;
    if (disposed || !inView || document.hidden) return;
    visualScroll = window.scrollY;
    lastTargetScroll = visualScroll;
    surge = 0;
    if (motionPreference.matches) {
      paint(elapsed, 0);
      return;
    }
    lastPaint = 0;
    frame = window.requestAnimationFrame(tick);
  }

  function onScroll() {
    lastScrollAt = performance.now();
  }

  function initialize() {
    if (disposed || initialized) return;
    initialized = true;
    gl = canvas.getContext("webgl", {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      powerPreference: surface.clientWidth < 700 ? "low-power" : "high-performance",
      preserveDrawingBuffer: false
    });
    if (!gl) {
      context2d = canvas.getContext("2d", { alpha: false });
      resize();
      sync();
      return;
    }
    var vertex = compile(gl.VERTEX_SHADER, vertexSource);
    var fragment = compile(gl.FRAGMENT_SHADER, fragmentSource);
    if (!vertex || !fragment) {
      if (vertex) gl.deleteShader(vertex);
      if (fragment) gl.deleteShader(fragment);
      return;
    }
    program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
    gl.deleteShader(vertex);
    gl.deleteShader(fragment);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      releaseGraphics();
      return;
    }
    buffer = gl.createBuffer();
    if (!buffer) {
      releaseGraphics();
      return;
    }
    gl.useProgram(program);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    var geometry = gl.getAttribLocation(program, "aGeom");
    var waves = gl.getAttribLocation(program, "aWave");
    var shade = gl.getAttribLocation(program, "aShade");
    gl.enableVertexAttribArray(geometry);
    gl.vertexAttribPointer(geometry, 4, gl.FLOAT, false, 40, 0);
    gl.enableVertexAttribArray(waves);
    gl.vertexAttribPointer(waves, 4, gl.FLOAT, false, 40, 16);
    gl.enableVertexAttribArray(shade);
    gl.vertexAttribPointer(shade, 2, gl.FLOAT, false, 40, 32);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
    uniforms = {
      time: gl.getUniformLocation(program, "uTime"),
      flow: gl.getUniformLocation(program, "uFlow"),
      force: gl.getUniformLocation(program, "uForce"),
      pixelRatio: gl.getUniformLocation(program, "uPixelRatio")
    };
    count = 0;
    resize();
    sync();
  }

  if ("ResizeObserver" in window) {
    resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(surface);
    resizeObserver.observe(section);
  } else {
    window.addEventListener("resize", resize, { passive: true });
  }
  if ("IntersectionObserver" in window) {
    intersectionObserver = new IntersectionObserver(function (entries) {
      inView = entries[0].isIntersecting;
      if (inView) initialize();
      sync();
    }, { rootMargin: "100px 0px" });
    intersectionObserver.observe(section);
  } else {
    inView = true;
    initialize();
  }
  document.addEventListener("visibilitychange", sync);
  motionPreference.addEventListener("change", sync);
  window.addEventListener("scroll", onScroll, { passive: true });
  canvas.addEventListener("webglcontextlost", function (event) {
    event.preventDefault();
    if (frame) window.cancelAnimationFrame(frame);
    frame = 0;
    gl = null;
    program = null;
    buffer = null;
    uniforms = null;
    initialized = false;
  });
  canvas.addEventListener("webglcontextrestored", initialize);
  function onPageShow() {
    measureSection();
    sync();
  }
  window.addEventListener("load", measureSection, { once: true });
  window.addEventListener("pageshow", onPageShow);
  window.addEventListener("pagehide", function (event) {
    if (event.persisted) {
      if (frame) window.cancelAnimationFrame(frame);
      frame = 0;
      return;
    }
    disposed = true;
    if (frame) window.cancelAnimationFrame(frame);
    if (resizeObserver) resizeObserver.disconnect();
    else window.removeEventListener("resize", resize);
    if (intersectionObserver) intersectionObserver.disconnect();
    document.removeEventListener("visibilitychange", sync);
    motionPreference.removeEventListener("change", sync);
    window.removeEventListener("scroll", onScroll);
    window.removeEventListener("pageshow", onPageShow);
    window.removeEventListener("load", measureSection);
    releaseGraphics();
  });
})();

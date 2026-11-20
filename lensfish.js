(() => {
  const canvas = document.getElementById('formationCanvas');
  const experience = document.getElementById('experience');
  const wordmark = document.getElementById('wordmark');
  const timelineFill = document.getElementById('timelineFill');
  const sceneIndex = document.getElementById('sceneIndex');
  const sceneLabel = document.getElementById('sceneLabel');
  const replayButton = document.getElementById('replayButton');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  if (!canvas || !canvas.getContext || reducedMotion.matches) {
    replayButton?.setAttribute('hidden', '');
    return;
  }

  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) return;

  const logo = new Image();
  const siteRoot = document.documentElement.getAttribute('data-site-root') || '';
  logo.src = `${siteRoot}assets/lensfish-logo.png`;
  const duration = 12200;
  let logoTiles = [];
  let wordTiles = [];
  let width = 0;
  let height = 0;
  let startedAt = 0;
  let frame = 0;
  const pointer = { x: -1000, y: -1000, targetX: -1000, targetY: -1000, active: false, power: 0 };

  const clamp = (value, a = 0, b = 1) => Math.max(a, Math.min(b, value));
  const smooth = (value) => {
    const t = clamp(value);
    return t * t * (3 - 2 * t);
  };
  function resize() {
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    makeLogoTiles();
    makeWordTiles();
  }

  function makeLogoTiles() {
    const columns = 76;
    const rows = 63;
    const mask = document.createElement('canvas');
    mask.width = columns;
    mask.height = rows;
    const mctx = mask.getContext('2d', { willReadFrequently: true });
    mctx.clearRect(0, 0, columns, rows);
    mctx.drawImage(logo, 0, 0, columns, rows);
    const pixels = mctx.getImageData(0, 0, columns, rows).data;
    const displayWidth = Math.min(width * (width < 700 ? .79 : .48), 580);
    const step = displayWidth / columns;
    const left = (width - displayWidth) / 2;
    const top = (height - rows * step) / 2 - (height > 700 ? 8 : 0);
    const tiles = [];

    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < columns; x++) {
        const offset = (y * columns + x) * 4;
        if (pixels[offset + 3] < 72) continue;
        const shade = Math.round(155 + pixels[offset + 1] / 255 * 85);
        tiles.push({
          x: left + x * step,
          y: top + y * step,
          size: Math.max(2, step * .79),
          color: `rgb(${shade} ${shade} ${shade})`,
          entryY: height / 2 - (top + y * step),
          depth: clamp((y - 17) / (rows - 17)),
          horizontal: x / columns,
          delay: x / columns * .22 + (1 - y / rows) * .16,
          leaveDelay: (1 - y / rows) * .15,
        });
      }
    }
    logoTiles = tiles;
  }

  function makeWordTiles() {
    const mask = document.createElement('canvas');
    mask.width = 720;
    mask.height = 156;
    const mctx = mask.getContext('2d', { willReadFrequently: true });
    mctx.fillStyle = '#fff';
    mctx.font = '800 106px "Plus Jakarta Sans", Arial, sans-serif';
    mctx.textAlign = 'center';
    mctx.textBaseline = 'middle';
    mctx.fillText('LeensFish', 360, 77);
    const pixels = mctx.getImageData(0, 0, 720, 156).data;
    const scale = Math.min(width * .93 / 720, 1.35);
    wordmark.style.fontSize = `${(106 * scale).toFixed(2)}px`;
    const left = (width - 720 * scale) / 2;
    const top = (height - 156 * scale) / 2;
    const tiles = [];

    for (let y = 0; y < 156; y += 7) {
      for (let x = 0; x < 720; x += 7) {
        const index = (y * 720 + x) * 4;
        if (pixels[index + 3] < 100) continue;
        tiles.push({
          x: left + x * scale,
          y: top + y * scale,
          size: Math.max(2, 5.9 * scale),
          color: '#e1e1e1',
          entryY: Math.max(12, 29 * scale),
          delay: x / 720 * .30 + (1 - y / 156) * .07,
          leaveDelay: 0,
        });
      }
    }
    wordTiles = tiles;
  }

  function drawTiles(tiles, formation, dispersal, opacity, collapse = false, time = 0) {
    if (opacity <= 0) return;
    const living = collapse
      ? smooth((time - 1850) / 500) * (1 - smooth((time - 6220) / 520))
      : 0;
    for (const tile of tiles) {
      const formed = smooth((formation - tile.delay) / .62);
      const leaving = smooth((dispersal - tile.leaveDelay) / .60);
      const alpha = opacity * formed * (1 - leaving);
      if (alpha < .018) continue;
      let x = tile.x;
      let y = tile.y + tile.entryY * (1 - formed) + (collapse ? tile.entryY * leaving : 0);
      if (living > 0 && tile.depth > 0) {
        const depth = tile.depth;
        const phase = time * .0027 + depth * 4.4 + tile.horizontal * 8.2;
        const reach = Math.min(width * .026, 16) * depth * depth * living;
        x += Math.sin(phase) * reach;
        y += Math.cos(phase * .75 + tile.horizontal * 3) * reach * .22;

        if (pointer.power > .01) {
          const distanceX = x - pointer.x;
          const distanceY = y - pointer.y;
          const distance = Math.hypot(distanceX, distanceY) || 1;
          const radius = Math.min(width * .33, 170);
          const contact = Math.pow(clamp(1 - distance / radius), 2) * pointer.power * depth;
          x += distanceX / distance * contact * Math.min(width * .065, 29);
          y += distanceY / distance * contact * Math.min(width * .036, 16);
        }
      }
      const size = tile.size * (.58 + .42 * formed);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = tile.color;
      ctx.fillRect(x, y, size, size);
    }
    ctx.globalAlpha = 1;
  }

  function drawTransitionLine(time) {
    const appear = smooth((time - 6520) / 340);
    const disappear = smooth((time - 7670) / 300);
    const strength = appear * (1 - disappear);
    if (strength <= 0) return;
    const length = Math.min(width * .58, 670) * strength;
    ctx.fillStyle = `rgba(205, 205, 205, ${(.7 * strength).toFixed(3)})`;
    ctx.fillRect((width - length) / 2, height / 2, length, 1);
  }

  function render(timestamp) {
    if (!startedAt) startedAt = timestamp;
    const time = (timestamp - startedAt) % duration;
    const logoFormation = clamp((time - 180) / 2000);
    const logoDispersal = clamp((time - 6450) / 1000);
    const wordFormation = clamp((time - 7330) / 1650);
    const wordDispersal = clamp((time - 11660) / 540);
    const cleanWord = smooth((time - 9250) / 550);
    const wordExit = smooth((time - 11660) / 540);

    ctx.clearRect(0, 0, width, height);
    pointer.x += (pointer.targetX - pointer.x) * .16;
    pointer.y += (pointer.targetY - pointer.y) * .16;
    pointer.power += ((pointer.active ? 1 : 0) - pointer.power) * .11;
    drawTiles(logoTiles, logoFormation, logoDispersal, 1, true, time);
    drawTransitionLine(time);
    drawTiles(wordTiles, wordFormation, wordDispersal, 1 - cleanWord);
    wordmark.style.opacity = (cleanWord * (1 - wordExit)).toFixed(3);

    const onWord = time >= 7470 && time < 11660;
    sceneIndex.textContent = onWord ? '02' : '01';
    sceneLabel.textContent = onWord ? 'LENSFISH' : 'SÍMBOLO';
    timelineFill.style.width = `${(time / duration * 100).toFixed(2)}%`;
    frame = requestAnimationFrame(render);
  }

  replayButton.addEventListener('click', () => { startedAt = 0; });
  canvas.addEventListener('pointermove', (event) => {
    const bounds = canvas.getBoundingClientRect();
    pointer.targetX = event.clientX - bounds.left;
    pointer.targetY = event.clientY - bounds.top;
    pointer.active = true;
  });
  canvas.addEventListener('pointerleave', () => { pointer.active = false; });
  canvas.addEventListener('pointercancel', () => { pointer.active = false; });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) cancelAnimationFrame(frame);
    else { startedAt = 0; frame = requestAnimationFrame(render); }
  });
  window.addEventListener('resize', resize, { passive: true });

  Promise.all([
    logo.decode ? logo.decode() : new Promise((resolve) => { logo.onload = resolve; }),
    document.fonts ? document.fonts.ready : Promise.resolve(),
  ]).then(() => {
    resize();
    experience.classList.add('is-animated');
    frame = requestAnimationFrame(render);
  }).catch(() => {
    replayButton.setAttribute('hidden', '');
  });
})();

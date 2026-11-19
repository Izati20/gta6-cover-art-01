// Neon Leonida Cover Studio — poster painting engine.
//
// Everything in this file draws with the 2D canvas API and nothing else:
// no network, no fonts to fetch, no Rockstar artwork. A poster is a state
// object (size, collage, grade, words, one photo slot per panel) and
// paintPoster() turns that state into pixels on any canvas.
//
// A slot holds either a photo or nothing. An empty slot is not left blank:
// it gets a small painted Leonida scene (ringed sun, glitter sea, causeway,
// palm silhouettes) so the cover always looks finished.

export const SIZES = [
  { id: 'square', label: 'Square 1080 × 1080', w: 1080, h: 1080 },
  { id: 'portrait', label: 'Portrait 1080 × 1350', w: 1080, h: 1350 },
  { id: 'wide', label: 'Wide 1920 × 1080', w: 1920, h: 1080 },
];

export const GRADES = [
  {
    id: 'sunset', label: 'Vice Sunset',
    sky: ['#ffd23c', '#ff7a3c', '#ef2c76', '#5b1a5e'],
    sun: '#ffe9a8', sunRing: 'rgba(255, 210, 60, 0.55)',
    sea: ['#7b2a6e', '#2a1050'], sand: '#3a1c4d',
    wash: 'rgba(239, 44, 118, 0.20)', washTop: 'rgba(255, 122, 60, 0.16)',
    accent: '#ffd23c', ink: '#1d0a2e', band: '#12081f',
  },
  {
    id: 'neon', label: 'Neon Nights',
    sky: ['#00e5ff', '#7b2ff7', '#ff2e88', '#12082e'],
    sun: '#ff7ad9', sunRing: 'rgba(0, 229, 255, 0.55)',
    sea: ['#3b1a8a', '#0d0620'], sand: '#1c0b3d',
    wash: 'rgba(123, 47, 247, 0.22)', washTop: 'rgba(0, 229, 255, 0.14)',
    accent: '#00e5ff', ink: '#0a0616', band: '#0a0616',
  },
  {
    id: 'teal', label: 'Teal Dawn',
    sky: ['#fff3b0', '#a8e6cf', '#2fd4c4', '#0f4c5c'],
    sun: '#fffbe0', sunRing: 'rgba(255, 243, 176, 0.6)',
    sea: ['#2a9d8f', '#083344'], sand: '#0c3a3a',
    wash: 'rgba(47, 212, 196, 0.16)', washTop: 'rgba(255, 243, 176, 0.14)',
    accent: '#ffd23c', ink: '#082a30', band: '#082a30',
  },
  {
    id: 'gold', label: 'Golden Hour',
    sky: ['#fff7d6', '#ffe29a', '#ff9e2c', '#b3541e'],
    sun: '#fffbe8', sunRing: 'rgba(255, 226, 154, 0.6)',
    sea: ['#c96f2e', '#3a1c0d'], sand: '#4a2410',
    wash: 'rgba(255, 158, 44, 0.18)', washTop: 'rgba(255, 247, 214, 0.16)',
    accent: '#ff7a3c', ink: '#2e1503', band: '#2e1503',
  },
  {
    id: 'noir', label: 'Midnight Noir',
    sky: ['#8f8fb8', '#3a3a5e', '#141428', '#05050a'],
    sun: '#e8e8f0', sunRing: 'rgba(232, 232, 240, 0.4)',
    sea: ['#1c1c30', '#05050a'], sand: '#101018',
    wash: 'rgba(20, 20, 40, 0.30)', washTop: 'rgba(143, 143, 184, 0.12)',
    accent: '#e8e8f0', ink: '#05050a', band: '#05050a',
  },
];

// A collage is a function from the poster's pixel size to a list of panel
// rectangles, each in the form { x, y, w, h }. Panel 0 is always the hero:
// the biggest rectangle, the one a "hero" photo lands in.
export const LAYOUTS = [
  {
    id: 'saga', label: 'Saga Wall',
    cells(w, h) {
      const rail = w * 0.58, rows = 5, rh = h / rows;
      const out = [{ x: 0, y: 0, w: rail, h }];
      for (let i = 0; i < rows; i += 1) out.push({ x: rail, y: i * rh, w: w - rail, h: rh });
      return out;
    },
  },
  {
    id: 'duo', label: 'Lead Duo',
    cells(w, h) {
      const top = h * 0.62;
      return [
        { x: 0, y: 0, w, h: top },
        { x: 0, y: top, w: w / 2, h: h - top },
        { x: w / 2, y: top, w: w / 2, h: h - top },
      ];
    },
  },
  {
    id: 'bands', label: 'Sunset Bands',
    cells(w, h) {
      const third = h / 3;
      return [
        { x: 0, y: 0, w, h: third },
        { x: 0, y: third, w, h: third },
        { x: 0, y: third * 2, w, h: h - third * 2 },
      ];
    },
  },
  {
    id: 'grid', label: 'Six Frame Grid',
    cells(w, h) {
      const out = [];
      for (let r = 0; r < 2; r += 1) {
        for (let c = 0; c < 3; c += 1) {
          out.push({ x: (c * w) / 3, y: (r * h) / 2, w: w / 3, h: h / 2 });
        }
      }
      return out;
    },
  },
  {
    id: 'solo', label: 'Main Character',
    cells(w, h) {
      const side = w * 0.2;
      return [
        { x: side, y: 0, w: w - side * 2, h },
        { x: 0, y: 0, w: side, h },
        { x: w - side, y: 0, w: side, h },
      ];
    },
  },
];

export const FRAMES = [
  { id: 'none', label: 'No frame' },
  { id: 'line', label: 'Thin line' },
  { id: 'poster', label: 'Poster border' },
];

export const DEFAULT_WORDS = {
  kicker: 'LEONIDA · GOLDEN HOUR',
  title: 'NEON\nLEONIDA',
  subtitle: 'VICE CITY HEAT',
};

function lookup(table, id, fallbackIndex = 0) {
  return table.find((row) => row.id === id) ?? table[fallbackIndex];
}

export function sizeOf(id) { return lookup(SIZES, id); }
export function gradeOf(id) { return lookup(GRADES, id); }
export function layoutOf(id) { return lookup(LAYOUTS, id); }

export function emptySlot() {
  return { image: null, name: '', zoom: 1, shiftX: 0, shiftY: 0, anchor: 0.5 };
}

export function blankPoster() {
  return {
    size: 'portrait',
    layout: 'saga',
    grade: 'sunset',
    frame: 'poster',
    grain: true,
    kicker: DEFAULT_WORDS.kicker,
    title: DEFAULT_WORDS.title,
    subtitle: DEFAULT_WORDS.subtitle,
    slots: Array.from({ length: 6 }, () => emptySlot()),
    active: 0,
  };
}

// Keep the slot list exactly as long as the current collage needs, carrying
// photos across when the layout changes.
export function fitSlots(state) {
  const want = layoutOf(state.layout).cells(100, 100).length;
  while (state.slots.length < want) state.slots.push(emptySlot());
  state.slots.length = want;
  if (state.active >= want) state.active = 0;
  return state;
}

export function panelCells(state) {
  const size = sizeOf(state.size);
  return layoutOf(state.layout).cells(size.w, size.h);
}

// Small deterministic generator so the painted scenes and the grain look
// the same on every render of the same poster.
export function seededRandom(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function clipRect(ctx, r) {
  ctx.beginPath();
  ctx.rect(r.x, r.y, r.w, r.h);
  ctx.clip();
}

function drawPalm(ctx, baseX, baseY, tall, lean, dark) {
  ctx.strokeStyle = dark;
  ctx.fillStyle = dark;
  ctx.lineWidth = Math.max(2, tall * 0.03);
  ctx.lineCap = 'round';
  const topX = baseX + lean;
  const topY = baseY - tall;
  ctx.beginPath();
  ctx.moveTo(baseX, baseY);
  ctx.quadraticCurveTo(baseX + lean * 0.4, baseY - tall * 0.55, topX, topY);
  ctx.stroke();
  ctx.lineWidth = Math.max(1.5, tall * 0.018);
  for (let i = 0; i < 7; i += 1) {
    const spread = -Math.PI * (0.08 + (i * 0.14));
    const reach = tall * (0.34 + (i % 3) * 0.05);
    const endX = topX + Math.cos(spread) * reach;
    const endY = topY + Math.sin(spread) * reach * 0.55 + tall * 0.1;
    ctx.beginPath();
    ctx.moveTo(topX, topY);
    ctx.quadraticCurveTo(
      topX + Math.cos(spread) * reach * 0.5,
      topY + Math.sin(spread) * reach * 0.28 - tall * 0.06,
      endX, endY,
    );
    ctx.stroke();
  }
}

// The painted Leonida scene for an empty panel: gradient sky, a ringed sun
// sitting on the horizon, a glittering sea, a causeway running out to it,
// and two palm silhouettes framing the view.
function paintEmptyPanel(ctx, r, grade, seed) {
  const rnd = seededRandom(seed * 7919 + 13);
  const horizon = r.y + r.h * 0.58;
  const sky = ctx.createLinearGradient(0, r.y, 0, horizon);
  grade.sky.forEach((stop, i) => sky.addColorStop(i / (grade.sky.length - 1), stop));
  ctx.fillStyle = sky;
  ctx.fillRect(r.x, r.y, r.w, horizon - r.y);

  const sunR = Math.min(r.w, r.h) * 0.17;
  const sunX = r.x + r.w * (0.3 + rnd() * 0.4);
  const sunY = horizon - sunR * 0.35;
  ctx.strokeStyle = grade.sunRing;
  ctx.lineWidth = Math.max(1.5, sunR * 0.05);
  for (let ring = 2; ring >= 0; ring -= 1) {
    ctx.beginPath();
    ctx.arc(sunX, sunY, sunR * (1 + ring * 0.28), 0, Math.PI * 2);
    ctx.stroke();
  }
  const glow = ctx.createRadialGradient(sunX, sunY, sunR * 0.2, sunX, sunY, sunR * 2.4);
  glow.addColorStop(0, grade.sun);
  glow.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.globalAlpha = 0.5;
  ctx.fillStyle = glow;
  ctx.fillRect(r.x, r.y, r.w, horizon - r.y);
  ctx.globalAlpha = 1;
  ctx.fillStyle = grade.sun;
  ctx.beginPath();
  ctx.arc(sunX, sunY, sunR, 0, Math.PI * 2);
  ctx.fill();

  const sea = ctx.createLinearGradient(0, horizon, 0, r.y + r.h);
  grade.sea.forEach((stop, i) => sea.addColorStop(i / (grade.sea.length - 1), stop));
  ctx.fillStyle = sea;
  ctx.fillRect(r.x, horizon, r.w, r.y + r.h - horizon);

  // Glitter on the water: short bright dashes under the sun.
  ctx.fillStyle = grade.sun;
  for (let i = 0; i < 46; i += 1) {
    const gx = sunX + (rnd() - 0.5) * r.w * 0.55 * (0.4 + rnd());
    const gy = horizon + rnd() * (r.y + r.h - horizon) * 0.85;
    const gw = 4 + rnd() * Math.min(46, r.w * 0.05);
    ctx.globalAlpha = 0.12 + rnd() * 0.5;
    ctx.fillRect(gx - gw / 2, gy, gw, Math.max(1, r.h * 0.003));
  }
  ctx.globalAlpha = 1;

  // Causeway: a dark road narrowing toward the horizon, centre dashes.
  const roadTop = Math.min(r.w * 0.1, 26);
  const roadBottom = Math.min(r.w * 0.42, 190);
  const cx = r.x + r.w * 0.5;
  ctx.fillStyle = grade.sand;
  ctx.beginPath();
  ctx.moveTo(cx - roadTop / 2, horizon);
  ctx.lineTo(cx + roadTop / 2, horizon);
  ctx.lineTo(cx + roadBottom / 2, r.y + r.h);
  ctx.lineTo(cx - roadBottom / 2, r.y + r.h);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = grade.sun;
  for (let i = 0; i < 5; i += 1) {
    const t = (i + 0.5) / 5;
    const y = horizon + (r.y + r.h - horizon) * t;
    const half = (roadTop / 2 + (roadBottom / 2 - roadTop / 2) * t) * 0.12;
    ctx.globalAlpha = 0.85;
    ctx.fillRect(cx - half, y, half * 2, Math.max(2, r.h * 0.008));
  }
  ctx.globalAlpha = 1;

  const dark = 'rgba(10, 4, 22, 0.88)';
  drawPalm(ctx, r.x + r.w * 0.1, r.y + r.h * 0.99, r.h * 0.34, r.w * 0.05, dark);
  drawPalm(ctx, r.x + r.w * 0.92, r.y + r.h * 0.99, r.h * 0.28, -r.w * 0.04, dark);
}

// Cover-fit a photo into a panel, honouring zoom, drag shifts and the
// vertical anchor (0 shows the top of the photo, 1 the bottom).
function paintPhotoInto(ctx, r, slot) {
  const img = slot.image;
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  const scale = Math.max(r.w / iw, r.h / ih) * slot.zoom;
  const dw = iw * scale;
  const dh = ih * scale;
  let x = r.x + (r.w - dw) / 2 + slot.shiftX;
  let y = r.y + (r.h - dh) * slot.anchor + slot.shiftY;
  const maxX = Math.max(0, (dw - r.w) / 2);
  const maxY = Math.max(0, (dh - r.h) / 2);
  x = Math.min(r.x + maxX, Math.max(r.x - maxX, x));
  y = Math.min(r.y + maxY, Math.max(r.y - maxY, y));
  ctx.drawImage(img, x, y, dw, dh);
}

function paintTint(ctx, w, h, grade) {
  const wash = ctx.createLinearGradient(0, 0, 0, h);
  wash.addColorStop(0, grade.washTop);
  wash.addColorStop(0.55, 'rgba(0, 0, 0, 0)');
  wash.addColorStop(1, grade.wash);
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, w, h);
  const vig = ctx.createRadialGradient(w / 2, h * 0.42, Math.min(w, h) * 0.42, w / 2, h / 2, Math.max(w, h) * 0.75);
  vig.addColorStop(0, 'rgba(0, 0, 0, 0)');
  vig.addColorStop(1, 'rgba(5, 2, 12, 0.34)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, w, h);
}

// The lettering: kicker in tracked-out capitals, the title stacked in heavy
// capitals with a hard offset shadow, and a solid subtitle bar along the
// bottom edge — sitting just above the frame band, never underneath it.
// All type is a system font stack — no licensed typeface.
function paintLettering(ctx, w, h, bottomEdge, state, grade) {
  const lines = state.title.split('\n').map((line) => line.trim()).filter(Boolean);
  const pad = w * 0.045;
  const barH = Math.round(h * 0.052);
  const barTop = bottomEdge - barH;
  const titleSize = Math.min(w * 0.115, (bottomEdge - barH) * 0.19);
  const family = '"Arial Black", "Segoe UI", system-ui, sans-serif';

  ctx.textBaseline = 'alphabetic';
  let fontPx = titleSize;
  ctx.font = `900 ${fontPx}px ${family}`;
  while (fontPx > w * 0.05 && Math.max(...lines.map((line) => ctx.measureText(line).width)) > w - pad * 2) {
    fontPx *= 0.94;
    ctx.font = `900 ${fontPx}px ${family}`;
  }
  const lineH = fontPx * 0.94;
  const blockH = lineH * lines.length;
  const kickerPx = Math.max(15, Math.round(w * 0.024));
  const kickerY = barTop - blockH - kickerPx * 1.5;

  // A soft dark shelf behind the words so they read over any photo.
  const shelf = ctx.createLinearGradient(0, kickerY - kickerPx * 1.6, 0, barTop);
  shelf.addColorStop(0, 'rgba(8, 3, 18, 0)');
  shelf.addColorStop(0.35, 'rgba(8, 3, 18, 0.55)');
  shelf.addColorStop(1, 'rgba(8, 3, 18, 0.78)');
  ctx.fillStyle = shelf;
  ctx.fillRect(0, kickerY - kickerPx * 1.6, w, barTop - (kickerY - kickerPx * 1.6));

  ctx.fillStyle = grade.accent;
  ctx.font = `800 ${kickerPx}px ${family}`;
  try { ctx.letterSpacing = `${Math.round(kickerPx * 0.28)}px`; } catch { /* older canvas: no tracking */ }
  ctx.fillText(state.kicker, pad, kickerY);
  try { ctx.letterSpacing = '0px'; } catch { /* ignore */ }

  // Accent rule under the kicker.
  ctx.fillRect(pad, kickerY + kickerPx * 0.55, Math.min(w * 0.22, 220), Math.max(3, w * 0.004));

  ctx.font = `900 ${fontPx}px ${family}`;
  lines.forEach((line, i) => {
    const y = kickerY + kickerPx * 1.9 + lineH * (i + 1) - fontPx * 0.18;
    ctx.fillStyle = 'rgba(8, 3, 18, 0.85)';
    ctx.fillText(line, pad + fontPx * 0.045, y + fontPx * 0.045);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(line, pad, y);
  });

  // Subtitle bar pinned just above the frame band.
  ctx.fillStyle = grade.band;
  ctx.fillRect(0, barTop, w, barH);
  ctx.fillStyle = grade.accent;
  ctx.fillRect(0, barTop, w, Math.max(2, barH * 0.08));
  ctx.fillStyle = '#ffffff';
  const subPx = Math.max(14, Math.round(barH * 0.42));
  ctx.font = `800 ${subPx}px ${family}`;
  try { ctx.letterSpacing = `${Math.round(subPx * 0.22)}px`; } catch { /* ignore */ }
  ctx.textAlign = 'center';
  ctx.fillText(state.subtitle, w / 2, barTop + barH / 2 + subPx * 0.36);
  ctx.textAlign = 'left';
  try { ctx.letterSpacing = '0px'; } catch { /* ignore */ }
}

function paintBorder(ctx, w, h, frame) {
  if (frame === 'none') return;
  if (frame === 'line') {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.lineWidth = Math.max(2, w * 0.003);
    ctx.strokeRect(ctx.lineWidth, ctx.lineWidth, w - ctx.lineWidth * 2, h - ctx.lineWidth * 2);
    return;
  }
  const band = Math.round(w * 0.028);
  ctx.fillStyle = '#0a0616';
  ctx.fillRect(0, 0, w, band);
  ctx.fillRect(0, h - band, w, band);
  ctx.fillRect(0, 0, band, h);
  ctx.fillRect(w - band, 0, band, h);
  ctx.strokeStyle = 'rgba(255, 210, 60, 0.9)';
  ctx.lineWidth = Math.max(2, w * 0.002);
  ctx.strokeRect(band * 1.6, band * 1.6, w - band * 3.2, h - band * 3.2);
}

function paintSpeckle(ctx, w, h) {
  const rnd = seededRandom(20261119);
  const count = Math.floor((w * h) / 1100);
  for (let i = 0; i < count; i += 1) {
    const v = rnd();
    ctx.fillStyle = v > 0.5 ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.06)';
    ctx.fillRect(rnd() * w, rnd() * h, 1.4, 1.4);
  }
}

// Paint the whole poster onto `canvas`, resizing the canvas to the state's
// export size first. Returns the canvas.
export function paintPoster(canvas, state) {
  const size = sizeOf(state.size);
  const grade = gradeOf(state.grade);
  fitSlots(state);
  canvas.width = size.w;
  canvas.height = size.h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;
  const cells = layoutOf(state.layout).cells(size.w, size.h);
  const gap = Math.max(4, Math.round(size.w * 0.007));

  ctx.fillStyle = '#0a0616';
  ctx.fillRect(0, 0, size.w, size.h);
  cells.forEach((cell, i) => {
    const inset = {
      x: cell.x + (cell.x > 0 ? gap / 2 : 0),
      y: cell.y + (cell.y > 0 ? gap / 2 : 0),
      w: cell.w - (cell.x > 0 ? gap / 2 : 0) - (cell.x + cell.w < size.w ? gap / 2 : 0),
      h: cell.h - (cell.y > 0 ? gap / 2 : 0) - (cell.y + cell.h < size.h ? gap / 2 : 0),
    };
    ctx.save();
    clipRect(ctx, inset);
    const slot = state.slots[i];
    if (slot && slot.image) paintPhotoInto(ctx, inset, slot);
    else paintEmptyPanel(ctx, inset, grade, i + 1);
    ctx.restore();
  });

  paintTint(ctx, size.w, size.h, grade);
  // The frame band occupies the poster's bottom strip; the lettering ends
  // above it so the subtitle bar is never painted over.
  const frameInset = state.frame === 'poster'
    ? Math.round(size.w * 0.028)
    : state.frame === 'line' ? Math.max(2, size.w * 0.003) : 0;
  paintLettering(ctx, size.w, size.h, size.h - frameInset, state, grade);
  paintBorder(ctx, size.w, size.h, state.frame);
  if (state.grain) paintSpeckle(ctx, size.w, size.h);
  return canvas;
}

// Which panel, if any, contains a point given in canvas pixels.
export function panelAt(state, px, py) {
  const cells = panelCells(state);
  return cells.findIndex((c) => px >= c.x && px < c.x + c.w && py >= c.y && py < c.y + c.h);
}

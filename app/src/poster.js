// Neon Leonida Cover Studio — poster engine.
//
// One canvas, one job: paint a multi-panel Leonida poster at any size.
// The same function draws the live preview and the exported PNG, so what
// you see is exactly what you post. Panels are cut from the canvas by
// fraction, photos are cover-fit into them with a per-panel crop, empty
// panels get a painted Leonida scene (ringed sun, glitter sea, causeway,
// palms), and the grade washes the whole thing in sunset or neon light.
// Lettering is drawn with system fonts only — nothing borrowed.

export const EXPORT_SIZES = {
  square: { id: 'square', label: 'Square 1080 x 1080', w: 1080, h: 1080 },
  portrait: { id: 'portrait', label: 'Portrait 1080 x 1350', w: 1080, h: 1350 },
  wide: { id: 'wide', label: 'Wide 1920 x 1080', w: 1920, h: 1080 },
};

// A panel is a fraction of the canvas. `tilt` rotates an inset panel a
// couple of degrees for the taped-on snapshot feel; `lead` marks the panel
// the poster is built around. Order matters: later panels paint on top.
export const POSTER_LAYOUTS = [
  {
    id: 'saga',
    name: 'Saga Wall',
    note: 'A wide sky band over a hero flanked by moments.',
    panels: [
      { x: 0, y: 0, w: 1, h: 0.24 },
      { x: 0, y: 0.24, w: 0.32, h: 0.38 },
      { x: 0.32, y: 0.24, w: 0.36, h: 0.76, lead: true },
      { x: 0.68, y: 0.24, w: 0.32, h: 0.38 },
      { x: 0, y: 0.62, w: 0.32, h: 0.38 },
      { x: 0.68, y: 0.62, w: 0.32, h: 0.38 },
    ],
  },
  {
    id: 'duo',
    name: 'Lead Duo',
    note: 'Two leads, one sky, a slanted seam between them.',
    panels: [
      { x: 0, y: 0, w: 1, h: 0.22 },
      { x: 0, y: 0.22, w: 0.52, h: 0.78, lead: true, tilt: -0.02 },
      { x: 0.48, y: 0.22, w: 0.52, h: 0.78, lead: true },
    ],
  },
  {
    id: 'bands',
    name: 'Sunset Bands',
    note: 'Three cinema bands, made for the wide frame.',
    panels: [
      { x: 0, y: 0, w: 1, h: 0.36 },
      { x: 0, y: 0.36, w: 1, h: 0.28 },
      { x: 0, y: 0.64, w: 1, h: 0.36, lead: true },
    ],
  },
  {
    id: 'grid',
    name: 'Six Frame Grid',
    note: 'A tidy three-by-two wall of moments.',
    panels: [
      { x: 0, y: 0, w: 0.34, h: 0.5 },
      { x: 0.34, y: 0, w: 0.33, h: 0.5 },
      { x: 0.67, y: 0, w: 0.33, h: 0.5 },
      { x: 0, y: 0.5, w: 0.34, h: 0.5 },
      { x: 0.34, y: 0.5, w: 0.33, h: 0.5, lead: true },
      { x: 0.67, y: 0.5, w: 0.33, h: 0.5 },
    ],
  },
  {
    id: 'hero',
    name: 'Main Character',
    note: 'One full-bleed lead, two taped-on snapshots.',
    panels: [
      { x: 0, y: 0, w: 1, h: 1, lead: true },
      { x: 0.05, y: 0.63, w: 0.28, h: 0.3, inset: true, tilt: -0.035 },
      { x: 0.67, y: 0.63, w: 0.28, h: 0.3, inset: true, tilt: 0.035 },
    ],
  },
];

export function findLayout(id) {
  return POSTER_LAYOUTS.find((item) => item.id === id) ?? POSTER_LAYOUTS[0];
}

/** Fraction panels turned into pixel rects on a w-by-h canvas. */
export function measurePanels(layout, w, h) {
  return layout.panels.map((p) => ({
    x: Math.round(p.x * w),
    y: Math.round(p.y * h),
    w: Math.round(p.w * w),
    h: Math.round(p.h * h),
    lead: !!p.lead,
    inset: !!p.inset,
    tilt: p.tilt ?? 0,
  }));
}

// --------------------------------------------------------------- colour work
// A grade is a canvas filter for the photos plus two translucent washes:
// a coloured light that falls from the top and a warm one that rises from
// the bottom, then a vignette that seats every panel in the poster.
export const LEONIDA_GRADES = [
  {
    id: 'sunset',
    name: 'Vice Sunset',
    filter: 'saturate(1.3) contrast(1.08) brightness(1.04)',
    washes: [
      { top: [255, 130, 70], bottom: [235, 45, 115], topA: 0.1, bottomA: 0.5, blend: 'overlay' },
      { top: [58, 14, 88], bottom: [58, 14, 88], topA: 0.15, bottomA: 0, blend: 'source-over' },
    ],
    sky: ['#2b1154', '#8d2a8e', '#ef5d7a', '#ffab5e'],
    sea: '#0d5d6e',
    sun: '#ffd97a',
  },
  {
    id: 'neon',
    name: 'Neon Nights',
    filter: 'saturate(1.38) contrast(1.15) brightness(1)',
    washes: [
      { top: [20, 195, 215], bottom: [255, 40, 140], topA: 0.2, bottomA: 0.32, blend: 'soft-light' },
      { top: [12, 6, 40], bottom: [12, 6, 40], topA: 0.22, bottomA: 0.04, blend: 'source-over' },
    ],
    sky: ['#070418', '#221052', '#5b1668', '#a1176b'],
    sea: '#0a2e4a',
    sun: '#ff4fa0',
  },
  {
    id: 'teal',
    name: 'Teal Dawn',
    filter: 'saturate(1.14) contrast(1.06) brightness(1.07)',
    washes: [
      { top: [22, 165, 165], bottom: [255, 160, 85], topA: 0.16, bottomA: 0.28, blend: 'overlay' },
      { top: [6, 52, 64], bottom: [6, 52, 64], topA: 0.1, bottomA: 0, blend: 'source-over' },
    ],
    sky: ['#083b4c', '#0e6e7e', '#3fae9d', '#ffd9a0'],
    sea: '#083f52',
    sun: '#ffe9b0',
  },
  {
    id: 'gold',
    name: 'Golden Hour',
    filter: 'saturate(1.2) contrast(1.05) brightness(1.09) sepia(0.24)',
    washes: [
      { top: [255, 178, 86], bottom: [214, 84, 52], topA: 0.12, bottomA: 0.32, blend: 'overlay' },
    ],
    sky: ['#3a1c50', '#a03d63', '#f07f4f', '#ffc46b'],
    sea: '#14586a',
    sun: '#fff0b8',
  },
  {
    id: 'noir',
    name: 'Midnight Noir',
    filter: 'saturate(0.3) contrast(1.24) brightness(0.95)',
    washes: [
      { top: [8, 8, 18], bottom: [8, 8, 18], topA: 0.2, bottomA: 0.3, blend: 'source-over' },
      { top: [70, 130, 180], bottom: [70, 130, 180], topA: 0.07, bottomA: 0.07, blend: 'soft-light' },
    ],
    sky: ['#05050c', '#141428', '#2c2c48', '#565670'],
    sea: '#101018',
    sun: '#d8d8e8',
  },
];

export function findGrade(id) {
  return LEONIDA_GRADES.find((item) => item.id === id) ?? LEONIDA_GRADES[0];
}

function paintChannels(rgb, alpha) {
  return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`;
}

// A small deterministic generator (mulberry32) so a poster paints exactly
// the same way every time it is drawn — no shimmer between preview and
// export, and the same bytes out of the same state.
export function seededRandom(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------------------------------------------------------- the painted scene
// A panel with no photo still has to earn its place: paint a little
// Leonida in it — banded sun over a glitter sea, a causeway running to the
// horizon, palm silhouettes at the edges. `variant` shuffles the details
// so neighbouring empty panels do not look cloned.

function clipPanel(ctx, rect) {
  const lean = rect.w * rect.tilt;
  ctx.beginPath();
  ctx.moveTo(rect.x, rect.y);
  ctx.lineTo(rect.x + rect.w + lean, rect.y);
  ctx.lineTo(rect.x + rect.w, rect.y + rect.h);
  ctx.lineTo(rect.x, rect.y + rect.h);
  ctx.closePath();
}

function paintPalmTree(ctx, baseX, baseY, size, ink) {
  // Trunk: a tapering curved band, drawn as one filled shape.
  const topX = baseX + size * 0.22;
  const topY = baseY - size;
  const half = Math.max(2, size * 0.035);
  ctx.fillStyle = ink;
  ctx.beginPath();
  ctx.moveTo(baseX - half, baseY);
  ctx.quadraticCurveTo(baseX + size * 0.05, baseY - size * 0.5, topX - half * 0.7, topY);
  ctx.lineTo(topX + half * 0.7, topY);
  ctx.quadraticCurveTo(baseX + size * 0.12, baseY - size * 0.5, baseX + half, baseY);
  ctx.closePath();
  ctx.fill();
  // Fronds: seven arcs sweeping out of the crown, each one a thin crescent
  // made of two arcs — the outer edge and the inner edge back.
  for (let k = 0; k < 7; k++) {
    const spread = -Math.PI * 0.96 + (k / 6) * Math.PI * 0.92;
    const reach = size * (0.52 + (k % 2) * 0.08);
    const tipX = topX + Math.cos(spread) * reach;
    const tipY = topY + Math.sin(spread) * reach * 0.55 + reach * 0.3;
    const bendX = topX + Math.cos(spread) * reach * 0.55;
    const bendY = topY + Math.sin(spread) * reach * 0.3 - size * 0.08;
    ctx.beginPath();
    ctx.moveTo(topX, topY);
    ctx.quadraticCurveTo(bendX, bendY, tipX, tipY);
    ctx.quadraticCurveTo(bendX + (topX - bendX) * 0.1, bendY + size * 0.07, topX, topY);
    ctx.closePath();
    ctx.fill();
  }
  // Fruit: two small discs tucked under the crown.
  ctx.beginPath();
  ctx.arc(topX - size * 0.02, topY + size * 0.05, Math.max(2, size * 0.03), 0, Math.PI * 2);
  ctx.arc(topX + size * 0.05, topY + size * 0.06, Math.max(2, size * 0.026), 0, Math.PI * 2);
  ctx.fill();
}

function paintScene(ctx, rect, grade, variant) {
  const { x, y, w, h } = rect;
  const pick = seededRandom(variant * 7919 + 41);
  const horizon = y + h * (0.56 + pick() * 0.12);
  const sunX = x + w * (0.32 + pick() * 0.36);
  const sunR = Math.min(w, h) * (0.17 + pick() * 0.09);

  const sky = ctx.createLinearGradient(0, y, 0, horizon);
  grade.sky.forEach((colour, i) => sky.addColorStop(i / (grade.sky.length - 1), colour));
  ctx.fillStyle = sky;
  ctx.fillRect(x, y, w, horizon - y);

  // Sunbeams first, behind the disc: long soft wedges fanning upward.
  ctx.save();
  ctx.translate(sunX, horizon);
  ctx.fillStyle = 'rgba(255, 220, 150, 0.10)';
  for (let k = -3; k <= 3; k++) {
    const angle = -Math.PI / 2 + k * 0.22;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, Math.max(w, h), angle - 0.045, angle + 0.045);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  // The ringed sun: a gradient disc sliced by dark bands, retro style.
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, horizon - y + sunR);
  ctx.clip();
  const disc = ctx.createLinearGradient(0, horizon - sunR, 0, horizon + sunR);
  disc.addColorStop(0, grade.sun);
  disc.addColorStop(1, grade.sky[2]);
  ctx.fillStyle = disc;
  ctx.beginPath();
  ctx.arc(sunX, horizon, sunR, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = grade.sky[3];
  for (let i = 0; i < 4; i++) {
    const bandY = horizon - sunR * 0.02 + i * sunR * 0.17;
    ctx.fillRect(sunX - sunR, bandY, sunR * 2, sunR * (0.04 + i * 0.012));
  }
  ctx.restore();

  // Sea, with a glitter path of short dashes under the sun.
  ctx.fillStyle = grade.sea;
  ctx.fillRect(x, horizon, w, y + h - horizon);
  const seaH = y + h - horizon;
  for (let i = 0; i < 30; i++) {
    const gy = horizon + 3 + pick() * Math.max(4, seaH - 6);
    const gw = 3 + pick() * Math.min(52, w * 0.16);
    const gx = sunX + (pick() - 0.5) * w * 0.5 - gw / 2;
    ctx.globalAlpha = 0.14 + pick() * 0.42;
    ctx.fillStyle = 'rgba(255, 236, 190, 0.85)';
    ctx.fillRect(gx, gy, gw, Math.max(1.5, h * 0.004));
  }
  ctx.globalAlpha = 1;

  // Causeway: two converging light lines running out to the horizon.
  if (w > 140 && h > 140) {
    ctx.strokeStyle = 'rgba(255, 235, 200, 0.55)';
    ctx.lineWidth = Math.max(1.5, w * 0.004);
    ctx.beginPath();
    ctx.moveTo(x + w * (0.3 + pick() * 0.1), y + h);
    ctx.lineTo(sunX - sunR * 0.2, horizon + 2);
    ctx.moveTo(x + w * (0.62 + pick() * 0.1), y + h);
    ctx.lineTo(sunX + sunR * 0.2, horizon + 2);
    ctx.stroke();
  }

  // Palm silhouettes anchoring the lower corners.
  const ink = 'rgba(8, 5, 18, 0.92)';
  if (w > 90 && h > 90) {
    paintPalmTree(ctx, x + w * 0.1, y + h, Math.min(w, h) * 0.5, ink);
    if (pick() > 0.3) paintPalmTree(ctx, x + w * 0.93, y + h, Math.min(w, h) * 0.6, ink);
  }
}

// --------------------------------------------------------------------- photos
// Cover-fit a photo into its panel at the panel's zoom, panned by (ox, oy):
// 0 holds the crop against one edge of the slack, 1 against the other,
// 0.5 centres it. The editor drags these two numbers around.
function paintPhoto(ctx, rect, slot) {
  const img = slot.img;
  const zoom = slot.zoom ?? 1;
  const fit = Math.max(rect.w / img.naturalWidth, rect.h / img.naturalHeight);
  const scale = fit * zoom;
  const pw = img.naturalWidth * scale;
  const ph = img.naturalHeight * scale;
  const dx = rect.x + (rect.w - pw) * (slot.ox ?? 0.5);
  const dy = rect.y + (rect.h - ph) * (slot.oy ?? 0.5);
  ctx.drawImage(img, dx, dy, pw, ph);
}

function paintWashes(ctx, rect, grade) {
  const pad = Math.abs(rect.w * rect.tilt) + 2;
  for (const wash of grade.washes) {
    const g = ctx.createLinearGradient(0, rect.y, 0, rect.y + rect.h);
    g.addColorStop(0, paintChannels(wash.top, wash.topA));
    g.addColorStop(1, paintChannels(wash.bottom, wash.bottomA));
    ctx.save();
    ctx.globalCompositeOperation = wash.blend;
    ctx.fillStyle = g;
    ctx.fillRect(rect.x - pad, rect.y, rect.w + pad * 2, rect.h);
    ctx.restore();
  }
  // A soft vignette so the panel sits inside the poster instead of floating.
  const v = ctx.createRadialGradient(
    rect.x + rect.w / 2, rect.y + rect.h / 2, Math.min(rect.w, rect.h) * 0.42,
    rect.x + rect.w / 2, rect.y + rect.h / 2, Math.max(rect.w, rect.h) * 0.8,
  );
  v.addColorStop(0, 'rgba(0, 0, 0, 0)');
  v.addColorStop(1, 'rgba(10, 4, 20, 0.3)');
  ctx.fillStyle = v;
  ctx.fillRect(rect.x - pad, rect.y, rect.w + pad * 2, rect.h);
}

// -------------------------------------------------------------- print texture
function paintSpeckle(ctx, w, h, seed) {
  // Fine print grain: deterministic dots from the seeded generator, so the
  // export and the preview carry the same texture.
  const pick = seededRandom(seed);
  const count = Math.round((w * h) / 3000);
  for (let i = 0; i < count; i++) {
    ctx.fillStyle = pick() > 0.5 ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.06)';
    ctx.fillRect(pick() * w, pick() * h, 1.6, 1.6);
  }
}

function paintDotScreen(ctx, w, h) {
  // A whisper of halftone dots hugging the poster's edges.
  ctx.save();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
  const step = Math.max(9, Math.round(w / 120));
  for (let yy = step; yy < h; yy += step) {
    const offset = ((yy / step) % 2 ? step / 2 : 0);
    for (let xx = offset; xx < w; xx += step) {
      const edge = Math.min(xx, yy, w - xx, h - yy) / (Math.min(w, h) * 0.16);
      if (edge >= 1) continue;
      ctx.beginPath();
      ctx.arc(xx, yy, step * 0.16 * (1 - edge) + 0.4, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

// ------------------------------------------------------------------ lettering
const HEADLINE = (px) => `900 ${px}px "Noto Sans", "DejaVu Sans", "Liberation Sans", sans-serif`;
const LETTERED = (px) => `700 ${px}px "Noto Sans", "DejaVu Sans", "Liberation Sans", sans-serif`;

function shrinkToFit(ctx, text, px, maxWidth, makeFont) {
  let size = px;
  ctx.font = makeFont(size);
  while (ctx.measureText(text).width > maxWidth && size > 10) {
    size -= 2;
    ctx.font = makeFont(size);
  }
  return size;
}

function paintStamp(ctx, cx, cy, r) {
  // The studio's own mark: a banded sun in a white ring. No borrowed logo.
  ctx.save();
  const g = ctx.createLinearGradient(0, cy - r, 0, cy + r);
  g.addColorStop(0, '#ffd97a');
  g.addColorStop(0.55, '#ff8a5e');
  g.addColorStop(1, '#ef2c76');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(20, 8, 34, 0.85)';
  for (let i = 0; i < 3; i++) {
    ctx.fillRect(cx - r, cy + r * (0.06 + i * 0.24), r * 2, r * 0.07);
  }
  ctx.lineWidth = Math.max(2, r * 0.09);
  ctx.strokeStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(cx, cy, r + ctx.lineWidth * 0.7, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function paintWords(ctx, w, h, draft, grade) {
  const title = (draft.title ?? '').trim().toUpperCase();
  const subtitle = (draft.subtitle ?? '').trim().toUpperCase();
  const kicker = (draft.kicker ?? '').trim().toUpperCase();
  const unit = Math.min(w, h) / 1080;
  // Scrims top and bottom so the words read on any photograph.
  const topScrim = ctx.createLinearGradient(0, 0, 0, h * (title ? 0.32 : 0.16));
  topScrim.addColorStop(0, 'rgba(10, 4, 22, 0.62)');
  topScrim.addColorStop(1, 'rgba(10, 4, 22, 0)');
  ctx.fillStyle = topScrim;
  ctx.fillRect(0, 0, w, h * (title ? 0.32 : 0.16));
  const lowScrim = ctx.createLinearGradient(0, h * 0.8, 0, h);
  lowScrim.addColorStop(0, 'rgba(10, 4, 22, 0)');
  lowScrim.addColorStop(1, 'rgba(10, 4, 22, 0.66)');
  ctx.fillStyle = lowScrim;
  ctx.fillRect(0, h * 0.8, w, h * 0.2);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  let penY = h * 0.055;
  if (kicker) {
    const kSize = Math.min(34, Math.max(14, w * 0.021));
    ctx.font = LETTERED(kSize);
    try { ctx.letterSpacing = `${Math.max(2, w * 0.006)}px`; } catch { /* older canvas */ }
    ctx.fillStyle = '#ffd97a';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.65)';
    ctx.shadowBlur = 6 * unit + 2;
    ctx.fillText(kicker, w / 2, penY + kSize);
    penY += kSize + h * 0.02;
    try { ctx.letterSpacing = '0px'; } catch { /* older canvas */ }
    ctx.shadowBlur = 0;
  }
  if (title) {
    const lines = title.split('\n').map((t) => t.trim()).filter(Boolean);
    let px = h * (lines.length > 1 ? 0.088 : 0.115);
    for (const line of lines) px = Math.min(px, shrinkToFit(ctx, line, px, w * 0.92, HEADLINE));
    ctx.font = HEADLINE(px);
    const lineH = px * 0.94;
    lines.forEach((line, i) => {
      const ly = penY + px + i * lineH;
      // Hot-pink offset shadow, then the warm white face, then a hairline.
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#ef2c76';
      ctx.fillText(line, w / 2 + px * 0.045, ly + px * 0.05);
      const face = ctx.createLinearGradient(0, ly - px, 0, ly);
      face.addColorStop(0, '#ffffff');
      face.addColorStop(0.72, '#fff4e0');
      face.addColorStop(1, '#ffc9a3');
      ctx.fillStyle = face;
      ctx.fillText(line, w / 2, ly);
      ctx.lineWidth = Math.max(1, px * 0.014);
      ctx.strokeStyle = 'rgba(20, 6, 30, 0.55)';
      ctx.strokeText(line, w / 2, ly);
    });
    penY += px + (lines.length - 1) * lineH + h * 0.02;
  }

  // The stamp sits bottom-right; the grade name rides top-right.
  const r = Math.min(w, h) * 0.052;
  paintStamp(ctx, w - r * 1.45, h - r * 1.45, r);
  ctx.font = LETTERED(Math.max(12, Math.min(w, h) * 0.017));
  ctx.textAlign = 'right';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
  ctx.shadowBlur = 5;
  ctx.fillText('COVER STUDIO', w - r * 0.55, r * 1.32);
  ctx.font = LETTERED(Math.max(11, Math.min(w, h) * 0.0145));
  ctx.fillStyle = '#ffd97a';
  ctx.fillText(grade.name.toUpperCase(), w - r * 0.55, r * 1.32 + Math.min(w, h) * 0.026);
  ctx.shadowBlur = 0;
  ctx.textAlign = 'center';

  if (subtitle) {
    const sSize = shrinkToFit(ctx, subtitle, Math.min(w, h) * 0.034, w * 0.86, HEADLINE);
    ctx.font = HEADLINE(sSize);
    const bw = ctx.measureText(subtitle).width + sSize * 1.5;
    const bh = sSize * 1.62;
    const bx = (w - bw) / 2;
    const by = h - bh - h * 0.035;
    const bar = ctx.createLinearGradient(bx, by, bx + bw, by);
    bar.addColorStop(0, '#ef2c76');
    bar.addColorStop(0.5, '#ff7a3c');
    bar.addColorStop(1, '#ffb03a');
    ctx.fillStyle = bar;
    ctx.beginPath();
    ctx.roundRect(bx, by, bw, bh, bh * 0.24);
    ctx.fill();
    ctx.lineWidth = Math.max(1.5, sSize * 0.05);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(60, 0, 30, 0.45)';
    ctx.shadowBlur = 4;
    ctx.fillText(subtitle, w / 2, by + bh * 0.68);
    ctx.shadowBlur = 0;
  }
}

// ----------------------------------------------------------------- the poster
/**
 * Paints one poster. `draft`:
 * { layoutId, gradeId, title, subtitle, kicker, grain, frame, selected,
 *   slots: [{ img|null, zoom, ox, oy }, ...] } — one slot per layout panel.
 */
export function paintPoster(canvas, draft) {
  const ctx = canvas.getContext('2d');
  const { width: w, height: h } = canvas;
  const layout = findLayout(draft.layoutId);
  const grade = findGrade(draft.gradeId);
  const rects = measurePanels(layout, w, h);
  ctx.fillStyle = '#0a0616';
  ctx.fillRect(0, 0, w, h);
  rects.forEach((rect, i) => {
    const slot = draft.slots[i] ?? { img: null };
    ctx.save();
    clipPanel(ctx, rect);
    ctx.clip();
    if (slot.img) {
      ctx.filter = grade.filter;
      paintPhoto(ctx, rect, slot);
      ctx.filter = 'none';
    } else {
      paintScene(ctx, rect, grade, i + 3);
    }
    paintWashes(ctx, rect, grade);
    ctx.restore();
    // Keylines: crisp white collage borders, heavier around insets.
    ctx.save();
    clipPanel(ctx, rect);
    ctx.lineWidth = rect.inset ? Math.max(4, w * 0.006) : Math.max(2.5, w * 0.0032);
    ctx.strokeStyle = rect.inset ? '#ffffff' : 'rgba(255, 255, 255, 0.96)';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
    ctx.shadowBlur = rect.inset ? 14 : 0;
    ctx.stroke();
    ctx.restore();
    if (draft.selected === i) {
      ctx.save();
      clipPanel(ctx, rect);
      ctx.lineWidth = Math.max(3, w * 0.005);
      ctx.strokeStyle = '#ffd23c';
      ctx.setLineDash([w * 0.02, w * 0.012]);
      ctx.stroke();
      ctx.restore();
    }
  });
  paintDotScreen(ctx, w, h);
  if (draft.grain !== false) paintSpeckle(ctx, w, h, 23);
  paintWords(ctx, w, h, draft, grade);
  // The poster edge: a frame that survives being posted anywhere.
  if (draft.frame !== 'none') {
    ctx.lineWidth = Math.max(6, w * 0.009);
    ctx.strokeStyle = draft.frame === 'black' ? '#0a0616' : '#ffffff';
    ctx.strokeRect(ctx.lineWidth / 2, ctx.lineWidth / 2, w - ctx.lineWidth, h - ctx.lineWidth);
    const inner = Math.max(6, w * 0.009) + 3;
    ctx.lineWidth = Math.max(1.5, w * 0.0016);
    ctx.strokeStyle = 'rgba(10, 4, 22, 0.8)';
    ctx.strokeRect(inner, inner, w - inner * 2, h - inner * 2);
  }
}

/** A fresh slot list for a layout, photos dealt round-robin across it. */
export function slotsFor(layoutId, images) {
  const layout = findLayout(layoutId);
  return layout.panels.map((_, i) => ({
    img: images.length ? images[i % images.length] : null,
    zoom: 1,
    ox: 0.5,
    oy: 0.5,
  }));
}

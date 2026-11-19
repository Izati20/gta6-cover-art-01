// Fixed scenes for screenshots, driven by the page's own query string:
// ?shot=cover fills the window with one finished poster; ?shot=editor
// shows the studio mid-edit with photos loaded and a panel picked.
// Parameters: layout, grade, size, frame, title, subtitle, kicker and
// photos (comma-separated sample names, dealt round-robin into the
// panels). window.__shotReady is set once the scene has painted, so a
// screenshot tool can wait for it instead of guessing a delay.

import { findLayout, slotsFor } from './poster.js';

export async function stageScene(scene, query, host) {
  if (scene === 'cover') document.body.classList.add('scene-cover');
  if (scene === 'editor') document.body.classList.add('scene-editor');
  const wanted = (query.get('photos') ?? 'boulevard,pier')
    .split(',').map((s) => s.trim()).filter(Boolean);
  const images = [];
  for (const name of wanted) {
    const sample = host.builtin.find((s) => s.name === name) ?? host.builtin[0];
    images.push(await host.shelve(sample.url, sample.label));
  }
  const layoutId = query.get('layout') ?? 'saga';
  const layout = findLayout(layoutId);
  const slots = slotsFor(layoutId, images);
  // Alternate the vertical framing so neighbouring panels do not crop the
  // same way — the collage reads as many moments, not one photo tiled.
  // An ?oy=0.6,0.4,... list overrides it per panel (wide bands need it: a
  // 6-to-1 strip shows only a thin slice of a square photo).
  const oyList = (query.get('oy') ?? '').split(',').map((s) => parseFloat(s));
  slots.forEach((slot, i) => {
    slot.oy = Number.isFinite(oyList[i]) ? oyList[i] : (i % 2 ? 0.34 : 0.58);
  });
  // ?hero=<sample> pins that photo into every lead panel, so the poster's
  // lead is a person, not whichever photo the round-robin dealt there.
  const heroName = query.get('hero');
  if (heroName) {
    const heroSample = host.builtin.find((s) => s.name === heroName);
    const heroImg = images[wanted.indexOf(heroName)] ?? (heroSample ? await host.shelve(heroSample.url, heroSample.label) : null);
    if (heroImg) {
      layout.panels.forEach((p, i) => {
        if (p.lead) {
          slots[i].img = heroImg;
          slots[i].oy = 0.42;
        }
      });
    }
  }
  host.apply({
    layoutId,
    gradeId: query.get('grade') ?? 'sunset',
    sizeId: query.get('size') ?? 'portrait',
    frame: query.get('frame') ?? 'white',
    title: (query.get('title') ?? 'NEON\nLEONIDA').replace(/\\n/g, '\n'),
    subtitle: query.get('subtitle') ?? 'VICE CITY HEAT',
    kicker: query.get('kicker') ?? 'LEONIDA · POP. TROUBLE',
    slots,
    selected: Math.max(0, layout.panels.findIndex((p) => p.lead)),
  });
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}

// Neon Leonida Cover Studio — the editor.
//
// Photo to poster in a few moves: add your photos (or start from the
// built-in Leonida samples), click a panel, click a photo to fill it,
// drag the poster to reframe and scroll to zoom, pick a layout, a grade
// and an export size, write your title — then Export PNG. Photos are read
// locally with object URLs and never leave the machine; there is no
// upload, no account and no network call anywhere in the app.

import {
  EXPORT_SIZES, POSTER_LAYOUTS, LEONIDA_GRADES,
  findLayout, measurePanels, paintPoster, slotsFor,
} from './poster.js';
import { stageScene } from './scenes.js';

const grab = (id) => document.getElementById(id);
const poster = grab('posterCanvas');
const ui = {
  title: grab('titleField'), subtitle: grab('subtitleField'), kicker: grab('kickerField'),
  zoom: grab('zoomRange'), zoomText: grab('zoomReadout'), notice: grab('notice'),
  picker: grab('filePicker'), rail: grab('photoRail'), layouts: grab('layoutRow'),
  grades: grab('gradeRow'), sizes: grab('sizeRow'), frames: grab('frameRow'),
  panelNote: grab('panelNote'),
};

const BUILTIN = [
  { name: 'boulevard', label: 'Boulevard', url: 'samples/boulevard.jpg' },
  { name: 'pier', label: 'The Pier', url: 'samples/pier.jpg' },
];

// ---------------------------------------------------------------------- state
const draft = {
  sizeId: 'portrait',
  layoutId: 'saga',
  gradeId: 'sunset',
  frame: 'white',
  grain: true,
  title: 'NEON\nLEONIDA',
  subtitle: 'VICE CITY HEAT',
  kicker: 'LEONIDA · POP. TROUBLE',
  slots: [],
  selected: 2, // the saga hero panel
  pickedPhoto: 0,
};
const shelf = []; // { img, label, url }

function chosenSize() { return EXPORT_SIZES[draft.sizeId]; }

function fitCanvas() {
  const s = chosenSize();
  if (poster.width !== s.w || poster.height !== s.h) {
    poster.width = s.w;
    poster.height = s.h;
  }
}

function repaint() {
  fitCanvas();
  draft.title = ui.title.value;
  draft.subtitle = ui.subtitle.value;
  draft.kicker = ui.kicker.value;
  const scene = document.body.classList.contains('scene-cover');
  paintPoster(poster, { ...draft, selected: scene ? -1 : draft.selected });
  const layout = findLayout(draft.layoutId);
  const slot = draft.slots[draft.selected];
  ui.panelNote.textContent = `Panel ${draft.selected + 1} of ${layout.panels.length}${layout.panels[draft.selected]?.lead ? ' · lead panel' : ''}`;
  if (slot) {
    ui.zoom.value = String(Math.round((slot.zoom ?? 1) * 100));
    ui.zoomText.textContent = `${Math.round((slot.zoom ?? 1) * 100)}%`;
  }
}

function switchLayout(id, keep = true) {
  const photos = keep ? draft.slots.map((s) => s.img).filter(Boolean) : [];
  draft.layoutId = id;
  draft.slots = slotsFor(id, photos.length ? photos : shelf.map((p) => p.img));
  if (draft.selected >= draft.slots.length) {
    const lead = findLayout(id).panels.findIndex((p) => p.lead);
    draft.selected = lead >= 0 ? lead : 0;
  }
  highlight(ui.layouts, id);
  repaint();
}

// ------------------------------------------------------------------ pill rows
function fillPills(box, items, current, onPick, textOf) {
  box.innerHTML = '';
  for (const item of items) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'pill';
    b.dataset.id = item.id;
    b.textContent = textOf(item);
    if (item.id === current) b.classList.add('active');
    b.addEventListener('click', () => onPick(item.id));
    box.appendChild(b);
  }
}

function highlight(box, id) {
  box.querySelectorAll('.pill').forEach((c) => c.classList.toggle('active', c.dataset.id === id));
}

// ------------------------------------------------------------------- the shelf
function paintRail() {
  ui.rail.innerHTML = '';
  shelf.forEach((photo, i) => {
    const card = document.createElement('figure');
    card.className = 'thumb' + (i === draft.pickedPhoto ? ' picked' : '');
    card.title = `${photo.label} — click to fill panel ${draft.selected + 1}`;
    const img = document.createElement('img');
    img.src = photo.url;
    img.alt = photo.label;
    const cap = document.createElement('figcaption');
    cap.textContent = photo.label;
    card.append(img, cap);
    card.addEventListener('click', () => placePhoto(i));
    ui.rail.appendChild(card);
  });
}

export function fetchImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`could not load ${url}`));
    img.src = url;
  });
}

async function shelvePhoto(url, label) {
  const img = await fetchImage(url);
  shelf.push({ img, label, url });
  paintRail();
  return img;
}

function placePhoto(i) {
  draft.pickedPhoto = i;
  const slot = draft.slots[draft.selected];
  if (slot) {
    slot.img = shelf[i].img;
    slot.zoom = 1;
    slot.ox = 0.5;
    slot.oy = 0.5;
  }
  paintRail();
  repaint();
  ui.notice.textContent = `${shelf[i].label} fills panel ${draft.selected + 1}. Drag the poster to reframe it.`;
}

// ------------------------------------------------------------- poster pointer
function pointerToCanvas(evt) {
  const r = poster.getBoundingClientRect();
  return {
    x: ((evt.clientX - r.left) / r.width) * poster.width,
    y: ((evt.clientY - r.top) / r.height) * poster.height,
  };
}

function slotAt(x, y) {
  const rects = measurePanels(findLayout(draft.layoutId), poster.width, poster.height);
  // Insets paint last, so hit-test from the top of the stack down.
  for (let i = rects.length - 1; i >= 0; i--) {
    const r = rects[i];
    if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) return i;
  }
  return -1;
}

let pan = null;
poster.addEventListener('pointerdown', (evt) => {
  const p = pointerToCanvas(evt);
  const idx = slotAt(p.x, p.y);
  if (idx < 0) return;
  if (idx !== draft.selected) {
    draft.selected = idx;
    paintRail();
    repaint();
  }
  const slot = draft.slots[idx];
  if (slot?.img) {
    pan = { x: evt.clientX, y: evt.clientY, ox: slot.ox ?? 0.5, oy: slot.oy ?? 0.5 };
    poster.setPointerCapture(evt.pointerId);
  }
});
poster.addEventListener('pointermove', (evt) => {
  if (!pan) return;
  const slot = draft.slots[draft.selected];
  const rects = measurePanels(findLayout(draft.layoutId), poster.width, poster.height);
  const rect = rects[draft.selected];
  const img = slot.img;
  const fit = Math.max(rect.w / img.naturalWidth, rect.h / img.naturalHeight) * (slot.zoom ?? 1);
  const slackX = Math.max(1, img.naturalWidth * fit - rect.w);
  const slackY = Math.max(1, img.naturalHeight * fit - rect.h);
  const box = poster.getBoundingClientRect();
  const dxPx = ((evt.clientX - pan.x) / box.width) * poster.width;
  const dyPx = ((evt.clientY - pan.y) / box.height) * poster.height;
  slot.ox = Math.min(1, Math.max(0, pan.ox - dxPx / slackX));
  slot.oy = Math.min(1, Math.max(0, pan.oy - dyPx / slackY));
  repaint();
});
poster.addEventListener('pointerup', () => { pan = null; });
poster.addEventListener('wheel', (evt) => {
  const slot = draft.slots[draft.selected];
  if (!slot?.img) return;
  evt.preventDefault();
  slot.zoom = Math.min(3, Math.max(1, (slot.zoom ?? 1) * (evt.deltaY < 0 ? 1.07 : 0.93)));
  repaint();
}, { passive: false });

// ---------------------------------------------------------------------- wiring
ui.zoom.addEventListener('input', () => {
  const slot = draft.slots[draft.selected];
  if (slot) slot.zoom = Number(ui.zoom.value) / 100;
  ui.zoomText.textContent = `${ui.zoom.value}%`;
  repaint();
});
for (const field of [ui.title, ui.subtitle, ui.kicker]) {
  field.addEventListener('input', repaint);
}
ui.picker.addEventListener('change', async (evt) => {
  const files = [...evt.target.files];
  for (const file of files) {
    const url = URL.createObjectURL(file);
    await shelvePhoto(url, file.name.replace(/\.[^.]+$/, '').slice(0, 22) || 'My photo');
    placePhoto(shelf.length - 1);
  }
  if (files.length) ui.notice.textContent = `${files.length} photo${files.length > 1 ? 's' : ''} added — click any panel, then a photo, to place it.`;
  evt.target.value = '';
});
grab('fillEverywhere').addEventListener('click', () => {
  const photo = shelf[draft.pickedPhoto];
  if (!photo) return;
  draft.slots.forEach((s) => { s.img = photo.img; s.zoom = 1; s.ox = 0.5; s.oy = 0.5; });
  repaint();
  ui.notice.textContent = `Every panel now holds ${photo.label}. Click a panel and swap in another photo for the collage feel.`;
});
grab('emptyPanel').addEventListener('click', () => {
  const slot = draft.slots[draft.selected];
  if (slot) slot.img = null;
  repaint();
  ui.notice.textContent = `Panel ${draft.selected + 1} emptied — the painted Leonida scene shows through.`;
});
grab('dealAgain').addEventListener('click', () => {
  if (!shelf.length) return;
  draft.slots.forEach((s, i) => {
    s.img = shelf[(i + Math.floor(Math.random() * shelf.length)) % shelf.length].img;
    s.zoom = 1;
    s.ox = 0.5;
    s.oy = 0.5;
  });
  repaint();
});
grab('grainToggle').addEventListener('change', (evt) => { draft.grain = evt.target.checked; repaint(); });
grab('exportButton').addEventListener('click', () => {
  repaint();
  poster.toBlob((blob) => {
    if (!blob) return;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `neon-leonida-cover-${poster.width}x${poster.height}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    ui.notice.textContent = `Saved neon-leonida-cover-${poster.width}x${poster.height}.png — post it anywhere.`;
  }, 'image/png');
});
grab('resetButton').addEventListener('click', () => {
  draft.layoutId = 'saga';
  draft.gradeId = 'sunset';
  draft.sizeId = 'portrait';
  draft.frame = 'white';
  draft.grain = true;
  draft.title = 'NEON\nLEONIDA';
  draft.subtitle = 'VICE CITY HEAT';
  draft.kicker = 'LEONIDA · POP. TROUBLE';
  ui.title.value = draft.title;
  ui.subtitle.value = draft.subtitle;
  ui.kicker.value = draft.kicker;
  grab('grainToggle').checked = true;
  draft.slots = slotsFor('saga', shelf.map((p) => p.img));
  draft.selected = 2;
  highlight(ui.layouts, 'saga');
  highlight(ui.grades, 'sunset');
  highlight(ui.sizes, 'portrait');
  highlight(ui.frames, 'white');
  paintRail();
  repaint();
  ui.notice.textContent = 'Fresh poster — pick a layout, a grade and your words.';
});

// ------------------------------------------------------------------------ boot
async function start() {
  fillPills(ui.layouts, POSTER_LAYOUTS, draft.layoutId, (id) => switchLayout(id), (l) => l.name);
  fillPills(ui.grades, LEONIDA_GRADES, draft.gradeId, (id) => { draft.gradeId = id; highlight(ui.grades, id); repaint(); }, (g) => g.name);
  fillPills(ui.sizes, Object.values(EXPORT_SIZES), draft.sizeId, (id) => { draft.sizeId = id; highlight(ui.sizes, id); repaint(); }, (s) => s.label);
  fillPills(ui.frames, [{ id: 'white' }, { id: 'black' }, { id: 'none' }], draft.frame,
    (id) => { draft.frame = id; highlight(ui.frames, id); repaint(); },
    (f) => ({ white: 'White frame', black: 'Black frame', none: 'No frame' })[f.id]);
  ui.title.value = draft.title;
  ui.subtitle.value = draft.subtitle;
  ui.kicker.value = draft.kicker;
  const query = new URLSearchParams(location.search);
  const scene = query.get('shot');
  if (scene) {
    await stageScene(scene, query, {
      builtin: BUILTIN,
      shelve: shelvePhoto,
      apply: (patch) => {
        Object.assign(draft, patch);
        ui.title.value = draft.title;
        ui.subtitle.value = draft.subtitle;
        ui.kicker.value = draft.kicker;
        highlight(ui.layouts, draft.layoutId);
        highlight(ui.grades, draft.gradeId);
        highlight(ui.sizes, draft.sizeId);
        highlight(ui.frames, draft.frame);
        if (patch.slots) draft.slots = patch.slots;
        paintRail();
        repaint();
      },
    });
    return;
  }
  for (const sample of BUILTIN) await shelvePhoto(sample.url, sample.label);
  draft.pickedPhoto = 0;
  draft.slots = slotsFor(draft.layoutId, shelf.map((p) => p.img));
  paintRail();
  repaint();
}

start();

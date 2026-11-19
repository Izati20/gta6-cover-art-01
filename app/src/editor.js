// Neon Leonida Cover Studio — workbench wiring.
//
// index.html owns the markup; this module owns the behaviour. It keeps one
// poster state (see poster.js), a small library of the user's photos, and
// the canvas the poster is painted on. Nothing leaves the machine: photos
// are read through object URLs and drawn straight onto the canvas.
//
// The same module also serves the screenshot scenes: when the page carries
// a ?shot= query, scenes.js drives this module's control object instead of
// the user, so a screenshot shows exactly what the workbench would show.

import {
  SIZES, GRADES, LAYOUTS, FRAMES,
  blankPoster, paintPoster, panelAt, panelCells, fitSlots,
} from './poster.js';
import { applyScene } from './scenes.js';

const $ = (id) => document.getElementById(id);

function shuffleInPlace(items) {
  for (let i = items.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
}

function buildPills(host, options, currentId, onPick) {
  host.textContent = '';
  options.forEach((opt) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `pill${opt.id === currentId ? ' active' : ''}`;
    btn.textContent = opt.label;
    btn.addEventListener('click', () => {
      onPick(opt.id);
      host.querySelectorAll('.pill').forEach((el) => el.classList.toggle('active', el === btn));
    });
    host.appendChild(btn);
  });
}

export function bootStudio() {
  const canvas = $('posterCanvas');
  const state = blankPoster();
  const photos = [];
  let dragging = null;
  let sceneMode = '';

  const controls = {
    state,
    set scene(value) { sceneMode = value; },
    get scene() { return sceneMode; },
    setSize(id) { state.size = id; fitSlots(state); syncSizePills(); render(); },
    setLayout(id) { state.layout = id; fitSlots(state); syncLayoutPills(); render(); },
    setGrade(id) { state.grade = id; syncGradePills(); render(); },
    setFrame(id) { state.frame = id; syncFramePills(); render(); },
    setWords(words) {
      if (words.kicker !== undefined) state.kicker = words.kicker;
      if (words.title !== undefined) state.title = words.title;
      if (words.subtitle !== undefined) state.subtitle = words.subtitle;
      syncWordFields();
      render();
    },
    addPhoto(img, name) {
      photos.push({ img, name });
      rebuildRail();
      return photos.length - 1;
    },
    fillSlot(slotIndex, photoIndex) {
      const slot = state.slots[slotIndex];
      const photo = photos[photoIndex];
      if (!slot || !photo) return;
      slot.image = photo.img;
      slot.name = photo.name;
      slot.zoom = 1;
      slot.shiftX = 0;
      slot.shiftY = 0;
      slot.anchor = 0.5;
      rebuildRail();
      render();
    },
    setAnchor(slotIndex, value) {
      const slot = state.slots[slotIndex];
      if (slot) slot.anchor = Math.min(1, Math.max(0, value));
    },
    selectPanel(index) {
      state.active = index;
      syncPanelUi();
      render();
    },
    render,
  };

  function render() {
    paintPoster(canvas, state);
    // The selection outline is a workbench aid: it shows in the editor,
    // never on a cover screenshot.
    if (sceneMode !== 'cover') drawSelection();
  }

  // A dashed outline around the active panel, editor-only: exports repaint
  // the poster clean first, so this never lands in a PNG.
  function drawSelection() {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const cells = panelCells(state);
    const cell = cells[state.active];
    if (!cell) return;
    ctx.save();
    ctx.strokeStyle = '#ffd23c';
    ctx.lineWidth = Math.max(3, canvas.width * 0.004);
    ctx.setLineDash([18, 12]);
    ctx.strokeRect(cell.x + 4, cell.y + 4, cell.w - 8, cell.h - 8);
    ctx.restore();
  }

  function syncSizePills() {
    buildPills($('sizeRow'), SIZES, state.size, (id) => controls.setSize(id));
  }
  function syncLayoutPills() {
    buildPills($('layoutRow'), LAYOUTS, state.layout, (id) => controls.setLayout(id));
  }
  function syncGradePills() {
    buildPills($('gradeRow'), GRADES, state.grade, (id) => controls.setGrade(id));
  }
  function syncFramePills() {
    buildPills($('frameRow'), FRAMES, state.frame, (id) => controls.setFrame(id));
  }

  function syncWordFields() {
    $('kickerField').value = state.kicker;
    $('titleField').value = state.title;
    $('subtitleField').value = state.subtitle;
  }

  function syncPanelUi() {
    const cells = panelCells(state);
    $('panelNote').textContent = `— panel ${state.active + 1} of ${cells.length}`;
    const slot = state.slots[state.active];
    const zoom = slot ? Math.round(slot.zoom * 100) : 100;
    $('zoomRange').value = String(zoom);
    $('zoomReadout').textContent = `${zoom}%`;
    rebuildRail();
  }

  function rebuildRail() {
    const rail = $('photoRail');
    rail.textContent = '';
    photos.forEach((photo, i) => {
      const fig = document.createElement('figure');
      fig.className = 'thumb';
      const activeSlot = state.slots[state.active];
      if (activeSlot && activeSlot.image === photo.img) fig.classList.add('picked');
      const thumb = document.createElement('img');
      thumb.src = photo.img.src;
      thumb.alt = photo.name;
      const cap = document.createElement('figcaption');
      cap.textContent = photo.name;
      fig.append(thumb, cap);
      fig.addEventListener('click', () => {
        controls.fillSlot(state.active, i);
        say(`Panel ${state.active + 1} now shows ${photo.name}.`);
      });
      rail.appendChild(fig);
    });
  }

  function say(text) {
    $('notice').textContent = text;
  }

  function canvasPoint(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * canvas.width,
      y: ((event.clientY - rect.top) / rect.height) * canvas.height,
      scale: canvas.width / rect.width,
    };
  }

  canvas.addEventListener('pointerdown', (event) => {
    const point = canvasPoint(event);
    const hit = panelAt(state, point.x, point.y);
    if (hit < 0) return;
    controls.selectPanel(hit);
    dragging = { x: point.x, y: point.y, moved: false, scale: point.scale };
    canvas.setPointerCapture(event.pointerId);
  });
  canvas.addEventListener('pointermove', (event) => {
    if (!dragging) return;
    const point = canvasPoint(event);
    const slot = state.slots[state.active];
    if (!slot || !slot.image) return;
    const dx = point.x - dragging.x;
    const dy = point.y - dragging.y;
    if (Math.abs(dx) + Math.abs(dy) > 2) dragging.moved = true;
    slot.shiftX += dx;
    slot.shiftY += dy;
    dragging.x = point.x;
    dragging.y = point.y;
    render();
  });
  canvas.addEventListener('pointerup', () => { dragging = null; });
  canvas.addEventListener('wheel', (event) => {
    event.preventDefault();
    const slot = state.slots[state.active];
    if (!slot || !slot.image) return;
    slot.zoom = Math.min(3, Math.max(1, slot.zoom * (event.deltaY < 0 ? 1.08 : 0.93)));
    syncPanelUi();
    render();
  }, { passive: false });

  $('zoomRange').addEventListener('input', () => {
    const slot = state.slots[state.active];
    if (!slot) return;
    slot.zoom = Number($('zoomRange').value) / 100;
    $('zoomReadout').textContent = `${$('zoomRange').value}%`;
    render();
  });

  $('filePicker').addEventListener('change', async (event) => {
    const files = [...event.target.files];
    let added = 0;
    for (const file of files) {
      const url = URL.createObjectURL(file);
      try {
        const img = await new Promise((resolve, reject) => {
          const probe = new Image();
          probe.onload = () => resolve(probe);
          probe.onerror = reject;
          probe.src = url;
        });
        controls.addPhoto(img, file.name.replace(/\.[^.]+$/, ''));
        added += 1;
      } catch {
        URL.revokeObjectURL(url);
      }
    }
    event.target.value = '';
    if (added) {
      say(`${added} photo${added > 1 ? 's' : ''} added — click a panel, then a photo to fill it.`);
      render();
    }
  });

  $('fillEverywhere').addEventListener('click', () => {
    if (!photos.length) { say('Add a photo first.'); return; }
    state.slots.forEach((_, i) => controls.fillSlot(i, 0));
    say(`Every panel now shows ${photos[0].name}.`);
  });

  $('dealAgain').addEventListener('click', () => {
    if (!photos.length) { say('Add a photo first.'); return; }
    const order = shuffleInPlace(photos.map((_, i) => i));
    state.slots.forEach((_, i) => controls.fillSlot(i, order[i % order.length]));
    say('Photos shuffled across the panels.');
  });

  $('emptyPanel').addEventListener('click', () => {
    const slot = state.slots[state.active];
    if (!slot) return;
    slot.image = null;
    slot.name = '';
    slot.zoom = 1;
    slot.shiftX = 0;
    slot.shiftY = 0;
    render();
    say(`Panel ${state.active + 1} is empty — showing the painted scene.`);
  });

  $('kickerField').addEventListener('input', () => { state.kicker = $('kickerField').value; render(); });
  $('titleField').addEventListener('input', () => { state.title = $('titleField').value; render(); });
  $('subtitleField').addEventListener('input', () => { state.subtitle = $('subtitleField').value; render(); });

  $('grainToggle').addEventListener('change', () => {
    state.grain = $('grainToggle').checked;
    render();
  });

  $('exportButton').addEventListener('click', () => {
    paintPoster(canvas, state);
    canvas.toBlob((blob) => {
      if (!blob) { say('Export failed — try again.'); return; }
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `neon-leonida-${state.size}.png`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      say(`Exported ${state.size} PNG — check your downloads.`);
      render();
    }, 'image/png');
  });

  $('resetButton').addEventListener('click', () => {
    const fresh = blankPoster();
    Object.assign(state, fresh, { slots: fresh.slots });
    photos.length = 0;
    $('grainToggle').checked = true;
    syncWordFields();
    syncSizePills();
    syncLayoutPills();
    syncGradePills();
    syncFramePills();
    syncPanelUi();
    render();
    say('Started over — add photos to build a new cover.');
  });

  syncSizePills();
  syncLayoutPills();
  syncGradePills();
  syncFramePills();
  syncWordFields();
  syncPanelUi();
  render();
  return controls;
}

const studio = bootStudio();
const params = new URLSearchParams(window.location.search);
if (params.has('shot')) {
  applyScene(studio, window.location.search).catch(() => studio.render());
}

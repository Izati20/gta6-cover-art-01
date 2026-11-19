// Screenshot scenes for Neon Leonida Cover Studio.
//
// The studio page reads its own query string: ?shot=cover renders just the
// poster for a cover screenshot, ?shot=editor shows the full workbench with
// the sample photos already loaded. Everything else — size, collage, grade,
// photos, hero pick, per-panel vertical anchors, words — comes from the
// same query string, so shots.json can describe each screenshot exactly.
//
// This module only parses that query string and drives the studio through
// the small control object editor.js hands it; it owns no drawing itself.

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`could not load ${src}`));
    img.src = src;
  });
}

function splitList(raw) {
  return raw.split(',').map((part) => part.trim()).filter(Boolean);
}

function splitNumbers(raw) {
  return splitList(raw).map((part) => {
    const n = Number.parseFloat(part);
    return Number.isFinite(n) ? n : 0.5;
  });
}

// Turn the literal "\n" sequences a query string carries into real newlines
// so a two-line title survives the URL.
function unescapeTitle(raw) {
  return raw.split('\\n').join('\n');
}

export function readScene(search) {
  const q = new URLSearchParams(search);
  return {
    shot: q.get('shot') || '',
    size: q.get('size') || '',
    layout: q.get('layout') || '',
    grade: q.get('grade') || '',
    frame: q.get('frame') || '',
    photos: q.get('photos') ? splitList(q.get('photos')) : [],
    hero: q.get('hero') || '',
    anchors: q.get('oy') ? splitNumbers(q.get('oy')) : [],
    kicker: q.get('kicker') || '',
    title: q.get('title') ? unescapeTitle(q.get('title')) : '',
    subtitle: q.get('subtitle') || '',
  };
}

// Drive the studio from a parsed scene. Sample photos live beside the app
// under samples/ and are loaded by name, e.g. photos=boulevard,pier.
// The hero photo goes into panel 0; the rest cycle through the other
// panels; each oy value pins that panel's photo vertically (0 top, 1 bottom).
export async function applyScene(controls, search) {
  const scene = readScene(search);
  if (!scene.shot) return false;
  controls.scene = scene.shot;
  document.body.classList.add(scene.shot === 'editor' ? 'scene-editor' : 'scene-cover');

  if (scene.size) controls.setSize(scene.size);
  if (scene.layout) controls.setLayout(scene.layout);
  if (scene.grade) controls.setGrade(scene.grade);
  if (scene.frame) controls.setFrame(scene.frame);
  controls.setWords({
    kicker: scene.kicker || undefined,
    title: scene.title || undefined,
    subtitle: scene.subtitle || undefined,
  });

  const loaded = [];
  for (const name of scene.photos) {
    try {
      const img = await loadImage(`./samples/${name}.jpg`);
      loaded.push({ img, name });
    } catch {
      // A missing sample is skipped; the panel keeps its painted scene.
    }
  }
  if (!loaded.length) {
    controls.render();
    return true;
  }
  loaded.forEach(({ img, name }) => controls.addPhoto(img, name));

  const heroAt = Math.max(0, loaded.findIndex((entry) => entry.name === scene.hero));
  const order = [loaded[heroAt], ...loaded.filter((_, i) => i !== heroAt)];
  const slots = controls.state.slots.length;
  for (let i = 0; i < slots; i += 1) {
    const pick = order[i % order.length];
    controls.fillSlot(i, loaded.indexOf(pick));
    if (scene.anchors[i] !== undefined) controls.setAnchor(i, scene.anchors[i]);
  }
  if (scene.shot === 'editor') controls.selectPanel(0);
  controls.render();
  return true;
}

import * as THREE from "three";

/**
 * Procedural textures for the 3D park, drawn on canvases at start-up. No image files are
 * downloaded, so there is nothing to license and nothing to load over the network.
 */

/** Small deterministic random generator so the park looks the same every time. */
const rand = (seed: number) => () => {
  seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
  return seed / 4294967296;
};

const canvas = (w: number, h = w) => {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return { c, g: c.getContext("2d")! };
};

const finish = (c: HTMLCanvasElement, repeat = 1, color = true) => {
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeat, repeat);
  t.anisotropy = 8;
  if (color) t.colorSpace = THREE.SRGBColorSpace;
  return t;
};

/** Afternoon sky: deep blue overhead fading to a warm, hazy horizon. */
export function skyTexture() {
  const { c, g } = canvas(4, 512);
  const grad = g.createLinearGradient(0, 0, 0, 512);
  grad.addColorStop(0, "#3f78b8");
  grad.addColorStop(0.35, "#79a9d6");
  grad.addColorStop(0.47, "#bcd5e6");
  grad.addColorStop(0.5, "#e9e6dc");
  grad.addColorStop(0.53, "#c9cdc2");
  grad.addColorStop(1, "#8d9a86");
  g.fillStyle = grad;
  g.fillRect(0, 0, 4, 512);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** Fine grass blades: used as a repeating bump map so the turf catches the light. */
export function grassDetail() {
  const { c, g } = canvas(256),
    r = rand(7);
  g.fillStyle = "#808080";
  g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 9000; i++) {
    const v = 90 + r() * 120;
    g.strokeStyle = `rgb(${v},${v},${v})`;
    g.lineWidth = 0.6 + r() * 0.8;
    const x = r() * 256,
      y = r() * 256,
      a = -Math.PI / 2 + (r() - 0.5) * 0.9,
      l = 2 + r() * 4;
    g.beginPath();
    g.moveTo(x, y);
    g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l);
    g.stroke();
  }
  return finish(c, 1, false);
}

/**
 * The whole turf in one texture (covers the 320 m ground plane): grass colour, soft blotches and
 * the criss-cross mowing bands cut into ballpark grass.
 */
export function turf(size = 2048) {
  const { c, g } = canvas(size),
    r = rand(5);
  g.fillStyle = "#4c8646";
  g.fillRect(0, 0, size, size);
  for (let i = 0; i < 260; i++) {
    const x = r() * size,
      y = r() * size,
      rad = 20 + r() * 90,
      grad = g.createRadialGradient(x, y, 0, x, y, rad);
    grad.addColorStop(0, r() < 0.5 ? "rgba(34,86,40,0.22)" : "rgba(122,160,82,0.18)");
    grad.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = grad;
    g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
  }
  // Bands about 6 m wide, at 45° to the foul lines, crossing each other.
  const band = (size / 320) * 6;
  g.save();
  g.translate(size / 2, size / 2);
  g.rotate(Math.PI / 4);
  for (let i = -60; i < 60; i++) {
    if (i % 2) {
      g.fillStyle = "rgba(255,255,255,0.075)";
      g.fillRect(i * band, -size, band, size * 2);
      g.fillStyle = "rgba(255,255,255,0.05)";
      g.fillRect(-size, i * band, size * 2, band);
    }
  }
  g.restore();
  for (let i = 0; i < 60000; i++) {
    g.fillStyle = r() < 0.5 ? "rgba(30,70,32,0.25)" : "rgba(140,180,100,0.16)";
    g.fillRect(r() * size, r() * size, 1.5, 1.5);
  }
  return finish(c);
}

/** Grass colour with subtle blotches; tiles every few metres. */
export function grassColor() {
  const { c, g } = canvas(256),
    r = rand(11);
  g.fillStyle = "#4f8a4a";
  g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 2600; i++) {
    const shade = r();
    g.fillStyle =
      shade < 0.5
        ? `rgba(36,${88 + r() * 30},40,${0.25 + r() * 0.3})`
        : `rgba(${110 + r() * 40},${150 + r() * 30},${80 + r() * 20},${0.12 + r() * 0.18})`;
    g.fillRect(r() * 256, r() * 256, 1 + r() * 2.5, 1 + r() * 2.5);
  }
  return finish(c);
}

/**
 * Mowing pattern for the whole outfield (one texture across 240 m): wide light/dark bands in a
 * criss-cross, the way ballpark turf is cut. Multiplied over the grass colour.
 */
export function mowingPattern() {
  const size = 1024,
    { c, g } = canvas(size),
    band = size / 24;
  g.fillStyle = "#ffffff";
  g.fillRect(0, 0, size, size);
  g.save();
  g.translate(size / 2, size / 2);
  g.rotate(Math.PI / 4);
  for (let i = -24; i < 24; i++) {
    g.fillStyle = i % 2 ? "rgba(0,0,0,0.11)" : "rgba(255,255,255,0)";
    g.fillRect(i * band, -size, band, size * 2);
    g.fillStyle = i % 2 ? "rgba(0,0,0,0.07)" : "rgba(255,255,255,0)";
    g.fillRect(-size, i * band, size * 2, band);
  }
  g.restore();
  return finish(c);
}

/** Infield clay: warm brown with grit, cleat scuffs and darker damp patches. */
export function dirtColor() {
  const { c, g } = canvas(256),
    r = rand(23);
  g.fillStyle = "#a9774f";
  g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 40; i++) {
    const x = r() * 256,
      y = r() * 256,
      rad = 10 + r() * 30,
      grad = g.createRadialGradient(x, y, 0, x, y, rad);
    grad.addColorStop(0, `rgba(${r() < 0.5 ? "120,78,48" : "190,146,104"},0.25)`);
    grad.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = grad;
    g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
  }
  for (let i = 0; i < 7000; i++) {
    const v = r();
    g.fillStyle =
      v < 0.5 ? `rgba(80,52,32,${0.2 + r() * 0.3})` : `rgba(222,190,150,${0.15 + r() * 0.3})`;
    g.fillRect(r() * 256, r() * 256, 0.8 + r() * 1.4, 0.8 + r() * 1.4);
  }
  return finish(c);
}

/** Grit bump for the clay. */
export function dirtDetail() {
  const { c, g } = canvas(256),
    r = rand(31);
  g.fillStyle = "#808080";
  g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 12000; i++) {
    const v = 60 + r() * 140;
    g.fillStyle = `rgb(${v},${v},${v})`;
    g.fillRect(r() * 256, r() * 256, 1 + r() * 1.5, 1 + r() * 1.5);
  }
  return finish(c, 1, false);
}

/** Padded outfield wall: dark green panels with seams and a slight sheen. */
export function wallPadding() {
  const { c, g } = canvas(256, 128);
  const grad = g.createLinearGradient(0, 0, 0, 128);
  grad.addColorStop(0, "#21473f");
  grad.addColorStop(1, "#163430");
  g.fillStyle = grad;
  g.fillRect(0, 0, 256, 128);
  g.fillStyle = "rgba(0,0,0,0.35)";
  for (let x = 0; x < 256; x += 64) g.fillRect(x, 0, 2, 128);
  g.fillStyle = "rgba(255,255,255,0.05)";
  g.fillRect(0, 10, 256, 6);
  return finish(c);
}

/** Stadium seats seen from the field: rows of seat backs with aisles. */
export function seatRows(color: string, alt: string) {
  const { c, g } = canvas(256);
  g.fillStyle = "#1c2a30";
  g.fillRect(0, 0, 256, 256);
  for (let row = 0; row < 16; row++)
    for (let col = 0; col < 32; col++) {
      if (col % 11 === 10) continue;
      g.fillStyle = (row + col) % 7 === 0 ? alt : color;
      g.fillRect(col * 8 + 1, row * 16 + 3, 6, 9);
    }
  return finish(c);
}

/** Baseball: white leather with the red figure-eight stitches. */
export function ballTexture() {
  const { c, g } = canvas(256, 128);
  g.fillStyle = "#f6f1e4";
  g.fillRect(0, 0, 256, 128);
  g.strokeStyle = "#c53a30";
  g.lineWidth = 2;
  for (const phase of [0, Math.PI]) {
    g.beginPath();
    for (let x = 0; x <= 256; x += 2) {
      const y = 64 + Math.sin((x / 256) * Math.PI * 2 + phase) * 34;
      if (x === 0) g.moveTo(x, y);
      else g.lineTo(x, y);
    }
    g.stroke();
    for (let x = 4; x < 256; x += 8) {
      const y = 64 + Math.sin((x / 256) * Math.PI * 2 + phase) * 34;
      g.beginPath();
      g.moveTo(x - 3, y - 4);
      g.lineTo(x + 3, y + 4);
      g.stroke();
    }
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/**
 * Jersey wrapped around a cylinder torso: base colour, piping down the front and the number on
 * the back (u = 0.5 faces −Z in Three.js cylinder UVs, which is the model's back).
 */
export function jersey(base: string, trim: string, number: string) {
  const { c, g } = canvas(256, 128);
  g.fillStyle = base;
  g.fillRect(0, 0, 256, 128);
  // Subtle fabric folds.
  for (let i = 0; i < 6; i++) {
    g.fillStyle = `rgba(0,0,0,${0.03 + (i % 2) * 0.03})`;
    g.fillRect(i * 44, 0, 18, 128);
  }
  g.fillStyle = trim;
  // Front placket (u = 0 / 1 is the front seam) and shoulder trim.
  g.fillRect(0, 0, 4, 128);
  g.fillRect(252, 0, 4, 128);
  g.fillRect(0, 0, 256, 5);
  g.font = "bold 62px Arial";
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.lineWidth = 5;
  g.strokeStyle = base;
  g.fillStyle = trim;
  g.fillText(number, 128, 66);
  return finish(c);
}

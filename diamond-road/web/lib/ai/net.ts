/**
 * A tiny two-layer network (tanh hidden layer, one output) and the Adam optimiser, in plain
 * numbers so it runs the same in Node, in the browser and in Web Workers.
 * Parameters live in one flat array: [w1 (hid×inp), b1 (hid), w2 (hid), b2].
 */
export type Net = { inp: number; hid: number; p: Float64Array };

export const paramCount = (inp: number, hid: number) => hid * inp + hid + hid + 1;

export function makeNet(inp: number, hid: number, rnd: () => number): Net {
  const p = new Float64Array(paramCount(inp, hid)),
    s1 = Math.sqrt(1 / inp),
    w2 = hid * inp + hid;
  for (let i = 0; i < hid * inp; i++) p[i] = (rnd() * 2 - 1) * s1;
  // Small output weights: every option looks about the same at first (a fair coin).
  for (let j = 0; j < hid; j++) p[w2 + j] = (rnd() * 2 - 1) * 0.05;
  return { inp, hid, p };
}

/** Output at x; the hidden activations are written into h (length hid) for backward(). */
export function forward(n: Net, x: ArrayLike<number>, h: Float64Array): number {
  const { inp, hid, p } = n,
    b1 = hid * inp,
    w2 = b1 + hid;
  let y = p[w2 + hid];
  for (let j = 0; j < hid; j++) {
    let a = p[b1 + j];
    const row = j * inp;
    for (let i = 0; i < inp; i++) a += p[row + i] * x[i];
    const t = Math.tanh(a);
    h[j] = t;
    y += p[w2 + j] * t;
  }
  return y;
}

/** Adds g · ∂output/∂params (at x, with h from forward) into grad. */
export function backward(
  n: Net,
  x: ArrayLike<number>,
  h: Float64Array,
  g: number,
  grad: Float64Array,
) {
  const { inp, hid, p } = n,
    b1 = hid * inp,
    w2 = b1 + hid;
  grad[w2 + hid] += g;
  for (let j = 0; j < hid; j++) {
    grad[w2 + j] += g * h[j];
    const d = g * p[w2 + j] * (1 - h[j] * h[j]);
    if (d === 0) continue;
    grad[b1 + j] += d;
    const row = j * inp;
    for (let i = 0; i < inp; i++) grad[row + i] += d * x[i];
  }
}

/** Adam: one step against the gradient (of a loss), with gradient-norm clipping. */
export class Adam {
  m: Float64Array;
  v: Float64Array;
  t = 0;
  constructor(size: number) {
    this.m = new Float64Array(size);
    this.v = new Float64Array(size);
  }
  step(p: Float64Array, grad: Float64Array, lr: number, clip = 1) {
    let norm = 0;
    for (let i = 0; i < grad.length; i++) norm += grad[i] * grad[i];
    norm = Math.sqrt(norm);
    const k = norm > clip ? clip / norm : 1,
      b1 = 0.9,
      b2 = 0.999;
    this.t++;
    const c1 = 1 - b1 ** this.t,
      c2 = 1 - b2 ** this.t;
    for (let i = 0; i < p.length; i++) {
      const g = grad[i] * k;
      this.m[i] = b1 * this.m[i] + (1 - b1) * g;
      this.v[i] = b2 * this.v[i] + (1 - b2) * g * g;
      p[i] -= (lr * (this.m[i] / c1)) / (Math.sqrt(this.v[i] / c2) + 1e-8);
    }
  }
}

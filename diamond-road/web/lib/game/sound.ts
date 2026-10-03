/**
 * Game sounds, all synthesised with the Web Audio API (no sound files): bat crack, mitt pop,
 * swing and pitch whooshes, glove catches, crowd cheers and groans, a quiet crowd murmur
 * during matches, and the fanfare for hidden unlocks.
 */
export type SoundKind =
  | "wind"
  | "pitch"
  | "swing"
  | "hit"
  | "mitt"
  | "glove"
  | "call"
  | "out"
  | "cheer"
  | "homer"
  | "groan"
  | "fanfare";

export class Sfx {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private noise: AudioBuffer | null = null;
  private crowd: { src: AudioBufferSourceNode; gain: GainNode } | null = null;

  private audio() {
    if (!this.ctx) {
      const ctx = new AudioContext(),
        master = ctx.createGain();
      master.gain.value = 0.7;
      master.connect(ctx.destination);
      const buf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate),
        d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      this.ctx = ctx;
      this.master = master;
      this.noise = buf;
    }
    if (this.ctx.state === "suspended") void this.ctx.resume();
    return { a: this.ctx, out: this.master! };
  }

  /** A burst of filtered noise with an attack/decay envelope. */
  private hiss(
    at: number,
    len: number,
    level: number,
    filter: { type: BiquadFilterType; f0: number; f1?: number; q?: number },
    attack = 0.005,
  ) {
    const { a, out } = this.audio(),
      src = a.createBufferSource(),
      bq = a.createBiquadFilter(),
      g = a.createGain(),
      t = a.currentTime + at;
    src.buffer = this.noise;
    src.loop = true;
    bq.type = filter.type;
    bq.Q.value = filter.q ?? 1;
    bq.frequency.setValueAtTime(filter.f0, t);
    if (filter.f1) bq.frequency.exponentialRampToValueAtTime(filter.f1, t + len);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(level, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + len);
    src.connect(bq).connect(g).connect(out);
    src.start(t, Math.random());
    src.stop(t + len + 0.05);
  }
  /** A tone sliding from f0 to f1. */
  private tone(at: number, len: number, level: number, f0: number, f1: number, type: OscillatorType) {
    const { a, out } = this.audio(),
      o = a.createOscillator(),
      g = a.createGain(),
      t = a.currentTime + at;
    o.type = type;
    o.frequency.setValueAtTime(f0, t);
    o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + len);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(level, t + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, t + len);
    o.connect(g).connect(out);
    o.start(t);
    o.stop(t + len + 0.05);
  }
  /** Crowd: wide band noise swelling and fading (a cheer), or falling (a groan). */
  private crowdSwell(level: number, len: number, rise: number, f0 = 700, f1 = 900) {
    this.hiss(0, len, level, { type: "bandpass", f0, f1, q: 0.6 }, rise);
    this.hiss(0.05, len * 0.9, level * 0.6, { type: "bandpass", f0: f0 * 2.2, f1: f1 * 2, q: 0.8 }, rise);
  }

  play(kind: string) {
    try {
      switch (kind as SoundKind) {
        case "wind":
          this.hiss(0, 0.35, 0.05, { type: "bandpass", f0: 300, f1: 900, q: 0.8 }, 0.12);
          break;
        case "pitch":
          this.hiss(0, 0.22, 0.09, { type: "bandpass", f0: 1400, f1: 500, q: 1.2 }, 0.03);
          break;
        case "swing":
          this.hiss(0, 0.2, 0.14, { type: "bandpass", f0: 500, f1: 2200, q: 1.5 }, 0.06);
          break;
        case "hit":
          // Bat crack: a sharp click, a woody ring and a low thump.
          this.hiss(0, 0.06, 0.55, { type: "highpass", f0: 2500, q: 0.7 }, 0.001);
          this.tone(0, 0.12, 0.25, 1650, 900, "triangle");
          this.tone(0, 0.09, 0.3, 190, 90, "sine");
          break;
        case "mitt":
          // Catcher's mitt: a leather pop.
          this.hiss(0, 0.07, 0.4, { type: "lowpass", f0: 1400, q: 0.8 }, 0.001);
          this.tone(0, 0.08, 0.35, 140, 70, "sine");
          break;
        case "glove":
          this.hiss(0, 0.05, 0.25, { type: "lowpass", f0: 1800, q: 0.8 }, 0.001);
          this.tone(0, 0.06, 0.18, 220, 110, "sine");
          break;
        case "call":
          this.tone(0, 0.12, 0.08, 880, 820, "square");
          this.crowdSwell(0.05, 0.9, 0.08, 500, 380);
          break;
        case "out":
        case "groan":
          this.crowdSwell(0.09, 1.3, 0.15, 650, 300);
          break;
        case "cheer":
          this.crowdSwell(0.12, 1.8, 0.2);
          break;
        case "homer":
          this.crowdSwell(0.2, 3.2, 0.35, 650, 1000);
          [523.25, 659.25, 783.99].forEach((f, i) => this.tone(0.3 + i * 0.12, 0.5, 0.05, f, f, "sawtooth"));
          break;
        case "fanfare":
          [
            [523.25, 0, 0.14],
            [659.25, 0.14, 0.14],
            [783.99, 0.28, 0.14],
            [1046.5, 0.42, 0.5],
            [523.25, 0.95, 0.9],
            [659.25, 0.95, 0.9],
            [783.99, 0.95, 0.9],
            [1046.5, 0.95, 0.9],
          ].forEach(([f, at, len]) => this.tone(at, len, 0.05, f, f, "sawtooth"));
          break;
      }
    } catch {
      /* no audio on this device */
    }
  }

  /** The crowd's murmur under a match (quiet, endless); off when sounds are off. */
  ambient(on: boolean) {
    try {
      if (!on) {
        if (this.crowd) {
          const { a } = this.audio();
          this.crowd.gain.gain.setTargetAtTime(0, a.currentTime, 0.3);
          const c = this.crowd;
          setTimeout(() => c.src.stop(), 1500);
          this.crowd = null;
        }
        return;
      }
      if (this.crowd) return;
      const { a, out } = this.audio(),
        src = a.createBufferSource(),
        lp = a.createBiquadFilter(),
        g = a.createGain(),
        lfo = a.createOscillator(),
        depth = a.createGain();
      src.buffer = this.noise;
      src.loop = true;
      lp.type = "bandpass";
      lp.frequency.value = 520;
      lp.Q.value = 0.5;
      g.gain.value = 0;
      g.gain.setTargetAtTime(0.025, a.currentTime, 1);
      // A slow swell so it sounds like people, not a fan.
      lfo.frequency.value = 0.17;
      depth.gain.value = 0.008;
      lfo.connect(depth).connect(g.gain);
      src.connect(lp).connect(g).connect(out);
      src.start();
      lfo.start();
      this.crowd = { src, gain: g };
    } catch {
      /* no audio on this device */
    }
  }

  close() {
    void this.ctx?.close();
    this.ctx = null;
    this.crowd = null;
  }
}

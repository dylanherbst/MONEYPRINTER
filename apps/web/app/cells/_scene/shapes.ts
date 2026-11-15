// The cell formations the page morphs through as you scroll. Each returns local positions (x, y, z) for `n` cells;
// the scene then spins each formation around its local y axis and tilts it towards the camera.
// Sizes are authored for a phone screen: about 2 units wide and 5 tall is what fits.

export interface Formation {
  id: string;
  /** Spin around the local y axis, radians per second at speed 1. */
  spin: number;
  /** Tilt around x towards the camera, radians. */
  tilt: number;
  /** Vertical offset after tilting, so the formation sits where the copy leaves room. */
  lift: number;
  /** 0 hides the cells in this formation; they fade in as they travel to the next one. Default 1. */
  opacity?: number;
  make: (n: number, rand: () => number) => Float32Array;
}

/** Small seeded generator, so a formation looks the same on every load. */
export function seeded(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const TAU = Math.PI * 2;
function gauss(rand: () => number): number {
  return Math.sqrt(-2 * Math.log(rand() + 1e-9)) * Math.cos(TAU * rand());
}

/** The opening state: no cells on screen. They wait out of sight around the edges and only appear, fading in,
 * as they gather into the first column. */
const field: Formation = {
  id: 'field', spin: 0.03, tilt: 0, lift: 0, opacity: 0,
  make(n, rand) {
    const out = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const side = rand() < 0.5 ? -1 : 1;
      out[i * 3] = side * (1.8 + rand() * 1.8);
      out[i * 3 + 1] = (rand() * 2 - 1) * 3;
      out[i * 3 + 2] = -2.5 + rand() * 3.5;
    }
    return out;
  },
};

/** A tall column that pinches and swells, like a slow vortex. */
const vortex: Formation = {
  id: 'vortex', spin: 0.55, tilt: 0, lift: 0,
  make(n, rand) {
    const out = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const y = (rand() * 2 - 1) * 2.5;
      const u = y / 2.5;
      const r = (0.3 + 0.28 * u * u + 0.1 * Math.sin(y * 2.4)) * (0.72 + 0.28 * Math.sqrt(rand()));
      const a = rand() * TAU;
      out[i * 3] = Math.cos(a) * r;
      out[i * 3 + 1] = y;
      out[i * 3 + 2] = Math.sin(a) * r;
    }
    return out;
  },
};

/** A double helix: two strands and the rungs between them. */
const helix: Formation = {
  id: 'helix', spin: 0.45, tilt: 0, lift: 0,
  make(n, rand) {
    const out = new Float32Array(n * 3);
    const R = 0.5;
    const twist = 2.3;
    for (let i = 0; i < n; i++) {
      let x: number; let y: number; let z: number;
      if (rand() < 0.8) {
        y = (rand() * 2 - 1) * 2.5;
        const a = y * twist + (rand() < 0.5 ? 0 : Math.PI);
        const spread = 0.06 + 0.03 * rand();
        x = Math.cos(a) * R + gauss(rand) * spread;
        z = Math.sin(a) * R + gauss(rand) * spread;
        y += gauss(rand) * 0.03;
      } else {
        const k = Math.floor(rand() * 26);
        y = -2.5 + (k + 0.5) * (5 / 26);
        const a = y * twist;
        const s = rand() * 2 - 1;
        x = Math.cos(a) * R * s + gauss(rand) * 0.015;
        z = Math.sin(a) * R * s + gauss(rand) * 0.015;
        y += gauss(rand) * 0.015;
      }
      out[i * 3] = x; out[i * 3 + 1] = y; out[i * 3 + 2] = z;
    }
    return out;
  },
};

/** A horizon: a bright rolling ridge with a field of cells falling away in front of it. */
const horizon: Formation = {
  id: 'horizon', spin: 0, tilt: 0, lift: -0.55,
  make(n, rand) {
    const out = new Float32Array(n * 3);
    const ridge = (x: number) => 0.16 * Math.sin(x * 1.5 + 0.6) + 0.07 * Math.sin(x * 3.7);
    for (let i = 0; i < n; i++) {
      const x = (rand() * 2 - 1) * 2.4;
      let y: number; let z: number;
      if (rand() < 0.42) {
        z = -1.2 + gauss(rand) * 0.12;
        y = ridge(x) + gauss(rand) * 0.035;
      } else {
        const d = Math.pow(rand(), 1.6) * 3.6;
        z = -1.2 + d;
        y = ridge(x) * (1 - d / 3.6) - d * 0.42 + gauss(rand) * 0.04;
      }
      out[i * 3] = x; out[i * 3 + 1] = y; out[i * 3 + 2] = z;
    }
    return out;
  },
};

/** A disc around an empty centre, dense at the inner rim. */
const ring: Formation = {
  id: 'ring', spin: 0.3, tilt: 1.12, lift: 0.1,
  make(n, rand) {
    const out = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const r = 0.5 + 1.7 * Math.pow(rand(), 2.2);
      const a = rand() * TAU;
      const h = gauss(rand) * (0.015 + 0.03 * r);
      out[i * 3] = Math.cos(a) * r;
      out[i * 3 + 1] = h;
      out[i * 3 + 2] = Math.sin(a) * r;
    }
    return out;
  },
};

/** A spiral galaxy with a dense core: the closing state. */
const galaxy: Formation = {
  id: 'galaxy', spin: 0.22, tilt: 1.18, lift: -0.15,
  make(n, rand) {
    const out = new Float32Array(n * 3);
    const arms = 3;
    for (let i = 0; i < n; i++) {
      let x: number; let y: number; let z: number;
      if (rand() < 0.14) {
        x = gauss(rand) * 0.16; y = gauss(rand) * 0.09; z = gauss(rand) * 0.16;
      } else {
        const r = 0.12 + 1.75 * Math.pow(rand(), 1.4);
        const arm = Math.floor(rand() * arms);
        const a = arm * (TAU / arms) + r * 2.7 + gauss(rand) * (0.22 / (0.4 + r));
        x = Math.cos(a) * r + gauss(rand) * 0.04;
        z = Math.sin(a) * r + gauss(rand) * 0.04;
        y = gauss(rand) * 0.03 * (1.6 - Math.min(r, 1.5));
      }
      out[i * 3] = x; out[i * 3 + 1] = y; out[i * 3 + 2] = z;
    }
    return out;
  },
};

export const formations: Formation[] = [field, vortex, helix, horizon, ring, galaxy];

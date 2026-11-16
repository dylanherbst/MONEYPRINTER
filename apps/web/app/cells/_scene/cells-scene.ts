// WebGL scene for the cells page: one cloud of cells that morphs between formations as the page scrolls.
// Each cell keeps its index across formations, so a morph is every cell travelling to its new place,
// staggered a little per cell so the change ripples instead of snapping.
import * as THREE from 'three';
import { formations, seeded } from './shapes';
import type { CellSettings } from './settings';

const vertex = /* glsl */ `
  attribute vec3 aTarget;
  attribute vec3 aRand;
  uniform float uMix, uOpA, uOpB, uTime, uSpinA, uSpinB, uSwayA, uSwayB, uTiltA, uTiltB, uLiftA, uLiftB, uSize, uDpr, uScale;
  varying float vTone;
  varying float vAlpha;

  vec3 place(vec3 p, float spin, float tilt, float lift) {
    float c = cos(spin), s = sin(spin);
    p = vec3(c * p.x + s * p.z, p.y, -s * p.x + c * p.z);
    float ct = cos(tilt), st = sin(tilt);
    p = vec3(p.x, ct * p.y - st * p.z, st * p.y + ct * p.z);
    p.y += lift;
    return p;
  }

  void main() {
    float t = clamp((uMix - aRand.z * 0.35) / 0.65, 0.0, 1.0);
    t = t * t * (3.0 - 2.0 * t);
    vec3 a = place(position, uTime * uSpinA + sin(uTime * 0.45) * uSwayA, uTiltA, uLiftA);
    vec3 b = place(aTarget, uTime * uSpinB + sin(uTime * 0.45) * uSwayB, uTiltB, uLiftB);
    vec3 p = mix(a, b, t);
    // Cells loosen while travelling, then settle.
    p += (aRand - 0.5) * 0.9 * sin(t * 3.14159);
    // A slow individual drift so a still formation still breathes.
    float ph = aRand.z * 40.0;
    p += 0.022 * vec3(sin(uTime * 0.7 + ph), cos(uTime * 0.9 + ph * 1.3), sin(uTime * 0.6 + ph * 0.7));
    p *= uScale;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = uSize * uDpr * (0.55 + aRand.x * 1.0) * 26.0 / -mv.z;
    vTone = aRand.y;
    vAlpha = clamp(1.25 - (-mv.z - 5.0) * 0.14, 0.3, 1.0) * mix(uOpA, uOpB, t);
  }
`;

const fragment = /* glsl */ `
  uniform vec3 uC1, uC2;
  uniform float uOpacity;
  varying float vTone;
  varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    float a = smoothstep(0.5, 0.18, d) * vAlpha * uOpacity;
    gl_FragColor = vec4(mix(uC1, uC2, vTone), a);
  }
`;

// Background: soft light waves across the screen, each with a crisp-ish top edge that fades out below,
// drifting slowly with time and a little with scroll. Drawn behind the cells in the same canvas.
const waveVertex = /* glsl */ `
  void main() { gl_Position = vec4(position.xy, 0.0, 1.0); }
`;
const waveFragment = /* glsl */ `
  uniform vec3 uBg, uWave;
  uniform float uAmt, uTime, uProg;
  uniform vec2 uRes;
  float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
  void main() {
    vec2 uv = gl_FragCoord.xy / uRes;
    float x = uv.x * (uRes.x / uRes.y) * 1.6;
    float w = 0.0;
    for (int i = 0; i < 3; i++) {
      float fi = float(i);
      float centre = 0.18 + 0.3 * fi + 0.05 * sin(uProg * 0.9 + fi * 2.1);
      float y = centre
        + 0.07 * sin(x * 2.1 + uTime * 0.22 + fi * 1.7)
        + 0.035 * sin(x * 4.7 - uTime * 0.16 + fi * 0.9);
      float d = uv.y - y;
      float spread = d > 0.0 ? 0.0025 : 0.03 + 0.012 * fi;
      w += (0.85 - 0.18 * fi) * exp(-d * d / spread);
    }
    w = clamp(w, 0.0, 1.0) * uAmt;
    vec3 col = mix(uBg, uWave, w);
    col += (hash(gl_FragCoord.xy) - 0.5) / 255.0;
    gl_FragColor = vec4(col, 1.0);
  }
`;

// The solid logo the cells turn into at the very end. It sits exactly where the logo formation is (same size, sway
// and lift) and appears through a fine-grained dissolve, so it reads as the cells fusing into one shape: first as a
// light purple, then warming into the brand logo's own colours.
const solidVertex = /* glsl */ `
  uniform float uTime, uSway, uLift, uScale;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    vec3 p = position;
    float a = sin(uTime * 0.45) * uSway;
    float c = cos(a), s = sin(a);
    p = vec3(c * p.x + s * p.z, p.y, -s * p.x + c * p.z);
    p.y += uLift;
    p *= uScale;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;
const solidFragment = /* glsl */ `
  uniform sampler2D uMap;
  uniform vec3 uColor;
  uniform float uSolid, uBrand;
  varying vec2 vUv;
  float hash(vec2 p) { return fract(sin(dot(p, vec2(41.31, 289.17))) * 15731.743); }
  void main() {
    vec4 logo = texture2D(uMap, vUv);
    float mask = logo.a;
    float grain = hash(floor(vUv * 240.0));
    float shown = smoothstep(grain - 0.12, grain + 0.12, uSolid * 1.24 - 0.12);
    float a = mask * shown;
    if (a < 0.003) discard;
    gl_FragColor = vec4(mix(uColor, logo.rgb, uBrand), a);
  }
`;

/** Parts of the last morph: the cells fuse into a light purple logo, which then takes on the brand colours. */
const SOLID_FROM = 0.45;
const SOLID_TO = 0.72;
const BRAND_FROM = 0.74;
const smooth01 = (e0: number, e1: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
};

export class CellsScene {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(35, 1, 0.1, 50);
  private points: THREE.Points | null = null;
  private material: THREE.ShaderMaterial;
  private waveMaterial: THREE.ShaderMaterial;
  private solidMaterial: THREE.ShaderMaterial;
  private solid: THREE.Mesh;
  private cellOpacity = 0.85;
  private shapes: Float32Array[] = [];
  private segment = -1;
  private count = 0;

  constructor(private canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: true, powerPreference: 'high-performance' });
    this.renderer.setClearColor(0x000000, 0);
    this.camera.position.set(0, 0, 7);
    this.material = new THREE.ShaderMaterial({
      vertexShader: vertex,
      fragmentShader: fragment,
      transparent: true,
      depthWrite: false,
      uniforms: {
        uMix: { value: 0 }, uOpA: { value: 1 }, uOpB: { value: 1 }, uTime: { value: 0 },
        uSpinA: { value: 0 }, uSpinB: { value: 0 }, uSwayA: { value: 0 }, uSwayB: { value: 0 }, uTiltA: { value: 0 }, uTiltB: { value: 0 },
        uLiftA: { value: 0 }, uLiftB: { value: 0 },
        uSize: { value: 1 }, uDpr: { value: 1 }, uScale: { value: 1 }, uOpacity: { value: 0.9 },
        uC1: { value: new THREE.Color() }, uC2: { value: new THREE.Color() },
      },
    });
    this.waveMaterial = new THREE.ShaderMaterial({
      vertexShader: waveVertex,
      fragmentShader: waveFragment,
      depthTest: false,
      depthWrite: false,
      uniforms: {
        uBg: { value: new THREE.Color() }, uWave: { value: new THREE.Color() },
        uAmt: { value: 0 }, uTime: { value: 0 }, uProg: { value: 0 }, uRes: { value: new THREE.Vector2(1, 1) },
      },
    });
    const backdrop = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.waveMaterial);
    backdrop.frustumCulled = false;
    backdrop.renderOrder = -1;
    this.scene.add(backdrop);

    // Same proportions and height as the logo formation (1.95 units tall).
    const logoH = 1.95;
    const logoW = logoH * (918 / 1024);
    const map = new THREE.TextureLoader().load('/brand/aimp-logo-solid.webp');
    map.colorSpace = THREE.NoColorSpace;
    map.anisotropy = 4;
    this.solidMaterial = new THREE.ShaderMaterial({
      vertexShader: solidVertex,
      fragmentShader: solidFragment,
      transparent: true,
      depthWrite: false,
      depthTest: false,
      uniforms: {
        uMap: { value: map }, uColor: { value: new THREE.Color() }, uSolid: { value: 0 }, uBrand: { value: 0 },
        uTime: { value: 0 }, uSway: { value: 0 }, uLift: { value: 0 }, uScale: { value: 1 },
      },
    });
    this.solid = new THREE.Mesh(new THREE.PlaneGeometry(logoW, logoH), this.solidMaterial);
    this.solid.frustumCulled = false;
    this.solid.renderOrder = 2;
    this.solid.visible = false;
    this.scene.add(this.solid);
  }

  get formationCount(): number { return formations.length; }

  /** Rebuilds the cloud when the number of cells changes; colours and sizes are just uniforms. */
  apply(s: CellSettings, darkBackground: boolean): void {
    const u = this.material.uniforms;
    u.uC1.value.set(`#${s.c1}`);
    u.uC2.value.set(`#${s.c2}`);
    u.uSize.value = s.size;
    const w = this.waveMaterial.uniforms;
    w.uBg.value.set(`#${s.bg}`);
    w.uWave.value.set(`#${s.wave}`);
    w.uAmt.value = s.waveAmt;
    // On a light page cells are drawn as solid dots; on a dark page they add up to a glow.
    const blending = darkBackground ? THREE.AdditiveBlending : THREE.NormalBlending;
    if (this.material.blending !== blending) { this.material.blending = blending; this.material.needsUpdate = true; }
    this.cellOpacity = darkBackground ? 0.75 : 0.85;
    u.uOpacity.value = this.cellOpacity;
    // A lighter version of the main cell colour for the first, plain solid logo.
    // Kept as plain sRGB values (no conversion) so it mixes evenly with the logo image's own colours.
    this.solidMaterial.uniforms.uColor.value.setHex(parseInt(s.c1, 16), THREE.LinearSRGBColorSpace).lerp(new THREE.Color(1, 1, 1), 0.42);
    const n = Math.round(s.count * 1000);
    if (n !== this.count) this.build(n);
  }

  private build(n: number): void {
    this.count = n;
    this.shapes = formations.map((f, i) => f.make(n, seeded(101 + i * 7919)));
    const rand = seeded(7);
    const r = new Float32Array(n * 3);
    for (let i = 0; i < r.length; i++) r[i] = rand();
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
    g.setAttribute('aTarget', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
    g.setAttribute('aRand', new THREE.BufferAttribute(r, 3));
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 10);
    if (this.points) { this.points.geometry.dispose(); this.scene.remove(this.points); }
    this.points = new THREE.Points(g, this.material);
    this.points.frustumCulled = false;
    this.scene.add(this.points);
    this.segment = -1;
  }

  resize(width: number, height: number): void {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.renderer.setPixelRatio(dpr);
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.material.uniforms.uDpr.value = dpr;
    this.waveMaterial.uniforms.uRes.value.set(width * dpr, height * dpr);
    // Formations are authored to about 2.1 units wide; fit that to the screen width on phones, cap it on wide screens.
    const halfH = Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2)) * this.camera.position.z;
    const halfW = halfH * this.camera.aspect;
    this.material.uniforms.uScale.value = Math.min(1.15, Math.max(0.7, halfW / 1.05));
  }

  /** progress runs from 0 (first formation) to formations.length - 1 (last). */
  /** time is the cells' own clock, already scaled by the speed setting. */
  render(progress: number, time: number): void {
    if (!this.points) return;
    const last = formations.length - 1;
    const p = Math.min(last, Math.max(0, progress));
    const seg = Math.min(last - 1, Math.floor(p));
    if (seg !== this.segment) {
      this.segment = seg;
      const g = this.points.geometry;
      (g.getAttribute('position') as THREE.BufferAttribute).copyArray(this.shapes[seg]).needsUpdate = true;
      (g.getAttribute('aTarget') as THREE.BufferAttribute).copyArray(this.shapes[seg + 1]).needsUpdate = true;
    }
    const u = this.material.uniforms;
    const a = formations[seg]; const b = formations[seg + 1];
    u.uMix.value = p - seg;
    this.waveMaterial.uniforms.uTime.value = time;
    this.waveMaterial.uniforms.uProg.value = p;

    // At the end of the last morph the cells fuse into the solid logo and fade out underneath it.
    const end = seg === last - 1 ? p - seg : 0;
    const fused = smooth01(SOLID_FROM, SOLID_TO, end);
    this.solid.visible = fused > 0.001;
    const s = this.solidMaterial.uniforms;
    s.uSolid.value = fused;
    s.uBrand.value = smooth01(BRAND_FROM, 1, end);
    s.uTime.value = time;
    s.uSway.value = b.sway ?? 0;
    s.uLift.value = b.lift;
    s.uScale.value = u.uScale.value;
    u.uOpacity.value = this.cellOpacity * (1 - fused);
    u.uTime.value = time;
    u.uSpinA.value = a.spin; u.uSpinB.value = b.spin;
    u.uSwayA.value = a.sway ?? 0; u.uSwayB.value = b.sway ?? 0;
    u.uTiltA.value = a.tilt; u.uTiltB.value = b.tilt;
    u.uLiftA.value = a.lift; u.uLiftB.value = b.lift;
    u.uOpA.value = a.opacity ?? 1; u.uOpB.value = b.opacity ?? 1;
    this.renderer.render(this.scene, this.camera);
  }

  dispose(): void {
    this.points?.geometry.dispose();
    this.material.dispose();
    this.waveMaterial.dispose();
    this.solid.geometry.dispose();
    (this.solidMaterial.uniforms.uMap.value as THREE.Texture).dispose();
    this.solidMaterial.dispose();
    this.renderer.dispose();
  }
}

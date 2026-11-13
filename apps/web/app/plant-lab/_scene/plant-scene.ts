// Real-time seed-to-tree scene (three.js) for the Blender asset public/plant/plant.glb.
// Rendering is on demand: a frame is drawn only when scroll progress, pointer springs, size or a tap pulse change, and
// the RAF loop stops as soon as everything has settled (brief: no continuous RAF while the scene is still).
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { poseAt, terrainHeight, SPROUT, type Pose } from '../../../lib/aimp/plant/timeline';

type Vec3 = [number, number, number];
interface Branches { trunk: Vec3[]; left: Vec3[]; right: Vec3[] }
export type Quality = 'high' | 'low';
export type LayoutMode = 'desktop' | 'mobile';

const LAVENDER = new THREE.Color('#a685ff');
const PEACH = new THREE.Color('#ffc9a3');

class Spring {
  value = 0; velocity = 0; target = 0;
  constructor(private stiffness = 120, private damping = 18) {}
  step(dt: number) {
    const a = this.stiffness * (this.target - this.value) - this.damping * this.velocity;
    this.velocity += a * dt; this.value += this.velocity * dt;
    if (Math.abs(this.target - this.value) < 1e-4 && Math.abs(this.velocity) < 1e-4) { this.value = this.target; this.velocity = 0; return false; }
    return true;
  }
}

/** Point and tangent at fraction t along a polyline sampled by arc length. */
function along(pts: Vec3[], t: number): { pos: THREE.Vector3; tan: THREE.Vector3 } {
  const f = Math.min(Math.max(t, 0), 1) * (pts.length - 1);
  const i = Math.min(Math.floor(f), pts.length - 2);
  const k = f - i;
  const a = new THREE.Vector3(...pts[i]), b = new THREE.Vector3(...pts[i + 1]);
  return { pos: a.clone().lerp(b, k), tan: b.sub(a).normalize() };
}

function radialTexture(): THREE.Texture {
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const g = c.getContext('2d')!;
  const grad = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  grad.addColorStop(0, 'rgba(255,255,255,1)'); grad.addColorStop(0.35, 'rgba(255,255,255,0.45)'); grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad; g.fillRect(0, 0, 256, 256);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

export class PlantScene {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(30, 1, 0.1, 60);
  private rig = new THREE.Group();        // pointer tilt only, around the plant's base
  private seed = new THREE.Group();
  // Each part sits in a pivot group so its own node transform (glTF quantisation scale/offset) is preserved.
  private shellA?: THREE.Group; private shellB?: THREE.Group; private core?: THREE.Group;
  private coreMat?: THREE.MeshPhysicalMaterial; private shellMats: THREE.MeshStandardMaterial[] = [];
  private leaves: THREE.Group[] = [];
  private stemUniforms = { uTrunk: { value: 0 }, uLeft: { value: 0 }, uRight: { value: 0 }, uGlow: { value: 0.3 }, uPulse: { value: 0 } };
  private terrainUniforms = { uWave: { value: 0 }, uMound: { value: 0 }, uShow: { value: 0 } };
  private groundGlow: THREE.Mesh; private seedGlow: THREE.Mesh; private terrain: THREE.Mesh;
  private branches?: Branches;
  private progress = 0;          // what is drawn
  private target = 0;            // where the scroll position is
  private tiltX = new Spring(60, 14); private tiltY = new Spring(60, 14); private pulse = new Spring(40, 7);
  private raf = 0; private last = 0; private dirty = true; private visible = true; private disposed = false;
  private mode: LayoutMode = 'desktop';
  private width = 1; private height = 1;
  // Adaptive resolution: if frames run slow while scrolling, step the pixel ratio down (never up mid-session).
  private resScale = 1; private slowFrames = 0; private lastRender = 0;
  readonly quality: Quality;

  constructor(private canvas: HTMLCanvasElement, quality: Quality) {
    this.quality = quality;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.transmissionResolutionScale = 0.35;   // the glass refraction pass is the most expensive part; half-res is invisible here
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    this.scene.environmentIntensity = 0.55;
    pmrem.dispose();
    // No fog or backdrop: the canvas is transparent and the object sits directly on the page background.

    this.scene.add(new THREE.HemisphereLight(0xffffff, 0xcbb8ff, 0.55));
    const key = new THREE.DirectionalLight(0xfffaf5, 2.6); key.position.set(-6, 3.2, 4); this.scene.add(key);
    const fill = new THREE.DirectionalLight(0xd8c8ff, 0.7); fill.position.set(5, 1, 4); this.scene.add(fill);
    const rim = new THREE.DirectionalLight(0xffd9c2, 1.4); rim.position.set(3, 4, -5); this.scene.add(rim);

    this.camera.position.set(0, 1.5, 7);
    this.camera.lookAt(0, 1.35, 0);
    this.scene.add(this.rig);
    this.rig.add(this.seed);
    this.seed.rotation.order = 'ZYX';   // spin about the seed's own axis first, then tilt
    this.terrain = this.makeTerrain();
    this.scene.add(this.terrain);

    const tex = radialTexture();
    const glowMat = (color: THREE.Color, opacity: number) => new THREE.MeshBasicMaterial({ map: tex, color, transparent: true, opacity, depthWrite: false, blending: THREE.NormalBlending, fog: false });
    this.groundGlow = new THREE.Mesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), glowMat(LAVENDER, 0.55));
    this.seedGlow = new THREE.Mesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), glowMat(PEACH, 0.5));
    this.groundGlow.renderOrder = 1; this.seedGlow.renderOrder = 2;
    this.scene.add(this.groundGlow, this.seedGlow);
  }

  async load(url = '/plant/plant.glb', branchesUrl = '/plant/branches.json'): Promise<void> {
    const [gltf, branches] = await Promise.all([
      new GLTFLoader().loadAsync(url),
      fetch(branchesUrl).then((r) => { if (!r.ok) throw new Error('branches'); return r.json() as Promise<Branches>; }),
    ]);
    if (this.disposed) return;
    this.branches = branches;
    const byName = (n: string) => gltf.scene.getObjectByName(n) as THREE.Mesh;
    // Low quality (touch devices): no transmission pass; an opaque, deeper-tinted iridescent glass reads the same.
    const tone = (hex: string) => this.quality === 'high' ? new THREE.Color(hex) : new THREE.Color(hex).multiplyScalar(0.8);
    const glass = (tint: string, extra: Partial<THREE.MeshPhysicalMaterialParameters> = {}) => new THREE.MeshPhysicalMaterial({
      color: tone(tint), roughness: 0.1, metalness: 0, ior: 1.45, iridescence: 0.8, iridescenceIOR: 1.35, iridescenceThicknessRange: [220, 620],
      clearcoat: 1, clearcoatRoughness: 0.06, attenuationColor: new THREE.Color('#8a66ee'), attenuationDistance: 0.45, specularIntensity: 1,
      ...(this.quality === 'high' ? { transmission: 0.92, thickness: 0.8 } : { roughness: 0.16, sheen: 0.8, sheenColor: new THREE.Color('#ffd7c4') }),
      ...extra,
    });

    const pivot = (mesh: THREE.Object3D) => { const g = new THREE.Group(); g.add(mesh); return g; };
    const coreMesh = byName('Seed_Core'), shellAMesh = byName('Seed_Shell_A'), shellBMesh = byName('Seed_Shell_B');
    this.coreMat = glass('#c6aeff', { emissive: new THREE.Color('#ff9f78'), emissiveIntensity: 0 });
    coreMesh.material = this.coreMat;
    const shell = new THREE.MeshStandardMaterial({ color: '#fdfcff', roughness: 0.5, transparent: true });
    this.shellMats = [shell, shell.clone()];
    shellAMesh.material = this.shellMats[0]; shellBMesh.material = this.shellMats[1];
    this.core = pivot(coreMesh); this.shellA = pivot(shellAMesh); this.shellB = pivot(shellBMesh);
    this.seed.add(this.core, this.shellA, this.shellB);

    const leafSrc = byName('Leaf');
    const leafMat = glass('#c3aaff', { emissive: new THREE.Color('#a98bff'), emissiveIntensity: 0.12, side: THREE.DoubleSide });
    leafMat.onBeforeCompile = (shader) => {
      // _white attribute (authored in Blender): matte pearl crown along one edge, glass elsewhere.
      shader.vertexShader = shader.vertexShader.replace('#include <common>', '#include <common>\nattribute float _white;\nvarying float vWhite;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\nvWhite = _white;');
      shader.fragmentShader = shader.fragmentShader.replace('#include <common>', '#include <common>\nvarying float vWhite;')
        .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ndiffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.99, 0.98, 1.0), vWhite);\ntotalEmissiveRadiance = mix(totalEmissiveRadiance + vec3(1.0, 0.78, 0.62) * 0.18 * (1.0 - vWhite), vec3(0.0), vWhite);')
        .replace('#include <transmission_fragment>', '#include <transmission_fragment>\n#ifdef USE_TRANSMISSION\nmaterial.transmission *= (1.0 - vWhite);\n#endif');
    };
    leafSrc.material = leafMat;
    for (let i = 0; i < 3; i++) {
      const leaf = pivot(leafSrc.clone());
      leaf.visible = false; this.leaves.push(leaf); this.rig.add(leaf);
    }

    const stem = byName('Tree_Stem');
    const stemMat = new THREE.MeshPhysicalMaterial({ color: '#e6dbff', roughness: 0.2, clearcoat: 0.6, clearcoatRoughness: 0.15,
      ...(this.quality === 'high' ? { transmission: 0.55, thickness: 0.2, attenuationColor: new THREE.Color('#c7b2ff'), attenuationDistance: 0.6 } : {}),
      side: THREE.DoubleSide });
    const u = this.stemUniforms;
    stemMat.onBeforeCompile = (shader) => {
      Object.assign(shader.uniforms, u);
      shader.vertexShader = shader.vertexShader.replace('#include <common>', '#include <common>\nattribute float _gs;\nattribute float _gb;\nvarying float vS;\nvarying float vB;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\nvS = _gs; vB = _gb;');
      shader.fragmentShader = shader.fragmentShader.replace('#include <common>', '#include <common>\nuniform float uTrunk; uniform float uLeft; uniform float uRight; uniform float uGlow; uniform float uPulse;\nvarying float vS; varying float vB;')
        .replace('#include <clipping_planes_fragment>', '#include <clipping_planes_fragment>\nfloat g = vB < 0.25 ? uTrunk : (vB < 0.75 ? uLeft : uRight);\nif (g <= 0.0001 || vS > g) discard;')
        .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
        float front = exp(-pow((g - vS) * 9.0, 2.0)) * step(g, 0.999);          // light rides the growing tip
        float pulseBand = exp(-pow((uPulse * 1.4 - vS) * 6.0, 2.0)) * step(0.001, uPulse); // tap pulse travels up
        float body = uGlow * (0.35 + 0.65 * smoothstep(0.0, 1.0, 1.0 - vS));
        totalEmissiveRadiance += mix(vec3(0.75, 0.66, 1.0), vec3(1.0, 0.8, 0.66), front) * (0.22 * body + 0.9 * front + 0.8 * pulseBand);`);
    };
    stem.material = stemMat; stem.frustumCulled = false;
    this.rig.add(stem);
    await this.warmUp();
    this.dirty = true; this.kick();
  }

  /**
   * Compile every shader up front (leaves, stem, ground and the glass transmission pass), so nothing stalls the first
   * time the plant appears mid-scroll. Without this the first sprout frame took ~600 ms on an M1.
   */
  private async warmUp() {
    this.applyPose(poseAt(0.9));
    for (const l of this.leaves) l.visible = true;
    this.seed.visible = true; this.terrain.visible = true;
    await this.renderer.compileAsync(this.scene, this.camera);
    this.renderer.render(this.scene, this.camera);   // also allocates the transmission render target
  }

  private makeTerrain(): THREE.Mesh {
    const seg = this.quality === 'high' ? 110 : 80;
    const geo = new THREE.PlaneGeometry(9, 9, seg, seg).rotateX(-Math.PI / 2);   // only the soft island is ever visible
    const mat = new THREE.MeshStandardMaterial({ color: '#fbf9ff', roughness: 0.92, metalness: 0, transparent: true });
    const u = this.terrainUniforms;
    mat.onBeforeCompile = (shader) => {
      Object.assign(shader.uniforms, u);
      const fn = `uniform float uWave; uniform float uMound; uniform float uShow;
      float terrainH(vec2 p) {
        float r = length(p - vec2(0.06, 0.0));
        float f = clamp((r - 0.7) / 2.4, 0.0, 1.0); f = f * f * (3.0 - 2.0 * f);
        float w = 0.36 * sin(0.42 * p.x + 0.3 * p.y + 0.6) + 0.16 * sin(0.85 * p.x - 0.55 * p.y + 1.3) + 0.07 * sin(1.7 * p.x + 1.2 * p.y);
        return uWave * w * f + uMound * 0.3 * exp(-(r * r) / 0.8);
      }`;
      shader.vertexShader = shader.vertexShader.replace('#include <common>', `#include <common>\n${fn}`)
        .replace('#include <beginnormal_vertex>', `vec2 tp = position.xz; float e = 0.04;
          float hx = terrainH(tp + vec2(e, 0.0)) - terrainH(tp - vec2(e, 0.0));
          float hz = terrainH(tp + vec2(0.0, e)) - terrainH(tp - vec2(0.0, e));
          vec3 objectNormal = normalize(vec3(-hx, 2.0 * e, -hz));
          #ifdef USE_TANGENT
          vec3 objectTangent = vec3(tangent.xyz);
          #endif`)
        .replace('#include <begin_vertex>', '#include <begin_vertex>\ntransformed.y += terrainH(position.xz);\nvSlope = objectNormal.y;\nvXZ = position.xz;');
      shader.vertexShader = shader.vertexShader.replace('#include <common>', '#include <common>\nvarying float vSlope;\nvarying vec2 vXZ;');
      // Soft lavender shading in the dune troughs and slopes, as in the reference landscape.
      shader.fragmentShader = shader.fragmentShader.replace('#include <common>', '#include <common>\nuniform float uShow;\nvarying float vSlope;\nvarying vec2 vXZ;')
        .replace('#include <color_fragment>', '#include <color_fragment>\ndiffuseColor.rgb *= mix(vec3(0.8, 0.76, 0.95), vec3(1.0), smoothstep(0.93, 1.0, vSlope));\n// The landscape is a soft island that fades to fully transparent: no horizon, no backdrop box.\ndiffuseColor.a *= uShow * (1.0 - smoothstep(0.9, 3.4, length(vXZ - vec2(0.06, 0.0))));');
    };
    const mesh = new THREE.Mesh(geo, mat);
    mesh.frustumCulled = false;
    return mesh;
  }

  /** Scroll progress 0..1. Deterministic: the frame depends on p (and pointer springs) only. */
  // Mouse wheels move in coarse steps; the drawn progress glides to the scroll position in ~150 ms and then stops
  // exactly on it, so the final state is still a pure function of scroll and nothing moves once scrolling ends.
  setProgress(p: number) { if (p !== this.target) { this.target = p; this.kick(); } }

  /** Pointer in -1..1 (desktop only). Springs ease toward it, then rendering stops. */
  setPointer(x: number, y: number) { this.tiltX.target = x; this.tiltY.target = y; this.kick(); }

  /** Tap or click on the plant: a light pulse travels up the stem and the leaves lift slightly. */
  tap() { this.pulse.value = 0; this.pulse.velocity = 2.2; this.pulse.target = 0; this.kick(); }

  setVisible(v: boolean) { this.visible = v; if (v) { this.dirty = true; this.kick(); } }

  resize(width: number, height: number, mode: LayoutMode) {
    this.width = Math.max(1, width); this.height = Math.max(1, height); this.mode = mode;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.25) * this.resScale;
    this.renderer.setPixelRatio(dpr);
    this.renderer.setSize(this.width, this.height, false);
    const aspect = this.width / this.height;
    this.camera.aspect = aspect;
    // Keep the whole tree (about 3.4 units wide) in frame on narrow screens by widening the vertical field of view.
    const dist = mode === 'mobile' ? 7.8 : 7;          // a little further back on phones so the whole tree clears the header
    this.camera.position.set(0, 1.5, dist); this.camera.lookAt(0, 1.35, 0);
    const halfW = mode === 'mobile' ? 1.75 : 2.4;
    const needV = 2 * Math.atan(Math.tan(Math.atan(halfW / dist)) / aspect) * 180 / Math.PI;
    this.camera.fov = Math.max(30, needV);
    // Shift the subject without moving the camera: right of the copy on desktop, above the copy on mobile.
    const w = this.width, h = this.height;
    if (mode === 'desktop') this.camera.setViewOffset(w, h, -w * 0.2, 0, w, h);
    else this.camera.setViewOffset(w, h, 0, h * 0.18, w, h);
    this.camera.updateProjectionMatrix();
    this.dirty = true; this.kick();
  }

  private applyPose(pose: Pose) {
    const b = this.branches;
    // seed
    const s = pose.seed;
    this.seed.visible = s.visible && !!this.core;
    this.seed.position.set(s.x, s.y, s.z);
    this.seed.rotation.set(0, s.rotY, s.rotZ);
    if (this.core && this.shellA && this.shellB) {
      const coreMat = this.coreMat!;
      coreMat.emissiveIntensity = 0.04 + 0.42 * s.coreGlow;
      this.core.scale.setScalar(s.coreScale);
      coreMat.transparent = s.coreOpacity < 1; coreMat.opacity = s.coreOpacity;
      const open = s.open;
      this.shellA.rotation.set(0, 0, 0.55 * open); this.shellA.position.set(0.12 * open, -0.05 * open, 0.05 * open);
      this.shellB.rotation.set(0, 0, -0.5 * open); this.shellB.position.set(-0.12 * open, -0.06 * open, -0.05 * open);
      for (const mm of this.shellMats) { mm.opacity = s.shellOpacity; mm.depthWrite = s.shellOpacity > 0.98; }
    }
    // terrain
    this.terrainUniforms.uWave.value = pose.terrain.wave;
    this.terrainUniforms.uMound.value = pose.terrain.mound;
    this.terrainUniforms.uShow.value = Math.min(1, pose.terrain.wave * 1.6 + pose.terrain.mound * 1.2);
    this.terrain.visible = this.terrainUniforms.uShow.value > 0.002;   // no ground pass while the seed floats
    // stem
    const pulse = Math.max(0, this.pulse.value);
    this.stemUniforms.uTrunk.value = pose.growth.trunk;
    this.stemUniforms.uLeft.value = pose.growth.left;
    this.stemUniforms.uRight.value = pose.growth.right;
    this.stemUniforms.uGlow.value = pose.glow;
    this.stemUniforms.uPulse.value = pulse > 0.001 ? 1 - Math.min(1, pulse) : 0;
    // leaves ride their growing tips
    if (b && this.leaves.length === 3) {
      const tip = (pts: Vec3[], t: number) => along(pts, t);
      const aAt = pose.growth.trunk <= SPROUT + 1e-6 ? tip(b.trunk, pose.growth.trunk) : tip(b.left, pose.growth.left);
      const placements: Array<{ at: { pos: THREE.Vector3 }; scale: number; unfurl: number; sprout: THREE.Vector3; tree: THREE.Vector3; roll: number }> = [
        { at: aAt, ...pose.leaves.a, sprout: new THREE.Vector3(-0.75, 0.66, 0.15), tree: new THREE.Vector3(-0.72, 0.68, 0.12), roll: 0.55 },
        { at: tip(b.trunk, pose.growth.trunk), ...pose.leaves.b, sprout: new THREE.Vector3(0.5, 0.86, 0.1), tree: new THREE.Vector3(0.55, 0.83, 0.08), roll: -0.5 },
        { at: tip(b.right, pose.growth.right), ...pose.leaves.c, sprout: new THREE.Vector3(0.75, 0.62, 0.15), tree: new THREE.Vector3(0.74, 0.64, 0.14), roll: -0.55 },
      ];
      const Y = new THREE.Vector3(0, 1, 0);
      placements.forEach((pl, i) => {
        const leaf = this.leaves[i];
        leaf.visible = pl.scale > 0.002;
        if (!leaf.visible) return;
        const dir = pl.sprout.clone().lerp(pl.tree, pose.tree).normalize();
        const lift = 0.12 * pulse;                                   // tap: leaves lift a touch, then settle
        dir.y += lift; dir.normalize();
        const q = new THREE.Quaternion().setFromUnitVectors(Y, dir);
        q.multiply(new THREE.Quaternion().setFromAxisAngle(Y, pl.roll));
        leaf.quaternion.copy(q);
        leaf.position.copy(pl.at.pos);
        const w = 0.25 + 0.75 * pl.unfurl;                            // folded blade opens as it emerges
        leaf.scale.set(pl.scale * w, pl.scale, pl.scale * (0.6 + 0.4 * pl.unfurl));
      });
    }
    // ground lights sit on the terrain surface
    const gx = pose.ground.x;
    const gy = terrainHeight(gx, 0, pose.terrain.wave, pose.terrain.mound) + 0.01;
    this.groundGlow.position.set(gx, gy, 0);
    this.groundGlow.scale.set(4.6 * pose.ground.spread, 1, 1.5 * pose.ground.spread);
    (this.groundGlow.material as THREE.MeshBasicMaterial).opacity = 0.75 * pose.ground.strength;
    this.seedGlow.position.set(gx, gy + 0.005, 0);
    this.seedGlow.scale.set(1.9 * pose.ground.spread, 1, 0.7 * pose.ground.spread);
    (this.seedGlow.material as THREE.MeshBasicMaterial).opacity = 0.45 + 0.4 * pose.glow;
    // pointer tilt around the plant's base
    this.rig.rotation.set(this.tiltY.value * 0.05, this.tiltX.value * 0.22, 0);
  }

  private kick() {
    if (this.raf || this.disposed) return;
    this.last = performance.now();
    this.raf = requestAnimationFrame(this.frame);
  }

  private frame = (now: number) => {
    this.raf = 0;
    if (this.disposed) return;
    const dt = Math.min(0.05, (now - this.last) / 1000); this.last = now;
    let moving = false;
    for (const sp of [this.tiltX, this.tiltY, this.pulse]) moving = sp.step(dt) || moving;
    if (this.progress !== this.target) {
      const d = this.target - this.progress;
      // big jumps (fast flick, anchor link) still arrive quickly: the glide is a fraction of the distance per frame
      this.progress = Math.abs(d) < 0.0005 ? this.target : this.progress + d * (1 - Math.exp(-dt / 0.06));
      this.dirty = true; moving = moving || this.progress !== this.target;
    }
    if ((this.dirty || moving) && this.visible) {
      this.applyPose(poseAt(this.progress));
      this.renderer.render(this.scene, this.camera);
      this.dirty = false;
      const gap = now - this.lastRender; this.lastRender = now;
      if (gap > 0 && gap < 120) {                       // only judge consecutive frames, not the first after a pause
        this.slowFrames = gap > 20 ? this.slowFrames + 1 : Math.max(0, this.slowFrames - 1);
        if (this.slowFrames > 12 && this.resScale > 0.55) {
          this.resScale = Math.max(0.55, this.resScale - 0.15); this.slowFrames = 0;
          this.resize(this.width, this.height, this.mode);
        }
      }
    }
    if (moving) this.kick();
  };

  /** Render one frame synchronously at progress p (used for static stills and tests). */
  renderStill(p: number) { this.progress = p; this.target = p; this.applyPose(poseAt(p)); this.renderer.render(this.scene, this.camera); }

  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.raf);
    this.scene.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.geometry) m.geometry.dispose();
      const mat = m.material as THREE.Material | THREE.Material[] | undefined;
      (Array.isArray(mat) ? mat : mat ? [mat] : []).forEach((x) => { Object.values(x).forEach((v) => { if (v instanceof THREE.Texture) v.dispose(); }); x.dispose(); });
    });
    this.scene.environment?.dispose();
    this.renderer.dispose();
  }
}

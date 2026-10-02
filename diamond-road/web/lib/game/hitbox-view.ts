/**
 * Developer view of the rules' hitboxes (lib/game/hitbox.ts) in the 3D field, and the
 * hit-by-pitch marker. Only drawn when switched on (developer mode), and only for what the
 * rules check: runners, the bags, the ball holder / fielders on a bag, and the batter.
 */
import * as THREE from "three";
import {
  BAG_HALF,
  GLOVE_R,
  TAG_ARM,
  batterBody,
  runnerShapes,
  type Capsule,
  type RunnerPose,
} from "./hitbox";
import { BASES, runnerPose, runnerSettled, type BaseballEngine } from "./engine";

const COLORS = { runner: "#ffd84a", bag: "#ffffff", fielder: "#ff5a5a", batter: "#4ad8ff" };

export class HitboxView {
  private group = new THREE.Group();
  private mats = new Map<string, THREE.Material>();
  private geos = new Map<string, THREE.BufferGeometry>();
  private pool: THREE.Mesh[] = [];
  private used = 0;
  private marker: THREE.Mesh;
  private markerId = 0;
  private markerAge = 9;

  constructor(
    scene: THREE.Scene,
    private engine: BaseballEngine,
  ) {
    this.group.renderOrder = 10;
    scene.add(this.group);
    this.marker = new THREE.Mesh(
      new THREE.RingGeometry(0.09, 0.14, 24),
      new THREE.MeshBasicMaterial({
        color: "#ff3b30",
        transparent: true,
        depthTest: false,
        side: THREE.DoubleSide,
      }),
    );
    this.marker.renderOrder = 11;
    this.marker.visible = false;
    scene.add(this.marker);
  }

  private mat(color: string) {
    let m = this.mats.get(color);
    if (!m) {
      m = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.28,
        depthWrite: false,
        wireframe: false,
      });
      this.mats.set(color, m);
    }
    return m;
  }
  private geo(key: string, make: () => THREE.BufferGeometry) {
    let g = this.geos.get(key);
    if (!g) {
      g = make();
      this.geos.set(key, g);
    }
    return g;
  }
  private mesh() {
    let m = this.pool[this.used];
    if (!m) {
      m = new THREE.Mesh();
      m.renderOrder = 10;
      this.pool.push(m);
      this.group.add(m);
    }
    this.used++;
    m.visible = true;
    return m;
  }
  private capsule(c: Capsule, color: string) {
    const a = new THREE.Vector3(c.a.x, c.a.y, c.a.z),
      b = new THREE.Vector3(c.b.x, c.b.y, c.b.z),
      len = a.distanceTo(b),
      key = `c${c.r.toFixed(2)}|${len.toFixed(2)}`,
      m = this.mesh();
    m.geometry = this.geo(key, () => new THREE.CapsuleGeometry(c.r, Math.max(0.001, len), 4, 10));
    m.material = this.mat(color);
    m.position.copy(a).add(b).multiplyScalar(0.5);
    const dir = len > 1e-4 ? b.clone().sub(a).normalize() : new THREE.Vector3(0, 1, 0);
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
  }
  private box(x: number, z: number, half: number, color: string) {
    const m = this.mesh();
    m.geometry = this.geo(`b${half}`, () => new THREE.BoxGeometry(half * 2, 0.12, half * 2));
    m.material = this.mat(color);
    m.position.set(x, 0.06, z);
    // Bags sit square to the base paths (45° to the world axes).
    m.quaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 4);
  }
  private ring(x: number, z: number, radius: number, color: string) {
    const m = this.mesh();
    m.geometry = this.geo(`r${radius}`, () =>
      new THREE.RingGeometry(radius - 0.03, radius, 40).rotateX(-Math.PI / 2),
    );
    m.material = this.mat(color);
    m.position.set(x, 0.25, z);
    m.quaternion.identity();
  }

  update(dt: number, camera: THREE.Camera) {
    const s = this.engine.state;
    // Hit-by-pitch marker (always shown): a red ring that pops where the ball hit him.
    if (s.hbp && s.hbp.id !== this.markerId) {
      this.markerId = s.hbp.id;
      this.markerAge = 0;
      this.marker.position.set(s.hbp.x, s.hbp.y, s.hbp.z);
    }
    this.markerAge += dt;
    this.marker.visible = this.markerAge < 1.6;
    if (this.marker.visible) {
      const u = this.markerAge / 1.6;
      this.marker.scale.setScalar(1 + u * 2.5);
      (this.marker.material as THREE.MeshBasicMaterial).opacity = 1 - u;
      this.marker.quaternion.copy(camera.quaternion);
    }

    this.used = 0;
    if (s.showHitboxes) this.collect();
    for (let i = this.used; i < this.pool.length; i++) this.pool[i].visible = false;
    this.group.visible = s.showHitboxes;
  }

  private collect() {
    const s = this.engine.state,
      l = s.live;
    for (let b = 0; b < 4; b++) this.box(BASES[b].x, BASES[b].z, BAG_HALF, COLORS.bag);
    // The batter's body while a pitch can still hit him.
    if (
      !l &&
      (s.phase === "ready" || s.phase === "windup" || s.phase === "flight" || s.phase === "result")
    )
      for (const c of batterBody(this.engine.batter.hand)) this.capsule(c, COLORS.batter);
    if (!l || s.phase !== "inplay") return;
    for (const r of l.runners) {
      if (r.out || r.progress >= 4) continue;
      const pose = runnerPose(r),
        f = pose.facing,
        n = Math.hypot(f.x, f.z) || 1,
        dir = runnerSettled(r) ? { x: 0, y: 0, z: 0 } : { x: f.x / n, y: 0, z: f.z / n },
        kind: RunnerPose = r.slide?.base === r.target ? r.slide.kind : "run";
      for (const c of runnerShapes(pose.position, dir, kind)) this.capsule(c, COLORS.runner);
    }
    // Fielders standing on a bag, and the glove reach of whoever holds the ball.
    const t = l.throw,
      holding = l.fieldedAt !== null && (!t || t.receivedAt !== null);
    l.defenders.forEach((d, i) => {
      const onBag = BASES.some((b) => Math.hypot(b.x - d.x, b.z - d.z) < 3);
      if (!onBag && !(holding && i === l.fielder)) return;
      this.capsule(
        { a: { x: d.x, y: 0.25, z: d.z }, b: { x: d.x, y: 1.6, z: d.z }, r: 0.22, part: "" },
        COLORS.fielder,
      );
      if (holding && i === l.fielder) this.ring(d.x, d.z, TAG_ARM + GLOVE_R, COLORS.fielder);
    });
  }

  dispose() {
    for (const g of this.geos.values()) g.dispose();
    for (const m of this.mats.values()) m.dispose();
    this.marker.geometry.dispose();
    (this.marker.material as THREE.Material).dispose();
    this.group.removeFromParent();
    this.marker.removeFromParent();
  }
}

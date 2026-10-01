import * as THREE from "three";
import {
  BaseballEngine,
  BASES,
  DEFENSE,
  PITCHES,
  V,
  batReach,
  clamp,
  lerp,
  runnerPose,
  playerYaw,
  type Vec,
} from "./engine";

type Figure = {
  root: THREE.Group;
  left: THREE.Group;
  right: THREE.Group;
  legL: THREE.Group;
  legR: THREE.Group;
  bat?: THREE.Mesh;
};
export class BaseballField {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(32, 1, 0.1, 600);
  private players: Figure[] = [];
  private batter: Figure;
  private runners: Figure[] = [];
  private ball: THREE.Mesh;
  private halo: THREE.Mesh;
  private target: THREE.Group;
  private hint: THREE.Group;
  private zone: THREE.Group;
  private trail: THREE.Line;
  private trailPositions: THREE.Vector3[] = [];
  private landing: THREE.Mesh;
  private time = 0;
  private resize: ResizeObserver;
  private lastPhase = "";
  private disposed = false;
  private materials = new Map<string, THREE.MeshStandardMaterial>();
  private raycaster = new THREE.Raycaster();
  private plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
  private cameraKey = "";
  constructor(
    private host: HTMLElement,
    private engine: BaseballEngine,
  ) {
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: "high-performance",
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.7));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.25;
    this.renderer.domElement.setAttribute(
      "aria-label",
      "3D 야구장. 마우스로 조준하고 클릭해 투구 또는 스윙",
    );
    this.renderer.domElement.style.touchAction = "none";
    host.appendChild(this.renderer.domElement);
    this.scene.background = new THREE.Color("#b5d2d5");
    this.scene.fog = new THREE.Fog("#b5d2d5", 115, 280);
    this.scene.add(new THREE.HemisphereLight(0xe3f3ff, 0x597649, 2.1));
    const sun = new THREE.DirectionalLight(0xffeed7, 3.2);
    sun.position.set(-35, 70, -24);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.left = -65;
    sun.shadow.camera.right = 65;
    sun.shadow.camera.top = 80;
    sun.shadow.camera.bottom = -40;
    sun.shadow.normalBias = 0.025;
    sun.shadow.bias = -0.0003;
    sun.shadow.camera.far = 200;
    this.scene.add(sun);
    this.makePark();
    DEFENSE.forEach((p, i) => {
      const fig = this.figure(i === 1 ? "#233f58" : "#eeeade", i === 1 ? "#233f58" : "#294b62");
      fig.root.position.set(p.x, 0, p.z);
      fig.root.rotation.y = Math.PI;
      this.scene.add(fig.root);
      this.players.push(fig);
    });
    this.batter = this.figure("#c06645", "#26353e", true);
    this.scene.add(this.batter.root);
    for (let i = 0; i < 4; i++) {
      const runner = this.figure("#c06645", "#26353e");
      this.scene.add(runner.root);
      this.runners.push(runner);
    }
    this.ball = new THREE.Mesh(
      new THREE.SphereGeometry(0.075, 12, 10),
      new THREE.MeshStandardMaterial({
        color: "#fffde5",
        emissive: "#b7a97b",
        emissiveIntensity: 0.5,
      }),
    );
    this.ball.castShadow = true;
    this.scene.add(this.ball);
    this.halo = new THREE.Mesh(
      new THREE.RingGeometry(0.12, 0.16, 28),
      new THREE.MeshBasicMaterial({
        color: "#fff0a9",
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.7,
        depthTest: false,
      }),
    );
    this.scene.add(this.halo);
    this.zone = new THREE.Group();
    this.line(
      [
        V(-0.215, 0.55, 0.02),
        V(0.215, 0.55, 0.02),
        V(0.215, 1.35, 0.02),
        V(-0.215, 1.35, 0.02),
        V(-0.215, 0.55, 0.02),
      ],
      "#f0e9c8",
      this.zone,
      0.65,
    );
    for (let i = 1; i < 3; i++) {
      this.line(
        [V(-0.215, 0.55 + (i * 0.8) / 3, 0.02), V(0.215, 0.55 + (i * 0.8) / 3, 0.02)],
        "#e1e4d0",
        this.zone,
        0.18,
      );
      this.line(
        [V(-0.215 + (i * 0.43) / 3, 0.55, 0.02), V(-0.215 + (i * 0.43) / 3, 1.35, 0.02)],
        "#e1e4d0",
        this.zone,
        0.18,
      );
    }
    this.scene.add(this.zone);
    this.target = new THREE.Group();
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.085, 0.096, 32),
      new THREE.MeshBasicMaterial({ color: "#f0be60", side: THREE.DoubleSide, depthTest: false }),
    );
    this.target.add(ring);
    this.line([V(-0.14, 0, 0), V(0.14, 0, 0)], "#f0be60", this.target);
    this.line([V(0, -0.14, 0), V(0, 0.14, 0)], "#f0be60", this.target);
    this.scene.add(this.target);
    // Batting: faint disc where the pitch will cross the plate (radius 1, scaled per pitch).
    this.hint = new THREE.Group();
    // A soft glow rather than a hard ring: the batter only has a rough read of the pitch.
    const glow = document.createElement("canvas");
    glow.width = glow.height = 128;
    const g = glow.getContext("2d")!,
      grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    grad.addColorStop(0, "rgba(255,248,223,0.42)");
    grad.addColorStop(0.6, "rgba(255,248,223,0.2)");
    grad.addColorStop(1, "rgba(255,248,223,0)");
    g.fillStyle = grad;
    g.fillRect(0, 0, 128, 128);
    const glowMap = new THREE.CanvasTexture(glow);
    glowMap.colorSpace = THREE.SRGBColorSpace;
    const disc = new THREE.Mesh(
      new THREE.PlaneGeometry(2.3, 2.3),
      new THREE.MeshBasicMaterial({
        map: glowMap,
        transparent: true,
        side: THREE.DoubleSide,
        depthTest: false,
        depthWrite: false,
      }),
    );
    disc.renderOrder = 2;
    this.hint.add(disc);
    this.scene.add(this.hint);
    this.trail = new THREE.Line(
      new THREE.BufferGeometry(),
      new THREE.LineBasicMaterial({ color: "#ffe3a1", transparent: true, opacity: 0.8 }),
    );
    this.scene.add(this.trail);
    this.landing = new THREE.Mesh(
      new THREE.RingGeometry(1.8, 2, 40),
      new THREE.MeshBasicMaterial({ color: "#f8c267", side: THREE.DoubleSide }),
    );
    this.landing.rotation.x = -Math.PI / 2;
    this.scene.add(this.landing);
    this.resize = new ResizeObserver(() => {
      const w = host.clientWidth,
        h = host.clientHeight;
      if (!w || !h) return;
      this.renderer.setSize(w, h, false);
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
    });
    this.resize.observe(host);
    this.renderer.domElement.addEventListener("pointermove", this.pointerMove);
    this.renderer.domElement.addEventListener("pointerdown", this.pointerDown);
    this.update(0);
  }
  private material(color: string) {
    if (!this.materials.has(color))
      this.materials.set(color, new THREE.MeshStandardMaterial({ color, roughness: 0.83 }));
    return this.materials.get(color)!;
  }
  private mesh(
    geo: THREE.BufferGeometry,
    color: string,
    x: number,
    y: number,
    z: number,
    parent: THREE.Object3D = this.scene,
  ) {
    const m = new THREE.Mesh(geo, this.material(color));
    m.position.set(x, y, z);
    m.receiveShadow = true;
    parent.add(m);
    return m;
  }
  private box(
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    color: string,
    parent: THREE.Object3D = this.scene,
  ) {
    return this.mesh(new THREE.BoxGeometry(w, h, d), color, x, y, z, parent);
  }
  private disk(x: number, z: number, r: number, color: string, y = 0.015) {
    const m = this.mesh(new THREE.CircleGeometry(r, 80), color, x, y, z);
    m.rotation.x = -Math.PI / 2;
    return m;
  }
  private line(points: Vec[], color: string, parent: THREE.Object3D = this.scene, opacity = 1) {
    const geo = new THREE.BufferGeometry().setFromPoints(
        points.map((p) => new THREE.Vector3(p.x, p.y, p.z)),
      ),
      line = new THREE.Line(
        geo,
        new THREE.LineBasicMaterial({ color, transparent: opacity < 1, opacity }),
      );
    parent.add(line);
    return line;
  }
  private label(
    text: string,
    color: string,
    bg: string,
    w: number,
    h: number,
    x: number,
    y: number,
    z: number,
    rotation = Math.PI,
  ) {
    const c = document.createElement("canvas");
    c.width = 1024;
    c.height = 256;
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 1024, 256);
    ctx.fillStyle = color;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "bold 88px Arial";
    ctx.fillText(text, 512, 136, 980);
    const texture = new THREE.CanvasTexture(c);
    texture.colorSpace = THREE.SRGBColorSpace;
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshBasicMaterial({ map: texture }),
    );
    m.position.set(x, y, z);
    m.rotation.y = rotation;
    this.scene.add(m);
  }
  private makePark() {
    this.box(0, -0.27, 43, 290, 0.5, 290, "#53725a");
    for (let i = -3; i < 15; i++)
      this.box(0, -0.006, i * 10, 220, 0.016, 10, i % 2 ? "#497b58" : "#518760");
    // The infield is an actual playable surface, with 27.4 m base paths.
    const diamond = new THREE.Shape();
    diamond.moveTo(0, -1.5);
    diamond.lineTo(25, 24);
    diamond.quadraticCurveTo(24, 48, 0, 49);
    diamond.quadraticCurveTo(-24, 48, -25, 24);
    diamond.lineTo(0, -1.5);
    const ground = this.mesh(new THREE.ShapeGeometry(diamond, 48), "#b9916b", 0, 0.017, 0);
    ground.rotation.x = Math.PI / 2;
    (ground.material as THREE.MeshStandardMaterial).side = THREE.DoubleSide;
    const inner = this.box(0, 0.028, 22.5, 25, 0.016, 25, "#548960");
    inner.rotation.y = Math.PI / 4;
    this.disk(0, 0, 4.3, "#c29a72", 0.032);
    this.disk(0, 18.44, 2.8, "#c49e79", 0.05);
    const mound = this.mesh(
      new THREE.CylinderGeometry(1.4, 2.8, 0.28, 48),
      "#c49e79",
      0,
      0.15,
      18.44,
    );
    mound.receiveShadow = true;
    this.box(0, 0.3, 18.6, 0.61, 0.025, 0.15, "#f4ede0");
    BASES.slice(0, 3).forEach((p) => {
      this.disk(p.x, p.z, 1.4, "#c29a72", 0.04);
      const b = this.box(p.x, 0.1, p.z, 0.5, 0.1, 0.5, "#f4ecda");
      b.rotation.y = Math.PI / 4;
    });
    const plate = new THREE.Shape();
    plate.moveTo(-0.215, 0.22);
    plate.lineTo(0.215, 0.22);
    plate.lineTo(0.215, 0);
    plate.lineTo(0, -0.24);
    plate.lineTo(-0.215, 0);
    plate.closePath();
    const home = this.mesh(new THREE.ShapeGeometry(plate), "#fff8e2", 0, 0.052, 0);
    home.rotation.x = -Math.PI / 2;
    this.line([V(-74, 0.06, 74), V(0, 0.06, 0), V(74, 0.06, 74)], "#eee8cf");
    for (const x of [-0.76, 0.76])
      this.line(
        [
          V(x - 0.25, 0.06, -0.55),
          V(x + 0.25, 0.06, -0.55),
          V(x + 0.25, 0.06, 0.6),
          V(x - 0.25, 0.06, 0.6),
          V(x - 0.25, 0.06, -0.55),
        ],
        "#e6d7bd",
      );
    const arc: Vec[] = [];
    for (let i = 0; i <= 64; i++) {
      const a = -Math.PI / 4 + (i * Math.PI) / 128;
      arc.push(V(Math.sin(a) * 107, 0.03, Math.cos(a) * 107));
    }
    this.line(arc, "#c8a37b");
    for (let i = 0; i < 40; i++) {
      const a = -Math.PI / 4 + ((i + 0.5) * Math.PI) / 80,
        x = Math.sin(a) * 108,
        z = Math.cos(a) * 108;
      const f = this.box(x, 1.6, z, 4.4, 3.2, 0.5, "#294e49");
      f.rotation.y = a;
      const top = this.box(x, 3.25, z, 4.4, 0.12, 0.65, "#e2c97b");
      top.rotation.y = a;
    }
    for (const side of [-1, 1]) {
      const a = (side * Math.PI) / 4;
      const pole = this.mesh(
        new THREE.CylinderGeometry(0.12, 0.16, 14, 8),
        "#f0c74b",
        Math.sin(a) * 106,
        7,
        Math.cos(a) * 106,
      );
      pole.castShadow = true;
    }
    // Low-poly grandstand tiers wrap behind home plate, facing the field.
    for (let side = -1; side <= 1; side += 2) {
      for (let section = 0; section < 6; section++) {
        const x = side * (9 + section * 7),
          z = -14 + section * 5;
        for (let row = 0; row < 5; row++) {
          const stand = this.box(
            x + side * row * 1.5,
            1 + row * 0.85,
            z - row * 2,
            7.2,
            0.7,
            2.4,
            row % 2 ? "#294652" : "#345562",
          );
          stand.rotation.y = -side * 0.42;
        }
      }
      this.box(side * 21, 1, -0.5, 10, 2, 3, "#224450");
      this.box(side * 21, 2.4, -0.5, 11, 0.25, 4, "#17313d");
    }
    this.box(0, 1, -14, 19, 2, 1, "#254650");
    this.label("HANEUL BASEBALL", "#ead7a8", "#254650", 14, 2, 0, 2.7, -14, 0);
    this.box(0, 7.5, 116, 24, 12, 1, "#233c48");
    this.label("DIAMOND ROAD", "#f2c778", "#233c48", 22, 5, 0, 9.8, 115.4);
    this.label("HOME OF THE NEXT ACE", "#c6d9d5", "#233c48", 20, 3, 0, 5.8, 115.3);
    const crowdGeometry = new THREE.BoxGeometry(0.42, 0.7, 0.45);
    const crowd = new THREE.InstancedMesh(
      crowdGeometry,
      new THREE.MeshStandardMaterial({ roughness: 0.9 }),
      480,
    );
    const o = new THREE.Object3D();
    const colors = ["#e9dcc3", "#cf815c", "#7f9ba2", "#183542", "#dcb356"];
    for (let i = 0; i < 480; i++) {
      const side = i % 2 ? 1 : -1,
        section = Math.floor(i / 80),
        row = Math.floor(i / 16) % 5,
        col = Math.floor(i / 2) % 8;
      o.position.set(
        side * (6.7 + section * 7 + row * 1.5 + col * 0.64),
        1.8 + row * 0.85,
        -14 + section * 5 - row * 2,
      );
      o.updateMatrix();
      crowd.setMatrixAt(i, o.matrix);
      crowd.setColorAt(i, new THREE.Color(colors[i % colors.length]));
    }
    this.scene.add(crowd);
    for (const [x, z] of [
      [-55, 10],
      [55, 10],
      [-74, 82],
      [74, 82],
    ]) {
      this.mesh(new THREE.CylinderGeometry(0.25, 0.45, 26, 10), "#7b8e8d", x, 13, z);
      this.box(x, 26, z, 7, 1.4, 0.7, "#ece9d7");
      for (let j = -2; j <= 2; j++) this.box(x + j * 1.2, 26, z - 0.4, 0.9, 0.8, 0.1, "#fffbdc");
    }
    for (let i = 0; i < 23; i++) {
      const x = -140 + i * 13,
        z = 128 + Math.sin(i) * 8;
      this.box(x, 7 + (i % 4) * 3, z, 9, 14 + (i % 4) * 6, 9, i % 2 ? "#88a4a4" : "#789798");
    }
  }
  private figure(shirt: string, cap: string, withBat = false): Figure {
    const root = new THREE.Group();
    const torso = this.mesh(
      new THREE.CylinderGeometry(0.25, 0.2, 0.62, 8),
      shirt,
      0,
      1.12,
      0,
      root,
    );
    torso.castShadow = true;
    this.mesh(new THREE.SphereGeometry(0.19, 10, 8), "#d9ac86", 0, 1.67, 0, root);
    this.mesh(new THREE.CylinderGeometry(0.21, 0.21, 0.12, 10), cap, 0, 1.84, 0, root);
    this.box(0, 1.81, -0.16, 0.26, 0.035, 0.22, cap, root);
    this.box(0, 0.86, 0, 0.4, 0.07, 0.32, cap, root);
    const limb = (x: number, y: number, length: number, color: string) => {
      const g = new THREE.Group();
      g.position.set(x, y, 0);
      const m = this.mesh(
        new THREE.CylinderGeometry(0.072, 0.065, length, 7),
        color,
        0,
        -length / 2,
        0,
        g,
      );
      m.castShadow = true;
      root.add(g);
      return g;
    };
    const left = limb(-0.29, 1.38, 0.57, shirt),
      right = limb(0.29, 1.38, 0.57, shirt),
      legL = limb(-0.11, 0.84, 0.77, "#e2ded1"),
      legR = limb(0.11, 0.84, 0.77, "#e2ded1");
    this.box(0, -0.75, -0.07, 0.16, 0.13, 0.3, cap, legL);
    this.box(0, -0.75, -0.07, 0.16, 0.13, 0.3, cap, legR);
    this.mesh(new THREE.SphereGeometry(0.13, 8, 6), "#8a562f", 0, -0.57, 0, left);
    let bat: THREE.Mesh | undefined;
    if (withBat) {
      bat = this.mesh(
        new THREE.CylinderGeometry(0.043, 0.025, 1.05, 8),
        "#dcb785",
        0.16,
        -0.25,
        -0.25,
        right,
      );
      bat.rotation.z = -0.65;
    }
    return { root, left, right, legL, legR, bat };
  }
  private pointerMove = (e: PointerEvent) => {
    this.aimFromPointer(e);
  };
  private pointerDown = (e: PointerEvent) => {
    if (e.button !== 0) return;
    this.aimFromPointer(e);
    if (this.engine.batting) this.engine.swing();
    else this.engine.throwAt();
  };
  private aimFromPointer(e: PointerEvent) {
    const r = this.renderer.domElement.getBoundingClientRect();
    this.raycaster.setFromCamera(
      new THREE.Vector2(
        ((e.clientX - r.left) / r.width) * 2 - 1,
        (-(e.clientY - r.top) / r.height) * 2 + 1,
      ),
      this.camera,
    );
    const target = new THREE.Vector3();
    if (
      this.raycaster.ray.intersectPlane(this.plane, target) &&
      Math.abs(target.x) < 1.3 &&
      target.y > -0.1 &&
      target.y < 2.3
    )
      this.engine.setAim(target.x, target.y);
  }
  update(dt: number) {
    if (this.disposed || !this.host.clientWidth || !this.host.clientHeight) return;
    this.time += dt;
    const s = this.engine.state;
    let cam = s.camera;
    if (s.phase === "inplay" && s.autoCamera) cam = "ball";
    const key = cam + this.host.clientWidth / this.host.clientHeight;
    const narrow = this.host.clientWidth < 600;
    let pos = new THREE.Vector3(),
      look = new THREE.Vector3(),
      fov = 32;
    if (cam === "pitcher") {
      pos.set(-1.4, 2.75, 24.4);
      look.set(0, 1, 0);
      fov = narrow ? 36 : 27;
    } else if (cam === "catcher") {
      pos.set(0, 1.95, -5.3);
      // Aim slightly low so the strike zone sits above the bottom HUD.
      look.set(0, 0.3, 18.44);
      fov = 39;
    } else if (cam === "broadcast") {
      pos.set(53, 37, -24);
      look.set(0, 0, 28);
      fov = 51;
    } else if (cam === "top") {
      pos.set(0, 125, 35);
      look.set(0, 0, 35.01);
      fov = 61;
    } else {
      const b = s.ball;
      pos.set(b.x * 0.42 + 25, Math.max(25, b.y + 17), b.z * 0.45 - 18);
      look.set(b.x * 0.7, Math.max(1, b.y * 0.4), b.z * 0.7 + 8);
      fov = 56;
    }
    const k = this.cameraKey !== key ? 1 : Math.min(1, dt * 5);
    this.camera.position.lerp(pos, k);
    this.camera.lookAt(look);
    if (this.camera.fov !== fov) {
      this.camera.fov = fov;
      this.camera.updateProjectionMatrix();
    }
    this.cameraKey = key;
    this.players.forEach((p, i) => {
      const pos = s.phase === "inplay" && s.live ? s.live.defenders[i] : DEFENSE[i];
      p.root.position.set(pos.x, 0, pos.z);
      p.root.visible = true;
      p.root.rotation.y = i === 1 ? Math.PI : 0;
      p.left.rotation.set(0.12, 0, -0.15);
      p.right.rotation.set(0.1, 0, 0.15);
      p.legL.rotation.x = 0;
      p.legR.rotation.x = 0;
    });
    const pitcher = this.players[0];
    if (s.phase === "windup") {
      const u = 1 - s.timer / 0.62;
      pitcher.right.rotation.x = -Math.PI * u;
      pitcher.left.rotation.x = -0.9;
      pitcher.legL.rotation.x = -Math.sin(u * Math.PI) * 1.3;
    } else if (s.phase === "flight") {
      pitcher.right.rotation.x = 0.9;
      pitcher.root.rotation.x = 0.15;
    } else pitcher.root.rotation.x = 0;
    const catcher = this.players[1];
    catcher.root.scale.y = 0.68;
    catcher.root.position.y = 0.02;
    // From the catcher camera the catcher model would hide the zone and the incoming ball.
    catcher.root.visible = cam !== "catcher" || s.phase === "inplay";
    const hand = this.engine.batter.hand === "L" ? -1 : 1;
    this.batter.root.position.set(hand * 0.82, 0, 0);
    this.batter.root.rotation.y = (hand * Math.PI) / 2;
    // Left-handed batters are the mirror image: bat and hands on the other side.
    this.batter.root.scale.x = hand;
    this.batter.left.rotation.x = -0.9;
    this.batter.right.rotation.x = -1.8;
    this.batter.right.rotation.z = -0.5;
    const f = s.flight;
    // The batter leaves the box only on a batted ball (not on a steal, pickoff or wild pitch).
    this.batter.root.visible =
      s.mode !== "bullpen" && !(s.phase === "inplay" && s.live?.kind === "batted");
    if (f?.swung) {
      const u = clamp((f.elapsed - f.swingTime) / 0.22, 0, 1);
      this.batter.root.rotation.y = (hand * Math.PI) / 2 + hand * Math.sin(u * Math.PI) * 1.6;
      this.batter.right.rotation.x = -1.5 + u * 2.4;
    }
    if (s.live && s.phase === "inplay") {
      const l = s.live,
        p = this.players[l.fielder],
        target = l.throw ? BASES[l.throw.base - 1] : l.bounced ? l.land : l.catchPoint;
      p.root.rotation.y = playerYaw(V(target.x - l.fielderPos.x, 0, target.z - l.fielderPos.z));
      if (l.fieldedAt === null) {
        p.legL.rotation.x = Math.sin(this.time * 17) * 0.6;
        p.legR.rotation.x = -p.legL.rotation.x;
      }
      if (l.state === "송구") p.right.rotation.x = -1.5;
      if (l.caughtFly) p.left.rotation.x = -2;
      this.landing.visible = l.fieldedAt === null;
      this.landing.position.set(l.land.x, 0.1, l.land.z);
    } else this.landing.visible = false;
    this.runners.forEach((r, i) => {
      r.root.visible = false;
      r.legL.rotation.x = 0;
      r.legR.rotation.x = 0;
      const l = s.live;
      if (l && s.phase === "inplay") {
        const track = l.runners.find((r) => r.id === i);
        if (!track) return;
        const pose = runnerPose(track);
        r.root.visible = pose.visible;
        r.root.position.set(pose.position.x, 0, pose.position.z);
        r.root.rotation.y = playerYaw(pose.facing);
        if (pose.moving) {
          r.legL.rotation.x = Math.sin(this.time * 18) * 0.65;
          r.legR.rotation.x = -r.legL.rotation.x;
        }
      } else if (i === 0 && s.stealTrack) {
        // The E-steal runner breaks during the delivery.
        const pose = runnerPose(s.stealTrack);
        r.root.visible = true;
        r.root.position.set(pose.position.x, 0, pose.position.z);
        r.root.rotation.y = playerYaw(pose.facing);
        r.legL.rotation.x = Math.sin(this.time * 18) * 0.65;
        r.legR.rotation.x = -r.legL.rotation.x;
      } else if (i < 3 && s.bases[i]) {
        r.root.visible = true;
        r.root.position.set(BASES[i].x + 0.65, 0, BASES[i].z);
        r.root.rotation.y = 0;
      }
    });
    this.ball.position.set(s.ball.x, s.ball.y, s.ball.z);
    this.ball.visible = s.phase === "flight" || s.phase === "inplay" || s.phase === "result";
    const ballDistance = this.camera.position.distanceTo(this.ball.position);
    this.ball.scale.setScalar(Math.max(1, ballDistance / 18));
    this.halo.position.copy(this.ball.position);
    this.halo.quaternion.copy(this.camera.quaternion);
    this.halo.scale.copy(this.ball.scale);
    this.halo.visible = this.ball.visible && s.phase !== "result";
    this.zone.visible = s.phase !== "inplay" && (cam === "pitcher" || cam === "catcher");
    this.target.visible = this.zone.visible && s.phase !== "result";
    const aim = s.flight && !this.engine.batting ? s.flight.aim : s.aim;
    this.target.position.set(aim.x, aim.y, 0.03);
    // When batting, the aim ring shows how far the bat may miss and still connect.
    this.target.scale.setScalar(
      this.engine.batting ? batReach(s.career.stats.contact, s.swingStyle) / 0.09 : 1,
    );
    const hint = this.engine.batting && s.flight ? s.flight.hint : null;
    this.hint.visible =
      !!hint && (s.phase === "windup" || s.phase === "flight") && cam !== "top" && cam !== "ball";
    if (hint) {
      this.hint.position.set(hint.x, hint.y, 0.025);
      this.hint.scale.setScalar(hint.r);
    }
    if (this.lastPhase !== s.phase) {
      this.trailPositions = [];
      this.lastPhase = s.phase;
    }
    if (s.phase === "flight" || s.phase === "inplay") {
      this.trailPositions.push(this.ball.position.clone());
      if (this.trailPositions.length > 26) this.trailPositions.shift();
    } else this.trailPositions = [];
    this.trail.geometry.dispose();
    this.trail.geometry = new THREE.BufferGeometry().setFromPoints(this.trailPositions);
    const color = PITCHES.find((p) => p.id === (f?.pitch ?? s.selected))!.color;
    (this.trail.material as THREE.LineBasicMaterial).color.set(color);
    this.renderer.render(this.scene, this.camera);
  }
  dispose() {
    this.disposed = true;
    this.resize.disconnect();
    this.renderer.domElement.removeEventListener("pointermove", this.pointerMove);
    this.renderer.domElement.removeEventListener("pointerdown", this.pointerDown);
    this.scene.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.geometry) m.geometry.dispose();
      if (m.material) {
        const mats = Array.isArray(m.material) ? m.material : [m.material];
        mats.forEach((v) => {
          const map = (v as THREE.MeshStandardMaterial).map;
          if (map) map.dispose();
          v.dispose();
        });
      }
    });
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}

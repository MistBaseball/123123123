import * as THREE from "three";
import {
  BaseballEngine,
  BASES,
  DEFENSE,
  pitchData,
  V,
  batReach,
  clamp,
  lerp,
  runnerPose,
  playerYaw,
  type Vec,
} from "./engine";
import * as tex from "./textures";

type Figure = {
  root: THREE.Group;
  /** Shoulder joints (upper arm hangs along local −Y) and elbow joints (bend about local X). */
  left: THREE.Group;
  right: THREE.Group;
  elbowL: THREE.Group;
  elbowR: THREE.Group;
  legL: THREE.Group;
  legR: THREE.Group;
  /** Knee joints: negative rotation.x folds the shin back. */
  kneeL: THREE.Group;
  kneeR: THREE.Group;
  bat?: THREE.Mesh;
  /** Jersey texture, flipped back when the model is mirrored so the number still reads. */
  jersey: THREE.Texture;
};
export class BaseballField {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(32, 1, 0.1, 900);
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
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.domElement.setAttribute(
      "aria-label",
      "3D 야구장. 마우스로 조준하고 클릭해 투구 또는 스윙",
    );
    this.renderer.domElement.style.touchAction = "none";
    host.appendChild(this.renderer.domElement);
    // Late-afternoon game: a sky dome that fades to a warm haze, soft sky fill from above, bounce
    // light from the grass and a low warm sun that throws long shadows across the infield.
    this.scene.background = new THREE.Color("#c9d6dc");
    this.scene.fog = new THREE.Fog("#d4d9d4", 170, 520);
    const sky = new THREE.Mesh(
      new THREE.SphereGeometry(600, 32, 16),
      new THREE.MeshBasicMaterial({
        map: tex.skyTexture(),
        side: THREE.BackSide,
        fog: false,
        depthWrite: false,
      }),
    );
    sky.position.set(0, -40, 40);
    this.scene.add(sky);
    this.scene.add(new THREE.HemisphereLight(0xcfe3ff, 0x4f6b3a, 1.15));
    const sun = new THREE.DirectionalLight(0xffe2bf, 3.4);
    sun.position.set(-48, 46, -30);
    sun.target.position.set(0, 0, 30);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.left = -70;
    sun.shadow.camera.right = 70;
    sun.shadow.camera.top = 75;
    sun.shadow.camera.bottom = -45;
    sun.shadow.normalBias = 0.03;
    sun.shadow.bias = -0.0004;
    sun.shadow.camera.far = 220;
    sun.shadow.radius = 3;
    this.scene.add(sun, sun.target);
    // Soft fill from the opposite side so shadowed faces keep some detail.
    const fill = new THREE.DirectionalLight(0xbcd2ff, 0.55);
    fill.position.set(40, 30, 60);
    this.scene.add(fill);
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
      const runner = this.figure("#c06645", "#26353e", false, false);
      this.scene.add(runner.root);
      this.runners.push(runner);
    }
    // Leather ball with red stitches; a faint glow keeps it readable against the crowd.
    this.ball = new THREE.Mesh(
      new THREE.SphereGeometry(0.075, 24, 16),
      new THREE.MeshStandardMaterial({
        map: tex.ballTexture(),
        roughness: 0.45,
        emissive: "#8f8668",
        emissiveIntensity: 0.35,
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
    // Development only: lets browser tests read draw-call counts. Stripped from builds.
    if (import.meta.env.DEV) (window as unknown as { __field?: BaseballField }).__field = this;
  }
  /** Draw calls and triangles of the last frame (performance check). */
  get stats() {
    return {
      calls: this.renderer.info.render.calls,
      triangles: this.renderer.info.render.triangles,
    };
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
  /** A flat mesh lying on the ground from a 2D outline given in world (x, z) metres. */
  private ground(outline: Vec[], material: THREE.Material, y: number, holes: Vec[][] = []) {
    // Shape coordinates are (x, -z) so that rotating −90° about X lays them on the field.
    const shape = new THREE.Shape(outline.map((p) => new THREE.Vector2(p.x, -p.z)));
    shape.holes = holes.map((h) => new THREE.Path(h.map((p) => new THREE.Vector2(p.x, -p.z))));
    const m = new THREE.Mesh(new THREE.ShapeGeometry(shape, 64), material);
    m.rotation.x = -Math.PI / 2;
    m.position.y = y;
    m.receiveShadow = true;
    this.scene.add(m);
    return m;
  }
  /** A chalk stripe of real width between two ground points. */
  private chalk(a: Vec, b: Vec, width = 0.1) {
    const len = Math.hypot(b.x - a.x, b.z - a.z),
      m = new THREE.Mesh(new THREE.PlaneGeometry(width, len), this.chalkMaterial);
    m.rotation.x = -Math.PI / 2;
    m.rotation.z = -Math.atan2(b.x - a.x, b.z - a.z);
    m.position.set((a.x + b.x) / 2, 0.045, (a.z + b.z) / 2);
    m.receiveShadow = true;
    this.scene.add(m);
  }
  private chalkMaterial = new THREE.MeshStandardMaterial({
    color: "#f4f1e6",
    roughness: 0.95,
    polygonOffset: true,
    polygonOffsetFactor: -2,
  });
  /** Clay material whose UVs are metres (ShapeGeometry) — `tile` metres per texture repeat. */
  private clay(tile = 5) {
    const map = tex.dirtColor(),
      bump = tex.dirtDetail();
    map.repeat.set(1 / tile, 1 / tile);
    bump.repeat.set(1 / 1.2, 1 / 1.2);
    return new THREE.MeshStandardMaterial({
      map,
      bumpMap: bump,
      bumpScale: 0.6,
      roughness: 0.97,
      polygonOffset: true,
      polygonOffsetFactor: -1,
    });
  }
  /** Stand fronts: home bowl radius, foul-line stands' distance from the line, outfield radius. */
  private static readonly HOME_STAND = 26;
  private static readonly HOME_END = Math.PI / 4 + 0.35;
  private static readonly LINE_STAND = 9;
  private static readonly OUTFIELD_STAND = 112;
  private static readonly OUTFIELD_END = Math.PI / 4 + 0.09;
  /** Where the foul-line stands begin (metres from home along the line) — the bowl's end. */
  private static lineStart() {
    const f = BaseballField,
      x = Math.sin(f.HOME_END) * f.HOME_STAND,
      z = Math.cos(f.HOME_END) * f.HOME_STAND;
    return (x + z) * Math.SQRT1_2;
  }
  /** Point at `along` metres down a foul line (side +1 = third, −1 = first), `out` m outside it. */
  private static linePoint(side: number, along: number, out: number) {
    const r2 = Math.SQRT1_2;
    return V(side * r2 * (along + out), 0, r2 * (along - out));
  }
  /** Inside edge of all the stands: the grass reaches up to here. */
  private fieldOutline() {
    const f = BaseballField,
      pts: Vec[] = [],
      start = f.lineStart();
    for (let i = 0; i <= 8; i++)
      pts.push(f.linePoint(1, start + (i / 8) * (f.OUTFIELD_STAND - start), f.LINE_STAND));
    for (let i = 0; i <= 64; i++) {
      const a = f.OUTFIELD_END - (i / 64) * f.OUTFIELD_END * 2;
      pts.push(V(Math.sin(a) * f.OUTFIELD_STAND, 0, Math.cos(a) * f.OUTFIELD_STAND));
    }
    for (let i = 8; i >= 0; i--)
      pts.push(f.linePoint(-1, start + (i / 8) * (f.OUTFIELD_STAND - start), f.LINE_STAND));
    for (let i = 0; i <= 48; i++) {
      const a = 2 * Math.PI - f.HOME_END - (i / 48) * (2 * Math.PI - 2 * f.HOME_END);
      pts.push(V(Math.sin(a) * f.HOME_STAND, 0, Math.cos(a) * f.HOME_STAND));
    }
    return pts;
  }
  private makePark() {
    // Turf: one 320 m plane with the mowing pattern, plus a fine blade bump that tiles every 2 m.
    // Outside the stands: concrete concourse and parking, so no grass shows past the stadium.
    const outside = new THREE.Mesh(
      new THREE.PlaneGeometry(900, 900),
      new THREE.MeshStandardMaterial({ color: "#7a7f7c", roughness: 0.95 }),
    );
    outside.rotation.x = -Math.PI / 2;
    outside.position.set(0, -0.05, 40);
    outside.receiveShadow = true;
    this.scene.add(outside);
    // Turf: the playing field inside the stand fronts, with the mowing pattern (one texture over
    // 320 m) and a fine blade bump tiling every 2 m. ShapeGeometry UVs are metres.
    const turfMap = tex.turf(),
      blades = tex.grassDetail();
    turfMap.repeat.set(1 / 320, 1 / 320);
    turfMap.offset.set(0.5, 0.625);
    blades.repeat.set(0.5, 0.5);
    this.ground(
      this.fieldOutline(),
      new THREE.MeshStandardMaterial({
        map: turfMap,
        bumpMap: blades,
        bumpScale: 0.9,
        roughness: 0.92,
      }),
      0,
    );
    const clay = this.clay();
    // Infield skin: out along the foul lines to the 29 m arc around the mound, with the grass
    // infield square cut out of it (its edges sit 1.2 m inside the base lines).
    const r2 = Math.SQRT1_2,
      arcR = 29,
      mound = V(0, 0, 18.44),
      lineT = 38.94,
      skin: Vec[] = [V(0, 0, -1.2), V(-lineT * r2 - 1.1, 0, lineT * r2 - 0.3)];
    const end = Math.atan2(lineT * r2, lineT * r2 - mound.z);
    for (let i = 0; i <= 48; i++) {
      const a = -end + (i / 48) * end * 2;
      skin.push(V(Math.sin(a) * arcR, 0, mound.z + Math.cos(a) * arcR));
    }
    skin.push(V(lineT * r2 + 1.1, 0, lineT * r2 - 0.3));
    const half = 19.4 - 1.7,
      infieldGrass = [
        V(0, 0, 19.4 - half),
        V(half, 0, 19.4),
        V(0, 0, 19.4 + half),
        V(-half, 0, 19.4),
      ];
    this.ground(skin, clay, 0.02, [infieldGrass]);
    // Dirt circles: home plate area, the base cut-outs and the mound.
    const circle = (cx: number, cz: number, r: number, y: number, m: THREE.Material) => {
      const pts: Vec[] = [];
      for (let i = 0; i < 48; i++) {
        const a = (i / 48) * Math.PI * 2;
        pts.push(V(cx + Math.sin(a) * r, 0, cz + Math.cos(a) * r));
      }
      return this.ground(pts, m, y);
    };
    circle(0, 0, 4.0, 0.024, clay);
    for (const b of BASES.slice(0, 3)) circle(b.x, b.z, 2.4, 0.024, clay);
    circle(0, 18.44, 2.74, 0.026, clay);
    // Warning track in front of the wall.
    const track: Vec[] = [];
    for (let i = 0; i <= 64; i++) {
      const a = -Math.PI / 4 - 0.06 + (i / 64) * (Math.PI / 2 + 0.12);
      track.push(V(Math.sin(a) * 107.6, 0, Math.cos(a) * 107.6));
    }
    for (let i = 64; i >= 0; i--) {
      const a = -Math.PI / 4 - 0.06 + (i / 64) * (Math.PI / 2 + 0.12);
      track.push(V(Math.sin(a) * 102.5, 0, Math.cos(a) * 102.5));
    }
    this.ground(track, this.clay(6), 0.02);
    // Mound: a low clay hill with the rubber on top.
    const moundMap = tex.dirtColor();
    moundMap.repeat.set(3, 1);
    const hill = new THREE.Mesh(
      new THREE.CylinderGeometry(1.0, 2.74, 0.26, 48, 1),
      new THREE.MeshStandardMaterial({ map: moundMap, roughness: 0.97 }),
    );
    hill.position.set(0, 0.15, 18.44);
    hill.receiveShadow = true;
    this.scene.add(hill);
    this.box(0, 0.29, 18.6, 0.61, 0.03, 0.15, "#f4efe2");
    // Bases: white canvas bags standing a little off the dirt.
    const bagMaterial = new THREE.MeshStandardMaterial({ color: "#f3efe6", roughness: 0.7 });
    BASES.slice(0, 3).forEach((p) => {
      const bag = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.09, 0.38), bagMaterial);
      bag.position.set(p.x, 0.07, p.z);
      bag.rotation.y = Math.PI / 4;
      bag.castShadow = bag.receiveShadow = true;
      this.scene.add(bag);
    });
    // Home plate: white pentagon on a thin black rubber edge.
    const plateOutline = (k: number) => [
      V(-0.215 * k, 0, 0.22 * k),
      V(0.215 * k, 0, 0.22 * k),
      V(0.215 * k, 0, 0),
      V(0, 0, -0.24 * k),
      V(-0.215 * k, 0, 0),
    ];
    this.ground(plateOutline(1.08), new THREE.MeshStandardMaterial({ color: "#2b2b28" }), 0.05);
    this.ground(
      plateOutline(1),
      new THREE.MeshStandardMaterial({ color: "#fbf9f2", roughness: 0.6 }),
      0.055,
    );
    // Chalk: foul lines to the poles, batter's boxes and the catcher's box.
    this.chalk(V(-0.3, 0, 0.3), V(-106 * r2, 0, 106 * r2), 0.1);
    this.chalk(V(0.3, 0, 0.3), V(106 * r2, 0, 106 * r2), 0.1);
    // Batter's boxes: 1.22 × 1.83 m, 15 cm off the plate.
    for (const x of [-0.98, 0.98]) {
      const x0 = x - 0.61,
        x1 = x + 0.61,
        z0 = -0.92,
        z1 = 0.92;
      this.chalk(V(x0, 0, z0), V(x1, 0, z0), 0.08);
      this.chalk(V(x1, 0, z0), V(x1, 0, z1), 0.08);
      this.chalk(V(x1, 0, z1), V(x0, 0, z1), 0.08);
      this.chalk(V(x0, 0, z1), V(x0, 0, z0), 0.08);
    }
    this.chalk(V(-0.65, 0, -0.9), V(-0.65, 0, -3.0), 0.08);
    this.chalk(V(0.65, 0, -0.9), V(0.65, 0, -3.0), 0.08);
    this.chalk(V(-0.65, 0, -3.0), V(0.65, 0, -3.0), 0.08);
    this.makeStadium();
  }
  /** Walls, seating bowl, bleachers, crowd, scoreboard and light towers. */
  private makeStadium() {
    const r2 = Math.SQRT1_2;
    // Outfield wall: one continuous padded curve with a yellow home-run line on top.
    const fairStart = -Math.PI / 4 - 0.06,
      fairLength = Math.PI / 2 + 0.12,
      pad = tex.wallPadding();
    pad.repeat.set(70, 1);
    const wall = new THREE.Mesh(
      new THREE.CylinderGeometry(108, 108, 3.2, 128, 1, true, fairStart, fairLength),
      new THREE.MeshStandardMaterial({ map: pad, roughness: 0.75, side: THREE.DoubleSide }),
    );
    wall.position.y = 1.6;
    wall.receiveShadow = true;
    this.scene.add(wall);
    const lineTop = new THREE.Mesh(
      new THREE.CylinderGeometry(108.05, 108.05, 0.14, 128, 1, true, fairStart, fairLength),
      new THREE.MeshStandardMaterial({ color: "#f0c43c", roughness: 0.5, side: THREE.DoubleSide }),
    );
    lineTop.position.y = 3.25;
    this.scene.add(lineTop);
    for (const side of [-1, 1]) {
      const pole = this.mesh(
        new THREE.CylinderGeometry(0.12, 0.16, 16, 10),
        "#f0c74b",
        side * 107 * r2,
        8,
        107 * r2,
      );
      pole.castShadow = true;
    }
    // Seating bowl around home plate, from the left-field line round to the right-field line:
    // a stepped profile turned on a lathe, so every row is a real curved step.
    const concrete = new THREE.MeshStandardMaterial({
      color: "#7d8a8c",
      roughness: 0.9,
      side: THREE.DoubleSide,
    });
    const bowl = (
      inner: number,
      rows: number,
      base: number,
      phiStart: number,
      phiLength: number,
    ) => {
      const profile: THREE.Vector2[] = [
        new THREE.Vector2(inner, 0),
        new THREE.Vector2(inner, base),
      ];
      for (let k = 0; k < rows; k++) {
        const r = inner + k * 1.25,
          y = base + k * 0.62;
        profile.push(new THREE.Vector2(r + 1.25, y), new THREE.Vector2(r + 1.25, y + 0.62));
      }
      const top = profile[profile.length - 1];
      profile.push(new THREE.Vector2(top.x + 0.6, top.y + 2.2), new THREE.Vector2(top.x + 0.6, 0));
      const m = new THREE.Mesh(new THREE.LatheGeometry(profile, 96, phiStart, phiLength), concrete);
      m.receiveShadow = true;
      m.castShadow = true;
      this.scene.add(m);
      // Padded front wall (the backstop behind home is part of it).
      const front = new THREE.Mesh(
        new THREE.CylinderGeometry(
          inner - 0.05,
          inner - 0.05,
          base,
          96,
          1,
          true,
          phiStart,
          phiLength,
        ),
        new THREE.MeshStandardMaterial({
          color: "#1f4038",
          roughness: 0.7,
          side: THREE.DoubleSide,
        }),
      );
      front.position.y = base / 2;
      this.scene.add(front);
      return { inner, rows, base, phiStart, phiLength };
    };
    const F = BaseballField;
    const seats = [
      // From the third-base side (φ just past π/4), round behind home (φ = π), to first base.
      bowl(F.HOME_STAND, 18, 1.4, F.HOME_END, 2 * Math.PI - 2 * F.HOME_END),
      bowl(F.OUTFIELD_STAND, 12, 3.6, -F.OUTFIELD_END, F.OUTFIELD_END * 2),
    ];
    // Foul-line stands: the same stepped profile run straight along each line, joining the
    // home bowl to the outfield stands so the bowl is closed all the way round.
    const lineRows = 16,
      lineBase = 1.4,
      lineStart = F.lineStart(),
      lineLength = F.OUTFIELD_STAND + 2 - lineStart;
    const profile = new THREE.Shape();
    profile.moveTo(F.LINE_STAND, 0);
    profile.lineTo(F.LINE_STAND, lineBase);
    for (let k = 0; k < lineRows; k++) {
      const u = F.LINE_STAND + (k + 1) * 1.25,
        y = lineBase + k * 0.62;
      profile.lineTo(u, y);
      profile.lineTo(u, y + 0.62);
    }
    const standBack = F.LINE_STAND + lineRows * 1.25 + 0.6;
    profile.lineTo(standBack, lineBase + lineRows * 0.62 + 2.2);
    profile.lineTo(standBack, 0);
    profile.closePath();
    const runGeometry = new THREE.ExtrudeGeometry(profile, {
      depth: lineLength,
      bevelEnabled: false,
    });
    runGeometry.translate(0, 0, lineStart);
    for (const side of [1, -1]) {
      // Local +Z runs down the line, local +X points away from the field.
      const g = new THREE.Group();
      g.rotation.y = (side * Math.PI) / 4;
      g.scale.x = side;
      const run = new THREE.Mesh(runGeometry, concrete);
      run.castShadow = run.receiveShadow = true;
      g.add(run);
      const pad = new THREE.Mesh(
        new THREE.BoxGeometry(0.1, lineBase, lineLength),
        new THREE.MeshStandardMaterial({ color: "#1f4038", roughness: 0.7 }),
      );
      pad.position.set(F.LINE_STAND - 0.05, lineBase / 2, lineStart + lineLength / 2);
      g.add(pad);
      this.scene.add(g);
    }
    // Crowd: seated fans as instanced capsules in team-ish colours, most seats filled.
    const fanGeometry = new THREE.CylinderGeometry(0.15, 0.19, 0.62, 5, 1, true),
      fans = new THREE.InstancedMesh(
        fanGeometry,
        new THREE.MeshStandardMaterial({ roughness: 0.9 }),
        7000,
      ),
      o = new THREE.Object3D(),
      palette = [
        "#e9dcc3",
        "#cf6a4c",
        "#2a4a66",
        "#f2f0ea",
        "#dcb356",
        "#5b7f8c",
        "#1f2a33",
        "#b8423a",
      ],
      color = new THREE.Color();
    let count = 0,
      seed = 3;
    const rnd = () => (seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296;
    for (const b of seats)
      for (let k = 0; k < b.rows; k++) {
        const r = b.inner + k * 1.25 + 0.75,
          y = b.base + k * 0.62 + 0.42,
          perRow = Math.floor((r * b.phiLength) / 0.62);
        for (let j = 0; j < perRow && count < 7000; j++) {
          if (rnd() < 0.3) continue;
          const phi = b.phiStart + ((j + 0.5) / perRow) * b.phiLength;
          o.position.set(Math.sin(phi) * r, y, Math.cos(phi) * r);
          o.rotation.y = phi + Math.PI;
          o.scale.setScalar(0.9 + rnd() * 0.2);
          o.updateMatrix();
          fans.setMatrixAt(count, o.matrix);
          fans.setColorAt(count, color.set(palette[Math.floor(rnd() * palette.length)]));
          count++;
        }
      }
    for (const side of [1, -1])
      for (let k = 0; k < lineRows; k++) {
        const out = F.LINE_STAND + k * 1.25 + 0.62,
          y = lineBase + k * 0.62 + 0.42;
        for (
          let along = lineStart + 1;
          along < lineStart + lineLength && count < 7000;
          along += 0.62
        ) {
          if (rnd() < 0.35) continue;
          const p = F.linePoint(side, along, out);
          o.position.set(p.x, y, p.z);
          o.rotation.y = 0;
          o.scale.setScalar(0.9 + rnd() * 0.2);
          o.updateMatrix();
          fans.setMatrixAt(count, o.matrix);
          fans.setColorAt(count, color.set(palette[Math.floor(rnd() * palette.length)]));
          count++;
        }
      }
    fans.count = count;
    this.scene.add(fans);
    // Behind-home sign on the backstop padding.
    this.label("MISAN BASEBALL", "#ead7a8", "#1f4038", 5.2, 1.3, 0, 0.75, -25.5, 0);
    // Scoreboard above the centre-field bleachers.
    this.box(0, 16, 128, 30, 13, 1.2, "#16252c");
    this.label("DIAMOND ROAD", "#f2c778", "#16252c", 26, 5, 0, 18.8, 127.3);
    this.label("HOME OF THE NEXT ACE", "#c6d9d5", "#16252c", 22, 3, 0, 14.2, 127.3);
    for (const x of [-9, 9])
      this.mesh(new THREE.CylinderGeometry(0.5, 0.6, 12, 10), "#5d6a6c", x, 5, 128.6);
    // Distant city skyline beyond the stadium (fades into the haze).
    const towers = new THREE.InstancedMesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshStandardMaterial({ roughness: 0.8 }),
      70,
    );
    for (let i = 0; i < 70; i++) {
      const a = -1.9 + (i / 70) * 3.8 + (rnd() - 0.5) * 0.04,
        r = 240 + rnd() * 90,
        h = 18 + rnd() * rnd() * 70,
        w = 12 + rnd() * 16;
      o.position.set(Math.sin(a) * r, h / 2, 40 + Math.cos(a) * r);
      o.rotation.set(0, a, 0);
      o.scale.set(w, h, 10 + rnd() * 14);
      o.updateMatrix();
      towers.setMatrixAt(i, o.matrix);
      towers.setColorAt(i, color.set(["#8796a0", "#9aa7ad", "#7d8b96", "#a9b2b4"][i % 4]));
    }
    this.scene.add(towers);
    // Light towers with glowing lamp banks, two over each stand.
    const lamp = new THREE.MeshStandardMaterial({
      color: "#fffbe8",
      emissive: "#fff6d8",
      emissiveIntensity: 1.6,
    });
    for (const [x, z] of [
      [-62, -48],
      [74, 0],
      [-88, 98],
      [88, 98],
    ]) {
      const mast = this.mesh(new THREE.CylinderGeometry(0.35, 0.6, 34, 10), "#8a9597", x, 17, z);
      mast.castShadow = true;
      const head = new THREE.Group();
      head.position.set(x, 34.5, z);
      head.lookAt(0, 0, 30);
      this.scene.add(head);
      this.box(0, 0, 0, 8, 3.4, 0.5, "#e4e2d6", head);
      for (let i = -3; i <= 3; i++)
        for (let j = -1; j <= 1; j++) {
          const bulb = new THREE.Mesh(new THREE.CircleGeometry(0.42, 12), lamp);
          bulb.position.set(i * 1.1, j * 1.0, 0.27);
          head.add(bulb);
        }
    }
  }
  private static readonly SHOULDER_X = 0.215;
  private static readonly SHOULDER_Y = 1.45;
  private static readonly UPPER_ARM = 0.28;
  private static readonly FOREARM = 0.27;
  private ikBasis = new THREE.Matrix4();
  /**
   * Two-bone IK: bend the shoulder and elbow so the hand reaches `target` (figure-local metres).
   * `pole` is the direction the elbow should point (e.g. down and out).
   */
  private reach(f: Figure, side: "L" | "R", target: Vec, pole: Vec) {
    const F = BaseballField,
      shoulder = side === "L" ? f.left : f.right,
      elbow = side === "L" ? f.elbowL : f.elbowR,
      sx = side === "L" ? -F.SHOULDER_X : F.SHOULDER_X,
      a = F.UPPER_ARM,
      b = F.FOREARM,
      d = new THREE.Vector3(target.x - sx, target.y - F.SHOULDER_Y, target.z),
      dist = clamp(d.length(), 0.08, a + b - 0.002);
    d.normalize();
    const p = new THREE.Vector3(pole.x, pole.y, pole.z);
    p.sub(d.clone().multiplyScalar(p.dot(d)));
    if (p.lengthSq() < 1e-6) p.set(0, -1, 0).sub(d.clone().multiplyScalar(-d.y));
    p.normalize();
    const alpha = Math.acos(clamp((a * a + dist * dist - b * b) / (2 * a * dist), -1, 1)),
      upper = d
        .clone()
        .multiplyScalar(Math.cos(alpha))
        .add(p.clone().multiplyScalar(Math.sin(alpha))),
      handFromElbow = d
        .clone()
        .multiplyScalar(dist)
        .sub(upper.clone().multiplyScalar(a))
        .normalize(),
      bend = Math.acos(clamp(upper.dot(handFromElbow), -1, 1)),
      bendDir = handFromElbow.clone().sub(upper.clone().multiplyScalar(upper.dot(handFromElbow)));
    if (bendDir.lengthSq() < 1e-8) bendDir.copy(p).multiplyScalar(-1);
    bendDir.normalize();
    // Local −Y along the upper arm, local −Z toward the bend, local X completes the frame.
    const y = upper.clone().negate(),
      z = bendDir.clone().negate(),
      x = new THREE.Vector3().crossVectors(y, z);
    shoulder.quaternion.setFromRotationMatrix(this.ikBasis.makeBasis(x, y, z));
    elbow.rotation.set(bend, 0, 0);
  }
  /** Both hands to these points, elbows pointing down and slightly out. */
  private hands(f: Figure, right: Vec, left: Vec) {
    this.reach(f, "R", right, V(0.6, -0.8, 0.25));
    this.reach(f, "L", left, V(-0.6, -0.8, 0.25));
  }
  private figureCount = 0;
  /**
   * A 1.85 m ballplayer facing local −Z. Joints (shoulders, hips) are groups so the animation
   * code can swing arms and legs; everything else hangs off the root.
   */
  private figure(shirt: string, cap: string, withBat = false, glove = !withBat): Figure {
    const root = new THREE.Group(),
      n = this.figureCount++,
      skins = ["#e0b28c", "#c99872", "#a8754f", "#e8c09c"],
      skin = new THREE.MeshStandardMaterial({ color: skins[n % skins.length], roughness: 0.55 }),
      cloth = (color: string) => new THREE.MeshStandardMaterial({ color, roughness: 0.85 }),
      pants = cloth(shirt === "#eeeade" ? "#ece9df" : "#c9c7bf"),
      socks = cloth(cap),
      shoes = new THREE.MeshStandardMaterial({ color: "#1b1c1e", roughness: 0.5 }),
      part = (
        geo: THREE.BufferGeometry,
        mat: THREE.Material,
        x: number,
        y: number,
        z: number,
        parent: THREE.Object3D = root,
      ) => {
        const m = new THREE.Mesh(geo, mat);
        m.position.set(x, y, z);
        m.castShadow = true;
        m.receiveShadow = true;
        parent.add(m);
        return m;
      };
    // Torso: jersey with the number on the back (the texture's centre faces +Z after the turn).
    const jerseyMat = new THREE.MeshStandardMaterial({
      map: tex.jersey(shirt, cap, String([18, 7, 24, 3, 11, 52, 9, 31, 5, 27][n % 10])),
      roughness: 0.82,
    });
    // Torso turned on a lathe: waist, chest, rounded shoulders into the neck; flattened front to
    // back like a real chest. The jersey number sits on the back.
    const torsoProfile = [
      [0.165, 1.04],
      [0.178, 1.14],
      [0.205, 1.3],
      [0.215, 1.4],
      [0.2, 1.48],
      [0.15, 1.54],
      [0.07, 1.575],
      [0.05, 1.58],
    ].map(([r, y]) => new THREE.Vector2(r, y));
    const torso = part(new THREE.LatheGeometry(torsoProfile, 24), jerseyMat, 0, 0, 0);
    torso.rotation.y = Math.PI;
    torso.scale.z = 0.72;
    // Shoulders and sleeves are plain shirt cloth (the numbered texture is only for the torso).
    const sleeve = cloth(shirt);
    for (const x of [-0.2, 0.2])
      part(new THREE.SphereGeometry(0.082, 14, 10), sleeve, x, 1.45, 0).scale.set(1, 1, 0.9);
    part(new THREE.CylinderGeometry(0.178, 0.178, 0.05, 20), cloth("#24262a"), 0, 1.07, 0);
    const hips = part(new THREE.CylinderGeometry(0.18, 0.165, 0.2, 20), pants, 0, 0.96, 0);
    hips.scale.z = 0.85;
    part(new THREE.CylinderGeometry(0.055, 0.065, 0.1, 12), skin, 0, 1.6, 0);
    const head = part(new THREE.SphereGeometry(0.115, 20, 16), skin, 0, 1.73, 0);
    head.scale.set(0.92, 1.12, 1);
    // Ears and a hint of a nose so the head reads as a face from the side and front.
    for (const x of [-0.105, 0.105])
      part(new THREE.SphereGeometry(0.025, 8, 6), skin, x, 1.72, 0.005);
    part(new THREE.SphereGeometry(0.022, 8, 6), skin, 0, 1.71, -0.112);
    if (withBat) {
      // Batting helmet: glossy shell with an ear flap and a short bill.
      const helmet = new THREE.MeshStandardMaterial({
        color: cap,
        roughness: 0.28,
        metalness: 0.15,
      });
      part(
        new THREE.SphereGeometry(0.135, 20, 12, 0, Math.PI * 2, 0, Math.PI / 1.85),
        helmet,
        0,
        1.745,
        0.005,
      );
      const flap = part(new THREE.CylinderGeometry(0.06, 0.06, 0.03, 14), helmet, -0.12, 1.69, 0);
      flap.rotation.z = Math.PI / 2;
      part(new THREE.BoxGeometry(0.2, 0.014, 0.08), helmet, 0, 1.765, -0.15);
    } else {
      const capMat = cloth(cap);
      part(
        new THREE.SphereGeometry(0.124, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2),
        capMat,
        0,
        1.765,
        0,
      );
      const bill = part(
        new THREE.CylinderGeometry(0.1, 0.1, 0.012, 20, 1, false, 0, Math.PI),
        capMat,
        0,
        1.77,
        -0.07,
      );
      bill.rotation.y = Math.PI / 2;
      bill.scale.z = 1.25;
    }
    // Arms hang from the shoulder joint: sleeve, forearm, hand.
    // Arms: shoulder joint → upper arm (sleeve) → elbow joint → forearm and hand. Poses are set
    // by reach() (two-bone IK), so hands go exactly where the motion needs them.
    const arm = (x: number) => {
      const g = new THREE.Group();
      g.position.set(x, BaseballField.SHOULDER_Y, 0);
      root.add(g);
      part(new THREE.CapsuleGeometry(0.06, 0.18, 4, 10), sleeve, 0, -0.13, 0, g);
      const e = new THREE.Group();
      e.position.y = -BaseballField.UPPER_ARM;
      g.add(e);
      part(new THREE.SphereGeometry(0.052, 10, 8), skin, 0, 0, 0, e);
      part(new THREE.CapsuleGeometry(0.044, 0.17, 4, 10), skin, 0, -0.13, 0, e);
      part(new THREE.SphereGeometry(0.046, 10, 8), skin, 0, -BaseballField.FOREARM, 0, e);
      return { g, e };
    };
    const L = arm(-BaseballField.SHOULDER_X),
      R = arm(BaseballField.SHOULDER_X),
      left = L.g,
      right = R.g;
    // Glove on the left hand: a deep brown leather pocket.
    if (glove) {
      const mitt = part(
        new THREE.SphereGeometry(0.1, 14, 10),
        new THREE.MeshStandardMaterial({ color: "#7a4a26", roughness: 0.6 }),
        0,
        -BaseballField.FOREARM - 0.03,
        -0.02,
        L.e,
      );
      mitt.scale.set(0.75, 1.15, 0.55);
    }
    // Legs swing from the hip: pants to below the knee, stirrup socks, cleats pointing forward.
    const leg = (x: number) => {
      const g = new THREE.Group();
      g.position.set(x, 0.93, 0);
      root.add(g);
      // Thigh, then the knee joint carrying the shin, stirrup sock and cleat.
      part(new THREE.CapsuleGeometry(0.088, 0.3, 4, 10), pants, 0, -0.21, 0, g);
      const k = new THREE.Group();
      k.position.y = -0.44;
      g.add(k);
      part(new THREE.CapsuleGeometry(0.068, 0.1, 4, 10), pants, 0, -0.04, 0, k);
      part(new THREE.CapsuleGeometry(0.058, 0.24, 4, 10), socks, 0, -0.22, 0, k);
      part(new THREE.BoxGeometry(0.11, 0.08, 0.27), shoes, 0, -0.44, -0.05, k);
      return { g, k };
    };
    const LL = leg(-0.105),
      LR = leg(0.105),
      legL = LL.g,
      legR = LR.g;
    let bat: THREE.Mesh | undefined;
    if (withBat) {
      // Ash bat held at the knob end: the mesh's origin is the hands, the barrel runs along +Y.
      const wood = new THREE.MeshStandardMaterial({ color: "#d8b07a", roughness: 0.45 });
      bat = new THREE.Mesh(new THREE.CylinderGeometry(0.034, 0.013, 0.86, 14), wood);
      bat.geometry.translate(0, 0.36, 0);
      bat.castShadow = true;
      const knob = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.02, 12), wood);
      knob.position.y = -0.07;
      bat.add(knob);
      root.add(bat);
    }
    return {
      root,
      left,
      right,
      elbowL: L.e,
      elbowR: R.e,
      legL,
      legR,
      kneeL: LL.k,
      kneeR: LR.k,
      bat,
      jersey: jerseyMat.map!,
    };
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
    const s = this.engine.state,
      f0 = s.flight;
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
      // Low overhead view from behind home: the whole diamond large, the outfield still in frame.
      pos.set(0, 66, -30);
      look.set(0, 0, 44);
      fov = 56;
    } else {
      const b = s.ball;
      pos.set(b.x * 0.42 + 25, Math.max(25, b.y + 17), b.z * 0.45 - 18);
      look.set(b.x * 0.7, Math.max(1, b.y * 0.4), b.z * 0.7 + 8);
      fov = 56;
    }
    // Development only: browser tests can park the camera anywhere for close-ups.
    const devCam = import.meta.env.DEV
      ? (window as unknown as { __cam?: [number, number, number, number, number, number, number] })
          .__cam
      : undefined;
    if (devCam) {
      pos.set(devCam[0], devCam[1], devCam[2]);
      look.set(devCam[3], devCam[4], devCam[5]);
      fov = devCam[6];
    }
    const k = this.cameraKey !== key || devCam ? 1 : Math.min(1, dt * 5);
    this.camera.position.lerp(pos, k);
    this.camera.lookAt(look);
    if (this.camera.fov !== fov) {
      this.camera.fov = fov;
      this.camera.updateProjectionMatrix();
    }
    this.cameraKey = key;
    const swing = Math.sin(this.time * 18);
    // Arms pump opposite to the legs while running, elbows near 90°.
    const runArms = (p: Figure) =>
      this.hands(
        p,
        V(0.26, 1.12 + 0.1 * Math.max(0, swing), -0.08 - 0.24 * swing),
        V(-0.26, 1.12 + 0.1 * Math.max(0, -swing), -0.08 + 0.24 * swing),
      );
    const runLegs = (p: Figure, phase = swing) => {
      p.legL.rotation.x = phase * 0.7;
      p.legR.rotation.x = -phase * 0.7;
      // The trailing leg's shin kicks up behind; the leading one is nearly straight.
      p.kneeL.rotation.x = -(0.2 + 0.55 * (1 - phase));
      p.kneeR.rotation.x = -(0.2 + 0.55 * (1 + phase));
    };
    const stand = (p: Figure) => {
      p.legL.rotation.set(0, 0, 0);
      p.legR.rotation.set(0, 0, 0);
      p.kneeL.rotation.x = 0;
      p.kneeR.rotation.x = 0;
      p.root.position.y = 0;
    };
    this.players.forEach((p, i) => {
      const pos = s.phase === "inplay" && s.live ? s.live.defenders[i] : DEFENSE[i];
      p.root.position.set(pos.x, 0, pos.z);
      p.root.visible = true;
      p.root.rotation.set(0, i === 1 ? Math.PI : 0, 0);
      stand(p);
      // Ready position: glove out in front, throwing hand relaxed.
      this.hands(p, V(0.3, 1.0, -0.12), V(-0.27, 1.08, -0.24));
    });
    const pitcher = this.players[0],
      ease = (t: number) => t * t * (3 - 2 * t),
      path = (keys: [number, Vec][], t: number) => {
        let k = 0;
        while (k < keys.length - 2 && t > keys[k + 1][0]) k++;
        const [t0, a] = keys[k],
          [t1, b] = keys[k + 1],
          v = ease(clamp((t - t0) / (t1 - t0 || 1), 0, 1));
        return V(lerp(a.x, b.x, v), lerp(a.y, b.y, v), lerp(a.z, b.z, v));
      };
    const cocked = V(0.42, 1.74, 0.24);
    if (s.mode !== "batting" && s.phase === "ready" && !this.engine.batting) {
      // Set position: ball hidden in the glove at the chest.
      this.hands(pitcher, V(0.02, 1.28, -0.25), V(-0.05, 1.3, -0.27));
    } else if (s.phase === "windup" && !this.engine.batting) {
      const u = clamp(1 - s.timer / 0.62, 0, 1);
      // Leg kick, then hands break: glove reaches for the plate, the ball goes down, back, up.
      const kick = Math.sin(clamp(u / 0.8, 0, 1) * Math.PI);
      pitcher.legL.rotation.x = kick * 1.35;
      pitcher.kneeL.rotation.x = -kick * 1.7;
      pitcher.kneeR.rotation.x = -kick * 0.15;
      pitcher.root.rotation.x = -0.08 * Math.sin(u * Math.PI);
      this.hands(
        pitcher,
        path(
          [
            [0, V(0.02, 1.28, -0.25)],
            [0.4, V(0.0, 1.4, -0.22)],
            [0.7, V(0.36, 0.98, 0.16)],
            [1, cocked],
          ],
          u,
        ),
        path(
          [
            [0, V(-0.05, 1.3, -0.27)],
            [0.4, V(-0.04, 1.42, -0.24)],
            [1, V(-0.16, 1.5, -0.55)],
          ],
          u,
        ),
      );
    } else if (s.phase === "flight" && f0 && !this.engine.batting) {
      // Release out in front, then follow through across the body; front leg planted.
      const k = clamp(f0.elapsed / 0.3, 0, 1);
      pitcher.root.rotation.x = 0.28 * ease(k);
      pitcher.legL.rotation.x = 0.6;
      pitcher.kneeL.rotation.x = -0.35;
      pitcher.legR.rotation.x = -0.5 * ease(k);
      pitcher.kneeR.rotation.x = -0.9 * ease(k);
      this.hands(
        pitcher,
        path(
          [
            [0, cocked],
            [0.35, V(0.3, 1.86, -0.38)],
            [1, V(-0.22, 0.86, -0.38)],
          ],
          k,
        ),
        V(-0.2, 1.2, -0.06),
      );
    }
    const catcher = this.players[1];
    // Full crouch: thighs forward and spread, shins folded under.
    if (s.phase !== "inplay" || s.live?.fielder !== 1) {
      catcher.root.position.y = -0.5;
      catcher.legL.rotation.set(1.35, 0, -0.35);
      catcher.legR.rotation.set(1.35, 0, 0.35);
      catcher.kneeL.rotation.x = -2.35;
      catcher.kneeR.rotation.x = -2.35;
      catcher.root.rotation.x = -0.12;
    }
    // Catcher presents the glove as a target.
    this.hands(catcher, V(0.22, 0.95, -0.12), V(-0.12, 1.25, -0.42));
    // From the catcher camera the catcher model would hide the zone and the incoming ball.
    catcher.root.visible = cam !== "catcher" || s.phase === "inplay";
    const hand = this.engine.batter.hand === "L" ? -1 : 1;
    this.batter.root.position.set(hand * 0.82, -0.04, 0);
    // Athletic stance: feet wider than the shoulders, knees soft.
    this.batter.legL.rotation.set(0.12, 0, -0.16);
    this.batter.legR.rotation.set(0.12, 0, 0.16);
    this.batter.kneeL.rotation.x = -0.3;
    this.batter.kneeR.rotation.x = -0.3;
    // Left-handed batters are the mirror image: bat and hands on the other side.
    this.batter.root.scale.x = hand;
    this.batter.jersey.repeat.x = hand;
    const f = s.flight;
    // The batter leaves the box only on a batted ball (not on a steal, pickoff or wild pitch).
    this.batter.root.visible =
      s.mode !== "bullpen" && !(s.phase === "inplay" && s.live?.kind === "batted");
    // Batting: both hands on the handle (left hand lower). The bat starts up over the back
    // shoulder, comes through level over the plate and wraps over the front shoulder.
    const su = f?.swung ? clamp((f.elapsed - f.swingTime) / 0.22, 0, 1) : 0;
    this.batter.root.rotation.y = (hand * Math.PI) / 2 + hand * 0.85 * ease(su);
    const grip = path(
        [
          [0, V(0.17, 1.4, -0.14)],
          [0.5, V(-0.02, 1.1, -0.42)],
          [1, V(-0.28, 1.42, -0.1)],
        ],
        su,
      ),
      dirs: [number, THREE.Vector3][] = [
        [0, new THREE.Vector3(0.4, 0.82, 0.4)],
        [0.5, new THREE.Vector3(-0.3, 0.06, -0.95)],
        [1, new THREE.Vector3(-0.35, 0.55, 0.76)],
      ];
    let di = su < 0.5 ? 0 : 1;
    const a = dirs[di][1].clone().normalize(),
      b = dirs[di + 1][1].clone().normalize(),
      v = ease(clamp((su - dirs[di][0]) / 0.5, 0, 1)),
      up = new THREE.Vector3(0, 1, 0),
      qa = new THREE.Quaternion().setFromUnitVectors(up, a),
      qb = new THREE.Quaternion().setFromUnitVectors(up, b);
    const bat = this.batter.bat!;
    bat.position.set(grip.x, grip.y, grip.z);
    bat.quaternion.slerpQuaternions(qa, qb, v);
    const along = new THREE.Vector3(0, 1, 0).applyQuaternion(bat.quaternion);
    this.hands(
      this.batter,
      V(grip.x + along.x * 0.09, grip.y + along.y * 0.09, grip.z + along.z * 0.09),
      grip,
    );
    if (s.live && s.phase === "inplay") {
      const l = s.live,
        p = this.players[l.fielder],
        target = l.throw ? BASES[l.throw.base - 1] : l.bounced ? l.land : l.catchPoint;
      p.root.rotation.set(
        0,
        playerYaw(V(target.x - l.fielderPos.x, 0, target.z - l.fielderPos.z)),
        0,
      );
      if (l.fieldedAt === null) {
        runLegs(p);
        runArms(p);
      } else if (l.state === "송구") this.hands(p, cocked, V(-0.2, 1.4, -0.48));
      else this.hands(p, V(0.05, 1.3, -0.3), V(-0.06, 1.32, -0.32));
      if (l.caughtFly) this.hands(p, V(0.28, 1.05, -0.12), V(-0.18, 2.0, -0.36));
      this.landing.visible = l.fieldedAt === null;
      this.landing.position.set(l.land.x, 0.1, l.land.z);
    } else this.landing.visible = false;
    this.runners.forEach((r, i) => {
      r.root.visible = false;
      stand(r);
      // Lead-off stance by default: knees soft, hands out in front.
      this.hands(r, V(0.3, 0.98, -0.2), V(-0.3, 0.98, -0.2));
      const l = s.live;
      const show = (pose: ReturnType<typeof runnerPose>) => {
        r.root.visible = pose.visible;
        r.root.position.set(pose.position.x, 0, pose.position.z);
        r.root.rotation.y = playerYaw(pose.facing);
        if (pose.moving) {
          runLegs(r, Math.sin(this.time * 18 + i));
          runArms(r);
        }
      };
      if (l && s.phase === "inplay") {
        const track = l.runners.find((r) => r.id === i);
        if (track) show(runnerPose(track));
      } else if (i === 0 && s.stealTrack) {
        // The E-steal runner breaks during the delivery.
        show({ ...runnerPose(s.stealTrack), visible: true, moving: true });
      } else if (i < 3 && s.bases[i]) {
        r.root.visible = true;
        r.root.position.set(BASES[i].x + 0.65, 0, BASES[i].z);
        r.root.rotation.y = 0;
      }
    });
    this.ball.position.set(s.ball.x, s.ball.y, s.ball.z);
    // A knuckleball barely spins (that is why it flutters): only a slow tumble.
    if (s.phase === "flight" || s.phase === "inplay")
      this.ball.rotation.x +=
        dt * (s.phase === "flight" && s.flight && pitchData(s.flight.pitch).flutter ? 1.2 : 30);
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
    const color = pitchData(f?.pitch ?? s.selected).color;
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

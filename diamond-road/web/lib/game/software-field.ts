import {
  BaseballEngine,
  BASES,
  DEFENSE,
  V,
  clamp,
  lerp,
  runnerPose,
  playerYaw,
  type Vec,
} from "./engine";
// Software projection of the same world coordinates for browsers without WebGL.
// All cameras, ball trajectories and input share the live gameplay engine.
type Face = { points: Vec[]; color: string };
export class SoftwareField {
  private canvas = document.createElement("canvas");
  private ctx: CanvasRenderingContext2D;
  private resize: ResizeObserver;
  private width = 1;
  private height = 1;
  private camera = V();
  private look = V();
  private right = V();
  private up = V();
  private forward = V();
  private focal = 1;
  private time = 0;
  private staticFaces: Face[] = [];
  constructor(
    private host: HTMLElement,
    private engine: BaseballEngine,
  ) {
    this.ctx = this.canvas.getContext("2d")!;
    if (!this.ctx) throw new Error("Canvas unavailable");
    this.canvas.setAttribute("aria-label", "3D 야구장 호환 그래픽. 클릭 투구 또는 스윙");
    this.canvas.style.touchAction = "none";
    host.appendChild(this.canvas);
    this.resize = new ResizeObserver(() => {
      if (!host.clientWidth || !host.clientHeight) return;
      this.width = host.clientWidth;
      this.height = host.clientHeight;
      const ratio = Math.min(window.devicePixelRatio, 1.5);
      this.canvas.width = this.width * ratio;
      this.canvas.height = this.height * ratio;
      this.ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    });
    this.resize.observe(host);
    this.buildPark();
    this.canvas.addEventListener("pointermove", this.move);
    this.canvas.addEventListener("pointerdown", this.click);
  }
  private addQuad(points: Vec[], color: string) {
    this.staticFaces.push({ points, color });
  }
  private box(
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    color: string,
    faces = this.staticFaces,
  ) {
    const x0 = x - w / 2,
      x1 = x + w / 2,
      y0 = y - h / 2,
      y1 = y + h / 2,
      z0 = z - d / 2,
      z1 = z + d / 2;
    faces.push(
      { points: [V(x0, y0, z0), V(x1, y0, z0), V(x1, y1, z0), V(x0, y1, z0)], color },
      { points: [V(x1, y0, z0), V(x1, y0, z1), V(x1, y1, z1), V(x1, y1, z0)], color },
      { points: [V(x1, y0, z1), V(x0, y0, z1), V(x0, y1, z1), V(x1, y1, z1)], color },
      { points: [V(x0, y0, z1), V(x0, y0, z0), V(x0, y1, z0), V(x0, y1, z1)], color },
      { points: [V(x0, y1, z0), V(x1, y1, z0), V(x1, y1, z1), V(x0, y1, z1)], color },
    );
  }
  private disk(x: number, z: number, r: number, color: string, y = 0.03) {
    const points = [];
    for (let i = 0; i < 48; i++) {
      const a = (i / 48) * Math.PI * 2;
      points.push(V(x + Math.cos(a) * r, y, z + Math.sin(a) * r));
    }
    this.addQuad(points, color);
  }
  private buildPark() {
    for (let z = -50; z < 145; z += 10)
      this.addQuad(
        [V(-150, 0, z), V(150, 0, z), V(150, 0, z + 10), V(-150, 0, z + 10)],
        z % 20 === 0 ? "#629064" : "#6d9968",
      );
    const points = [V(0, 0.02, -2), V(25, 0.02, 24)];
    for (let i = 0; i <= 24; i++) {
      const a = (i / 24) * Math.PI;
      points.push(V(Math.cos(a) * 25, 0.02, 24 + Math.sin(a) * 25));
    }
    points.push(V(0, 0.02, -2));
    this.addQuad(points, "#c39b76");
    this.addQuad([V(0, 0.035, 6), V(17, 0.035, 23), V(0, 0.035, 40), V(-17, 0.035, 23)], "#6a9967");
    this.disk(0, 0, 4.3, "#cba47d", 0.04);
    this.disk(0, 18.44, 2.8, "#cba67e", 0.05);
    this.box(0, 0.09, 18.5, 0.61, 0.08, 0.2, "#f0e4cb");
    for (const b of BASES.slice(0, 3)) {
      this.disk(b.x, b.z, 1.2, "#cba47d", 0.05);
      this.box(b.x, 0.1, b.z, 0.5, 0.1, 0.5, "#eee7d7");
    }
    this.box(0, 0.055, 0, 0.43, 0.06, 0.43, "#fff4d7");
    for (const side of [-1, 1]) {
      for (let section = 0; section < 7; section++) {
        const x = side * (7 + section * 7),
          z = -12 + section * 5;
        for (let row = 0; row < 6; row++)
          this.box(
            x + side * row * 1.5,
            1 + row * 0.8,
            z - row * 2,
            7,
            0.65,
            2.3,
            row % 2 ? "#415f69" : "#52717a",
          );
        for (let c = 0; c < 7; c++)
          for (let r = 0; r < 6; r++)
            this.box(
              x - 2.5 + c * 0.8 + side * r * 1.5,
              1.65 + r * 0.8,
              z - r * 2,
              0.3,
              0.62,
              0.35,
              ["#d5c2a4", "#dbac74", "#b3c5bc", "#709199", "#be7857"][(c + r) % 5],
            );
      }
      this.box(side * 21, 1, 0, 11, 2.2, 3.4, "#274851");
      this.box(side * 21, 2.3, 0, 12, 0.18, 4.2, "#3b5d65");
    }
    this.box(0, 1, -12, 20, 2, 1, "#2f5057");
    this.box(0, 3, -17, 17, 2.5, 0.5, "#243c46");
    for (let i = 0; i < 40; i++) {
      const a = -Math.PI / 4 + ((i + 0.5) * Math.PI) / 80;
      this.box(Math.sin(a) * 107, 1.5, Math.cos(a) * 107, 4.5, 3, 1.5, "#315649");
    }
    this.box(0, 8, 115, 23, 13, 1.5, "#294753");
    for (const [x, z] of [
      [-52, 3],
      [52, 3],
      [-78, 75],
      [78, 75],
    ]) {
      this.box(x, 13, z, 0.3, 26, 0.3, "#647c7f");
      this.box(x, 26, z, 6.5, 1.1, 0.6, "#f7f3d8");
    }
    for (let i = 0; i < 20; i++)
      this.box(-125 + i * 13, 5 + (i % 3) * 2, 132, 9, 10 + (i % 3) * 4, 10, "#91aba8");
  }
  private normalize(v: Vec) {
    const n = Math.hypot(v.x, v.y, v.z) || 1;
    return V(v.x / n, v.y / n, v.z / n);
  }
  private cross(a: Vec, b: Vec) {
    return V(a.y * b.z - a.z * b.y, a.z * b.x - a.x * b.z, a.x * b.y - a.y * b.x);
  }
  private dot(a: Vec, b: Vec) {
    return a.x * b.x + a.y * b.y + a.z * b.z;
  }
  private setupCamera() {
    const s = this.engine.state;
    const cam = s.phase === "inplay" && s.autoCamera ? "ball" : s.camera;
    let fov = 29;
    if (cam === "pitcher") {
      this.camera = V(-1.5, 2.9, 25);
      this.look = V(0, 1, 0);
      fov = this.width < 500 ? 39 : 29;
    } else if (cam === "catcher") {
      this.camera = V(0, 2, -5.8);
      this.look = V(0, 1.2, 18.44);
      fov = 43;
    } else if (cam === "broadcast") {
      this.camera = V(53, 40, -25);
      this.look = V(0, 0, 28);
      fov = 54;
    } else if (cam === "top") {
      this.camera = V(0, 125, 34);
      this.look = V(0, 0, 35);
      fov = 64;
    } else {
      const b = s.ball;
      this.camera = V(27 + b.x * 0.4, Math.max(28, b.y + 18), -20 + b.z * 0.4);
      this.look = V(b.x * 0.6, 3, b.z * 0.6 + 14);
      fov = 55;
    }
    this.forward = this.normalize(
      V(this.look.x - this.camera.x, this.look.y - this.camera.y, this.look.z - this.camera.z),
    );
    this.right = this.normalize(this.cross(this.forward, V(0, 1, 0)));
    this.up = this.cross(this.right, this.forward);
    this.focal = this.height / (2 * Math.tan((fov * Math.PI) / 360));
  }
  private project(p: Vec) {
    const d = V(p.x - this.camera.x, p.y - this.camera.y, p.z - this.camera.z),
      depth = this.dot(d, this.forward);
    return {
      x: this.width / 2 + (this.dot(d, this.right) * this.focal) / depth,
      y: this.height / 2 - (this.dot(d, this.up) * this.focal) / depth,
      depth,
    };
  }
  private drawFace(face: Face) {
    const ctx = this.ctx,
      clipped: Vec[] = [];
    // Clip polygons to the camera's near plane instead of dropping the turf underfoot.
    for (let i = 0; i < face.points.length; i++) {
      const a = face.points[i],
        b = face.points[(i + 1) % face.points.length],
        da = this.project(a).depth,
        db = this.project(b).depth;
      if (da >= 0.2) clipped.push(a);
      if (da >= 0.2 !== db >= 0.2) {
        const t = (0.2 - da) / (db - da);
        clipped.push(V(lerp(a.x, b.x, t), lerp(a.y, b.y, t), lerp(a.z, b.z, t)));
      }
    }
    if (clipped.length < 3) return;
    const ps = clipped.map((p) => this.project(p));
    if (
      ps.every((p) => p.x < 0) ||
      ps.every((p) => p.x > this.width) ||
      ps.every((p) => p.y < 0) ||
      ps.every((p) => p.y > this.height)
    )
      return;
    ctx.beginPath();
    ps.forEach((p, i) => {
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    });
    ctx.closePath();
    ctx.fillStyle = face.color;
    ctx.fill();
  }
  private line(points: Vec[], color: string, width = 1) {
    const ps = points.map((p) => this.project(p));
    if (ps.some((p) => p.depth < 0.2)) return;
    const c = this.ctx;
    c.strokeStyle = color;
    c.lineWidth = width;
    c.beginPath();
    ps.forEach((p, i) => (i ? c.lineTo(p.x, p.y) : c.moveTo(p.x, p.y)));
    c.stroke();
  }
  private circle(p: Vec, size: number, color: string, ring = false) {
    const q = this.project(p);
    if (q.depth < 0.2) return;
    const c = this.ctx,
      r = Math.max((size * this.focal) / q.depth, 2);
    c.beginPath();
    c.arc(q.x, q.y, r, 0, Math.PI * 2);
    if (ring) {
      c.strokeStyle = color;
      c.lineWidth = 1.4;
      c.stroke();
    } else {
      c.fillStyle = color;
      c.fill();
    }
  }
  private drawPlayer(
    p: Vec,
    shirt: string,
    cap: string,
    moving = false,
    pitcher = false,
    batter = false,
    yaw = 0,
  ) {
    const faces: Face[] = [];
    const stride = moving ? Math.sin(this.time * 16) * 0.16 : 0;
    this.box(p.x - 0.1, p.y + 0.45, p.z + stride, 0.14, 0.8, 0.17, "#e9e4d6", faces);
    this.box(p.x + 0.1, p.y + 0.45, p.z - stride, 0.14, 0.8, 0.17, "#e9e4d6", faces);
    this.box(p.x, p.y + 1.15, p.z, 0.46, 0.64, 0.28, shirt, faces);
    this.box(p.x - 0.3, p.y + 1.12, p.z, 0.14, 0.52, 0.17, shirt, faces);
    const wind = pitcher && this.engine.state.phase === "windup";
    this.box(p.x + 0.3, p.y + (wind ? 1.85 : 1.12), p.z, 0.14, 0.52, 0.17, shirt, faces);
    this.box(p.x, p.y + 1.67, p.z, 0.28, 0.3, 0.27, "#d9ae8b", faces);
    this.box(p.x, p.y + 1.87, p.z, 0.36, 0.13, 0.35, cap, faces);
    this.box(p.x, p.y + 1.82, p.z - 0.2, 0.32, 0.04, 0.17, cap, faces);
    this.box(p.x, p.y + 0.85, p.z, 0.4, 0.06, 0.3, cap, faces);
    if (yaw) {
      const c = Math.cos(yaw),
        s = Math.sin(yaw);
      for (const f of faces)
        f.points = f.points.map((v) => {
          const x = v.x - p.x,
            z = v.z - p.z;
          return V(p.x + x * c + z * s, v.y, p.z - x * s + z * c);
        });
    }
    faces.sort((a, b) => this.depth(b) - this.depth(a));
    faces.forEach((f) => this.drawFace(f));
    if (batter) {
      const swung = this.engine.state.flight?.swung,
        side = p.x >= 0 ? 1 : -1; // left-handed batters hold the bat on the other side
      this.line(
        [
          V(p.x + side * 0.2, p.y + 1.2, p.z),
          V(p.x + side * (swung ? -1 : 0.5), p.y + (swung ? 1.1 : 2.15), p.z),
        ],
        "#dcb280",
        Math.max(2, ((5 * this.focal) / 600 / this.project(p).depth) * 4),
      );
    }
  }
  private depth(f: Face) {
    return f.points.reduce((v, p) => v + this.project(p).depth, 0) / f.points.length;
  }
  private label(text: string, p: Vec, color: string, maxSize: number) {
    const q = this.project(p);
    if (q.depth < 0.2) return;
    const c = this.ctx;
    c.font = `bold ${Math.max(8, Math.min(maxSize, (this.focal / q.depth) * 1.15))}px Arial`;
    c.fillStyle = color;
    c.textAlign = "center";
    c.fillText(text, q.x, q.y);
  }
  update(dt: number) {
    if (!this.host.clientWidth || !this.host.clientHeight) return;
    this.time += dt;
    this.setupCamera();
    const c = this.ctx,
      s = this.engine.state;
    const sky = c.createLinearGradient(0, 0, 0, this.height);
    sky.addColorStop(0, "#9cbcc7");
    sky.addColorStop(0.62, "#d6e0d0");
    sky.addColorStop(1, "#a3b9a0");
    c.fillStyle = sky;
    c.fillRect(0, 0, this.width, this.height);
    const faces: Face[] = [];
    for (const f of this.staticFaces) {
      if (f.points.every((p) => p.y <= 0.06)) this.drawFace(f);
      else faces.push(f);
    }
    faces.sort((a, b) => this.depth(b) - this.depth(a));
    faces.forEach((f) => this.drawFace(f));
    this.line([V(-75, 0.1, 75), V(0, 0.1, 0), V(75, 0.1, 75)], "#ebe6c8", 1.2);
    for (const x of [-0.75, 0.75])
      this.line(
        [
          V(x - 0.25, 0.08, -0.6),
          V(x + 0.25, 0.08, -0.6),
          V(x + 0.25, 0.08, 0.6),
          V(x - 0.25, 0.08, 0.6),
          V(x - 0.25, 0.08, -0.6),
        ],
        "#e2d0b4",
      );
    this.label("HANEUL BASEBALL", V(0, 3, -16.6), "#ecd5a8", 30);
    this.label("DIAMOND ROAD", V(0, 10, 114), "#ecd5a8", 30);
    const l = s.phase === "inplay" ? s.live : null;
    const chars = DEFENSE.map((p, i) => ({
      p: l ? l.defenders[i] : p,
      i,
      shirt: i === 1 ? "#284654" : "#efeadf",
      cap: "#294958",
    }));
    chars.sort((a, b) => this.project(b.p).depth - this.project(a.p).depth);
    for (const ch of chars) {
      // The catcher would sit between the catcher camera and the strike zone.
      if (ch.i === 1 && s.camera === "catcher" && s.phase !== "inplay") continue;
      let yaw = ch.i === 1 ? Math.PI : 0;
      const active = l && ch.i === l.fielder;
      if (active) {
        const target = l.throw ? BASES[l.throw.base - 1] : l.bounced ? l.land : l.catchPoint;
        yaw = playerYaw(V(target.x - ch.p.x, 0, target.z - ch.p.z));
      }
      this.drawPlayer(
        ch.p,
        ch.shirt,
        ch.cap,
        !!active && l.fieldedAt === null,
        ch.i === 0,
        false,
        yaw,
      );
    }
    if (s.mode !== "bullpen" && s.phase !== "inplay")
      this.drawPlayer(
        V(this.engine.batter.hand === "L" ? -0.82 : 0.82, 0, 0),
        "#b76e4c",
        "#273b43",
        false,
        false,
        true,
      );
    if (l) {
      for (const r of l.runners) {
        const pose = runnerPose(r);
        if (pose.visible)
          this.drawPlayer(
            pose.position,
            "#b76e4c",
            "#273b43",
            pose.moving,
            false,
            false,
            playerYaw(pose.facing),
          );
      }
      if (l.fieldedAt === null) this.circle(V(l.land.x, 0.1, l.land.z), 2, "#f7d387", true);
    } else
      s.bases.forEach((has, i) => {
        if (has) this.drawPlayer(V(BASES[i].x + 0.6, 0, BASES[i].z), "#b76e4c", "#273b43");
      });
    if (s.phase !== "inplay" && (s.camera === "pitcher" || s.camera === "catcher")) {
      this.line(
        [
          V(-0.215, 0.55, 0),
          V(0.215, 0.55, 0),
          V(0.215, 1.35, 0),
          V(-0.215, 1.35, 0),
          V(-0.215, 0.55, 0),
        ],
        "#ffffd3",
        1.2,
      );
      const aim = s.flight && !this.engine.batting ? s.flight.aim : s.aim;
      const hint = this.engine.batting && s.flight ? s.flight.hint : null;
      if (hint && (s.phase === "windup" || s.phase === "flight")) {
        const q = this.project(V(hint.x, hint.y, 0));
        if (q.depth > 0.2) {
          const r = (hint.r * 1.15 * this.focal) / q.depth,
            grad = c.createRadialGradient(q.x, q.y, 0, q.x, q.y, r);
          grad.addColorStop(0, "rgba(255,248,223,0.35)");
          grad.addColorStop(0.6, "rgba(255,248,223,0.16)");
          grad.addColorStop(1, "rgba(255,248,223,0)");
          c.fillStyle = grad;
          c.beginPath();
          c.arc(q.x, q.y, r, 0, Math.PI * 2);
          c.fill();
        }
      }
      this.circle(aim, 0.09, "#ffcd6c", true);
    }
    if (s.phase === "flight" && s.flight) {
      const u = clamp(s.flight.elapsed / s.flight.visualDuration, 0, 1);
      const points = [];
      for (let i = 0; i < 10; i++)
        points.push(this.engine.pitchPosition(Math.max(0, u - i * 0.015)));
      this.line(points, "#f9e4a2", 2);
    }
    if (["flight", "inplay", "result"].includes(s.phase)) {
      this.circle(s.ball, 0.085, "#fffee7");
      this.circle(s.ball, 0.14, "#fffbd77f", true);
    }
    c.fillStyle = "#12302b14";
    c.fillRect(0, 0, this.width, this.height);
  }
  private move = (e: PointerEvent) => {
    const b = this.canvas.getBoundingClientRect(),
      sx = (e.clientX - b.left - this.width / 2) / this.focal,
      sy = -(e.clientY - b.top - this.height / 2) / this.focal,
      dir = V(
        this.forward.x + sx * this.right.x + sy * this.up.x,
        this.forward.y + sx * this.right.y + sy * this.up.y,
        this.forward.z + sx * this.right.z + sy * this.up.z,
      );
    const t = -this.camera.z / dir.z;
    const x = this.camera.x + dir.x * t,
      y = this.camera.y + dir.y * t;
    if (t > 0 && Math.abs(x) < 1.3 && y > 0 && y < 2.2) this.engine.setAim(x, y);
  };
  private click = (e: PointerEvent) => {
    if (e.button !== 0) return;
    this.move(e);
    this.engine.batting ? this.engine.swing() : this.engine.throwAt();
  };
  dispose() {
    this.resize.disconnect();
    this.canvas.removeEventListener("pointermove", this.move);
    this.canvas.removeEventListener("pointerdown", this.click);
    this.canvas.remove();
  }
}

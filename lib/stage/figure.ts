import { addTask, D2R, ease, reduced, TAU, tween, type Token } from './anim';

// Cin Ali: a red stick figure drawn from a handful of joint angles. Poses are code, so the
// run cycle stays in step with the distance he covers (his feet never slide). Frames are
// stepped ("on eights") and a light line boil keeps him looking hand-drawn while idle.

type Pt = [number, number];
type Angles = { lean: number; head: number; lA: [number, number, number]; lB: [number, number, number]; aA: [number, number]; aB: [number, number] };
export type Pose = 'stand' | 'run' | 'think' | 'jump' | 'point';

const vec = (a: number, l: number): Pt => [Math.sin(a * D2R) * l, Math.cos(a * D2R) * l];
const up = (a: number, l: number): Pt => [Math.sin(a * D2R) * l, -Math.cos(a * D2R) * l];
const add = (p: Pt, v: Pt): Pt => [p[0] + v[0], p[1] + v[1]];
const hash = (n: number) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

export class Figure {
  svg: SVGSVGElement;
  x = 0; y = 0; size = 90; facing = 1; pose: Pose = 'stand';
  phase = 0; tap = 0; seed = 0; air = 0; boil = false;
  private key = '';
  private idleId = 0;
  private g: SVGGElement;
  private parts: Record<'aB' | 'lB' | 'body' | 'head' | 'eye' | 'lA' | 'aA', SVGElement>;

  constructor(svg: SVGSVGElement) {
    this.svg = svg;
    svg.setAttribute('viewBox', '-60 -118 120 126');
    svg.innerHTML = `<g class="g" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="3.7">
      <g opacity=".48"><path class="aB"/><path class="lB"/></g>
      <path class="body"/><circle class="head" r="11.2"/><circle class="eye" r="1.9" fill="currentColor" stroke="none"/>
      <path class="lA"/><path class="aA"/></g>`;
    this.g = svg.querySelector('.g')!;
    const q = (c: string) => svg.querySelector<SVGElement>('.' + c)!;
    this.parts = { aB: q('aB'), lB: q('lB'), body: q('body'), head: q('head'), eye: q('eye'), lA: q('lA'), aA: q('aA') };
  }

  set(o: Partial<Pick<Figure, 'x' | 'y' | 'size' | 'facing' | 'pose' | 'air' | 'phase'>>) {
    Object.assign(this, o);
    this.draw(true);
    return this;
  }

  private angles(): Angles {
    switch (this.pose) {
      case 'run': {
        const f = Math.floor((((this.phase % TAU) + TAU) % TAU) / TAU * 8) / 8 * TAU;
        const leg = (q: number): [number, number, number] => {
          const th = 36 * Math.sin(q), bend = 12 + 64 * Math.max(0, Math.cos(q));
          return [th, th - bend, Math.cos(q) > 0 ? -8 : 0];
        };
        const arm = (q: number): [number, number] => { const u = -34 * Math.sin(q); return [u, u + 88]; };
        return { lean: 12, head: 4, lA: leg(f), lB: leg(f + Math.PI), aA: arm(f), aB: arm(f + Math.PI) };
      }
      case 'think': return { lean: -3, head: 13, lA: [9, 7, this.tap ? 26 : 0], lB: [-6, -6, 0], aA: [58, 176], aB: [-3, 92] };
      case 'jump': return { lean: 6, head: -8, lA: [62, -8, -15], lB: [24, -58, -20], aA: [150, 165], aB: [125, 150] };
      case 'point': return { lean: 0, head: 6, lA: [8, 6, 0], lB: [-8, -8, 0], aA: [90, 93], aB: [-15, -10] };
      default: return { lean: 0, head: 0, lA: [8, 6, 0], lB: [-8, -8, 0], aA: [17, 24], aB: [-17, -12] };
    }
  }

  draw(force = false) {
    const s = this.size, st = this.svg.style;
    st.width = s * 1.2 + 'px'; st.height = s * 1.26 + 'px';
    st.left = this.x - s * .6 + 'px'; st.top = this.y - this.air - s * 1.18 + 'px';
    const key = [this.pose, this.pose === 'run' ? Math.floor(this.phase / TAU * 8) : 0, this.tap, this.boil ? this.seed : 0, this.facing].join('|');
    if (!force && key === this.key) return;
    this.key = key;

    const a = this.angles();
    const J = (p: Pt, i: number): Pt => {
      if (!this.boil) return p;
      const k = this.seed * 13 + i * 7;
      return [p[0] + (hash(k) - .5) * 1.4, p[1] + (hash(k + 3) - .5) * 1.4];
    };
    const hip: Pt = [0, -46];
    const neck = add(hip, up(a.lean, 30)), sh = add(hip, up(a.lean, 26));
    const headC = add(neck, up(a.lean + a.head, 12.5));
    const limb = (root: Pt, u: number, f: number, l1: number, l2: number): [Pt, Pt] => { const m = add(root, vec(u, l1)); return [m, add(m, vec(f, l2))]; };
    const [kA, anA] = limb(hip, a.lA[0], a.lA[1], 23, 23), [kB, anB] = limb(hip, a.lB[0], a.lB[1], 23, 23);
    const toe = (an: Pt, fa: number): Pt => [an[0] + Math.cos(fa * D2R) * 6, an[1] - Math.sin(fa * D2R) * 6];
    const tA = toe(anA, a.lA[2]), tB = toe(anB, a.lB[2]);
    const [eA, hA] = limb(sh, a.aA[0], a.aA[1], 16, 15), [eB, hB] = limb(sh, a.aB[0], a.aB[1], 16, 15);
    const dy = -Math.max(anA[1], tA[1], anB[1], tB[1]); // feet on the ground
    const P = (p: Pt, i: number) => { const q = J([p[0], p[1] + dy], i); return `${q[0].toFixed(2)} ${q[1].toFixed(2)}`; };
    const thru = (r: Pt, m: Pt, e: Pt, i: number) => { // a smooth curve through the middle joint
      const c: Pt = [2 * m[0] - (r[0] + e[0]) / 2, 2 * m[1] - (r[1] + e[1]) / 2];
      return `M${P(r, i)} Q${P(c, i + 1)} ${P(e, i + 2)}`;
    };
    const mid: Pt = [(hip[0] + neck[0]) / 2 + 1.2, (hip[1] + neck[1]) / 2];
    this.parts.body.setAttribute('d', `M${P(hip, 1)} Q${P(mid, 2)} ${P(neck, 3)}`);
    const hc = J([headC[0], headC[1] + dy], 4);
    this.parts.head.setAttribute('cx', String(hc[0])); this.parts.head.setAttribute('cy', String(hc[1]));
    this.parts.eye.setAttribute('cx', String(hc[0] + 4.6)); this.parts.eye.setAttribute('cy', String(hc[1] - 1.2 + (a.head > 8 ? 1.4 : 0)));
    this.parts.lA.setAttribute('d', thru(hip, kA, anA, 10) + ` L${P(tA, 13)}`);
    this.parts.lB.setAttribute('d', thru(hip, kB, anB, 20) + ` L${P(tB, 23)}`);
    this.parts.aA.setAttribute('d', thru(sh, eA, hA, 30));
    this.parts.aB.setAttribute('d', thru(sh, eB, hB, 40));
    this.g.setAttribute('transform', this.facing < 0 ? 'scale(-1 1)' : '');
  }

  stopIdle() { this.idleId++; this.boil = false; this.tap = 0; }

  /** A few seconds of life (line boil, foot taps), then he holds still. */
  idle(pose: Pose, { taps = false, ms = 9000 } = {}) {
    this.stopIdle(); this.pose = pose; this.draw(true);
    if (reduced()) return;
    const id = this.idleId, start = performance.now();
    this.boil = true;
    addTask(t => {
      if (id !== this.idleId) return false;
      const e = t - start;
      if (e > ms) { this.boil = false; this.tap = 0; this.draw(true); return false; }
      this.seed = Math.floor(e / 130);
      if (taps) { const i = Math.floor((e % 3400) / 150); this.tap = i < 6 && i % 2 === 1 ? 1 : 0; }
      this.draw();
    });
  }

  runTo(x2: number, { tok, onStep, speed }: { tok?: Token | null; onStep?: (x: number) => void; speed?: number } = {}) {
    this.stopIdle();
    const x1 = this.x, d = Math.abs(x2 - x1);
    if (d < 1) return Promise.resolve(true);
    this.facing = x2 >= x1 ? 1 : -1; this.pose = 'run';
    const sp = speed || this.size * 2.7, stride = this.size * 1.2;
    let last = x1;
    return tween(d / sp * 1000, p => {
      this.x = x1 + (x2 - x1) * p;
      this.phase += Math.abs(this.x - last) / stride * TAU; last = this.x;
      this.draw(); onStep?.(this.x);
    }, tok, ease.run).then(ok => { if (ok) { this.x = x2; this.pose = 'stand'; this.draw(true); } return ok; });
  }

  hopTo(x2: number, y2: number, { tok, dur = 520, height }: { tok?: Token | null; dur?: number; height?: number } = {}) {
    this.stopIdle();
    const x1 = this.x, y1 = this.y, h = height ?? this.size * .45;
    this.facing = x2 >= x1 ? 1 : -1; this.pose = 'jump';
    return tween(dur, p => { this.x = x1 + (x2 - x1) * p; this.y = y1 + (y2 - y1) * p; this.air = 4 * h * p * (1 - p); this.draw(true); }, tok, ease.linear)
      .then(ok => { this.air = 0; this.pose = 'stand'; this.facing = 1; this.draw(true); return ok; });
  }
}

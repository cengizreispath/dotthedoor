// A tiny shared animation clock. Everything that moves on the stage (Cin Ali, the red line,
// the camera, hand-written labels) runs on one requestAnimationFrame loop.

export const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
export const TAU = Math.PI * 2;
export const D2R = Math.PI / 180;

type Task = (t: number) => boolean | void;
const tasks = new Set<Task>();
let ticking = false;

export function addTask(fn: Task) {
  tasks.add(fn);
  if (!ticking) { ticking = true; requestAnimationFrame(tick); }
}
function tick(t: number) {
  for (const fn of [...tasks]) if (fn(t) === false) tasks.delete(fn);
  if (tasks.size) requestAnimationFrame(tick); else ticking = false;
}

export class Token {
  cancelled = false;
  cancel() { this.cancelled = true; }
}

export const ease = {
  linear: (p: number) => p,
  out: (p: number) => 1 - Math.pow(1 - p, 3),
  inOut: (p: number) => (p < .5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2),
  run: (p: number) => .55 * p + .45 * (p * p * (3 - 2 * p)),
};

/** Resolves true when finished, false when cancelled. */
export function tween(dur: number, update: (p: number) => void, tok?: Token | null, e = ease.inOut) {
  return new Promise<boolean>(res => {
    if (tok?.cancelled) return res(false);
    if (dur <= 0) { update(1); return res(true); }
    let t0: number | null = null;
    addTask(t => {
      if (tok?.cancelled) { res(false); return false; }
      if (t0 === null) t0 = t;
      const p = Math.min(1, (t - t0) / dur);
      update(e(p));
      if (p >= 1) { res(true); return false; }
    });
  });
}
export const wait = (ms: number, tok?: Token | null) => tween(ms, () => {}, tok, ease.linear);

// ---- per-visitor preferences (browser storage may be unavailable; never let it throw) ----
export const store = {
  get<T>(k: string, d: T): T {
    try { const v = localStorage.getItem(k); return v == null ? d : (JSON.parse(v) as T); } catch { return d; }
  },
  set(k: string, v: unknown) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
  del(k: string) { try { localStorage.removeItem(k); } catch {} },
};

export const reduced = () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

export type MyNote = { no: number; text: string; name: string | null; status: 'published' | 'held'; token: string; at: number };
export const myNotes = () => store.get<MyNote[]>('dtd.mine', []);

export function track(event: string, params?: Record<string, string | number>) {
  const w = window as unknown as { gtag?: (...a: unknown[]) => void };
  w.gtag?.('event', event, params ?? {});
}

import { DOORS, GENERIC_PROMPT, isDoor, NOTE_MAX, type DoorKey } from '../doors';
import { dotsHTML, endedHTML, esc } from '../text';
import { addTask, clamp, ease, myNotes, reduced, store, TAU, Token, track, tween, wait, type MyNote } from './anim';
import { Figure } from './figure';
import { arrowD, wobble } from './ink';

/*
 * The stage: one continuous scene for "/" (opening + doors) and "/write[/door]" (writing).
 * It is imperative on purpose — Cin Ali, the red line, the camera and the text reveal are all
 * driven from the same measurements and the same clock, which React state would only get in
 * the way of. React renders the markup (components/Stage.tsx); this module brings it to life.
 */

type Row = { els: HTMLElement[]; x: number; right: number; base: number; ground: number };
type Dot = { x: number; y: number; r: number };
type InkLine = { x1: number; x2: number; y: number; d?: undefined } | { d: string };
type WriteLayout = {
  key: DoorKey | null; mob: boolean; fs2: number; base: number; ground: number; dot: Dot;
  phraseX: number; phraseW: number; cinX: number; panelLeft: number; panelW: number; panelTop: number; promptMB: number;
};
type Scene = 'none' | 'opening' | 'home' | 'trans' | 'write';

export type StageOptions = { navigate: (url: string) => void };

export function createStage(root: HTMLElement, opts: StageOptions) {
  const $ = <T extends Element = HTMLElement>(s: string, r: ParentNode = root) => r.querySelector(s) as T;
  const $$ = <T extends Element = HTMLElement>(s: string, r: ParentNode = root) => [...r.querySelectorAll(s)] as T[];

  const stage = $('#stage'), world = $('#world');
  const gLines = $<SVGGElement>('#gLines');
  const ln0 = $('#ln0'), ln1 = $('#ln1'), bigdot = $('#bigdot');
  const lblYou = $('#lblYou'), lblDot = $('#lblDot'), lblDoor = $('#lblDoor');
  const arr = { you: $<SVGPathElement>('#arrYou'), dot: $<SVGPathElement>('#arrDot'), door: $<SVGPathElement>('#arrDoor') };
  const doorsEl = $('#doors'), bubble = $('#bubble'), tail = $<SVGSVGElement>('#tail');
  const replayBtn = $<HTMLButtonElement>('#replay'), skipBtn = $<HTMLButtonElement>('#skip');
  const phraseEl = $('#phrase'), ghost = $('.ghost', phraseEl), inked = $('.inked', phraseEl);
  const mini = $('#mini'), panel = $('#panel'), promptEl = $('#prompt'), editor = $('#editor');
  const ta = $<HTMLTextAreaElement>('#ta'), mirror = $('#mirror');
  const dotbtn = $<HTMLButtonElement>('#dotbtn'), actions = $('#actions'), countEl = $('#count'), hintEl = $('#hint');
  const dlg = $<HTMLDialogElement>('#pub'), pubForm = $<HTMLFormElement>('#pubForm'), pubName = $<HTMLInputElement>('#pubName');
  const pubCare = $('#pubCare'), pubError = $('#pubError'), pubGo = $<HTMLButtonElement>('#pubGo');
  const fig = new Figure($<SVGSVGElement>('#cin'));
  const navH = () => document.querySelector<HTMLElement>('.nav')?.offsetHeight ?? 0;

  const L = {} as {
    mob: boolean; W: number; H: number; fs: number; m: number; rows: Row[]; cin: number; gOff: number;
    dot: Dot; last: Row; cinStart: number; cinEnd: number; hs: number;
  };
  let inkLines: InkLine[] = [];
  let scene: Scene = 'none';
  let bubbleTimer = 0;
  let writeKey: DoorKey | null = null;
  let WL: WriteLayout | null = null;
  let curTok: Token | null = null;
  let expectedPath: string | null = null;
  let destroyed = false;
  const newTok = () => { curTok?.cancel(); curTok = new Token(); return curTok; };
  const listeners: Array<() => void> = [];
  const on = <K extends string>(t: EventTarget, ev: K, fn: (e: Event) => void, o?: AddEventListenerOptions) => {
    t.addEventListener(ev, fn, o); listeners.push(() => t.removeEventListener(ev, fn, o));
  };
  const live = (msg: string) => { const l = $('#live'); l.textContent = ''; setTimeout(() => (l.textContent = msg), 30); };

  // ---------------------------------------------------------------- drawing helpers
  function setLine(el: HTMLElement, x: number, base: number, fs: number) {
    el.style.fontSize = fs + 'px'; el.style.left = x + 'px'; el.style.top = '0px';
    const b = $('.probe', el).offsetTop;
    el.style.top = base - b + 'px';
    return el.offsetWidth;
  }
  function drawInk() {
    gLines.style.strokeWidth = String(clamp(L.fs * .042, 2, 3.6));
    gLines.innerHTML = inkLines.map(l => `<path d="${'x1' in l ? wobble(l.x1, l.x2, l.y) : l.d}"/>`).join('');
  }
  const setCam = (x: number, y: number) => { world.style.transform = `translate3d(${x}px,${y}px,0)`; };
  function placeDot(d: Dot) {
    bigdot.style.left = d.x - d.r + 'px'; bigdot.style.top = d.y - d.r + 'px';
    bigdot.style.width = bigdot.style.height = d.r * 2 + 'px';
  }
  const resetAnims = (...els: Element[]) => els.forEach(e => e.getAnimations().forEach(a => a.cancel()));

  // ---------------------------------------------------------------- home layout
  function layoutHome() { // measures the home scene even while the write scene is showing
    const wasWrite = stage.classList.contains('is-write');
    stage.classList.remove('is-write');
    try { layoutHomeInner(); } finally { stage.classList.toggle('is-write', wasWrite); }
  }
  function layoutHomeInner() {
    const W = stage.clientWidth, vh = window.innerHeight, nh = navH();
    const mob = W < 900;
    L.mob = mob; L.W = W;
    document.documentElement.classList.toggle('mob', mob);
    ln0.style.fontSize = ln1.style.fontSize = '100px';
    const w0 = ln0.offsetWidth / 100, w1 = ln1.offsetWidth / 100;
    let fs: number, m: number, rows: Omit<Row, 'ground'>[];
    if (!mob) {
      m = clamp(Math.round(W * .065), 28, 112);
      const doorsW = clamp(W * .29, 300, 430);
      fs = clamp((W - 2 * m - doorsW - 40) / (w0 + .27 + w1 + 2.5), 40, 92);
      L.H = Math.max(600, vh - nh);
      const base = Math.round(L.H * .52);
      const a = setLine(ln0, m, base, fs);
      const bx = m + a + fs * .27, b = setLine(ln1, bx, base, fs);
      rows = [{ els: [ln0, ln1], x: m, right: bx + b, base }];
    } else {
      m = 20;
      fs = clamp(Math.min((W - 2 * m) / (w0 + .04), (W - 2 * m) / (w1 + 1.7)), 30, 60);
      const base0 = Math.round(fs * 1.35 + 78), base1 = Math.round(base0 + fs * 2.3);
      const a = setLine(ln0, m, base0, fs), b = setLine(ln1, m, base1, fs);
      rows = [{ els: [ln0], x: m, right: m + a, base: base0 }, { els: [ln1], x: m, right: m + b, base: base1 }];
    }
    Object.assign(L, { fs, m, cin: fs * (mob ? 1.42 : 1.62), gOff: fs * .17 });
    L.rows = rows.map(r => ({ ...r, ground: r.base + L.gOff }));
    const last = L.rows[L.rows.length - 1], r = fs * .1;
    L.dot = { x: parseFloat(ln1.style.left) + $('.dotslot', ln1).offsetLeft + fs * .03 + r, y: last.base - r, r };
    L.last = last;
    placeDot(L.dot);
    L.cinStart = L.rows[0].x + L.cin * .3;
    L.cinEnd = L.dot.x + L.cin * .72;

    // hand-written labels: "This is you", and "And this is Dot" over "the door"
    const hs = clamp(fs * .5, 24, 38);
    L.hs = hs;
    [lblYou, lblDot, lblDoor].forEach(e => (e.style.fontSize = hs + 'px'));
    const g0 = L.rows[0].ground;
    const ly = { x: L.cinStart + L.cin * .45, y: g0 - L.cin * 1.22 - hs * .5 };
    lblYou.style.left = ly.x + 'px'; lblYou.style.top = ly.y + 'px';
    arr.you.setAttribute('d', arrowD(ly.x - 6, ly.y + hs * .6, L.cinStart + L.cin * .16, g0 - L.cin * 1.02, -.35));
    const dTop = last.base - fs * .74 - hs - (mob ? 14 : 34);
    lblDot.style.left = L.dot.x + hs * .3 - lblDot.offsetWidth + 'px'; lblDot.style.top = dTop + 'px';
    arr.dot.setAttribute('d', arrowD(L.dot.x + hs * .12, dTop + hs * 1.02, L.dot.x + r * .2, L.dot.y - r - 5, .18));
    const doorTop = last.ground + (mob ? 16 : 28);
    lblDoor.style.left = L.dot.x - hs * .2 + 'px'; lblDoor.style.top = doorTop + 'px';
    arr.door.setAttribute('d', arrowD(L.dot.x + hs * .18, doorTop + 1, L.dot.x + r * .1, L.dot.y + r + 5, -.18));

    // the doors, and Cin Ali's bubble
    if (!mob) {
      const left = L.cinEnd + L.cin * .8;
      doorsEl.style.left = left + 'px'; doorsEl.style.width = W - m - left + 'px';
      const bBottom = last.ground - L.cin * 1.08 - 12, bl = L.cinEnd - L.cin * .12;
      bubble.style.left = bl + 'px'; bubble.style.width = Math.min(340, W - m - bl) + 'px';
      bubble.style.top = bBottom - bubble.offsetHeight + 'px';
      Object.assign(tail.style, { left: '14px', top: '100%', bottom: '', transform: 'translateY(-1.5px)' });
      doorsEl.style.top = Math.max(last.base - doorsEl.offsetHeight * .38, bBottom + 24) + 'px';
      stage.style.height = L.H + 'px';
      replayBtn.style.left = W - m - 160 + 'px'; replayBtn.style.top = L.H - 56 + 'px';
    } else {
      const bt = doorTop + hs + 28;
      bubble.style.left = m + 'px'; bubble.style.width = W - 2 * m + 'px'; bubble.style.top = bt + 'px';
      Object.assign(tail.style, { left: clamp(L.cinEnd - m - 10, 20, W - 2 * m - 40) + 'px', top: '', bottom: '100%', transform: 'translateY(1.5px) scaleY(-1)' });
      const dt = bt + bubble.offsetHeight + 24;
      doorsEl.style.left = m + 'px'; doorsEl.style.width = W - 2 * m + 'px'; doorsEl.style.top = dt + 'px';
      replayBtn.style.left = m + 'px'; replayBtn.style.top = dt + doorsEl.offsetHeight + 12 + 'px';
      L.H = Math.max(vh - nh, dt + doorsEl.offsetHeight + 72);
      stage.style.height = L.H + 'px';
    }
  }

  function revealRows(rowIdx: number, cut: number) {
    L.rows.forEach((r, i) => r.els.forEach(el => {
      if (i < rowIdx) el.style.clipPath = 'none';
      else if (i > rowIdx) el.style.clipPath = 'inset(-40% 100% -40% 0)';
      else {
        const right = parseFloat(el.style.left) + el.offsetWidth;
        el.style.clipPath = `inset(-40% ${Math.max(0, right - cut)}px -40% -12px)`;
      }
    }));
  }
  function showLabel(el: HTMLElement, a: SVGPathElement, show: boolean) {
    el.classList.toggle('on', show); el.style.clipPath = '';
    a.classList.toggle('on', show); a.style.strokeDashoffset = '';
  }
  async function writeLabel(el: HTMLElement, a: SVGPathElement, dur: number, tok: Token) {
    await tween(dur, p => (el.style.clipPath = `inset(-30% ${(1 - p) * 100}% -30% -10%)`), tok, ease.out);
    await tween(dur * .6, p => (a.style.strokeDashoffset = String(1 - p)), tok, ease.out);
    if (!tok.cancelled) { el.classList.add('on'); a.classList.add('on'); }
  }
  function doorsOn(animate: boolean) {
    doorsEl.classList.add('on');
    $$('.door, .q', doorsEl).forEach(b => { b.style.opacity = ''; b.style.visibility = ''; b.style.borderTopColor = ''; });
    $$('.door .t', doorsEl).forEach(t => (t.style.visibility = ''));
    if (animate && !reduced()) {
      [$('.q', doorsEl), ...$$('.door', doorsEl)].forEach((b, i) =>
        b.animate([{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }],
          { duration: 480, delay: 110 * i, easing: 'cubic-bezier(.2,.7,.2,1)', fill: 'backwards' }));
    }
  }
  function scheduleBubble() {
    clearTimeout(bubbleTimer);
    bubbleTimer = window.setTimeout(() => bubble.classList.add('on'), 1500);
  }

  // ---------------------------------------------------------------- home states
  function homeFinal() {
    scene = 'home';
    stage.classList.remove('is-write'); setCam(0, 0);
    phraseEl.hidden = true; skipBtn.hidden = true; replayBtn.hidden = false;
    revealRows(99, 0);
    inkLines = L.rows.map((r, i) => ({ x1: r.x - 4, x2: i === L.rows.length - 1 ? L.cinEnd + L.cin * .3 : r.right + L.cin * .35, y: r.ground }));
    drawInk();
    resetAnims(bigdot, lblYou, arr.you, lblDot, lblDoor, arr.dot, arr.door, replayBtn);
    bigdot.style.transform = 'scale(1)';
    showLabel(lblYou, arr.you, false); showLabel(lblDot, arr.dot, true); showLabel(lblDoor, arr.door, true);
    fig.svg.style.opacity = '';
    fig.set({ x: L.cinEnd, y: L.last.ground, size: L.cin, facing: 1, air: 0 });
    fig.idle('think', { taps: true, ms: 10500 });
    doorsOn(false);
    bubble.classList.remove('on'); scheduleBubble();
    store.set('dtd.seen', true);
  }

  async function playOpening() {
    const tok = newTok();
    scene = 'opening';
    stage.classList.remove('is-write'); setCam(0, 0);
    phraseEl.hidden = true; replayBtn.hidden = true; skipBtn.hidden = false;
    revealRows(-1, 0); inkLines = []; drawInk();
    resetAnims(bigdot); bigdot.style.transform = 'scale(0)';
    ([[lblYou, arr.you], [lblDot, arr.dot], [lblDoor, arr.door]] as const).forEach(([e, a]) => {
      showLabel(e, a, false); e.style.clipPath = 'inset(-30% 100% -30% -10%)'; a.style.strokeDashoffset = '1';
    });
    doorsEl.classList.remove('on'); bubble.classList.remove('on'); clearTimeout(bubbleTimer);
    fig.set({ x: L.cinStart, y: L.rows[0].ground, size: L.cin, facing: 1, pose: 'stand', air: 0 });
    fig.idle('stand', { ms: 3400 });

    await wait(450, tok);
    await writeLabel(lblYou, arr.you, 650, tok);
    await wait(1100, tok);
    if (tok.cancelled) return;
    lblYou.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 350, fill: 'forwards' });
    arr.you.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 350, fill: 'forwards' });

    // Cin Ali runs; the line draws under him and the sentence appears behind him.
    let popped = false;
    const lastI = L.rows.length - 1;
    for (let i = 0; i < L.rows.length; i++) {
      const r = L.rows[i];
      if (i > 0) { // carriage return: a leap over the line just written
        await fig.hopTo(r.x + L.cin * .3, r.ground, { tok, dur: 720, height: (r.ground - L.rows[i - 1].ground) / 2 + L.cin * 1.25 });
        if (tok.cancelled) return;
      }
      const x1 = r.x - 4;
      await fig.runTo(i === lastI ? L.cinEnd : r.right + L.cin * .35, {
        tok,
        onStep: x => {
          revealRows(i, x - L.cin * .22);
          inkLines[i] = { x1, x2: x + L.cin * .3, y: r.ground }; drawInk();
          if (i === lastI && !popped && x - L.cin * .25 > L.dot.x + L.dot.r) { // the Dot lands behind him
            popped = true; bigdot.style.transform = 'scale(1)';
            bigdot.animate([{ transform: 'scale(0)' }, { transform: 'scale(1.35)', offset: .6 }, { transform: 'scale(1)' }], { duration: 420, easing: 'ease-out' });
          }
        },
      });
      if (tok.cancelled) return;
    }
    revealRows(99, 0);
    fig.idle('stand', { ms: 1500 });
    await wait(220, tok);
    await writeLabel(lblDot, arr.dot, 520, tok);
    await writeLabel(lblDoor, arr.door, 420, tok);
    await wait(650, tok); // let "Dot / the door" land before anything competes with it
    if (tok.cancelled) return;
    bigdot.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.6)', offset: .45 }, { transform: 'scale(1)' }], { duration: 620, easing: 'cubic-bezier(.3,.7,.2,1)' });
    await wait(300, tok);
    if (tok.cancelled) return;
    doorsOn(true);
    await wait(700, tok);
    if (tok.cancelled) return;
    homeFinal();
  }

  function skipOpening() {
    if (scene !== 'opening') return;
    curTok?.cancel();
    homeFinal();
    $<HTMLButtonElement>('.door', doorsEl).focus({ preventScroll: true });
  }

  // ---------------------------------------------------------------- write layout
  function phraseWidth(key: DoorKey) { // width at 100px
    ghost.innerHTML = inked.innerHTML = endedHTML(DOORS[key].label);
    phraseEl.hidden = false; phraseEl.style.fontSize = '100px'; phraseEl.style.transform = '';
    return phraseEl.offsetWidth / 100;
  }

  function computeWrite(key: DoorKey | null): WriteLayout {
    const { W, m, mob, cin } = L;
    // one size for every door phrase, fitted to the longest one, so the line never changes scale
    const wMax = Math.max(...(Object.keys(DOORS) as DoorKey[]).map(phraseWidth));
    const avail = mob ? W - 2 * m - cin * .78 : W * .52 - 28 - cin * 1.2 - m;
    const fs2 = clamp(avail / (wMax + .55), mob ? 16 : 22, mob ? 30 : 46);
    const r = fs2 * .1; // the Dot is always .2em of the line it belongs to
    const panelLeft = mob ? m : Math.round(W * .52), panelW = mob ? W - 2 * m : Math.min(620, W - m - panelLeft);
    let base: number, ground: number, panelTop = 0, promptMB = 0;
    if (mob) {
      // mobile reads top-down: (doors) → prompt → the door phrase on its line → your lines right under it
      let top = 18;
      if (!key) {
        mini.hidden = false;
        mini.style.left = m + 'px'; mini.style.width = W - 2 * m + 'px'; mini.style.top = top + 'px';
        top += (mini.offsetHeight || 150) + 22;
      }
      const probeP = promptEl.cloneNode() as HTMLElement;
      probeP.removeAttribute('id');
      probeP.innerHTML = dotsHTML(key ? DOORS[key].prompt : GENERIC_PROMPT);
      Object.assign(probeP.style, { position: 'absolute', visibility: 'hidden', width: panelW + 'px', margin: '0' });
      stage.appendChild(probeP);
      const ph = probeP.offsetHeight;
      probeP.remove();
      const cs = getComputedStyle(ta), fe = parseFloat(cs.fontSize), lh = parseFloat(cs.lineHeight) || fe * 1.55;
      panelTop = top; promptMB = Math.round(cin + 20);
      const y0 = top + ph + promptMB + 6 + lh / 2 + fe * .5; // first line of your text
      ground = Math.round(y0 - lh * 1.15); base = ground - L.gOff;
    } else {
      base = L.rows[0].base; ground = base + L.gOff;
    }
    const dot = { x: m + r, y: base - r, r };
    let phraseX = 0, phraseW = 0, cinX: number;
    if (key) {
      const wp = phraseWidth(key);
      phraseX = dot.x + r + fs2 * .32; phraseW = wp * fs2;
      cinX = phraseX + phraseW + cin * .42;
    } else {
      phraseEl.hidden = true; cinX = dot.x + cin * .8;
    }
    return { key, mob, fs2, base, ground, dot, phraseX, phraseW, cinX, panelLeft, panelW, panelTop, promptMB };
  }

  function sizeStage() {
    if (!WL) return;
    const vh = window.innerHeight - navH();
    const bottom = panel.offsetTop + panel.offsetHeight + (WL.mob ? 32 : 80);
    stage.style.height = Math.max(WL.mob ? vh : L.H, bottom) + 'px';
  }

  function applyWrite(o: WriteLayout, { enter = false } = {}) {
    WL = o; writeKey = o.key; scene = 'write';
    stage.classList.add('is-write'); setCam(0, 0); clearTimeout(bubbleTimer); skipBtn.hidden = true;
    placeDot(o.dot); resetAnims(bigdot); bigdot.style.transform = 'scale(1)';
    if (o.key) {
      ghost.innerHTML = inked.innerHTML = endedHTML(DOORS[o.key].label);
      phraseEl.hidden = false; phraseEl.style.transform = ''; ghost.style.opacity = ''; inked.style.clipPath = 'none';
      setLine(phraseEl, o.phraseX, o.base, o.fs2);
    } else phraseEl.hidden = true;
    fig.set({ x: o.cinX, y: o.ground, size: L.cin, facing: 1, air: 0 });
    if (o.key) fig.idle('stand', { ms: 2500 }); else fig.idle('think', { taps: true, ms: 8000 });
    promptEl.innerHTML = dotsHTML(o.key ? DOORS[o.key].prompt : GENERIC_PROMPT);
    mini.hidden = !!o.key;
    panel.style.left = o.panelLeft + 'px'; panel.style.width = o.panelW + 'px';
    if (!o.key && !o.mob) {
      mini.style.left = L.m + 'px'; mini.style.width = o.panelLeft - L.m - 56 + 'px'; mini.style.top = o.ground + 56 + 'px';
    }
    panel.classList.add('on');
    promptEl.style.marginBottom = o.mob ? o.promptMB + 'px' : '';
    if (o.mob) panel.style.top = o.panelTop + 'px';
    else { // your first line sits on the same red line as the door phrase
      renderMirror();
      const prev = panel.style.transition;
      panel.style.transition = 'none'; panel.style.top = '0px';
      const b0 = editor.offsetTop + $('.probe', mirror).offsetTop, fe = parseFloat(getComputedStyle(ta).fontSize);
      panel.style.top = Math.max(24, o.ground - fe * .2 - b0) + 'px';
      void panel.offsetHeight;
      panel.style.transition = prev;
    }
    if (enter && !reduced()) { panel.classList.remove('enter'); void panel.offsetWidth; panel.classList.add('enter'); }
    sizeStage();
    renderMirror();
    if (enter && !reduced()) {
      inkAnim = true;
      tween(650, p => writeInk(p), null, ease.out).then(() => { inkAnim = false; writeInk(); });
    } else writeInk();
    cinTarget();
    if (!enter) snapCin();
  }

  // ---------------------------------------------------------------- door → writing transition
  async function chooseDoor(key: DoorKey, btn: HTMLElement) {
    if (scene === 'opening') skipOpening();
    if (scene !== 'home') return;
    const tok = newTok();
    scene = 'trans'; clearTimeout(bubbleTimer); fig.stopIdle();
    track('door_chosen', { door: key });
    if (reduced()) { goWrite(key, true); return; }

    const S = window.scrollY;
    window.scrollTo(0, 0); setCam(0, -S);
    const o = computeWrite(key);
    const dx = L.dot.x - o.dot.x, dy = L.last.base - o.base;
    setLine(phraseEl, o.phraseX + dx, o.base + dy, o.fs2);
    inked.style.clipPath = 'inset(-40% 100% -40% 0)'; ghost.style.opacity = '1';

    // the chosen words leave their door and land on the line (FLIP)
    const t = $('.t', btn), from = t.getBoundingClientRect(), to = phraseEl.getBoundingClientRect();
    const sc = parseFloat(getComputedStyle(btn).fontSize) / o.fs2;
    phraseEl.style.transformOrigin = '0 0';
    t.style.visibility = 'hidden'; btn.style.borderTopColor = 'transparent';
    const fade = (els: Element[], ms: number) => els.forEach(e => e.animate([{ opacity: 1 }, { opacity: 0 }], { duration: ms, fill: 'forwards' }));
    fade([...$$('.door', doorsEl).filter(b => b !== btn), $('.q', doorsEl)], 260);
    fade([lblDot, lblDoor, arr.dot, arr.door, replayBtn], 300);
    bubble.classList.remove('on');
    const fly = tween(700, p => {
      phraseEl.style.transform = `translate(${(from.left - to.left) * (1 - p)}px,${(from.top - to.top) * (1 - p)}px) scale(${sc + (1 - sc) * p})`;
      ghost.style.opacity = String(1 - .8 * p);
    }, tok, ease.inOut);
    await wait(380, tok);
    if (tok.cancelled) return;

    // Mario-style: Cin Ali runs on, the camera follows, and he writes the chosen phrase
    fig.facing = 1;
    const xFrom = fig.x, xTo = o.cinX + dx, lineFrom = L.cinEnd;
    const lineIdx = inkLines.length - 1, baseLine = inkLines[lineIdx] as { x1: number; x2: number; y: number };
    await fig.runTo(xTo, {
      tok, speed: L.cin * 2.9,
      onStep: x => {
        const p = (x - xFrom) / (xTo - xFrom);
        setCam(-dx * p, -S + (S - dy) * p);
        const rr = L.dot.r + (o.dot.r - L.dot.r) * Math.min(1, p * 1.6); // the Dot settles to the new line's scale
        placeDot({ x: L.dot.x, y: L.last.base - rr, r: rr });
        inkLines[lineIdx] = { x1: baseLine.x1, x2: Math.max(lineFrom + L.cin * .3, x + L.cin * .3), y: baseLine.y };
        drawInk();
        inked.style.clipPath = `inset(-40% ${Math.max(0, o.phraseX + dx + o.phraseW - (x - L.cin * .22))}px -40% -12px)`;
      },
    });
    await fly;
    if (tok.cancelled) return;
    resetAnims(...$$('.door, .q', doorsEl), lblDot, lblDoor, arr.dot, arr.door, replayBtn);
    doorsOn(false); doorsEl.classList.remove('on');
    goWrite(key, true);
  }

  function goWrite(key: DoorKey, enter: boolean) {
    const path = `/write/${key}`;
    expectedPath = path;
    window.history.pushState(null, '', path);
    renderWrite(key, { enter });
  }

  async function chooseMini(key: DoorKey) {
    if (scene !== 'write' || writeKey) return;
    const tok = newTok();
    track('door_chosen', { door: key });
    mini.hidden = true;
    const o = computeWrite(key);
    expectedPath = `/write/${key}`;
    window.history.replaceState(null, '', expectedPath);
    applyWrite(o); syncEditor();
    if (!reduced()) { // Cin Ali writes the chosen phrase onto the line
      fig.set({ x: o.dot.x + L.cin * .8 });
      inked.style.clipPath = 'inset(-40% 100% -40% 0)';
      phraseEl.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 300 });
      await fig.runTo(o.cinX, { tok, onStep: x => {
        inked.style.clipPath = `inset(-40% ${Math.max(0, o.phraseX + o.phraseW - (x - L.cin * .22))}px -40% -12px)`;
      } });
      if (tok.cancelled) return;
      inked.style.clipPath = 'none';
      fig.idle('stand', { ms: 1500 });
    }
    ta.focus({ preventScroll: true });
  }

  // ---------------------------------------------------------------- editor
  let placed = false, placing = false, inkAnim = false, firstInputAt = 0;

  /** The visible layer behind the (transparent) textarea: red periods, the end Dot, the placeholder. */
  function renderMirror() {
    const v = ta.value;
    let html: string;
    if (placed && v.trim()) {
      const t = v.replace(/\s+$/, ''), rest = v.slice(t.length);
      html = t.endsWith('.')
        ? dotsHTML(t.slice(0, -1)) + '<span class="p ghostp">.</span><span class="enddot over"></span>' + esc(rest)
        : dotsHTML(t) + '<span class="enddot"></span>' + esc(rest);
    } else html = dotsHTML(v);
    if (v === '') html = '<span class="ph">Start here</span>';
    else if (v.endsWith('\n')) html += '​';
    mirror.innerHTML = '<i class="probe"></i>' + html;
  }

  /** The red line runs from the door phrase into your words: one line per line you write. */
  function writeInk(p = 1) {
    if (!WL || scene !== 'write') return;
    const o = WL, cs = getComputedStyle(ta), fe = parseFloat(cs.fontSize), lh = parseFloat(cs.lineHeight);
    const y0 = panel.offsetTop + editor.offsetTop + $('.probe', mirror).offsetTop + fe * .2;
    const rng = document.createRange();
    rng.setStartAfter($('.probe', mirror)); rng.setEnd(mirror, mirror.childNodes.length);
    const rr = rng.getBoundingClientRect(), rs = rng.getClientRects();
    const n = rs.length ? 1 + Math.max(0, Math.round((rr.height - rs[0].height) / lh)) : 1;
    const left = o.panelLeft - (o.mob ? 4 : 0), right = o.panelLeft + o.panelW + (o.mob ? 4 : 0);
    const from = o.cinX + L.cin * .3;
    const lines: InkLine[] = [{ x1: -40, x2: from + (right - from) * p, y: o.ground }];
    if (!o.mob) for (let i = 1; i < n; i++) lines.push({ x1: left, x2: left + (right - left) * p, y: y0 + i * lh });
    else if (p >= 1) {
      lines.push({ d: `M${right} ${o.ground} C${right + 12} ${o.ground} ${right + 12} ${y0} ${right} ${y0}` });
      for (let i = 0; i < n; i++) lines.push({ x1: left, x2: right, y: y0 + i * lh });
    }
    inkLines = lines; drawInk();
  }

  // Cin Ali walks with your caret: he stands just ahead of it on the line you're writing,
  // like the opening where the sentence appears behind him. The real caret stays.
  const caretMirror = document.createElement('div');
  caretMirror.className = 'mirror';
  caretMirror.style.visibility = 'hidden';
  caretMirror.setAttribute('aria-hidden', 'true');
  editor.appendChild(caretMirror);

  function caretPos() {
    const v = ta.value, focused = document.activeElement === ta;
    const c = focused ? ta.selectionStart : v.length;
    const fe = parseFloat(getComputedStyle(ta).fontSize), ox = panel.offsetLeft, oy = panel.offsetTop + editor.offsetTop;
    const ed = placed && !v.slice(c).trim() ? mirror.querySelector<HTMLElement>('.enddot') : null;
    if (ed) return { x: ox + ed.offsetLeft + fe * .34, y: oy + ed.offsetTop + fe * .2, collapsed: true };
    caretMirror.innerHTML = esc(v.slice(0, c)) + '<i class="probe"></i>' + esc(v.slice(c)) + '​';
    const mk = $('.probe', caretMirror);
    return { x: ox + mk.offsetLeft, y: oy + mk.offsetTop + fe * .2, collapsed: !focused || ta.selectionStart === ta.selectionEnd };
  }

  const F = { on: false, tx: 0, ty: 0, ts: 0, hop: false, last: 0, still: 0, dim: false };
  function cinTarget() {
    if (scene !== 'write' || !WL) return;
    if (document.activeElement === ta || ta.value.length > 0) {
      const c = caretPos(), lh = parseFloat(getComputedStyle(ta).lineHeight), sz = clamp(lh * 1.15, 32, 46);
      Object.assign(F, { tx: c.x + sz * .42, ty: c.y, ts: sz, dim: !c.collapsed });
    } else Object.assign(F, { tx: WL.cinX, ty: WL.ground, ts: L.cin, dim: false });
    followCin();
  }
  function snapCin() { fig.stopIdle(); fig.set({ x: F.tx, y: F.ty, size: F.ts, pose: 'stand', facing: 1, air: 0 }); }
  function followCin() {
    if (F.on) return;
    Object.assign(F, { on: true, last: 0, still: 0 });
    fig.stopIdle();
    addTask(t => {
      if (scene !== 'write' || destroyed) { F.on = false; return false; }
      const dt = F.last ? Math.min(.05, (t - F.last) / 1000) : .016;
      F.last = t;
      if (F.hop) return;
      fig.svg.style.opacity = F.dim ? '.3' : '';
      if (Math.abs(fig.y - F.ty) > 2) { // a new line: a small carriage-return hop
        if (reduced()) { fig.set({ x: F.tx, y: F.ty, size: F.ts }); return; }
        F.hop = true;
        const x1 = fig.x, y1 = fig.y, s1 = fig.size, { tx, ty, ts } = F, h = Math.min(70, Math.abs(ty - y1) * .4 + 18);
        fig.pose = 'jump'; fig.facing = tx >= x1 ? 1 : -1;
        tween(Math.abs(ty - y1) > 120 ? 520 : 360, q => {
          fig.x = x1 + (tx - x1) * q; fig.y = y1 + (ty - y1) * q; fig.air = 4 * h * q * (1 - q); fig.size = s1 + (ts - s1) * q;
          fig.draw(true);
        }, null, ease.inOut).then(() => { fig.air = 0; fig.pose = 'stand'; fig.facing = 1; F.hop = false; fig.draw(true); });
        return;
      }
      const dx = F.tx - fig.x;
      const step = reduced() ? dx : Math.sign(dx) * Math.min(Math.abs(dx), Math.max(240, Math.abs(dx) * 5) * dt);
      fig.size += (F.ts - fig.size) * (reduced() ? 1 : Math.min(1, dt * 7));
      if (Math.abs(step) > .2) {
        fig.x += step; fig.pose = 'run'; fig.facing = step > 0 ? 1 : -1;
        fig.phase += Math.abs(step) / (fig.size * 1.2) * TAU; F.still = 0;
      } else {
        F.still += dt;
        if (F.still > .12 && fig.pose === 'run') { fig.pose = 'stand'; fig.facing = 1; fig.draw(true); }
      }
      fig.draw();
      if (F.still > .5 && Math.abs(F.ts - fig.size) < .5) { F.on = false; fig.draw(true); return false; }
    });
  }
  let cinRaf = 0;
  const queueCin = () => { cancelAnimationFrame(cinRaf); cinRaf = requestAnimationFrame(cinTarget); };

  function autoGrow() { ta.style.height = 'auto'; ta.style.height = ta.scrollHeight + 1 + 'px'; sizeStage(); }

  function syncEditor() {
    const has = ta.value.trim().length >= 2;
    dotbtn.disabled = !has;
    if (!has && placed) setPlaced(false);
    const left = NOTE_MAX - ta.value.length;
    countEl.textContent = left <= 60 ? `${left} left` : '';
    renderMirror(); autoGrow();
    if (!inkAnim) writeInk();
    queueCin();
    store.set('dtd.draft', ta.value);
  }

  function setPlaced(value: boolean, { showActions = true } = {}) {
    placed = value;
    dotbtn.setAttribute('aria-pressed', String(value));
    hintEl.innerHTML = dotsHTML(value ? 'Your dot is placed. You can still change your words.' : 'When you’re ready, place your dot.');
    if (!value || showActions) showActs(value);
    renderMirror(); sizeStage();
    if (!value) { writeInk(); queueCin(); }
  }
  function showActs(show: boolean) {
    actions.hidden = !show;
    if (show && !reduced()) { actions.classList.remove('enter'); void actions.offsetWidth; actions.classList.add('enter'); }
    sizeStage();
  }

  // Placing the dot: Cin Ali steps past the end of your words and the Dot lands behind him, as in the opening.
  async function placeDotAction() {
    if (dotbtn.disabled || placing) return;
    if (placed) { ta.focus(); return; }
    placing = true;
    setPlaced(true, { showActions: false });
    cinTarget();
    track('dot_placed', writeKey ? { door: writeKey } : undefined);
    await wait(reduced() ? 0 : 650);
    showActs(true);
    placing = false;
    live('Your dot is placed. Copy your words or add them to the Dot Wall.');
    if (L.mob) actions.scrollIntoView({ block: 'nearest', behavior: reduced() ? 'auto' : 'smooth' });
  }

  async function copyWords(e: Event) {
    const b = e.currentTarget as HTMLButtonElement;
    try { await navigator.clipboard.writeText(ta.value); } catch {
      ta.select(); document.execCommand('copy'); ta.setSelectionRange(ta.value.length, ta.value.length);
    }
    b.textContent = 'Copied'; live('Copied to your clipboard.');
    setTimeout(() => (b.textContent = 'Copy'), 1800);
    track('copy');
  }

  // ---------------------------------------------------------------- publishing
  let turnstile: { siteKey: string | null; widget?: string; token: string | null; loaded?: Promise<void> } = { siteKey: null, token: null };
  type TurnstileApi = { render: (el: HTMLElement, o: Record<string, unknown>) => string; reset: (id?: string) => void };
  const ts = () => (window as unknown as { turnstile?: TurnstileApi }).turnstile;

  async function ensureTurnstile() {
    if (!turnstile.loaded) {
      turnstile.loaded = (async () => {
        const cfg = await fetch('/api/config').then(r => r.json()).catch(() => ({}));
        turnstile.siteKey = cfg.turnstileSiteKey ?? null;
        if (!turnstile.siteKey) return;
        await new Promise<void>((res, rej) => {
          const s = document.createElement('script');
          s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
          s.async = true; s.onload = () => res(); s.onerror = () => rej(new Error('turnstile'));
          document.head.appendChild(s);
        });
      })().catch(() => {});
    }
    await turnstile.loaded;
    const api = ts();
    if (turnstile.siteKey && api && !turnstile.widget) {
      turnstile.widget = api.render($('#pubTurnstile'), {
        sitekey: turnstile.siteKey, appearance: 'interaction-only',
        callback: (t: string) => (turnstile.token = t),
        'expired-callback': () => (turnstile.token = null),
      });
    }
  }

  function previewHTML() {
    const len = [...ta.value.trim()].length, size = len <= 54 ? 'L' : len <= 130 ? 'M' : 'S';
    const who = pubName.value.trim();
    return `<article class="note ${size}"><p class="txt">${endedHTML(ta.value.trim())}</p><div class="meta"><span>${esc(who)}</span></div></article>`;
  }
  function openPublish() {
    pubForm.hidden = false; pubCare.hidden = true; pubError.textContent = '';
    $('#pubPreview').innerHTML = previewHTML();
    dlg.showModal(); pubName.focus();
    track('publish_open');
    ensureTurnstile();
  }

  const ERRORS: Record<string, string> = {
    rate_limited: 'You’ve left a lot of dots today. Try again a little later.',
    verification: 'We couldn’t confirm you’re a person. Please try again in a moment.',
    too_fast: 'Take a breath and try again.',
    length: `Keep it between 2 and ${NOTE_MAX} characters.`,
  };

  async function submitPublish(e: Event) {
    e.preventDefault();
    pubError.textContent = '';
    pubGo.disabled = true;
    try {
      await ensureTurnstile();
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          text: ta.value, name: pubName.value,
          website: $<HTMLInputElement>('#pubHp').value,
          elapsed: firstInputAt ? Date.now() - firstInputAt : 0,
          turnstile: turnstile.token,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (turnstile.widget) { ts()?.reset(turnstile.widget); turnstile.token = null; }
      if (!res.ok) { pubError.textContent = ERRORS[data.error] ?? 'Something went wrong. Your words are still here.'; return; }
      if (data.care) { pubForm.hidden = true; pubCare.hidden = false; $('#careOk').focus(); track('care_shown'); return; }
      if (!data.no) { pubError.textContent = 'Something went wrong. Your words are still here.'; return; }

      const mine: MyNote = { no: data.no, text: data.text, name: data.name, status: data.status, token: data.token, at: Date.now() };
      store.set('dtd.mine', [mine, ...myNotes()].slice(0, 50));
      track('dot_published', { status: data.status });
      dlg.close();
      ta.value = ''; pubName.value = ''; firstInputAt = 0;
      store.del('dtd.draft');
      setPlaced(false); syncEditor();
      opts.navigate(`/wall?you=${data.no}`);
    } catch {
      pubError.textContent = 'Something went wrong. Your words are still here.';
    } finally {
      pubGo.disabled = false;
    }
  }

  // ---------------------------------------------------------------- routing
  function renderHome(animate: boolean) {
    layoutHome(); stage.classList.remove('pending');
    if (animate) playOpening(); else homeFinal();
  }
  function renderWrite(key: DoorKey | null, { enter = false } = {}) {
    layoutHome(); stage.classList.remove('pending'); stage.classList.add('is-write');
    const draft = store.get('dtd.draft', '');
    if (draft && !ta.value) ta.value = draft;
    applyWrite(computeWrite(key), { enter });
    syncEditor();
    if (enter && !L.mob) ta.focus({ preventScroll: true });
    else if (enter) promptEl.focus({ preventScroll: true });
  }

  /** Called on mount and whenever the URL changes (including the browser's back button). */
  function route(path: string) {
    if (destroyed) return;
    if (expectedPath === path) { expectedPath = null; return; } // we already rendered it ourselves
    expectedPath = null;
    curTok?.cancel(); fig.stopIdle(); clearTimeout(bubbleTimer); skipBtn.hidden = true;
    if (dlg.open) dlg.close();
    const parts = path.split('/').filter(Boolean);
    if (parts[0] === 'write') renderWrite(isDoor(parts[1]) ? parts[1] : null, { enter: scene !== 'none' });
    else renderHome(!store.get('dtd.seen', false) && !reduced());
  }

  // ---------------------------------------------------------------- events
  on(skipBtn, 'click', skipOpening);
  on(replayBtn, 'click', () => playOpening());
  on(doorsEl, 'click', e => {
    const b = (e.target as Element).closest<HTMLElement>('.door');
    if (b && isDoor(b.dataset.door)) chooseDoor(b.dataset.door, b);
  });
  on(mini, 'click', e => {
    const b = (e.target as Element).closest<HTMLElement>('.mini-door');
    if (b && isDoor(b.dataset.door)) chooseMini(b.dataset.door);
  });
  on(window, 'keydown', e => { if ((e as KeyboardEvent).key === 'Escape' && scene === 'opening') skipOpening(); });
  on(ta, 'input', () => { if (!firstInputAt) firstInputAt = Date.now(); syncEditor(); });
  on(ta, 'keydown', e => {
    const k = e as KeyboardEvent;
    if (k.key === 'Enter' && (k.metaKey || k.ctrlKey)) { k.preventDefault(); placeDotAction(); }
  });
  ['focus', 'blur', 'keyup', 'click', 'select'].forEach(ev => on(ta, ev, queueCin));
  on(document, 'selectionchange', () => { if (document.activeElement === ta) queueCin(); });
  on(dotbtn, 'click', placeDotAction);
  on($('#copyBtn'), 'click', copyWords);
  on($('#addBtn'), 'click', openPublish);
  on(pubName, 'input', () => ($('#pubPreview').innerHTML = previewHTML()));
  on($('#pubCancel'), 'click', () => dlg.close());
  on($('#careOk'), 'click', () => { dlg.close(); ta.focus(); });
  on(pubForm, 'submit', submitPublish);

  let lastW = stage.clientWidth, lastH = window.innerHeight, rT = 0;
  on(window, 'resize', () => {
    clearTimeout(rT);
    rT = window.setTimeout(() => {
      const W = stage.clientWidth || innerWidth, H = innerHeight;
      if (W === lastW && (L.mob || Math.abs(H - lastH) < 2)) return; // e.g. the mobile keyboard opening
      lastW = W; lastH = H;
      if (scene === 'opening' || scene === 'home' || scene === 'trans') { curTok?.cancel(); layoutHome(); homeFinal(); }
      else if (scene === 'write') { layoutHome(); applyWrite(computeWrite(writeKey)); syncEditor(); }
    }, 150);
  });

  return {
    route,
    destroy() {
      destroyed = true; scene = 'none';
      curTok?.cancel(); fig.stopIdle(); clearTimeout(bubbleTimer); clearTimeout(rT); cancelAnimationFrame(cinRaf);
      listeners.forEach(off => off());
      caretMirror.remove();
      document.documentElement.classList.remove('mob');
    },
  };
}

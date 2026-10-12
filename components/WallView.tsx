'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { PAGE_SIZE } from '@/lib/doors';
import { clamp, ease, myNotes, reduced, store, track, tween, type MyNote } from '@/lib/stage/anim';
import { Figure } from '@/lib/stage/figure';
import { arrowD } from '@/lib/stage/ink';
import { Dots, Ended } from '@/lib/text';

type Note = { no: number; text: string; name: string | null };

const sizeOf = (text: string) => { const n = [...text].length; return n <= 54 ? 'L' : n <= 130 ? 'M' : 'S'; };

function announce(msg: string) {
  const l = document.getElementById('wall-live');
  if (!l) return;
  l.textContent = '';
  setTimeout(() => (l.textContent = msg), 30);
}

export default function WallView({ initial, youNo }: { initial: Note[]; youNo: number | null }) {
  const [notes, setNotes] = useState(initial);
  const [mine, setMine] = useState<MyNote[]>([]);
  const [hasMore, setHasMore] = useState(initial.length >= PAGE_SIZE);
  const [loading, setLoading] = useState(false);
  const [reported, setReported] = useState<Set<number>>(new Set());
  const [open, setOpen] = useState<number | null>(null);

  useEffect(() => setMine(myNotes()), []);

  const you = youNo ? mine.find(n => n.no === youNo) : undefined;
  const isMine = (no: number) => mine.some(m => m.no === no);
  const list = notes.filter(n => n.no !== you?.no);

  async function loadMore() {
    const last = notes[notes.length - 1];
    if (!last) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/notes?before=${last.no}`);
      const data = (await res.json()) as { notes: Note[] };
      setNotes(prev => [...prev, ...data.notes.filter(n => !prev.some(p => p.no === n.no))]);
      setHasMore(data.notes.length >= PAGE_SIZE);
    } finally {
      setLoading(false);
    }
  }

  async function reportNote(no: number) {
    setReported(prev => new Set(prev).add(no));
    announce('Thanks. Someone will read it.');
    track('report');
    await fetch(`/api/notes/${no}/report`, { method: 'POST' }).catch(() => {});
  }

  async function takeDown(no: number) {
    const own = mine.find(m => m.no === no);
    if (!own || !confirm('Take your dot down from the Dot Wall? This can’t be undone.')) return;
    const res = await fetch(`/api/notes/${no}`, {
      method: 'DELETE',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ token: own.token }),
    }).catch(() => null);
    if (!res || (!res.ok && res.status !== 404)) { announce('Something went wrong. Please try again.'); return; }
    const rest = myNotes().filter(m => m.no !== no);
    store.set('dtd.mine', rest);
    setMine(rest);
    setNotes(prev => prev.filter(n => n.no !== no));
    announce('Your dot was taken down.');
    track('take_down');
  }

  const meta = (n: Note) => (
    <div className="meta">
      <span>{n.name ?? ''}</span>
      {isMine(n.no) ? (
        <button onClick={e => { e.stopPropagation(); takeDown(n.no); }}>Take my dot down</button>
      ) : reported.has(n.no) ? (
        <span>Thanks. Someone will read it</span>
      ) : (
        <button data-report="" onClick={e => { e.stopPropagation(); reportNote(n.no); }}>Report</button>
      )}
    </div>
  );

  return (
    <section className="page" aria-labelledby="wallTitle">
      <header className="wall-head">
        <div>
          <h1 id="wallTitle" tabIndex={-1}>The Dot Wall</h1>
          <p className="sub"><Dots>Every red dot here was left by someone.</Dots></p>
        </div>
        <Link className="primary" href="/write"><span className="mini-dot" aria-hidden="true" />Write your next sentence</Link>
      </header>

      <div className="notes">
        {you && <YouNote note={you} meta={meta(you)} />}
        {list.map(n => (
          <article key={n.no} className={`note ${sizeOf(n.text)}${open === n.no ? ' open' : ''}`} onClick={() => setOpen(o => (o === n.no ? null : n.no))}>
            <span className="no">No. {n.no}</span>
            <p className="txt"><Ended text={n.text} /></p>
            {meta(n)}
          </article>
        ))}
      </div>

      {!you && list.length === 0 && (
        <p className="empty"><Dots>The wall is waiting for its first dot.</Dots></p>
      )}
      {hasMore && (
        <div className="more">
          <button className="textbtn" onClick={loadMore} disabled={loading}>{loading ? 'Loading…' : 'Show more'}</button>
        </div>
      )}
      <div id="wall-live" className="sr-only" aria-live="polite" />
    </section>
  );
}

/** Your own sentence, first on the wall, with Cin Ali pointing at it: "This is you". */
function YouNote({ note, meta }: { note: MyNote; meta: React.ReactNode }) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const box = el.querySelector<HTMLElement>('.you-fig')!, h = box.offsetHeight, w = box.offsetWidth;
    const fig = new Figure(el.querySelector<SVGSVGElement>('.cin')!);
    const sz = clamp(h * .6, 70, 112);
    fig.set({ x: sz * .55, y: h - 4, size: sz, pose: 'point', facing: 1 });
    const lbl = el.querySelector<HTMLElement>('.label')!, arrow = el.querySelector<SVGPathElement>('.arrow')!;
    const lr = lbl.offsetLeft + lbl.offsetWidth;
    arrow.setAttribute('d', innerWidth <= 700
      ? arrowD(lr + 8, lbl.offsetTop + 16, lr + 30, h + 14, -.3)
      : arrowD(lr + 6, lbl.offsetTop + 14, w + 14, h * .36, .25));
    el.focus({ preventScroll: true });
    announce('Your sentence is on the Dot Wall.');
    if (reduced()) { lbl.classList.add('on'); arrow.classList.add('on'); return; }
    fig.idle('point', { ms: 2600 });
    tween(600, p => (lbl.style.clipPath = `inset(-30% ${(1 - p) * 100}% -30% -10%)`), null, ease.out)
      .then(() => tween(360, p => (arrow.style.strokeDashoffset = String(1 - p)), null, ease.out))
      .then(() => { lbl.classList.add('on'); arrow.classList.add('on'); });
    return () => fig.stopIdle();
  }, [note.no]);

  return (
    <article ref={ref} className="note you" tabIndex={-1} aria-label="Your sentence">
      <div className="you-fig" aria-hidden="true">
        <svg className="ink"><path className="arrow" pathLength={1} /></svg>
        <div className="label">This is you</div>
        <svg className="cin" />
      </div>
      <div>
        <span className="no">No. {note.no}</span>
        <p className="txt"><Ended text={note.text} /></p>
        {meta}
        {note.status === 'held' && <p className="held"><Dots>Only you can see this until it’s been read.</Dots></p>}
      </div>
    </article>
  );
}

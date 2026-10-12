'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { DOOR_KEYS, DOORS } from '@/lib/doors';
import { createStage } from '@/lib/stage/engine';
import { Dots } from '@/lib/text';

/**
 * The opening, the doors and the writing scene. This component only renders the markup;
 * lib/stage/engine.ts measures it and animates it. Everything here is real, readable HTML,
 * so the page works for screen readers and before the script runs.
 */
export default function Stage() {
  const rootRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<ReturnType<typeof createStage> | null>(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    document.fonts.ready.then(() => {
      if (cancelled || !rootRef.current) return;
      engineRef.current = createStage(rootRef.current, { navigate: url => router.push(url) });
      engineRef.current.route(window.location.pathname);
    });
    return () => { cancelled = true; engineRef.current?.destroy(); engineRef.current = null; };
  }, [router]);

  useEffect(() => { engineRef.current?.route(pathname); }, [pathname]);

  return (
    <div ref={rootRef}>
      <button className="skip" id="skip" hidden>Skip</button>

      <section id="stage" className="stage pending" aria-labelledby="homeTitle">
        <h1 id="homeTitle" className="sr-only">Dot the Door</h1>
        <p className="sr-only home-only">This is you. This is your sentence. And this is Dot, the door.</p>

        <div id="world" className="world" aria-hidden="true">
          <svg id="ink" className="ink">
            <g className="lines" id="gLines" />
            <path className="arrow home-only" id="arrYou" pathLength={1} />
            <path className="arrow home-only" id="arrDot" pathLength={1} />
            <path className="arrow home-only" id="arrDoor" pathLength={1} />
          </svg>
          <div className="ln home-only" id="ln0"><span className="t">This is your</span><i className="probe" /></div>
          <div className="ln home-only" id="ln1"><span className="t">sentence</span><span className="dotslot" /><i className="probe" /></div>
          <span className="bigdot" id="bigdot" />
          <div className="label home-only" id="lblYou">This is you</div>
          <div className="label home-only" id="lblDot">And this is Dot</div>
          <div className="label home-only" id="lblDoor">the door</div>
          <div className="phrase" id="phrase" hidden><span className="ghost" /><span className="inked" /><i className="probe" /></div>
          <svg id="cin" className="cin" />
        </div>

        <aside className="bubble home-only" id="bubble">
          <p><Dots>Life doesn’t rewind. But the next sentence is yours.</Dots></p>
          <svg className="tail" id="tail" viewBox="0 0 24 22" aria-hidden="true">
            <path d="M3 0 C6 9 5 15 0 21 C10 18 17 10 21 0" />
            <path className="cover" d="M4.5 0 L19.5 0" />
          </svg>
        </aside>

        <section className="doors home-only" id="doors" aria-labelledby="doorsQ">
          <h2 className="q" id="doorsQ">Which door feels like yours today?</h2>
          <ul>
            {DOOR_KEYS.map(k => (
              <li key={k}>
                <button className="door" data-door={k}><span className="t"><Dots>{DOORS[k].label}</Dots></span></button>
              </li>
            ))}
          </ul>
        </section>
        <button className="replay home-only" id="replay" hidden>Replay the beginning</button>

        <div className="mini write-only" id="mini">
          <p className="mini-q" id="miniQ">Pick a door, if one fits</p>
          <ul aria-labelledby="miniQ">
            {DOOR_KEYS.map(k => (
              <li key={k}><button className="mini-door" data-door={k}><Dots>{DOORS[k].label}</Dots></button></li>
            ))}
          </ul>
        </div>

        <form className="panel write-only" id="panel" noValidate onSubmit={e => e.preventDefault()}>
          <p className="prompt" id="prompt" tabIndex={-1} />
          <div className="editor" id="editor">
            <div className="mirror" id="mirror" aria-hidden="true" />
            <textarea id="ta" rows={3} maxLength={400} placeholder="Start here" aria-labelledby="prompt" aria-describedby="hint" spellCheck autoComplete="off" />
          </div>
          <div className="dotrow">
            <p className="hint" id="hint"><Dots>When you’re ready, place your dot.</Dots></p>
            <span className="count" id="count" />
            <button type="button" className="dotbtn" id="dotbtn" aria-label="Place your dot" aria-pressed="false" disabled />
          </div>
          <div className="actions" id="actions" hidden>
            <div className="btnrow">
              <button type="button" className="primary" id="addBtn"><span className="mini-dot" aria-hidden="true" />Add to the Dot Wall</button>
              <button type="button" className="textbtn" id="copyBtn">Copy</button>
            </div>
            <p className="public-note"><Dots>Your words will be public. You can leave your name out.</Dots></p>
          </div>
        </form>
      </section>

      <dialog id="pub" aria-labelledby="pubTitle">
        <form id="pubForm" method="dialog">
          <h2 id="pubTitle">This is how it will look</h2>
          <div className="preview" id="pubPreview" />
          <label htmlFor="pubName">Name <span className="opt">(optional)</span></label>
          <input id="pubName" maxLength={40} autoComplete="off" placeholder="Leave it blank to stay anonymous" />
          <input className="hp" id="pubHp" tabIndex={-1} autoComplete="off" aria-hidden="true" />
          <p className="public-note"><Dots>Your words will be public. You can leave your name out.</Dots></p>
          <div id="pubTurnstile" />
          <p className="pub-error" id="pubError" role="alert" />
          <div className="btnrow end">
            <button type="button" className="textbtn" id="pubCancel">Not yet</button>
            <button type="submit" className="primary" id="pubGo"><span className="mini-dot" aria-hidden="true" />Put it on the wall</button>
          </div>
        </form>
        <div className="care" id="pubCare" hidden>
          <h2>Thank you for writing this</h2>
          <p><Dots>We won’t put this one on the wall. But you don’t have to carry it alone.</Dots></p>
          <p>
            <a href="https://findahelpline.com" target="_blank" rel="noopener noreferrer">findahelpline<span className="p">.</span>com</a>{' '}
            <Dots>lists free, confidential support near you, any time.</Dots>
          </p>
          <p><Dots>Your words are still here, only yours.</Dots></p>
          <div className="btnrow end"><button type="button" className="primary" id="careOk">Back to my sentence</button></div>
        </div>
      </dialog>

      <div id="live" className="sr-only" aria-live="polite" />
    </div>
  );
}

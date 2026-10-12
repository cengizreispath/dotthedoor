import { Fragment, type ReactNode } from 'react';

// Every "." on the site is red. These helpers exist in two shapes: HTML strings for the
// imperative stage engine, React nodes for server-rendered pages.

export const esc = (s: string) =>
  s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

export const dotsHTML = (s: string) => esc(s).replace(/\./g, '<span class="p">.</span>');

/** A note always ends with the Dot. If the writer typed a final period, the Dot replaces it. */
export function endedHTML(text: string) {
  const t = text.replace(/\s+$/, '');
  return t.endsWith('.')
    ? dotsHTML(t.slice(0, -1)) + '<span class="enddot" aria-hidden="true"></span><span class="sr-only">.</span>'
    : dotsHTML(t) + '<span class="enddot" aria-hidden="true"></span>';
}

export function Dots({ children }: { children: string }) {
  const parts = children.split('.');
  return (
    <>
      {parts.map((part, i) => (
        <Fragment key={i}>
          {part}
          {i < parts.length - 1 && <span className="p">.</span>}
        </Fragment>
      ))}
    </>
  );
}

export function Ended({ text }: { text: string }): ReactNode {
  const t = text.replace(/\s+$/, '');
  const typedDot = t.endsWith('.');
  return (
    <>
      <Dots>{typedDot ? t.slice(0, -1) : t}</Dots>
      <span className="enddot" aria-hidden="true" />
      {typedDot && <span className="sr-only">.</span>}
    </>
  );
}

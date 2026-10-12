import type { Metadata } from 'next';
import { hasDatabase } from '@/lib/db';
import { listForAdmin, type AdminNote } from '@/lib/notes';
import { isAdmin, logout, moderate } from './actions';
import LoginForm from './LoginForm';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Moderation', robots: { index: false, follow: false } };

const REASONS: Record<string, string> = {
  contact: 'link or contact details',
  language: 'strong language',
  reported: 'reported by visitors',
  unscreened: 'AI check unavailable',
};

function Row({ n }: { n: AdminNote }) {
  const actions: [AdminNote['status'], string][] = [['published', 'Publish'], ['hidden', 'Hide'], ['removed', 'Remove']];
  return (
    <li className="adm-row">
      <div className="adm-meta">
        <b>No. {n.no}</b>
        <span className={`adm-status s-${n.status}`}>{n.status}</span>
        {n.report_count > 0 && <span>{n.report_count} report{n.report_count > 1 ? 's' : ''}</span>}
        {n.reasons.map(r => <span key={r}>{REASONS[r] ?? r}</span>)}
        <time dateTime={n.created_at.toISOString()}>{n.created_at.toISOString().slice(0, 16).replace('T', ' ')}</time>
      </div>
      <p className="adm-text">{n.text}{n.name && <em> — {n.name}</em>}</p>
      <form action={moderate} className="adm-actions">
        <input type="hidden" name="no" value={n.no} />
        {actions.filter(([s]) => s !== n.status).map(([s, label]) => (
          <button key={s} name="status" value={s} className="textbtn">{label}</button>
        ))}
      </form>
    </li>
  );
}

function Section({ title, notes, empty }: { title: string; notes: AdminNote[]; empty: string }) {
  return (
    <section className="adm-section">
      <h2>{title} <span>({notes.length})</span></h2>
      {notes.length ? <ul>{notes.map(n => <Row key={n.no} n={n} />)}</ul> : <p className="adm-empty">{empty}</p>}
    </section>
  );
}

export default async function AdminPage() {
  if (!(await isAdmin())) {
    return (
      <section className="page admin">
        <h1>Moderation</h1>
        <LoginForm />
      </section>
    );
  }
  if (!hasDatabase()) {
    return <section className="page admin"><h1>Moderation</h1><p>DATABASE_URL is not set.</p></section>;
  }
  const { held, reported, recent } = await listForAdmin();
  return (
    <section className="page admin">
      <div className="adm-head">
        <h1>Moderation</h1>
        <form action={logout}><button className="textbtn">Sign out</button></form>
      </div>
      <Section title="Waiting to be read" notes={held} empty="Nothing is waiting." />
      <Section title="Reported" notes={reported} empty="No reports." />
      <Section title="Recently published" notes={recent} empty="The wall is empty." />
    </section>
  );
}

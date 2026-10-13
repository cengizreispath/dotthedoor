import { NextResponse } from 'next/server';
import { db, hasDatabase } from '@/lib/db';

export const dynamic = 'force-dynamic';

// Liveness for Coolify: the app answers 200 as long as it is running, so a database hiccup
// doesn't take the whole site (opening, writing, About) down. The body says how the database is.
export async function GET() {
  if (!hasDatabase()) return NextResponse.json({ ok: true, database: 'not configured' });
  try {
    const sql = await db();
    await sql`select 1`;
    return NextResponse.json({ ok: true, database: 'ok' });
  } catch (err) {
    const code = (err as { code?: string }).code ?? (err as Error).name;
    console.error('[health] database unavailable:', code);
    return NextResponse.json({ ok: true, database: 'error', code });
  }
}

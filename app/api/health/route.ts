import { NextResponse } from 'next/server';
import { db, hasDatabase } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!hasDatabase()) return NextResponse.json({ ok: true, database: 'not configured' });
  try {
    const sql = await db();
    await sql`select 1`;
    return NextResponse.json({ ok: true, database: 'ok' });
  } catch {
    return NextResponse.json({ ok: false, database: 'error' }, { status: 503 });
  }
}

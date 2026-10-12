import { NextResponse } from 'next/server';
import { hasDatabase } from '@/lib/db';
import { report } from '@/lib/notes';
import { ipHash } from '@/lib/security';

export async function POST(req: Request, { params }: { params: Promise<{ no: string }> }) {
  const no = Number((await params).no);
  if (!Number.isInteger(no) || !hasDatabase()) return NextResponse.json({ error: 'bad_request' }, { status: 400 });
  await report(no, ipHash(req.headers));
  return NextResponse.json({ ok: true });
}

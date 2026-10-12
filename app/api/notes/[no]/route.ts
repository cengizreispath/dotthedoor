import { NextResponse } from 'next/server';
import { hasDatabase } from '@/lib/db';
import { removeOwn } from '@/lib/notes';

export async function DELETE(req: Request, { params }: { params: Promise<{ no: string }> }) {
  const no = Number((await params).no);
  const { token } = (await req.json().catch(() => ({}))) as { token?: string };
  if (!Number.isInteger(no) || !token || !hasDatabase()) return NextResponse.json({ error: 'bad_request' }, { status: 400 });
  const removed = await removeOwn(no, token);
  return removed ? NextResponse.json({ ok: true }) : NextResponse.json({ error: 'not_found' }, { status: 404 });
}

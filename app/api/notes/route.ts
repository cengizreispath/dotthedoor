import { NextResponse } from 'next/server';
import { hasDatabase } from '@/lib/db';
import { screen } from '@/lib/moderation';
import { cleanName, cleanText, createNote, listPublished, RATE, recentCount } from '@/lib/notes';
import { clientIp, ipHash, verifyTurnstile } from '@/lib/security';

const MIN_WRITING_MS = 2500; // a person needs a moment to write a sentence; scripts don't wait

export async function GET(req: Request) {
  if (!hasDatabase()) return NextResponse.json({ notes: [] });
  const before = Number(new URL(req.url).searchParams.get('before')) || undefined;
  const notes = await listPublished({ before });
  return NextResponse.json({ notes });
}

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'bad_request' }, { status: 400 });
  }

  // Honeypot: a field people never see. Answer like a success so bots learn nothing.
  if (body.website) return NextResponse.json({ status: 'held', no: null });
  if (Number(body.elapsed) < MIN_WRITING_MS) return NextResponse.json({ error: 'too_fast' }, { status: 400 });

  const { text, ok } = cleanText(body.text);
  if (!ok) return NextResponse.json({ error: 'length' }, { status: 400 });
  const name = cleanName(body.name);

  if (!hasDatabase()) return NextResponse.json({ error: 'unavailable' }, { status: 503 });

  const hash = ipHash(req.headers);
  const recent = await recentCount(hash);
  if (recent.hour >= RATE.perHour || recent.day >= RATE.perDay) {
    return NextResponse.json({ error: 'rate_limited' }, { status: 429 });
  }
  if (!(await verifyTurnstile(typeof body.turnstile === 'string' ? body.turnstile : undefined, clientIp(req.headers)))) {
    return NextResponse.json({ error: 'verification' }, { status: 403 });
  }

  const result = await screen(`${text}${name ? `\n— ${name}` : ''}`);
  // A sentence that signals the writer may be at risk is not stored or published.
  if (result.status === 'care') return NextResponse.json({ care: true });

  const { no, token } = await createNote({ text, name, status: result.status, reasons: result.reasons, ipHash: hash });
  return NextResponse.json({ no, status: result.status, token, text, name });
}

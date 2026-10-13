import { NextResponse } from 'next/server';

// Runtime config for the browser, so keys can change in Coolify without a rebuild.
export const dynamic = 'force-dynamic';

export function GET() {
  return NextResponse.json({ turnstileSiteKey: process.env.TURNSTILE_SITE_KEY || null });
}

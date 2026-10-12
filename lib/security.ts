import 'server-only';
import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

const salt = () => process.env.IP_SALT || 'dotthedoor-dev-salt';

/** The client IP as seen behind Cloudflare and/or Coolify's proxy. Never stored raw. */
export function clientIp(headers: Headers) {
  return (
    headers.get('cf-connecting-ip') ||
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    headers.get('x-real-ip') ||
    'unknown'
  );
}

export const ipHash = (headers: Headers) =>
  createHash('sha256').update(`${salt()}:${clientIp(headers)}`).digest('hex').slice(0, 32);

export const sha256 = (s: string) => createHash('sha256').update(s).digest('hex');

export const newToken = () => randomBytes(24).toString('base64url');

export function safeEqual(a: string, b: string) {
  const x = Buffer.from(a), y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

/** Cloudflare Turnstile. When no secret is configured (local dev), the check is skipped. */
export async function verifyTurnstile(token: string | undefined, ip: string) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true;
  if (!token) return false;
  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: new URLSearchParams({ secret, response: token, remoteip: ip }),
      signal: AbortSignal.timeout(5000),
    });
    const data = (await res.json()) as { success?: boolean };
    return Boolean(data.success);
  } catch {
    return false;
  }
}

// ---- admin session: a signed, expiring cookie value ----

export const ADMIN_COOKIE = 'dtd_admin';
const sessionSecret = () => process.env.SESSION_SECRET || `${process.env.ADMIN_PASSWORD ?? ''}:${salt()}`;

export function signAdminSession(days = 14) {
  const exp = Date.now() + days * 864e5;
  const sig = createHmac('sha256', sessionSecret()).update(`admin:${exp}`).digest('base64url');
  return `${exp}.${sig}`;
}

export function verifyAdminSession(value: string | undefined) {
  if (!value || !process.env.ADMIN_PASSWORD) return false;
  const [exp, sig] = value.split('.');
  if (!exp || !sig || Number(exp) < Date.now()) return false;
  const expected = createHmac('sha256', sessionSecret()).update(`admin:${exp}`).digest('base64url');
  return safeEqual(sig, expected);
}

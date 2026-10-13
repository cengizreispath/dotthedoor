'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { setStatus, type AdminNote } from '@/lib/notes';
import { ADMIN_COOKIE, safeEqual, signAdminSession, verifyAdminSession } from '@/lib/security';

export async function isAdmin() {
  return verifyAdminSession((await cookies()).get(ADMIN_COOKIE)?.value);
}

export async function login(_: string | null, form: FormData): Promise<string | null> {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return 'ADMIN_PASSWORD is not set on the server.';
  await new Promise(r => setTimeout(r, 400)); // blunt brute force
  if (!safeEqual(String(form.get('password') ?? ''), expected)) return 'That’s not it.';
  (await cookies()).set(ADMIN_COOKIE, signAdminSession(), {
    httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', path: '/admin', maxAge: 14 * 86400,
  });
  revalidatePath('/admin');
  return null;
}

export async function logout() {
  (await cookies()).delete({ name: ADMIN_COOKIE, path: '/admin' });
  revalidatePath('/admin');
}

const STATUSES: AdminNote['status'][] = ['published', 'held', 'hidden', 'removed'];

export async function moderate(form: FormData) {
  if (!(await isAdmin())) throw new Error('Not allowed');
  const no = Number(form.get('no')), status = String(form.get('status')) as AdminNote['status'];
  if (!Number.isInteger(no) || !STATUSES.includes(status)) throw new Error('Bad request');
  await setStatus(no, status);
  revalidatePath('/admin');
  revalidatePath('/wall');
}

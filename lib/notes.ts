import 'server-only';
import { db } from './db';
import { NAME_MAX, NOTE_MAX, NOTE_MIN, PAGE_SIZE } from './doors';
import { newToken, sha256 } from './security';

export type PublicNote = { no: number; text: string; name: string | null };
export type AdminNote = PublicNote & {
  status: 'published' | 'held' | 'hidden' | 'removed';
  reasons: string[];
  report_count: number;
  created_at: Date;
};

const REPORTS_TO_HIDE = 3;
export const RATE = { perHour: 5, perDay: 20 };

/** Plain text only: no control characters, no runs of blank lines, NFC-normalised. */
export function cleanText(input: unknown) {
  const s = String(input ?? '')
    .normalize('NFC')
    .replace(/\r\n?/g, '\n')
    .replace(/[\u0000-\u0008\u000B-\u001F\u007F​-‏‪-‮⁦-⁩]/g, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  const length = [...s].length;
  return { text: s, ok: length >= NOTE_MIN && length <= NOTE_MAX };
}

export function cleanName(input: unknown) {
  const s = String(input ?? '').normalize('NFC').replace(/[\u0000-\u001F\u007F​-‏]/g, '').replace(/\s+/g, ' ').trim();
  return [...s].slice(0, NAME_MAX).join('') || null;
}

export async function listPublished({ before, limit = PAGE_SIZE }: { before?: number; limit?: number } = {}) {
  const sql = await db();
  return sql<PublicNote[]>`
    select no::int as no, text, name from notes
    where status = 'published' ${before ? sql`and no < ${before}` : sql``}
    order by no desc limit ${limit}`;
}

export async function recentCount(ipHash: string) {
  const sql = await db();
  const [row] = await sql<{ hour: number; day: number }[]>`
    select count(*) filter (where created_at > now() - interval '1 hour')::int as hour,
           count(*)::int as day
    from notes where ip_hash = ${ipHash} and created_at > now() - interval '1 day'`;
  return row;
}

export async function createNote(input: { text: string; name: string | null; status: 'published' | 'held'; reasons: string[]; ipHash: string }) {
  const sql = await db();
  const token = newToken();
  const [row] = await sql<{ no: number }[]>`
    insert into notes (text, name, status, reasons, ip_hash, delete_token_hash)
    values (${input.text}, ${input.name}, ${input.status}, ${input.reasons}, ${input.ipHash}, ${sha256(token)})
    returning no::int as no`;
  // Housekeeping: IP hashes are only kept long enough for rate limiting and abuse review.
  sql`update notes set ip_hash = null where ip_hash is not null and created_at < now() - interval '30 days'`.catch(() => {});
  return { no: row.no, token };
}

/** The writer takes their own dot down with the token their device kept. */
export async function removeOwn(no: number, token: string) {
  const sql = await db();
  const rows = await sql`
    update notes set status = 'removed', reviewed_at = now()
    where no = ${no} and delete_token_hash = ${sha256(token)} and status <> 'removed'
    returning no`;
  return rows.length > 0;
}

export async function report(no: number, ipHash: string) {
  const sql = await db();
  return sql.begin(async tx => {
    const inserted = await tx`
      insert into reports (note_no, ip_hash) select ${no}, ${ipHash}
      where exists (select 1 from notes where no = ${no} and status = 'published')
      on conflict do nothing returning note_no`;
    if (inserted.length) {
      await tx`
        update notes set report_count = report_count + 1,
          status = case when report_count + 1 >= ${REPORTS_TO_HIDE} then 'hidden' else status end,
          reasons = case when report_count + 1 >= ${REPORTS_TO_HIDE} then array_append(reasons, 'reported') else reasons end
        where no = ${no}`;
    }
    return true;
  });
}

export async function listForAdmin() {
  const sql = await db();
  const cols = sql`no::int as no, text, name, status, reasons, report_count, created_at`;
  const [held, reported, recent] = await Promise.all([
    sql<AdminNote[]>`select ${cols} from notes where status in ('held', 'hidden') order by no desc limit 200`,
    sql<AdminNote[]>`select ${cols} from notes where status = 'published' and report_count > 0 order by report_count desc, no desc limit 100`,
    sql<AdminNote[]>`select ${cols} from notes where status = 'published' order by no desc limit 60`,
  ]);
  return { held, reported, recent };
}

export async function setStatus(no: number, status: AdminNote['status']) {
  const sql = await db();
  await sql`update notes set status = ${status}, reviewed_at = now() where no = ${no}`;
}

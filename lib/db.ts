import 'server-only';
import postgres from 'postgres';

// One small Postgres database holds the Dot Wall. The schema is created on first use,
// so a fresh Coolify database needs no manual migration step.

const SCHEMA = `
create table if not exists notes (
  no                bigint generated always as identity (start with 1000) primary key,
  text              text not null,
  name              text,
  status            text not null default 'published'
                    check (status in ('published', 'held', 'hidden', 'removed')),
  reasons           text[] not null default '{}',
  report_count      int not null default 0,
  ip_hash           text,
  delete_token_hash text not null,
  created_at        timestamptz not null default now(),
  reviewed_at       timestamptz
);
create index if not exists notes_status_no on notes (status, no desc);
create index if not exists notes_ip_created on notes (ip_hash, created_at);

create table if not exists reports (
  note_no    bigint not null references notes (no) on delete cascade,
  ip_hash    text not null,
  created_at timestamptz not null default now(),
  primary key (note_no, ip_hash)
);
`;

type Sql = ReturnType<typeof postgres>;
const g = globalThis as unknown as { __dtdSql?: Sql; __dtdSchema?: Promise<void> };

export function hasDatabase() {
  return Boolean(process.env.DATABASE_URL);
}

function client(): Sql {
  if (!g.__dtdSql) {
    if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not set');
    g.__dtdSql = postgres(process.env.DATABASE_URL, { max: 5, idle_timeout: 30, onnotice: () => {} });
  }
  return g.__dtdSql;
}

/** The ready-to-use client; makes sure the tables exist first. */
export async function db(): Promise<Sql> {
  const sql = client();
  g.__dtdSchema ??= sql.unsafe(SCHEMA).then(() => undefined).catch(err => {
    g.__dtdSchema = undefined;
    throw err;
  });
  await g.__dtdSchema;
  return sql;
}

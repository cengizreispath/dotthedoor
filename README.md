# Dot the Door

Every sentence ends with a dot. dotthedoor.com is a small place to write the one that comes next,
keep it, or leave it on the Dot Wall.

## Stack

- Next.js 16 (App Router), React 19, TypeScript, plain CSS (`app/globals.css`)
- PostgreSQL via [`postgres`](https://github.com/porsager/postgres); tables are created on first use (`lib/db.ts`)
- Optional: Claude moderation classifier (`lib/moderation.ts`), Cloudflare Turnstile
- Docker image (`output: 'standalone'`), deployed on Coolify

## Where things live

| Path | What |
|---|---|
| `app/(stage)/` | `/` and `/write/[door]` share one living stage (`components/Stage.tsx`) |
| `lib/stage/engine.ts` | The opening, doors, writing scene, Cin Ali following the caret, publishing |
| `lib/stage/figure.ts` | Cin Ali, drawn from joint angles |
| `app/wall`, `components/WallView.tsx` | The Dot Wall (server-rendered; your own note is featured client-side) |
| `app/api/notes` | Create / list / report / take down |
| `app/admin` | Moderation panel (password: `ADMIN_PASSWORD`) |
| `prototype/` | The approved HTML prototype, kept for reference; not part of the build |

## Local development

```bash
docker run -d --name dtd-pg -e POSTGRES_USER=dotthedoor -e POSTGRES_PASSWORD=dotthedoor -e POSTGRES_DB=dotthedoor -p 5433:5432 postgres:16-alpine
cp .env.example .env.local   # then edit the values
npm install
npm run dev
```

## Deploying on Coolify

1. **Database:** New resource → PostgreSQL. Copy its internal connection URL. Turn on scheduled backups (e.g. to Cloudflare R2).
2. **App:** New resource → this Git repository, build pack **Dockerfile**, port **3000**, health check path `/api/health`.
3. **Environment variables** (runtime):
   - `DATABASE_URL` – the internal URL from step 1
   - `IP_SALT`, `SESSION_SECRET` – long random strings
   - `ADMIN_PASSWORD` – for `/admin`
   - `ANTHROPIC_API_KEY` – optional, enables the Claude moderation check
   - `TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY` – optional, enables the bot check when publishing
4. **Domain:** point `dotthedoor.com` at the Coolify server (Cloudflare DNS; proxied is fine).

## Moderation in short

Publishing runs local rules first (self-harm signals → a support message, nothing stored; links/contact details or
strong language → held), then the optional Claude check. Held notes wait in `/admin`. Three reports from different
visitors hide a note automatically. Writers can take their own note down from the device they posted it from.
Visitor IPs are never stored; a salted hash is kept for 30 days for rate limiting (5 per hour, 20 per day).

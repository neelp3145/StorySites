# StorySites

Contact/inquiry backend and landing page for StorySites.

- Public form posts to `POST /api/inquiries`
- Admin UI at `/admin` (requires `SECRET_KEY`, `ADMIN_USERNAME`, and `ADMIN_PASSWORD`)
- Postgres via Cursor Apps (`cursor-app.json`) or Supabase `DATABASE_URL`
- Local preview uses in-memory PGlite sample data when `DATABASE_URL` is unset

## Develop

```bash
npm install
npm run dev
```

Open http://127.0.0.1:3847 — landing form, `/admin`, `/health`.

## Python backend (optional self-host)

The original FastAPI + Alembic implementation lives in [`backend/`](backend/) for Supabase self-hosting.

## Netlify frontend ↔ Supabase backend

The marketing site for https://storysite-entry.netlify.app lives in [`site/`](site/). The contact form posts to `/api/inquiries`, which is a Netlify Function that writes to Supabase (`inquiries` table).

See [`site/README.md`](site/README.md) for Supabase SQL, env vars, and deploy steps.

## Deploy on Cursor (optional admin UI)

Publish from the repository root for the Cursor-hosted admin/preview app. That host may require Cursor sign-in, so the public Netlify form should use the Netlify Function + Supabase path above — not the Cursor Apps URL.


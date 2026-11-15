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

## Deploy on Cursor

Publish from the repository root. The platform attaches Postgres when `cursor-app.json` declares a database and runs `npm run build` (includes migrations).

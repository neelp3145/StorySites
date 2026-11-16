# StorySites

StorySites is a marketing and intake product for custom story-driven websites. Visitors explore the service on the public landing page, then submit a contact / quote request describing what they want built, how they prefer hosting, and project details.

This repository holds that public site plus the backend that receives and stores those inquiries.

## What it does

1. **Landing page** — static marketing site (live at [storysite-entry.netlify.app](https://storysite-entry.netlify.app)) with services, pricing context, and a contact form at `#contact`.
2. **Inquiry API** — `POST /api/inquiries` accepts the form payload (name, email, phone, request type, service type, hosting preference, project details, consents).
3. **Database** — submissions are stored in a Supabase Postgres `inquiries` table for follow-up.
4. **Optional admin / self-host paths** — a Next.js admin preview and a FastAPI backend remain in the repo for local or Cursor-hosted use; the production public path is Netlify → Supabase.

## How the pieces fit together

```
Browser (storysite-entry.netlify.app)
        │
        │  POST /api/inquiries  (JSON)
        ▼
Netlify Function  (netlify/functions/inquiries.mjs)
        │
        ▼
Supabase Postgres  (inquiries table)
```

| Path | Role |
| --- | --- |
| [`site/`](site/) | Static Netlify frontend (publish directory) |
| [`netlify/functions/`](netlify/functions/) | Serverless inquiry API |
| [`supabase/migrations/`](supabase/migrations/) | Schema for `inquiries` + RLS insert policy |
| [`src/`](src/) | Optional Next.js app (local admin / Cursor Apps) |
| [`backend/`](backend/) | Optional FastAPI + Alembic self-host stack |

## Production setup (Netlify + Supabase)

1. In Supabase SQL Editor, run [`supabase/migrations/001_create_inquiries.sql`](supabase/migrations/001_create_inquiries.sql).
2. On the Netlify site, set:
   - `SUPABASE_URL` = `https://mvlmryudxtoqimaktayh.supabase.co`
   - `SUPABASE_ANON_KEY` = your project’s anon public key
3. Connect Netlify to this GitHub repo with:
   - **Publish directory:** `site`
   - **Functions directory:** `netlify/functions`
4. Deploy, then submit a test request at `/#contact` and confirm a row in Supabase → Table Editor → `inquiries`.

More detail: [`site/README.md`](site/README.md). Env template: [`.env.netlify.example`](.env.netlify.example).

## Local development (optional Next.js preview)

```bash
npm install
npm run dev
```

Open http://127.0.0.1:3847 for the landing form, `/admin`, and `/health`. Without `DATABASE_URL`, the Next app uses in-memory PGlite sample data.

Admin routes need `SECRET_KEY`, `ADMIN_USERNAME`, and `ADMIN_PASSWORD` in the environment (no hardcoded defaults).

# StorySites

StorySites is a marketing and intake product for custom story-driven websites. Visitors explore the service on the public landing page, then submit a contact / quote request describing what they want built, how they prefer hosting, and project details.

This repository is the **Netlify-hosted** site and inquiry backend. Submissions are stored in **Supabase**.

## What it does

1. **Landing page** — static marketing site (live at [storysite-entry.netlify.app](https://storysite-entry.netlify.app)) with a contact form at `#contact`.
2. **Inquiry API** — Netlify Function at `POST /api/inquiries` accepts the form payload (name, email, phone, request type, service type, hosting preference, project details, consents).
3. **Database** — rows land in a Supabase Postgres `inquiries` table for follow-up.

## Architecture

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
| [`site/`](site/) | Static frontend (Netlify publish directory) |
| [`netlify/functions/`](netlify/functions/) | Serverless inquiry API |
| [`supabase/migrations/`](supabase/migrations/) | `inquiries` schema + public insert RLS policy |
| [`netlify.toml`](netlify.toml) | Publish/functions config and `/api/inquiries` redirect |

## Production setup

1. In Supabase SQL Editor, run [`supabase/migrations/001_create_inquiries.sql`](supabase/migrations/001_create_inquiries.sql).
2. On the Netlify site, set:
   - `SUPABASE_URL` = `https://mvlmryudxtoqimaktayh.supabase.co`
   - `SUPABASE_ANON_KEY` = your project’s anon public key  
   (see [`.env.netlify.example`](.env.netlify.example))
3. Connect Netlify to this GitHub repo with:
   - **Publish directory:** `site`
   - **Functions directory:** `netlify/functions`
4. Deploy, submit a test request at `/#contact`, and confirm a row in Supabase → Table Editor → `inquiries`.

More detail: [`site/README.md`](site/README.md).

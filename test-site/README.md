# StorySites test replica

Mock of [storysite-entry.netlify.app](https://storysite-entry.netlify.app) for exercising `POST /api/inquiries` → Supabase without using the production marketing site.

## Run locally

From the repo root:

1. Copy env values (do not commit secrets):

```bash
cp .env.netlify.example .env
# Set SUPABASE_URL and SUPABASE_ANON_KEY in .env
```

2. Ensure the `inquiries` table exists (run `supabase/migrations/001_create_inquiries.sql` in Supabase SQL Editor).

3. Start Netlify Dev (serves this folder + the inquiry function):

```bash
npm run test:dev
```

Open http://127.0.0.1:8888 — use **Fill test data**, submit the contact form, then check Supabase → Table Editor → `inquiries`.

## Notes

- Production publish directory stays `site/` (see `netlify.toml`).
- This `test-site/` folder is only for local / staging testing.

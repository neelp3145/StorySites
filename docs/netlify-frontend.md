# StorySites Netlify frontend

Static site for https://storysite-entry.netlify.app with the contact form posting to `/api/inquiries` (Netlify Function → Supabase).

## One-time Supabase setup

1. Open your project: https://mvlmryudxtoqimaktayh.supabase.co  
2. SQL Editor → run [`../supabase/migrations/001_create_inquiries.sql`](../supabase/migrations/001_create_inquiries.sql)  
3. Project Settings → API → copy **Project URL** and **anon public** key  

## Netlify env vars

In Site settings → Environment variables (then **redeploy**):

| Name | Value |
| --- | --- |
| `SUPABASE_URL` | `https://mvlmryudxtoqimaktayh.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | your service_role / secret API key |
| `SUPABASE_ANON_KEY` | optional fallback (anon/publishable key) |

Without these, `POST /api/inquiries` returns **503** (“Inquiry service is not configured yet.”).

## Deploy

From the repo root (`site/` is the publish directory — do not put secrets or env docs inside `site/`):

```bash
# Link this GitHub repo to the existing storysite-entry Netlify site, with:
#   Base directory: (repo root)
#   Publish directory: site
#   Functions directory: netlify/functions
# Or:
npx netlify deploy --prod --dir=site --functions=netlify/functions
```

After deploy, submit the contact form on `/#contact`. Rows appear in Supabase → Table Editor → `inquiries`.

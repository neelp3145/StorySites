# StorySites Netlify frontend

Static site for https://storysite-entry.netlify.app with the contact form posting to `/api/inquiries` (Netlify Function → Supabase).

## One-time Supabase setup

1. Open your project: https://mvlmryudxtoqimaktayh.supabase.co  
2. SQL Editor → run [`../supabase/migrations/001_create_inquiries.sql`](../supabase/migrations/001_create_inquiries.sql)  
3. Project Settings → API → copy **Project URL** and **anon public** key  

## Netlify env vars

In Site settings → Environment variables:

| Name | Value |
| --- | --- |
| `SUPABASE_URL` | `https://mvlmryudxtoqimaktayh.supabase.co` |
| `SUPABASE_ANON_KEY` | your anon public key |

## Deploy

From the repo root (this folder is the publish directory):

```bash
# Link this GitHub repo to the existing storysite-entry Netlify site, with:
#   Base directory: (repo root)
#   Publish directory: site
#   Functions directory: netlify/functions
# Or:
npx netlify deploy --prod --dir=site --functions=netlify/functions
```

After deploy, submit the contact form on `/#contact`. Rows appear in Supabase → Table Editor → `inquiries`.

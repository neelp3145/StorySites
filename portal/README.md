# StorySites management portal

Private-staff UI for https://storysites-mgmt-portal.netlify.app.

The **Inquiries** tab loads live rows from the same Supabase database that
https://storysite-entry.netlify.app/#contact writes to, via:

`GET https://storysite-entry.netlify.app/api/admin/inquiries`

Status changes and deletes use that same admin API. Other tabs still use local
demo data until those resources are connected.

## Local run

From the repo root (with `.env` containing `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`):

```bash
npm run portal:dev
```

Open http://127.0.0.1:8890 → **Inquiries**.

Submit a form via `npm run test:dev` or the live entry site so there is data.

## Deploy to storysites-mgmt-portal

On that Netlify site, link `neelp3145/StorySites` (`main`) with:

| Setting | Value |
| --- | --- |
| Publish directory | `portal` |
| Build command | *(leave empty)* or `echo 'portal static'` |
| Functions directory | *(not required)* — API lives on storysite-entry |

No Supabase env vars are needed on the **mgmt** site when it calls the entry API.
Keep `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` on **storysite-entry** only.

After deploy, open https://storysites-mgmt-portal.netlify.app → **Inquiries**.
New contact-form submissions should appear there (refresh if the tab was already open).

Add auth before treating this as production — the admin API currently has no login gate.

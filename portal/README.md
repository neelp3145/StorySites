# StorySites management portal

Private-staff UI for https://storysites-mgmt-portal.netlify.app.

The **Inquiries** and **Customers** tabs load live rows from Supabase via the
storysite-entry admin API:

- `GET /api/admin/inquiries`
- `GET /api/admin/customers` (+ POST / PATCH / DELETE)

Projects, invoices, and hosting still use local demo data until connected.

One-time: run `supabase/migrations/003_create_customers.sql` in the Supabase SQL Editor.

## Local run

From the repo root (with `.env` containing `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`):

```bash
npm run portal:dev
```

Open http://127.0.0.1:8890 → **Inquiries**.

## Deploy to storysites-mgmt-portal (Option A)

On that Netlify site, link `neelp3145/StorySites` (`main`) with:

| Setting | Value |
| --- | --- |
| Branch | `main` |
| **Base directory** | `portal` |
| Publish directory | `.` |
| Build command | *(optional; `portal/netlify.toml` sets a no-op)* |
| Functions directory | *(leave empty)* |

**Important:** Base directory must be `portal`. If it is empty, the root
`netlify.toml` forces `publish = "site"` and you will see the marketing homepage.

No Supabase env vars are needed on the **mgmt** site when it calls the entry API.
Keep `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` on **storysite-entry** only.

After deploy, open https://storysites-mgmt-portal.netlify.app → **Inquiries**.

Add auth before treating this as production — the admin API currently has no login gate.

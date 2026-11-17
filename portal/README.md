# StorySites management portal

Private-staff UI (demo origin: https://storysites-mgmt-portal.netlify.app).

The **Inquiries** tab loads live rows from Supabase via `GET /api/admin/inquiries`. Status changes and deletes call the same admin API. Other tabs still use local demo data until those resources are connected.

## Local run

From the repo root (with `.env` containing `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`):

```bash
# Optional: expand statuses if you have not yet
# Run supabase/migrations/002_expand_inquiry_status.sql in Supabase SQL Editor

npm run portal:dev
```

Open http://127.0.0.1:8890 → **Inquiries**.

Submit a form via `npm run test:dev` (http://127.0.0.1:8888) first so there is data to show.

## Deploy to storysites-mgmt-portal

On that Netlify site:

- Base: this GitHub repo  
- Publish directory: `portal`  
- Functions directory: `netlify/functions`  
- Env: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`

Add auth before treating this as production — the admin API currently has no login gate.

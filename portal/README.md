# StorySites management portal

UI for **https://portal-experiment.netlify.app** (Simple Customer Journey).

This folder is the portal Netlify site. It has **no functions**. All database
traffic goes to **storysite-entry**:

| Portal data | Backend |
| --- | --- |
| New inquiries / customers | `GET/POST/PATCH /api/admin/inquiries` · `/api/admin/customers` |
| Projects / invoices / hosting | `/api/admin/projects` · `/invoices` · `/hosting` |
| Stripe Checkout | `POST /api/create-checkout-session` |

Contact-form posts on the public site already create inquiry + customer (+
project / draft invoice / hosting). This portal loads those rows from Supabase
and maps them into the journey UI.

- **Prospect** customers and open inquiries → **New inquiries**
- **Active** (after you confirm outreach) → **Customers**
- Confirming outreach **PATCHes** customer → Active and inquiry → Contacted
- Offer drafts / uploaded files still save in the browser for now

## Deploy portal-experiment

| Setting | Value |
| --- | --- |
| Repository | this StorySites repo |
| Branch | `main` (or `cursor/portal-experiment-89d3` while testing) |
| **Base directory** | `portal` |
| Publish directory | `.` |
| Functions | leave empty |

## Deploy / env on storysite-entry

Redeploy **storysite-entry** from the same branch so CORS allows
`https://portal-experiment.netlify.app`.

Set:

```
STORYSITES_PORTAL_URL=https://portal-experiment.netlify.app
SUPABASE_URL=…
SUPABASE_SERVICE_ROLE_KEY=…
```

Optional Stripe: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`.

## Local

```bash
# Portal UI calling production entry API (default)
npx --yes serve portal -l 8765

# Or Netlify Dev with local functions:
#   npm run portal:dev
#   open http://127.0.0.1:8890/?api=local
```

# StorySites management portal

Private-staff UI for **https://portal-experiment.netlify.app**
(Simple Customer Journey).

Public contact form submissions on storysite-entry create an **Inquiry** and
also upsert a **Customer**, then create linked **Project**, draft **Invoice**,
and **Hosting** records. This portal loads those records from Supabase via the
storysite-entry admin API and maps them into the customer journey UI.

| Journey data | API |
| --- | --- |
| New inquiries / people | `/api/admin/inquiries` + `/api/admin/customers` |
| Projects | `/api/admin/projects` |
| Payment (invoice) | `/api/admin/invoices` + `/api/create-checkout-session` |
| Hosting / delivery URL | `/api/admin/hosting` |

Staff journey progress (discovery notes, offer drafts, local files) still saves
in the browser and is merged back when you reload from Supabase.

## One-time Supabase setup

Run these in order in the Supabase SQL Editor if you have not already:

1. `supabase/migrations/001_create_inquiries.sql`
2. `supabase/migrations/002_expand_inquiry_status.sql`
3. `supabase/migrations/003_create_customers.sql`
4. `supabase/migrations/004_create_projects_invoices_hosting.sql`
5. `supabase/migrations/005_invoice_stripe_fields.sql` (for Stripe Checkout)

## Local run

```bash
npm run portal:dev
```

Open http://127.0.0.1:8890

## Deploy to portal-experiment

| Setting | Value |
| --- | --- |
| Branch | `main` (or this feature branch while testing) |
| **Base directory** | `portal` |
| Publish directory | `.` |
| Functions | leave empty / unused |

Also redeploy **storysite-entry** so CORS allows
`https://portal-experiment.netlify.app` and admin functions stay live.

On **storysite-entry** Netlify env, set:

```
STORYSITES_PORTAL_URL=https://portal-experiment.netlify.app
```

## Stripe payments

1. On **storysite-entry**, set `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET`.
2. Stripe webhook endpoint: `https://storysite-entry.netlify.app/api/stripe-webhook`  
   Event: `checkout.session.completed`
3. On a customer with a linked invoice, open **Record payment** and use
   **Collect payment via Stripe Checkout** when an invoice id is present.

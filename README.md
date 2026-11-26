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
| [`site/`](site/) | Production marketing frontend (Netlify publish directory) |
| [`test-site/`](test-site/) | Mock replica of the live site for API + Supabase testing |
| [`portal/`](portal/) | Management dashboard — **Inquiries** tab reads live Supabase rows |
| [`netlify/functions/`](netlify/functions/) | Public inquiry API + admin inquiries API |
| [`supabase/migrations/`](supabase/migrations/) | `inquiries` schema + RLS / status migrations |
| [`netlify.toml`](netlify.toml) | Publish/functions config and API redirects |

## Local testing (mock frontend → Supabase)

```bash
cp .env.netlify.example .env   # set SUPABASE_URL + SUPABASE_ANON_KEY
npm install
npm run test:dev
```

Open http://127.0.0.1:8888 — labeled **TEST REPLICA**. Use **Fill test data**, submit `#contact`, then confirm the row in Supabase. Details: [`test-site/README.md`](test-site/README.md).

## Management portal (live Inquiries)

Contact form submissions on storysite-entry create an inquiry and automatically
upsert a customer plus linked project, draft invoice, and hosting records in
Supabase. The management portal reads and writes all of those through
`/api/admin/*` on the entry site.

```bash
# Also run supabase/migrations/002_expand_inquiry_status.sql once in Supabase
npm run portal:dev
```

Open http://127.0.0.1:8890 → **Inquiries**.

Deploy the management UI to https://portal-experiment.netlify.app with
**Base directory = `portal`** (so the root config does not publish the
marketing `site/`). Details: [`portal/README.md`](portal/README.md).

On **storysite-entry**, set `STORYSITES_PORTAL_URL=https://portal-experiment.netlify.app`
so Stripe cancel URLs and CORS point at the live portal.

## Stripe Checkout

Invoices can be paid through [Stripe Checkout](https://docs.stripe.com/payments/checkout).

1. Run `supabase/migrations/005_invoice_stripe_fields.sql`
2. On **storysite-entry** Netlify env, set `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET`
3. In Stripe Dashboard → Developers → Webhooks, add endpoint:
   `https://storysite-entry.netlify.app/api/stripe-webhook`
   for event `checkout.session.completed`
4. In the management portal **Invoices** tab, click **Collect payment**

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

More detail: [`docs/netlify-frontend.md`](docs/netlify-frontend.md).

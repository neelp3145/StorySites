# StorySites management portal

Private-staff UI for https://storysites-mgmt-portal.netlify.app.

Public contact form submissions on storysite-entry create an **Inquiry** and also
upsert a **Customer**, then create linked **Project**, draft **Invoice**, and
**Hosting** records so every portal tab stays in sync.

All operational tabs load from Supabase via the storysite-entry admin API:

| Tab | API |
| --- | --- |
| Inquiries | `/api/admin/inquiries` |
| Customers | `/api/admin/customers` |
| Projects | `/api/admin/projects` |
| Invoices | `/api/admin/invoices` |
| Hosting & Renewals | `/api/admin/hosting` |

## One-time Supabase setup

Run these in order in the Supabase SQL Editor if you have not already:

1. `supabase/migrations/001_create_inquiries.sql`
2. `supabase/migrations/002_expand_inquiry_status.sql`
3. `supabase/migrations/003_create_customers.sql`
4. `supabase/migrations/004_create_projects_invoices_hosting.sql`

## Local run

```bash
npm run portal:dev
```

Open http://127.0.0.1:8890

## Deploy to storysites-mgmt-portal

| Setting | Value |
| --- | --- |
| Branch | `main` |
| **Base directory** | `portal` |
| Publish directory | `.` |
| Functions | empty |

Also redeploy **storysite-entry** so the new admin functions are live (env vars stay on that site).

## Stripe payments

1. Run `supabase/migrations/005_invoice_stripe_fields.sql` in Supabase.
2. On **storysite-entry**, set `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET`.
3. Stripe webhook endpoint: `https://storysite-entry.netlify.app/api/stripe-webhook`  
   Event: `checkout.session.completed`
4. In **Invoices**, click **Collect payment** to open hosted Checkout. Successful payments mark the invoice **Paid**.

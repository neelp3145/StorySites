-- Stripe Checkout tracking on invoices
alter table public.invoices
  add column if not exists stripe_session_id text,
  add column if not exists stripe_payment_intent text,
  add column if not exists paid_at timestamptz;

create index if not exists invoices_stripe_session_idx
  on public.invoices (stripe_session_id);

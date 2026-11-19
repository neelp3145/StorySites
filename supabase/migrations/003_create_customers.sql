-- Run in Supabase SQL Editor (project: mvlmryudxtoqimaktayh)
-- Customer directory for the management portal.

create table if not exists public.customers (
  id bigint generated always as identity primary key,
  full_name text not null,
  email text not null,
  phone text,
  service_type text not null,
  status text not null default 'prospect'
    check (status in ('prospect', 'active', 'completed', 'archived')),
  notes text,
  inquiry_id bigint references public.inquiries(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists customers_email_idx on public.customers (email);
create index if not exists customers_created_at_idx on public.customers (created_at desc);

alter table public.customers enable row level security;

-- No public policies: only the service-role Netlify admin API reads/writes.

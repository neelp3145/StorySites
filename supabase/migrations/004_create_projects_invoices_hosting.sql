-- Run in Supabase SQL Editor after 003_create_customers.sql

create table if not exists public.projects (
  id bigint generated always as identity primary key,
  customer_name text not null,
  service_type text not null,
  status text not null default 'not_started'
    check (status in ('not_started', 'in_development', 'customer_review', 'completed', 'on_hold')),
  due_date date,
  notes text,
  customer_id bigint references public.customers(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists projects_created_at_idx on public.projects (created_at desc);
alter table public.projects enable row level security;

create table if not exists public.invoices (
  id bigint generated always as identity primary key,
  customer_name text not null,
  amount numeric(12,2) not null default 0,
  status text not null default 'draft'
    check (status in ('draft', 'sent', 'unpaid', 'paid', 'overdue', 'cancelled')),
  due_date date,
  notes text,
  customer_id bigint references public.customers(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists invoices_created_at_idx on public.invoices (created_at desc);
alter table public.invoices enable row level security;

create table if not exists public.hosting (
  id bigint generated always as identity primary key,
  customer_name text not null,
  site_url text not null,
  renewal_date date,
  status text not null default 'active'
    check (status in ('active', 'renewal_due', 'expired', 'cancelled')),
  notes text,
  customer_id bigint references public.customers(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists hosting_created_at_idx on public.hosting (created_at desc);
alter table public.hosting enable row level security;

-- No public policies: only service-role Netlify admin APIs read/write.

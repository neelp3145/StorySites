-- Run in Supabase SQL Editor (project: mvlmryudxtoqimaktayh)

create table if not exists public.inquiries (
  id bigint generated always as identity primary key,
  full_name text not null,
  email text not null,
  phone text,
  request_type text not null,
  service_type text not null,
  hosting_preference text,
  project_details text not null,
  contact_consent boolean not null default false,
  terms_acknowledged boolean not null default false,
  terms_version text,
  quote_displayed text,
  status text not null default 'new' check (status in ('new', 'contacted', 'closed')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists inquiries_email_idx on public.inquiries (email);
create index if not exists inquiries_created_at_idx on public.inquiries (created_at desc);

alter table public.inquiries enable row level security;

-- Public marketing form may insert; nobody can read via anon key.
drop policy if exists "Public can submit inquiries" on public.inquiries;
create policy "Public can submit inquiries"
  on public.inquiries
  for insert
  to anon, authenticated
  with check (true);

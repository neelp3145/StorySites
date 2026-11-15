create type inquiry_status as enum ('new', 'contacted', 'closed');

create table if not exists inquiries (
  id serial primary key,
  full_name varchar(200) not null,
  email varchar(320) not null,
  phone varchar(50),
  request_type varchar(120) not null,
  service_type varchar(120) not null,
  hosting_preference varchar(120),
  project_details text not null,
  contact_consent boolean not null default false,
  terms_acknowledged boolean not null default false,
  terms_version varchar(80),
  quote_displayed varchar(255),
  status inquiry_status not null default 'new',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ix_inquiries_email on inquiries (email);
create index if not exists ix_inquiries_created_at on inquiries (created_at desc);

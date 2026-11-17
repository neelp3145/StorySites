-- Expand inquiry statuses to match the management portal stages.
alter table public.inquiries
  drop constraint if exists inquiries_status_check;

alter table public.inquiries
  add constraint inquiries_status_check
  check (status in ('new', 'contacted', 'proposal_sent', 'converted', 'closed'));

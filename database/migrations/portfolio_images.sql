-- Migration: portfolio_images
-- Creates the portfolio_images table in the app_carsena schema
-- This table stores metadata for portfolio images uploaded to Cloudflare R2

create table if not exists app_carsena.portfolio_images (
  id            uuid primary key default gen_random_uuid(),
  storage_path  text not null,
  title         text,
  category      text,
  display_order integer not null default 0,
  created_at    timestamp with time zone default now(),
  updated_at    timestamp with time zone default now()
);

-- Index for fast ordering queries
create index if not exists portfolio_images_display_order_idx
  on app_carsena.portfolio_images (display_order asc);

-- Auto-update updated_at on row changes
create or replace function app_carsena.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists portfolio_images_updated_at on app_carsena.portfolio_images;
create trigger portfolio_images_updated_at
  before update on app_carsena.portfolio_images
  for each row execute procedure app_carsena.set_updated_at();

-- ──────────────────────────────────────────────
-- PERMISSIONS & RLS
-- ──────────────────────────────────────────────

-- Ensure roles have usage on the application schema
grant usage on schema app_carsena to anon, authenticated, service_role;

-- Grant permissions for portfolio_images
grant select on app_carsena.portfolio_images to anon, authenticated, service_role;
grant insert, update, delete on app_carsena.portfolio_images to authenticated, service_role;

-- Enable RLS
alter table app_carsena.portfolio_images enable row level security;

-- Policies
drop policy if exists "Leitura Pública do Portfólio" on app_carsena.portfolio_images;
create policy "Leitura Pública do Portfólio"
  on app_carsena.portfolio_images for select
  to anon, authenticated, service_role
  using (true);

drop policy if exists "Admins podem gerenciar o portfólio" on app_carsena.portfolio_images;
create policy "Admins podem gerenciar o portfólio"
  on app_carsena.portfolio_images for all
  to authenticated
  using (exists (
    select 1 from app_carsena.customers 
    where email = auth.email() and role = 'admin'
  ));

-- Analytics schema and tables
create table if not exists app_carsena.analytics_page_views (
  id uuid primary key default gen_random_uuid(),
  path text not null,
  referrer text,
  user_agent text,
  created_at timestamp with time zone default now()
);

create table if not exists app_carsena.analytics_portfolio_clicks (
  id uuid primary key default gen_random_uuid(),
  image_id uuid references app_carsena.portfolio_images(id) on delete set null,
  category text not null,
  created_at timestamp with time zone default now()
);

-- RLS
alter table app_carsena.analytics_page_views enable row level security;
alter table app_carsena.analytics_portfolio_clicks enable row level security;

-- Page Views Policies
drop policy if exists "Allow anonymous inserts to page_views" on app_carsena.analytics_page_views;
create policy "Allow anonymous inserts to page_views" on app_carsena.analytics_page_views
  for insert with check (true);

drop policy if exists "Allow admin full access to page_views" on app_carsena.analytics_page_views;
create policy "Allow admin full access to page_views" on app_carsena.analytics_page_views
  for all using (auth.role() = 'authenticated');

-- Portfolio Clicks Policies
drop policy if exists "Allow anonymous inserts to portfolio_clicks" on app_carsena.analytics_portfolio_clicks;
create policy "Allow anonymous inserts to portfolio_clicks" on app_carsena.analytics_portfolio_clicks
  for insert with check (true);

drop policy if exists "Allow admin full access to portfolio_clicks" on app_carsena.analytics_portfolio_clicks;
create policy "Allow admin full access to portfolio_clicks" on app_carsena.analytics_portfolio_clicks
  for all using (auth.role() = 'authenticated');

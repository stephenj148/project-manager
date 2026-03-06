-- Run this in your Supabase SQL editor

create table projects (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text,
  status text default 'active' check (status in ('active', 'completed', 'on-hold', 'paused')),
  priority text default 'medium' check (priority in ('high', 'medium', 'low')),
  due_date date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table tasks (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references projects(id) on delete cascade,
  title text not null,
  completed boolean default false,
  due_date date,
  reminder_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table project_updates (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references projects(id) on delete cascade,
  note text,
  status_snapshot text,
  created_at timestamptz default now()
);

create table push_subscriptions (
  id uuid default gen_random_uuid() primary key,
  endpoint text unique not null,
  p256dh text not null,
  auth text not null,
  checkin_frequency text default 'daily' check (checkin_frequency in ('daily', '2days', '3days', 'weekly')),
  checkin_hour int default 9,
  due_alert_days int[] default array[1, 3, 7],
  created_at timestamptz default now()
);

-- Auto-update updated_at
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger projects_updated_at before update on projects
  for each row execute procedure update_updated_at();

create trigger tasks_updated_at before update on tasks
  for each row execute procedure update_updated_at();

-- Allow all access (single-user personal app)
alter table projects enable row level security;
alter table tasks enable row level security;
alter table project_updates enable row level security;
alter table push_subscriptions enable row level security;

create policy "allow all" on projects for all using (true) with check (true);
create policy "allow all" on tasks for all using (true) with check (true);
create policy "allow all" on project_updates for all using (true) with check (true);
create policy "allow all" on push_subscriptions for all using (true) with check (true);

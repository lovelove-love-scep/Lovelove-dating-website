-- Lovelove initial Supabase schema
-- Run in Supabase Dashboard -> SQL Editor -> New query.
-- Review the policies before opening registration to the public.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '' check (char_length(display_name) <= 40),
  age smallint check (age is null or age between 18 and 120),
  city text not null default '' check (char_length(city) <= 100),
  country text not null default '' check (char_length(country) <= 100),
  bio text not null default '' check (char_length(bio) <= 1000),
  avatar_url text,
  interests text[] not null default '{}',
  is_public boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Visitors can read only public profiles.
create policy "Public profiles are visible to everyone"
on public.profiles for select
using (is_public = true);

-- Authenticated users can create their own profile only.
create policy "Users can create their own profile"
on public.profiles for insert to authenticated
with check (auth.uid() = id);

-- Users can edit their own profile only.
create policy "Users can update their own profile"
on public.profiles for update to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

-- Automatically create a profile row after sign-up.
-- display_name is taken from auth metadata and length-limited.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    left(coalesce(new.raw_user_meta_data ->> 'display_name', ''), 40)
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Basic report queue for future moderation tools.
create table if not exists public.reports (
  id bigint generated always as identity primary key,
  reporter_id uuid not null references auth.users(id) on delete cascade,
  reported_profile_id uuid not null references public.profiles(id) on delete cascade,
  reason text not null check (char_length(reason) between 3 and 500),
  created_at timestamptz not null default now(),
  status text not null default 'open' check (status in ('open','reviewing','closed'))
);
alter table public.reports enable row level security;

create policy "Users can submit reports as themselves"
on public.reports for insert to authenticated
with check (auth.uid() = reporter_id);

create policy "Users can view their own reports"
on public.reports for select to authenticated
using (auth.uid() = reporter_id);

-- NOTE: No messaging table is included yet. Private messages require carefully
-- designed conversation membership policies; do not expose message rows publicly.

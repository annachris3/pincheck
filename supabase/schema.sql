-- ============================================================================
-- PinCheck — Supabase Database & Authentication Schema (Free Tier)
-- Run this script in your Supabase Dashboard -> SQL Editor -> New Query
-- ============================================================================

-- 1. Create the `profiles` table storing each user's identity, counters, and full saved passport (`visited_places`)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  username text unique,
  display_name text default 'My Travel Map',
  home_location text default '',
  profile_photo text,
  youtube_url text default '',
  instagram_user text default '',
  tiktok_user text default '',
  custom_link_url text default '',
  custom_link_label text default 'My Link',
  star_level integer default 1,
  star_title text default 'Explorer',
  star_graphic text default '⭐',
  countries_count integer default 0,
  cities_count integer default 0,
  islands_count integer default 0,
  sights_count integer default 0,
  food_count integer default 0,
  cafes_count integer default 0,
  drinks_count integer default 0,
  visited_places jsonb default '[]'::jsonb,
  is_admin boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. Enable Row Level Security (RLS)
alter table public.profiles enable row level security;

-- 3. RLS Policies:
-- Allow anyone to view public passports (for shared profile links and admin overview)
drop policy if exists "Public passports are viewable by everyone" on public.profiles;
create policy "Public passports are viewable by everyone"
  on public.profiles for select
  using (true);

-- Allow authenticated users to insert their own passport
drop policy if exists "Users can insert their own passport" on public.profiles;
create policy "Users can insert their own passport"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Allow authenticated users to update their own passport
drop policy if exists "Users can update their own passport" on public.profiles;
create policy "Users can update their own passport"
  on public.profiles for update
  using (auth.uid() = id);

-- 4. Automatic Trigger: Create a `public.profiles` passport row as soon as a user signs up via Google or Email
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (
    id,
    email,
    display_name,
    profile_photo,
    created_at,
    updated_at
  )
  values (
    new.id,
    new.email,
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      split_part(new.email, '@', 1),
      'Traveler'
    ),
    new.raw_user_meta_data->>'avatar_url',
    now(),
    now()
  )
  on conflict (id) do update
  set email = excluded.email,
      updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 5. Admin Dashboard View: Easy-to-read summary of all registered users & their saved passports
create or replace view public.admin_passports_view as
select
  id as user_id,
  email,
  display_name,
  home_location,
  star_graphic || ' ' || star_title as traveler_rank,
  countries_count as countries,
  cities_count as cities,
  islands_count as islands,
  sights_count as sights,
  food_count as food,
  cafes_count as cafes,
  drinks_count as drinks,
  jsonb_array_length(coalesce(visited_places, '[]'::jsonb)) as country_checkins,
  visited_places as saved_passport_json,
  created_at as registered_at,
  updated_at as last_synced_at
from public.profiles
order by updated_at desc;

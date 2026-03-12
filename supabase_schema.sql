-- ============================================================
-- WaBroadcast — Run this in Supabase → SQL Editor → Run
-- ============================================================

create table if not exists public.profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  email           text,
  full_name       text,
  business_name   text,
  phone           text,
  -- WhatsApp API credentials (stored encrypted in transit)
  wa_phone_id     text,   -- Meta Phone Number ID
  wa_token        text,   -- Meta Access Token (permanent)
  wa_number       text,   -- Display phone number e.g. +91 98765 43210
  wa_verified     boolean default false,
  -- Subscription
  plan            text    default 'free',
  plan_months     int     default 0,
  plan_expires    timestamptz,
  -- Usage tracking
  msg_used        int     default 0,
  msg_limit       int     default 30,
  -- Contacts (saved to cloud — restored on sign in)
  contacts        text    default '[]',
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

create table if not exists public.broadcasts (
  id              uuid default gen_random_uuid() primary key,
  user_id         uuid references public.profiles(id) on delete cascade,
  broadcast_name  text,
  contact_count   int  default 0,
  sent_count      int  default 0,
  failed_count    int  default 0,
  created_at      timestamptz default now()
);

-- Row level security
alter table public.profiles   enable row level security;
alter table public.broadcasts enable row level security;

create policy "users own profile"    on public.profiles   for all using (auth.uid() = id);
create policy "users own broadcasts" on public.broadcasts for all using (auth.uid() = user_id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

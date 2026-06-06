-- ============================================================
-- Crazy Toasty — Setup Supabase complet
-- À exécuter dans : Supabase Dashboard > SQL Editor
-- ============================================================

-- ── 1. TABLE : orders ─────────────────────────────────────────
create table if not exists public.orders (
  id               uuid        default gen_random_uuid() primary key,
  created_at       timestamptz default now() not null,
  customer_name    text        not null,
  customer_phone   text        not null,
  notes            text,
  status           text        not null default 'pending',
  total_cents      integer     not null,
  items            jsonb       not null,
  stripe_session_id text,
  payment_status   text        not null default 'none',
  constraint orders_status_check
    check (status in ('draft','pending','preparing','ready','completed','cancelled')),
  constraint orders_payment_check
    check (payment_status in ('none','pending','paid','failed'))
);

alter table public.orders enable row level security;

create policy "insert_orders_anon" on public.orders
  for insert to anon with check (true);

create policy "select_orders_anon" on public.orders
  for select to anon using (true);

create policy "update_orders_anon" on public.orders
  for update to anon using (true) with check (true);

alter publication supabase_realtime add table public.orders;


-- ── 2. TABLE : user_roles ──────────────────────────────────────
create table if not exists public.user_roles (
  id         uuid    default gen_random_uuid() primary key,
  user_id    uuid    references auth.users(id) on delete cascade not null,
  role       text    not null default 'staff',
  created_at timestamptz default now(),
  constraint user_roles_role_check check (role in ('admin', 'staff')),
  unique (user_id)
);

alter table public.user_roles enable row level security;

create policy "own_role_readable" on public.user_roles
  for select to authenticated using (auth.uid() = user_id);


-- ── 3. TABLE : contacts ───────────────────────────────────────
create table if not exists public.contacts (
  id         uuid    default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  name       text    not null,
  email      text    not null,
  phone      text,
  subject    text    not null,
  message    text    not null,
  status     text    not null default 'unread',
  constraint contacts_status_check check (status in ('unread','read','replied'))
);

alter table public.contacts enable row level security;

create policy "insert_contacts_anon" on public.contacts
  for insert to anon with check (true);

create policy "select_contacts_auth" on public.contacts
  for select to authenticated using (true);

create policy "update_contacts_auth" on public.contacts
  for update to authenticated using (true);


-- ── 4. TABLE : applications ───────────────────────────────────
create table if not exists public.applications (
  id         uuid    default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  name       text    not null,
  email      text    not null,
  phone      text    not null,
  position   text    not null,
  message    text    not null,
  cv_url     text,
  status     text    not null default 'new',
  constraint applications_status_check check (status in ('new','reviewed','contacted','rejected'))
);

alter table public.applications enable row level security;

create policy "insert_applications_anon" on public.applications
  for insert to anon with check (true);

create policy "select_applications_auth" on public.applications
  for select to authenticated using (true);

create policy "update_applications_auth" on public.applications
  for update to authenticated using (true);


-- ── 5. STORAGE : cv-uploads ───────────────────────────────────
-- Bucket pour les CVs (créer depuis Supabase Dashboard → Storage)
-- Puis exécuter ces politiques :

insert into storage.buckets (id, name, public)
  values ('cv-uploads', 'cv-uploads', false)
  on conflict do nothing;

create policy "upload_cv_anon" on storage.objects
  for insert to anon
  with check (bucket_id = 'cv-uploads');

create policy "read_cv_auth" on storage.objects
  for select to authenticated
  using (bucket_id = 'cv-uploads');


-- ── 6. SECRETS Supabase Edge Functions ────────────────────────
-- À configurer dans : Supabase Dashboard → Project Settings → Edge Functions → Secrets
--
-- RESEND_API_KEY      = <your_resend_api_key>
-- STRIPE_SECRET_KEY   = <your_stripe_secret_key>
-- RESTAURANT_EMAIL    = blackpearltoulouse@gmail.com
-- RESEND_FROM_EMAIL   = noreply@crazytoasty.fr

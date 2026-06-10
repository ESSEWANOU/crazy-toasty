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
  customer_email   text,
  stripe_session_id text,
  payment_status   text        not null default 'none',
  constraint orders_status_check
    check (status in ('draft','pending','preparing','ready','completed','cancelled')),
  constraint orders_payment_check
    check (payment_status in ('none','pending','paid','failed'))
);

alter table public.orders enable row level security;

-- Anon (customers): insert + read their own order on confirmation
create policy "insert_orders_anon" on public.orders
  for insert to anon with check (true);

create policy "select_orders_anon" on public.orders
  for select to anon using (true);

-- Authenticated (staff): full read + update on all orders
create policy "select_orders_auth" on public.orders
  for select to authenticated using (true);

create policy "update_orders_auth" on public.orders
  for update to authenticated using (true) with check (true);

create policy "delete_orders_auth" on public.orders
  for delete to authenticated using (true);

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


-- ── 6. TABLE : staff_members ─────────────────────────────────
create table if not exists public.staff_members (
  id            uuid        default gen_random_uuid() primary key,
  created_at    timestamptz default now(),
  first_name    text        not null,
  last_name     text        not null,
  email         text,
  phone         text,
  role          text        not null default 'equipe',
  contract_type text        default 'CDI',
  weekly_hours  integer     default 35,
  hire_date     date,
  is_active     boolean     default true,
  notes         text,
  constraint staff_members_role_check check (role in ('admin', 'manager', 'equipe', 'livreur'))
);

alter table public.staff_members enable row level security;

create policy "select_staff_members_auth" on public.staff_members
  for select to authenticated using (true);

create policy "insert_staff_members_auth" on public.staff_members
  for insert to authenticated with check (true);

create policy "update_staff_members_auth" on public.staff_members
  for update to authenticated using (true) with check (true);

create policy "delete_staff_members_auth" on public.staff_members
  for delete to authenticated using (true);


-- ── 7. TABLE : time_entries ───────────────────────────────────
create table if not exists public.time_entries (
  id         uuid        default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  user_id    uuid        references auth.users(id) on delete cascade not null,
  clock_in   timestamptz not null,
  clock_out  timestamptz,
  notes      text,
  entry_date date        not null default current_date
);

alter table public.time_entries enable row level security;

-- Staff can manage their own entries; admin sees all (add admin policy separately if needed)
create policy "own_time_entries" on public.time_entries
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);


-- ── 8. TABLE : staff_time_entries ─────────────────────────────
-- Tablet clock-in/out for staff members (by PIN, not Supabase auth)
create table if not exists public.staff_time_entries (
  id          uuid        default gen_random_uuid() primary key,
  created_at  timestamptz default now(),
  employee_id uuid        references public.staff_members(id) on delete cascade not null,
  clock_in    timestamptz not null default now(),
  clock_out   timestamptz,
  status      text        default 'active'
);

alter table public.staff_time_entries enable row level security;

-- Any authenticated user (the manager on the tablet) can manage all entries
create policy "authenticated_staff_time_entries" on public.staff_time_entries
  for all to authenticated using (true) with check (true);

-- ── 9. TABLE : employee_pins ───────────────────────────────────
-- PIN codes set by managers for staff to use on the tablet
create table if not exists public.employee_pins (
  id          uuid  default gen_random_uuid() primary key,
  created_at  timestamptz default now(),
  employee_id uuid  references public.staff_members(id) on delete cascade not null unique,
  pin_code    text  not null
);

alter table public.employee_pins enable row level security;

-- Authenticated users can read/write PINs (manager sets them, tablet verifies them)
create policy "authenticated_employee_pins" on public.employee_pins
  for all to authenticated using (true) with check (true);


-- ── 10. TABLE : products ─────────────────────────────────────
create table if not exists public.products (
  id            uuid        default gen_random_uuid() primary key,
  created_at    timestamptz default now(),
  name          text        not null,
  description   text,
  price         numeric(10,2) not null default 0,
  image_url     text,
  category      text        not null,
  is_new        boolean     not null default false,
  is_best_seller boolean    not null default false,
  is_available  boolean     not null default true,
  is_signature  boolean     not null default false,
  is_featured   boolean     not null default false,
  display_order integer     not null default 0,
  calories      integer,
  options       jsonb       not null default '[]'::jsonb
);

alter table public.products enable row level security;

-- Anon (customers): read available products
create policy "select_products_anon" on public.products
  for select to anon using (is_available = true);

-- Authenticated (staff): full access
create policy "select_products_auth" on public.products
  for select to authenticated using (true);

create policy "insert_products_auth" on public.products
  for insert to authenticated with check (true);

create policy "update_products_auth" on public.products
  for update to authenticated using (true) with check (true);

create policy "delete_products_auth" on public.products
  for delete to authenticated using (true);


-- ── 11. SECRETS Supabase Edge Functions ───────────────────────
-- À configurer dans : Supabase Dashboard → Project Settings → Edge Functions → Secrets
--
-- RESEND_API_KEY      = <your_resend_api_key>
-- STRIPE_SECRET_KEY   = <your_stripe_secret_key>
-- RESTAURANT_EMAIL    = <crazy_toasty_email>        ← email that receives order notifications
-- RESEND_FROM_EMAIL   = noreply@crazytoasty.fr      ← must be a verified Resend domain

-- ============================================================================
-- Migration: 00001_schema
-- Descrizione: Crea tutte le tabelle per l'app Back in Shape
-- ============================================================================

-- 1. PROFILES (estende auth.users)
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null,
  name        text not null,
  gender      text not null check (gender in ('uomo', 'donna')),
  role        text not null default 'user' check (role in ('admin', 'user')),
  created_at  timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- 2. LESSONS (istanze di lezione)
create table if not exists public.lessons (
  id        text primary key,
  start     timestamptz not null,
  type      text not null,
  coach     text not null,
  capacity  int not null,
  price     numeric(8,2) not null
);

alter table public.lessons enable row level security;

-- 3. BOOKINGS (prenotazioni utente)
create table if not exists public.bookings (
  id         text primary key,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  lesson_id  text not null references public.lessons(id) on delete cascade,
  status     text not null default 'attiva' check (status in ('attiva', 'cancellata')),
  created_at timestamptz not null default now()
);

alter table public.bookings enable row level security;

-- 4. ATTENDANCE (presenze segnate dall'admin)
create table if not exists public.attendance (
  lesson_id text not null references public.lessons(id) on delete cascade,
  user_id   uuid not null references public.profiles(id) on delete cascade,
  primary key (lesson_id, user_id)
);

alter table public.attendance enable row level security;

-- 5. PRODUCTS (shop)
create table if not exists public.products (
  id          text primary key,
  name        text not null,
  category    text not null check (category in ('scheda', 'alimentazione')),
  price       numeric(8,2) not null,
  duration    text not null,
  description text not null default ''
);

alter table public.products enable row level security;

-- 6. PURCHASES (acquisti shop)
create table if not exists public.purchases (
  id         text primary key,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  product_id text not null references public.products(id) on delete cascade,
  price      numeric(8,2) not null,
  date       timestamptz not null default now()
);

alter table public.purchases enable row level security;

-- 7. PAYMENTS (pagamenti registrati dall'admin)
create table if not exists public.payments (
  id      text primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  amount  numeric(8,2) not null,
  date    timestamptz not null default now(),
  method  text not null default 'Contanti',
  note    text not null default ''
);

alter table public.payments enable row level security;

-- ============================================================================
-- ROW LEVEL SECURITY — regole di accesso
-- ============================================================================

-- PROFILES: ognuno vede il proprio, admin vede tutto
create policy "profiles_select_own_or_admin"
  on public.profiles for select
  using (auth.uid() = id or (select role from public.profiles where id = auth.uid()) = 'admin');

create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "profiles_update_own_or_admin"
  on public.profiles for update
  using (auth.uid() = id or (select role from public.profiles where id = auth.uid()) = 'admin');

-- LESSONS: tutti possono leggere
create policy "lessons_select_all"
  on public.lessons for select
  using (true);

-- BOOKINGS: ognuno vede le proprie, admin vede tutte
create policy "bookings_select_own_or_admin"
  on public.bookings for select
  using (auth.uid() = user_id or (select role from public.profiles where id = auth.uid()) = 'admin');

create policy "bookings_insert_own"
  on public.bookings for insert
  with check (auth.uid() = user_id);

create policy "bookings_update_own_or_admin"
  on public.bookings for update
  using (auth.uid() = user_id or (select role from public.profiles where id = auth.uid()) = 'admin');

-- ATTENDANCE: solo admin
create policy "attendance_admin_all"
  on public.attendance for all
  using ((select role from public.profiles where id = auth.uid()) = 'admin');

-- PRODUCTS: tutti possono leggere
create policy "products_select_all"
  on public.products for select
  using (true);

-- PURCHASES: ognuno vede le proprie, admin vede tutte
create policy "purchases_select_own_or_admin"
  on public.purchases for select
  using (auth.uid() = user_id or (select role from public.profiles where id = auth.uid()) = 'admin');

create policy "purchases_insert_own"
  on public.purchases for insert
  with check (auth.uid() = user_id);

-- PAYMENTS: solo admin inserisce, tutti leggono (per admin)
create policy "payments_select_admin"
  on public.payments for select
  using ((select role from public.profiles where id = auth.uid()) = 'admin');

create policy "payments_insert_admin"
  on public.payments for insert
  with check ((select role from public.profiles where id = auth.uid()) = 'admin');

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Crea profilo automaticamente alla registrazione
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, email, name, gender, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data ->> 'gender', 'donna'),
    coalesce(new.raw_user_meta_data ->> 'role', 'user')
  );
  return new;
end;
$$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================================
-- SEED: prodotti di esempio
-- ============================================================================

insert into public.products (id, name, category, price, duration, description) values
  ('p-scheda-forza', 'Scheda Forza — 8 settimane', 'scheda', 49, '8 settimane', 'Programma di forza progressivo. 3 sedute a settimana con video degli esercizi.'),
  ('p-scheda-dimagrimento', 'Scheda Dimagrimento', 'scheda', 45, '6 settimane', 'Circuiti metabolici e cardio mirato per la perdita di peso.'),
  ('p-scheda-glutei', 'Scheda Glutei & Core', 'scheda', 39, '6 settimane', 'Focus su glutei, addome e postura.'),
  ('p-alim-base', 'Piano Alimentare Base', 'alimentazione', 59, '4 settimane', 'Piano personalizzato con lista della spesa e ricette.'),
  ('p-alim-performance', 'Piano Alimentare Performance', 'alimentazione', 79, '8 settimane', 'Nutrizione sportiva avanzata con revisione bisettimanale.')
on conflict (id) do nothing;

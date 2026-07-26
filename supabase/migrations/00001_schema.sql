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
  capacity  int not null check (capacity > 0),
  price     numeric(8,2) not null check (price >= 0)
);

alter table public.lessons enable row level security;

-- 3. BOOKINGS (prenotazioni utente)
create table if not exists public.bookings (
  id            text primary key,
  user_id       uuid not null references public.profiles(id) on delete cascade,
  lesson_id     text not null references public.lessons(id) on delete cascade,
  status        text not null default 'attiva' check (status in ('attiva', 'cancellata')),
  created_at    timestamptz not null default now(),
  cancelled_at  timestamptz
);

create index if not exists bookings_lesson_status_idx
  on public.bookings (lesson_id, status);
create index if not exists bookings_user_idx
  on public.bookings (user_id);

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
  price       numeric(8,2) not null check (price >= 0),
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

create index if not exists purchases_user_idx on public.purchases (user_id);

alter table public.purchases enable row level security;

-- 7. PAYMENTS (pagamenti registrati dall'admin)
create table if not exists public.payments (
  id      text primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  amount  numeric(8,2) not null check (amount > 0),
  date    timestamptz not null default now(),
  method  text not null default 'Contanti',
  note    text not null default ''
);

create index if not exists payments_user_idx on public.payments (user_id);

alter table public.payments enable row level security;

-- 8. PROGRESS PHOTOS (foto prima/dopo)
create table if not exists public.progress_photos (
  id         text primary key,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  photo_url  text not null,
  type       text not null check (type in ('before', 'after')),
  date       timestamptz not null default now(),
  notes      text not null default ''
);

create index if not exists progress_photos_user_date_idx
  on public.progress_photos (user_id, date desc);

alter table public.progress_photos enable row level security;

-- ============================================================================
-- HELPER: rileva admin senza ricalcolare la subquery per ogni riga
-- ============================================================================
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- ============================================================================
-- ROW LEVEL SECURITY — regole di accesso
-- ============================================================================

-- PROFILES: ognuno vede il proprio, admin vede tutto
create policy "profiles_select_own_or_admin"
  on public.profiles for select
  using (auth.uid() = id or public.is_admin());

create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "profiles_update_own_or_admin"
  on public.profiles for update
  using (auth.uid() = id or public.is_admin());

-- LESSONS: tutti possono leggere
create policy "lessons_select_all"
  on public.lessons for select
  using (true);

-- BOOKINGS: ognuno vede le proprie, admin vede tutte
create policy "bookings_select_own_or_admin"
  on public.bookings for select
  using (auth.uid() = user_id or public.is_admin());

create policy "bookings_insert_own"
  on public.bookings for insert
  with check (auth.uid() = user_id);

create policy "bookings_update_own_or_admin"
  on public.bookings for update
  using (auth.uid() = user_id or public.is_admin());

-- ATTENDANCE: solo admin
create policy "attendance_admin_all"
  on public.attendance for all
  using (public.is_admin());

-- PRODUCTS: tutti possono leggere
create policy "products_select_all"
  on public.products for select
  using (true);

-- PURCHASES: ognuno vede le proprie, admin vede tutte
create policy "purchases_select_own_or_admin"
  on public.purchases for select
  using (auth.uid() = user_id or public.is_admin());

create policy "purchases_insert_own"
  on public.purchases for insert
  with check (auth.uid() = user_id);

-- PAYMENTS: solo admin
create policy "payments_select_admin"
  on public.payments for select
  using (public.is_admin());

create policy "payments_insert_admin"
  on public.payments for insert
  with check (public.is_admin());

-- PROGRESS PHOTOS: ognuno vede le proprie, admin vede tutte
create policy "progress_photos_select_own_or_admin"
  on public.progress_photos for select
  using (auth.uid() = user_id or public.is_admin());

create policy "progress_photos_insert_own"
  on public.progress_photos for insert
  with check (auth.uid() = user_id);

create policy "progress_photos_delete_own_or_admin"
  on public.progress_photos for delete
  using (auth.uid() = user_id or public.is_admin());

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

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================================
-- BOOKING ATOMICO: evita race condition sul capacity
-- ============================================================================
create or replace function public.book_lesson(p_lesson_id text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_capacity int;
  v_taken int;
  v_start timestamptz;
  v_booking_id text;
begin
  -- Lock sulla lezione per serializzare i check
  select capacity, start into v_capacity, v_start
  from public.lessons
  where id = p_lesson_id
  for update;

  if v_capacity is null then
    raise exception 'Lezione non trovata';
  end if;

  if v_start <= now() then
    raise exception 'Lezione già iniziata o terminata';
  end if;

  select count(*) into v_taken
  from public.bookings
  where lesson_id = p_lesson_id and status = 'attiva';

  if v_taken >= v_capacity then
    raise exception 'Lezione al completo';
  end if;

  -- Se esiste già una prenotazione dell'utente, riattivala
  update public.bookings
    set status = 'attiva', created_at = now(), cancelled_at = null
  where lesson_id = p_lesson_id
    and user_id = auth.uid()
  returning id into v_booking_id;

  if v_booking_id is null then
    v_booking_id := 'b-' || encode(gen_random_bytes(6), 'hex');
    insert into public.bookings (id, user_id, lesson_id, status)
    values (v_booking_id, auth.uid(), p_lesson_id, 'attiva');
  end if;

  return v_booking_id;
end;
$$;

-- ============================================================================
-- CANCELLAZIONE ATOMICA: 24h policy + notifica last-minute
-- ============================================================================
create or replace function public.cancel_booking(p_booking_id text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_booking record;
  v_lesson_start timestamptz;
begin
  select b.id, b.user_id, b.lesson_id, b.status, l.start
    into v_booking
  from public.bookings b
  join public.lessons l on l.id = b.lesson_id
  where b.id = p_booking_id;

  if v_booking.id is null then
    raise exception 'Prenotazione non trovata';
  end if;

  if v_booking.user_id <> auth.uid() and not public.is_admin() then
    raise exception 'Non autorizzato';
  end if;

  if v_booking.status = 'cancellata' then
    return; -- idempotente
  end if;

  if v_booking.user_id = auth.uid() and v_lesson_start - now() < interval '24 hours' then
    raise exception 'Non è più possibile cancellare: disdici entro il giorno prima';
  end if;

  update public.bookings
    set status = 'cancellata', cancelled_at = now()
  where id = p_booking_id;
end;
$$;

-- ============================================================================
-- FINANCE: calcolo lato server (affidabile)
-- ============================================================================
create or replace view public.user_finance as
select
  u.id as user_id,
  u.name,
  u.email,
  coalesce((
    select sum(l.price)
    from public.attendance a
    join public.bookings b on b.lesson_id = a.lesson_id and b.user_id = a.user_id and b.status = 'attiva'
    join public.lessons l on l.id = a.lesson_id
    where a.user_id = u.id
  ), 0) as lessons_due,
  coalesce((
    select sum(p.price)
    from public.purchases p
    where p.user_id = u.id
  ), 0) as shop_due,
  coalesce((
    select sum(pa.amount)
    from public.payments pa
    where pa.user_id = u.id
  ), 0) as paid
from public.profiles u;

-- ============================================================================
-- SEED: prodotti di esempio
-- ============================================================================

insert into public.products (id, name, category, price, duration, description) values
  ('p-scheda-forza-uomo', 'Scheda Forza Uomo — 8 settimane', 'scheda', 49, '8 settimane', 'Programma di forza progressivo pensato per l''uomo. 3 sedute a settimana con video degli esercizi.'),
  ('p-scheda-forza-donna', 'Scheda Forza Donna — 8 settimane', 'scheda', 49, '8 settimane', 'Programma di forza progressivo pensato per la donna. 3 sedute a settimana con video degli esercizi.'),
  ('p-scheda-dimagrimento-uomo', 'Scheda Dimagrimento Uomo', 'scheda', 45, '6 settimane', 'Circuiti metabolici e cardio mirato per la perdita di peso — versione uomo.'),
  ('p-scheda-dimagrimento-donna', 'Scheda Dimagrimento Donna', 'scheda', 45, '6 settimane', 'Circuiti metabolici e cardio mirato per la perdita di peso — versione donna.'),
  ('p-scheda-glutei', 'Scheda Glutei & Core', 'scheda', 39, '6 settimane', 'Focus su glutei, addome e postura. Adatto a tutti.'),
  ('p-alim-base-uomo', 'Piano Alimentare Base Uomo', 'alimentazione', 59, '4 settimane', 'Piano personalizzato con lista della spesa e ricette — versione uomo.'),
  ('p-alim-base-donna', 'Piano Alimentare Base Donna', 'alimentazione', 59, '4 settimane', 'Piano personalizzato con lista della spesa e ricette — versione donna.'),
  ('p-alim-performance-uomo', 'Piano Alimentare Performance Uomo', 'alimentazione', 79, '8 settimane', 'Nutrizione sportiva avanzata con revisione bisettimanale — versione uomo.'),
  ('p-alim-performance-donna', 'Piano Alimentare Performance Donna', 'alimentazione', 79, '8 settimane', 'Nutrizione sportiva avanzata con revisione bisettimanale — versione donna.')
on conflict (id) do nothing;

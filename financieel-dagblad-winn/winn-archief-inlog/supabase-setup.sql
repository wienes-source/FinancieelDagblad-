-- =====================================================================
-- FINANCIEEL DAGBLAD WINN — archief met inlog
-- Vaste demo-login + persoonlijke proefmaand van 30 dagen.
-- Plak dit hele bestand in Supabase > SQL Editor en klik op Run.
-- =====================================================================

-- 1. Lezersprofielen
create table if not exists public.profielen (
  id          uuid primary key references auth.users on delete cascade,
  email       text,
  is_demo     boolean not null default false,
  proef_tot   timestamptz not null default (now() + interval '30 days'),
  aangemaakt  timestamptz not null default now()
);
alter table public.profielen enable row level security;
drop policy if exists "eigen profiel lezen" on public.profielen;
create policy "eigen profiel lezen" on public.profielen
  for select to authenticated using (id = auth.uid());

-- Elke nieuwe aanmelding krijgt automatisch 30 dagen proef
create or replace function public.nieuw_profiel()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profielen (id, email) values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end; $$;
drop trigger if exists bij_nieuwe_lezer on auth.users;
create trigger bij_nieuwe_lezer after insert on auth.users
  for each row execute function public.nieuw_profiel();

-- 2. Edities (zelfde velden als data/editions.json)
create table if not exists public.edities (
  datum          date primary key,
  display_date   text,
  nummer         text,
  jaargang       text,
  prijs_eur      text,
  prijs_srd      text,
  wisselkoers    jsonb,
  label          text,
  samenvatting   text,
  artikel_ids    text[] not null default '{}'
);

-- 3. Artikelen (zelfde velden als data/articles.json)
create table if not exists public.artikelen (
  id          text primary key,
  datum       date not null,
  rubriek     text,
  titel       text not null,
  ondertitel  text,
  afbeelding  text,
  inleiding   text,
  tekst       jsonb not null default '[]',
  bron        text,
  bron_url    text
);
create index if not exists artikelen_datum_idx on public.artikelen (datum desc);

-- 4. Hulpfuncties
create or replace function public.laatste_editie()
returns date language sql stable security definer set search_path = public as $$
  select max(datum) from public.edities;
$$;

create or replace function public.heeft_toegang()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profielen
    where id = auth.uid() and (is_demo or proef_tot > now())
  );
$$;

-- 5. Wie mag wat lezen
alter table public.edities   enable row level security;
alter table public.artikelen enable row level security;

-- Het overzicht van edities (datum, nummer, samenvatting) is voor iedereen zichtbaar
drop policy if exists "edities openbaar" on public.edities;
create policy "edities openbaar" on public.edities
  for select to anon, authenticated using (true);

-- Artikelen van de nieuwste editie: gratis voor iedereen
drop policy if exists "laatste editie gratis" on public.artikelen;
create policy "laatste editie gratis" on public.artikelen
  for select to anon, authenticated using (datum = public.laatste_editie());

-- Oudere artikelen: alleen demo-account of lopende proef
drop policy if exists "archief met toegang" on public.artikelen;
create policy "archief met toegang" on public.artikelen
  for select to authenticated using (public.heeft_toegang());

-- Schrijven gebeurt alleen door de GitHub Action met de service_role-sleutel;
-- daarom zijn er bewust geen insert/update/delete-regels voor bezoekers.

-- =====================================================================
-- 6. NA het aanmaken van het demo-account (LEESMIJ stap 3):
--    pas het e-mailadres aan en voer deze ene regel apart uit.
-- =====================================================================
-- update public.profielen set is_demo = true where email = 'demo@financieeldagbladwinn.com';

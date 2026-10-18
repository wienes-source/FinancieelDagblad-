-- =====================================================================
-- FINANCIEEL DAGBLAD WINN — update 2: abonnementen en nieuwsbrief
-- Voer dit uit NA supabase-setup.sql (SQL Editor > plakken > Run).
-- =====================================================================

-- 1. Extra velden per lezer
alter table public.profielen add column if not exists abonnement_tot timestamptz;
alter table public.profielen add column if not exists nieuwsbrief    boolean not null default true;
alter table public.profielen add column if not exists afmeld_token   uuid    not null default gen_random_uuid();

-- 2. Toegang: demo, lopende proef of lopend abonnement
create or replace function public.heeft_toegang()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profielen
    where id = auth.uid()
      and (is_demo or proef_tot > now() or coalesce(abonnement_tot > now(), false))
  );
$$;

-- 3. Abonnementsaanvragen (lezer vraagt aan, jij activeert na betaling)
create table if not exists public.abonnement_aanvragen (
  id           bigint generated always as identity primary key,
  user_id      uuid default auth.uid() references auth.users on delete set null,  -- betaalgegevens blijven 7 jaar bewaard
  email        text,
  pakket       text not null,
  betaalwijze  text not null,
  opmerking    text,
  kenmerk      text not null default upper(substr(md5(random()::text), 1, 6)),
  aangemaakt   timestamptz not null default now(),
  afgehandeld  boolean not null default false
);
alter table public.abonnement_aanvragen enable row level security;
drop policy if exists "eigen aanvraag indienen" on public.abonnement_aanvragen;
create policy "eigen aanvraag indienen" on public.abonnement_aanvragen
  for insert to authenticated with check (user_id = auth.uid() and afgehandeld = false);
drop policy if exists "eigen aanvragen zien" on public.abonnement_aanvragen;
create policy "eigen aanvragen zien" on public.abonnement_aanvragen
  for select to authenticated using (user_id = auth.uid());

-- 4. Afmelden voor de nieuwsbrief via de link in de e-mail (zonder inloggen)
create or replace function public.nieuwsbrief_afmelden(token uuid)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  update public.profielen set nieuwsbrief = false where afmeld_token = token;
  return found;
end; $$;
revoke all on function public.nieuwsbrief_afmelden(uuid) from public;
grant execute on function public.nieuwsbrief_afmelden(uuid) to anon, authenticated;

-- =====================================================================
-- Abonnement activeren na ontvangst van betaling (pas e-mail en periode aan):
-- update public.profielen set abonnement_tot = now() + interval '1 month'
--   where email = 'lezer@voorbeeld.com';
-- update public.abonnement_aanvragen set afgehandeld = true where kenmerk = 'ABC123';
-- =====================================================================

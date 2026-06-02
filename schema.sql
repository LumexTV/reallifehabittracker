-- ============================================================
-- Leben-RPG · Supabase schema (v1)
-- Multiplayer-ready: jede Tabelle hat user_id + RLS.
-- In Supabase SQL Editor oder als Migration ausführen.
-- ============================================================

-- ---------- PROFILES ----------
create table if not exists profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  name        text not null default 'Held',
  level       int  not null default 1,
  xp          int  not null default 0,
  gold        int  not null default 0,
  gems        int  not null default 0,           -- v1 ungenutzt, Platzhalter Premium
  hp          int  not null default 50,
  max_hp      int  not null default 50,
  created_at  timestamptz not null default now()
);

-- ---------- TASKS ----------
create type task_type as enum ('habit','daily','quest');
create type difficulty as enum ('easy','medium','hard');
create type habit_dir as enum ('pos','neg','both');

create table if not exists tasks (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  type        task_type not null,
  title       text not null,
  attr        text not null,                     -- koerper|geist|disziplin|sozial|arbeit
  difficulty  difficulty not null default 'medium',
  dir         habit_dir default 'pos',           -- nur habits
  streak      int  not null default 0,           -- nur dailies
  done        boolean not null default false,    -- nur dailies
  count       int  not null default 0,           -- habit-Zähler
  attr_points int  not null default 0,           -- akkumulierte Attribut-Punkte (am profile aggregiert in v2)
  created_at  timestamptz not null default now()
);
create index on tasks(user_id, type);

-- ---------- EVENTS (append-only log) ----------
create table if not exists events (
  id          bigserial primary key,
  user_id     uuid not null references auth.users(id) on delete cascade,
  type        text not null,                     -- complete_quest|toggle_daily|habit|levelup|award|reset
  xp_delta    int  not null default 0,
  gold_delta  int  not null default 0,
  payload     jsonb default '{}'::jsonb,
  created_at  timestamptz not null default now()
);
create index on events(user_id, created_at desc);

-- ---------- COSMETICS ----------
create type cosmetic_slot as enum ('background','body','bottom','top','hair','accessory');
create type unlock_type   as enum ('shop','achievement','prestige','starter');

create table if not exists cosmetics (
  id          uuid primary key default gen_random_uuid(),
  slot        cosmetic_slot not null,
  name        text not null,
  rarity      text not null default 'common',    -- common|rare|epic|legendary
  layer_z     int  not null,                     -- z-order
  asset_url   text not null,                     -- Supabase Storage path (austauschbar!)
  unlock_type unlock_type not null default 'shop',
  price_gold  int,                               -- null bei achievement/prestige
  price_real  numeric,                           -- v1 ungenutzt, Stripe später
  created_at  timestamptz not null default now()
);

-- ---------- INVENTORY ----------
create table if not exists inventory (
  user_id     uuid not null references auth.users(id) on delete cascade,
  cosmetic_id uuid not null references cosmetics(id) on delete cascade,
  acquired_at timestamptz not null default now(),
  primary key (user_id, cosmetic_id)
);

-- ---------- CHARACTER (equipped) ----------
create table if not exists character (
  user_id     uuid primary key references auth.users(id) on delete cascade,
  background  uuid references cosmetics(id),
  body        uuid references cosmetics(id),
  bottom      uuid references cosmetics(id),
  top         uuid references cosmetics(id),
  hair        uuid references cosmetics(id),
  accessory   uuid references cosmetics(id)
);

-- ---------- ACHIEVEMENTS ----------
create table if not exists achievements (
  id                 uuid primary key default gen_random_uuid(),
  key                text unique not null,        -- z.B. 'mrr_10k'
  title              text not null,
  description        text,
  tier               int  not null default 1,
  condition_type     text not null,               -- mrr|clients|month_revenue|daily_streak|manual
  condition_value    numeric not null default 0,
  reward_gold        int  not null default 0,
  reward_cosmetic_id uuid references cosmetics(id),
  icon               text
);

create table if not exists user_achievements (
  user_id        uuid not null references auth.users(id) on delete cascade,
  achievement_id uuid not null references achievements(id) on delete cascade,
  progress       numeric not null default 0,
  unlocked_at    timestamptz,
  primary key (user_id, achievement_id)
);

-- ---------- BUSINESS METRICS ----------
create type metric_source as enum ('manual','vision','bank');

create table if not exists business_metrics (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  metric      text not null,                      -- mrr|clients|month_revenue
  value       numeric not null,
  period      text,                               -- z.B. '2026-05'
  source      metric_source not null default 'manual',
  recorded_at timestamptz not null default now()
);
create index on business_metrics(user_id, metric, recorded_at desc);

-- ---------- METRIC SUBMISSIONS (Foto-Belege) ----------
create type submission_status as enum ('pending','verified','review','rejected');

create table if not exists metric_submissions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  metric        text not null,
  claimed_value numeric,
  image_url     text not null,                    -- Supabase Storage path
  status        submission_status not null default 'pending',
  vision_result jsonb,                             -- {metric,value,confidence}
  created_at    timestamptz not null default now()
);

-- ============================================================
-- RLS — alles user-scoped (auth.uid())
-- ============================================================
alter table profiles            enable row level security;
alter table tasks               enable row level security;
alter table events              enable row level security;
alter table inventory           enable row level security;
alter table character           enable row level security;
alter table user_achievements   enable row level security;
alter table business_metrics    enable row level security;
alter table metric_submissions  enable row level security;
-- cosmetics + achievements sind global lesbar (Definitionen), aber nicht schreibbar
alter table cosmetics           enable row level security;
alter table achievements        enable row level security;

-- Helper-Makro-Stil: own-row policies
create policy "own_profile"        on profiles           using (id = auth.uid()) with check (id = auth.uid());
create policy "own_tasks"          on tasks              using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own_events"         on events             using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own_inventory"      on inventory          using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own_character"      on character          using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own_user_ach"       on user_achievements  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own_metrics"        on business_metrics   using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own_submissions"    on metric_submissions using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Globale Read-only-Tabellen
create policy "read_cosmetics"     on cosmetics     for select using (true);
create policy "read_achievements"  on achievements  for select using (true);

-- ============================================================
-- Auto-Setup: bei neuem User Profile + Character anlegen
-- ============================================================
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into profiles (id) values (new.id);
  insert into character (user_id) values (new.id);
  return new;
end; $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ============================================================
-- Server-seitige Belohnung (XP/Gold/Level) — vereinfachte Variante.
-- Claude Code: hier Crit/Loot + Level-Up-Schleife ergänzen.
-- ============================================================
create or replace function apply_reward(p_xp int, p_gold int, p_type text, p_payload jsonb default '{}')
returns void language plpgsql security definer as $$
declare
  v_uid uuid := auth.uid();
  v_level int;
  v_xp int;
  v_need int;
begin
  update profiles
     set xp = xp + p_xp, gold = gold + p_gold
   where id = v_uid
  returning level, xp into v_level, v_xp;

  -- Level-Up-Schleife: need = 60 + (level-1)*40
  loop
    v_need := 60 + (v_level - 1) * 40;
    exit when v_xp < v_need;
    v_xp := v_xp - v_need;
    v_level := v_level + 1;
    update profiles set max_hp = max_hp + 6, hp = max_hp + 6 where id = v_uid;
  end loop;

  update profiles set level = v_level, xp = v_xp where id = v_uid;

  insert into events(user_id, type, xp_delta, gold_delta, payload)
  values (v_uid, p_type, p_xp, p_gold, p_payload);
end; $$;

-- ============================================================
-- Achievement-Check (nach neuem business_metric aufrufen)
-- ============================================================
create or replace function check_achievements()
returns void language plpgsql security definer as $$
declare
  v_uid uuid := auth.uid();
  a record;
  v_val numeric;
begin
  for a in select * from achievements loop
    -- schon freigeschaltet?
    if exists (select 1 from user_achievements
               where user_id = v_uid and achievement_id = a.id and unlocked_at is not null) then
      continue;
    end if;

    -- aktuellen Wert ermitteln
    if a.condition_type in ('mrr','clients','month_revenue') then
      select max(value) into v_val from business_metrics
        where user_id = v_uid and metric = a.condition_type;
    else
      v_val := 0; -- daily_streak/manual: Claude Code ergänzen
    end if;

    if coalesce(v_val,0) >= a.condition_value then
      insert into user_achievements(user_id, achievement_id, progress, unlocked_at)
      values (v_uid, a.id, v_val, now())
      on conflict (user_id, achievement_id)
        do update set unlocked_at = now(), progress = excluded.progress;

      -- Reward
      if a.reward_gold > 0 then
        update profiles set gold = gold + a.reward_gold where id = v_uid;
      end if;
      if a.reward_cosmetic_id is not null then
        insert into inventory(user_id, cosmetic_id) values (v_uid, a.reward_cosmetic_id)
        on conflict do nothing;
      end if;

      insert into events(user_id, type, payload)
      values (v_uid, 'award', jsonb_build_object('achievement', a.key));
    end if;
  end loop;
end; $$;

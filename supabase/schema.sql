-- =====================================================================
-- BilimBank database: tables, security rules, credit ledger and workflows
-- Run once in the Supabase SQL editor (or `supabase db push`).
-- Every balance change happens inside SECURITY DEFINER functions below;
-- the browser can never write balances, bookings or ledger rows directly.
-- =====================================================================
create extension if not exists btree_gist;
create extension if not exists pgcrypto;

-- ---------- settings ----------
create table public.platform_settings (
  id boolean primary key default true check (id),
  starter_credits numeric(6,1) not null default 10 check (starter_credits >= 0),
  durations int[] not null default '{30,60,90}',
  weekly_earning_cap numeric(6,1) not null default 8 check (weekly_earning_cap > 0),
  pair_weekly_cap numeric(6,1) not null default 3 check (pair_weekly_cap > 0),
  reciprocal_flag_threshold int not null default 6,
  cancel_deadline_hours int not null default 2 check (cancel_deadline_hours between 0 and 168),
  response_window_hours int not null default 24 check (response_window_hours between 1 and 168),
  reminder_hours int[] not null default '{24,1}',
  noshow_penalty numeric(6,1) not null default 0.5 check (noshow_penalty >= 0),
  noshow_response_hours int not null default 48,
  min_age int not null default 13,
  leaderboard_enabled boolean not null default true,
  announcement text,
  updated_at timestamptz not null default now()
);
insert into public.platform_settings default values;

-- ---------- people ----------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique check (username ~ '^[a-z0-9_]{3,24}$'),
  display_name text not null default '' check (char_length(display_name) <= 60),
  avatar_url text check (avatar_url is null or avatar_url ~ '^https://'),
  bio text check (char_length(bio) <= 600),
  school text check (char_length(school) <= 100),
  education_level text check (char_length(education_level) <= 60),
  show_school boolean not null default false,
  country text check (char_length(country) <= 60),
  timezone text not null default 'Asia/Tashkent',
  preferred_lang text not null default 'en' check (preferred_lang in ('en','uz')),
  languages text[] not null default '{}',
  min_notice_hours int not null default 12 check (min_notice_hours between 0 and 168),
  horizon_days int not null default 21 check (horizon_days between 1 and 90),
  buffer_minutes int not null default 0 check (buffer_minutes between 0 and 60),
  session_durations int[] not null default '{60}',
  show_on_leaderboard boolean not null default true,
  email_prefs jsonb not null default '{"messages":true,"reminders":true,"product":false}',
  role text not null default 'student' check (role in ('student','admin')),
  status text not null default 'active' check (status in ('active','suspended','deleted')),
  is_minor boolean not null default false,
  onboarded boolean not null default false,
  terms_accepted_at timestamptz,
  created_at timestamptz not null default now(),
  last_active_at timestamptz not null default now()
);
create table public.profile_private (
  id uuid primary key references public.profiles(id) on delete cascade,
  birth_date date,
  guardian_email text check (guardian_email is null or guardian_email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$')
);

create or replace function public._check_profile() returns trigger language plpgsql as $$
begin
  if not exists (select 1 from pg_timezone_names where name = new.timezone) then raise exception 'invalid_timezone'; end if;
  if not (new.session_durations <@ array[30,60,90]) or cardinality(new.session_durations) = 0 then raise exception 'invalid_durations'; end if;
  if cardinality(new.languages) > 8 then raise exception 'too_many_languages'; end if;
  return new;
end $$;
create trigger profiles_check before insert or update on public.profiles for each row execute function public._check_profile();

-- ---------- skills ----------
create table public.skill_categories (
  id serial primary key,
  slug text unique not null,
  name_en text not null, name_uz text not null,
  sort int not null default 100,
  active boolean not null default true
);
create table public.skills (
  id serial primary key,
  slug text unique not null check (slug ~ '^[a-z0-9-]{2,60}$'),
  name_en text not null check (char_length(name_en) between 2 and 60),
  name_uz text not null check (char_length(name_uz) between 2 and 60),
  category_id int not null references public.skill_categories(id),
  status text not null default 'active' check (status in ('active','suggested','disabled')),
  suggested_by uuid references public.profiles(id) on delete set null,
  merged_into int references public.skills(id),
  created_at timestamptz not null default now()
);
create table public.user_teaching_skills (
  user_id uuid not null references public.profiles(id) on delete cascade,
  skill_id int not null references public.skills(id),
  level text not null default 'intermediate' check (level in ('beginner','intermediate','advanced','expert')),
  primary key (user_id, skill_id)
);
create table public.user_learning_skills (
  user_id uuid not null references public.profiles(id) on delete cascade,
  skill_id int not null references public.skills(id),
  level text not null default 'beginner' check (level in ('beginner','intermediate','advanced','expert')),
  primary key (user_id, skill_id)
);

-- ---------- availability ----------
create table public.availability_rules (
  id bigserial primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  weekday int check (weekday between 0 and 6),          -- 0 = Monday; null when on_date is set
  on_date date,                                          -- a one-off slot on a specific day
  start_time time not null,
  end_time time not null,
  created_at timestamptz not null default now(),
  check (end_time > start_time),
  check ((weekday is null) <> (on_date is null))
);
create index on public.availability_rules (user_id);
create table public.availability_exceptions (
  id bigserial primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  starts_on date not null,
  ends_on date not null,
  note text check (char_length(note) <= 120),
  check (ends_on >= starts_on)
);
create index on public.availability_exceptions (user_id);

-- ---------- bookings ----------
create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  learner_id uuid not null references public.profiles(id),
  teacher_id uuid not null references public.profiles(id),
  skill_id int not null references public.skills(id),
  start_at timestamptz not null,
  end_at timestamptz not null,
  duration_min int not null check (duration_min in (30,60,90)),
  credits numeric(6,1) not null check (credits > 0),
  status text not null default 'pending' check (status in
    ('pending','confirmed','declined','expired','cancelled','completed','disputed','no_show_learner','no_show_teacher','void')),
  learner_done_at timestamptz,
  teacher_done_at timestamptz,
  respond_by timestamptz not null,
  note text check (char_length(note) <= 500),
  cancelled_by uuid references public.profiles(id),
  cancel_reason text check (char_length(cancel_reason) <= 300),
  rescheduled_from uuid references public.bookings(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (learner_id <> teacher_id),
  check (end_at = start_at + make_interval(mins => duration_min))
);
-- the database itself refuses two live bookings in the same time for one teacher (or one learner)
alter table public.bookings add constraint bookings_no_teacher_overlap
  exclude using gist (teacher_id with =, tstzrange(start_at, end_at) with &&) where (status in ('pending','confirmed'));
alter table public.bookings add constraint bookings_no_learner_overlap
  exclude using gist (learner_id with =, tstzrange(start_at, end_at) with &&) where (status in ('pending','confirmed'));
create index on public.bookings (teacher_id, start_at);
create index on public.bookings (learner_id, start_at);
create index on public.bookings (status);

create table public.booking_private (
  booking_id uuid primary key references public.bookings(id) on delete cascade,
  meet_url text check (meet_url is null or meet_url ~ '^https://meet\.google\.com/[a-z0-9-]+$'),
  meet_source text not null default 'none' check (meet_source in ('none','google','manual')),
  calendar_event_id text,
  meet_error text,
  session_notes text check (char_length(session_notes) <= 2000),
  updated_at timestamptz not null default now()
);

-- ---------- credits ----------
create table public.credit_accounts (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  available numeric(8,1) not null default 0 check (available >= 0),
  held numeric(8,1) not null default 0 check (held >= 0),
  earned numeric(8,1) not null default 0,
  spent numeric(8,1) not null default 0,
  updated_at timestamptz not null default now()
);
create table public.credit_ledger (
  id bigserial primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  booking_id uuid references public.bookings(id),
  type text not null check (type in ('starter_grant','hold','hold_release','hold_capture','teaching_reward','learner_refund','admin_adjustment','no_show_penalty')),
  amount numeric(8,1) not null,          -- change to available credits
  held_change numeric(8,1) not null default 0,
  available_after numeric(8,1) not null,
  held_after numeric(8,1) not null,
  note text,
  created_by uuid,
  created_at timestamptz not null default now()
);
create index on public.credit_ledger (user_id, created_at desc);
-- exactly-once guarantees
create unique index credit_one_starter on public.credit_ledger (user_id) where type = 'starter_grant';
create unique index credit_one_hold on public.credit_ledger (booking_id) where type = 'hold';
create unique index credit_one_settle on public.credit_ledger (booking_id) where type in ('hold_release','hold_capture','learner_refund');
create unique index credit_one_reward on public.credit_ledger (booking_id) where type = 'teaching_reward';
create unique index credit_one_penalty on public.credit_ledger (booking_id) where type = 'no_show_penalty';
create or replace function public._ledger_immutable() returns trigger language plpgsql as $$
begin raise exception 'credit_ledger is append-only'; end $$;
create trigger credit_ledger_no_update before update or delete on public.credit_ledger for each row execute function public._ledger_immutable();

-- ---------- conversations ----------
create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_a uuid not null references public.profiles(id) on delete cascade,
  user_b uuid not null references public.profiles(id) on delete cascade,
  last_message_at timestamptz,
  created_at timestamptz not null default now(),
  check (user_a < user_b),
  unique (user_a, user_b)
);
create table public.messages (
  id bigserial primary key,
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(btrim(body)) between 1 and 1000),
  created_at timestamptz not null default now(),
  read_at timestamptz
);
create index on public.messages (conversation_id, created_at);
create table public.user_blocks (
  blocker_id uuid not null references public.profiles(id) on delete cascade,
  blocked_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

-- ---------- trust ----------
create table public.reviews (
  id bigserial primary key,
  booking_id uuid not null unique references public.bookings(id) on delete cascade,
  reviewer_id uuid not null references public.profiles(id) on delete cascade,
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  preparation int check (preparation between 1 and 5),
  clarity int check (clarity between 1 and 5),
  helpfulness int check (helpfulness between 1 and 5),
  body text check (char_length(body) <= 600),
  hidden boolean not null default false,
  created_at timestamptz not null default now()
);
create index on public.reviews (teacher_id);
create table public.reports (
  id bigserial primary key,
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  target_user_id uuid references public.profiles(id) on delete set null,
  booking_id uuid references public.bookings(id) on delete set null,
  message_id bigint references public.messages(id) on delete set null,
  reason text not null check (reason in ('safety','harassment','spam','no_show','inappropriate','other')),
  details text check (char_length(details) <= 1500),
  status text not null default 'open' check (status in ('open','reviewing','closed')),
  admin_note text,
  created_at timestamptz not null default now()
);
create table public.disputes (
  id bigserial primary key,
  booking_id uuid not null references public.bookings(id) on delete cascade,
  kind text not null check (kind in ('no_show','quality','other')),
  opened_by uuid not null references public.profiles(id),
  accused_id uuid references public.profiles(id),
  reason text not null check (char_length(reason) between 3 and 1500),
  response text check (char_length(response) <= 1500),
  respondent_agrees boolean,
  respond_by timestamptz,
  status text not null default 'awaiting_response' check (status in ('awaiting_response','needs_review','resolved')),
  resolution text,
  resolved_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);
create unique index disputes_one_open on public.disputes (booking_id) where status <> 'resolved';
create table public.abuse_flags (
  id bigserial primary key,
  user_a uuid not null references public.profiles(id) on delete cascade,
  user_b uuid references public.profiles(id) on delete cascade,
  kind text not null,
  details jsonb not null default '{}',
  dedupe_key text unique,
  status text not null default 'open' check (status in ('open','dismissed','actioned')),
  reviewed_by uuid references public.profiles(id),
  review_note text,
  created_at timestamptz not null default now()
);

create or replace function public._report_guard() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from reports where reporter_id = new.reporter_id and created_at > now() - interval '1 day') >= 10 then raise exception 'rate_limited'; end if;
  return new;
end $$;
create trigger reports_guard before insert on public.reports for each row execute function public._report_guard();

-- ---------- notifications and email ----------
create table public.notifications (
  id bigserial primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null,
  booking_id uuid references public.bookings(id) on delete cascade,
  data jsonb not null default '{}',
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index on public.notifications (user_id, created_at desc);
create table public.email_outbox (
  id bigserial primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  template text not null,
  data jsonb not null default '{}',
  dedupe_key text unique not null,
  essential boolean not null default true,
  status text not null default 'queued' check (status in ('queued','sent','failed','skipped')),
  attempts int not null default 0,
  last_error text,
  send_after timestamptz not null default now(),
  created_at timestamptz not null default now(),
  sent_at timestamptz
);
create index on public.email_outbox (status, send_after);
create table public.calendar_integrations (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  provider text not null default 'google',
  google_email text,
  refresh_token text not null,
  scope text,
  status text not null default 'connected' check (status in ('connected','error')),
  last_error text,
  connected_at timestamptz not null default now()
);
create table public.admin_audit_logs (
  id bigserial primary key,
  admin_id uuid references public.profiles(id),
  action text not null,
  target_type text,
  target_id text,
  details jsonb not null default '{}',
  created_at timestamptz not null default now()
);

-- =====================================================================
-- helpers
-- =====================================================================
create or replace function public.settings() returns public.platform_settings
language sql stable security definer set search_path = public as $$ select * from platform_settings where id $$;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin' and status = 'active')
$$;

create or replace function public._me() returns public.profiles
language plpgsql stable security definer set search_path = public as $$
declare p profiles;
begin
  select * into p from profiles where id = auth.uid();
  if p.id is null then raise exception 'not_signed_in'; end if;
  if p.status <> 'active' then raise exception 'account_suspended'; end if;
  return p;
end $$;

create or replace function public._require_admin() returns uuid
language plpgsql stable security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'admin_only'; end if;
  return auth.uid();
end $$;

create or replace function public._audit(p_action text, p_type text, p_id text, p_details jsonb)
returns void language sql security definer set search_path = public as $$
  insert into admin_audit_logs (admin_id, action, target_type, target_id, details) values (auth.uid(), p_action, p_type, p_id, coalesce(p_details, '{}'))
$$;

-- one movement of credits: updates the account and appends to the ledger
create or replace function public._move(p_user uuid, p_booking uuid, p_type text, p_avail numeric, p_held numeric, p_note text default null)
returns void language plpgsql security definer set search_path = public as $$
declare a credit_accounts;
begin
  update credit_accounts set
    available = available + p_avail,
    held = held + p_held,
    earned = earned + case when p_type = 'teaching_reward' then p_avail else 0 end,
    spent = spent + case when p_type = 'hold_capture' then -p_held else 0 end,
    updated_at = now()
  where user_id = p_user returning * into a;
  if a.user_id is null then raise exception 'no_credit_account'; end if;
  insert into credit_ledger (user_id, booking_id, type, amount, held_change, available_after, held_after, note, created_by)
  values (p_user, p_booking, p_type, p_avail, p_held, a.available, a.held, p_note, auth.uid());
exception when check_violation then
  raise exception 'insufficient_credits';
end $$;

create or replace function public._notify(p_user uuid, p_kind text, p_booking uuid, p_data jsonb default '{}')
returns void language sql security definer set search_path = public as $$
  insert into notifications (user_id, kind, booking_id, data) values (p_user, p_kind, p_booking, coalesce(p_data, '{}'))
$$;

create or replace function public._email(p_user uuid, p_template text, p_key text, p_data jsonb default '{}', p_after timestamptz default now(), p_essential boolean default true)
returns void language sql security definer set search_path = public as $$
  insert into email_outbox (user_id, template, data, dedupe_key, send_after, essential)
  values (p_user, p_template, coalesce(p_data, '{}'), p_key, p_after, p_essential)
  on conflict (dedupe_key) do nothing
$$;

create or replace function public._conversation(p_a uuid, p_b uuid) returns uuid
language plpgsql security definer set search_path = public as $$
declare cid uuid; x uuid := least(p_a, p_b); y uuid := greatest(p_a, p_b);
begin
  insert into conversations (user_a, user_b) values (x, y) on conflict (user_a, user_b) do nothing;
  select id into cid from conversations where user_a = x and user_b = y;
  return cid;
end $$;

create or replace function public._blocked(p_a uuid, p_b uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from user_blocks where (blocker_id = p_a and blocked_id = p_b) or (blocker_id = p_b and blocked_id = p_a))
$$;

-- =====================================================================
-- sign-up and onboarding
-- =====================================================================
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare base text; uname text; n int := 0; tz text; lang text;
begin
  base := regexp_replace(lower(split_part(coalesce(new.email, 'student'), '@', 1)), '[^a-z0-9_]', '', 'g');
  if char_length(base) < 3 then base := 'student'; end if;
  base := left(base, 18);
  uname := base;
  while exists (select 1 from profiles where username = uname) loop
    n := n + 1; uname := base || '_' || n::text;
  end loop;
  tz := coalesce(new.raw_user_meta_data->>'timezone', 'Asia/Tashkent');
  if not exists (select 1 from pg_timezone_names where name = tz) then tz := 'Asia/Tashkent'; end if;
  lang := case when new.raw_user_meta_data->>'lang' = 'uz' then 'uz' else 'en' end;
  insert into profiles (id, username, display_name, timezone, preferred_lang, country)
  values (new.id, uname, left(coalesce(nullif(new.raw_user_meta_data->>'full_name', ''), new.raw_user_meta_data->>'name', ''), 60), tz, lang,
          left(new.raw_user_meta_data->>'country', 60));
  insert into profile_private (id) values (new.id);
  insert into credit_accounts (user_id) values (new.id);
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- finishing onboarding checks age, records consent and grants starter credits exactly once
create or replace function public.complete_onboarding(p_birth_date date, p_accept_terms boolean)
returns numeric language plpgsql security definer set search_path = public as $$
declare me profiles := _me(); s platform_settings := settings(); age int;
begin
  if not coalesce(p_accept_terms, false) then raise exception 'terms_required'; end if;
  if p_birth_date is null or p_birth_date > current_date then raise exception 'birth_date_required'; end if;
  age := extract(year from age(current_date, p_birth_date));
  if age < s.min_age then raise exception 'too_young'; end if;
  if age > 120 then raise exception 'birth_date_required'; end if;
  update profile_private set birth_date = p_birth_date where id = me.id;
  if me.display_name = '' then raise exception 'name_required'; end if;
  update profiles set onboarded = true, is_minor = age < 18, terms_accepted_at = coalesce(terms_accepted_at, now()),
    show_school = case when age < 18 then false else show_school end
  where id = me.id;
  if not exists (select 1 from credit_ledger where user_id = me.id and type = 'starter_grant') and s.starter_credits > 0 then
    perform _move(me.id, null, 'starter_grant', s.starter_credits, 0, 'Welcome to BilimBank');
  end if;
  return (select available from credit_accounts where user_id = me.id);
end $$;

create or replace function public.touch() returns void
language sql security definer set search_path = public as $$
  update profiles set last_active_at = now() where id = auth.uid() and last_active_at < now() - interval '30 minutes'
$$;

create or replace function public.suggest_skill(p_name text, p_category int) returns int
language plpgsql security definer set search_path = public as $$
declare me profiles := _me(); sid int; slug text;
begin
  p_name := btrim(p_name);
  if char_length(p_name) not between 2 and 60 then raise exception 'invalid_skill_name'; end if;
  select id into sid from skills where lower(name_en) = lower(p_name) or lower(name_uz) = lower(p_name) limit 1;
  if sid is not null then return sid; end if;
  if (select count(*) from skills where suggested_by = me.id and created_at > now() - interval '1 day') >= 5 then raise exception 'rate_limited'; end if;
  slug := left(trim(both '-' from regexp_replace(lower(p_name), '[^a-z0-9]+', '-', 'g')), 50);
  if char_length(slug) < 2 then slug := 'skill'; end if;
  slug := slug || '-' || substr(md5(random()::text), 1, 4);
  insert into skills (slug, name_en, name_uz, category_id, status, suggested_by)
  values (slug, p_name, p_name, coalesce(p_category, (select id from skill_categories where slug = 'other')), 'suggested', me.id) returning id into sid;
  return sid;
end $$;

-- =====================================================================
-- availability: genuinely open slots
-- =====================================================================
create or replace function public.open_slots(p_teacher uuid, p_from timestamptz, p_to timestamptz, p_duration int default 60)
returns setof timestamptz language sql stable security definer set search_path = public as $$
  with t as (
    select p.* from profiles p
    where p.id = p_teacher and p.status = 'active' and p.onboarded and p_duration = any(p.session_durations)
      and exists (select 1 from platform_settings ps where ps.id and p_duration = any(ps.durations))
  ),
  win as (
    select greatest(p_from, now() + make_interval(hours => t.min_notice_hours)) as lo,
           least(p_to, now() + make_interval(days => t.horizon_days)) as hi, t.timezone as tz, t.buffer_minutes as buf
    from t
  ),
  days as (
    select d::date as d, w.tz, w.lo, w.hi, w.buf
    from win w, generate_series(((w.lo at time zone w.tz)::date - 1)::timestamp, ((w.hi at time zone w.tz)::date + 1)::timestamp, interval '1 day') d
    where w.lo <= w.hi
  ),
  cand as (
    select distinct s as start_at, dd.buf
    from days dd
    join availability_rules r on r.user_id = p_teacher
      and ((r.on_date is null and r.weekday = extract(isodow from dd.d)::int - 1) or r.on_date = dd.d)
    cross join lateral generate_series(
      ((dd.d + r.start_time) at time zone dd.tz),
      ((dd.d + r.end_time) at time zone dd.tz) - make_interval(mins => p_duration),
      interval '30 minutes') s
    where s >= dd.lo and s <= dd.hi
      and not exists (select 1 from availability_exceptions e where e.user_id = p_teacher and dd.d between e.starts_on and e.ends_on)
  )
  select c.start_at from cand c
  where not exists (
    select 1 from bookings b
    where (b.teacher_id = p_teacher or b.learner_id = p_teacher) and b.status in ('pending','confirmed')
      and tstzrange(b.start_at - make_interval(mins => c.buf), b.end_at + make_interval(mins => c.buf))
          && tstzrange(c.start_at, c.start_at + make_interval(mins => p_duration))
  )
  order by 1
$$;

create or replace function public.next_open_slot(p_teacher uuid, p_duration int default 60)
returns timestamptz language sql stable security definer set search_path = public as $$
  select min(x) from open_slots(p_teacher, now(), now() + interval '30 days', p_duration) x
$$;

-- =====================================================================
-- booking workflow
-- =====================================================================
create or replace function public._week_load(p_teacher uuid, p_learner uuid, p_at timestamptz)
returns numeric language sql stable security definer set search_path = public as $$
  select coalesce(sum(credits), 0) from bookings
  where teacher_id = p_teacher and (p_learner is null or learner_id = p_learner)
    and date_trunc('week', start_at at time zone 'UTC') = date_trunc('week', p_at at time zone 'UTC')
    and status in ('pending','confirmed','completed','disputed','no_show_learner')
$$;

create or replace function public._book(p_me uuid, p_teacher uuid, p_skill int, p_start timestamptz, p_duration int, p_note text, p_from uuid)
returns uuid language plpgsql security definer set search_path = public as $$
declare s platform_settings := settings(); cost numeric := round(p_duration / 60.0, 1); bid uuid; t profiles; recent int;
begin
  select * into t from profiles where id = p_teacher;
  if t.id is null or t.status <> 'active' or not t.onboarded then raise exception 'teacher_unavailable'; end if;
  if p_teacher = p_me then raise exception 'cannot_book_yourself'; end if;
  if _blocked(p_me, p_teacher) then raise exception 'blocked'; end if;
  if not exists (select 1 from user_teaching_skills where user_id = p_teacher and skill_id = p_skill) then raise exception 'skill_not_offered'; end if;
  if not exists (select 1 from open_slots(p_teacher, p_start, p_start, p_duration) x where x = p_start) then raise exception 'slot_unavailable'; end if;
  if exists (select 1 from bookings b where (b.teacher_id = p_me or b.learner_id = p_me) and b.status in ('pending','confirmed')
             and tstzrange(b.start_at, b.end_at) && tstzrange(p_start, p_start + make_interval(mins => p_duration))) then raise exception 'you_are_busy'; end if;
  if (select count(*) from bookings where learner_id = p_me and created_at > now() - interval '1 hour') >= 10 then raise exception 'rate_limited'; end if;
  if _week_load(p_teacher, null, p_start) + cost > s.weekly_earning_cap then raise exception 'teacher_weekly_cap'; end if;
  if _week_load(p_teacher, p_me, p_start) + cost > s.pair_weekly_cap then raise exception 'pair_weekly_cap'; end if;
  perform 1 from credit_accounts where user_id = p_me for update;
  begin
    insert into bookings (learner_id, teacher_id, skill_id, start_at, end_at, duration_min, credits, respond_by, note, rescheduled_from)
    values (p_me, p_teacher, p_skill, p_start, p_start + make_interval(mins => p_duration), p_duration, cost,
            least(now() + make_interval(hours => s.response_window_hours), p_start), nullif(btrim(p_note), ''), p_from)
    returning id into bid;
  exception when exclusion_violation then raise exception 'slot_taken';
  end;
  insert into booking_private (booking_id) values (bid);
  perform _move(p_me, bid, 'hold', -cost, cost, null);
  perform _conversation(p_me, p_teacher);
  perform _notify(p_teacher, 'booking_request', bid, '{}');
  perform _email(p_teacher, 'booking_request', 'req:' || bid, '{}');
  -- unusual exchange patterns go to the admin review queue; nobody is penalised automatically
  select count(*) into recent from bookings
   where ((learner_id = p_me and teacher_id = p_teacher) or (learner_id = p_teacher and teacher_id = p_me))
     and created_at > now() - interval '30 days' and status not in ('declined','expired','cancelled');
  if recent >= s.reciprocal_flag_threshold then
    insert into abuse_flags (user_a, user_b, kind, details, dedupe_key)
    values (least(p_me, p_teacher), greatest(p_me, p_teacher), 'repeated_exchange', jsonb_build_object('sessions_30d', recent),
            'pair:' || least(p_me, p_teacher) || ':' || greatest(p_me, p_teacher) || ':' || to_char(now(), 'IYYY-IW'))
    on conflict (dedupe_key) do update set details = excluded.details;
  end if;
  return bid;
end $$;

create or replace function public.book_session(p_teacher uuid, p_skill int, p_start timestamptz, p_duration int, p_note text default null)
returns uuid language plpgsql security definer set search_path = public as $$
declare me profiles := _me();
begin
  if not me.onboarded then raise exception 'finish_onboarding'; end if;
  return _book(me.id, p_teacher, p_skill, p_start, p_duration, p_note, null);
end $$;

create or replace function public.respond_booking(p_booking uuid, p_accept boolean)
returns text language plpgsql security definer set search_path = public as $$
declare me profiles := _me(); b bookings; s platform_settings := settings(); h int;
begin
  select * into b from bookings where id = p_booking for update;
  if b.id is null or b.teacher_id <> me.id then raise exception 'not_found'; end if;
  if b.status <> 'pending' then raise exception 'already_answered'; end if;
  if now() > b.respond_by or now() >= b.start_at then raise exception 'request_expired'; end if;
  if p_accept then
    update bookings set status = 'confirmed', updated_at = now() where id = b.id;
    perform _notify(b.learner_id, 'booking_confirmed', b.id);
    perform _email(b.learner_id, 'booking_confirmed', 'conf:' || b.id || ':l');
    perform _email(b.teacher_id, 'booking_confirmed', 'conf:' || b.id || ':t');
    foreach h in array s.reminder_hours loop
      if b.start_at - make_interval(hours => h) > now() then
        perform _email(b.learner_id, 'reminder', 'rem:' || b.id || ':' || h || ':l', jsonb_build_object('hours', h), b.start_at - make_interval(hours => h));
        perform _email(b.teacher_id, 'reminder', 'rem:' || b.id || ':' || h || ':t', jsonb_build_object('hours', h), b.start_at - make_interval(hours => h));
      end if;
    end loop;
    perform _email(b.learner_id, 'confirm_completion', 'done?:' || b.id || ':l', '{}', b.end_at);
    perform _email(b.teacher_id, 'confirm_completion', 'done?:' || b.id || ':t', '{}', b.end_at);
    return 'confirmed';
  end if;
  update bookings set status = 'declined', updated_at = now() where id = b.id;
  perform _move(b.learner_id, b.id, 'hold_release', b.credits, -b.credits, 'Declined by teacher');
  perform _notify(b.learner_id, 'booking_declined', b.id);
  perform _email(b.learner_id, 'booking_declined', 'decl:' || b.id);
  return 'declined';
end $$;

create or replace function public._cancel(p_me uuid, p_booking uuid, p_reason text, p_notify boolean)
returns void language plpgsql security definer set search_path = public as $$
declare b bookings; s platform_settings := settings(); other uuid;
begin
  select * into b from bookings where id = p_booking for update;
  if b.id is null or p_me not in (b.learner_id, b.teacher_id) then raise exception 'not_found'; end if;
  if b.status not in ('pending','confirmed') then raise exception 'cannot_cancel'; end if;
  if now() >= b.start_at then raise exception 'already_started'; end if;
  if b.status = 'confirmed' and now() > b.start_at - make_interval(hours => s.cancel_deadline_hours) then raise exception 'past_cancel_deadline'; end if;
  update bookings set status = 'cancelled', cancelled_by = p_me, cancel_reason = left(nullif(btrim(p_reason), ''), 300), updated_at = now() where id = b.id;
  perform _move(b.learner_id, b.id, 'hold_release', b.credits, -b.credits, 'Cancelled');
  if p_notify then
    other := case when p_me = b.learner_id then b.teacher_id else b.learner_id end;
    perform _notify(other, 'booking_cancelled', b.id);
    perform _email(other, 'booking_cancelled', 'canc:' || b.id || ':' || other);
    if p_me = b.teacher_id then perform _email(b.learner_id, 'credit_refunded', 'refund:' || b.id); end if;
  end if;
end $$;

create or replace function public.cancel_booking(p_booking uuid, p_reason text default null)
returns void language plpgsql security definer set search_path = public as $$
begin perform _cancel((_me()).id, p_booking, p_reason, true); end $$;

create or replace function public.reschedule_booking(p_booking uuid, p_new_start timestamptz, p_duration int default null)
returns uuid language plpgsql security definer set search_path = public as $$
declare me profiles := _me(); b bookings; nid uuid;
begin
  select * into b from bookings where id = p_booking;
  if b.id is null or b.learner_id <> me.id then raise exception 'not_found'; end if;
  perform _cancel(me.id, b.id, 'Rescheduled', false);
  nid := _book(me.id, b.teacher_id, b.skill_id, p_new_start, coalesce(p_duration, b.duration_min), b.note, b.id);
  perform _notify(b.teacher_id, 'booking_rescheduled', nid, jsonb_build_object('previous', b.id));
  return nid;
end $$;

-- settle a booking in one of the final outcomes; every path is exactly-once thanks to the ledger indexes
create or replace function public._apply_outcome(p_booking uuid, p_outcome text, p_note text)
returns void language plpgsql security definer set search_path = public as $$
declare b bookings; s platform_settings := settings(); pen numeric;
begin
  select * into b from bookings where id = p_booking for update;
  if b.status not in ('confirmed','disputed') then raise exception 'cannot_settle'; end if;
  if p_outcome in ('completed','no_show_learner') then
    perform _move(b.learner_id, b.id, 'hold_capture', 0, -b.credits, p_note);
    perform _move(b.teacher_id, b.id, 'teaching_reward', b.credits, 0, p_note);
    perform _notify(b.teacher_id, 'credit_earned', b.id, jsonb_build_object('credits', b.credits));
    perform _email(b.teacher_id, 'credit_earned', 'earn:' || b.id);
  elsif p_outcome = 'no_show_teacher' then
    perform _move(b.learner_id, b.id, 'learner_refund', b.credits, -b.credits, p_note);
    select least(s.noshow_penalty, available) into pen from credit_accounts where user_id = b.teacher_id;
    if pen > 0 then perform _move(b.teacher_id, b.id, 'no_show_penalty', -pen, 0, p_note); end if;
    perform _notify(b.learner_id, 'credit_refunded', b.id);
    perform _email(b.learner_id, 'credit_refunded', 'refund:' || b.id);
  elsif p_outcome = 'void' then
    perform _move(b.learner_id, b.id, 'hold_release', b.credits, -b.credits, p_note);
    perform _notify(b.learner_id, 'credit_refunded', b.id);
    perform _email(b.learner_id, 'credit_refunded', 'refund:' || b.id);
  else
    raise exception 'invalid_outcome';
  end if;
  update bookings set status = p_outcome, updated_at = now() where id = b.id;
end $$;

create or replace function public.confirm_completion(p_booking uuid)
returns text language plpgsql security definer set search_path = public as $$
declare me profiles := _me(); b bookings;
begin
  select * into b from bookings where id = p_booking for update;
  if b.id is null or me.id not in (b.learner_id, b.teacher_id) then raise exception 'not_found'; end if;
  if b.status <> 'confirmed' then raise exception 'not_confirmable'; end if;
  if now() < b.start_at then raise exception 'not_started'; end if;
  if me.id = b.learner_id then
    if b.learner_done_at is not null then raise exception 'already_confirmed'; end if;
    update bookings set learner_done_at = now(), updated_at = now() where id = b.id returning * into b;
  else
    if b.teacher_done_at is not null then raise exception 'already_confirmed'; end if;
    update bookings set teacher_done_at = now(), updated_at = now() where id = b.id returning * into b;
  end if;
  if b.learner_done_at is not null and b.teacher_done_at is not null then
    perform _apply_outcome(b.id, 'completed', 'Both confirmed');
    perform _email(b.learner_id, 'review_request', 'rev:' || b.id);
    return 'completed';
  end if;
  perform _notify(case when me.id = b.learner_id then b.teacher_id else b.learner_id end, 'confirm_requested', b.id);
  return 'waiting';
end $$;

-- attendance: either person may report the other did not come; the other side gets time to answer
create or replace function public.report_no_show(p_booking uuid, p_reason text)
returns bigint language plpgsql security definer set search_path = public as $$
declare me profiles := _me(); b bookings; s platform_settings := settings(); did bigint; other uuid;
begin
  select * into b from bookings where id = p_booking for update;
  if b.id is null or me.id not in (b.learner_id, b.teacher_id) then raise exception 'not_found'; end if;
  if b.status <> 'confirmed' then raise exception 'not_reportable'; end if;
  if now() < b.start_at + interval '10 minutes' then raise exception 'too_early'; end if;
  other := case when me.id = b.learner_id then b.teacher_id else b.learner_id end;
  insert into disputes (booking_id, kind, opened_by, accused_id, reason, respond_by)
  values (b.id, 'no_show', me.id, other, coalesce(nullif(btrim(p_reason), ''), 'Did not attend'), now() + make_interval(hours => s.noshow_response_hours))
  returning id into did;
  update bookings set status = 'disputed', updated_at = now() where id = b.id;
  perform _notify(other, 'no_show_reported', b.id, jsonb_build_object('dispute', did));
  perform _email(other, 'no_show_reported', 'ns:' || did);
  return did;
end $$;

create or replace function public.open_dispute(p_booking uuid, p_kind text, p_reason text)
returns bigint language plpgsql security definer set search_path = public as $$
declare me profiles := _me(); b bookings; did bigint; other uuid;
begin
  select * into b from bookings where id = p_booking for update;
  if b.id is null or me.id not in (b.learner_id, b.teacher_id) then raise exception 'not_found'; end if;
  if not (b.status = 'confirmed' and now() >= b.start_at) and not (b.status = 'completed' and b.updated_at > now() - interval '7 days') then raise exception 'not_disputable'; end if;
  if p_kind not in ('quality','other') then raise exception 'invalid_kind'; end if;
  other := case when me.id = b.learner_id then b.teacher_id else b.learner_id end;
  insert into disputes (booking_id, kind, opened_by, accused_id, reason, status) values (b.id, p_kind, me.id, other, p_reason, 'needs_review') returning id into did;
  if b.status = 'confirmed' then update bookings set status = 'disputed', updated_at = now() where id = b.id; end if;
  return did;
end $$;

create or replace function public.respond_dispute(p_dispute bigint, p_agree boolean, p_text text default null)
returns text language plpgsql security definer set search_path = public as $$
declare me profiles := _me(); d disputes; b bookings;
begin
  select * into d from disputes where id = p_dispute for update;
  if d.id is null or d.accused_id <> me.id then raise exception 'not_found'; end if;
  if d.status <> 'awaiting_response' then raise exception 'already_answered'; end if;
  select * into b from bookings where id = d.booking_id;
  update disputes set response = left(p_text, 1500), respondent_agrees = p_agree,
    status = case when p_agree then 'resolved' else 'needs_review' end,
    resolution = case when p_agree then 'Accepted by the other participant' end,
    resolved_at = case when p_agree then now() end
  where id = d.id;
  if p_agree and d.kind = 'no_show' then
    perform _apply_outcome(b.id, case when d.accused_id = b.learner_id then 'no_show_learner' else 'no_show_teacher' end, 'No-show accepted');
    return 'resolved';
  end if;
  perform _notify(d.opened_by, 'dispute_review', b.id);
  return 'needs_review';
end $$;

create or replace function public.submit_review(p_booking uuid, p_rating int, p_preparation int default null, p_clarity int default null, p_helpfulness int default null, p_body text default null)
returns void language plpgsql security definer set search_path = public as $$
declare me profiles := _me(); b bookings;
begin
  select * into b from bookings where id = p_booking;
  if b.id is null or b.learner_id <> me.id then raise exception 'not_found'; end if;
  if b.status <> 'completed' then raise exception 'not_completed'; end if;
  begin
    insert into reviews (booking_id, reviewer_id, teacher_id, rating, preparation, clarity, helpfulness, body)
    values (b.id, me.id, b.teacher_id, p_rating, p_preparation, p_clarity, p_helpfulness, nullif(btrim(p_body), ''));
  exception when unique_violation then raise exception 'already_reviewed';
  end;
end $$;

create or replace function public.set_meet_link(p_booking uuid, p_url text)
returns void language plpgsql security definer set search_path = public as $$
declare me profiles := _me(); b bookings;
begin
  select * into b from bookings where id = p_booking;
  if b.id is null or b.teacher_id <> me.id then raise exception 'not_found'; end if;
  if b.status not in ('confirmed') then raise exception 'not_confirmed'; end if;
  if p_url !~ '^https://meet\.google\.com/[a-z0-9-]+$' then raise exception 'invalid_meet_link'; end if;
  update booking_private set meet_url = p_url, meet_source = 'manual', meet_error = null, updated_at = now() where booking_id = b.id;
  perform _notify(b.learner_id, 'meet_ready', b.id);
end $$;

create or replace function public.save_session_notes(p_booking uuid, p_notes text)
returns void language plpgsql security definer set search_path = public as $$
declare me profiles := _me();
begin
  update booking_private bp set session_notes = left(p_notes, 2000), updated_at = now()
  from bookings b where b.id = bp.booking_id and b.id = p_booking and me.id in (b.learner_id, b.teacher_id);
  if not found then raise exception 'not_found'; end if;
end $$;

-- housekeeping, safe to run often: expire unanswered requests, move silent no-show claims to admin review
create or replace function public.sweep() returns int
language plpgsql security definer set search_path = public as $$
declare b record; n int := 0;
begin
  for b in select id, learner_id, credits from bookings where status = 'pending' and (now() > respond_by or now() >= start_at) for update skip locked loop
    update bookings set status = 'expired', updated_at = now() where id = b.id;
    perform _move(b.learner_id, b.id, 'hold_release', b.credits, -b.credits, 'Request expired');
    perform _notify(b.learner_id, 'booking_expired', b.id);
    perform _email(b.learner_id, 'booking_expired', 'exp:' || b.id);
    n := n + 1;
  end loop;
  update disputes set status = 'needs_review' where status = 'awaiting_response' and respond_by < now();
  return n;
end $$;

-- =====================================================================
-- messaging
-- =====================================================================
create or replace function public._message_guard() returns trigger
language plpgsql security definer set search_path = public as $$
declare c conversations; other uuid; minor boolean; prefs jsonb;
begin
  select * into c from conversations where id = new.conversation_id;
  if new.sender_id <> auth.uid() or new.sender_id not in (c.user_a, c.user_b) then raise exception 'not_allowed'; end if;
  other := case when new.sender_id = c.user_a then c.user_b else c.user_a end;
  if _blocked(new.sender_id, other) then raise exception 'blocked'; end if;
  if (select status from profiles where id = new.sender_id) <> 'active' then raise exception 'account_suspended'; end if;
  if (select count(*) from messages where sender_id = new.sender_id and created_at > now() - interval '1 minute') >= 15 then raise exception 'rate_limited'; end if;
  select bool_or(is_minor) into minor from profiles where id in (c.user_a, c.user_b);
  if minor and (new.body ~* '[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}' or new.body ~ '(\+?\d[\d\s()-]{7,}\d)') then raise exception 'contact_details_blocked'; end if;
  new.created_at := now(); new.read_at := null;
  update conversations set last_message_at = now() where id = c.id;
  select email_prefs into prefs from profiles where id = other;
  perform _notify(other, 'new_message', null, jsonb_build_object('conversation', c.id));
  if coalesce((prefs->>'messages')::boolean, true) then
    perform _email(other, 'new_message', 'msg:' || c.id || ':' || other || ':' || (extract(epoch from now())::bigint / 1800), jsonb_build_object('conversation', c.id), now() + interval '5 minutes', false);
  end if;
  return new;
end $$;
create trigger messages_guard before insert on public.messages for each row execute function public._message_guard();

create or replace function public.mark_conversation_read(p_conversation uuid)
returns void language sql security definer set search_path = public as $$
  update messages m set read_at = now() from conversations c
  where m.conversation_id = c.id and c.id = p_conversation and auth.uid() in (c.user_a, c.user_b) and m.sender_id <> auth.uid() and m.read_at is null
$$;
create or replace function public.mark_notifications_read() returns void
language sql security definer set search_path = public as $$
  update notifications set read_at = now() where user_id = auth.uid() and read_at is null
$$;

-- =====================================================================
-- public read models (no private data leaves through these)
-- =====================================================================
create or replace view public.public_profiles with (security_barrier) as
  select p.id, p.username, p.display_name, p.avatar_url, p.bio,
         case when p.show_school and not p.is_minor then p.school end as school,
         p.education_level, p.country, p.timezone, p.languages, p.session_durations,
         p.created_at,
         (select round(avg(r.rating)::numeric, 2) from reviews r where r.teacher_id = p.id and not r.hidden) as rating,
         (select count(*) from reviews r where r.teacher_id = p.id and not r.hidden)::int as review_count,
         (select count(*) from bookings b where (b.teacher_id = p.id or b.learner_id = p.id) and b.status = 'completed')::int as completed_sessions,
         (select coalesce(sum(b.duration_min), 0) / 60.0 from bookings b where b.teacher_id = p.id and b.status = 'completed')::numeric(8,1) as hours_taught,
         (select coalesce(sum(b.duration_min), 0) / 60.0 from bookings b where b.learner_id = p.id and b.status = 'completed')::numeric(8,1) as hours_learned
  from profiles p where p.status = 'active' and p.onboarded;

create or replace function public.public_stats() returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'active_users', (select count(*) from profiles where status = 'active' and onboarded and last_active_at > now() - interval '30 days'),
    'members', (select count(*) from profiles where status = 'active' and onboarded),
    'completed_hours', (select coalesce(sum(duration_min), 0) / 60.0 from bookings where status = 'completed'),
    'completed_sessions', (select count(*) from bookings where status = 'completed'),
    'avg_rating', (select case when count(*) >= 5 then round(avg(rating)::numeric, 2) end from reviews where not hidden),
    'rating_count', (select count(*) from reviews where not hidden),
    'popular_skills', coalesce((select jsonb_agg(x) from (
        select s.slug, s.name_en, s.name_uz, count(*)::int as teachers from user_teaching_skills u join skills s on s.id = u.skill_id
        join profiles p on p.id = u.user_id where s.status = 'active' and p.status = 'active' and p.onboarded
        group by s.id order by count(*) desc, s.name_en limit 8) x), '[]'),
    'recent', coalesce((select jsonb_agg(x) from (
        select s.name_en, s.name_uz, b.duration_min, b.end_at from bookings b join skills s on s.id = b.skill_id
        where b.status = 'completed' order by b.updated_at desc limit 5) x), '[]')
  )
$$;

create or replace function public.leaderboard(p_limit int default 20)
returns table (username text, display_name text, avatar_url text, earned numeric, sessions int, rating numeric)
language sql stable security definer set search_path = public as $$
  select p.username, p.display_name, p.avatar_url, sum(l.amount)::numeric(8,1),
         count(distinct l.booking_id)::int,
         (select round(avg(r.rating)::numeric, 2) from reviews r where r.teacher_id = p.id and not r.hidden)
  from credit_ledger l join profiles p on p.id = l.user_id
  where l.type = 'teaching_reward' and p.status = 'active' and p.show_on_leaderboard
    and (select leaderboard_enabled from platform_settings where id)
  group by p.id order by 4 desc, 5 desc limit least(greatest(p_limit, 1), 100)
$$;

-- marketplace search: only mentors with a genuinely open slot that matches the filters
create or replace function public.search_mentors(
  p_query text default null, p_category text default null, p_language text default null, p_level text default null,
  p_min_rating numeric default null, p_duration int default 60, p_days int default 7, p_date date default null,
  p_from_hour int default null, p_to_hour int default null, p_tz text default 'UTC', p_limit int default 40)
returns table (user_id uuid, username text, display_name text, avatar_url text, bio text, languages text[], durations int[],
               rating numeric, review_count int, skill_id int, skill_slug text, skill_en text, skill_uz text, level text, next_slot timestamptz)
language plpgsql stable security definer set search_path = public as $$
declare tz text := case when exists (select 1 from pg_timezone_names where name = p_tz) then p_tz else 'UTC' end;
  lo timestamptz; hi timestamptz;
begin
  if p_date is not null then
    lo := (p_date::timestamp at time zone tz); hi := ((p_date + 1)::timestamp at time zone tz);
  else
    lo := now(); hi := now() + make_interval(days => least(greatest(coalesce(p_days, 7), 1), 30));
  end if;
  return query
  with m as (
    select distinct on (pp.id) pp.id, pp.username, pp.display_name, pp.avatar_url, pp.bio, pp.languages, pp.session_durations,
           pp.rating, pp.review_count, s.id as sid, s.slug, s.name_en, s.name_uz, u.level
    from public_profiles pp
    join user_teaching_skills u on u.user_id = pp.id
    join skills s on s.id = u.skill_id and s.status = 'active'
    join skill_categories c on c.id = s.category_id
    where (auth.uid() is null or pp.id <> auth.uid())
      and (p_query is null or p_query = '' or s.name_en ilike '%' || p_query || '%' or s.name_uz ilike '%' || p_query || '%' or pp.display_name ilike '%' || p_query || '%')
      and (p_category is null or p_category = '' or c.slug = p_category)
      and (p_language is null or p_language = '' or p_language = any(pp.languages))
      and (p_level is null or p_level = '' or u.level = p_level)
      and (p_min_rating is null or coalesce(pp.rating, 0) >= p_min_rating)
      and coalesce(p_duration, 60) = any(pp.session_durations)
    order by pp.id, (p_query is not null and (s.name_en ilike '%' || p_query || '%' or s.name_uz ilike '%' || p_query || '%')) desc, u.level desc
  )
  select m.id, m.username, m.display_name, m.avatar_url, m.bio, m.languages, m.session_durations, m.rating, m.review_count,
         m.sid, m.slug, m.name_en, m.name_uz, m.level, x.slot
  from m cross join lateral (
    select min(z) as slot from open_slots(m.id, lo, hi, coalesce(p_duration, 60)) z
    where (p_from_hour is null or extract(hour from z at time zone tz) >= p_from_hour)
      and (p_to_hour is null or extract(hour from z at time zone tz) < p_to_hour)
  ) x
  where x.slot is not null
  order by m.rating desc nulls last, x.slot
  limit least(greatest(p_limit, 1), 100);
end $$;

-- transparent, rule-based matching (not AI)
create or replace function public.best_matches(p_limit int default 6)
returns table (user_id uuid, username text, display_name text, avatar_url text, rating numeric, review_count int,
               they_teach_you_want jsonb, they_want_you_teach jsonb, overlap_hours int, shared_languages text[], past_sessions int, score numeric, next_slot timestamptz)
language sql stable security definer set search_path = public as $$
  with me as (select * from profiles where id = auth.uid()),
  cand as (
    select pp.*,
      coalesce((select jsonb_agg(jsonb_build_object('en', s.name_en, 'uz', s.name_uz)) from user_teaching_skills t join skills s on s.id = t.skill_id
                where t.user_id = pp.id and t.skill_id in (select skill_id from user_learning_skills where user_id = auth.uid())), '[]') as a,
      coalesce((select jsonb_agg(jsonb_build_object('en', s.name_en, 'uz', s.name_uz)) from user_learning_skills l join skills s on s.id = l.skill_id
                where l.user_id = pp.id and l.skill_id in (select skill_id from user_teaching_skills where user_id = auth.uid())), '[]') as b
    from public_profiles pp where pp.id <> auth.uid() and not _blocked(auth.uid(), pp.id)
  ),
  scored as (
    select c.*,
      (select count(*)::int from availability_rules r1 join availability_rules r2 on r1.weekday = r2.weekday
         and r1.start_time < r2.end_time and r2.start_time < r1.end_time
       where r1.user_id = auth.uid() and r2.user_id = c.id and r1.weekday is not null) as ov,
      array(select unnest(c.languages) intersect select unnest((select languages from me))) as langs,
      (select count(*)::int from bookings b where b.status = 'completed' and ((b.learner_id = auth.uid() and b.teacher_id = c.id) or (b.teacher_id = auth.uid() and b.learner_id = c.id))) as past
    from cand c where jsonb_array_length(c.a) > 0
  )
  select s.id, s.username, s.display_name, s.avatar_url, s.rating, s.review_count, s.a, s.b, s.ov, s.langs, s.past,
    (jsonb_array_length(s.a) * 3 + jsonb_array_length(s.b) * 4 + case when jsonb_array_length(s.b) > 0 then 5 else 0 end
     + least(s.ov, 3) + cardinality(s.langs) + coalesce(s.rating, 0) / 2 + least(s.past, 2))::numeric(6,2) as score,
    next_open_slot(s.id, 60)
  from scored s
  order by 12 desc
  limit least(greatest(p_limit, 1), 20)
$$;

create or replace function public.calendar_status() returns jsonb
language sql stable security definer set search_path = public as $$
  select coalesce((select jsonb_build_object('connected', true, 'email', google_email, 'status', status) from calendar_integrations where user_id = auth.uid()), '{"connected":false}')
$$;

-- =====================================================================
-- administration (every action is written to the audit log)
-- =====================================================================
create or replace function public.admin_adjust_credits(p_user uuid, p_amount numeric, p_reason text)
returns void language plpgsql security definer set search_path = public as $$
declare a uuid := _require_admin();
begin
  if p_amount = 0 or p_amount is null or abs(p_amount) > 100 then raise exception 'invalid_amount'; end if;
  if coalesce(btrim(p_reason), '') = '' then raise exception 'reason_required'; end if;
  perform _move(p_user, null, 'admin_adjustment', round(p_amount, 1), 0, p_reason);
  perform _notify(p_user, 'credit_adjusted', null, jsonb_build_object('amount', p_amount, 'reason', p_reason));
  perform _audit('adjust_credits', 'user', p_user::text, jsonb_build_object('amount', p_amount, 'reason', p_reason));
end $$;

create or replace function public.admin_resolve_booking(p_booking uuid, p_outcome text, p_note text)
returns void language plpgsql security definer set search_path = public as $$
declare a uuid := _require_admin(); b bookings;
begin
  if coalesce(btrim(p_note), '') = '' then raise exception 'reason_required'; end if;
  select * into b from bookings where id = p_booking;
  if b.status = 'pending' then perform _cancel(b.learner_id, b.id, 'Closed by admin: ' || p_note, true);
  else perform _apply_outcome(p_booking, p_outcome, 'Admin: ' || p_note); end if;
  update disputes set status = 'resolved', resolution = p_outcome || ': ' || p_note, resolved_by = a, resolved_at = now() where booking_id = p_booking and status <> 'resolved';
  perform _notify(b.learner_id, 'dispute_resolved', b.id, jsonb_build_object('outcome', p_outcome));
  perform _notify(b.teacher_id, 'dispute_resolved', b.id, jsonb_build_object('outcome', p_outcome));
  perform _email(b.learner_id, 'dispute_resolved', 'dres:' || b.id || ':l', jsonb_build_object('outcome', p_outcome));
  perform _email(b.teacher_id, 'dispute_resolved', 'dres:' || b.id || ':t', jsonb_build_object('outcome', p_outcome));
  perform _audit('resolve_booking', 'booking', p_booking::text, jsonb_build_object('outcome', p_outcome, 'note', p_note));
end $$;

create or replace function public.admin_set_user_status(p_user uuid, p_status text, p_reason text)
returns void language plpgsql security definer set search_path = public as $$
declare a uuid := _require_admin();
begin
  if p_user = a then raise exception 'cannot_change_self'; end if;
  if p_status not in ('active','suspended') then raise exception 'invalid_status'; end if;
  if coalesce(btrim(p_reason), '') = '' then raise exception 'reason_required'; end if;
  update profiles set status = p_status where id = p_user;
  perform _audit('set_status', 'user', p_user::text, jsonb_build_object('status', p_status, 'reason', p_reason));
end $$;

create or replace function public.admin_set_role(p_user uuid, p_role text, p_reason text)
returns void language plpgsql security definer set search_path = public as $$
declare a uuid := _require_admin();
begin
  if p_user = a then raise exception 'cannot_change_self'; end if;
  if p_role not in ('student','admin') then raise exception 'invalid_role'; end if;
  if coalesce(btrim(p_reason), '') = '' then raise exception 'reason_required'; end if;
  update profiles set role = p_role where id = p_user;
  perform _audit('set_role', 'user', p_user::text, jsonb_build_object('role', p_role, 'reason', p_reason));
end $$;

create or replace function public.admin_update_settings(p jsonb)
returns void language plpgsql security definer set search_path = public as $$
declare a uuid := _require_admin(); old platform_settings := settings();
begin
  update platform_settings set
    starter_credits = coalesce((p->>'starter_credits')::numeric, starter_credits),
    durations = coalesce((select array_agg(x::int) from jsonb_array_elements_text(p->'durations') x), durations),
    weekly_earning_cap = coalesce((p->>'weekly_earning_cap')::numeric, weekly_earning_cap),
    pair_weekly_cap = coalesce((p->>'pair_weekly_cap')::numeric, pair_weekly_cap),
    reciprocal_flag_threshold = coalesce((p->>'reciprocal_flag_threshold')::int, reciprocal_flag_threshold),
    cancel_deadline_hours = coalesce((p->>'cancel_deadline_hours')::int, cancel_deadline_hours),
    response_window_hours = coalesce((p->>'response_window_hours')::int, response_window_hours),
    reminder_hours = coalesce((select array_agg(x::int) from jsonb_array_elements_text(p->'reminder_hours') x), reminder_hours),
    noshow_penalty = coalesce((p->>'noshow_penalty')::numeric, noshow_penalty),
    noshow_response_hours = coalesce((p->>'noshow_response_hours')::int, noshow_response_hours),
    leaderboard_enabled = coalesce((p->>'leaderboard_enabled')::boolean, leaderboard_enabled),
    announcement = case when p ? 'announcement' then nullif(btrim(p->>'announcement'), '') else announcement end,
    updated_at = now()
  where id;
  if not ((select durations from platform_settings where id) <@ array[30,60,90]) then raise exception 'invalid_durations'; end if;
  perform _audit('update_settings', 'settings', 'platform', jsonb_build_object('before', to_jsonb(old), 'change', p));
end $$;

create or replace function public.admin_review(p_kind text, p_id bigint, p_status text, p_note text)
returns void language plpgsql security definer set search_path = public as $$
declare a uuid := _require_admin();
begin
  if p_kind = 'report' then update reports set status = p_status, admin_note = p_note where id = p_id;
  elsif p_kind = 'flag' then update abuse_flags set status = p_status, review_note = p_note, reviewed_by = a where id = p_id;
  elsif p_kind = 'review' then update reviews set hidden = (p_status = 'hidden') where id = p_id;
  else raise exception 'invalid_kind'; end if;
  perform _audit('review_' || p_kind, p_kind, p_id::text, jsonb_build_object('status', p_status, 'note', p_note));
end $$;

create or replace function public.admin_save_skill(p_id int, p_name_en text, p_name_uz text, p_category int, p_status text, p_merge_into int default null)
returns int language plpgsql security definer set search_path = public as $$
declare a uuid := _require_admin(); sid int := p_id;
begin
  if p_merge_into is not null then
    insert into user_teaching_skills (user_id, skill_id, level) select user_id, p_merge_into, level from user_teaching_skills where skill_id = p_id on conflict do nothing;
    insert into user_learning_skills (user_id, skill_id, level) select user_id, p_merge_into, level from user_learning_skills where skill_id = p_id on conflict do nothing;
    delete from user_teaching_skills where skill_id = p_id; delete from user_learning_skills where skill_id = p_id;
    update skills set status = 'disabled', merged_into = p_merge_into where id = p_id;
  elsif p_id is null then
    insert into skills (slug, name_en, name_uz, category_id, status)
    values (left(trim(both '-' from regexp_replace(lower(p_name_en), '[^a-z0-9]+', '-', 'g')), 50) || '-' || substr(md5(random()::text), 1, 3), p_name_en, p_name_uz, p_category, coalesce(p_status, 'active'))
    returning id into sid;
  else
    update skills set name_en = coalesce(p_name_en, name_en), name_uz = coalesce(p_name_uz, name_uz), category_id = coalesce(p_category, category_id), status = coalesce(p_status, status) where id = p_id;
  end if;
  perform _audit('save_skill', 'skill', sid::text, jsonb_build_object('en', p_name_en, 'uz', p_name_uz, 'status', p_status, 'merge_into', p_merge_into));
  return sid;
end $$;

create or replace function public.admin_overview(p_from date, p_to date)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare a uuid := _require_admin(); lo timestamptz := p_from::timestamptz; hi timestamptz := (p_to + 1)::timestamptz;
begin
  return jsonb_build_object(
    'users', (select count(*) from profiles where status <> 'deleted'),
    'onboarded', (select count(*) from profiles where onboarded and status <> 'deleted'),
    'active_users', (select count(*) from profiles where status = 'active' and last_active_at > now() - interval '30 days'),
    'suspended', (select count(*) from profiles where status = 'suspended'),
    'new_users', (select count(*) from profiles where created_at >= lo and created_at < hi),
    'bookings', (select count(*) from bookings where created_at >= lo and created_at < hi),
    'by_status', (select coalesce(jsonb_object_agg(status, n), '{}') from (select status, count(*) n from bookings where created_at >= lo and created_at < hi group by status) x),
    'hours', (select coalesce(sum(duration_min), 0) / 60.0 from bookings where status = 'completed' and start_at >= lo and start_at < hi),
    'credits', (select coalesce(jsonb_object_agg(type, total), '{}') from (select type, sum(amount + case when type = 'hold_capture' then -held_change else 0 end) total from credit_ledger where created_at >= lo and created_at < hi group by type) x),
    'avg_rating', (select round(avg(rating)::numeric, 2) from reviews where not hidden),
    'daily', (select coalesce(jsonb_agg(x order by x.day), '[]') from (
        select d::date as day,
          (select count(*) from profiles where created_at::date = d::date) as signups,
          (select count(*) from bookings where created_at::date = d::date) as booked,
          (select count(*) from bookings where status = 'completed' and start_at::date = d::date) as completed
        from generate_series(lo, hi - interval '1 day', interval '1 day') d) x),
    'top_teach', (select coalesce(jsonb_agg(x), '[]') from (select s.name_en as name, count(*) n from user_teaching_skills u join skills s on s.id = u.skill_id group by s.id order by 2 desc limit 8) x),
    'top_learn', (select coalesce(jsonb_agg(x), '[]') from (select s.name_en as name, count(*) n from user_learning_skills u join skills s on s.id = u.skill_id group by s.id order by 2 desc limit 8) x),
    'open_disputes', (select count(*) from disputes where status <> 'resolved'),
    'open_reports', (select count(*) from reports where status <> 'closed'),
    'open_flags', (select count(*) from abuse_flags where status = 'open'),
    'email_failed', (select count(*) from email_outbox where status = 'failed')
  );
end $$;

-- =====================================================================
-- access rules
-- =====================================================================
alter table public.platform_settings enable row level security;
alter table public.profiles enable row level security;
alter table public.profile_private enable row level security;
alter table public.skill_categories enable row level security;
alter table public.skills enable row level security;
alter table public.user_teaching_skills enable row level security;
alter table public.user_learning_skills enable row level security;
alter table public.availability_rules enable row level security;
alter table public.availability_exceptions enable row level security;
alter table public.bookings enable row level security;
alter table public.booking_private enable row level security;
alter table public.credit_accounts enable row level security;
alter table public.credit_ledger enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.user_blocks enable row level security;
alter table public.reviews enable row level security;
alter table public.reports enable row level security;
alter table public.disputes enable row level security;
alter table public.abuse_flags enable row level security;
alter table public.notifications enable row level security;
alter table public.email_outbox enable row level security;
alter table public.calendar_integrations enable row level security;
alter table public.admin_audit_logs enable row level security;

revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;
revoke execute on all functions in schema public from public, anon, authenticated;

-- public catalogue
grant select on public.platform_settings, public.skill_categories, public.skills, public.user_teaching_skills, public.user_learning_skills, public.reviews to anon, authenticated;
grant select on public.public_profiles to anon, authenticated;
create policy "settings readable" on public.platform_settings for select using (true);
create policy "categories readable" on public.skill_categories for select using (active or is_admin());
create policy "skills readable" on public.skills for select using (status = 'active' or suggested_by = auth.uid() or is_admin());
create policy "teaching skills readable" on public.user_teaching_skills for select using (true);
create policy "learning skills readable" on public.user_learning_skills for select using (true);
create policy "visible reviews readable" on public.reviews for select using (not hidden or reviewer_id = auth.uid() or is_admin());

-- own profile (full row) and admin
grant select on public.profiles to authenticated;
grant update (username, display_name, avatar_url, bio, school, education_level, show_school, country, timezone, preferred_lang, languages,
              min_notice_hours, horizon_days, buffer_minutes, session_durations, show_on_leaderboard, email_prefs) on public.profiles to authenticated;
create policy "own profile" on public.profiles for select using (id = auth.uid() or is_admin());
create policy "edit own profile" on public.profiles for update using (id = auth.uid() and status = 'active') with check (id = auth.uid());
grant select, update (guardian_email) on public.profile_private to authenticated;
create policy "own private" on public.profile_private for select using (id = auth.uid());
create policy "edit own private" on public.profile_private for update using (id = auth.uid());

-- own skills and availability
grant insert, update, delete on public.user_teaching_skills, public.user_learning_skills to authenticated;
create policy "add own teaching" on public.user_teaching_skills for insert with check (user_id = auth.uid());
create policy "edit own teaching" on public.user_teaching_skills for update using (user_id = auth.uid());
create policy "remove own teaching" on public.user_teaching_skills for delete using (user_id = auth.uid());
create policy "add own learning" on public.user_learning_skills for insert with check (user_id = auth.uid());
create policy "edit own learning" on public.user_learning_skills for update using (user_id = auth.uid());
create policy "remove own learning" on public.user_learning_skills for delete using (user_id = auth.uid());
grant select, insert, update, delete on public.availability_rules, public.availability_exceptions to authenticated;
grant usage on sequence public.availability_rules_id_seq, public.availability_exceptions_id_seq to authenticated;
create policy "own rules" on public.availability_rules for all using (user_id = auth.uid() or is_admin()) with check (user_id = auth.uid());
create policy "own exceptions" on public.availability_exceptions for all using (user_id = auth.uid() or is_admin()) with check (user_id = auth.uid());

-- bookings and money: read-only for the people involved; all changes go through the functions above
grant select on public.bookings, public.booking_private, public.credit_accounts, public.credit_ledger, public.disputes to authenticated;
create policy "participants read bookings" on public.bookings for select using (auth.uid() in (learner_id, teacher_id) or is_admin());
create policy "participants read meeting" on public.booking_private for select using (exists (select 1 from bookings b where b.id = booking_id and auth.uid() in (b.learner_id, b.teacher_id)) or is_admin());
create policy "own account" on public.credit_accounts for select using (user_id = auth.uid() or is_admin());
create policy "own ledger" on public.credit_ledger for select using (user_id = auth.uid() or is_admin());
create policy "participants read disputes" on public.disputes for select using (exists (select 1 from bookings b where b.id = booking_id and auth.uid() in (b.learner_id, b.teacher_id)) or is_admin());

-- messaging
grant select on public.conversations to authenticated;
grant select, insert on public.messages to authenticated;
grant usage on sequence public.messages_id_seq to authenticated;
create policy "own conversations" on public.conversations for select using (auth.uid() in (user_a, user_b));
create policy "read own messages" on public.messages for select using (exists (select 1 from conversations c where c.id = conversation_id and auth.uid() in (c.user_a, c.user_b)));
create policy "send own messages" on public.messages for insert with check (sender_id = auth.uid() and exists (select 1 from conversations c where c.id = conversation_id and auth.uid() in (c.user_a, c.user_b)));
grant select, insert, delete on public.user_blocks to authenticated;
create policy "own blocks" on public.user_blocks for all using (blocker_id = auth.uid()) with check (blocker_id = auth.uid());

-- notifications, reports
grant select on public.notifications to authenticated;
create policy "own notifications" on public.notifications for select using (user_id = auth.uid());
grant select, insert on public.reports to authenticated;
grant usage on sequence public.reports_id_seq to authenticated;
create policy "file reports" on public.reports for insert with check (reporter_id = auth.uid() and status = 'open' and admin_note is null);
create policy "own reports" on public.reports for select using (reporter_id = auth.uid() or is_admin());

-- admin-only reading
grant select on public.abuse_flags, public.admin_audit_logs, public.email_outbox to authenticated;
create policy "admin flags" on public.abuse_flags for select using (is_admin());
create policy "admin audit" on public.admin_audit_logs for select using (is_admin());
create policy "admin outbox" on public.email_outbox for select using (is_admin());
-- calendar_integrations: no policy at all, so only the server (service role) can read the stored Google tokens

-- the server's service role (used only by trusted server code) keeps full access
grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;
grant execute on all functions in schema public to service_role;

-- callable functions
grant execute on function public.settings(), public.is_admin(), public.open_slots(uuid, timestamptz, timestamptz, int), public.next_open_slot(uuid, int),
  public.public_stats(), public.leaderboard(int), public.search_mentors(text, text, text, text, numeric, int, int, date, int, int, text, int) to anon, authenticated;
grant execute on function public.complete_onboarding(date, boolean), public.touch(), public.suggest_skill(text, int),
  public.book_session(uuid, int, timestamptz, int, text), public.respond_booking(uuid, boolean), public.cancel_booking(uuid, text),
  public.reschedule_booking(uuid, timestamptz, int), public.confirm_completion(uuid), public.report_no_show(uuid, text),
  public.open_dispute(uuid, text, text), public.respond_dispute(bigint, boolean, text),
  public.submit_review(uuid, int, int, int, int, text), public.set_meet_link(uuid, text), public.save_session_notes(uuid, text), public.sweep(),
  public.mark_conversation_read(uuid), public.mark_notifications_read(), public.best_matches(int), public.calendar_status(),
  public.admin_adjust_credits(uuid, numeric, text), public.admin_resolve_booking(uuid, text, text), public.admin_set_user_status(uuid, text, text),
  public.admin_set_role(uuid, text, text), public.admin_update_settings(jsonb), public.admin_review(text, bigint, text, text),
  public.admin_save_skill(int, text, text, int, text, int), public.admin_overview(date, date) to authenticated;

-- realtime for chat and notifications
do $$ begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.messages, public.notifications;
  end if;
end $$;

-- avatar storage (public images, each person writes only inside their own folder)
do $$ begin
  if exists (select 1 from pg_namespace where nspname = 'storage') then
    insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    values ('avatars', 'avatars', true, 2097152, array['image/png','image/jpeg','image/webp']) on conflict (id) do nothing;
    execute $p$create policy "avatar read" on storage.objects for select using (bucket_id = 'avatars')$p$;
    execute $p$create policy "avatar write own" on storage.objects for insert to authenticated with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text)$p$;
    execute $p$create policy "avatar update own" on storage.objects for update to authenticated using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text)$p$;
    execute $p$create policy "avatar delete own" on storage.objects for delete to authenticated using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text)$p$;
  end if;
end $$;

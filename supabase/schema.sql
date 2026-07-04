-- DealRadar schema — run this once in the Supabase SQL editor
-- (Dashboard → SQL Editor → New query → paste → Run).
--
-- The app talks to these tables from server-side code using the service-role
-- key, which bypasses RLS. RLS is enabled with no policies so the public anon
-- key cannot read or write anything directly.

create table if not exists deals (
  id text primary key,
  name text not null,
  company text not null,
  owner text not null,
  value numeric not null,
  stage text not null,
  stage_entered_at timestamptz not null,
  created_at timestamptz not null,
  expected_close_date timestamptz not null,
  close_date_history jsonb not null default '[]',
  next_step text,
  contacts jsonb not null default '[]',
  activities jsonb not null default '[]',
  notes jsonb not null default '[]'
);

create table if not exists action_drafts (
  id text primary key,
  deal_id text not null references deals (id),
  created_at timestamptz not null default now(),
  next_best_action text not null,
  email jsonb not null,
  rationale text not null,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'edited', 'dismissed')),
  resolved_at timestamptz,
  source text not null check (source in ('openai', 'fallback'))
);

create table if not exists audit_log (
  id text primary key,
  timestamp timestamptz not null default now(),
  actor text not null,
  action text not null,
  deal_id text,
  detail text not null
);

create table if not exists chat_messages (
  id text primary key,
  session_id text not null,
  created_at timestamptz not null default now(),
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  source text check (source in ('openai', 'fallback'))
);

create index if not exists action_drafts_deal_id_idx on action_drafts (deal_id);
create index if not exists audit_log_timestamp_idx on audit_log (timestamp desc);
create index if not exists chat_messages_session_idx on chat_messages (session_id, created_at);

alter table deals enable row level security;
alter table action_drafts enable row level security;
alter table audit_log enable row level security;
alter table chat_messages enable row level security;

-- The demo deals are seeded automatically by the app on first run (dates are
-- generated relative to "today" so the data looks live). To re-seed from
-- scratch, empty the tables and restart the app:
--   truncate audit_log; truncate action_drafts; delete from deals;

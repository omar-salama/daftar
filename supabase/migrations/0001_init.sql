-- =============================================================================
-- Migration: 0001_init
-- Description: Append-only version tables for transactions, accounts, and
--              categories. Conflict resolution is deterministic: winner =
--              max(version) by lexicographic HLC string compare.
--              Immutability is enforced at the RLS level — UPDATE and DELETE
--              policies are intentionally absent (RULES.md §2, §12).
-- =============================================================================

-- ---------------------------------------------------------------------------
-- tx_versions — one immutable row per version of a transaction.
-- Lines are embedded as JSONB because they belong to a version and never
-- mutate independently. A child table buys only join pain and sync races.
-- ---------------------------------------------------------------------------

create table if not exists tx_versions (
  row_id               uuid        primary key,                          -- client-generated, idempotency key
  tx_id                uuid        not null,                             -- logical transaction identity
  version              text        not null,                             -- HLC string (zero-padded millis + counter + device_id)
  user_id              uuid        not null default auth.uid(),
  device_id            text        not null,
  is_deleted           boolean     not null default false,               -- tombstone flag
  occurred_at          date        not null,
  account_id           uuid        not null,
  transfer_account_id  uuid,                                            -- non-null => this is a transfer
  payee                text,
  note                 text,
  lines                jsonb       not null,                            -- [{category_id, amount_minor}] — integers only
  total_minor          bigint      not null,                            -- denormalized sum of lines[].amount_minor
  created_at           timestamptz not null default now(),

  unique (tx_id, version)
);

-- Enforce the double-entry invariant: total_minor must equal sum of line amounts.
-- Checked on INSERT via a trigger (generated columns cannot reference JSONB aggregates).
create or replace function check_tx_total_minor()
  returns trigger
  language plpgsql
as $$
declare
  computed_total bigint;
begin
  -- Skip the check for tombstone rows (lines is an empty array)
  if new.is_deleted then
    return new;
  end if;

  select coalesce(sum((line->>'amount_minor')::bigint), 0)
    into computed_total
    from jsonb_array_elements(new.lines) as line;

  if computed_total <> new.total_minor then
    raise exception
      'tx_versions: total_minor (%) does not equal sum of lines amount_minor (%)',
      new.total_minor, computed_total;
  end if;

  return new;
end;
$$;

create trigger tx_versions_check_total
  before insert on tx_versions
  for each row execute function check_tx_total_minor();

-- Current state: latest non-deleted version per tx_id, resolved by HLC order.
create or replace view tx_current as
  select distinct on (tx_id) *
    from tx_versions
   order by tx_id, version desc;

-- ---------------------------------------------------------------------------
-- account_versions — append-only account records (same sync machinery as tx).
-- ---------------------------------------------------------------------------

create table if not exists account_versions (
  row_id      uuid        primary key,                                  -- client-generated idempotency key
  account_id  uuid        not null,                                     -- logical account identity
  version     text        not null,                                     -- HLC string
  user_id     uuid        not null default auth.uid(),
  device_id   text        not null,
  is_deleted  boolean     not null default false,
  name        text        not null,
  currency    text        not null,                                      -- ISO 4217 code, e.g. 'EGP', 'USD'
  note        text,
  created_at  timestamptz not null default now(),

  unique (account_id, version)
);

create or replace view account_current as
  select distinct on (account_id) *
    from account_versions
   order by account_id, version desc;

-- ---------------------------------------------------------------------------
-- category_versions — append-only category records.
-- ---------------------------------------------------------------------------

create table if not exists category_versions (
  row_id       uuid        primary key,                                  -- client-generated idempotency key
  category_id  uuid        not null,                                     -- logical category identity
  version      text        not null,                                     -- HLC string
  user_id      uuid        not null default auth.uid(),
  device_id    text        not null,
  is_deleted   boolean     not null default false,
  name         text        not null,
  icon         text,                                                     -- emoji or icon key
  sort_order   integer     not null default 0,
  created_at   timestamptz not null default now(),

  unique (category_id, version)
);

create or replace view category_current as
  select distinct on (category_id) *
    from category_versions
   order by category_id, version desc;

-- =============================================================================
-- Row-Level Security
-- Policy: authenticated users may SELECT and INSERT their own rows only.
-- UPDATE and DELETE are intentionally denied — append-only is enforced by
-- security policy, not convention (RULES.md §2, §12).
-- =============================================================================

-- tx_versions
alter table tx_versions enable row level security;

create policy "tx_versions: users select own rows"
  on tx_versions for select
  to authenticated
  using (user_id = auth.uid());

create policy "tx_versions: users insert own rows"
  on tx_versions for insert
  to authenticated
  with check (user_id = auth.uid());

-- account_versions
alter table account_versions enable row level security;

create policy "account_versions: users select own rows"
  on account_versions for select
  to authenticated
  using (user_id = auth.uid());

create policy "account_versions: users insert own rows"
  on account_versions for insert
  to authenticated
  with check (user_id = auth.uid());

-- category_versions
alter table category_versions enable row level security;

create policy "category_versions: users select own rows"
  on category_versions for select
  to authenticated
  using (user_id = auth.uid());

create policy "category_versions: users insert own rows"
  on category_versions for insert
  to authenticated
  with check (user_id = auth.uid());

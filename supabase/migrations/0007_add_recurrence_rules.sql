-- =============================================================================
-- Migration: 0007_add_recurrence_rules
-- Description: Append-only versioned table for recurrence rules (recurring
--              monthly entries and installment payment plans). Follows the
--              same immutable, HLC-versioned pattern as tx_versions.
-- =============================================================================

create table if not exists recurrence_rule_versions (
  row_id               uuid        primary key,                          -- client-generated idempotency key
  recurrence_id        uuid        not null,                             -- logical rule identity
  version              text        not null,                             -- HLC string
  user_id              uuid        not null default auth.uid(),
  device_id            text        not null,
  is_deleted           boolean     not null default false,               -- tombstone flag

  mode                 text        not null
                       constraint recurrence_mode_check check (mode in ('recurring', 'installment')),
  type                 text        not null default 'expense'
                       constraint recurrence_type_check check (type in ('expense', 'income', 'transfer')),
  account_id           uuid        not null,
  transfer_account_id  uuid,
  lines                jsonb       not null,                             -- [{category_id, amount_minor}]
  total_minor          bigint      not null,                             -- per-occurrence amount
  payee                text,
  note                 text,
  exchange_rate        double precision,

  frequency            text        not null
                       constraint frequency_check check (frequency in ('daily', 'weekly', 'monthly', 'yearly')),
  start_date           date        not null,

  total_installments   integer,                                          -- null for recurring mode
  original_total_minor bigint,                                           -- null for recurring mode

  last_materialized    date,                                             -- most recent materialized tx date
  materialized_count   integer     not null default 0,
  is_active            boolean     not null default true,

  created_at           timestamptz not null default now(),

  unique (recurrence_id, version)
);

-- Current state: latest non-deleted version per recurrence_id
create or replace view recurrence_rule_current as
  select distinct on (recurrence_id) *
    from recurrence_rule_versions
   order by recurrence_id, version desc;

-- =============================================================================
-- Row-Level Security — same pattern as tx_versions (RULES.md §12)
-- SELECT and INSERT only; UPDATE and DELETE denied (append-only).
-- =============================================================================

alter table recurrence_rule_versions enable row level security;

create policy "recurrence_rule_versions: users select own rows"
  on recurrence_rule_versions for select
  to authenticated
  using (user_id = auth.uid());

create policy "recurrence_rule_versions: users insert own rows"
  on recurrence_rule_versions for insert
  to authenticated
  with check (user_id = auth.uid());

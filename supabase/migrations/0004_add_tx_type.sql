-- =============================================================================
-- Migration: 0004_add_tx_type
-- Description: Add a 'type' column to tx_versions to distinguish income from
--              expense transactions. Defaults to 'expense' for backward
--              compatibility with existing rows.
-- =============================================================================

alter table tx_versions
  add column if not exists type text not null default 'expense'
  constraint tx_versions_type_check check (type in ('expense', 'income'));

-- =============================================================================
-- Migration: 0005_add_transfer_tx_type
-- Description: Update the 'type' check constraint on tx_versions to include
--              'transfer' transactions.
-- =============================================================================

alter table tx_versions
  drop constraint if exists tx_versions_type_check;

alter table tx_versions
  add constraint tx_versions_type_check check (type in ('expense', 'income', 'transfer'));

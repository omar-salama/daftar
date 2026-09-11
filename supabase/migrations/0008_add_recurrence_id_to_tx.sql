-- =============================================================================
-- Migration: 0008_add_recurrence_id_to_tx
-- Description: Add optional recurrence tracking fields to tx_versions so
--              materialized transactions link back to their source rule and
--              display installment progress (e.g., "3 of 12").
-- =============================================================================

alter table tx_versions
  add column if not exists recurrence_id      uuid,
  add column if not exists installment_number integer,
  add column if not exists total_installments integer;

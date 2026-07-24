-- Fix tx_current view to exclude tombstoned rows.
-- The CRDT invariant: a tx_id is logically deleted when its latest version is
-- a tombstone. The view should only surface live (non-deleted) transactions.
create or replace view tx_current as
  select *
    from (
      select distinct on (tx_id) *
        from tx_versions
       order by tx_id, version desc
    ) latest
   where not is_deleted;

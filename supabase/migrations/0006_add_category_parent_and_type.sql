-- Migration: 0006_add_category_parent_and_type
-- Description: Add parent_id and type to category_versions

alter table category_versions
  add column parent_id uuid,
  add column type text not null default 'expense';

-- Update category_current view
drop view if exists category_current;

create view category_current as
  select distinct on (category_id) *
    from category_versions
   order by category_id, version desc;

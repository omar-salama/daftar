-- Grant table-level privileges to the authenticated role so that RLS policies
-- can be evaluated. Without this, Postgres rejects access before even
-- reaching the policy checks.

grant select, insert on tx_versions       to authenticated;
grant select, insert on account_versions  to authenticated;
grant select, insert on category_versions to authenticated;

-- Views inherit the grantor's permissions (SECURITY DEFINER would be the
-- alternative), but for views backed by RLS tables we need explicit grants too.
grant select on tx_current       to authenticated;
grant select on account_current  to authenticated;
grant select on category_current to authenticated;

-- Grant service_role full access (SELECT, INSERT, UPDATE, DELETE) for admin
-- operations (test setup/teardown, service workers, etc.).
-- service_role bypasses RLS but still needs table-level privileges.
grant select, insert, update, delete on tx_versions       to service_role;
grant select, insert, update, delete on account_versions  to service_role;
grant select, insert, update, delete on category_versions to service_role;

grant select on tx_current       to service_role;
grant select on account_current  to service_role;
grant select on category_current to service_role;


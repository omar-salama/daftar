/**
 * Integration tests for tx_versions table and tx_current view.
 *
 * Requirements from PLAN.md §Stage-1:
 *  1. INSERT as authed user succeeds; row comes back via SELECT.
 *  2. UPDATE and DELETE are rejected by RLS; row is unchanged.
 *  3. A second user cannot SELECT the first user's rows.
 *  4. Inserting the same row_id twice with ignoreDuplicates leaves exactly one row.
 *  5. tx_current view: tombstone semantics and HLC ordering.
 *
 * No mocks. Connects to the local Supabase instance.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

// ---------------------------------------------------------------------------
// Local Supabase connection constants (npx supabase status)
// ---------------------------------------------------------------------------
const SUPABASE_URL = 'http://127.0.0.1:54321';
const ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';
const SERVICE_ROLE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Unique email so each test run gets a fresh user. */
function uniqueEmail(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2)}@test.local`;
}

/** Create a supabase-js client authenticated as the given email/password. */
async function signedInClient(email: string, password: string): Promise<SupabaseClient> {
  const client = createClient(SUPABASE_URL, ANON_KEY, {
    auth: { persistSession: false },
  });
  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw new Error(`signInWithPassword failed: ${error.message}`);
  return client;
}

/** Service-role client — bypasses RLS for setup/teardown. */
const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

/** Register a user via admin API (auto-confirms). */
async function createUser(email: string, password: string): Promise<string> {
  const { data, error } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error || !data.user) throw new Error(`createUser failed: ${error?.message}`);
  return data.user.id;
}

/** Delete a user via admin API. */
async function deleteUser(userId: string) {
  await adminClient.auth.admin.deleteUser(userId);
}

/** Build a minimal valid tx_versions row. HLC version is just a sortable string. */
function makeTxRow(overrides: Partial<TxRow> = {}): TxRow {
  return {
    row_id: crypto.randomUUID(),
    tx_id: crypto.randomUUID(),
    version: '0000000001700000000_0001_devA',
    device_id: 'devA',
    is_deleted: false,
    occurred_at: '2025-01-01',
    account_id: crypto.randomUUID(),
    transfer_account_id: null,
    payee: 'Test payee',
    note: null,
    lines: [{ category_id: crypto.randomUUID(), amount_minor: 100 }],
    total_minor: 100,
    ...overrides,
  };
}

interface TxRow {
  row_id: string;
  tx_id: string;
  version: string;
  device_id: string;
  is_deleted: boolean;
  occurred_at: string;
  account_id: string;
  transfer_account_id: string | null;
  payee: string | null;
  note: string | null;
  lines: { category_id: string; amount_minor: number }[];
  total_minor: number;
}

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe('tx_versions — RLS and integrity', () => {
  let userEmail: string;
  const userPassword = 'Test1234!';
  let userId: string;
  let client: SupabaseClient;

  beforeAll(async () => {
    userEmail = uniqueEmail('user1');
    userId = await createUser(userEmail, userPassword);
    client = await signedInClient(userEmail, userPassword);

    // Truncate test data: delete all rows belonging to our test user via admin.
    // (Real truncation would wipe all users; scoped delete is safer.)
    await adminClient.from('tx_versions').delete().eq('user_id', userId);
  });

  afterAll(async () => {
    await adminClient.from('tx_versions').delete().eq('user_id', userId);
    await deleteUser(userId);
  });

  // -------------------------------------------------------------------------
  // Test 1: INSERT succeeds; SELECT returns the row.
  // -------------------------------------------------------------------------
  it('test 1: INSERT as authed user succeeds and SELECT returns the row', async () => {
    const row = makeTxRow();

    const { error: insertError } = await client.from('tx_versions').insert(row);
    expect(insertError, `insert failed: ${insertError?.message}`).toBeNull();

    const { data, error: selectError } = await client
      .from('tx_versions')
      .select('*')
      .eq('row_id', row.row_id);

    expect(selectError).toBeNull();
    expect(data).toHaveLength(1);
    expect(data![0].row_id).toBe(row.row_id);
    expect(data![0].tx_id).toBe(row.tx_id);
  });

  // -------------------------------------------------------------------------
  // Test 2: UPDATE and DELETE are rejected by RLS; row is unchanged.
  // -------------------------------------------------------------------------
  it('test 2: UPDATE is rejected by RLS and row is unchanged', async () => {
    const row = makeTxRow();
    // Insert via the user's own client so RLS SELECT can see it
    const { error: insertErr } = await client.from('tx_versions').insert(row);
    expect(insertErr).toBeNull();

    // Attempt UPDATE via the same authed client.
    // With no UPDATE policy, PostgREST silently matches 0 rows (no error).
    const { error: updateError, count } = await client
      .from('tx_versions')
      .update({ note: 'hacked' }, { count: 'exact' })
      .eq('row_id', row.row_id);

    // Either an error is returned OR 0 rows were affected (RLS filtered the update)
    const blocked = updateError !== null || count === 0;
    expect(blocked).toBe(true);

    // Verify the row is unchanged — original note is null
    const { data } = await client
      .from('tx_versions')
      .select('note')
      .eq('row_id', row.row_id)
      .single();
    expect(data?.note ?? null).toBeNull();
  });

  it('test 2b: DELETE is rejected by RLS and row still exists', async () => {
    const row = makeTxRow();
    // Insert via user's own client
    const { error: insertErr } = await client.from('tx_versions').insert(row);
    expect(insertErr).toBeNull();

    // Attempt DELETE via the authenticated client.
    // With no DELETE policy, PostgREST silently deletes 0 rows (no error returned).
    const { error: deleteError, count } = await client
      .from('tx_versions')
      .delete({ count: 'exact' })
      .eq('row_id', row.row_id);

    // Either an error is returned OR 0 rows were deleted (RLS filtered the delete)
    const blocked = deleteError !== null || count === 0;
    expect(blocked, `deleteError=${JSON.stringify(deleteError)}, count=${count}`).toBe(true);

    // Verify the row still exists — admin client bypasses RLS
    const { data, error: adminErr } = await adminClient
      .from('tx_versions')
      .select('row_id')
      .eq('row_id', row.row_id);
    expect(adminErr, `admin select error: ${JSON.stringify(adminErr)}`).toBeNull();
    expect(data, `expected row to exist but got: ${JSON.stringify(data)}`).toHaveLength(1);
  });

  // -------------------------------------------------------------------------
  // Test 3: A second user cannot SELECT the first user's rows.
  // -------------------------------------------------------------------------
  it('test 3: second user cannot select first user rows', async () => {
    // Insert a row as user1 (via admin, directly setting user_id)
    const row = makeTxRow();
    await adminClient.from('tx_versions').insert({ ...row, user_id: userId });

    // Create user2
    const user2Email = uniqueEmail('user2');
    const user2Id = await createUser(user2Email, userPassword);
    const client2 = await signedInClient(user2Email, userPassword);

    try {
      const { data } = await client2
        .from('tx_versions')
        .select('*')
        .eq('row_id', row.row_id);

      // RLS: user2 should see zero rows for user1's row_id
      expect(data).toHaveLength(0);
    } finally {
      await deleteUser(user2Id);
    }
  });

  // -------------------------------------------------------------------------
  // Test 4: Duplicate row_id with ignoreDuplicates → no error, exactly one row.
  // -------------------------------------------------------------------------
  it('test 4: inserting same row_id twice with ignoreDuplicates leaves exactly one row', async () => {
    const row = makeTxRow();

    // ignoreDuplicates is a parameter on upsert(), not insert().
    // It translates to ON CONFLICT DO NOTHING.

    // First upsert
    const { error: e1 } = await client
      .from('tx_versions')
      .upsert(row, { ignoreDuplicates: true });
    expect(e1).toBeNull();

    // Second upsert — same row_id, different note (should be silently ignored)
    const { error: e2 } = await client
      .from('tx_versions')
      .upsert({ ...row, note: 'duplicate attempt' }, { ignoreDuplicates: true });
    expect(e2).toBeNull();

    // Exactly one row exists
    const { data, error: selectError } = await client
      .from('tx_versions')
      .select('*')
      .eq('row_id', row.row_id);

    expect(selectError).toBeNull();
    expect(data).toHaveLength(1);
    // Original note is preserved (not overwritten)
    expect(data![0].note).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Test 5: tx_current view — HLC ordering and tombstone semantics.
// ---------------------------------------------------------------------------
describe('tx_current view', () => {
  let userEmail: string;
  const userPassword = 'Test1234!';
  let userId: string;
  let client: SupabaseClient;

  beforeAll(async () => {
    userEmail = uniqueEmail('viewuser');
    userId = await createUser(userEmail, userPassword);
    client = await signedInClient(userEmail, userPassword);
    await adminClient.from('tx_versions').delete().eq('user_id', userId);
  });

  afterAll(async () => {
    await adminClient.from('tx_versions').delete().eq('user_id', userId);
    await deleteUser(userId);
  });

  it('test 5a: latest non-deleted version wins (HLC order)', async () => {
    const txId = crypto.randomUUID();
    const accountId = crypto.randomUUID();
    const catId = crypto.randomUUID();

    // v1 — lower HLC
    const v1: TxRow = {
      row_id: crypto.randomUUID(),
      tx_id: txId,
      version: '0000001700000000000_0001_devA',
      device_id: 'devA',
      is_deleted: false,
      occurred_at: '2025-01-01',
      account_id: accountId,
      transfer_account_id: null,
      payee: 'v1',
      note: 'version-1',
      lines: [{ category_id: catId, amount_minor: 50 }],
      total_minor: 50,
    };

    // v2 — higher HLC (lexicographically greater version string)
    const v2: TxRow = {
      ...v1,
      row_id: crypto.randomUUID(),
      version: '0000001700000000001_0001_devA', // higher than v1
      payee: 'v2',
      note: 'version-2',
    };

    // Insert v1 then v2
    const { error: e1 } = await client.from('tx_versions').insert(v1);
    expect(e1).toBeNull();
    const { error: e2 } = await client.from('tx_versions').insert(v2);
    expect(e2).toBeNull();

    // tx_current should return exactly v2
    const { data, error } = await client
      .from('tx_current')
      .select('*')
      .eq('tx_id', txId);

    expect(error).toBeNull();
    expect(data).toHaveLength(1);
    expect(data![0].note).toBe('version-2');
    expect(data![0].version).toBe(v2.version);
  });

  it('test 5b: tombstone (latest version) removes tx_id from tx_current', async () => {
    const txId = crypto.randomUUID();
    const accountId = crypto.randomUUID();
    const catId = crypto.randomUUID();

    // v1 — a normal version
    const v1: TxRow = {
      row_id: crypto.randomUUID(),
      tx_id: txId,
      version: '0000001700000000000_0001_devA',
      device_id: 'devA',
      is_deleted: false,
      occurred_at: '2025-01-01',
      account_id: accountId,
      transfer_account_id: null,
      payee: 'alive',
      note: null,
      lines: [{ category_id: catId, amount_minor: 200 }],
      total_minor: 200,
    };

    // v2 — another normal version (higher HLC)
    const v2: TxRow = {
      ...v1,
      row_id: crypto.randomUUID(),
      version: '0000001700000000001_0001_devA',
      payee: 'alive-v2',
    };

    // v3 — tombstone (highest HLC)
    const v3: TxRow = {
      ...v1,
      row_id: crypto.randomUUID(),
      version: '0000001700000000002_0001_devA', // highest
      is_deleted: true,
      payee: null,
      note: null,
      lines: [],       // tombstone rows have empty lines array
      total_minor: 0,  // and zero total (trigger skips check for tombstones)
    };

    const { error: e1 } = await client.from('tx_versions').insert(v1);
    expect(e1).toBeNull();
    const { error: e2 } = await client.from('tx_versions').insert(v2);
    expect(e2).toBeNull();
    const { error: e3 } = await client.from('tx_versions').insert(v3);
    expect(e3).toBeNull();

    // tx_current must return zero rows for this tx_id (it's tombstoned)
    const { data, error } = await client
      .from('tx_current')
      .select('*')
      .eq('tx_id', txId);

    expect(error).toBeNull();
    expect(data).toHaveLength(0);
  });
});

# Expense Tracker — Implementation Plan

Offline-first personal expense tracker. Expo + React Native, Supabase (Postgres/Auth/Realtime), TanStack Query + MMKV. $0 budget, no App Store.

**Core constraints (non-negotiable):**

1. **Feature-based vertical slices** — `/src/features/<slice>/{ui,hooks,repo,model}`. Strict unidirectional flow: UI → TanStack hook → Repository → Data layer. UI never touches Supabase or storage directly.
2. **Integer-only money kernel** — all amounts stored/calculated as integers in minor units (cents/piastres). Division by 100 exists only at the presentation boundary.
3. **Conflict-safe append-only schema** — transactions are immutable. Edits append a new version (HLC-ordered), deletes append tombstones. Sync is deterministic on every device.

> **Tooling note:** MMKV is a native module, so Expo Go is off the table from day one — you need a development build (`expo-dev-client`). Good news for the $0 constraint: `npx expo run:android` compiles a sideloadable APK locally, forever free, no EAS queue, no store. This plan assumes Android as the daily driver (iOS free-provisioning requires a Mac and 7-day re-signing — treat it as a bonus, not a target).

---

## Stage 0 — Scaffold & Sideload Pipeline (half a day)

**Architectural Goal:** A running dev build on your physical phone with the full native toolchain (MMKV, NativeWind, Expo Router) compiled in, before writing any feature code. If sideloading isn't proven now, every later stage is built on sand.

**AI-Agent Prompt:**

```
Create a new Expo project (SDK latest, TypeScript strict) named "ledger" with:
- expo-router (typed routes), react-native-mmkv, nativewind v4 + tailwindcss, @tanstack/react-query, @supabase/supabase-js, react-native-url-polyfill
- expo-dev-client installed; do NOT configure EAS — we build locally only
- Folder skeleton ONLY (empty index.ts barrels, no logic):
  src/features/{ledger,entry,accounts,sync,dashboard}/{ui,hooks,repo,model}
  src/kernel/ (pure TS, zero react/native imports)
  src/lib/ (mmkv instance, supabase client, query client)
- ESLint rule via eslint-plugin-boundaries: files in features/*/ui may only import from the same feature's hooks/; hooks only from repo/; repo only from lib/ and kernel/. kernel/ imports nothing outside itself. Fail the lint on violation.
- Dark-mode-first: set userInterfaceStyle "dark" in app.json, Tailwind config with a slate/zinc dark palette as default.
Do not write any screens beyond a placeholder tab layout. Do not touch Supabase yet.
```

**Keep-It-Zero Guardrails:**
- Install Android Studio + SDK; build with `npx expo run:android --variant release` → APK lands in `android/app/build/outputs/apk/release/`. Sideload via USB (`adb install`) or just share the APK to yourself. Zero EAS builds consumed, zero store accounts.
- Don't commit `android/` prebuild output — add to `.gitignore`, regenerate with `npx expo prebuild`. Keeps the repo clean and CNG (continuous native generation) intact.
- No Sentry, no analytics, no push notifications — each drags in services with paid ceilings.

**Validation Checklist:**
- [ ] Release APK installs and launches on the physical phone with no Metro connection.
- [ ] The ESLint boundary rule *fails* when you add a test import of `lib/supabase` inside a `ui/` file, and passes after removal.
- [ ] `src/kernel/` compiles with `tsc --noEmit` in isolation (no RN types leak in).

---

## Stage 1 — Core Kernel, Schema & Local Storage

**Architectural Goal:** Three foundations, all testable without a UI: (1) an integer money kernel that makes float contamination a *type error*, (2) the append-only Postgres schema with a deterministic version ordering, (3) MMKV wired as both the TanStack Query persister and the durable mutation outbox.

**Key design decisions to hand the agent (don't let it improvise these):**

- **Money = branded integer.** `type Minor = number & { __brand: 'minor' }`. Constructors: `minorFromInput(digits: string): Minor` (keypad feeds raw digit strings, never floats), `formatMinor(m: Minor, currency): string` (the *only* place division by 100 exists). Arithmetic helpers reject non-integers at runtime (`Number.isSafeInteger` assert).
- **Version = Hybrid Logical Clock string**, lexicographically sortable: `pad(physicalMillis,15) + '-' + pad(counter,4) + '-' + deviceId`. Winner of any conflict = `max(version)` by plain string compare. Deterministic on every device, no coordination.
- **Schema: one immutable row per *version* of a transaction, lines embedded as JSONB** (lines belong to a version and never mutate independently, so a child table buys you nothing but join pain and sync races):

```sql
create table tx_versions (
  row_id      uuid primary key,            -- client-generated, idempotency key
  tx_id       uuid not null,               -- logical transaction identity
  version     text not null,               -- HLC string
  user_id     uuid not null default auth.uid(),
  device_id   text not null,
  is_deleted  boolean not null default false,  -- tombstone
  occurred_at date not null,
  account_id  uuid not null,
  transfer_account_id uuid,                -- non-null => transfer
  payee       text,
  note        text,
  lines       jsonb not null,              -- [{category_id, amount_minor}]  int minor units
  total_minor bigint not null,             -- denormalized = sum(lines), checked
  created_at  timestamptz not null default now(),
  unique (tx_id, version)
);
-- current state = latest version per tx, tombstones filtered in the view
create view tx_current as
  select distinct on (tx_id) * from tx_versions
  order by tx_id, version desc;
```

  Add a CHECK via trigger or generated validation that `total_minor = sum of lines[].amount_minor` — this *is* your double-entry invariant for splits. Accounts/categories get the same treatment (`account_versions`, `category_versions`) — same sync machinery everywhere, one mental model.
- **MMKV layout:** instance `storage` with three namespaces by key prefix: `rq.` (TanStack persisted cache), `outbox.` (JSON array of pending `tx_versions` rows, append-only, drained by sync), `meta.` (deviceId, HLC state, last-pulled-at cursor).

**AI-Agent Prompts** (run as two separate conversations to keep context small):

```
PROMPT 1 — kernel only. Work exclusively in src/kernel/. No React, no IO.
Implement:
1. money.ts: branded `Minor` type; minorFromDigits(s: string): Minor (digits-only string → integer minor units, e.g. "1234" → 1234 meaning 12.34); addMinor/negateMinor with Number.isSafeInteger asserts; formatMinor(m, {symbol, decimals}) — the ONLY function allowed to divide by 100.
2. hlc.ts: hybrid logical clock. State {lastMillis, counter}. next(now: number, state) returns [versionString, newState] where versionString = zero-padded millis(15) + '-' + padded counter(4) + '-' + deviceId, guaranteed strictly increasing even if wall clock goes backwards. Pure function; persistence handled by caller.
3. tx.ts: types TxVersion {rowId, txId, version, deviceId, isDeleted, occurredAt, accountId, transferAccountId?, payee?, note?, lines: {categoryId, amountMinor}[], totalMinor}; buildTxVersion(input, hlc) that computes totalMinor from lines and throws if lines are empty or any amount is not a safe integer; resolveCurrent(versions: TxVersion[]): TxVersion[] — groups by txId, picks max(version) by string compare, drops tombstones.
4. Vitest unit tests: float rejection, HLC monotonicity under clock rollback, resolveCurrent tie-breaking, split totals invariant.
Do not create any other files.
```

```
PROMPT 2 — storage + schema.
1. src/lib/storage.ts: single MMKV instance; typed helpers getJSON/setJSON; outboxAppend(row), outboxPeekAll(), outboxRemove(rowIds) using key prefix "outbox."; meta helpers for deviceId (generate uuid once) and persisted HLC state.
2. src/lib/queryClient.ts: QueryClient + PersistQueryClientProvider setup using an MMKV-backed persister (synchronous storage adapter), gcTime 7 days.
3. supabase/migrations/0001_init.sql: the schema I paste below [paste the SQL above], plus account_versions and category_versions tables with the same (row_id pk, logical id, version, is_deleted, user_id) append-only shape, plus RLS: enable on all tables, policy user_id = auth.uid() for select and insert. NO update or delete policies — grant none; the tables are append-only by security policy, not convention.
Do not write repositories or UI yet.
```

**Keep-It-Zero Guardrails:**
- Run Postgres **locally** for this whole stage: `npx supabase init && npx supabase start` (Docker). Don't create the cloud project yet — Supabase free projects **pause after 7 days of inactivity**, so provision it only when Stage 3 starts and you'll actually hit it daily.
- Storage math: a `tx_versions` row is <1 KB. Even 20 tx/day × 3 versions each × 10 years ≈ 220K rows ≈ ~200 MB — under the 500 MB free cap. Append-only is *fine*; skip compaction schemes.
- RLS denying UPDATE/DELETE is your immutability enforcement **and** a free-tier protector — no accidental mass-update queries.

**Validation Checklist:**
- [ ] `vitest run` green; a test proving `minorFromDigits("010") === 10` and that passing `12.34` anywhere throws.
- [ ] HLC test: 1,000 calls with a *frozen* clock produce 1,000 strictly increasing versions.
- [ ] In local Supabase Studio: `UPDATE tx_versions SET note='x'` as the authenticated role is **rejected** by RLS.
- [ ] Insert 2 versions + 1 tombstone for one `tx_id`; `select * from tx_current` returns zero rows for it.
- [ ] Kill and relaunch the app: MMKV-persisted query cache rehydrates (log inspection).

---

## Stage 2 — Core Ledger & Frictionless Entry

**Architectural Goal:** The full vertical slice working **100% offline**: local repository (MMKV-backed, no Supabase), TanStack hooks, the custom keypad screen, and split-line editing. Sync later slots in *underneath* the repository interface without touching UI.

**Repository contract to dictate (this is the seam Stage 3 plugs into):**

```ts
interface LedgerRepo {
  listCurrent(): Promise<TxVersion[]>;          // resolved, tombstone-free
  append(v: TxVersion): Promise<void>;          // local write + outbox enqueue
}
```

`append` never edits — editing a transaction means `buildTxVersion` with the same `txId` and a fresh HLC version; deleting means appending `{isDeleted: true}`.

**Keypad design brief (be prescriptive with the agent — this screen is the product):**
- No `TextInput`, no system keyboard, ever. A grid of `Pressable`s: digits, backspace, date-nudge (‹ today ›), and a big save button.
- State is a single **digit string** fed to `minorFromDigits` for live display — cursorless, right-to-left fill like a POS terminal (`5` → `0.05`, `50` → `0.50`, `500` → `5.00`). Zero parsing ambiguity.
- Click-tax budget for the common case: **amount → tap category → done. 2 taps beyond digits.** Account defaults to last-used; date defaults to today; category grid (most-used first, long-press to pin) doubles as the save action — tapping a category *saves immediately*. A payee/note field exists but behind a "+ details" disclosure.
- Split flow: after typing the total, tap "Split" instead of a category → per-line category+amount list where the *last line auto-balances the remainder* (shown live, in minor-unit math). Save disabled unless remainder is exactly 0.

**AI-Agent Prompts:**

```
PROMPT 1 — repo + hooks, no UI. In src/features/ledger/:
repo/localLedgerRepo.ts implementing LedgerRepo [paste interface]: reads/writes an MMKV-cached array of TxVersion under key "ledger.versions", calls kernel resolveCurrent for listCurrent, and on append() also calls outboxAppend from lib/storage.
hooks/useLedger.ts: useQuery(['ledger'], repo.listCurrent); useAppendTx() mutation with optimistic update — onMutate patches the ['ledger'] cache by running resolveCurrent over [...old, newVersion], rollback on error.
Same pattern for features/accounts (account list + create). Unit-test the optimistic resolver with an edit and a tombstone.
Respect the import boundary lint. No Supabase imports anywhere.
```

```
PROMPT 2 — entry screen UI only. In src/features/entry/ui/ build EntryScreen for expo-router route /entry:
[paste the keypad design brief above, verbatim]
Components: Keypad (pure, onDigit/onBackspace props), AmountDisplay (calls formatMinor only), CategoryGrid, SplitEditor. All amounts flow as digit strings or Minor — if you ever call parseFloat or Number() on user input you have made an error.
Styling: NativeWind, dark palette, 44pt minimum touch targets, haptics via expo-haptics on key press.
Wire to useAppendTx from features/ledger/hooks. No new data logic.
```

```
PROMPT 3 — ledger list UI. /(tabs)/index: FlashList of tx_current grouped by day with daily totals (sum in Minor, format at render). Row tap → detail sheet with Edit (re-opens EntryScreen prefilled, saves as new version, same txId) and Delete (appends tombstone, confirm dialog). Show a subtle "edited" badge when a tx has >1 version.
```

**Keep-It-Zero Guardrails:**
- Still zero cloud usage — the entire stage runs against MMKV. Your daily-driver app is usable from this point even if you never finish Stage 3.
- Use `@shopify/flash-list` (free, no license) rather than any paid list/table component; charts wait until Stage 4.

**Validation Checklist:**
- [ ] Airplane mode, cold start: enter expense in ≤2 taps + digits; appears instantly in list (optimistic), survives force-kill relaunch.
- [ ] Split a 100.00 receipt as 33.33/33.33/33.34 — remainder logic lands exactly, list shows one transaction, total exactly 100.00.
- [ ] Edit that split; MMKV now holds 2 versions, list shows 1 row with the edit badge; delete it; row disappears; raw storage shows 3 immutable rows.
- [ ] Type "7" → display "0.07". Grep the codebase for `parseFloat|toFixed` — hits allowed only in `kernel/money.ts`.

---

## Stage 3 — Realtime Cloud Sync & Auth

**Architectural Goal:** Bidirectional sync as a *background feature slice* (`features/sync`) with zero UI-layer changes: outbox drain (push), realtime + cursor catch-up (pull), and conflict resolution that is already solved by construction — appending immutable rows means the only "merge" is `resolveCurrent`, which every device computes identically.

**Sync engine spec (dictate, don't delegate):**
- **Push:** drain outbox on app-foreground + on reconnect (NetInfo) + after each local append. `insert` rows in batches with `onConflict: 'row_id', ignoreDuplicates: true` — client-generated `row_id` PK makes retries idempotent. Remove from outbox only after 2xx.
- **Pull (catch-up):** `select * from tx_versions where created_at > meta.lastPulledAt order by created_at` on foreground; merge into local version store (union by `row_id`), advance cursor. Use `created_at` (server clock) for the cursor, `version` (HLC) only for conflict ranking — never mix their jobs.
- **Pull (live):** one Supabase Realtime channel, `postgres_changes` INSERT on `tx_versions` (RLS-scoped). Handler = same merge function as catch-up. Realtime is best-effort; the cursor pull is the source of truth, so missed websocket messages cost nothing.
- **Conflict test-by-construction:** two devices edit the same tx offline → both push their version rows → both pull → both hold identical version sets → `max(version)` picks the same winner everywhere. No server code, no merge UI.
- **Auth:** email + password (or magic link) — *not* anonymous auth, because you own real multi-device data and anonymous identities are painful to attach to a second device. Session persisted to MMKV via a custom storage adapter passed to `createClient`.

**AI-Agent Prompts:**

```
PROMPT 1 — auth. src/lib/supabase.ts: createClient with an MMKV storage adapter for auth persistence, autoRefreshToken tied to AppState. features/auth: signIn/signUp screens (email+password, minimal), useSession hook, root layout gate: unauthenticated → /auth, else tabs. Env vars via app.config.ts extra + process.env.EXPO_PUBLIC_SUPABASE_URL/ANON_KEY. No sync logic yet.
```

```
PROMPT 2 — sync engine. src/features/sync/ only:
[paste the sync engine spec above, verbatim]
Files: repo/pushOutbox.ts, repo/pullSince.ts, repo/mergeVersions.ts (pure: union by row_id), hooks/useSyncEngine.ts mounted once in root layout — subscribes to AppState/NetInfo/Realtime and invalidates ['ledger'] after any merge that changed data.
Then change ONE line in localLedgerRepo: after outboxAppend, fire-and-forget pushOutbox(). UI files must not change at all — if a change outside features/sync and that one repo line seems needed, stop and tell me instead.
```

**Keep-It-Zero Guardrails:**
- Create the cloud project now. Free tier: 500 MB DB, 50K MAU, Realtime 200 concurrent / 2M messages-month — a two-device personal app uses ~0.1% of this.
- **The 7-day pause is your real enemy.** Daily personal use resets it; if you travel, either open the app weekly or add a GitHub Actions cron (free) hitting a trivial `select 1` RPC weekly. Do *not* pay for Pro to avoid pausing.
- One Realtime channel per app instance, not per query — channels are the metered unit you could plausibly waste.
- Keep the anon key in `EXPO_PUBLIC_*` — it's designed to be public; RLS is the boundary. No paid secrets manager.

**Validation Checklist:**
- [ ] Airplane mode: log 3 expenses → outbox = 3. Reconnect → outbox drains to 0, rows visible in Supabase Studio, retry the push manually → no duplicates (idempotency).
- [ ] Two devices (phone + second emulator/APK): entry on A appears on B in <2s without touching B.
- [ ] The nasty one: both devices offline, both **edit the same transaction** differently, reconnect both → both converge to the *same* winner, loser version still queryable in DB.
- [ ] Delete on A while B is offline editing it → tombstone wins/loses purely by HLC order, both devices agree.
- [ ] Kill app during outbox drain (mid-flight) → relaunch → no lost and no duplicated rows.

---

## Stage 4 — Dashboards & Aggregations

**Architectural Goal:** Read-only projections over `tx_current` — monthly time-series, category donuts, budget-vs-actual — computed **client-side in the kernel** (your dataset is thousands of rows, not millions; shipping SQL aggregation views adds sync-consistency questions for zero benefit). Plus CSV export as your data-liberation escape hatch.

**AI-Agent Prompts:**

```
PROMPT 1 — aggregation kernel. src/kernel/aggregate.ts, pure functions over TxVersion[] (already resolved): monthlyTotals(txs, {months}) → {month, incomeMinor, expenseMinor}[]; categoryBreakdown(txs, range) → {categoryId, totalMinor, share}[] where split lines are attributed per-line, not per-transaction; budgetProgress(txs, budgets: {categoryId, monthlyMinor}[]). All math integer; shares as basis points (int), converted to % at render. Vitest: a split transaction contributes to multiple categories but exactly once to the monthly total.
```

```
PROMPT 2 — dashboard UI. features/dashboard: /(tabs)/stats screen. victory-native (XL) + react-native-svg: donut for categoryBreakdown with center total, 6-month bar chart income vs expense, budget progress bars turning amber >80% and red >100%. Data via one useQuery(['dashboard', monthKey]) selecting from the existing ['ledger'] cache (select option), never a second repo fetch. Month pager header. Dark theme, no chart legends — label arcs directly.
```

```
PROMPT 3 — export. features/dashboard/repo/exportCsv.ts: serialize tx_current (one row per LINE, so splits export correctly: date, account, category, amount decimal-formatted via formatMinor, payee, note, txId) to a file with expo-file-system, share sheet via expo-sharing. Also an "Export raw versions (JSON)" debug option dumping all versions — my disaster-recovery backup.
```

**Keep-It-Zero Guardrails:**
- Client-side aggregation keeps Supabase usage at "sync only" — no RPC/edge-function invocations (edge functions have free-tier caps you never need to touch).
- `victory-native` + `react-native-svg` + `expo-sharing`: all MIT. Avoid highcharts/paid wrappers the agent might suggest.
- The JSON version-dump export is your real backup story ($0 alternative to Supabase's paid PITR): share it to your own storage monthly.

**Validation Checklist:**
- [ ] Donut categories for a month containing splits sum to exactly the month's expense total (integer equality, not ±0.01).
- [ ] Basis-point shares sum to 10,000 ± rounding rule you chose (largest-remainder recommended).
- [ ] CSV opened in Excel: split receipt appears as N lines, amounts have correct decimals, re-summing matches the app.
- [ ] Dashboard updates live when a new expense syncs in from the other device (cache-select wiring proof).
- [ ] 5,000 synthetic transactions (write a seed script): stats screen renders <300 ms on-device, release build.

---

## Cross-Stage Rules for Working the Agent

1. **One slice, one conversation.** Start a fresh Cursor/Windsurf chat per prompt above; paste only the kernel types + repo interface it needs, never the whole tree. Your ESLint boundary rule is the regression net that makes this safe.
2. **Paste the spec, don't describe it.** The blocks marked "verbatim" exist because agents improvise money handling and sync semantics badly. Your kernel tests are the contract; run `vitest` after every agent session before accepting.
3. **Never let the agent touch `kernel/` and a feature in the same session.** Kernel changes require their own conversation plus a green test run — it's the one place a silent regression corrupts money.
4. **Model note:** if your editor offers newer Claude models than 3.5 Sonnet (Sonnet 4.5 or the Claude 5 family), use them; the stage prompts work unchanged and the boundary-respecting behavior improves markedly.

The dependency-ordered critical path is: HLC + branded Minor (Stage 1) → repository seam (Stage 2) → everything else is replaceable. Get those two right and no later stage can paint you into a corner.

---

## Session Playbook — Start to Finish

How to actually run the agent sessions, day one to shipped APK.

### Day 0 — before the first agent session (~30 min, all by hand)

1. `git init`, commit `PLAN.md` alone as the first commit.
2. Write `.cursorrules` / `.windsurfrules` — copy the rules block from "Making Vibe Coding Seamless" verbatim.
3. Create empty `docs/decisions.md`.
4. Decide your editor's two modes: **Ask/Chat mode** = thinking, design questions, "should I...". **Agent/Write mode** = executing a PLAN.md prompt. Never design in agent mode — it starts editing files mid-thought.

### The session loop (repeat for every PROMPT in this plan)

```
1. GATE-IN    git status → tree must be clean. If not: commit or stash first.
2. OPEN       Fresh chat, agent mode. Opener: "Read PLAN.md Stage N, PROMPT M.
              Implement exactly that. Touch only the files it names."
              Paste any [verbatim] spec blocks + only the interfaces/types it needs.
3. RUN        Let it finish. If it asks a design question mid-run: answer from
              PLAN.md or decisions.md. If the answer isn't in either, that's a
              real decision — stop, decide, log it in decisions.md, then answer.
4. GATE-OUT   "Run npm run check and fix everything it reports." Must be green.
5. REVIEW     Read the full diff. ~60s/file. You are looking for: new deps,
              files outside the slice, any float math, any mutation of versions,
              tests modified to pass. Any of these → reject that part, re-prompt.
6. VALIDATE   Run the stage checklist items this prompt enables. Tick them in
              PLAN.md itself.
7. COMMIT     "stage2: keypad + split editor (PROMPT 2)". Close the chat. Done.
```

One prompt = one session = one commit. Never carry a chat into the next prompt — even a successful one. The 7 steps take ~5 minutes of your attention around each session; that overhead IS the quality control.

### When a session goes wrong

- **Red tests:** paste the failure output verbatim + "Make the test pass. Do not modify the test." Agents fix precise failures well and vague bug reports badly.
- **Wrong direction, first offense:** one correction, quoting the violated rule from `.cursorrules` or PLAN.md.
- **Wrong direction, second offense:** stop arguing. `git checkout . && git clean -fd`, close the chat, reread your own prompt — a twice-failed session is almost always an ambiguous prompt. Fix the prompt (usually: name exact files, paste the exact interface), fresh session.
- **Scope creep in the diff** (touched files outside the slice, added a dep): revert just those files, keep the good parts, re-prompt with the boundary stated explicitly.
- **It "simplified" something in kernel/**: full revert, no salvage. Kernel changes only ever happen in dedicated kernel-only sessions with green tests in the same diff.

### Stage boundaries

- Optionally branch per stage (`stage-3-sync`); merge only when the stage's full validation checklist is green, then tag (`v0.3`).
- Before starting stage N+1: rebuild and reinstall the release APK, use the app for a day if you can. You're the only user — dogfooding between stages is your real acceptance test.
- After each stage, one extra 5-minute chat in **ask mode**: "Read the diff of this stage's commits. List anything that violates the rules in .cursorrules." Cheap self-review pass that catches drift while it's one stage old, not four.

### Rough effort map (evenings/weekends pace)

| Stage | Sessions | Wall time |
|---|---|---|
| 0 scaffold | 1–2 | half a day (mostly Android Studio setup, not the agent) |
| 1 kernel/schema | 2–3 + kernel fixes | 1–2 days |
| 2 ledger/keypad | 3–5 (UI iterates) | 2–4 days |
| 3 sync/auth | 2–3 + convergence test | 1–2 days (validation is the work, not the code) |
| 4 dashboards | 3–4 | 1–2 days |

Expect Stage 2 to take the most sessions (UI taste is iterative — that's normal, keep each iteration its own small session) and Stage 3 to take the most *care* per session (least code, highest stakes; never rush its checklist).

---

## Testing Strategy

Deliberately bottom-heavy pyramid. The architecture concentrates everything breakable into pure TypeScript (`kernel/`, `mergeVersions`, repos), so that's where the automation lives. Automated RN e2e suites are the worst cost/benefit item for a solo app — one smoke flow, no more.

| Layer | Tool | Scope | When it runs |
|---|---|---|---|
| Unit | Vitest | kernel/ (money, HLC, resolveCurrent, aggregate), repo logic, optimistic resolver | Every agent session (`npm run check`) |
| Integration | Vitest + local Supabase (Docker) | RLS immutability, idempotent push, tx_current view, two-client sync convergence | Before committing Stage 1 & 3 work; before any schema/sync change |
| E2E smoke | Maestro (1–2 flows max) | App boots, keypad entry lands in list | After big UI diffs, before cutting a release APK |
| Manual | Stage validation checklists | Device-only behavior: airplane mode, force-kill, haptics, two physical devices | Once per stage, before merging the stage branch |

Unit tests are already specified inside Stages 1, 2, and 4. The two additions below are built once and reused forever.

### Integration suite (build at end of Stage 1, extend in Stage 3)

Runs against `npx supabase start` — real Postgres, real RLS, real auth. No mocks: mocked Supabase tests pass while production RLS rejects you.

**AI-Agent Prompt (Stage 1 portion):**

```
Create tests/integration/ with its own vitest config (vitest.integration.config.ts, separate from unit tests; script "test:integration"). Setup: connect supabase-js to the LOCAL supabase instance (http://127.0.0.1:54321, anon key from `npx supabase status`), create/sign in a throwaway test user per run via email+password with auto-confirm (local config), truncate test data between suites via a service-role client.
Tests against the real local Postgres:
1. INSERT into tx_versions as the authed user succeeds; the row comes back via select.
2. UPDATE and DELETE on tx_versions as the authed user are rejected by RLS (assert error, then assert row unchanged).
3. A second user cannot select the first user's rows.
4. Inserting the same row_id twice with ignoreDuplicates resolves without error and leaves exactly one row.
5. tx_current view: insert v1, v2 (higher HLC), tombstone v3 for one tx_id → view returns zero rows for that tx_id; with only v1+v2 it returns exactly v2.
Do not touch src/. Do not mock anything.
```

**AI-Agent Prompt (Stage 3 portion — the convergence test):**

```
Add tests/integration/sync-convergence.test.ts. Simulate two devices as two in-memory stores + the real local Supabase, using ONLY the production modules: kernel hlc/tx, features/sync repo/pushOutbox, pullSince, mergeVersions (import them directly; no UI, no MMKV — abstract storage behind the simplest in-memory stand-in matching the storage interface).
Scenario: both devices seed the same tx. Both go "offline" and append conflicting edit versions locally (device A's HLC deliberately behind device B's wall clock). Both push, both pull.
Assert: (a) both devices hold identical version SETS (same row_ids), (b) resolveCurrent picks the SAME winner on both, (c) the loser version still exists in Postgres, (d) repeat the whole push step a second time → row counts unchanged (idempotency).
Add a second scenario: device A appends a tombstone while B appends an edit with a lower HLC → both converge to deleted.
```

### Maestro smoke flow (build during Stage 2, ~30 min)

```
Install Maestro CLI (free). Create .maestro/smoke.yaml against the dev build:
launch app → tap keys 1,2,3,4 on the custom keypad → assert "12.34" visible in AmountDisplay → tap the first category tile → assert the ledger list now shows "12.34". 
Add testID props to Keypad keys, AmountDisplay, and category tiles if missing (testID only — no logic changes).
Add script "test:e2e": "maestro test .maestro/". Do not write additional flows.
```

Keep it at this one flow (plus at most a sign-in flow after Stage 3). Its only job is catching "the app doesn't boot / entry is broken" after big diffs.

**Keep-It-Zero Guardrails:**
- Everything here is free and local: Docker Supabase, Vitest, Maestro CLI (open source). No Maestro Cloud, no BrowserStack, no CI device farms.
- If you add CI later, GitHub Actions free tier runs unit + integration fine (`supabase start` works in Actions); leave Maestro local-only — emulators in CI are where free minutes go to die.

**Validation Checklist:**
- [ ] `npm run test:integration` green from a cold `supabase start`, twice in a row (proves cleanup between runs works).
- [ ] Temporarily grant an UPDATE RLS policy → immutability test fails → revert → passes (proves the test actually guards the invariant).
- [ ] Convergence test: flip which device has the higher HLC → the asserted winner flips accordingly, test still passes both ways.
- [ ] `maestro test .maestro/` passes against a release APK on the connected phone.

---

## Making Vibe Coding Seamless

Workflow practices that keep an AI-driven build fast without letting it rot. These matter more than any individual prompt.

### 1. Write the rules file BEFORE the first prompt

Create `.cursorrules` (Cursor) / `.windsurfrules` (Windsurf) — and mirror it as `CLAUDE.md` if you ever use Claude Code — containing the project's non-negotiables. Every agent session inherits these automatically, so you never re-paste constraints and never get a session that "forgot" the money rules:

```
# Project rules — expense tracker

## Money (violations are bugs, not style)
- All amounts are integers in minor units (type Minor). Never parseFloat/Number() user input.
- Division by 100 exists ONLY in src/kernel/money.ts formatMinor. Nowhere else.

## Data (append-only)
- Rows in *_versions tables/stores are immutable. Edit = append new version (same logical id, fresh HLC). Delete = append tombstone. Never mutate or remove.
- Conflict winner = max(version) by string compare. Do not invent other merge logic.

## Architecture
- Vertical slices: src/features/<slice>/{ui,hooks,repo,model}. Flow: ui → hooks → repo → lib/kernel. Never skip a layer. UI never imports supabase or mmkv.
- src/kernel/ is pure TS: no React, no IO, no RN imports. Changes to kernel/ require updated vitest tests in the same diff.

## Process
- Do not add dependencies without asking. Do not modify files outside the slice you were asked to work in.
- If a task seems to require breaking any rule above, STOP and say so instead of doing it.
```

That last line is the highest-leverage sentence in the file — it converts silent rule-bending into a visible question.

### 2. Git is your undo button — use it aggressively

- `git init` at Stage 0 even though it's a solo project. The agent WILL eventually produce a diff you want to throw away wholesale; `git checkout .` is how you do that in one second instead of an hour of un-picking.
- **Never let the agent work on a dirty tree.** Commit (or stash) before every agent session so each session = exactly one reviewable diff.
- Commit after every green validation-checklist item, with the stage in the message (`stage1: HLC monotonic under clock rollback`). One branch per stage if you want extra insulation; merge when the stage checklist is fully green.
- Read every diff before committing. Vibe coding fails when it becomes "accept-all coding" — the 60 seconds of diff-reading per session is the entire quality-control budget, spend it.

### 3. Tests are the acceptance gate, not decoration

- The Stage 1 kernel tests are your contract. Rule: **no agent diff gets committed while `vitest run` is red.** Ever. Feed failures back verbatim ("this test fails with X, fix the implementation, do not modify the test") — agents fix tests-as-specified far better than vague bug reports.
- When the agent breaks a test, the default instruction is "make the test pass," never "update the test" — the tests encode the money invariants; changing them requires a deliberate human decision.
- Add a `package.json` script `check`: `tsc --noEmit && eslint . && vitest run`. End every agent session with "run npm run check and fix everything it reports" — cheap, mechanical, catches 90% of regressions before you even read the diff.

### 4. Context hygiene (the #1 cause of agent regressions is bloated context)

- Fresh chat per prompt in this plan. Long chats drift: the agent starts "remembering" earlier abandoned approaches and re-introducing them.
- Paste **interfaces and types, not implementations**. The agent building the entry screen needs the `LedgerRepo` interface and the `Minor` type — it does not need to read `localLedgerRepo.ts`, and giving it less to read means less to accidentally rewrite.
- Reference this file by stage: "Read PLAN.md Stage 2, PROMPT 2, and implement exactly that." Keeping the plan in-repo makes it addressable context instead of something you paraphrase (paraphrasing is where specs decay).
- If a session goes sideways twice on the same task, don't argue with it a third time — revert, start a fresh chat, and improve the prompt with what you learned about how it misread you.

### 5. Pin what the agent likes to drift on

- Pin dependency versions (exact, no `^`) once Stage 0 builds. Agents love "upgrading" packages as a side quest, and Expo native-module version mismatches are the most time-expensive class of failure in this stack.
- Keep a `docs/decisions.md` — one line per decision made mid-flight ("2026-07: chose largest-remainder rounding for basis points"). When a future agent session asks "should I...?" you paste the relevant line instead of re-deriving it. It's also the file that stops YOU from relitigating settled questions at 11pm.
- Seed data script early (`scripts/seed.ts` writing synthetic TxVersions to MMKV). Agents test their UI work against whatever data exists; give them 500 realistic transactions and split edge cases from Stage 2 onward, and half a class of "works with 3 rows" bugs never appears.

### 6. Sequence discipline

- Resist building UI ahead of its data seam. The plan's ordering (kernel → repo → UI → sync) exists because each layer is the test harness for the one above it. The moment you let the agent scaffold "a quick screen" that talks to Supabase directly "just for now," you've created the migration task that kills the project's momentum.
- One stage fully green before the next begins. A half-validated Stage 1 kernel underneath Stage 3 sync is how money bugs become sync bugs become unfixable.

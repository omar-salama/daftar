# Project Rules — Daftar Expense Tracker

> These rules are **non-negotiable invariants**, not style suggestions.
> Every AI agent session inherits them. Every diff is reviewed against them.
> If a task seems to require breaking any rule below, **STOP and say so** instead of doing it.

---

## 1. Money — Violations Are Bugs, Not Style

- **All monetary amounts are integers in minor units**, represented by the branded type `Minor`.
  - `type Minor = number & { __brand: 'minor' }`
  - Minor units = cents, piastres, fils, etc. depending on currency.
- **Never use `parseFloat()`, `Number()`, or any float coercion on user monetary input.** The keypad produces digit strings; `minorFromDigits()` converts them to `Minor`. No intermediate floats, ever.
- **Division by 100 (or the currency's decimal divisor) exists ONLY in `src/kernel/money.ts` → `formatMinor()`.** This is the single presentation boundary. Grep the codebase — if you find division by 100 anywhere else, it is a bug.
- **All arithmetic** (`addMinor`, `subtractMinor`, `negateMinor`) must assert `Number.isSafeInteger` on inputs and outputs. Overflow is a crash, not silent corruption.
- **Percentage shares** are expressed as basis points (integers, 1 bp = 0.01%). They sum to 10,000. Conversion to display percentages happens at the render boundary only. Use largest-remainder method for rounding.
- **Currency is configurable.** The currency definition (`symbol`, `code`, `decimals`, `minorDivisor`) is a runtime value, never hardcoded. All formatting functions accept a currency parameter.

---

## 2. Data Model — Append-Only, Immutable, Conflict-Free

- **Rows in `*_versions` tables and local stores are immutable.** Once written, a row is never modified or deleted at the storage level.
  - **Edit** = append a new row with the same logical ID (`tx_id`) and a fresh HLC `version`.
  - **Delete** = append a tombstone row (`is_deleted: true`) with a fresh HLC `version`.
  - **Never mutate or remove** an existing version row. Not in code, not in migrations, not in debug scripts.
- **Conflict resolution is deterministic:** winner = `max(version)` by lexicographic string comparison. Do not invent alternative merge logic, priority schemes, or "last-write-wins by timestamp." The HLC version string IS the total order.
- **`tx_current` is a derived view**, not a source of truth. It is always recomputable from the full version history via `resolveCurrent()`.
- **Supabase RLS enforces immutability:** UPDATE and DELETE policies are denied. This is a security boundary, not just a convention.

---

## 3. Architecture — Vertical Slices, Strict Layer Boundaries

### Directory Structure

```
src/
├── kernel/          # Pure TypeScript — ZERO React, ZERO RN, ZERO IO
├── lib/             # Infrastructure wiring (MMKV, Supabase client, QueryClient)
├── features/
│   ├── ledger/      # Transaction CRUD
│   │   ├── model/   # Types, interfaces, constants
│   │   ├── repo/    # Data access (MMKV, Supabase)
│   │   ├── hooks/   # React hooks (TanStack Query wrappers)
│   │   └── ui/      # React Native components & screens
│   ├── entry/       # Expense entry keypad
│   ├── accounts/    # Account management
│   ├── sync/        # Sync engine (push/pull/realtime)
│   ├── auth/        # Authentication
│   └── dashboard/   # Charts, aggregations, export
└── app/             # Expo Router layout & route files
```

### Dependency Flow (Unidirectional — Never Skip a Layer)

```
UI  →  hooks  →  repo  →  lib / kernel
```

- **`ui/`** may only import from its own feature's `hooks/` and `model/`. Never from `repo/`, `lib/`, `kernel/`, or another feature's internals.
- **`hooks/`** may only import from its own feature's `repo/` and `model/`, plus `kernel/` types. Never from `lib/` directly (repos abstract that away).
- **`repo/`** may import from `lib/` and `kernel/`. Never from `hooks/` or `ui/`.
- **`kernel/`** imports **nothing** outside itself. No React, no React Native, no IO, no Node APIs. Pure TypeScript, pure functions. If you need `Date.now()`, accept it as a parameter.
- **`lib/`** imports only external packages and `kernel/`. Never from `features/`.

### Cross-Feature Communication

- Features never import from each other's `repo/`, `hooks/`, or `ui/`.
- Shared types live in `kernel/` or the feature's `model/` (re-exported via barrel).
- If two features need to coordinate, they share a kernel type or a TanStack Query key — never a direct import.

### ESLint Boundary Enforcement

The `eslint-plugin-boundaries` configuration must enforce all of the above. If the lint passes, the architecture is correct. If a valid use case fails the lint, update the lint config (with justification in `docs/decisions.md`), never silently bypass it.

---

## 4. TypeScript — Strict, Explicit, No Escape Hatches

- **`strict: true`** in `tsconfig.json`. All strict family flags enabled. Non-negotiable.
- **No `any`.** Use `unknown` + type narrowing, generics, or explicit types. `// @ts-ignore` and `// @ts-expect-error` require a comment explaining why and a linked issue/TODO.
- **No type assertions (`as`)** unless narrowing from `unknown` after a runtime check (type guard). Never use `as` to silence a type error.
- **Branded types** for domain identifiers: `Minor`, `TxId`, `AccountId`, `CategoryId`, `DeviceId`, `HlcVersion`. Prevents accidentally passing a raw string/number where a domain type is expected.
- **Explicit return types** on all exported functions. Inferred return types are fine for private/local functions.
- **`const` by default.** Use `let` only when reassignment is genuinely needed. Never `var`.
- **Readonly by default.** Function parameters that are objects/arrays should be `Readonly<T>` or `readonly T[]` unless mutation is the function's explicit purpose.

---

## 5. Naming Conventions

| Entity | Convention | Example |
|--------|-----------|---------|
| Files | `camelCase.ts` | `localLedgerRepo.ts` |
| Directories | `camelCase` | `features/ledger/repo/` |
| Types / Interfaces | `PascalCase` | `TxVersion`, `LedgerRepo` |
| Functions / Variables | `camelCase` | `buildTxVersion()`, `totalMinor` |
| Constants | `UPPER_SNAKE_CASE` | `MAX_SPLIT_LINES`, `DEFAULT_CURRENCY` |
| React Components | `PascalCase` | `<AmountDisplay />`, `<CategoryGrid />` |
| Hook functions | `use` prefix | `useLedger()`, `useAppendTx()` |
| Test files | `*.test.ts` | `money.test.ts`, `hlc.test.ts` |
| Query keys | Tuple literal | `['ledger']`, `['dashboard', monthKey]` |
| MMKV key prefixes | `namespace.` | `rq.`, `outbox.`, `meta.` |

- **No abbreviations** except universally understood ones (`tx` for transaction, `id` for identifier, `db` for database).
- **Boolean variables/props** start with `is`, `has`, `should`, `can`: `isDeleted`, `hasMultipleVersions`.

---

## 6. Error Handling

- **Fail loud, fail early.** Use runtime assertions (`invariant()` or plain `throw`) for violated preconditions in kernel code. Silent fallbacks hide bugs.
- **Never swallow errors.** Every `catch` block must either re-throw, log + re-throw, or handle the error with an explicit recovery strategy. Empty `catch {}` blocks are bugs.
- **Errors at boundaries (repo, hooks) are typed** — use discriminated unions (`Result<T, E>`) or TanStack Query's error state. UI always handles the error case.
- **Network errors are expected, not exceptional.** The sync engine treats network failures as normal (retry with backoff). The outbox pattern means no user action is ever lost to a network error.

---

## 7. React & React Native Practices

- **Functional components only.** No class components.
- **No inline styles in components** — use NativeWind/Tailwind classes. Exception: truly dynamic values (e.g., computed widths) that can't be expressed as utility classes.
- **Memoization is intentional, not preventive.** Use `useMemo`/`useCallback`/`React.memo` when you have measured or can reason about a specific performance problem. Don't wrap everything "just in case."
- **Component files export one component.** Small helpers (e.g., a `ListSeparator`) can be co-located but not as named exports — extract to their own file if reused.
- **Minimum touch target: 44pt** on all interactive elements (Apple HIG). Enforce via NativeWind min-h/min-w classes.
- **Dark-mode first.** The default and primary theme is dark. Light mode is a future consideration, not a launch target.
- **Accessibility:** all interactive elements have `accessibilityLabel`. Images have `accessibilityRole="image"`. Lists have `accessibilityRole="list"`.
- **No `TextInput` for monetary amounts.** The custom keypad is the only input method for money. This is a product decision and an architectural boundary.

---

## 8. Testing

### Philosophy
Bottom-heavy test pyramid. Kernel and repo logic get exhaustive unit tests. UI gets one Maestro smoke flow. Integration tests use real Supabase (Docker), never mocks.

### Rules
- **`npm run check`** (`tsc --noEmit && eslint . && vitest run`) must be green before any commit. No exceptions.
- **Tests encode invariants, not implementations.** When a test fails, fix the implementation. Never modify a test to make it pass unless the invariant itself has changed (human decision, logged in `docs/decisions.md`).
- **Kernel tests are the contract.** Changes to `kernel/` must include updated tests in the same diff. A kernel change without a test change is suspicious — either the test coverage was already sufficient (verify) or the change isn't tested (fix).
- **No mocking of Supabase in integration tests.** Use `npx supabase start` (Docker) for real Postgres, real RLS, real auth. Mocked Supabase tests pass while production RLS rejects you.
- **Test file location:** unit tests co-located (`money.test.ts` next to `money.ts`), integration tests in `tests/integration/`.

### What to Test
| Layer | What | Tool |
|-------|------|------|
| Kernel | Money arithmetic, float rejection, HLC monotonicity, `resolveCurrent`, aggregations | Vitest |
| Repo | Optimistic updates, outbox operations, MMKV read/write | Vitest |
| Integration | RLS enforcement, idempotent push, `tx_current` view, sync convergence | Vitest + local Supabase |
| E2E | App boots, keypad entry → ledger list | Maestro (1–2 flows max) |

---

## 9. Dependencies

- **No new dependencies without explicit approval.** Ask first, explain why, confirm there's no built-in or existing alternative.
- **Pin exact versions** (no `^`, no `~`). Expo native-module version mismatches are the most expensive class of failure in this stack.
- **Approved stack** (do not substitute without discussion):
  - `expo` (SDK latest), `expo-router`, `expo-dev-client`, `expo-haptics`, `expo-file-system`, `expo-sharing`
  - `react-native-mmkv`
  - `nativewind` v4 + `tailwindcss`
  - `@tanstack/react-query`
  - `@supabase/supabase-js`
  - `@shopify/flash-list`
  - `victory-native` + `react-native-svg` (Stage 4 only)
  - `vitest` (testing)
  - `eslint` + `eslint-plugin-boundaries`
- **Banned patterns:** No Sentry, no analytics SDKs, no push notification services, no paid component libraries, no EAS Build (local builds only).

---

## 10. Git & Process

- **Clean tree before every agent session.** Commit or stash first. No dirty working directories.
- **One prompt = one session = one commit.** Never carry a chat into the next prompt.
- **Commit message format:** `feat/fix/chore(feat_name): desc`
  - Example: `feat(ledger): add repo and optimistic hooks`
- **Branch naming:** `feat/<feat_name>`, `fix/<feat_name>`, etc. (e.g., `feat/ledger`). Merge to `dev` only when the stage's full validation checklist is green. Tag: `v0.<N>`.
- **Never commit generated native directories** (`ios/`, `android/`). Regenerate with `npx expo prebuild`. Add to `.gitignore`.
- **Read every diff before committing.** Review checklist:
  - [ ] No new dependencies added without approval
  - [ ] No files touched outside the specified slice
  - [ ] No float math outside `kernel/money.ts`
  - [ ] No mutation of version rows
  - [ ] No tests modified to force passing
  - [ ] No `any` types introduced
  - [ ] No `// @ts-ignore` without justification

---

## 11. Performance Baselines

- **Keypad response:** < 16ms per key press (one frame). No jank.
- **List scroll:** 60 FPS on a mid-range device with 1,000+ transactions.
- **Dashboard render:** < 300ms with 5,000 synthetic transactions (release build).
- **App cold start:** < 2s to interactive (MMKV rehydration is synchronous, so this should be natural).
- **Sync push:** outbox drain begins within 1s of network availability.

---

## 12. Security

- **Supabase anon key is public** (designed to be) — it goes in `EXPO_PUBLIC_*` env vars. RLS is the security boundary, not key secrecy.
- **No service-role key in client code.** Ever. Service-role is for integration tests and admin scripts only.
- **RLS on every table.** Policies: `user_id = auth.uid()` for SELECT and INSERT. No UPDATE or DELETE policies (append-only enforcement).
- **Auth: email + password** (not anonymous auth). Anonymous identities are painful to attach to a second device.
- **No secrets in the repository.** Use `.env` (gitignored) for local dev, `app.config.ts` for build-time injection.

---

## 13. Platform Support

- **Primary target: iOS.** Develop and test on a physical iPhone via `npx expo run:ios --device`.
- **Secondary target: Android.** Run an Android build once per stage to confirm it doesn't break. Use `npx expo run:android`.
- **All code is platform-agnostic** by default. Platform-specific code (if ever needed) goes in `.ios.ts` / `.android.ts` suffixed files, never in `Platform.select()` scattered through business logic.
- **Free provisioning (iOS):** requires re-signing every 7 days. Acceptable for a daily-driver personal app.
- **Local builds only.** No EAS Build, no CI device farms. `npx expo run:ios` and `npx expo run:android` compile locally.

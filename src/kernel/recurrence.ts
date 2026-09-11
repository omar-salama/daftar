import { type Minor, addMinor } from './money';
import { type TxId, type RowId, type TxType, type TxLine } from './tx';
import { getDateString } from './date';

// ---------------------------------------------------------------------------
// Branded types
// ---------------------------------------------------------------------------

export type RecurrenceId = string & { __brand: 'RecurrenceId' };
export type RecurrenceMode = 'recurring' | 'installment';

// ---------------------------------------------------------------------------
// RecurrenceRule — one immutable row per version (same pattern as TxVersion).
// Includes version-tracking fields (rowId, version, deviceId, isDeleted) and
// domain fields. "Current" state is computed via resolveCurrentRules().
// ---------------------------------------------------------------------------

export interface RecurrenceRule {
  readonly rowId: RowId;
  readonly recurrenceId: RecurrenceId;
  readonly version: string;               // HLC string
  readonly deviceId: string;
  readonly isDeleted: boolean;

  // Template fields (copied into each materialized TxVersion)
  readonly mode: RecurrenceMode;
  readonly type: TxType;
  readonly accountId: string;
  readonly transferAccountId?: string;
  readonly lines: readonly TxLine[];
  readonly totalMinor: Minor;             // Per-occurrence amount
  readonly payee?: string;
  readonly note?: string;
  readonly exchangeRate?: number;

  // Schedule
  readonly dayOfMonth: number;            // 1–28 (clamped to avoid month-length issues)
  readonly startDate: string;             // 'YYYY-MM-DD' — first occurrence

  // Installment-specific
  readonly totalInstallments?: number;    // Total number of payments (mode='installment' only)
  readonly originalTotalMinor?: Minor;    // Full price before division (mode='installment' only)

  // Tracking
  readonly lastMaterializedDate?: string; // 'YYYY-MM-DD' of most recent materialized tx
  readonly materializedCount: number;     // How many txs have been created from this rule

  // Lifecycle
  readonly isActive: boolean;
}

// ---------------------------------------------------------------------------
// BuildRecurrenceRuleInput — input for the pure builder function.
// Same pattern as BuildTxVersionInput: caller provides everything except the
// HLC version string, which is injected separately.
// ---------------------------------------------------------------------------

export interface BuildRecurrenceRuleInput {
  readonly rowId: RowId;
  readonly recurrenceId: RecurrenceId;
  readonly deviceId: string;
  readonly isDeleted?: boolean;

  readonly mode: RecurrenceMode;
  readonly type?: TxType;
  readonly accountId: string;
  readonly transferAccountId?: string;
  readonly lines: readonly TxLine[];
  readonly payee?: string;
  readonly note?: string;
  readonly exchangeRate?: number;

  readonly dayOfMonth: number;
  readonly startDate: string;

  readonly totalInstallments?: number;
  readonly originalTotalMinor?: Minor;

  readonly lastMaterializedDate?: string;
  readonly materializedCount?: number;
  readonly isActive?: boolean;
}

// ---------------------------------------------------------------------------
// buildRecurrenceRule — construct a RecurrenceRule with full validation.
// Pure function: no IO, no side effects.
// ---------------------------------------------------------------------------

export function buildRecurrenceRule(
  input: BuildRecurrenceRuleInput,
  versionString: string
): RecurrenceRule {
  if (input.dayOfMonth < 1 || input.dayOfMonth > 28) {
    throw new Error('buildRecurrenceRule: dayOfMonth must be between 1 and 28');
  }

  if (input.mode === 'installment') {
    if (input.totalInstallments === undefined || input.totalInstallments <= 0) {
      throw new Error('buildRecurrenceRule: installment mode requires a positive totalInstallments');
    }
    if (input.originalTotalMinor === undefined) {
      throw new Error('buildRecurrenceRule: installment mode requires originalTotalMinor');
    }
  }

  if (input.lines.length === 0 && !input.isDeleted) {
    throw new Error('buildRecurrenceRule: Rule must have at least one line');
  }

  let totalMinor = 0 as Minor;
  for (const line of input.lines) {
    if (!Number.isSafeInteger(line.amountMinor)) {
      throw new Error(`buildRecurrenceRule: Unsafe integer in line amount: ${line.amountMinor}`);
    }
    totalMinor = addMinor(totalMinor, line.amountMinor);
  }

  return {
    rowId: input.rowId,
    recurrenceId: input.recurrenceId,
    version: versionString,
    deviceId: input.deviceId,
    isDeleted: input.isDeleted ?? false,

    mode: input.mode,
    type: input.type ?? 'expense',
    accountId: input.accountId,
    transferAccountId: input.transferAccountId,
    lines: input.lines,
    totalMinor,
    payee: input.payee,
    note: input.note,
    exchangeRate: input.exchangeRate,

    dayOfMonth: input.dayOfMonth,
    startDate: input.startDate,

    totalInstallments: input.totalInstallments,
    originalTotalMinor: input.originalTotalMinor,

    lastMaterializedDate: input.lastMaterializedDate,
    materializedCount: input.materializedCount ?? 0,
    isActive: input.isActive ?? true,
  };
}

// ---------------------------------------------------------------------------
// resolveCurrentRules — same deterministic resolution as resolveCurrent for
// TxVersion: group by recurrenceId, pick max(version) by string compare,
// drop tombstones.
// ---------------------------------------------------------------------------

export function resolveCurrentRules(
  versions: readonly RecurrenceRule[]
): RecurrenceRule[] {
  const latestByRule = new Map<RecurrenceId, RecurrenceRule>();

  for (const version of versions) {
    const existing = latestByRule.get(version.recurrenceId);
    if (!existing || version.version > existing.version) {
      latestByRule.set(version.recurrenceId, version);
    }
  }

  const current: RecurrenceRule[] = [];
  for (const version of latestByRule.values()) {
    if (!version.isDeleted) {
      current.push(version);
    }
  }

  return current;
}

// ---------------------------------------------------------------------------
// divideInstallments — split a total into N equal payments using integer math.
// Uses largest-remainder method: first `remainder` installments get +1 minor
// unit. Returned array always sums to exactly totalMinor.
//
// Example: divideInstallments(10000 as Minor, 3) → [3334, 3333, 3333]
// ---------------------------------------------------------------------------

export function divideInstallments(totalMinor: Minor, count: number): Minor[] {
  if (count <= 0) {
    throw new Error('divideInstallments: count must be positive');
  }
  if (!Number.isSafeInteger(totalMinor)) {
    throw new Error('divideInstallments: totalMinor must be a safe integer');
  }
  if (!Number.isSafeInteger(count)) {
    throw new Error('divideInstallments: count must be a safe integer');
  }

  const base = Math.floor(totalMinor / count);
  const remainder = totalMinor - base * count;

  const result: Minor[] = [];
  for (let i = 0; i < count; i++) {
    result.push((i < remainder ? base + 1 : base) as Minor);
  }
  return result;
}

// ---------------------------------------------------------------------------
// nextMonthDate — advance a date to the next month, clamped to dayOfMonth.
// Internal helper for pendingMaterializationDates.
// ---------------------------------------------------------------------------

function nextMonthDate(dateStr: string, dayOfMonth: number): string {
  const [y, m] = dateStr.split('-').map(Number);
  let nextY = y;
  let nextM = m + 1;
  if (nextM > 12) {
    nextM = 1;
    nextY += 1;
  }
  return getDateString(nextY, nextM, dayOfMonth);
}

// ---------------------------------------------------------------------------
// pendingMaterializationDates — compute which months need new TxVersions.
//
// For recurring: all months from (lastMaterialized + 1 month) to today.
// For installment: same, but stops once materializedCount reaches totalInstallments.
// ---------------------------------------------------------------------------

export function pendingMaterializationDates(
  rule: Readonly<RecurrenceRule>,
  today: string
): string[] {
  if (!rule.isActive) return [];

  const dates: string[] = [];
  let cursor = rule.lastMaterializedDate
    ? nextMonthDate(rule.lastMaterializedDate, rule.dayOfMonth)
    : rule.startDate;

  while (cursor <= today) {
    if (
      rule.mode === 'installment' &&
      rule.totalInstallments !== undefined &&
      rule.materializedCount + dates.length >= rule.totalInstallments
    ) {
      break;
    }
    dates.push(cursor);
    cursor = nextMonthDate(cursor, rule.dayOfMonth);
  }

  return dates;
}

// ---------------------------------------------------------------------------
// materializationTxId — deterministic TxId for a (recurrenceId, date) pair.
//
// Both devices generate the same txId for the same inputs, so
// resolveCurrent() deduplicates if two devices materialize concurrently.
// Uses XOR mixing of UUID hex nibbles with date digits.
// ---------------------------------------------------------------------------

export function materializationTxId(
  recurrenceId: string,
  occurrenceDate: string
): TxId {
  const hex = recurrenceId.replace(/-/g, '');       // 32 hex chars
  const dateDigits = occurrenceDate.replace(/-/g, ''); // 8 digit chars (YYYYMMDD)

  let result = '';
  for (let i = 0; i < 32; i++) {
    const uuidNibble = parseInt(hex[i], 16);
    const dateNibble = parseInt(dateDigits[i % dateDigits.length], 10);
    result += ((uuidNibble ^ dateNibble) & 0xf).toString(16);
  }

  return `${result.slice(0, 8)}-${result.slice(8, 12)}-${result.slice(12, 16)}-${result.slice(16, 20)}-${result.slice(20)}` as TxId;
}

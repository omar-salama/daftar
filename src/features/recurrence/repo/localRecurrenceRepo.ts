import { getJSON, setJSON, outboxAppend, nextVersion, generateUuid } from '@/lib/storage';
import { RecurrenceRule, RecurrenceId, RecurrenceMode, resolveCurrentRules, buildRecurrenceRule, BuildRecurrenceRuleInput, RowId } from '@/kernel';
import { RecurrenceRepo } from '../model';

export function createRecurrenceRule(input: Omit<BuildRecurrenceRuleInput, 'deviceId' | 'rowId' | 'recurrenceId'> & { recurrenceId?: RecurrenceId }): RecurrenceRule {
  const { version, deviceId } = nextVersion();
  const rowId = generateUuid() as RowId;
  const { recurrenceId: inputRecurrenceId, ...rest } = input;
  const recurrenceId = inputRecurrenceId ?? (generateUuid() as RecurrenceId);

  return buildRecurrenceRule({
    ...rest,
    recurrenceId,
    deviceId,
    rowId
  }, version);
}

const KEY_RECURRENCE_VERSIONS = 'recurrence.versions';

export const localRecurrenceRepo: RecurrenceRepo = {
  async listCurrent(filters?: { mode?: RecurrenceMode }): Promise<RecurrenceRule[]> {
    const versions = getJSON<RecurrenceRule[]>(KEY_RECURRENCE_VERSIONS) ?? [];
    let current = resolveCurrentRules(versions);
    if (filters?.mode) {
      current = current.filter(r => r.mode === filters.mode);
    }
    return current;
  },

  async listAll(): Promise<RecurrenceRule[]> {
    return getJSON<RecurrenceRule[]>(KEY_RECURRENCE_VERSIONS) ?? [];
  },

  async append(r: RecurrenceRule): Promise<void> {
    const versions = getJSON<RecurrenceRule[]>(KEY_RECURRENCE_VERSIONS) ?? [];
    versions.push(r);
    setJSON(KEY_RECURRENCE_VERSIONS, versions);
    
    // Append to sync outbox
    outboxAppend(r);
  }
};

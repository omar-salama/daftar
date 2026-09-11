import { RecurrenceMode, RecurrenceRule } from '@/kernel';

export interface RecurrenceRepo {
  listCurrent(filters?: { mode?: RecurrenceMode }): Promise<RecurrenceRule[]>;
  listAll(): Promise<RecurrenceRule[]>;
  append(r: RecurrenceRule): Promise<void>;
}

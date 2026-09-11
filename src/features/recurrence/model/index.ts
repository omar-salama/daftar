import { RecurrenceRule } from '@/kernel';

export interface RecurrenceRepo {
  listCurrent(): Promise<RecurrenceRule[]>;
  listAll(): Promise<RecurrenceRule[]>;
  append(r: RecurrenceRule): Promise<void>;
}

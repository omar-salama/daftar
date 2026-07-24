import { TxVersion } from '@/kernel';

export interface LedgerRepo {
  listCurrent(): Promise<TxVersion[]>;
  append(v: TxVersion): Promise<void>;
}

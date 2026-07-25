import { TxVersion } from '@/kernel';

export interface LedgerRepo {
  listCurrent(): Promise<TxVersion[]>;
  listAll(): Promise<TxVersion[]>;
  append(v: TxVersion): Promise<void>;
}

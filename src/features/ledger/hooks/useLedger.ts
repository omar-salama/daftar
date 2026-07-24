import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { TxVersion, resolveCurrent } from '@/kernel';
import { localLedgerRepo } from '../repo/localLedgerRepo';

export const ledgerKeys = {
  all: ['ledger'] as const,
};

export function useLedger() {
  return useQuery({
    queryKey: ledgerKeys.all,
    queryFn: () => localLedgerRepo.listCurrent(),
  });
}

export function useAppendTx() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (newVersion: TxVersion) => localLedgerRepo.append(newVersion),
    onMutate: async (newVersion: TxVersion) => {
      await queryClient.cancelQueries({ queryKey: ledgerKeys.all });
      const previousTxs = queryClient.getQueryData<TxVersion[]>(ledgerKeys.all);

      queryClient.setQueryData<TxVersion[]>(ledgerKeys.all, (old) => {
        const existing = old ?? [];
        return resolveCurrent([...existing, newVersion]);
      });

      return { previousTxs };
    },
    onError: (err, newVersion, context) => {
      if (context?.previousTxs) {
        queryClient.setQueryData(ledgerKeys.all, context.previousTxs);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ledgerKeys.all });
    },
  });
}

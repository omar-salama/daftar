import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AccountVersion, resolveAccountCurrent } from '../model';
import { localAccountRepo } from '../repo/localAccountRepo';

export const accountKeys = {
  all: ['accounts'] as const,
};

export function useAccounts() {
  return useQuery({
    queryKey: accountKeys.all,
    queryFn: () => localAccountRepo.listCurrent(),
  });
}

export function useAppendAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (newVersion: AccountVersion) => localAccountRepo.append(newVersion),
    onMutate: async (newVersion: AccountVersion) => {
      await queryClient.cancelQueries({ queryKey: accountKeys.all });
      const previousAccounts = queryClient.getQueryData<AccountVersion[]>(accountKeys.all);

      queryClient.setQueryData<AccountVersion[]>(accountKeys.all, (old) => {
        const existing = old ?? [];
        return resolveAccountCurrent([...existing, newVersion]);
      });

      return { previousAccounts };
    },
    onError: (err, newVersion, context) => {
      if (context?.previousAccounts) {
        queryClient.setQueryData(accountKeys.all, context.previousAccounts);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: accountKeys.all });
    },
  });
}

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AccountId, AccountType, AccountVersion, resolveAccountCurrent } from '../model';
import { localAccountRepo } from '../repo/localAccountRepo';
import { nextHLC, RowId } from '@/kernel';
import { generateUuid, getDeviceId, getHlcState, setHlcState } from '@/lib/storage';
import { Minor } from '@/kernel/money';

export const accountKeys = {
  all: ['accounts'] as const,
};

export function useAccounts() {
  return useQuery({
    queryKey: accountKeys.all,
    queryFn: () => localAccountRepo.listCurrent(),
  });
}

// Low-level mutation for appending any raw AccountVersion
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

// Domain-level mutations

export function useSaveAccount() {
  const appendAccount = useAppendAccount();

  return useMutation({
    mutationFn: async (data: {
      existingAccount?: AccountVersion;
      name: string;
      type: AccountType;
      note?: string;
      initialBalance?: Minor;
      maxOrder: number;
    }) => {
      const now = Date.now();
      const deviceId = getDeviceId();
      let hlcState = getHlcState();
      const [version, nextState] = nextHLC(now, hlcState, deviceId);
      setHlcState(nextState);

      const payload: AccountVersion = data.existingAccount
        ? {
            ...data.existingAccount,
            name: data.name,
            type: data.type,
            note: data.note,
            initialBalance: data.initialBalance !== undefined ? data.initialBalance : data.existingAccount.initialBalance,
            version,
          }
        : {
            rowId: generateUuid() as RowId,
            accountId: generateUuid() as AccountId,
            version,
            deviceId,
            isDeleted: false,
            name: data.name,
            type: data.type,
            order: data.maxOrder + 1,
            currency: 'USD',
            note: data.note,
            initialBalance: data.initialBalance ?? 0,
            createdAt: new Date(now).toISOString(),
          };

      return appendAccount.mutateAsync(payload);
    },
  });
}

export function useReorderAccounts() {
  const appendAccount = useAppendAccount();

  return useMutation({
    mutationFn: async (orderedAccounts: AccountVersion[]) => {
      const now = Date.now();
      const deviceId = getDeviceId();
      let hlcState = getHlcState();
      
      const mutations = [];

      for (let index = 0; index < orderedAccounts.length; index++) {
        const account = orderedAccounts[index];
        if (account.order !== index) {
          const [version, nextState] = nextHLC(now, hlcState, deviceId);
          hlcState = nextState;
          mutations.push(
            appendAccount.mutateAsync({
              ...account,
              version,
              order: index,
            })
          );
        }
      }
      
      setHlcState(hlcState);
      await Promise.all(mutations);
    },
  });
}

export function useDeleteAccount() {
  const appendAccount = useAppendAccount();

  return useMutation({
    mutationFn: async (account: AccountVersion) => {
      const now = Date.now();
      const deviceId = getDeviceId();
      const hlcState = getHlcState();
      const [version, nextState] = nextHLC(now, hlcState, deviceId);
      setHlcState(nextState);

      return appendAccount.mutateAsync({
        ...account,
        isDeleted: true,
        version,
      });
    },
  });
}

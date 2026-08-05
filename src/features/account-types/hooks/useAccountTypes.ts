import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AccountTypeId, AccountTypeVersion, resolveAccountTypeCurrent } from '../model';
import { localAccountTypeRepo } from '../repo';
import { nextHLC, RowId } from '@/kernel';
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { generateUuid, getDeviceId, getHlcState, nextVersion, setHlcState } from '@/lib/storage';

export const accountTypeKeys = {
  all: ['accountTypes'] as const,
};

export function useAccountTypes() {
  return useQuery({
    queryKey: accountTypeKeys.all,
    queryFn: () => localAccountTypeRepo.listCurrent(),
  });
}

// Low-level mutation
export function useAppendAccountType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (v: AccountTypeVersion) => localAccountTypeRepo.append(v),
    onMutate: async (newVersion) => {
      await queryClient.cancelQueries({ queryKey: accountTypeKeys.all });

      const previousAccountTypes = queryClient.getQueryData<AccountTypeVersion[]>(accountTypeKeys.all);

      queryClient.setQueryData<AccountTypeVersion[]>(accountTypeKeys.all, (old) => {
        const allVersions = old ? [...old, newVersion] : [newVersion];
        return resolveAccountTypeCurrent(allVersions);
      });

      return { previousAccountTypes };
    },
    onError: (err, newVersion, context) => {
      if (context?.previousAccountTypes) {
        queryClient.setQueryData(accountTypeKeys.all, context.previousAccountTypes);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: accountTypeKeys.all });
    },
  });
}

// Domain-level mutations
export function useSaveAccountType() {
  const appendAccountType = useAppendAccountType();

  return useMutation({
    mutationFn: async (data: {
      existingAccountType?: AccountTypeVersion;
      name: string;
      isLiability: boolean;
      maxOrder: number;
    }) => {
      const { version, deviceId } = nextVersion();

      if (data.existingAccountType) {
        return appendAccountType.mutateAsync({
          ...data.existingAccountType,
          name: data.name,
          isLiability: data.isLiability,
          version,
        });
      } else {
        const generatedSlug = data.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '');
        const targetAccountTypeId = (generatedSlug || 'account-type') as AccountTypeId;

        return appendAccountType.mutateAsync({
          rowId: generateUuid() as RowId,
          accountTypeId: targetAccountTypeId,
          version,
          deviceId,
          isDeleted: false,
          name: data.name,
          isLiability: data.isLiability,
          order: data.maxOrder + 1,
        });
      }
    },
  });
}

export function useReorderAccountTypes() {
  const appendAccountType = useAppendAccountType();

  return useMutation({
    mutationFn: async (orderedAccountTypes: AccountTypeVersion[]) => {
      const now = Date.now();
      const deviceId = getDeviceId();
      let hlcState = getHlcState();
      
      const mutations = [];

      for (let index = 0; index < orderedAccountTypes.length; index++) {
        const accountType = orderedAccountTypes[index];
        if (accountType.order !== index) {
          const [version, nextState] = nextHLC(now, hlcState, deviceId);
          hlcState = nextState;
          mutations.push(
            appendAccountType.mutateAsync({
              ...accountType,
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

export function useDeleteAccountType() {
  const appendAccountType = useAppendAccountType();

  return useMutation({
    mutationFn: async (accountType: AccountTypeVersion) => {
      const { version } = nextVersion();
      return appendAccountType.mutateAsync({
        ...accountType,
        isDeleted: true,
        version,
      });
    },
  });
}

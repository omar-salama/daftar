import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { RecurrenceRule, resolveCurrentRules } from '@/kernel';
import { localRecurrenceRepo, createRecurrenceRule } from '../repo/localRecurrenceRepo';

export const recurrenceKeys = {
  all: ['recurrence'] as const,
};

export function useRecurrenceRules() {
  return useQuery({
    queryKey: recurrenceKeys.all,
    queryFn: () => localRecurrenceRepo.listCurrent(),
  });
}

export function useRecurrenceRulesAllVersions() {
  return useQuery({
    queryKey: [...recurrenceKeys.all, 'raw'],
    queryFn: () => localRecurrenceRepo.listAll(),
  });
}

export { createRecurrenceRule };

export function useAppendRecurrenceRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (newRule: RecurrenceRule) => localRecurrenceRepo.append(newRule),
    onMutate: async (newRule: RecurrenceRule) => {
      await queryClient.cancelQueries({ queryKey: recurrenceKeys.all });
      const previousRules = queryClient.getQueryData<RecurrenceRule[]>(recurrenceKeys.all);

      queryClient.setQueryData<RecurrenceRule[]>(recurrenceKeys.all, (old) => {
        const existing = old ?? [];
        return resolveCurrentRules([...existing, newRule]);
      });

      return { previousRules };
    },
    onError: (err, newRule, context) => {
      if (context?.previousRules) {
        queryClient.setQueryData(recurrenceKeys.all, context.previousRules);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: recurrenceKeys.all });
    },
  });
}

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CategoryVersion, resolveCategoryCurrent } from '../model';
import { localCategoryRepo } from '../repo';

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: () => localCategoryRepo.listCurrent(),
  });
}

export function useAppendCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (v: CategoryVersion) => localCategoryRepo.append(v),
    onMutate: async (newVersion) => {
      await queryClient.cancelQueries({ queryKey: ['categories'] });

      const previousCategories = queryClient.getQueryData<CategoryVersion[]>(['categories']);

      queryClient.setQueryData<CategoryVersion[]>(['categories'], (old) => {
        const allVersions = old ? [...old, newVersion] : [newVersion];
        return resolveCategoryCurrent(allVersions);
      });

      return { previousCategories };
    },
    onError: (err, newVersion, context) => {
      if (context?.previousCategories) {
        queryClient.setQueryData(['categories'], context.previousCategories);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
}

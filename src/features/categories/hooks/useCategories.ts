import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CategoryId, CategoryType, CategoryVersion, resolveCategoryCurrent } from '../model';
import { localCategoryRepo } from '../repo';
import { nextHLC, RowId } from '@/kernel';
import { generateUuid, getDeviceId, getHlcState, setHlcState } from '@/lib/storage';

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: () => localCategoryRepo.listCurrent(),
  });
}

// Low-level mutation
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

// Domain-level mutations
export function useSaveCategory() {
  const appendCategory = useAppendCategory();

  return useMutation({
    mutationFn: async (data: {
      existingCategory?: CategoryVersion;
      name: string;
      icon: string;
      type: CategoryType;
      maxOrder: number;
      parentId?: string;
    }) => {
      const now = Date.now();
      const deviceId = getDeviceId();
      const hlcState = getHlcState();
      const [version, nextState] = nextHLC(now, hlcState, deviceId);
      setHlcState(nextState);

      if (data.existingCategory) {
        return appendCategory.mutateAsync({
          ...data.existingCategory,
          name: data.name,
          icon: data.icon,
          parentId: data.parentId,
          version,
        });
      } else {
        const generatedSlug = data.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '');
        const targetCategoryId = (generatedSlug || 'category') as CategoryId;

        return appendCategory.mutateAsync({
          rowId: generateUuid() as RowId,
          categoryId: targetCategoryId,
          version,
          deviceId,
          isDeleted: false,
          name: data.name,
          type: data.type,
          icon: data.icon,
          parentId: data.parentId,
          order: data.maxOrder + 1,
        });
      }
    },
  });
}

export function useReorderCategories() {
  const appendCategory = useAppendCategory();

  return useMutation({
    mutationFn: async (orderedCategories: CategoryVersion[]) => {
      const now = Date.now();
      const deviceId = getDeviceId();
      let hlcState = getHlcState();
      
      const mutations = [];

      for (let index = 0; index < orderedCategories.length; index++) {
        const category = orderedCategories[index];
        if (category.order !== index) {
          const [version, nextState] = nextHLC(now, hlcState, deviceId);
          hlcState = nextState;
          mutations.push(
            appendCategory.mutateAsync({
              ...category,
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

export function useDeleteCategory() {
  const appendCategory = useAppendCategory();

  return useMutation({
    mutationFn: async (category: CategoryVersion) => {
      const now = Date.now();
      const deviceId = getDeviceId();
      const hlcState = getHlcState();
      const [version, nextState] = nextHLC(now, hlcState, deviceId);
      setHlcState(nextState);

      return appendCategory.mutateAsync({
        ...category,
        isDeleted: true,
        version,
      });
    },
  });
}

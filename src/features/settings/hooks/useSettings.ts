import { storage } from '@/lib/storage';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

const KEY_MAIN_CURRENCY = 'settings.mainCurrency';

export function getMainCurrency(): string {
  return storage.getString(KEY_MAIN_CURRENCY) || 'EGP';
}

export function setMainCurrency(currency: string): void {
  storage.set(KEY_MAIN_CURRENCY, currency);
}

export const settingsKeys = {
  mainCurrency: ['settings', 'mainCurrency'] as const,
};

export function useMainCurrency() {
  return useQuery({
    queryKey: settingsKeys.mainCurrency,
    queryFn: () => getMainCurrency(),
    initialData: () => getMainCurrency(),
  });
}

export function useSetMainCurrency() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (currency: string) => {
      setMainCurrency(currency);
      return currency;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.mainCurrency });
    },
  });
}

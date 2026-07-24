import { QueryClient } from '@tanstack/react-query';
import type { Persister, PersistedClient } from '@tanstack/react-query-persist-client';
import { rqStorage } from './storage';

// ---------------------------------------------------------------------------
// QueryClient — gcTime set to 7 days so persisted cache survives app restarts
// ---------------------------------------------------------------------------

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Keep data fresh for 5 minutes before considering it stale
      staleTime: 5 * 60 * 1000,
      // Match gcTime to persist duration so eviction and persistence align
      gcTime: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
      // Don't retry aggressively in offline-first mode — outbox handles retries
      retry: 1,
    },
  },
});

// ---------------------------------------------------------------------------
// MMKV-backed synchronous persister
//
// Implements the `Persister` interface from @tanstack/react-query-persist-client
// directly against rqStorage (no additional package needed).
//
// The persisted cache is stored under the 'rq.' prefix in MMKV (RULES.md §5).
// ---------------------------------------------------------------------------

const CACHE_KEY = '__cache__';

export const mmkvPersister: Persister = {
  persistClient(client: PersistedClient): void {
    rqStorage.setItem(CACHE_KEY, JSON.stringify(client));
  },
  restoreClient(): PersistedClient | undefined {
    const raw = rqStorage.getItem(CACHE_KEY);
    if (raw == null) return undefined;
    return JSON.parse(raw) as PersistedClient;
  },
  removeClient(): void {
    rqStorage.removeItem(CACHE_KEY);
  },
};

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import type { ReactNode } from 'react';

export const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, gcTime: 24 * 60 * 60 * 1000, retry: 1 } },
});

const persister = createAsyncStoragePersister({ storage: AsyncStorage });

export function QueryProvider({ children }: { children: ReactNode }) {
  return (
    <PersistQueryClientProvider client={queryClient} persistOptions={{ persister }}>
      {children}
    </PersistQueryClientProvider>
  );
}

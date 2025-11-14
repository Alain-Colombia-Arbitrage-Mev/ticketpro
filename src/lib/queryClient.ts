/**
 * TanStack Query Client Configuration
 * Configuración optimizada para data fetching con cache
 */
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache por 5 minutos
      staleTime: 5 * 60 * 1000,
      // Mantener en cache por 10 minutos (cacheTime en v5, gcTime en v6+)
      cacheTime: 10 * 60 * 1000,
      // Reintentar 3 veces en caso de error
      retry: 3,
      // Retry delay exponencial
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      // Refetch on window focus (útil para datos que cambian frecuentemente)
      refetchOnWindowFocus: false,
      // Refetch on reconnect
      refetchOnReconnect: true,
    },
    mutations: {
      // Retry mutations una vez
      retry: 1,
    },
  },
});


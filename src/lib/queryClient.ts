/**
 * TanStack Query Client Configuration
 * Configuración optimizada para data fetching con cache
 */
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache MUCHO más agresivo: 15 minutos
      staleTime: 15 * 60 * 1000,
      // Mantener en cache por 1 hora
      gcTime: 60 * 60 * 1000,
      // NO reintentar en caso de error (usar fallback inmediato)
      retry: 0,
      // No refetch automático
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      refetchOnMount: false,
      // Usar datos obsoletos mientras se revalida en segundo plano
      refetchInterval: false,
    },
    mutations: {
      // Retry mutations una vez
      retry: 1,
    },
  },
});


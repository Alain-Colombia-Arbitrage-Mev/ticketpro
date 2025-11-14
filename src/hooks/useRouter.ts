/**
 * useRouter Hook - Compatible con la API anterior
 * Usa Zustand store internamente pero mantiene la misma interfaz
 * Inicializa el router automáticamente en el primer uso
 */
import { useEffect } from 'react';
import { useRouterStore } from '../stores/routerStore';

export function useRouter() {
  const { currentPage, pageData, navigate, initialize } = useRouterStore();
  
  // Inicializar el router una vez cuando el hook se monta
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const cleanup = initialize();
      return cleanup;
    }
  }, [initialize]);
  
  return {
    currentPage,
    pageData,
    navigate,
  };
}


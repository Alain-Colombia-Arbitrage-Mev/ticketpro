/**
 * useRouter Hook - Compatible con la API anterior
 * Usa Zustand store internamente pero mantiene la misma interfaz
 * Inicializa el router automáticamente en el primer uso
 */
import { useEffect } from 'react';
import { useRouterStore } from '../stores/routerStore';

// Initialize once globally (not per component mount)
let _initialized = false;

export function useRouter() {
  const { currentPage, pageData, navigate, initialize } = useRouterStore();

  useEffect(() => {
    if (!_initialized && typeof window !== 'undefined') {
      _initialized = true;
      const cleanup = initialize();
      return cleanup;
    }
  }, []);

  return {
    currentPage,
    pageData,
    navigate,
  };
}

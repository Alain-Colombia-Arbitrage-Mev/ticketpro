/**
 * Router Store - Zustand Store para routing
 * Reemplaza Router Context con mejor performance
 */
import { create } from 'zustand';

export type Page = "home" | "events" | "all-events" | "event-detail" | "checkout" | "profile" | "confirmation" | "payment-failed" | "login" | "add-balance" | "wallet" | "terms" | "privacy" | "refund-policy" | "contact" | "validate-ticket" | "my-tickets" | "cart" | "hoster-validate";

interface RouterState {
  currentPage: Page;
  pageData: any;
  navigate: (page: Page, data?: any) => void;
  initialize: () => (() => void) | undefined;
}

export const useRouterStore = create<RouterState>((set) => ({
  currentPage: "home",
  pageData: null,

  navigate: (page: Page, data?: any) => {
    set({ currentPage: page, pageData: data });
    if (typeof window !== 'undefined') {
      // Si hay datos, incluirlos en la URL como query params
      if (data && Object.keys(data).length > 0) {
        const params = new URLSearchParams();
        Object.entries(data).forEach(([key, value]) => {
          if (value !== null && value !== undefined) {
            params.append(key, String(value));
          }
        });
        window.location.hash = `#/${page}?${params.toString()}`;
      } else {
        window.location.hash = `#/${page}`;
      }
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  },

  initialize: () => {
    if (typeof window === 'undefined') return;
    
    const handleHashChange = () => {
      const fullHash = window.location.hash;
      // Remover # y / inicial si existe
      const hashWithParams = fullHash.replace(/^#\/?/, '');
      const hash = hashWithParams.split('?')[0] as Page;
      const validPages: Page[] = ["home", "events", "all-events", "event-detail", "checkout", "profile", "confirmation", "login", "add-balance", "wallet", "terms", "privacy", "refund-policy", "contact", "validate-ticket", "my-tickets", "cart", "hoster-validate", "payment-failed"];

      if (hash && validPages.includes(hash)) {
        // Extraer parámetros de la URL si existen
        const params = new URLSearchParams(hashWithParams.split('?')[1] || '');
        const pageData: any = {};
        params.forEach((value, key) => {
          pageData[key] = value;
        });

        set({
          currentPage: hash,
          pageData: Object.keys(pageData).length > 0 ? pageData : null
        });
      } else {
        set({ currentPage: 'home', pageData: null });
      }
    };

    // Verificar hash inicial
    handleHashChange();

    // Escuchar cambios en el hash
    window.addEventListener('hashchange', handleHashChange);
    window.addEventListener('popstate', handleHashChange);
    
    // Retornar función de cleanup (será manejada por el hook)
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('popstate', handleHashChange);
    };
  },
}));


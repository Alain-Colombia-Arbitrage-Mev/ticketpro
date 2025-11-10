/**
 * Router Store - Zustand Store para routing
 * Reemplaza Router Context con mejor performance
 */
import { create } from 'zustand';

export type Page = "home" | "events" | "all-events" | "event-detail" | "checkout" | "profile" | "confirmation" | "login" | "add-balance" | "wallet" | "terms" | "privacy" | "refund-policy" | "contact" | "validate-ticket" | "my-tickets" | "cart" | "hoster-validate";

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
      window.location.hash = page;
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  },

  initialize: () => {
    if (typeof window === 'undefined') return;
    
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '') as Page;
      const validPages: Page[] = ["home", "events", "all-events", "event-detail", "checkout", "profile", "confirmation", "login", "add-balance", "wallet", "terms", "privacy", "refund-policy", "contact", "validate-ticket", "my-tickets", "cart", "hoster-validate"];
      
      if (hash && validPages.includes(hash)) {
        set({ currentPage: hash });
      }
    };

    // Verificar hash inicial
    handleHashChange();

    // Escuchar cambios en el hash
    window.addEventListener('hashchange', handleHashChange);
    
    // Retornar función de cleanup (será manejada por el hook)
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  },
}));


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

// Flag to prevent hashchange listener from overwriting programmatic navigation
let _programmaticNav = false;

export const useRouterStore = create<RouterState>((set) => ({
  currentPage: "home",
  pageData: null,

  navigate: (page: Page, data?: any) => {
    // Update store state immediately
    set({ currentPage: page, pageData: data ?? null });

    if (typeof window !== 'undefined') {
      // Build the hash URL
      let hash: string;
      if (data && Object.keys(data).length > 0) {
        const params = new URLSearchParams();
        Object.entries(data).forEach(([key, value]) => {
          if (value !== null && value !== undefined) {
            params.append(key, String(value));
          }
        });
        hash = `#/${page}?${params.toString()}`;
      } else {
        hash = `#/${page}`;
      }

      // Mark as programmatic so hashchange listener skips the store update
      _programmaticNav = true;
      window.location.hash = hash;
      // Reset flag after the event loop processes the hashchange
      setTimeout(() => { _programmaticNav = false; }, 0);

      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  },

  initialize: () => {
    if (typeof window === 'undefined') return;

    const validPages: Page[] = ["home", "events", "all-events", "event-detail", "checkout", "profile", "confirmation", "login", "add-balance", "wallet", "terms", "privacy", "refund-policy", "contact", "validate-ticket", "my-tickets", "cart", "hoster-validate", "payment-failed"];

    // Detect path-based URLs (e.g. /all-events) and convert to hash-based (#/all-events)
    // This handles direct navigation or shared links without the hash prefix
    const convertPathToHash = () => {
      const pathname = window.location.pathname;
      // Remove leading slash to get the page name
      const pathPage = pathname.replace(/^\//, '').split('?')[0] as Page;

      if (pathPage && validPages.includes(pathPage)) {
        // Preserve any query params from the original URL
        const search = window.location.search;
        const hashUrl = search
          ? `#/${pathPage}${search}`
          : `#/${pathPage}`;

        // Replace the URL so the browser doesn't keep the bad path
        _programmaticNav = true;
        window.history.replaceState(null, '', '/' + hashUrl);
        setTimeout(() => { _programmaticNav = false; }, 0);
        return true;
      }
      return false;
    };

    const handleHashChange = () => {
      // Skip if this was triggered by navigate() — state is already correct
      if (_programmaticNav) return;

      const fullHash = window.location.hash;
      const hashWithParams = fullHash.replace(/^#\/?/, '');
      const hash = hashWithParams.split('?')[0] as Page;

      if (hash && validPages.includes(hash)) {
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

    // On initial load: convert path-based URL to hash if needed
    convertPathToHash();

    // Parse initial hash on load
    handleHashChange();

    window.addEventListener('hashchange', handleHashChange);
    window.addEventListener('popstate', handleHashChange);

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('popstate', handleHashChange);
    };
  },
}));

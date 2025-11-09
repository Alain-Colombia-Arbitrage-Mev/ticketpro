import { createContext, useContext, useState, ReactNode, useEffect } from "react";

// Tipos de páginas disponibles en la aplicación
export type Page = "home" | "events" | "all-events" | "event-detail" | "checkout" | "profile" | "confirmation" | "login" | "add-balance" | "wallet" | "terms" | "privacy" | "refund-policy" | "contact";

interface RouterContextType {
  currentPage: Page;
  navigate: (page: Page, data?: any) => void;
  pageData: any;
}

const RouterContext = createContext<RouterContextType | undefined>(undefined);

export function RouterProvider({ children }: { children: ReactNode }) {
  const [currentPage, setCurrentPage] = useState<Page>("home");
  const [pageData, setPageData] = useState<any>(null);

  const navigate = (page: Page, data?: any) => {
    setCurrentPage(page);
    setPageData(data);
    window.location.hash = page;
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Detectar cambios en el hash de la URL
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '') as Page;
      const validPages: Page[] = ["home", "events", "all-events", "event-detail", "checkout", "profile", "confirmation", "login", "add-balance", "wallet", "terms", "privacy", "refund-policy", "contact"];
      if (hash && validPages.includes(hash)) {
        setCurrentPage(hash);
      }
    };

    // Verificar hash inicial
    handleHashChange();

    // Escuchar cambios en el hash
    window.addEventListener('hashchange', handleHashChange);

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  return (
    <RouterContext.Provider value={{ currentPage, navigate, pageData }}>
      {children}
    </RouterContext.Provider>
  );
}

export function useRouter() {
  const context = useContext(RouterContext);
  if (!context) {
    throw new Error("useRouter must be used within RouterProvider");
  }
  return context;
}

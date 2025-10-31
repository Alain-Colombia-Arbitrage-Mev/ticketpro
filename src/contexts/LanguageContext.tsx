import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Language = 'es' | 'en' | 'pt';

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Translations dictionary
const translations: Record<Language, Record<string, string>> = {
  es: {
    // Navigation
    'nav.home': 'Inicio',
    'nav.events': 'Eventos',
    'nav.profile': 'Mi Perfil',
    'nav.login': 'Iniciar Sesión',
    'nav.logout': 'Cerrar Sesión',
    'nav.balance': 'Saldo',
    
    // Hero Section
    'hero.title': 'Vive la Experiencia de tus Eventos Favoritos',
    'hero.subtitle': 'Miles de eventos, un solo lugar. Compra tus boletos de forma segura y rápida.',
    'hero.search.placeholder': 'Buscar eventos, artistas, equipos...',
    'hero.search.button': 'Buscar Eventos',
    'hero.search.city': 'Todas las ciudades',
    
    // Categories
    'category.concerts': 'Conciertos',
    'category.sports': 'Deportes',
    'category.theater': 'Teatro',
    'category.family': 'Familia',
    
    // Event Card
    'event.from': 'Desde',
    'event.buy': 'Comprar Boletos',
    'event.sold_out': 'Agotado',
    'event.featured': 'Destacado',
    'event.trending': 'Trending',
    'event.last_tickets': 'Últimas entradas',
    
    // Currency
    'currency.preferred': 'Moneda Preferida',
    'currency.select': 'Seleccionar Moneda',
    
    // Language
    'language.select': 'Seleccionar Idioma',
    'language.spanish': 'Español',
    'language.english': 'English',
    'language.portuguese': 'Português',
    
    // Balance
    'balance.title': 'Mi Saldo',
    'balance.add': 'Agregar Saldo',
    'balance.total': 'Saldo Total',
    
    // Common
    'common.loading': 'Cargando...',
    'common.error': 'Error',
    'common.success': 'Éxito',
    'common.cancel': 'Cancelar',
    'common.confirm': 'Confirmar',
    'common.save': 'Guardar',
    'common.back': 'Volver',
    'common.next': 'Siguiente',
    'common.previous': 'Anterior',
  },
  
  en: {
    // Navigation
    'nav.home': 'Home',
    'nav.events': 'Events',
    'nav.profile': 'My Profile',
    'nav.login': 'Sign In',
    'nav.logout': 'Sign Out',
    'nav.balance': 'Balance',
    
    // Hero Section
    'hero.title': 'Experience Your Favorite Events',
    'hero.subtitle': 'Thousands of events, one place. Buy your tickets securely and quickly.',
    'hero.search.placeholder': 'Search events, artists, teams...',
    'hero.search.button': 'Search Events',
    'hero.search.city': 'All cities',
    
    // Categories
    'category.concerts': 'Concerts',
    'category.sports': 'Sports',
    'category.theater': 'Theater',
    'category.family': 'Family',
    
    // Event Card
    'event.from': 'From',
    'event.buy': 'Buy Tickets',
    'event.sold_out': 'Sold Out',
    'event.featured': 'Featured',
    'event.trending': 'Trending',
    'event.last_tickets': 'Last tickets',
    
    // Currency
    'currency.preferred': 'Preferred Currency',
    'currency.select': 'Select Currency',
    
    // Language
    'language.select': 'Select Language',
    'language.spanish': 'Español',
    'language.english': 'English',
    'language.portuguese': 'Português',
    
    // Balance
    'balance.title': 'My Balance',
    'balance.add': 'Add Balance',
    'balance.total': 'Total Balance',
    
    // Common
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.success': 'Success',
    'common.cancel': 'Cancel',
    'common.confirm': 'Confirm',
    'common.save': 'Save',
    'common.back': 'Back',
    'common.next': 'Next',
    'common.previous': 'Previous',
  },
  
  pt: {
    // Navigation
    'nav.home': 'Início',
    'nav.events': 'Eventos',
    'nav.profile': 'Meu Perfil',
    'nav.login': 'Entrar',
    'nav.logout': 'Sair',
    'nav.balance': 'Saldo',
    
    // Hero Section
    'hero.title': 'Viva a Experiência dos Seus Eventos Favoritos',
    'hero.subtitle': 'Milhares de eventos, um só lugar. Compre seus ingressos com segurança e rapidez.',
    'hero.search.placeholder': 'Pesquisar eventos, artistas, times...',
    'hero.search.button': 'Pesquisar Eventos',
    'hero.search.city': 'Todas as cidades',
    
    // Categories
    'category.concerts': 'Shows',
    'category.sports': 'Esportes',
    'category.theater': 'Teatro',
    'category.family': 'Família',
    
    // Event Card
    'event.from': 'A partir de',
    'event.buy': 'Comprar Ingressos',
    'event.sold_out': 'Esgotado',
    'event.featured': 'Destaque',
    'event.trending': 'Em alta',
    'event.last_tickets': 'Últimos ingressos',
    
    // Currency
    'currency.preferred': 'Moeda Preferida',
    'currency.select': 'Selecionar Moeda',
    
    // Language
    'language.select': 'Selecionar Idioma',
    'language.spanish': 'Español',
    'language.english': 'English',
    'language.portuguese': 'Português',
    
    // Balance
    'balance.title': 'Meu Saldo',
    'balance.add': 'Adicionar Saldo',
    'balance.total': 'Saldo Total',
    
    // Common
    'common.loading': 'Carregando...',
    'common.error': 'Erro',
    'common.success': 'Sucesso',
    'common.cancel': 'Cancelar',
    'common.confirm': 'Confirmar',
    'common.save': 'Salvar',
    'common.back': 'Voltar',
    'common.next': 'Próximo',
    'common.previous': 'Anterior',
  },
};

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('preferred-language');
    return (saved as Language) || 'es';
  });

  useEffect(() => {
    localStorage.setItem('preferred-language', language);
  }, [language]);

  const setLanguage = (newLanguage: Language) => {
    setLanguageState(newLanguage);
  };

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

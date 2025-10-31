/**
 * Language Store - Zustand Store para i18n
 * Reemplaza LanguageContext con mejor performance
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Language = 'es' | 'en' | 'pt';

// Translations dictionary - Exportado para uso en hooks
export const translations: Record<Language, Record<string, string>> = {
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
    
    // Pages
    'page.events.available': 'Eventos Disponibles',
    'page.events.featured': 'Eventos Destacados',
    'page.events.upcoming': 'Próximos Eventos',
    'page.events.view_all': 'Ver Todos los Eventos',
    'page.organizers.title': '¿Organizas Eventos?',
    'page.organizers.subtitle': 'Transforma tu evento en una experiencia inolvidable. Vende tickets, gestiona asistentes y maximiza tus ingresos con nuestra plataforma profesional.',
    'page.organizers.badge': 'Para Organizadores',
    'page.organizers.create_event': 'Crear mi Primer Evento',
    'page.organizers.how_it_works': 'Ver Cómo Funciona',
    'page.organizers.stats.tickets': 'Tickets Vendidos',
    'page.organizers.stats.events': 'Eventos Exitosos',
    'page.organizers.stats.satisfaction': 'Satisfacción',
    'page.profile.view': 'Ver Mi Perfil',
    'page.profile.explore': 'Explorar Eventos',
    'page.confirmation.back_home': 'Volver al Inicio',
    'page.event.buy_tickets': 'Comprar Tickets',
    
    // Navigation categories
    'nav.category.concerts': 'Conciertos',
    'nav.category.sports': 'Deportes',
    'nav.category.theater': 'Teatro',
    'nav.category.family': 'Familia',
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
    
    // Pages
    'page.events.available': 'Available Events',
    'page.events.featured': 'Featured Events',
    'page.events.upcoming': 'Upcoming Events',
    'page.events.view_all': 'View All Events',
    'page.organizers.title': 'Do You Organize Events?',
    'page.organizers.subtitle': 'Transform your event into an unforgettable experience. Sell tickets, manage attendees and maximize your revenue with our professional platform.',
    'page.organizers.badge': 'For Organizers',
    'page.organizers.create_event': 'Create My First Event',
    'page.organizers.how_it_works': 'See How It Works',
    'page.organizers.stats.tickets': 'Tickets Sold',
    'page.organizers.stats.events': 'Successful Events',
    'page.organizers.stats.satisfaction': 'Satisfaction',
    'page.profile.view': 'View My Profile',
    'page.profile.explore': 'Explore Events',
    'page.confirmation.back_home': 'Back to Home',
    'page.event.buy_tickets': 'Buy Tickets',
    
    // Navigation categories
    'nav.category.concerts': 'Concerts',
    'nav.category.sports': 'Sports',
    'nav.category.theater': 'Theater',
    'nav.category.family': 'Family',
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
    
    // Pages
    'page.events.available': 'Eventos Disponíveis',
    'page.events.featured': 'Eventos em Destaque',
    'page.events.upcoming': 'Próximos Eventos',
    'page.events.view_all': 'Ver Todos os Eventos',
    'page.organizers.title': 'Você Organiza Eventos?',
    'page.organizers.subtitle': 'Transforme seu evento em uma experiência inesquecível. Venda ingressos, gerencie participantes e maximize sua receita com nossa plataforma profissional.',
    'page.organizers.badge': 'Para Organizadores',
    'page.organizers.create_event': 'Criar Meu Primeiro Evento',
    'page.organizers.how_it_works': 'Ver Como Funciona',
    'page.organizers.stats.tickets': 'Ingressos Vendidos',
    'page.organizers.stats.events': 'Eventos Bem-sucedidos',
    'page.organizers.stats.satisfaction': 'Satisfação',
    'page.profile.view': 'Ver Meu Perfil',
    'page.profile.explore': 'Explorar Eventos',
    'page.confirmation.back_home': 'Voltar ao Início',
    'page.event.buy_tickets': 'Comprar Ingressos',
    
    // Navigation categories
    'nav.category.concerts': 'Shows',
    'nav.category.sports': 'Esportes',
    'nav.category.theater': 'Teatro',
    'nav.category.family': 'Família',
  },
};

interface LanguageState {
  language: Language;
  setLanguage: (language: Language) => void;
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      language: 'es',
      
      setLanguage: (language) => set({ language }),
    }),
    {
      name: 'language-storage',
      // Verificar que localStorage esté disponible (SSR safe)
      storage: typeof window !== 'undefined' ? localStorage : undefined,
    }
  )
);


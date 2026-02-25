import { useQuery } from '@tanstack/react-query';
import { getSupabaseClient } from '../utils/supabase/client';
import { mockEvents } from '../data/mockEvents';

// Tipo de evento de la BD
export interface EventFromDB {
  id: number;
  title: string;
  date: string; // ISO date
  time?: string;
  location: string;
  category: string;
  description?: string;
  image_url: string;
  base_price: number;
  currency: string;
  featured: boolean;
  trending: boolean;
  sold_out: boolean;
  last_tickets: boolean;
  is_active: boolean;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

// Tipo de evento formateado (compatible con mockEvents)
export interface Event {
  id: number;
  title: string;
  date: string; // Display format: "15 de Noviembre, 2025"
  location: string;
  price: string; // Display format: "$60 USD"
  image: string;
  category: string;
  featured?: boolean;
  trending?: boolean;
  soldOut?: boolean;
  lastTickets?: boolean;
}

// Flag para alternar entre BD y mock (útil para desarrollo)
const USE_DATABASE = import.meta.env.VITE_USE_DATABASE !== 'false'; // true por defecto

/**
 * Formatea fecha de ISO a display format
 * "2025-11-15" -> "15 de Noviembre, 2025"
 * IMPORTANTE: Parsea directamente sin usar new Date() para evitar problemas de timezone
 */
function formatDateFromISO(isoDate: string): string {
  const months: Record<number, string> = {
    1: 'Enero', 2: 'Febrero', 3: 'Marzo', 4: 'Abril',
    5: 'Mayo', 6: 'Junio', 7: 'Julio', 8: 'Agosto',
    9: 'Septiembre', 10: 'Octubre', 11: 'Noviembre', 12: 'Diciembre'
  };
  
  // Parsear directamente: "2025-12-13" -> [2025, 12, 13]
  const [year, month, day] = isoDate.split('T')[0].split('-').map(Number);
  
  return `${day} de ${months[month]}, ${year}`;
}

/**
 * Formatea precio de número a string display
 * 60 -> "$60 USD"
 */
function formatPrice(price: number, currency: string = 'USD'): string {
  return `$${price.toLocaleString('es-MX')} ${currency}`;
}

/**
 * Convierte evento de BD a formato display (compatible con mockEvents)
 */
function convertEventFromDB(dbEvent: EventFromDB): Event {
  return {
    id: dbEvent.id,
    title: dbEvent.title,
    date: formatDateFromISO(dbEvent.date),
    location: dbEvent.location,
    price: formatPrice(dbEvent.base_price, dbEvent.currency),
    image: dbEvent.image_url,
    category: dbEvent.category,
    featured: dbEvent.featured,
    trending: dbEvent.trending,
    soldOut: dbEvent.sold_out,
    lastTickets: dbEvent.last_tickets,
  };
}

/**
 * Hook principal para obtener eventos
 * Usa BD si está disponible, sino usa mockEvents
 * El evento prioritario (id: 1 - Open Salinas) siempre aparece primero
 */
export function useEvents() {
  return useQuery({
    queryKey: ['events'],
    queryFn: async () => {
      // Si no se debe usar BD, retornar mockEvents directamente
      if (!USE_DATABASE) {
        console.log('📦 Usando mockEvents (modo desarrollo)');
        return mockEvents;
      }

      try {
        const supabase = getSupabaseClient();

        // Optimización AGRESIVA: Seleccionar solo campos esenciales y ordenar en BD
        const { data, error } = await supabase
          .from('events')
          .select('id, title, date, location, category, image_url, base_price, currency, featured, trending, sold_out, last_tickets')
          .eq('is_active', true)
          .not('title', 'ilike', '%navidad%') // Excluir eventos de Navidad (desactivados)
          .order('featured', { ascending: false }) // Featured primero
          .order('id', { ascending: true }) // Luego por ID
          .limit(50); // Limitar a 50 eventos máximo para cargar más rápido

        if (error) {
          console.error('❌ Error fetching events from DB:', error);
          console.log('📦 Fallback a mockEvents');
          return mockEvents;
        }

        if (!data || data.length === 0) {
          console.warn('⚠️ No hay eventos en BD, usando mockEvents');
          return mockEvents;
        }

        console.log(`✅ ${data.length} eventos cargados desde BD`);

        // Convertir eventos y ordenar con evento prioritario primero
        const convertedEvents = data.map(convertEventFromDB);

        // Ordenamiento personalizado: evento prioritario (id: 1) primero
        const sortedEvents = convertedEvents.sort((a, b) => {
          const isPriorityA = a.id === 1;
          const isPriorityB = b.id === 1;

          if (isPriorityA && !isPriorityB) return -1;
          if (!isPriorityA && isPriorityB) return 1;

          // Para el resto: featured primero, luego por fecha descendente
          if (a.featured !== b.featured) {
            return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
          }

          return 0;
        });

        return sortedEvents;
      } catch (error) {
        console.error('❌ Error conectando a BD:', error);
        console.log('📦 Fallback a mockEvents');
        return mockEvents;
      }
    },
    staleTime: 10 * 60 * 1000, // 10 minutos - cache más agresivo
    gcTime: 30 * 60 * 1000, // 30 minutos - mantener en cache más tiempo
    retry: 0, // NO reintentar, usar fallback inmediatamente si falla
    refetchOnWindowFocus: false, // No refetch al enfocar ventana
    refetchOnMount: false, // No refetch al montar si hay datos en cache
    refetchOnReconnect: false, // No refetch al reconectar internet
  });
}

/**
 * Hook para obtener eventos por categoría
 * El evento prioritario (id: 1 - Open Salinas) siempre aparece primero
 */
export function useEventsByCategory(category?: string) {
  return useQuery({
    queryKey: ['events', 'category', category],
    queryFn: async () => {
      if (!USE_DATABASE) {
        const filtered = category && category !== 'all'
          ? mockEvents.filter(e => e.category === category)
          : mockEvents;
        return filtered;
      }

      try {
        const supabase = getSupabaseClient();

        // Optimización AGRESIVA: Solo campos esenciales, ordenar en BD
        let query = supabase
          .from('events')
          .select('id, title, date, location, category, image_url, base_price, currency, featured, trending, sold_out, last_tickets')
          .eq('is_active', true)
          .not('title', 'ilike', '%navidad%') // Excluir eventos de Navidad (desactivados)
          .order('featured', { ascending: false })
          .order('id', { ascending: true })
          .limit(50); // Limitar a 50 eventos

        if (category && category !== 'all') {
          query = query.eq('category', category);
        }

        const { data, error } = await query;

        if (error) throw error;

        if (!data) return mockEvents;

        // Convertir eventos
        const convertedEvents = data.map(convertEventFromDB);

        // Ordenamiento personalizado: evento prioritario (id: 1) primero
        const sortedEvents = convertedEvents.sort((a, b) => {
          const isPriorityA = a.id === 1;
          const isPriorityB = b.id === 1;

          if (isPriorityA && !isPriorityB) return -1;
          if (!isPriorityA && isPriorityB) return 1;

          return 0;
        });

        return sortedEvents;
      } catch (error) {
        console.error('Error fetching events by category:', error);
        const filtered = category && category !== 'all'
          ? mockEvents.filter(e => e.category === category)
          : mockEvents;
        return filtered;
      }
    },
    staleTime: 10 * 60 * 1000, // 10 minutos - cache más agresivo
    gcTime: 30 * 60 * 1000, // 30 minutos
    retry: 0, // NO reintentar
    enabled: category !== undefined,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });
}

/**
 * Hook para obtener un evento específico por ID
 */
export function useEvent(id: number) {
  return useQuery({
    queryKey: ['events', id],
    queryFn: async () => {
      if (!USE_DATABASE) {
        const event = mockEvents.find(e => e.id === id);
        if (!event) throw new Error('Evento no encontrado');
        return event;
      }

      try {
        const supabase = getSupabaseClient();
        
        // Optimización: Seleccionar solo campos necesarios
        const { data, error } = await supabase
          .from('events')
          .select('id, title, date, location, category, image_url, base_price, currency, featured, trending, sold_out, last_tickets')
          .eq('id', id)
          .maybeSingle(); // Más rápido que .single()
        
        if (error) throw error;
        if (!data) throw new Error('Evento no encontrado');
        
        return convertEventFromDB(data);
      } catch (error) {
        console.error('Error fetching event:', error);
        const event = mockEvents.find(e => e.id === id);
        if (!event) throw new Error('Evento no encontrado');
        return event;
      }
    },
    staleTime: 10 * 60 * 1000, // 10 minutos
    gcTime: 30 * 60 * 1000, // 30 minutos
    retry: 0, // NO reintentar
    enabled: !!id,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });
}

/**
 * Hook para verificar si se está usando la BD o mockEvents
 */
export function useEventsSource() {
  return {
    usingDatabase: USE_DATABASE,
    source: USE_DATABASE ? 'database' : 'mock',
  };
}



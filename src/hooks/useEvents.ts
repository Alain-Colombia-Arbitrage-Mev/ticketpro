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
 */
function formatDateFromISO(isoDate: string): string {
  const date = new Date(isoDate);
  const months: Record<number, string> = {
    0: 'Enero', 1: 'Febrero', 2: 'Marzo', 3: 'Abril',
    4: 'Mayo', 5: 'Junio', 6: 'Julio', 7: 'Agosto',
    8: 'Septiembre', 9: 'Octubre', 10: 'Noviembre', 11: 'Diciembre'
  };
  
  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  
  return `${day} de ${month}, ${year}`;
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
 * Los eventos NAVIDAD (21, 22) siempre aparecen primero
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
        
        const { data, error } = await supabase
          .from('events')
          .select('*')
          .eq('is_active', true);
        
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
        
        // Convertir eventos y ordenar con NAVIDAD primero
        const convertedEvents = data.map(convertEventFromDB);
        
        // Ordenamiento personalizado: NAVIDAD (21, 22) primero, luego el resto
        const sortedEvents = convertedEvents.sort((a, b) => {
          // Eventos NAVIDAD (21, 22) van primero
          const isNavidadA = a.id === 21 || a.id === 22;
          const isNavidadB = b.id === 21 || b.id === 22;
          
          if (isNavidadA && !isNavidadB) return -1;
          if (!isNavidadA && isNavidadB) return 1;
          
          // Entre eventos NAVIDAD, 21 va antes que 22
          if (isNavidadA && isNavidadB) {
            return a.id - b.id;
          }
          
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
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
    retry: 1, // Solo 1 reintento antes de usar fallback
  });
}

/**
 * Hook para obtener eventos por categoría
 * Los eventos NAVIDAD (21, 22) siempre aparecen primero
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
        
        let query = supabase
          .from('events')
          .select('*')
          .eq('is_active', true);
        
        if (category && category !== 'all') {
          query = query.eq('category', category);
        }
        
        const { data, error } = await query;
        
        if (error) throw error;
        
        if (!data) return mockEvents;
        
        // Convertir eventos
        const convertedEvents = data.map(convertEventFromDB);
        
        // Ordenamiento personalizado: NAVIDAD (21, 22) primero
        const sortedEvents = convertedEvents.sort((a, b) => {
          // Eventos NAVIDAD (21, 22) van primero
          const isNavidadA = a.id === 21 || a.id === 22;
          const isNavidadB = b.id === 21 || b.id === 22;
          
          if (isNavidadA && !isNavidadB) return -1;
          if (!isNavidadA && isNavidadB) return 1;
          
          // Entre eventos NAVIDAD, 21 va antes que 22
          if (isNavidadA && isNavidadB) {
            return a.id - b.id;
          }
          
          // Para el resto: por fecha ascendente
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
    staleTime: 5 * 60 * 1000,
    enabled: category !== undefined,
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
        
        const { data, error } = await supabase
          .from('events')
          .select('*')
          .eq('id', id)
          .single();
        
        if (error) throw error;
        
        return convertEventFromDB(data);
      } catch (error) {
        console.error('Error fetching event:', error);
        const event = mockEvents.find(e => e.id === id);
        if (!event) throw new Error('Evento no encontrado');
        return event;
      }
    },
    enabled: !!id,
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



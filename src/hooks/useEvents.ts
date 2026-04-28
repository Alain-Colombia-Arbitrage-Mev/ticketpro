import { useQuery } from '@tanstack/react-query';
import { getSupabaseClient } from '../utils/supabase/client';

export interface EventFromDB {
  id: number;
  title: string;
  date: string;
  time?: string;
  location: string;
  category: string;
  description?: string;
  image_url: string;
  image_slider_url?: string | null;
  image_card_url?: string | null;
  image_detail_url?: string | null;
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

export interface Event {
  id: number;
  title: string;
  date: string;
  location: string;
  price: string;
  image: string;
  imageSlider?: string;
  imageCard?: string;
  imageDetail?: string;
  category: string;
  featured?: boolean;
  trending?: boolean;
  soldOut?: boolean;
  lastTickets?: boolean;
}

const EVENT_SELECT = 'id, title, date, location, category, image_url, image_slider_url, image_card_url, image_detail_url, base_price, currency, featured, trending, sold_out, last_tickets';

function formatDateFromISO(isoDate: string): string {
  const months: Record<number, string> = {
    1: 'Enero', 2: 'Febrero', 3: 'Marzo', 4: 'Abril',
    5: 'Mayo', 6: 'Junio', 7: 'Julio', 8: 'Agosto',
    9: 'Septiembre', 10: 'Octubre', 11: 'Noviembre', 12: 'Diciembre'
  };
  const [year, month, day] = isoDate.split('T')[0].split('-').map(Number);
  return `${day} de ${months[month]}, ${year}`;
}

function formatPrice(price: number, currency: string = 'USD'): string {
  return `$${price.toLocaleString('es-MX')} ${currency}`;
}

function convertEventFromDB(dbEvent: EventFromDB): Event {
  const card   = dbEvent.image_card_url   || dbEvent.image_url || "";
  const slider = dbEvent.image_slider_url || dbEvent.image_url || "";
  const detail = dbEvent.image_detail_url || dbEvent.image_url || "";
  return {
    id: dbEvent.id,
    title: dbEvent.title,
    date: formatDateFromISO(dbEvent.date),
    location: dbEvent.location,
    price: formatPrice(dbEvent.base_price, dbEvent.currency),
    image: card,
    imageSlider: slider,
    imageCard: card,
    imageDetail: detail,
    category: dbEvent.category,
    featured: dbEvent.featured,
    trending: dbEvent.trending,
    soldOut: dbEvent.sold_out,
    lastTickets: dbEvent.last_tickets,
  };
}

export function useEvents() {
  return useQuery({
    queryKey: ['events'],
    queryFn: async (): Promise<Event[]> => {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('events')
        .select(EVENT_SELECT)
        .eq('is_active', true)
        .order('featured', { ascending: false })
        .order('id', { ascending: true })
        .limit(50);

      if (error) throw error;
      return ((data ?? []) as EventFromDB[]).map(convertEventFromDB);
    },
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    retry: 1,
    refetchOnWindowFocus: false,
  });
}

export function useEventsByCategory(category?: string) {
  return useQuery({
    queryKey: ['events', 'category', category],
    queryFn: async (): Promise<Event[]> => {
      const supabase = getSupabaseClient();
      let q = supabase
        .from('events')
        .select(EVENT_SELECT)
        .eq('is_active', true)
        .order('featured', { ascending: false })
        .order('id', { ascending: true })
        .limit(50);

      if (category && category !== 'all') q = q.eq('category', category);

      const { data, error } = await q;
      if (error) throw error;
      return ((data ?? []) as EventFromDB[]).map(convertEventFromDB);
    },
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    retry: 1,
    enabled: category !== undefined,
    refetchOnWindowFocus: false,
  });
}

export function useEvent(id: number) {
  return useQuery({
    queryKey: ['events', id],
    queryFn: async (): Promise<Event> => {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('events')
        .select(EVENT_SELECT)
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error('Evento no encontrado');
      return convertEventFromDB(data as EventFromDB);
    },
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    retry: 1,
    enabled: !!id,
    refetchOnWindowFocus: false,
  });
}

export function useFeaturedEvents() {
  const { data, ...rest } = useEvents();
  return {
    ...rest,
    data: (data ?? []).filter((e) => e.featured),
  };
}

export function useEventsSource() {
  return { usingDatabase: true, source: 'database' as const };
}

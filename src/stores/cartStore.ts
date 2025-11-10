/**
 * Cart Store - Zustand Store para el carrito de compras
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  id: string;
  eventId: string | number;
  eventName: string;
  eventDate: string;
  eventTime?: string;
  eventLocation?: string;
  eventImage?: string;
  ticketType: string;
  ticketPrice: number;
  quantity: number;
  subtotal: number;
  serviceFee: number;
  total: number;
  seatNumber?: string;
  seatType?: string;
  ticketCategoryId?: number;
}

interface CartState {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'id' | 'subtotal' | 'serviceFee' | 'total'>) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  updateTicketType: (id: string, ticketType: string, ticketPrice: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) => {
        const items = get().items;
        const existingItemIndex = items.findIndex(
          (i) => 
            i.eventId === item.eventId && 
            i.ticketType === item.ticketType &&
            i.seatNumber === item.seatNumber
        );

        if (existingItemIndex >= 0) {
          // Si el item ya existe, actualizar cantidad
          const existingItem = items[existingItemIndex];
          const newQuantity = existingItem.quantity + item.quantity;
          const subtotal = item.ticketPrice * newQuantity;
          const serviceFee = Math.round(subtotal * 0.1);
          const total = subtotal + serviceFee;

          const updatedItems = [...items];
          updatedItems[existingItemIndex] = {
            ...existingItem,
            quantity: newQuantity,
            subtotal,
            serviceFee,
            total,
          };
          set({ items: updatedItems });
        } else {
          // Agregar nuevo item
          const subtotal = item.ticketPrice * item.quantity;
          const serviceFee = Math.round(subtotal * 0.1);
          const total = subtotal + serviceFee;

          const newItem: CartItem = {
            ...item,
            id: crypto.randomUUID(),
            subtotal,
            serviceFee,
            total,
          };
          set({ items: [...items, newItem] });
        }
      },

      removeItem: (id) => {
        set({ items: get().items.filter((item) => item.id !== id) });
      },

      updateQuantity: (id, quantity) => {
        if (quantity <= 0) {
          get().removeItem(id);
          return;
        }

        const items = get().items;
        const itemIndex = items.findIndex((i) => i.id === id);
        if (itemIndex >= 0) {
          const item = items[itemIndex];
          const subtotal = item.ticketPrice * quantity;
          const serviceFee = Math.round(subtotal * 0.1);
          const total = subtotal + serviceFee;

          const updatedItems = [...items];
          updatedItems[itemIndex] = {
            ...item,
            quantity,
            subtotal,
            serviceFee,
            total,
          };
          set({ items: updatedItems });
        }
      },

      updateTicketType: (id, ticketType, ticketPrice) => {
        const items = get().items;
        const itemIndex = items.findIndex((i) => i.id === id);
        if (itemIndex >= 0) {
          const item = items[itemIndex];
          const subtotal = ticketPrice * item.quantity;
          const serviceFee = Math.round(subtotal * 0.1);
          const total = subtotal + serviceFee;

          const updatedItems = [...items];
          updatedItems[itemIndex] = {
            ...item,
            ticketType,
            ticketPrice,
            subtotal,
            serviceFee,
            total,
          };
          set({ items: updatedItems });
        }
      },

      clearCart: () => {
        set({ items: [] });
      },

      getTotalItems: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0);
      },

      getTotalPrice: () => {
        return get().items.reduce((sum, item) => sum + item.total, 0);
      },
    }),
    {
      name: 'cart-storage',
      storage: typeof window !== 'undefined' ? localStorage : undefined,
    }
  )
);


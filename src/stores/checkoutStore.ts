/**
 * Checkout Store - Persist checkout information independently
 * Información de checkout persistida independientemente del carrito
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CheckoutInfo {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

interface CheckoutState {
  checkoutInfo: Partial<CheckoutInfo>;
  setCheckoutInfo: (info: Partial<CheckoutInfo>) => void;
  updateField: (field: keyof CheckoutInfo, value: string) => void;
  clearCheckoutInfo: () => void;
  isAddressComplete: () => boolean;
}

export const useCheckoutStore = create<CheckoutState>()(
  persist(
    (set, get) => ({
      checkoutInfo: {},

      setCheckoutInfo: (info) => {
        const updated = { ...get().checkoutInfo, ...info };
        console.log('✅ Checkout Info Updated:', updated);
        set({ checkoutInfo: updated });
      },

      updateField: (field, value) => {
        const updated = {
          ...get().checkoutInfo,
          [field]: value,
        };
        console.log(`✅ Field Updated [${field}]:`, value);
        set({ checkoutInfo: updated });
      },

      clearCheckoutInfo: () => {
        console.log('🗑️ Clearing checkout info');
        set({ checkoutInfo: {} });
      },

      isAddressComplete: () => {
        const info = get().checkoutInfo;
        return !!(
          info.address &&
          info.city &&
          info.state &&
          info.zipCode &&
          info.country
        );
      },
    }),
    {
      name: 'checkout-storage',
    }
  )
);


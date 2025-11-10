/**
 * Auth Store - Zustand Store para autenticación
 * Reemplaza AuthContext con mejor performance y menos boilerplate
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createClient } from '@supabase/supabase-js';
import { projectUrl, publicAnonKey } from '../utils/supabase/info';
import { api, User } from '../utils/api';

// Cliente de Supabase para acciones de autenticación
const supabase = createClient(
  projectUrl,
  publicAnonKey
);

interface AuthState {
  user: User | null;
  loading: boolean;
  // Actions
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  sendMagicLink: (email: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      loading: true,

      setUser: (user) => set({ user }),
      setLoading: (loading) => set({ loading }),

      refreshUser: async () => {
        try {
          const { user: userProfile } = await api.getProfile();
          set({ user: userProfile });
        } catch (error) {
          console.error('Error refreshing user:', error);
          set({ user: null });
        }
      },

      signIn: async (email: string, password: string) => {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        if (data.session?.access_token) {
          api.setAccessToken(data.session.access_token);
          const { user: userProfile } = await api.getProfile();
          set({ user: userProfile });
        }
      },

      signUp: async (email: string, password: string, name: string) => {
        await api.signup(email, password, name);
        await get().signIn(email, password);
      },

      signOut: async () => {
        await supabase.auth.signOut();
        api.setAccessToken(null);
        set({ user: null });
      },

      sendMagicLink: async (email: string) => {
        await api.sendMagicLink(email);
      },

      forgotPassword: async (email: string) => {
        await api.forgotPassword(email);
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user }), // Solo persistir user, no loading
      // Verificar que localStorage esté disponible (SSR safe)
      storage: typeof window !== 'undefined' ? localStorage : undefined,
    }
  )
);


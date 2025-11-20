/**
 * Auth Store - Zustand Store para autenticación
 * Reemplaza AuthContext con mejor performance y menos boilerplate
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../utils/supabase/client';
import { api, User } from '../utils/api';

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
        } catch (error: any) {
          console.warn('⚠️ No se pudo refrescar perfil del backend:', error?.message);
          
          // Si el perfil no existe en backend, intentar obtener info de la sesión de Supabase + dirección de profiles
          try {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
              // ⚡ Intentar obtener dirección de profiles
              let profileData: any = null;
              try {
                const { data } = await supabase
                  .from('profiles')
                  .select('address, city, state, zip_code, country')
                  .eq('id', session.user.id)
                  .maybeSingle();
                
                profileData = data;
                if (profileData?.address) {
                  console.log('📍 Dirección cargada en refreshUser:', profileData.address.substring(0, 30) + '...', profileData.city, profileData.country);
                }
              } catch (err) {
                console.warn('⚠️ No se pudo cargar dirección en refreshUser:', err);
              }
              
              // Extraer rol de user_metadata, asegurándose de que sea válido
              const metadataRole = session.user.user_metadata?.role;
              const validRole = (metadataRole === 'hoster' || metadataRole === 'admin') 
                ? metadataRole 
                : 'user';
              
              const basicUser: User = {
                id: session.user.id,
                email: session.user.email || '',
                name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'Usuario',
                address: profileData?.address || undefined,
                city: profileData?.city || undefined,
                state: profileData?.state || undefined,
                zipCode: profileData?.zip_code || undefined,
                country: profileData?.country || undefined,
                balance: 0,
                createdAt: session.user.created_at || new Date().toISOString(),
                role: validRole,
              };
              set({ user: basicUser });
              console.log('✅ Usuario refrescado desde sesión de Supabase. Address:', !!basicUser.address, 'City:', basicUser.city, 'Rol:', validRole);
            } else {
              set({ user: null });
            }
          } catch (sessionError) {
            console.error('Error obteniendo sesión de Supabase:', sessionError);
            set({ user: null });
          }
        }
      },

      signIn: async (email: string, password: string) => {
        try {
          console.log('🔐 Intentando iniciar sesión con:', email);

          const { data, error } = await supabase.auth.signInWithPassword({
            email: email.trim().toLowerCase(),
            password,
          });

          if (error) {
            console.error('❌ Error de autenticación:', error);
            
            // Proporcionar mensajes de error más descriptivos
            if (error.message.includes('Invalid login credentials')) {
              throw new Error('Credenciales inválidas. Verifica tu email y contraseña.');
            } else if (error.message.includes('Email not confirmed')) {
              throw new Error('Por favor, confirma tu email antes de iniciar sesión.');
            } else if (error.message.includes('Too many requests')) {
              throw new Error('Demasiados intentos. Por favor, espera unos minutos.');
            } else {
              throw new Error(`Error de autenticación: ${error.message}`);
            }
          }

          if (!data.session) {
            throw new Error('No se pudo crear la sesión. Por favor, intenta de nuevo.');
          }

          if (data.session?.access_token) {
            api.setAccessToken(data.session.access_token);
            
            // ⚡ OPTIMIZACIÓN: Crear usuario inmediatamente desde la sesión
            // No esperar getProfile() que puede ser lento
            const metadataRole = data.session.user.user_metadata?.role;
            const validRole = (metadataRole === 'hoster' || metadataRole === 'admin') 
              ? metadataRole 
              : 'user';
            
            // ⚡ Intentar obtener dirección inmediatamente de profiles
            let profileData: any = null;
            try {
              const { data } = await supabase
                .from('profiles')
                .select('address, city, state, zip_code, country')
                .eq('id', data.session.user.id)
                .maybeSingle();
              
              profileData = data;
              if (profileData?.address) {
                console.log('📍 Dirección cargada en login:', profileData.address.substring(0, 30) + '...', profileData.city, profileData.country);
              }
            } catch (err) {
              console.warn('⚠️ No se pudo cargar dirección en login:', err);
            }
            
            const quickUser: User = {
              id: data.session.user.id,
              email: data.session.user.email || email,
              name: data.session.user.user_metadata?.name || data.session.user.email?.split('@')[0] || 'Usuario',
              address: profileData?.address || undefined,
              city: profileData?.city || undefined,
              state: profileData?.state || undefined,
              zipCode: profileData?.zip_code || undefined,
              country: profileData?.country || undefined,
              balance: 0,
              createdAt: data.session.user.created_at || new Date().toISOString(),
              role: validRole,
            };
            
            console.log('⚡ Usuario creado inmediatamente desde sesión. Address:', !!quickUser.address, 'City:', quickUser.city);
            set({ user: quickUser });
            
            // ⚡ Cargar perfil completo en background (sin esperar)
            // AuthInitializer lo hará automáticamente al detectar SIGNED_IN
            console.log('🔄 Perfil completo se cargará en segundo plano...');
          } else {
            throw new Error('No se recibió un token de acceso válido.');
          }
        } catch (error) {
          console.error('❌ Error completo en signIn:', error);
          throw error;
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


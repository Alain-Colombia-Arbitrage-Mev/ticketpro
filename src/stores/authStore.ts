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
        } catch (error: any) {
          console.warn('⚠️ No se pudo refrescar perfil del backend:', error?.message);
          
          // Si el perfil no existe en backend, intentar obtener info de la sesión de Supabase
          try {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
              // Extraer rol de user_metadata, asegurándose de que sea válido
              const metadataRole = session.user.user_metadata?.role;
              const validRole = (metadataRole === 'hoster' || metadataRole === 'admin') 
                ? metadataRole 
                : 'user';
              
              const basicUser: User = {
                id: session.user.id,
                email: session.user.email || '',
                name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'Usuario',
                balance: 0,
                createdAt: session.user.created_at || new Date().toISOString(),
                role: validRole,
              };
              set({ user: basicUser });
              console.log('✅ Usuario refrescado desde sesión de Supabase. Rol:', validRole);
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
          console.log('🔗 URL de Supabase:', projectUrl);
          console.log('🔑 Anon Key configurada:', publicAnonKey ? 'SI' : 'NO');

          const { data, error } = await supabase.auth.signInWithPassword({
            email: email.trim().toLowerCase(),
            password,
          });

          if (error) {
            console.error('❌ Error de autenticación:', error);
            console.error('❌ Código de error:', error.status);
            console.error('❌ Mensaje completo:', error.message);

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
            console.log('✅ Sesión creada exitosamente');
            api.setAccessToken(data.session.access_token);
            
            try {
              const { user: userProfile } = await api.getProfile();
              console.log('✅ Perfil de usuario obtenido:', userProfile?.email, 'Rol:', userProfile?.role);
              set({ user: userProfile });
            } catch (profileError: any) {
              console.warn('⚠️ Perfil no encontrado en backend, creando perfil desde sesión de Supabase:', profileError?.message);
              
              // Si el perfil no existe (404), crear un usuario básico desde la sesión de Supabase
              // Esto es común cuando el usuario se crea directamente en Supabase sin pasar por el signup del backend
              // Extraer rol de user_metadata, asegurándose de que sea válido
              const metadataRole = data.session.user.user_metadata?.role;
              const validRole = (metadataRole === 'hoster' || metadataRole === 'admin') 
                ? metadataRole 
                : 'user';
              
              const basicUser: User = {
                id: data.session.user.id,
                email: data.session.user.email || email,
                name: data.session.user.user_metadata?.name || data.session.user.email?.split('@')[0] || 'Usuario',
                balance: 0,
                createdAt: data.session.user.created_at || new Date().toISOString(),
                role: validRole,
              };
              
              console.log('🔍 Rol extraído de metadata:', metadataRole, 'Rol asignado:', validRole);
              
              console.log('✅ Usuario básico creado desde sesión:', basicUser.email, 'Rol:', basicUser.role);
              set({ user: basicUser });
              
              // Intentar crear el perfil en el backend (opcional, no crítico)
              try {
                // Esto podría fallar si el endpoint no existe, pero no es crítico
                await api.signup(basicUser.email, '', basicUser.name);
                console.log('✅ Perfil creado en backend');
              } catch (createError) {
                console.warn('⚠️ No se pudo crear perfil en backend (no crítico):', createError);
                // No es crítico, el usuario puede funcionar sin perfil en backend
              }
            }
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


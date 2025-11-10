/**
 * AuthInitializer Component - Inicializa la autenticación de Supabase
 * Maneja la verificación de sesión y los listeners de auth dentro de React
 */
import { useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { projectUrl, publicAnonKey } from '../../utils/supabase/info';
import { api } from '../../utils/api';
import { useAuthStore } from '../../stores/authStore';

const supabase = createClient(
  projectUrl,
  publicAnonKey
);

export function AuthInitializer() {
  const { refreshUser, setUser, setLoading } = useAuthStore();

    useEffect(() => {
      // Verificar sesión activa al montar
      const checkSession = async () => {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.access_token) {
            api.setAccessToken(session.access_token);
            try {
              await refreshUser();
            } catch (refreshError) {
              console.warn('⚠️ Error al refrescar usuario, pero la sesión es válida:', refreshError);
              // Si hay error al refrescar, crear usuario básico desde sesión
              if (session.user) {
                const { User } = await import('../../utils/api');
                const basicUser: User = {
                  id: session.user.id,
                  email: session.user.email || '',
                  name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'Usuario',
                  balance: 0,
                  createdAt: session.user.created_at || new Date().toISOString(),
                  role: (session.user.user_metadata?.role as 'user' | 'hoster' | 'admin') || 'user',
                };
                setUser(basicUser);
                console.log('✅ Usuario básico establecido desde sesión');
              }
            }
          } else {
            setLoading(false);
          }
        } catch (error) {
          console.error('Error checking session:', error);
          setLoading(false);
        } finally {
          setLoading(false);
        }
      };

      checkSession();

    // Escuchar cambios en el estado de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.access_token) {
          api.setAccessToken(session.access_token);
          await refreshUser();
        } else {
          api.setAccessToken(null);
          setUser(null);
        }
        setLoading(false);
      }
    );

    // Cleanup: desuscribirse cuando el componente se desmonte
    return () => {
      subscription.unsubscribe();
    };
  }, [refreshUser, setUser, setLoading]);

  // Este componente no renderiza nada
  return null;
}


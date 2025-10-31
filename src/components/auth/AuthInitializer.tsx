/**
 * AuthInitializer Component - Inicializa la autenticación de Supabase
 * Maneja la verificación de sesión y los listeners de auth dentro de React
 */
import { useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { api } from '../utils/api';
import { useAuthStore } from '../stores/authStore';

const supabase = createClient(
  `https://${projectId}.supabase.co`,
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
          await refreshUser();
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error('Error checking session:', error);
        setLoading(false);
      }
    };

    checkSession();

    // Escuchar cambios en el estado de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
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


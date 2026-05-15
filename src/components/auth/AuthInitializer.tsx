/**
 * AuthInitializer Component - Inicializa la autenticación de Supabase
 * Maneja la verificación de sesión y los listeners de auth dentro de React
 */
import { useEffect } from 'react';
import { supabase } from '../../utils/supabase/client';
import { api } from '../../utils/api';
import { useAuthStore } from '../../stores/authStore';

export function AuthInitializer() {
  const { refreshUser, setUser, setLoading } = useAuthStore();

    useEffect(() => {
      let isMounted = true;
      let initialized = false;

      const finishLoading = () => {
        if (!isMounted || initialized) return;
        initialized = true;
        setLoading(false);
      };

      const fallbackTimer = window.setTimeout(() => {
        finishLoading();
      }, 1200);

      // Helper: build a basic User from a Supabase session + optional profile row
      const buildUserFromSession = (session: any): void => {
        if (!session?.user || !isMounted) return;

        const metadataRole = session.user.user_metadata?.role;
        const persistedRole = useAuthStore.getState().user?.id === session.user.id
          ? useAuthStore.getState().user?.role
          : undefined;
        const validRole = persistedRole || ((metadataRole === 'hoster' || metadataRole === 'admin') ? metadataRole : 'user');

        const basicUser = {
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'Usuario',
          balance: 0,
          createdAt: session.user.created_at || new Date().toISOString(),
          role: validRole,
        };
        setUser(basicUser);
      };

    // Use onAuthStateChange as the SINGLE source of truth.
    // It fires INITIAL_SESSION on mount, so no separate getSession() call needed.
    // This avoids concurrent lock acquisitions that cause the timeout error.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return;

        if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          if (session?.access_token) {
            api.setAccessToken(session.access_token);

            if (event === 'TOKEN_REFRESHED') {
              try {
                await refreshUser();
              } catch {
                // silent
              }
            } else if (event === 'INITIAL_SESSION') {
              // First load must render fast. Build from the Supabase session and
              // refresh the richer profile in the background.
              buildUserFromSession(session);
              refreshUser().catch(() => {});
            } else {
              // SIGNED_IN: signIn() already set the user; refresh in background
              refreshUser().catch(() => {});
            }
          }
        } else if (event === 'SIGNED_OUT') {
          api.setAccessToken(null);
          setUser(null);
        }

        finishLoading();
      }
    );

    // Cleanup: desuscribirse cuando el componente se desmonte
    return () => {
      isMounted = false;
      window.clearTimeout(fallbackTimer);
      subscription.unsubscribe();
    };
  }, [refreshUser, setUser, setLoading]);

  // Este componente no renderiza nada
  return null;
}


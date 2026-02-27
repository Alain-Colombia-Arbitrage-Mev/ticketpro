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

      // Helper: build a basic User from a Supabase session + optional profile row
      const buildUserFromSession = async (session: any): Promise<void> => {
        if (!session?.user || !isMounted) return;

        const { User } = await import('../../utils/api');

        let profileData: any = null;
        try {
          const { data } = await supabase
            .from('profiles')
            .select('address, city, state, zip_code, country, name, role')
            .eq('id', session.user.id)
            .maybeSingle();
          profileData = data;
        } catch {
          // silent
        }

        const metadataRole = session.user.user_metadata?.role;
        const validRole = profileData?.role || ((metadataRole === 'hoster' || metadataRole === 'admin') ? metadataRole : 'user');

        const basicUser: User = {
          id: session.user.id,
          email: session.user.email || '',
          name: profileData?.name || session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'Usuario',
          address: profileData?.address || undefined,
          city: profileData?.city || undefined,
          state: profileData?.state || undefined,
          zipCode: profileData?.zip_code || undefined,
          country: profileData?.country || undefined,
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
              // First load: try backend profile, fallback to session data
              try {
                await refreshUser();
              } catch {
                await buildUserFromSession(session);
              }
            } else {
              // SIGNED_IN: signIn() already set the user; refresh in background
              refreshUser().catch(() => {});
            }
          }
        } else if (event === 'SIGNED_OUT') {
          api.setAccessToken(null);
          setUser(null);
        }

        if (isMounted) setLoading(false);
      }
    );

    // Cleanup: desuscribirse cuando el componente se desmonte
    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [refreshUser, setUser, setLoading]);

  // Este componente no renderiza nada
  return null;
}


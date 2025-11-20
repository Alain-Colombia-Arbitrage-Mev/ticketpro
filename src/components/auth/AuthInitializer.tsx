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
      
      // Verificar sesión activa al montar
      const checkSession = async () => {
        try {
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();
          
          if (sessionError) {
            if (isMounted) setLoading(false);
            return;
          }

          if (session?.access_token) {
            api.setAccessToken(session.access_token);

            try {
              await refreshUser();
            } catch (refreshError) {
              // Si hay error al refrescar, crear usuario básico desde sesión + dirección de profiles
              if (session.user && isMounted) {
                const { User } = await import('../../utils/api');
                
                // Intentar obtener dirección directamente de la tabla profiles
                let profileData: any = null;
                
                try {
                  const { data } = await supabase
                    .from('profiles')
                    .select('address, city, state, zip_code, country, name, role')
                    .eq('id', session.user.id)
                    .maybeSingle();

                  profileData = data;
                } catch (profileError) {
                  // Error silencioso al obtener perfil
                }
                
                // Extraer rol de user_metadata, asegurándose de que sea válido
                const metadataRole = session.user.user_metadata?.role;
                const validRole = profileData?.role || ((metadataRole === 'hoster' || metadataRole === 'admin') 
                  ? metadataRole 
                  : 'user');
                
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
              }
            }
          }
        } catch (error) {
          // Error silencioso
        } finally {
          if (isMounted) setLoading(false);
        }
      };

      checkSession();

    // Escuchar cambios en el estado de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return;
        
        
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          if (session?.access_token) {
            api.setAccessToken(session.access_token);
            
            // ⚡ OPTIMIZACIÓN: Solo refrescar en background si no viene de signIn
            // signIn ya estableció el usuario inmediatamente
            if (event === 'TOKEN_REFRESHED') {
              try {
                await refreshUser();
              } catch (refreshError) {
                // Error silencioso
              }
            } else {
              // SIGNED_IN: Refrescar en background sin bloquear
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


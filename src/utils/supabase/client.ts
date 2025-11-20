/**
 * Supabase Client Singleton
 * Una única instancia compartida en toda la aplicación
 */
import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseInstance: SupabaseClient | null = null;

/**
 * Obtiene la configuración de Supabase desde variables de entorno
 */
function getSupabaseConfig() {
  // Leer directamente de import.meta.env
  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID || import.meta.env.VITE_supabase_project_id;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_supabase_anon_key;
  const projectUrl = import.meta.env.VITE_SUPABASE_PROJECT_URL || import.meta.env.VITE_supabase_project_url;

  // Valores por defecto (solo para desarrollo)
  const defaultProjectId = "hxmdzhkkuhsetqucbpia";
  const defaultAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh4bWR6aGtrdWhzZXRxdWNicGlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg4Mzk5MjEsImV4cCI6MjA2NDQxNTkyMX0.-vUT8oRIKl4Pk7UZDOVhxxMRCictahFwAFEYc98HwFI";

  const finalProjectId = projectId || defaultProjectId;
  const finalAnonKey = anonKey || defaultAnonKey;
  const finalProjectUrl = projectUrl || `https://${finalProjectId}.supabase.co`;

  return {
    projectUrl: finalProjectUrl,
    anonKey: finalAnonKey,
  };
}

/**
 * Obtiene la instancia singleton de Supabase
 * Siempre devuelve la misma instancia para evitar múltiples clientes
 */
export function getSupabaseClient(): SupabaseClient {
  if (!supabaseInstance) {
    const { projectUrl, anonKey } = getSupabaseConfig();

    // Validar que las variables estén definidas
    if (!projectUrl || !anonKey) {
      throw new Error('Supabase configuration is missing. Check your .env file and restart Vite.');
    }

    supabaseInstance = createClient(projectUrl, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
        storageKey: 'supabase.auth.token',
        flowType: 'pkce',
      },
      global: {
        headers: {
          'x-application-name': 'tiquetera',
        },
      },
    });
  }
  return supabaseInstance;
}

/**
 * Exportar la instancia para uso directo
 * Lazy initialization - se crea solo cuando se accede por primera vez
 */
let _supabase: SupabaseClient | null = null;
export const supabase = new Proxy({} as SupabaseClient, {
  get(target, prop) {
    if (!_supabase) {
      _supabase = getSupabaseClient();
    }
    return (_supabase as any)[prop];
  },
});


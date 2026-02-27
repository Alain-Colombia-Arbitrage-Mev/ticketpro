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

  if (!projectId && !projectUrl) {
    throw new Error(
      "Missing Supabase configuration. Set VITE_SUPABASE_PROJECT_ID or VITE_SUPABASE_PROJECT_URL in your .env file."
    );
  }
  if (!anonKey) {
    throw new Error(
      "Missing Supabase anon key. Set VITE_SUPABASE_ANON_KEY in your .env file."
    );
  }

  const finalProjectUrl = projectUrl || `https://${projectId}.supabase.co`;

  return {
    projectUrl: finalProjectUrl,
    anonKey: anonKey,
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
        // Use a simple in-memory lock to avoid Navigator.locks timeout errors.
        // Navigator.locks can deadlock in SPAs with concurrent auth calls.
        lock: async (_name: string, _acquireTimeout: number, fn: () => Promise<any>) => {
          return await fn();
        },
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


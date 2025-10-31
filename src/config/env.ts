/**
 * Environment Configuration
 * Configuración de variables de entorno
 */
export const env = {
  supabase: {
    projectId: import.meta.env.VITE_SUPABASE_PROJECT_ID || '',
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
  },
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD,
  mode: import.meta.env.MODE,
} as const;


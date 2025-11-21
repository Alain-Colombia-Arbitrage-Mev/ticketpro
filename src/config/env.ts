/**
 * Environment Configuration
 * Configuración de variables de entorno para PRODUCCIÓN
 */
export const env = {
  supabase: {
    projectId: import.meta.env.VITE_SUPABASE_PROJECT_ID || import.meta.env.VITE_supabase_project_id || '',
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_supabase_anon_key || '',
  },
  stripe: {
    // PRODUCCIÓN: Usar siempre la clave de producción
    // VITE_STRIPE_PUBLISHABLE_KEY contiene pk_live_...
    publishableKey: 
      import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ||
      import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY_PROD || 
      import.meta.env.VITE_Stripe_public_key || 
      '',
  },
  // URL del frontend para producción
  frontUrl: import.meta.env.VITE_FRONT_URL || 'https://veltlix.com',
  
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD,
  mode: import.meta.env.MODE,
} as const;


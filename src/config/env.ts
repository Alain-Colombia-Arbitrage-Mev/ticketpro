/**
 * Environment Configuration
 * Configuración de variables de entorno
 */
export const env = {
  supabase: {
    projectId: import.meta.env.VITE_SUPABASE_PROJECT_ID || import.meta.env.VITE_supabase_project_id || '',
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_supabase_anon_key || '',
  },
  stripe: {
    // Variables principales: VITE_STRIPE_PUBLISHABLE_KEY_TEST y VITE_STRIPE_PUBLISHABLE_KEY_PROD
    // También acepta VITE_Stripe_public_key como alternativa
    publishableKeyTest: 
      import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY_TEST || 
      import.meta.env.VITE_Stripe_public_key || 
      '',
    publishableKeyProd: 
      import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY_PROD || 
      import.meta.env.VITE_Stripe_public_key || 
      '',
    // Usa la clave según el entorno
    get publishableKey() {
      return import.meta.env.PROD 
        ? this.publishableKeyProd 
        : this.publishableKeyTest;
    },
  },
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD,
  mode: import.meta.env.MODE,
} as const;


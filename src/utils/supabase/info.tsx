/**
 * Supabase Configuration
 * Usa variables de entorno para las credenciales
 * 
 * Variables requeridas:
 * - VITE_SUPABASE_PROJECT_ID
 * - VITE_SUPABASE_ANON_KEY
 */

// Obtener valores de variables de entorno
const envProjectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
const envAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Valores por defecto (solo para desarrollo local, NO usar en producción)
// Estos valores se usan como fallback si las variables de entorno no están configuradas
const defaultProjectId = "hxmdzhkkuhsetqucbpia";
const defaultAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh4bWR6aGtrdWhzZXRxdWNicGlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg4Mzk5MjEsImV4cCI6MjA2NDQxNTkyMX0.-vUT8oRIKl4Pk7UZDOVhxxMRCictahFwAFEYc98HwFI";

// Usar variables de entorno si están disponibles, sino usar valores por defecto
export const projectId = envProjectId || defaultProjectId;
export const publicAnonKey = envAnonKey || defaultAnonKey;

// Validar que las credenciales estén configuradas
if (!projectId || !publicAnonKey) {
  console.error('❌ ERROR: Variables de entorno de Supabase no configuradas');
  console.error('Por favor, configura VITE_SUPABASE_PROJECT_ID y VITE_SUPABASE_ANON_KEY en tu archivo .env');
}

// Advertencia en producción si se usan valores por defecto
if (import.meta.env.PROD && (!envProjectId || !envAnonKey)) {
  console.warn('⚠️ ADVERTENCIA: Usando valores por defecto de Supabase en producción. Configura las variables de entorno.');
}
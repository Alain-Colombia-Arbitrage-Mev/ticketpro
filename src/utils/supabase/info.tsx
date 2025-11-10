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
const defaultProjectId = "***REMOVED***";
const defaultAnonKey = "***REMOVED***";

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
/**
 * Supabase Configuration
 * Usa variables de entorno para las credenciales
 * 
 * Variables requeridas en .env (con prefijo VITE_ para Vite):
 * - VITE_SUPABASE_PROJECT_ID o VITE_supabase_project_id
 * - VITE_SUPABASE_ANON_KEY o VITE_supabase_anon_key
 * - VITE_SUPABASE_PROJECT_URL o VITE_supabase_project_url
 * - VITE_SUPABASE_SERVICE_ROLE (opcional, solo para backend)
 */

// Obtener valores de variables de entorno (soporta ambos formatos)
const envProjectId = import.meta.env.VITE_SUPABASE_PROJECT_ID || import.meta.env.VITE_supabase_project_id;
const envAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_supabase_anon_key;
const envProjectUrl = import.meta.env.VITE_SUPABASE_PROJECT_URL || import.meta.env.VITE_supabase_project_url;
// Service role key (solo para uso en backend, nunca exponer en frontend)
export const serviceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE || import.meta.env.VITE_supabase_service_role;

// Validar que las variables de entorno estén configuradas
if (!envProjectId) {
  throw new Error("Missing Supabase project ID. Set VITE_SUPABASE_PROJECT_ID in your .env file.");
}
if (!envAnonKey) {
  throw new Error("Missing Supabase anon key. Set VITE_SUPABASE_ANON_KEY in your .env file.");
}

export const projectId = envProjectId;
export const publicAnonKey = envAnonKey;

// Construir URL del proyecto si no está proporcionada
export const projectUrl = envProjectUrl || `https://${projectId}.supabase.co`;


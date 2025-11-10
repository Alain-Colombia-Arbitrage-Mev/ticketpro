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

// Valores por defecto (solo para desarrollo local, NO usar en producción)
const defaultProjectId = "***REMOVED***";
const defaultAnonKey = "***REMOVED***";

// Usar variables de entorno si están disponibles, sino usar valores por defecto
export const projectId = envProjectId || defaultProjectId;
export const publicAnonKey = envAnonKey || defaultAnonKey;

// Construir URL del proyecto si no está proporcionada
export const projectUrl = envProjectUrl || `https://${projectId}.supabase.co`;

// Validar que las credenciales estén configuradas
if (!projectId || !publicAnonKey) {
  console.error('❌ ERROR: Variables de entorno de Supabase no configuradas');
  console.error('Por favor, configura las siguientes variables en tu archivo .env:');
  console.error('  - VITE_supabase_project_id');
  console.error('  - VITE_supabase_anon_key');
  console.error('  - VITE_supabase_project_url (opcional)');
  console.error('');
  console.error('🔧 Creando archivo .env con valores por defecto...');
  // En desarrollo, crear .env si no existe
  if (typeof window === 'undefined' && import.meta.env.DEV) {
    try {
      const fs = require('fs');
      const path = require('path');
      const envPath = path.join(process.cwd(), '.env');
      if (!fs.existsSync(envPath)) {
        const envContent = `# Variables de entorno para desarrollo
VITE_supabase_project_id=${defaultProjectId}
VITE_supabase_anon_key=${defaultAnonKey}
VITE_supabase_project_url=https://${defaultProjectId}.supabase.co
VITE_SITE_URL=https://tiquetera.com
`;
        fs.writeFileSync(envPath, envContent);
        console.log('✅ Archivo .env creado con valores por defecto');
        console.log('🔄 Reinicia el servidor de desarrollo para cargar las nuevas variables');
      }
    } catch (err) {
      console.warn('⚠️ No se pudo crear archivo .env automáticamente:', err.message);
    }
  }
}

// Advertencia en producción si se usan valores por defecto
if (import.meta.env.PROD && (!envProjectId || !envAnonKey)) {
  console.warn('⚠️ ADVERTENCIA: Usando valores por defecto de Supabase en producción. Configura las variables de entorno.');
  console.warn('Variables requeridas: VITE_supabase_project_id, VITE_supabase_anon_key, VITE_supabase_project_url');
}
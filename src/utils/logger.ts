/**
 * Logger Utility - Safe logging for production
 *
 * Este módulo proporciona funciones de logging que:
 * - Se deshabilitan automáticamente en producción
 * - Nunca exponen información sensible
 * - Permiten debugging en desarrollo
 */

const isDevelopment = import.meta.env.DEV;
const isProduction = import.meta.env.PROD;

// Lista de palabras clave sensibles que nunca deben loguearse
const SENSITIVE_KEYS = [
  'password',
  'token',
  'secret',
  'key',
  'authorization',
  'bearer',
  'apikey',
  'api_key',
  'access_token',
  'refresh_token',
  'session_id',
  'stripe',
  'card',
  'cvv',
  'ssn',
];

/**
 * Sanitiza un objeto removiendo campos sensibles
 */
function sanitizeData(data: any): any {
  if (typeof data !== 'object' || data === null) {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(sanitizeData);
  }

  const sanitized: any = {};
  for (const [key, value] of Object.entries(data)) {
    const keyLower = key.toLowerCase();
    const isSensitive = SENSITIVE_KEYS.some(sensitiveKey =>
      keyLower.includes(sensitiveKey)
    );

    if (isSensitive) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeData(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Logger seguro que solo funciona en desarrollo
 */
export const logger = {
  /**
   * Log general (solo en desarrollo)
   */
  log: (...args: any[]) => {
    if (isDevelopment) {
      const sanitizedArgs = args.map(sanitizeData);
      console.log(...sanitizedArgs);
    }
  },

  /**
   * Log de información (solo en desarrollo)
   */
  info: (...args: any[]) => {
    if (isDevelopment) {
      const sanitizedArgs = args.map(sanitizeData);
      console.info(...sanitizedArgs);
    }
  },

  /**
   * Log de advertencia (solo en desarrollo)
   */
  warn: (...args: any[]) => {
    if (isDevelopment) {
      const sanitizedArgs = args.map(sanitizeData);
      console.warn(...sanitizedArgs);
    }
  },

  /**
   * Log de error (siempre activo pero sanitizado)
   * Los errores críticos deben loguearse incluso en producción
   * pero sin exponer información sensible
   */
  error: (...args: any[]) => {
    const sanitizedArgs = args.map(sanitizeData);
    console.error(...sanitizedArgs);
  },

  /**
   * Log de debug (solo en desarrollo)
   */
  debug: (...args: any[]) => {
    if (isDevelopment) {
      const sanitizedArgs = args.map(sanitizeData);
      console.debug(...sanitizedArgs);
    }
  },

  /**
   * Agrupa logs (solo en desarrollo)
   */
  group: (label: string) => {
    if (isDevelopment) {
      console.group(label);
    }
  },

  /**
   * Cierra grupo de logs (solo en desarrollo)
   */
  groupEnd: () => {
    if (isDevelopment) {
      console.groupEnd();
    }
  },

  /**
   * Tabla de datos (solo en desarrollo)
   */
  table: (data: any) => {
    if (isDevelopment) {
      const sanitized = sanitizeData(data);
      console.table(sanitized);
    }
  },
};

/**
 * Hook para reportar errores a un servicio externo (opcional)
 * Puedes integrar con Sentry, LogRocket, etc.
 */
export function reportError(error: Error, context?: Record<string, any>) {
  // En producción, aquí podrías enviar a un servicio de monitoring
  if (isProduction) {
    // TODO: Integrar con servicio de error tracking
    // Ejemplo: Sentry.captureException(error, { extra: context });
  }

  // Siempre loguear el error sanitizado
  logger.error('Error captured:', {
    message: error.message,
    stack: error.stack,
    context: sanitizeData(context || {}),
  });
}

export default logger;

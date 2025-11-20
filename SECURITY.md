# Política de Seguridad

## Información Sensible

Este proyecto ha sido configurado para **NO exponer información sensible** en logs o en el código.

### ✅ Medidas Implementadas

#### 1. Logging Seguro
- **Producción**: Todos los `console.log`, `console.debug` y `console.warn` están deshabilitados automáticamente
- **Desarrollo**: Se usa el módulo `src/utils/logger.ts` que sanitiza datos sensibles
- **Nunca loguear**:
  - Tokens de autenticación
  - API keys
  - Session IDs
  - Contraseñas
  - Información de tarjetas de crédito
  - Emails completos de usuarios

#### 2. Variables de Entorno
- ✅ Todas las variables sensibles están en `.env` (nunca en `.env.example`)
- ✅ `.env` está en `.gitignore`
- ✅ No hay API keys hardcoded en el código
- ✅ Usar `import.meta.env` para acceder a variables

#### 3. Git Security
- ✅ `.gitignore` configurado para excluir:
  - Scripts de configuración (*.sh)
  - Documentación con información sensible (*.md excepto README)
  - Archivos SQL temporales
  - Archivos de configuración (*.js con secrets)
  - Archivos MCP con credenciales

#### 4. Build & Deploy
- ✅ Sourcemaps deshabilitados en producción (`sourcemap: false`)
- ✅ Console logs removidos automáticamente en build de producción
- ✅ Variables de entorno inyectadas en tiempo de build

### 🔒 Uso del Logger Seguro

```typescript
// ❌ NO HACER - Expone información sensible
console.log('User logged in:', { email, token, session });

// ✅ HACER - Usa el logger seguro
import { logger } from '@/utils/logger';
logger.log('User logged in'); // Solo en desarrollo, datos sanitizados
```

### 📋 Checklist Antes de Commit

- [ ] No hay `console.log` con datos sensibles
- [ ] No hay API keys hardcoded
- [ ] `.env` no está siendo trackeado
- [ ] Scripts con credenciales están en `.gitignore`
- [ ] Documentación no contiene passwords o tokens

### 🚨 Reportar Vulnerabilidades

Si encuentras una vulnerabilidad de seguridad, **NO** abras un issue público.
Contacta directamente al equipo de desarrollo.

### 📚 Recursos

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Guía de Seguridad de Supabase](https://supabase.com/docs/guides/auth/auth-helpers/auth-ui)
- [Stripe Security Best Practices](https://stripe.com/docs/security/guide)

---

**Última actualización**: 2025-01-20

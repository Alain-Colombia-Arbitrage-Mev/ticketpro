# Guía de Migración - Context API → Zustand + TanStack Query

## ✅ Cambios Implementados

### 1. Zustand Stores Creados

#### `src/stores/authStore.ts`
- Reemplaza `AuthContext`
- Persist middleware para mantener sesión
- Misma API que antes (compatible)

#### `src/stores/languageStore.ts`
- Reemplaza `LanguageContext`
- Persist middleware para mantener idioma seleccionado
- Misma API que antes (compatible)

#### `src/stores/routerStore.ts`
- Reemplaza `RouterContext`
- Manejo de hash routing mejorado
- Misma API que antes (compatible)

### 2. Hooks de Compatibilidad

Creados hooks en `src/hooks/` que mantienen la misma API pero usan Zustand:
- `useAuth()` - Compatible con `useAuth()` anterior
- `useLanguage()` - Compatible con `useLanguage()` anterior  
- `useRouter()` - Compatible con `useRouter()` anterior

**Ventaja**: No necesitas cambiar ningún componente, los hooks hacen el trabajo.

### 3. TanStack Query Integrado

#### `src/lib/queryClient.ts`
- Configuración optimizada
- Cache de 5 minutos
- Retry automático
- DevTools en desarrollo

#### `src/components/QueryProvider.tsx`
- Provider para React Query
- DevTools automáticos

### 4. App.tsx Actualizado

- Removidos `AuthProvider`, `LanguageProvider`, `RouterProvider`
- Agregado `QueryProvider`
- Hooks actualizados para usar nueva implementación

## 📝 Imports Actualizados

Todos los imports han sido actualizados de:
```typescript
// Antes
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import { useRouter } from "../components/Router";

// Ahora
import { useAuth } from "../hooks/useAuth";
import { useLanguage } from "../hooks/useLanguage";
import { useRouter } from "../hooks/useRouter";
```

## 🚀 Próximos Pasos (Opcional)

### Usar TanStack Query en Componentes

Puedes empezar a migrar llamadas API a React Query:

```typescript
// Antes
const [events, setEvents] = useState([]);
useEffect(() => {
  api.getEvents().then(setEvents);
}, []);

// Después (con React Query)
import { useQuery } from '@tanstack/react-query';

const { data: events, isLoading } = useQuery({
  queryKey: ['events'],
  queryFn: () => api.getEvents(),
});
```

## 📦 Instalación

```bash
# Instalar nuevas dependencias
bun install

# Las dependencias agregadas son:
# - zustand
# - @tanstack/react-query
# - @tanstack/react-query-devtools
```

## ✨ Beneficios Inmediatos

1. **Performance**: Zustand es más rápido que Context API
2. **Menos Re-renders**: Solo se actualizan componentes que usan el store
3. **Persistence**: Sesión e idioma se guardan automáticamente
4. **DevTools**: React Query DevTools para debugging
5. **Cache**: Preparado para usar React Query en llamadas API

## 🔄 Compatibilidad

Los hooks mantienen la misma API, así que **todos los componentes funcionan sin cambios**. La migración es transparente.


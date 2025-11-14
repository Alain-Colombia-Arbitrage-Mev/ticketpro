# Configuración de Cloudflare R2 para Videos

## Descripción
Este proyecto ahora utiliza Cloudflare R2 para servir los videos de background en lugar de videos locales. Esto mejora el rendimiento, reduce el tamaño del bundle y facilita la actualización de contenido multimedia.

## Variables de Entorno

Las siguientes variables deben estar configuradas en tu archivo `.env`:

```env
# Cloudflare R2 Configuration
VITE_R2_ACCOUNT_ID=1993a0eaf7f6e3e6f7fd7b3b3f377d6c
VITE_R2_S3_API=https://1993a0eaf7f6e3e6f7fd7b3b3f377d6c.r2.cloudflarestorage.com

# Video URLs from Cloudflare R2
VITE_VIDEO_URL_1=https://video.veltlix.com/video1.mp4
VITE_VIDEO_URL_2=https://video.veltlix.com/video2.mp4
VITE_VIDEO_URL_3=https://video.veltlix.com/video3.mp4
VITE_VIDEO_URL_4=https://video.veltlix.com/video4.mp4
```

## URLs de Videos

Los videos están alojados en Cloudflare R2 y se acceden a través del dominio personalizado:

- **Video 1**: https://video.veltlix.com/video1.mp4
- **Video 2**: https://video.veltlix.com/video2.mp4
- **Video 3**: https://video.veltlix.com/video3.mp4
- **Video 4**: https://video.veltlix.com/video4.mp4

## Archivos Modificados

### 1. `.env`
Se agregaron las variables de entorno para Cloudflare R2 y las URLs de los videos.

### 2. `src/pages/HomePage.tsx`
- **Antes**: Importaba videos locales desde `src/assets/backgrounds/`
- **Después**: Utiliza variables de entorno para cargar videos desde Cloudflare R2
```typescript
const video1 = import.meta.env.VITE_VIDEO_URL_1 || "https://video.veltlix.com/video1.mp4";
```

### 3. `src/pages/EventsListPage.tsx`
- **Antes**: Importaba video1 localmente
- **Después**: Utiliza variable de entorno para video1

## Beneficios de la Migración

1. **Reducción del tamaño del bundle**: Los videos ya no se incluyen en el build de la aplicación
2. **Mejor rendimiento**: Cloudflare R2 ofrece CDN global para una entrega más rápida
3. **Facilidad de actualización**: Los videos se pueden actualizar sin necesidad de redesplegar la aplicación
4. **Escalabilidad**: R2 puede manejar grandes volúmenes de tráfico sin problemas
5. **Costos optimizados**: Sin cargos de egreso en Cloudflare R2

## Configuración de Cloudflare R2

### Account ID
```
1993a0eaf7f6e3e6f7fd7b3b3f377d6c
```

### S3 API Endpoint
```
https://1993a0eaf7f6e3e6f7fd7b3b3f377d6c.r2.cloudflarestorage.com
```

### Dominio Público
Los videos están disponibles públicamente a través del dominio:
```
https://video.veltlix.com/
```

## Fallback

Cada video tiene un fallback URL hardcoded en caso de que las variables de entorno no estén disponibles:

```typescript
const video1 = import.meta.env.VITE_VIDEO_URL_1 || "https://video.veltlix.com/video1.mp4";
```

Esto garantiza que la aplicación siempre pueda cargar los videos, incluso si hay problemas con la configuración del entorno.

## Notas Importantes

- Los videos locales en `src/assets/backgrounds/` pueden ser eliminados para liberar espacio, ya que ahora se usan los de Cloudflare R2
- Asegúrate de que las URLs de Cloudflare R2 estén configuradas correctamente antes de eliminar los archivos locales
- Los videos deben tener los permisos públicos configurados en Cloudflare R2 para que sean accesibles

## Testing

Para verificar que los videos se cargan correctamente:

1. Inicia el servidor de desarrollo: `npm run dev`
2. Navega a la página principal
3. Verifica que los 4 videos de background se cargan correctamente
4. Revisa la consola del navegador para cualquier error de carga
5. Inspecciona las Network requests para confirmar que los videos se cargan desde `video.veltlix.com`

## Mantenimiento

Para actualizar los videos:

1. Sube los nuevos videos a Cloudflare R2
2. Asegúrate de mantener los mismos nombres de archivo o actualiza las variables de entorno
3. No es necesario redesplegar la aplicación si mantienes los mismos nombres de archivo
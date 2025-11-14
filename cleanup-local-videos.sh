#!/bin/bash

# Script para eliminar videos locales después de migrar a Cloudflare R2
# Este script es OPCIONAL y solo debe ejecutarse después de verificar que
# los videos se cargan correctamente desde Cloudflare R2

echo "⚠️  Este script eliminará los archivos de video locales."
echo "   Solo ejecuta este script después de verificar que los videos"
echo "   se cargan correctamente desde Cloudflare R2."
echo ""
read -p "¿Estás seguro de que deseas continuar? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "❌ Operación cancelada."
    exit 0
fi

echo ""
echo "🧹 Eliminando videos locales..."

# Directorio de videos
VIDEO_DIR="src/assets/backgrounds"

# Verificar si el directorio existe
if [ ! -d "$VIDEO_DIR" ]; then
    echo "❌ El directorio $VIDEO_DIR no existe."
    exit 1
fi

# Contador de archivos eliminados
count=0

# Eliminar archivos .mp4
for video in "$VIDEO_DIR"/*.mp4; do
    if [ -f "$video" ]; then
        filename=$(basename "$video")
        echo "  🗑️  Eliminando: $filename"
        rm "$video"
        ((count++))
    fi
done

echo ""
if [ $count -gt 0 ]; then
    echo "✅ Se eliminaron $count archivo(s) de video."
    echo "   Espacio liberado: aproximadamente $(du -sh "$VIDEO_DIR" 2>/dev/null | cut -f1)"

    # Verificar si el directorio está vacío
    if [ -z "$(ls -A $VIDEO_DIR 2>/dev/null)" ]; then
        echo ""
        read -p "   El directorio $VIDEO_DIR está vacío. ¿Deseas eliminarlo? (yes/no): " remove_dir
        if [ "$remove_dir" = "yes" ]; then
            rmdir "$VIDEO_DIR"
            echo "   ✅ Directorio eliminado."
        fi
    fi
else
    echo "ℹ️  No se encontraron archivos .mp4 para eliminar."
fi

echo ""
echo "✨ Limpieza completada!"
echo ""
echo "📋 Próximos pasos:"
echo "   1. Ejecuta 'npm run dev' para verificar la aplicación"
echo "   2. Confirma que los videos se cargan desde https://video.veltlix.com/"
echo "   3. Verifica que no hay errores en la consola del navegador"

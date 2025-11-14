#!/bin/bash

# Script de instrucciones para configurar variables de entorno en Cloudflare Pages
# Las variables de entorno en Cloudflare Pages se deben configurar a través del dashboard

PROJECT_NAME="ticketpro"
ACCOUNT_ID="1993a0eaf7f6e3e6f7fd7b3b3f377d6c"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 Configuración de Variables de Entorno - Cloudflare Pages"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📌 Proyecto: $PROJECT_NAME"
echo "📌 Account ID: $ACCOUNT_ID"
echo ""
echo "🔗 Dashboard URL:"
echo "   https://dash.cloudflare.com/$ACCOUNT_ID/pages/view/$PROJECT_NAME/settings/environment-variables"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Función para mostrar una variable
show_var() {
    local name=$1
    local value=$2
    local description=$3
    echo "📝 $name"
    echo "   Valor: $value"
    echo "   Descripción: $description"
    echo ""
}

echo "📋 VARIABLES DE ENTORNO A CONFIGURAR:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "🗄️  SUPABASE CONFIGURATION"
echo "─────────────────────────────────────────────────────────────"
show_var "VITE_supabase_project_id" \
         "hxmdzhkkuhsetqucbpia" \
         "ID del proyecto Supabase"

show_var "VITE_supabase_anon_key" \
         "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh4bWR6aGtrdWhzZXRxdWNicGlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg4Mzk5MjEsImV4cCI6MjA2NDQxNTkyMX0.-vUT8oRIKl4Pk7UZDOVhxxMRCictahFwAFEYc98HwFI" \
         "Clave anónima de Supabase"

show_var "VITE_supabase_project_url" \
         "https://hxmdzhkkuhsetqucbpia.supabase.co" \
         "URL del proyecto Supabase"

echo "🌐 SITE CONFIGURATION"
echo "─────────────────────────────────────────────────────────────"
show_var "VITE_SITE_URL" \
         "https://veltlix.com/" \
         "URL pública del sitio"

echo "☁️  CLOUDFLARE R2 CONFIGURATION"
echo "─────────────────────────────────────────────────────────────"
show_var "VITE_R2_ACCOUNT_ID" \
         "1993a0eaf7f6e3e6f7fd7b3b3f377d6c" \
         "Account ID de Cloudflare R2"

show_var "VITE_R2_S3_API" \
         "https://1993a0eaf7f6e3e6f7fd7b3b3f377d6c.r2.cloudflarestorage.com" \
         "Endpoint S3 API de Cloudflare R2"

echo "🎥 VIDEO URLs (CLOUDFLARE R2)"
echo "─────────────────────────────────────────────────────────────"
show_var "VITE_VIDEO_URL_1" \
         "https://video.veltlix.com/video1.mp4" \
         "URL del video 1 de background"

show_var "VITE_VIDEO_URL_2" \
         "https://video.veltlix.com/video2.mp4" \
         "URL del video 2 de background"

show_var "VITE_VIDEO_URL_3" \
         "https://video.veltlix.com/video3.mp4" \
         "URL del video 3 de background"

show_var "VITE_VIDEO_URL_4" \
         "https://video.veltlix.com/video4.mp4" \
         "URL del video 4 de background"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📝 INSTRUCCIONES:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. 🌐 Abre el dashboard de Cloudflare Pages:"
echo "   https://dash.cloudflare.com/$ACCOUNT_ID/pages/view/$PROJECT_NAME/settings/environment-variables"
echo ""
echo "2. 📝 Para cada variable listada arriba:"
echo "   • Click en 'Add variables'"
echo "   • Ingresa el 'Variable name' (nombre exacto)"
echo "   • Ingresa el 'Value' (valor exacto)"
echo "   • Selecciona el entorno: 'Production', 'Preview', o ambos"
echo "   • Click en 'Save'"
echo ""
echo "3. ⚙️  Configuración recomendada:"
echo "   • Todas las variables deben estar en 'Production' Y 'Preview'"
echo "   • Esto asegura que funcionen en todos los despliegues"
echo ""
echo "4. 🔄 Después de configurar todas las variables:"
echo "   • Las variables estarán disponibles en el próximo deploy"
echo "   • NO necesitas redesplegar si las variables tienen valores de fallback"
echo ""
echo "5. ✅ Verifica el deploy actual:"
echo "   • URL: https://a23225be.ticketpro.pages.dev"
echo "   • Los videos deberían cargar desde video.veltlix.com"
echo "   • Verifica en DevTools → Network que los videos se carguen"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "💡 NOTAS IMPORTANTES:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "• ✅ El código ya tiene URLs de fallback hardcoded"
echo "• ✅ Los videos funcionarán incluso sin las variables configuradas"
echo "• ⚡ Configurar las variables permite cambiar las URLs sin redesplegar"
echo "• 🔒 Las variables VITE_ son visibles en el cliente (no son secretas)"
echo "• 📦 Vite incluye las variables en el bundle durante el build"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🎉 ¡Deploy completado exitosamente!"
echo "🔗 Producción: https://ticketpro.pages.dev"
echo "🔗 Último deploy: https://a23225be.ticketpro.pages.dev"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

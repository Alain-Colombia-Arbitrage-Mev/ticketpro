# Cloudflare Pages - Guía de Deployment

## Configuración para Cloudflare Pages con Bun

Cloudflare Pages es **100% compatible con Bun**. Bun está incluido por defecto en el build image de Cloudflare Pages.

## Configuración en el Dashboard

### Build Settings
- **Build command**: `bun run build`
- **Build output directory**: `dist`
- **Root directory**: `/` (dejar vacío)

### Environment Variables (Opcional)
- `BUN_VERSION`: `latest` (o versión específica como `1.1.0`)

---

## Comandos de Deployment

### 1. Instalación de Wrangler CLI (Opcional)

**Nota**: No necesitas instalar Wrangler globalmente. Los scripts usan `bunx` que lo instala automáticamente.

```bash
# Opción A: Usar bunx (recomendado - se instala automáticamente)
bunx wrangler pages deploy ./dist

# Opción B: Instalar Wrangler globalmente (opcional)
npm install -g wrangler
# o
bun install -g wrangler

# Después puedes usar directamente
wrangler pages deploy ./dist
```

### 2. Autenticación en Cloudflare

Tienes dos opciones para autenticarte:

#### Opción A: Login Interactivo (Recomendado para desarrollo local)

```bash
# Iniciar sesión interactivamente (abre navegador)
bunx wrangler login

# O si wrangler está instalado globalmente
wrangler login
```

#### Opción B: Usar Token de API (Para CI/CD)

Si necesitas usar un token de API, debes crear uno con los permisos correctos:

1. Ve a https://dash.cloudflare.com/profile/api-tokens
2. Click en "Create Token"
3. Usa el template "Edit Cloudflare Workers" o crea uno personalizado con estos permisos:
   - **Account**: `Cloudflare Pages:Edit`
   - **Zone**: (opcional, solo si necesitas acceso a DNS)
4. Copia el token y guárdalo de forma segura
5. Configúralo como variable de entorno:

```bash
# En tu terminal (Linux/Mac)
export CLOUDFLARE_API_TOKEN=tu_token_aqui

# En PowerShell (Windows)
$env:CLOUDFLARE_API_TOKEN="tu_token_aqui"

# En CMD (Windows)
set CLOUDFLARE_API_TOKEN=tu_token_aqui
```

**⚠️ Importante**: Si usas un token de API, también necesitas configurar el Account ID:

```bash
export CLOUDFLARE_ACCOUNT_ID=1993a0eaf7f6e3e6f7fd7b3b3f377d6c
```

O agréguelo al comando:

```bash
bunx wrangler pages deploy ./dist --project-name=ticketpro --account-id=1993a0eaf7f6e3e6f7fd7b3b3f377d6c
```

### 3. Build Local (Verificar antes de deployar)

```bash
# Instalar dependencias
bun install

# Hacer build
bun run build

# Preview local del build
bun run preview
```

### 4. Deployment Manual

```bash
# Deploy a producción (con bunx - se instala automáticamente)
# IMPORTANTE: Especifica el nombre del proyecto
bunx wrangler pages deploy ./dist --project-name=ticketpro

# O usando el script npm (más fácil - ya incluye el nombre del proyecto)
bun run deploy

# Si usas token de API, también especifica el account-id
bunx wrangler pages deploy ./dist --project-name=ticketpro --account-id=1993a0eaf7f6e3e6f7fd7b3b3f377d6c

# Deploy a un branch específico (preview)
bun run deploy:preview
# o
bunx wrangler pages deploy ./dist --project-name=ticketpro --branch=preview
```

### 5. Deployment con GitHub Integration (Recomendado)

#### Opción A: Desde el Dashboard de Cloudflare
1. Ve a Cloudflare Dashboard → Pages
2. Click en "Create a project"
3. Conecta tu repositorio de GitHub
4. Configura:
   - **Framework preset**: None (o Vite)
   - **Build command**: `bun run build`
   - **Build output directory**: `dist`
   - **Root directory**: `/`
5. Click en "Save and Deploy"

#### Opción B: Con GitHub Actions (CI/CD)

Crea el archivo `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Cloudflare Pages

on:
  push:
    branches:
      - main
  pull_request:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      deployments: write
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Bun
        uses: oven-sh/setup-bun@v1
        with:
          bun-version: latest
      
      - name: Install dependencies
        run: bun install
      
      - name: Build
        run: bun run build
      
      - name: Deploy to Cloudflare Pages
        uses: cloudflare/pages-action@v1
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          projectName: ticketpro
          directory: dist
          gitHubToken: ${{ secrets.GITHUB_TOKEN }}
```

### 6. Variables de Entorno Necesarias

Configura estas variables en Cloudflare Pages Dashboard → Settings → Environment Variables:

```bash
# Supabase (si las usas)
VITE_SUPABASE_URL=tu_url_de_supabase
VITE_SUPABASE_ANON_KEY=tu_key_de_supabase

# Bun version (opcional)
BUN_VERSION=latest
```

---

## Comandos Útiles

### Verificar Build Localmente
```bash
# Build
bun run build

# Preview del build
bun run preview
```

### Ver Logs de Deployment
```bash
# Ver deployments recientes
bunx wrangler pages deployment list

# Ver detalles de un deployment específico
bunx wrangler pages deployment tail
```

### Rollback a Versión Anterior
```bash
# Listar deployments
bunx wrangler pages deployment list

# Hacer rollback (usa el deployment ID)
bunx wrangler pages deployment rollback <deployment-id>
```

---

## Workflow Completo de Deployment

```bash
# 1. Verificar que todo funciona localmente
bun install
bun run build
bun run preview

# 2. Commit cambios
git add .
git commit -m "Preparar para deployment"
git push origin main

# 3. (Opcional) Deploy manual si no usas GitHub integration
bun run deploy
# o
bunx wrangler pages deploy ./dist
```

---

## Troubleshooting

### Error: "Build failed"
- Verifica que `bun run build` funciona localmente
- Revisa los logs en Cloudflare Dashboard
- Asegúrate de que `BUN_VERSION` esté configurado si es necesario

### Error: "Cannot find module"
- Verifica que todas las dependencias están en `package.json`
- Asegúrate de que `bun install` se ejecuta antes del build

### Error: "Output directory not found"
- Verifica que el build genera el directorio `dist`
- Confirma que `build output directory` está configurado como `dist`

---

## Notas Importantes

- Cloudflare Pages incluye Bun por defecto, no necesitas instalarlo
- El archivo `_redirects` en `public/` se copiará automáticamente a `dist/` durante el build
- Las variables de entorno con prefijo `VITE_` están disponibles en el build
- Los redirects están configurados para SPA routing (todas las rutas → `/index.html`)



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

### 1. Instalación de Wrangler CLI

```bash
# Instalar Wrangler globalmente
npm install -g wrangler

# O con Bun
bun install -g wrangler
```

### 2. Autenticación en Cloudflare

```bash
# Iniciar sesión en Cloudflare
wrangler login
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
# Deploy a producción
wrangler pages deploy ./dist

# Deploy con mensaje personalizado
wrangler pages deploy ./dist --project-name=ticketpro

# Deploy a un branch específico (preview)
wrangler pages deploy ./dist --branch=preview
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
wrangler pages deployment list

# Ver detalles de un deployment específico
wrangler pages deployment tail
```

### Rollback a Versión Anterior
```bash
# Listar deployments
wrangler pages deployment list

# Hacer rollback (usa el deployment ID)
wrangler pages deployment rollback <deployment-id>
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
wrangler pages deploy ./dist
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



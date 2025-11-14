# TicketPro

Plataforma de venta de boletos para eventos.

## Estructura del Proyecto

```
src/
├── components/          # Componentes organizados por dominio
│   ├── ui/            # Componentes shadcn/ui
│   ├── layout/        # Header, Footer, QueryProvider
│   ├── events/        # EventCard, CategoryCard
│   ├── search/        # SearchBar, CityAutocomplete
│   ├── auth/          # AuthInitializer
│   ├── payment/       # CurrencySelector, MultiCurrencyBalance, CryptoPaymentModal
│   ├── common/        # Reutilizables (CountUp, FadeIn, etc.)
│   └── media/         # ImageWithFallback, QRCode
├── hooks/             # Custom hooks
├── stores/            # Zustand stores
├── pages/             # Páginas/routes
├── utils/             # Utilidades
├── types/             # TypeScript types
├── constants/         # Constantes
├── config/            # Configuración
└── assets/            # Assets estáticos
```

## Stack Tecnológico

- **React 18** + **TypeScript**
- **Vite** (Build tool)
- **Bun** (Runtime & Package Manager)
- **Zustand** (State Management)
- **TanStack Query** (Data Fetching)
- **shadcn/ui** + **Tailwind CSS** (UI)
- **Supabase** (Backend)

## Configuración de Variables de Entorno

⚠️ **IMPORTANTE**: Las credenciales de Supabase deben configurarse mediante variables de entorno.

### 1. Crear archivo `.env`

Crea un archivo `.env` en la raíz del proyecto con las siguientes variables:

```env
# Supabase Configuration
# Nota: En Vite, las variables de entorno deben tener el prefijo VITE_
VITE_supabase_project_id=tu_project_id
VITE_supabase_anon_key=tu_anon_key
VITE_supabase_project_url=https://tu-project-id.supabase.co

# Service Role Key (opcional, solo para backend - NUNCA exponer en frontend)
# VITE_supabase_service_role=tu_service_role_key

# URL del sitio (opcional, para SEO)
VITE_SITE_URL=https://tiquetera.com

# Supabase Edge Function (opcional, si usas una función personalizada)
# VITE_SUPABASE_API_FUNCTION_NAME=make-server-97d4f7c5
# VITE_SUPABASE_API_URL=https://tu-project-id.supabase.co/functions/v1/tu-function-name

# Cryptomus (pagos cripto)
# Variables de frontend (se exponen en el bundle)
VITE_CRYPTOMUS_API_KEY=tu_payment_api_key
VITE_CRYPTOMUS_MERCHANT_ID=tu_merchant_id

# Variables de backend (Pages Functions) - NO se exponen en el bundle
# Configúralas en el panel de Cloudflare Pages:
# - CRYPTOMUS_PAYMENT_API_KEY: tu Payment API Key (para verificar webhooks)
# - CRYPTOMUS_ACCEPT_STATUSES: (opcional) paid,paid_over,confirming,check,wrong_amount,cancel,fail
# - DEBUG_CRYPTOMUS: (opcional) "1" para depurar firmas en el webhook
```

### 2. Obtener credenciales de Supabase

1. Ve a tu proyecto en [Supabase Dashboard](https://app.supabase.com)
2. Navega a **Settings** → **API**
3. Copia el **Project ID** y la **anon/public key**
4. Pégales en tu archivo `.env`

### 3. Variables de Entorno en Producción

Para **Cloudflare Pages**:
1. Ve a tu proyecto en Cloudflare Dashboard
2. Navega a **Pages** → **Settings** → **Environment Variables**
3. Agrega las variables:
   - `VITE_SUPABASE_PROJECT_ID`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_SITE_URL` (opcional)
   - `VITE_CRYPTOMUS_API_KEY`
   - `VITE_CRYPTOMUS_MERCHANT_ID`
   - `CRYPTOMUS_PAYMENT_API_KEY` (server-side, para verificar webhooks)
   - `CRYPTOMUS_ACCEPT_STATUSES` (opcional)
   - `DEBUG_CRYPTOMUS` (opcional)

### 4. Seguridad

- ✅ El archivo `.env` está en `.gitignore` y **NO** se sube al repositorio
- ✅ Las variables con prefijo `VITE_` son públicas y se incluyen en el bundle
- ⚠️ **NO** uses la `service_role` key en el frontend (solo en el backend)
- ⚠️ La `anon` key es segura para usar en el frontend (está protegida por RLS)

## Scripts

```bash
bun run dev           # Desarrollo
bun run build         # Build producción
bun run preview       # Preview del build local
bun run lint          # Linting
bun run lint:fix      # Linting con auto-fix
bun run deploy        # Build y deploy a Cloudflare Pages
bun run deploy:preview # Build y deploy a preview branch
```

## Deployment

### Cloudflare Pages (Recomendado)

Ver documentación completa en [`CLOUDFLARE_PAGES.md`](./CLOUDFLARE_PAGES.md)

#### Comandos Rápidos:

```bash
# 1. Instalar Wrangler CLI
npm install -g wrangler
# o
bun install -g wrangler

# 2. Autenticarse (elige una opción)
# Opción A: Login interactivo (recomendado)
npx wrangler@latest login

# Opción B: Usar token de API (si tienes uno configurado)
# export CLOUDFLARE_API_TOKEN=tu_token
# export CLOUDFLARE_ACCOUNT_ID=tu_account_id

# 3. Crear proyecto (solo la primera vez)
# npx wrangler@latest pages project create ticketpro --production-branch=main

# 4. Build y deploy
bun run deploy

# O manualmente (npx instala wrangler automáticamente si no está)
bun run build
npx wrangler@latest pages deploy ./dist --project-name=ticketpro
```

#### Configuración en Dashboard:

- **Build command**: `bun run build`
- **Build output directory**: `dist`
- **Root directory**: `/`
- **Environment Variables**: `BUN_VERSION=latest` (opcional)

### Webhook de Cryptomus

- Endpoint (Pages Functions): `/api/cryptomus/webhook`
- Autenticación: se valida la firma `md5(base64(body) + CRYPTOMUS_PAYMENT_API_KEY)`
- Configura `CRYPTOMUS_PAYMENT_API_KEY` en Cloudflare Pages (NO uses prefijo `VITE_` aquí).
- Opcional: `CRYPTOMUS_ACCEPT_STATUSES` y `DEBUG_CRYPTOMUS=1` para depuración.
- Recomendado: whitelist de IP origen `91.227.144.54` para mayor seguridad.

Prueba rápida:
```bash
curl -X POST https://<tu-dominio>/api/cryptomus/webhook \
  -H 'Content-Type: application/json' \
  -H 'merchant: <tu_merchant_id>' \
  -H 'sign: <firma_calculada>' \
  -d '{}'
```

Flujo en UI:
- En Checkout selecciona “Criptomonedas” para abrir el modal `CryptoPaymentModal`.
- Se crea un invoice en Cryptomus y se monitorea su estado (pagado/expirado).


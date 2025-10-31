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
│   ├── payment/       # CurrencySelector, MultiCurrencyBalance
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


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
bun run dev      # Desarrollo
bun run build    # Build producción
bun run lint     # Linting
```


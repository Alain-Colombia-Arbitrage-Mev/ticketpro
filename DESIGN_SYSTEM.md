# Sistema de Diseño - Regla 60-30-10

Este documento describe el sistema de colores basado en la regla 60-30-10 aplicado a la aplicación.

## Regla 60-30-10

La regla 60-30-10 es un principio de diseño de color que establece:

- **60%**: Color dominante (base/neutro) - Usado para fondos principales
- **30%**: Color secundario (contraste) - Usado para cards, bordes, elementos secundarios
- **10%**: Color de acento (énfasis) - Usado para botones primarios, CTAs, elementos destacados

## Paleta de Colores

### Light Mode

#### 60% - Color Dominante (Base)
- **Fondo Principal**: `#fafafa` (gris muy claro)
- **Cards/Contenedores**: `#ffffff` (blanco)
- **Texto Principal**: `#0a0a0a` (casi negro)
- **Uso**: Fondos de página, fondos principales, cards grandes

#### 30% - Color Secundario (Contraste)
- **Cards Secundarios**: `#f1f5f9` (gris claro)
- **Bordes**: `#e2e8f0` (gris medio claro)
- **Texto Secundario**: `#0f172a` (gris oscuro)
- **Uso**: Cards pequeños, bordes, elementos de navegación secundarios, inputs

#### 10% - Color de Acento (Énfasis)
- **Acento Principal**: `#2563eb` (azul)
- **Hover**: `#1d4ed8` (azul más oscuro)
- **Texto sobre Acento**: `#ffffff` (blanco)
- **Uso**: Botones primarios, links importantes, badges destacados, CTAs

### Dark Mode

#### 60% - Color Dominante (Base)
- **Fondo Principal**: `oklch(0.145 0 0)` (gris muy oscuro)
- **Cards/Contenedores**: `oklch(0.2 0 0)` (gris oscuro)
- **Texto Principal**: `oklch(0.985 0 0)` (blanco)
- **Uso**: Fondos de página, fondos principales, cards grandes

#### 30% - Color Secundario (Contraste)
- **Cards Secundarios**: `oklch(0.269 0 0)` (gris medio oscuro)
- **Bordes**: `oklch(0.269 0 0)` (gris medio oscuro)
- **Texto Secundario**: `oklch(0.985 0 0)` (blanco)
- **Uso**: Cards pequeños, bordes, elementos de navegación secundarios, inputs

#### 10% - Color de Acento (Énfasis)
- **Acento Principal**: `oklch(0.488 0.243 264.376)` (azul)
- **Hover**: `oklch(0.546 0.245 262.881)` (azul más claro)
- **Texto sobre Acento**: `oklch(0.985 0 0)` (blanco)
- **Uso**: Botones primarios, links importantes, badges destacados, CTAs

## Aplicación en Componentes

### Fondos (60%)
- `bg-background` - Fondo principal de la página
- `bg-card` - Fondos de cards principales
- `bg-white` (light) / `bg-gray-900` (dark) - Fondos de contenedores

### Elementos Secundarios (30%)
- `bg-secondary` - Fondos de cards secundarios
- `border-border` - Bordes de elementos
- `bg-muted` - Fondos de elementos deshabilitados/muted

### Acentos (10%)
- `bg-primary` - Botones primarios
- `text-primary` - Links importantes
- `border-primary` - Bordes de elementos activos
- `ring-primary` - Focus rings

## Variables CSS

Todas las variables están disponibles en:
- `--color-dominant` / `--color-dominant-foreground`
- `--color-secondary` / `--color-secondary-foreground`
- `--color-accent` / `--color-accent-foreground`

## Clases de Utilidad

- `.color-dominant` - Aplica color dominante
- `.color-secondary` - Aplica color secundario
- `.color-accent` - Aplica color de acento
- `.text-accent` - Texto con color de acento
- `.border-secondary` - Borde con color secundario

## Ejemplos de Uso

### Página Principal
- **60%**: Fondo blanco/gris claro de la página
- **30%**: Cards de eventos, bordes de secciones
- **10%**: Botones "Comprar Tickets", badges destacados

### Header
- **60%**: Fondo del header (blanco/gris oscuro)
- **30%**: Bordes, elementos de navegación secundarios
- **10%**: Botón "Mis Tickets", selector de tema activo

### Cards de Eventos
- **60%**: Fondo del card
- **30%**: Bordes, información secundaria
- **10%**: Badge "Destacado", botón "Comprar Tickets"

## Notas Importantes

1. **Nunca usar más del 10% de color de acento** - Solo para elementos que necesitan destacar
2. **El 60% debe ser siempre neutro** - Facilita la legibilidad
3. **El 30% crea jerarquía** - Ayuda a organizar el contenido
4. **Consistencia es clave** - Usar las variables CSS definidas, no valores hardcodeados


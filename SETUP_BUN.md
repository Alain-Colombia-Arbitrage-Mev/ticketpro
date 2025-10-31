# Configuración de Bun para PowerShell

## Problema
Bun está instalado pero no está en el PATH del sistema, por lo que no se reconoce el comando `bun`.

## Solución Temporal (Para esta sesión)

Ejecuta en PowerShell:
```powershell
. .\.bun-path.ps1
```

Esto agregará Bun al PATH de la sesión actual de PowerShell.

## Solución Permanente

### Opción 1: Agregar al PATH del Sistema (Recomendado)

1. Abre "Variables de entorno" desde el Panel de Control o busca "environment variables" en Windows
2. En "Variables del sistema", edita la variable `Path`
3. Agrega: `%USERPROFILE%\.bun\bin`
4. Acepta y reinicia PowerShell/Terminal

### Opción 2: Agregar al perfil de PowerShell

Ejecuta en PowerShell:
```powershell
notepad $PROFILE
```

Y agrega esta línea:
```powershell
$env:PATH += ";$env:USERPROFILE\.bun\bin"
```

Guarda y ejecuta:
```powershell
. $PROFILE
```

## Verificación

Después de configurar, verifica que funcione:
```powershell
bun --version
```

Deberías ver: `1.3.1` (o la versión que tengas instalada)

## Nota sobre el Lockfile

Si ves un error `EINVAL: Failed to replace old lockfile`, las dependencias ya están instaladas y el proyecto funciona correctamente. El error del lockfile no afecta el funcionamiento.

## Comandos Útiles

```powershell
# Instalar dependencias
bun install

# Ejecutar desarrollo
bun run dev

# Ejecutar build
bun run build

# Type check
bun run type-check

# Lint
bun run lint
```


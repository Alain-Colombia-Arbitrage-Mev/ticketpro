# Script para agregar Bun al PATH en esta sesión de PowerShell
# Ejecutar: . .\.bun-path.ps1

$bunPath = "$env:USERPROFILE\.bun\bin"
if (Test-Path $bunPath) {
    if ($env:PATH -notlike "*$bunPath*") {
        $env:PATH = "$env:PATH;$bunPath"
        Write-Host "✅ Bun agregado al PATH de esta sesión" -ForegroundColor Green
        Write-Host "Bun versión:" (bun --version) -ForegroundColor Cyan
    } else {
        Write-Host "✅ Bun ya está en el PATH" -ForegroundColor Green
    }
} else {
    Write-Host "❌ Bun no encontrado en $bunPath" -ForegroundColor Red
}


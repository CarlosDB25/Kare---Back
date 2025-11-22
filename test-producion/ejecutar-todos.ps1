# KARE - Tests de Produccion Organizados
$ErrorActionPreference = "Continue"

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "KARE - Suite de Tests de Produccion" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Limpiar BD antes de ejecutar tests
Write-Host "PASO 1: Limpiando incapacidades de test anteriores..." -ForegroundColor Yellow
& "$PSScriptRoot\limpiar-bd.ps1"
Write-Host "`nPASO 2: Ejecutando suite de tests...`n" -ForegroundColor Yellow

$API_URL = "https://kare-back.onrender.com/api"
$CREDENCIALES = @{
    GH = @{ email = "gh@kare.com"; password = "123456" }
    Conta = @{ email = "conta@kare.com"; password = "123456" }
    Lider = @{ email = "lider1@kare.com"; password = "123456" }
    Colab1 = @{ email = "colab1@kare.com"; password = "123456" }
    Colab2 = @{ email = "colab2@kare.com"; password = "123456" }
}

$global:totalTests = 0
$global:testsPasados = 0
$global:testsFallidos = 0
$global:tokens = @{}

function Get-Token($rol) {
    if ($global:tokens.ContainsKey($rol)) {
        return $global:tokens[$rol]
    }
    
    $cred = $CREDENCIALES[$rol]
    try {
        $response = Invoke-RestMethod -Uri "$API_URL/auth/login" -Method POST -Body ($cred | ConvertTo-Json) -ContentType "application/json" -TimeoutSec 10
        $global:tokens[$rol] = $response.data.token
        return $response.data.token
    } catch {
        Write-Host "Error obteniendo token $rol" -ForegroundColor Red
        return $null
    }
}

function Test-Endpoint($nombre, $codigo) {
    $global:totalTests++
    Write-Host "  [$global:totalTests] $nombre" -NoNewline
    try {
        & $codigo
        $global:testsPasados++
        Write-Host " - OK" -ForegroundColor Green
    } catch {
        $global:testsFallidos++
        Write-Host " - FALLO: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Clear-Host
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "KARE API - TESTS DE PRODUCCION" -ForegroundColor Yellow
Write-Host "========================================`n" -ForegroundColor Cyan

$inicio = Get-Date

# Verificar API
Write-Host "Verificando API..." -NoNewline
try {
    Invoke-RestMethod -Uri "$API_URL/health" -TimeoutSec 10 | Out-Null
    Write-Host " OK`n" -ForegroundColor Green
} catch {
    Write-Host " ERROR - API no responde`n" -ForegroundColor Red
    exit 1
}

# Ejecutar tests modulares
Get-ChildItem "$PSScriptRoot\tests\*.ps1" | Sort-Object Name | ForEach-Object {
    Write-Host "`n--- $($_.BaseName) ---" -ForegroundColor Yellow
    . $_.FullName
}

# Resumen
$tiempo = ((Get-Date) - $inicio).TotalSeconds
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "RESUMEN FINAL" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Total: $global:totalTests"
Write-Host "Pasados: $global:testsPasados" -ForegroundColor Green
Write-Host "Fallidos: $global:testsFallidos" -ForegroundColor $(if($global:testsFallidos -eq 0){"Green"}else{"Red"})
if ($global:totalTests -gt 0) {
    $porcentaje = [math]::Round(($global:testsPasados / $global:totalTests) * 100, 2)
    Write-Host "Exito: $porcentaje%" -ForegroundColor $(if($porcentaje -eq 100){"Green"}else{"Yellow"})
}
Write-Host "Tiempo: $([math]::Round($tiempo, 1))s`n"

if ($global:testsFallidos -eq 0) { exit 0 } else { exit 1 }

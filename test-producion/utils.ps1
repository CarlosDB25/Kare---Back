# Utilidades para Tests de Producción

# Variables globales para estadísticas
$global:totalTests = 0
$global:testsPasados = 0
$global:testsFallidos = 0
$global:tokens = @{}

# Función para ejecutar un test
function Test-Endpoint {
    param(
        [string]$Nombre,
        [scriptblock]$Codigo,
        [string]$Categoria = "General"
    )
    
    $global:totalTests++
    $numero = $global:totalTests
    
    Write-Host "`n[$numero] $Nombre" -ForegroundColor Cyan
    
    try {
        & $Codigo
        $global:testsPasados++
        Write-Host "    ✓ PASÓ" -ForegroundColor Green
        return $true
    } catch {
        $global:testsFallidos++
        $mensaje = $_.Exception.Message
        # Simplificar mensajes de error largos
        if ($mensaje.Length -gt 100) {
            $mensaje = $mensaje.Substring(0, 97) + "..."
        }
        Write-Host "    ✗ FALLÓ: $mensaje" -ForegroundColor Red
        return $false
    }
}

# Función para obtener token fresco
function Get-Token {
    param([string]$Rol)
    
    if (-not $global:CREDENCIALES.ContainsKey($Rol)) {
        throw "Rol inválido: $Rol"
    }
    
    $cred = $global:CREDENCIALES[$Rol]
    $body = @{ 
        email = $cred.email
        password = $cred.password 
    } | ConvertTo-Json
    
    try {
        $response = Invoke-RestMethod `
            -Uri "$global:API_URL/auth/login" `
            -Method Post `
            -Body $body `
            -ContentType "application/json" `
            -TimeoutSec $global:TIMEOUT_NORMAL
        
        $token = $response.data.token
        $global:tokens[$Rol] = $token
        return $token
    } catch {
        throw "Error obteniendo token para $Rol : $($_.Exception.Message)"
    }
}

# Función para hacer request con token
function Invoke-ApiRequest {
    param(
        [string]$Endpoint,
        [string]$Method = "GET",
        [string]$Rol,
        [object]$Body = $null,
        [int]$ExpectedStatus = 200
    )
    
    $headers = @{}
    
    if ($Rol) {
        if (-not $global:tokens.ContainsKey($Rol)) {
            Get-Token $Rol | Out-Null
        }
        $headers["Authorization"] = "Bearer $($global:tokens[$Rol])"
    }
    
    $params = @{
        Uri = "$global:API_URL$Endpoint"
        Method = $Method
        TimeoutSec = $global:TIMEOUT_NORMAL
    }
    
    if ($headers.Count -gt 0) {
        $params["Headers"] = $headers
    }
    
    if ($Body) {
        $params["Body"] = ($Body | ConvertTo-Json)
        $params["ContentType"] = "application/json"
    }
    
    try {
        $response = Invoke-RestMethod @params
        return $response
    } catch {
        if ($_.Exception.Response.StatusCode.value__ -eq $ExpectedStatus) {
            throw $_
        }
        throw $_
    }
}

# Función para mostrar resumen
function Show-Resumen {
    param([string]$Titulo = "")
    
    Write-Host "`n========================================" -ForegroundColor Cyan
    if ($Titulo) {
        Write-Host "RESUMEN: $Titulo" -ForegroundColor Yellow
    } else {
        Write-Host "RESUMEN FINAL" -ForegroundColor Yellow
    }
    Write-Host "========================================`n" -ForegroundColor Cyan
    
    Write-Host "Total: $global:totalTests" -ForegroundColor White
    Write-Host "✓ Pasados: $global:testsPasados" -ForegroundColor Green
    Write-Host "✗ Fallidos: $global:testsFallidos" -ForegroundColor $(if ($global:testsFallidos -gt 0) { "Red" } else { "Green" })
    
    $porcentaje = if ($global:totalTests -gt 0) { 
        [math]::Round(($global:testsPasados / $global:totalTests) * 100, 2) 
    } else { 
        0 
    }
    
    Write-Host "`nTasa de éxito: $porcentaje%`n" -ForegroundColor $(
        if ($porcentaje -eq 100) { "Green" } 
        elseif ($porcentaje -ge 90) { "Yellow" } 
        else { "Red" }
    )
    
    if ($porcentaje -eq 100) {
        Write-Host "✅ API VALIDADA AL 100%" -ForegroundColor Green
        Write-Host "Todas las funcionalidades operativas`n" -ForegroundColor Green
    } elseif ($porcentaje -ge 90) {
        Write-Host "✅ API FUNCIONANDO CORRECTAMENTE (>90%)" -ForegroundColor Green
    } elseif ($porcentaje -ge 70) {
        Write-Host "⚠️  API PARCIALMENTE FUNCIONAL (70-90%)" -ForegroundColor Yellow
    } else {
        Write-Host "❌ API CON PROBLEMAS GRAVES (<70%)" -ForegroundColor Red
    }
}

# Función para resetear contadores (útil para tests individuales)
function Reset-Contadores {
    $global:totalTests = 0
    $global:testsPasados = 0
    $global:testsFallidos = 0
    $global:tokens = @{}
}

# Función para verificar si API está despierta (cold start)
function Test-ApiDespierta {
    Write-Host "`n🔄 Verificando si API está despierta..." -ForegroundColor Yellow
    
    try {
        $start = Get-Date
        Invoke-RestMethod -Uri "$global:API_URL/health" -Method Get -TimeoutSec 30 | Out-Null
        $duration = (Get-Date) - $start
        
        if ($duration.TotalSeconds -gt 15) {
            Write-Host "⚠️  API estaba hibernada (cold start: $([math]::Round($duration.TotalSeconds, 1))s)" -ForegroundColor Yellow
            Write-Host "   Esperando 5 segundos adicionales..." -ForegroundColor Gray
            Start-Sleep -Seconds 5
        } else {
            Write-Host "✓ API lista ($([math]::Round($duration.TotalSeconds, 1))s)" -ForegroundColor Green
        }
        
        return $true
    } catch {
        Write-Host "❌ API no responde: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

Write-Host "✓ Utilidades cargadas" -ForegroundColor Gray

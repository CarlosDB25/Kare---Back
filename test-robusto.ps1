# KARE API - Testing Robusto
$API_URL = "https://kare-back.onrender.com/api"
$ErrorActionPreference = "Continue"

$totalTests = 0
$testsPasados = 0
$testsFallidos = 0

function Test-Endpoint {
    param([string]$Nombre, [scriptblock]$Codigo)
    $script:totalTests++
    Write-Host "`n[$script:totalTests] $Nombre" -ForegroundColor Cyan
    try {
        & $Codigo
        $script:testsPasados++
        Write-Host "    PASÓ" -ForegroundColor Green
    } catch {
        $script:testsFallidos++
        Write-Host "    FALLÓ: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "KARE API - Testing Robusto" -ForegroundColor Yellow
Write-Host "========================================`n" -ForegroundColor Cyan

$script:tokenGH = $null
$script:tokenConta = $null
$script:tokenLider = $null
$script:tokenColab1 = $null
$script:tokenColab2 = $null
$script:incapacidadId = $null
$script:incapacidadId2 = $null
$script:conciliacionId = $null
$script:reemplazoId = $null

# AUTENTICACIÓN
Test-Endpoint "Health Check" {
    $health = Invoke-RestMethod -Uri "$API_URL/health" -Method Get
    if ($health.success -ne $true) { throw "Health check falló" }
}

Test-Endpoint "Login GH" {
    $body = @{ email = "gh@kare.com"; password = "123456" } | ConvertTo-Json
    $response = Invoke-RestMethod -Uri "$API_URL/auth/login" -Method Post -Body $body -ContentType "application/json"
    $script:tokenGH = $response.data.token
}

Test-Endpoint "Login Conta" {
    $body = @{ email = "conta@kare.com"; password = "123456" } | ConvertTo-Json
    $response = Invoke-RestMethod -Uri "$API_URL/auth/login" -Method Post -Body $body -ContentType "application/json"
    $script:tokenConta = $response.data.token
}

Test-Endpoint "Login Líder" {
    $body = @{ email = "lider1@kare.com"; password = "123456" } | ConvertTo-Json
    $response = Invoke-RestMethod -Uri "$API_URL/auth/login" -Method Post -Body $body -ContentType "application/json"
    $script:tokenLider = $response.data.token
}

Test-Endpoint "Login Colaborador 1" {
    $body = @{ email = "colab1@kare.com"; password = "123456" } | ConvertTo-Json
    $response = Invoke-RestMethod -Uri "$API_URL/auth/login" -Method Post -Body $body -ContentType "application/json"
    $script:tokenColab1 = $response.data.token
}

Test-Endpoint "Login Colaborador 2" {
    $body = @{ email = "colab2@kare.com"; password = "123456" } | ConvertTo-Json
    $response = Invoke-RestMethod -Uri "$API_URL/auth/login" -Method Post -Body $body -ContentType "application/json"
    $script:tokenColab2 = $response.data.token
}

Test-Endpoint "Rechazar acceso sin token" {
    try {
        Invoke-RestMethod -Uri "$API_URL/auth/profile" -Method Get
        throw "Debió rechazar"
    } catch {
        if ($_.Exception.Response.StatusCode -eq 401) { return }
        throw $_
    }
}

# USUARIOS
Test-Endpoint "Listar usuarios (GH)" {
    $headers = @{ "Authorization" = "Bearer $script:tokenGH" }
    $usuarios = Invoke-RestMethod -Uri "$API_URL/usuarios" -Method Get -Headers $headers
    if ($usuarios.data.Count -ne 5) { throw "Debería haber 5 usuarios" }
}

Test-Endpoint "Colaborador NO ve usuarios (403)" {
    try {
        $headers = @{ "Authorization" = "Bearer $script:tokenColab1" }
        Invoke-RestMethod -Uri "$API_URL/usuarios" -Method Get -Headers $headers
        throw "No debería permitir"
    } catch {
        if ($_.Exception.Response.StatusCode -eq 403) { return }
        throw $_
    }
}

# INCAPACIDADES
Test-Endpoint "Crear incapacidad EPS (Colab 1)" {
    $headers = @{ "Authorization" = "Bearer $script:tokenColab1"; "Content-Type" = "application/json" }
    $body = @{ tipo = "EPS"; diagnostico = "Gripe test"; fecha_inicio = "2025-11-23"; fecha_fin = "2025-11-27" } | ConvertTo-Json
    $response = Invoke-RestMethod -Uri "$API_URL/incapacidades" -Method Post -Body $body -Headers $headers
    $script:incapacidadId = $response.data.id
    if (!$script:incapacidadId) { throw "No se obtuvo ID" }
}

Test-Endpoint "Crear incapacidad ARL (Colab 2)" {
    $headers = @{ "Authorization" = "Bearer $script:tokenColab2"; "Content-Type" = "application/json" }
    $body = @{ tipo = "ARL"; diagnostico = "Fractura"; fecha_inicio = "2025-11-24"; fecha_fin = "2025-12-24" } | ConvertTo-Json
    $response = Invoke-RestMethod -Uri "$API_URL/incapacidades" -Method Post -Body $body -Headers $headers
    $script:incapacidadId2 = $response.data.id
}

Test-Endpoint "Validar fechas incoherentes" {
    try {
        $headers = @{ "Authorization" = "Bearer $script:tokenColab1"; "Content-Type" = "application/json" }
        $body = @{ tipo = "EPS"; diagnostico = "Test"; fecha_inicio = "2025-12-31"; fecha_fin = "2025-12-01" } | ConvertTo-Json
        Invoke-RestMethod -Uri "$API_URL/incapacidades" -Method Post -Body $body -Headers $headers
        throw "Debió rechazar"
    } catch {
        if ($_.Exception.Response.StatusCode -eq 400) { return }
        throw $_
    }
}

Test-Endpoint "GH ve todas las incapacidades" {
    $headers = @{ "Authorization" = "Bearer $script:tokenGH" }
    $incaps = Invoke-RestMethod -Uri "$API_URL/incapacidades" -Method Get -Headers $headers
    if ($incaps.data.Count -lt 2) { throw "Deberían haber >= 2" }
}

Test-Endpoint "Colaborador ve solo las suyas" {
    $headers = @{ "Authorization" = "Bearer $script:tokenColab1" }
    $incaps = Invoke-RestMethod -Uri "$API_URL/incapacidades" -Method Get -Headers $headers
    foreach ($i in $incaps.data) {
        if ($i.usuario_id -ne 4) { throw "Ve de otros" }
    }
}

# ESTADOS (solo si tenemos ID válido)
if ($script:incapacidadId) {
    Test-Endpoint "Cambiar a en_revision (GH)" {
        $headers = @{ "Authorization" = "Bearer $script:tokenGH"; "Content-Type" = "application/json" }
        $body = @{ estado = "en_revision"; observaciones = "Revisando" } | ConvertTo-Json
        $response = Invoke-RestMethod -Uri "$API_URL/incapacidades/$script:incapacidadId/estado" -Method Put -Body $body -Headers $headers
        if ($response.data.estado -ne "en_revision") { throw "Estado no cambió" }
    }

    Test-Endpoint "Cambiar a validada (Conta)" {
        $headers = @{ "Authorization" = "Bearer $script:tokenConta"; "Content-Type" = "application/json" }
        $body = @{ estado = "validada"; observaciones = "OK" } | ConvertTo-Json
        $response = Invoke-RestMethod -Uri "$API_URL/incapacidades/$script:incapacidadId/estado" -Method Put -Body $body -Headers $headers
        if ($response.data.estado -ne "validada") { throw "Estado no cambió" }
    }

    Test-Endpoint "Colaborador NO cambia estados (403)" {
        try {
            $headers = @{ "Authorization" = "Bearer $script:tokenColab1"; "Content-Type" = "application/json" }
            $body = @{ estado = "pagada" } | ConvertTo-Json
            Invoke-RestMethod -Uri "$API_URL/incapacidades/$script:incapacidadId/estado" -Method Put -Body $body -Headers $headers
            throw "No debería permitir"
        } catch {
            if ($_.Exception.Response.StatusCode -eq 403) { return }
            throw $_
        }
    }

    # CONCILIACIONES
    Test-Endpoint "Crear conciliación (Conta)" {
        $headers = @{ "Authorization" = "Bearer $script:tokenConta"; "Content-Type" = "application/json" }
        $body = @{ incapacidad_id = $script:incapacidadId; observaciones = "Test" } | ConvertTo-Json
        $response = Invoke-RestMethod -Uri "$API_URL/conciliaciones" -Method Post -Body $body -Headers $headers
        $script:conciliacionId = $response.data.id
    }

    Test-Endpoint "Listar conciliaciones (GH)" {
        $headers = @{ "Authorization" = "Bearer $script:tokenGH" }
        $concils = Invoke-RestMethod -Uri "$API_URL/conciliaciones" -Method Get -Headers $headers
        if ($concils.data.Count -lt 1) { throw "Debería haber >= 1" }
    }

    Test-Endpoint "Estadísticas financieras" {
        $headers = @{ "Authorization" = "Bearer $script:tokenConta" }
        $stats = Invoke-RestMethod -Uri "$API_URL/conciliaciones/estadisticas" -Method Get -Headers $headers
        if (!$stats.data) { throw "Sin datos" }
    }

    Test-Endpoint "Colaborador NO ve conciliaciones (403)" {
        try {
            $headers = @{ "Authorization" = "Bearer $script:tokenColab1" }
            Invoke-RestMethod -Uri "$API_URL/conciliaciones" -Method Get -Headers $headers
            throw "No debería permitir"
        } catch {
            if ($_.Exception.Response.StatusCode -eq 403) { return }
            throw $_
        }
    }

    # REEMPLAZOS
    Test-Endpoint "Crear reemplazo (Líder)" {
        $headers = @{ "Authorization" = "Bearer $script:tokenLider"; "Content-Type" = "application/json" }
        $body = @{ incapacidad_id = $script:incapacidadId; colaborador_reemplazo_id = 5; fecha_inicio = "2025-11-23"; fecha_fin = "2025-11-27"; observaciones = "Temporal" } | ConvertTo-Json
        $response = Invoke-RestMethod -Uri "$API_URL/reemplazos" -Method Post -Body $body -Headers $headers
        $script:reemplazoId = $response.data.id
    }

    Test-Endpoint "Validar anti auto-reemplazo" {
        try {
            $headers = @{ "Authorization" = "Bearer $script:tokenLider"; "Content-Type" = "application/json" }
            $body = @{ incapacidad_id = $script:incapacidadId; colaborador_reemplazo_id = 4; fecha_inicio = "2025-11-23"; fecha_fin = "2025-11-27" } | ConvertTo-Json
            Invoke-RestMethod -Uri "$API_URL/reemplazos" -Method Post -Body $body -Headers $headers
            throw "Debió rechazar"
        } catch {
            if ($_.Exception.Response.StatusCode -eq 400) { return }
            throw $_
        }
    }

    if ($script:reemplazoId) {
        Test-Endpoint "Finalizar reemplazo" {
            $headers = @{ "Authorization" = "Bearer $script:tokenLider"; "Content-Type" = "application/json" }
            $body = @{ observaciones = "Completado" } | ConvertTo-Json
            $response = Invoke-RestMethod -Uri "$API_URL/reemplazos/$script:reemplazoId/finalizar" -Method Put -Body $body -Headers $headers
            if ($response.data.estado -ne "finalizado") { throw "No finalizó" }
        }
    }
}

# NOTIFICACIONES
Test-Endpoint "Listar notificaciones" {
    $headers = @{ "Authorization" = "Bearer $script:tokenGH" }
    $notifs = Invoke-RestMethod -Uri "$API_URL/notificaciones" -Method Get -Headers $headers
}

Test-Endpoint "Contador no leídas" {
    $headers = @{ "Authorization" = "Bearer $script:tokenColab1" }
    $count = Invoke-RestMethod -Uri "$API_URL/notificaciones/no-leidas/count" -Method Get -Headers $headers
}

# VALIDACIONES
Test-Endpoint "Validar límite EPS (max 180 días)" {
    try {
        $headers = @{ "Authorization" = "Bearer $script:tokenColab1"; "Content-Type" = "application/json" }
        $body = @{ tipo = "EPS"; diagnostico = "Test"; fecha_inicio = "2025-11-21"; fecha_fin = "2026-07-21" } | ConvertTo-Json
        Invoke-RestMethod -Uri "$API_URL/incapacidades" -Method Post -Body $body -Headers $headers
        throw "Debió rechazar"
    } catch {
        if ($_.Exception.Response.StatusCode -eq 400) { return }
        throw $_
    }
}

# RESUMEN
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "RESUMEN" -ForegroundColor Yellow
Write-Host "========================================`n" -ForegroundColor Cyan
Write-Host "Total: $totalTests" -ForegroundColor White
Write-Host "Pasados: $testsPasados" -ForegroundColor Green
Write-Host "Fallidos: $testsFallidos" -ForegroundColor $(if ($testsFallidos -gt 0) { "Red" } else { "Green" })
$porcentaje = [math]::Round(($testsPasados / $totalTests) * 100, 2)
Write-Host "Tasa de éxito: $porcentaje%`n" -ForegroundColor $(if ($porcentaje -eq 100) { "Green" } else { "Yellow" })

if ($testsFallidos -eq 0) {
    Write-Host "API VALIDADA AL 100%" -ForegroundColor Green
    Write-Host "Todas las funcionalidades críticas operativas`n" -ForegroundColor Green
} else {
    Write-Host "ATENCIÓN: $testsFallidos test(s) fallaron" -ForegroundColor Yellow
    Write-Host "Revisar logs arriba para detalles`n" -ForegroundColor Gray
}

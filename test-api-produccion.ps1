# ========================================
# KARE API - Testing Completo en Producción
# Uso: .\test-api-produccion.ps1
# ========================================

$API_URL = "https://kare-back.onrender.com/api"

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "KARE API - Testing Completo" -ForegroundColor Yellow
Write-Host "========================================`n" -ForegroundColor Cyan

# 1. Health Check
Write-Host "[1/8] Health Check..." -ForegroundColor Green
try {
    $health = Invoke-RestMethod -Uri "$API_URL/health" -Method Get
    Write-Host "    Servidor activo: $($health.message)" -ForegroundColor White
    Write-Host "    Timestamp: $($health.data.timestamp)`n" -ForegroundColor Gray
} catch {
    Write-Host "    Error en health check: $($_.Exception.Message)`n" -ForegroundColor Red
    exit 1
}

# 2. Login como GH (Admin)
Write-Host "[2/8] Login como GH..." -ForegroundColor Green
try {
    $loginBody = @{
        email = "gh@kare.com"
        password = "123456"
    } | ConvertTo-Json

    $login = Invoke-RestMethod -Uri "$API_URL/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
    $token = $login.data.token
    Write-Host "    Login exitoso. Usuario: $($login.data.usuario.nombre)" -ForegroundColor White
    Write-Host "    Token: $($token.Substring(0,20))...`n" -ForegroundColor Gray
} catch {
    Write-Host "    Error en login: $($_.Exception.Message)`n" -ForegroundColor Red
    exit 1
}

# 3. Ver perfil
Write-Host "[3/8] Obteniendo perfil..." -ForegroundColor Green
try {
    $headers = @{
        "Authorization" = "Bearer $token"
    }
    $perfil = Invoke-RestMethod -Uri "$API_URL/auth/profile" -Method Get -Headers $headers
    Write-Host "    Perfil: $($perfil.data.nombre) - Rol: $($perfil.data.rol)`n" -ForegroundColor White
} catch {
    Write-Host "    Error al obtener perfil: $($_.Exception.Message)`n" -ForegroundColor Red
}

# 4. Listar usuarios
Write-Host "[4/8] Listando usuarios..." -ForegroundColor Green
try {
    $usuarios = Invoke-RestMethod -Uri "$API_URL/usuarios" -Method Get -Headers $headers
    Write-Host "    Total usuarios: $($usuarios.data.Count)`n" -ForegroundColor White
    $usuarios.data | Format-Table id, nombre, email, rol -AutoSize
    Write-Host ""
} catch {
    Write-Host "    Error al listar usuarios: $($_.Exception.Message)`n" -ForegroundColor Red
}

# 5. Login como colaborador
Write-Host "[5/8] Login como colaborador..." -ForegroundColor Green
try {
    $loginColab = @{
        email = "colab1@kare.com"
        password = "123456"
    } | ConvertTo-Json

    $responseColab = Invoke-RestMethod -Uri "$API_URL/auth/login" -Method Post -Body $loginColab -ContentType "application/json"
    $tokenColab = $responseColab.data.token
    Write-Host "    Login como: $($responseColab.data.usuario.nombre)`n" -ForegroundColor White
} catch {
    Write-Host "    Error en login colaborador: $($_.Exception.Message)`n" -ForegroundColor Red
}

# 6. Crear incapacidad
Write-Host "[6/8] Creando incapacidad..." -ForegroundColor Green
try {
    $incapBody = @{
        tipo = "EPS"
        diagnostico = "Gripe común - Test desde PowerShell"
        fecha_inicio = "2025-11-21"
        fecha_fin = "2025-11-25"
    } | ConvertTo-Json

    $headersColab = @{
        "Authorization" = "Bearer $tokenColab"
        "Content-Type" = "application/json"
    }
    
    $nuevaIncap = Invoke-RestMethod -Uri "$API_URL/incapacidades" -Method Post -Body $incapBody -Headers $headersColab
    Write-Host "    Incapacidad ID $($nuevaIncap.data.id) creada" -ForegroundColor White
    Write-Host "    Tipo: $($nuevaIncap.data.tipo)" -ForegroundColor Gray
    Write-Host "    Diagnóstico: $($nuevaIncap.data.diagnostico)" -ForegroundColor Gray
    Write-Host "    Días: $($nuevaIncap.data.dias_totales)" -ForegroundColor Gray
    Write-Host "    Estado: $($nuevaIncap.data.estado)`n" -ForegroundColor Gray
    
    $incapacidadId = $nuevaIncap.data.id
} catch {
    Write-Host "    Error al crear incapacidad: $($_.Exception.Message)`n" -ForegroundColor Red
    $incapacidadId = $null
}

# 7. Listar incapacidades
Write-Host "[7/8] Listando incapacidades..." -ForegroundColor Green
try {
    $incapacidades = Invoke-RestMethod -Uri "$API_URL/incapacidades" -Method Get -Headers $headers
    Write-Host "    Total: $($incapacidades.data.Count) incapacidades`n" -ForegroundColor White
    
    if ($incapacidades.data.Count -gt 0) {
        $incapacidades.data | Format-Table id, tipo, diagnostico, estado, dias_totales -AutoSize
        Write-Host ""
    }
} catch {
    Write-Host "    Error al listar incapacidades: $($_.Exception.Message)`n" -ForegroundColor Red
}

# 8. Ver notificaciones
Write-Host "[8/8] Verificando notificaciones..." -ForegroundColor Green
try {
    $notificaciones = Invoke-RestMethod -Uri "$API_URL/notificaciones" -Method Get -Headers $headers
    Write-Host "    Notificaciones: $($notificaciones.data.Count) total`n" -ForegroundColor White
    
    if ($notificaciones.data.Count -gt 0) {
        $notificaciones.data | Select-Object -First 5 | Format-Table id, titulo, tipo, leida -AutoSize
        Write-Host ""
    }
} catch {
    Write-Host "    Error al ver notificaciones: $($_.Exception.Message)`n" -ForegroundColor Red
}

# Resumen final
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "TESTING COMPLETADO" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "API URL: $API_URL" -ForegroundColor White
Write-Host "Token GH guardado en: `$token" -ForegroundColor Gray
Write-Host "Token Colaborador en: `$tokenColab`n" -ForegroundColor Gray

Write-Host "Para hacer más pruebas:" -ForegroundColor Yellow
Write-Host "  `$headers = @{ 'Authorization' = 'Bearer `$token' }" -ForegroundColor Gray
Write-Host "  Invoke-RestMethod -Uri '`$API_URL/usuarios' -Headers `$headers`n" -ForegroundColor Gray

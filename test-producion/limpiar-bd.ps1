# Script de limpieza de incapacidades de test
$API_URL = "https://kare-back.onrender.com/api"
$CREDENCIALES = @{
    email = "gh@kare.com"
    password = "123456"
}

Write-Host "`nLimpiando incapacidades de test..." -ForegroundColor Yellow

try {
    $loginResponse = Invoke-RestMethod -Uri "$API_URL/auth/login" -Method POST -Body ($CREDENCIALES | ConvertTo-Json) -ContentType "application/json" -ErrorAction Stop
    $token = $loginResponse.data.token
    $headers = @{ Authorization = "Bearer $token" }

    $incapacidades = Invoke-RestMethod -Uri "$API_URL/incapacidades" -Headers $headers -ErrorAction Stop
    $totales = $incapacidades.data.Count

    Write-Host "Total incapacidades: $totales" -ForegroundColor Cyan

    $incapsTest = $incapacidades.data | Where-Object { 
        $_.diagnostico -match "AT-|Test|AutoTest|Debug|AUTOTEST|test" 
    }

    if ($incapsTest.Count -eq 0) {
        Write-Host "No hay incapacidades de test." -ForegroundColor Green
        exit 0
    }

    Write-Host "Incapacidades de test: $($incapsTest.Count)" -ForegroundColor Yellow

    $eliminadas = 0

    foreach ($incap in $incapsTest) {
        try {
            Write-Host "  Eliminando ID $($incap.id): $($incap.diagnostico)..." -NoNewline
            Invoke-RestMethod -Uri "$API_URL/incapacidades/$($incap.id)" -Method DELETE -Headers $headers -ErrorAction Stop | Out-Null
            Write-Host " OK" -ForegroundColor Green
            $eliminadas++
        } catch {
            Write-Host " ERROR" -ForegroundColor Red
        }
    }

    Write-Host "`nEliminadas: $eliminadas / $($incapsTest.Count)" -ForegroundColor Cyan

} catch {
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

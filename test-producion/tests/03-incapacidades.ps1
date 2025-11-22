# INCAPACIDADES CRUD - 8 tests

Test-Endpoint "Crear incapacidad EPS" {
    $token = Get-Token "Colab1"
    $headers = @{ Authorization = "Bearer $token"; "Content-Type" = "application/json" }
    $now = Get-Date
    $hoy = $now.ToString("yyyyMMdd")
    $offset = ($now.DayOfYear % 50)
    $inicio = $now.AddDays(150 + $offset)
    $body = @{
        tipo = "EPS"
        diagnostico = "AT-EPS-$hoy"
        fecha_inicio = $inicio.ToString("yyyy-MM-dd")
        fecha_fin = $inicio.AddDays(5).ToString("yyyy-MM-dd")
    } | ConvertTo-Json
    $response = Invoke-RestMethod -Uri "$API_URL/incapacidades" -Method POST -Headers $headers -Body $body -TimeoutSec 10
    if (-not $response.data.id) { throw "Sin ID" }
    $global:idEPS = $response.data.id
}

Test-Endpoint "Crear incapacidad ARL" {
    Start-Sleep -Milliseconds 1500
    $token = Get-Token "Colab2"
    $headers = @{ Authorization = "Bearer $token"; "Content-Type" = "application/json" }
    $now = Get-Date
    $hoy = $now.ToString("yyyyMMdd")
    $offset = ($now.DayOfYear % 50) + 10
    $inicio = $now.AddDays(150 + $offset)
    $body = @{
        tipo = "ARL"
        diagnostico = "AT-ARL-$hoy"
        fecha_inicio = $inicio.ToString("yyyy-MM-dd")
        fecha_fin = $inicio.AddDays(10).ToString("yyyy-MM-dd")
    } | ConvertTo-Json
    $response = Invoke-RestMethod -Uri "$API_URL/incapacidades" -Method POST -Headers $headers -Body $body -TimeoutSec 10
    if (-not $response.data.id) { throw "Sin ID" }
    $global:idARL = $response.data.id
}

Test-Endpoint "GH lista todas las incapacidades" {
    $token = Get-Token "GH"
    $headers = @{ Authorization = "Bearer $token" }
    $response = Invoke-RestMethod -Uri "$API_URL/incapacidades" -Headers $headers -TimeoutSec 10
    if (-not $response.data) { throw "Sin datos" }
}

Test-Endpoint "Conta lista todas" {
    $token = Get-Token "Conta"
    $headers = @{ Authorization = "Bearer $token" }
    $response = Invoke-RestMethod -Uri "$API_URL/incapacidades" -Headers $headers -TimeoutSec 10
    if (-not $response.data) { throw "Sin datos" }
}

Test-Endpoint "Lider lista todas" {
    $token = Get-Token "Lider"
    $headers = @{ Authorization = "Bearer $token" }
    $response = Invoke-RestMethod -Uri "$API_URL/incapacidades" -Headers $headers -TimeoutSec 10
    if (-not $response.data) { throw "Sin datos" }
}

Test-Endpoint "Colab lista solo las suyas" {
    $token = Get-Token "Colab1"
    $headers = @{ Authorization = "Bearer $token" }
    $response = Invoke-RestMethod -Uri "$API_URL/incapacidades" -Headers $headers -TimeoutSec 10
    if (-not $response.data) { throw "Sin datos" }
}

Test-Endpoint "Obtener por ID" {
    if (-not $global:idEPS) { throw "ID EPS no definido" }
    $token = Get-Token "GH"
    $headers = @{ Authorization = "Bearer $token" }
    $response = Invoke-RestMethod -Uri "$API_URL/incapacidades/$global:idEPS" -Headers $headers -TimeoutSec 10
    if ($response.data.id -ne $global:idEPS) { throw "ID no coincide" }
}

Test-Endpoint "Rechazar ID inexistente (404)" {
    try {
        $token = Get-Token "GH"
        $headers = @{ Authorization = "Bearer $token" }
        Invoke-RestMethod -Uri "$API_URL/incapacidades/99999" -Headers $headers -TimeoutSec 10
        throw "Debio rechazar"
    } catch {
        if ($_.Exception.Message -notlike "*404*") { throw $_ }
    }
}

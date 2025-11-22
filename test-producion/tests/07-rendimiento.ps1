# RENDIMIENTO - 4 tests

Test-Endpoint "Health < 5s" {
    $inicio = Get-Date
    Invoke-RestMethod -Uri "$API_URL/health" -TimeoutSec 5 | Out-Null
    $tiempo = ((Get-Date) - $inicio).TotalSeconds
    if ($tiempo -ge 5) { throw "Timeout: $tiempo s" }
}

Test-Endpoint "Login < 5s" {
    $inicio = Get-Date
    $body = @{ email = "gh@kare.com"; password = "123456" } | ConvertTo-Json
    Invoke-RestMethod -Uri "$API_URL/auth/login" -Method POST -Body $body -ContentType "application/json" -TimeoutSec 5 | Out-Null
    $tiempo = ((Get-Date) - $inicio).TotalSeconds
    if ($tiempo -ge 5) { throw "Timeout: $tiempo s" }
}

Test-Endpoint "Listar incapacidades < 5s" {
    $token = Get-Token "GH"
    $headers = @{ Authorization = "Bearer $token" }
    $inicio = Get-Date
    Invoke-RestMethod -Uri "$API_URL/incapacidades" -Headers $headers -TimeoutSec 5 | Out-Null
    $tiempo = ((Get-Date) - $inicio).TotalSeconds
    if ($tiempo -ge 5) { throw "Timeout: $tiempo s" }
}

Test-Endpoint "Listar usuarios < 5s" {
    $token = Get-Token "GH"
    $headers = @{ Authorization = "Bearer $token" }
    $inicio = Get-Date
    Invoke-RestMethod -Uri "$API_URL/usuarios" -Headers $headers -TimeoutSec 5 | Out-Null
    $tiempo = ((Get-Date) - $inicio).TotalSeconds
    if ($tiempo -ge 5) { throw "Timeout: $tiempo s" }
}

# NOTIFICACIONES - 2 tests (simplificado)

Test-Endpoint "Listar notificaciones (GH)" {
    $token = Get-Token "GH"
    $headers = @{ Authorization = "Bearer $token" }
    $response = Invoke-RestMethod -Uri "$API_URL/notificaciones" -Headers $headers -TimeoutSec 10
    if ($null -eq $response.data) { throw "Sin estructura data" }
}

Test-Endpoint "Contador no leidas (GH)" {
    $token = Get-Token "GH"
    $headers = @{ Authorization = "Bearer $token" }
    $response = Invoke-RestMethod -Uri "$API_URL/notificaciones/no-leidas/count" -Headers $headers -TimeoutSec 10
    if ($null -eq $response.data) { throw "Sin datos" }
}

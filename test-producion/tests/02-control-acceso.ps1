# CONTROL DE ACCESO - 7 tests

Test-Endpoint "GH accede a usuarios" {
    $token = Get-Token "GH"
    $headers = @{ Authorization = "Bearer $token" }
    $response = Invoke-RestMethod -Uri "$API_URL/usuarios" -Headers $headers -TimeoutSec 10
    if (-not $response.data) { throw "Sin datos" }
}

Test-Endpoint "Conta accede a usuarios" {
    $token = Get-Token "Conta"
    $headers = @{ Authorization = "Bearer $token" }
    $response = Invoke-RestMethod -Uri "$API_URL/usuarios" -Headers $headers -TimeoutSec 10
    if (-not $response.data) { throw "Sin datos" }
}

Test-Endpoint "Lider NO accede a usuarios (403)" {
    try {
        $token = Get-Token "Lider"
        $headers = @{ Authorization = "Bearer $token" }
        Invoke-RestMethod -Uri "$API_URL/usuarios" -Headers $headers -TimeoutSec 10
        throw "Debio rechazar"
    } catch {
        if ($_.Exception.Message -notlike "*403*") { throw $_ }
    }
}

Test-Endpoint "Colab NO accede a usuarios (403)" {
    try {
        $token = Get-Token "Colab1"
        $headers = @{ Authorization = "Bearer $token" }
        Invoke-RestMethod -Uri "$API_URL/usuarios" -Headers $headers -TimeoutSec 10
        throw "Debio rechazar"
    } catch {
        if ($_.Exception.Message -notlike "*403*") { throw $_ }
    }
}

Test-Endpoint "GH obtiene usuario por ID" {
    $token = Get-Token "GH"
    $headers = @{ Authorization = "Bearer $token" }
    $response = Invoke-RestMethod -Uri "$API_URL/usuarios/1" -Headers $headers -TimeoutSec 10
    if (-not $response.data) { throw "Sin datos" }
}

Test-Endpoint "Conta obtiene usuario por ID" {
    $token = Get-Token "Conta"
    $headers = @{ Authorization = "Bearer $token" }
    $response = Invoke-RestMethod -Uri "$API_URL/usuarios/1" -Headers $headers -TimeoutSec 10
    if (-not $response.data) { throw "Sin datos" }
}

Test-Endpoint "Rechazar ID inexistente (404)" {
    try {
        $token = Get-Token "GH"
        $headers = @{ Authorization = "Bearer $token" }
        Invoke-RestMethod -Uri "$API_URL/usuarios/99999" -Headers $headers -TimeoutSec 10
        throw "Debio rechazar"
    } catch {
        if ($_.Exception.Message -notlike "*404*") { throw $_ }
    }
}

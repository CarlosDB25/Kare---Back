# AUTENTICACION - 14 tests

Test-Endpoint "Health check" {
    $response = Invoke-RestMethod -Uri "$API_URL/health" -TimeoutSec 10
    if (-not $response) { throw "Sin respuesta" }
}

Test-Endpoint "Login GH" {
    $token = Get-Token "GH"
    if (-not $token) { throw "Sin token" }
}

Test-Endpoint "Login Conta" {
    $token = Get-Token "Conta"
    if (-not $token) { throw "Sin token" }
}

Test-Endpoint "Login Lider" {
    $token = Get-Token "Lider"
    if (-not $token) { throw "Sin token" }
}

Test-Endpoint "Login Colab1" {
    $token = Get-Token "Colab1"
    if (-not $token) { throw "Sin token" }
}

Test-Endpoint "Login Colab2" {
    $token = Get-Token "Colab2"
    if (-not $token) { throw "Sin token" }
}

Test-Endpoint "Rechazar password incorrecto" {
    try {
        $body = @{ email = "gh@kare.com"; password = "wrong" } | ConvertTo-Json
        Invoke-RestMethod -Uri "$API_URL/auth/login" -Method POST -Body $body -ContentType "application/json" -TimeoutSec 10
        throw "Debio rechazar"
    } catch {
        if ($_.Exception.Message -notlike "*400*" -and $_.Exception.Message -notlike "*401*") { throw $_ }
    }
}

Test-Endpoint "Rechazar email inexistente" {
    try {
        $body = @{ email = "noexiste@test.com"; password = "123456" } | ConvertTo-Json
        Invoke-RestMethod -Uri "$API_URL/auth/login" -Method POST -Body $body -ContentType "application/json" -TimeoutSec 10
        throw "Debio rechazar"
    } catch {
        if ($_.Exception.Message -notlike "*404*" -and $_.Exception.Message -notlike "*401*") { throw $_ }
    }
}

Test-Endpoint "Perfil autenticado GH" {
    $token = Get-Token "GH"
    $headers = @{ Authorization = "Bearer $token" }
    $response = Invoke-RestMethod -Uri "$API_URL/auth/profile" -Headers $headers -TimeoutSec 10
    if ($response.data.email -ne "gh@kare.com") { throw "Email incorrecto" }
}

Test-Endpoint "Perfil autenticado Conta" {
    $token = Get-Token "Conta"
    $headers = @{ Authorization = "Bearer $token" }
    $response = Invoke-RestMethod -Uri "$API_URL/auth/profile" -Headers $headers -TimeoutSec 10
    if ($response.data.email -ne "conta@kare.com") { throw "Email incorrecto" }
}

Test-Endpoint "Perfil autenticado Lider" {
    $token = Get-Token "Lider"
    $headers = @{ Authorization = "Bearer $token" }
    $response = Invoke-RestMethod -Uri "$API_URL/auth/profile" -Headers $headers -TimeoutSec 10
    if ($response.data.email -ne "lider1@kare.com") { throw "Email incorrecto" }
}

Test-Endpoint "Perfil autenticado Colab" {
    $token = Get-Token "Colab1"
    $headers = @{ Authorization = "Bearer $token" }
    $response = Invoke-RestMethod -Uri "$API_URL/auth/profile" -Headers $headers -TimeoutSec 10
    if ($response.data.email -ne "colab1@kare.com") { throw "Email incorrecto" }
}

Test-Endpoint "Rechazar sin token" {
    try {
        Invoke-RestMethod -Uri "$API_URL/auth/profile" -TimeoutSec 10
        throw "Debio rechazar"
    } catch {
        if ($_.Exception.Message -notlike "*401*") { throw $_ }
    }
}

Test-Endpoint "Rechazar token invalido" {
    try {
        $headers = @{ Authorization = "Bearer tokeninvalido123" }
        Invoke-RestMethod -Uri "$API_URL/auth/profile" -Headers $headers -TimeoutSec 10
        throw "Debio rechazar"
    } catch {
        if ($_.Exception.Message -notlike "*401*" -and $_.Exception.Message -notlike "*403*") { throw $_ }
    }
}

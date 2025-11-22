# VALIDACIONES - 7 tests

Test-Endpoint "Rechazar fecha_inicio > fecha_fin" {
    try {
        $token = Get-Token "Colab1"
        $headers = @{ Authorization = "Bearer $token"; "Content-Type" = "application/json" }
        $body = @{
            tipo = "EPS"
            diagnostico = "Test"
            fecha_inicio = (Get-Date).AddDays(10).ToString("yyyy-MM-dd")
            fecha_fin = (Get-Date).ToString("yyyy-MM-dd")
        } | ConvertTo-Json
        Invoke-RestMethod -Uri "$API_URL/incapacidades" -Method POST -Headers $headers -Body $body -TimeoutSec 10
        throw "Debio rechazar"
    } catch {
        if ($_.Exception.Message -notlike "*400*") { throw $_ }
    }
}

Test-Endpoint "Rechazar fecha muy antigua" {
    try {
        $token = Get-Token "Colab1"
        $headers = @{ Authorization = "Bearer $token"; "Content-Type" = "application/json" }
        $body = @{
            tipo = "EPS"
            diagnostico = "Test"
            fecha_inicio = (Get-Date).AddDays(-90).ToString("yyyy-MM-dd")
            fecha_fin = (Get-Date).AddDays(-85).ToString("yyyy-MM-dd")
        } | ConvertTo-Json
        Invoke-RestMethod -Uri "$API_URL/incapacidades" -Method POST -Headers $headers -Body $body -TimeoutSec 10
        throw "Debio rechazar"
    } catch {
        if ($_.Exception.Message -notlike "*400*") { throw $_ }
    }
}

Test-Endpoint "Rechazar fecha muy futura" {
    try {
        $token = Get-Token "Colab1"
        $headers = @{ Authorization = "Bearer $token"; "Content-Type" = "application/json" }
        $body = @{
            tipo = "EPS"
            diagnostico = "Test"
            fecha_inicio = (Get-Date).AddDays(400).ToString("yyyy-MM-dd")
            fecha_fin = (Get-Date).AddDays(405).ToString("yyyy-MM-dd")
        } | ConvertTo-Json
        Invoke-RestMethod -Uri "$API_URL/incapacidades" -Method POST -Headers $headers -Body $body -TimeoutSec 10
        throw "Debio rechazar"
    } catch {
        if ($_.Exception.Message -notlike "*400*") { throw $_ }
    }
}

Test-Endpoint "Rechazar sin tipo" {
    try {
        $token = Get-Token "Colab1"
        $headers = @{ Authorization = "Bearer $token"; "Content-Type" = "application/json" }
        $body = @{
            diagnostico = "Test"
            fecha_inicio = (Get-Date).ToString("yyyy-MM-dd")
            fecha_fin = (Get-Date).AddDays(5).ToString("yyyy-MM-dd")
        } | ConvertTo-Json
        Invoke-RestMethod -Uri "$API_URL/incapacidades" -Method POST -Headers $headers -Body $body -TimeoutSec 10
        throw "Debio rechazar"
    } catch {
        if ($_.Exception.Message -notlike "*400*") { throw $_ }
    }
}

Test-Endpoint "Rechazar sin diagnostico" {
    try {
        $token = Get-Token "Colab1"
        $headers = @{ Authorization = "Bearer $token"; "Content-Type" = "application/json" }
        $body = @{
            tipo = "EPS"
            fecha_inicio = (Get-Date).ToString("yyyy-MM-dd")
            fecha_fin = (Get-Date).AddDays(5).ToString("yyyy-MM-dd")
        } | ConvertTo-Json
        Invoke-RestMethod -Uri "$API_URL/incapacidades" -Method POST -Headers $headers -Body $body -TimeoutSec 10
        throw "Debio rechazar"
    } catch {
        if ($_.Exception.Message -notlike "*400*") { throw $_ }
    }
}

Test-Endpoint "Rechazar tipo invalido" {
    try {
        $token = Get-Token "Colab1"
        $headers = @{ Authorization = "Bearer $token"; "Content-Type" = "application/json" }
        $body = @{
            tipo = "INVALIDO"
            diagnostico = "Test"
            fecha_inicio = (Get-Date).ToString("yyyy-MM-dd")
            fecha_fin = (Get-Date).AddDays(5).ToString("yyyy-MM-dd")
        } | ConvertTo-Json
        Invoke-RestMethod -Uri "$API_URL/incapacidades" -Method POST -Headers $headers -Body $body -TimeoutSec 10
        throw "Debio rechazar"
    } catch {
        if ($_.Exception.Message -notlike "*400*") { throw $_ }
    }
}

Test-Endpoint "Rechazar EPS > 180 dias" {
    try {
        $token = Get-Token "Colab1"
        $headers = @{ Authorization = "Bearer $token"; "Content-Type" = "application/json" }
        $body = @{
            tipo = "EPS"
            diagnostico = "Test"
            fecha_inicio = (Get-Date).ToString("yyyy-MM-dd")
            fecha_fin = (Get-Date).AddDays(200).ToString("yyyy-MM-dd")
        } | ConvertTo-Json
        Invoke-RestMethod -Uri "$API_URL/incapacidades" -Method POST -Headers $headers -Body $body -TimeoutSec 10
        throw "Debio rechazar"
    } catch {
        if ($_.Exception.Message -notlike "*400*") { throw $_ }
    }
}

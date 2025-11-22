# CAMBIO DE ESTADOS - 6 tests

Test-Endpoint "Crear incapacidad para estados" {
    Start-Sleep -Milliseconds 2000
    $token = Get-Token "Colab1"
    $headers = @{ Authorization = "Bearer $token"; "Content-Type" = "application/json" }
    $now = Get-Date
    $hoy = $now.ToString("yyyyMMdd")
    $offset = ($now.DayOfYear % 50) + 30
    $inicio = $now.AddDays(150 + $offset)
    $body = @{
        tipo = "EPS"
        diagnostico = "AT-EST-$hoy"
        fecha_inicio = $inicio.ToString("yyyy-MM-dd")
        fecha_fin = $inicio.AddDays(7).ToString("yyyy-MM-dd")
    } | ConvertTo-Json
    $response = Invoke-RestMethod -Uri "$API_URL/incapacidades" -Method POST -Headers $headers -Body $body -TimeoutSec 10
    if (-not $response.data.id) { throw "Sin ID" }
    $global:idEstados = $response.data.id
}

Test-Endpoint "Cambiar reportada -> en_revision (GH)" {
    if (-not $global:idEstados) { throw "ID no definido" }
    $token = Get-Token "GH"
    $headers = @{ Authorization = "Bearer $token"; "Content-Type" = "application/json" }
    $body = @{
        estado = "en_revision"
        observaciones = "Revisando"
    } | ConvertTo-Json
    $response = Invoke-RestMethod -Uri "$API_URL/incapacidades/$global:idEstados/estado" -Method PUT -Headers $headers -Body $body -TimeoutSec 10
    if ($response.data.estado_nuevo -ne "en_revision") { throw "Estado no cambio" }
}

Test-Endpoint "Cambiar en_revision -> validada (Conta)" {
    $token = Get-Token "Conta"
    $headers = @{ Authorization = "Bearer $token"; "Content-Type" = "application/json" }
    $body = @{
        estado = "validada"
        observaciones = "Validada OK"
    } | ConvertTo-Json
    $response = Invoke-RestMethod -Uri "$API_URL/incapacidades/$global:idEstados/estado" -Method PUT -Headers $headers -Body $body -TimeoutSec 10
    if ($response.data.estado_nuevo -ne "validada") { throw "Estado no cambio" }
}

Test-Endpoint "Cambiar validada -> pagada (Conta)" {
    $token = Get-Token "Conta"
    $headers = @{ Authorization = "Bearer $token"; "Content-Type" = "application/json" }
    $body = @{
        estado = "pagada"
        observaciones = "Pagada"
    } | ConvertTo-Json
    $response = Invoke-RestMethod -Uri "$API_URL/incapacidades/$global:idEstados/estado" -Method PUT -Headers $headers -Body $body -TimeoutSec 10
    if ($response.data.estado_nuevo -ne "pagada") { throw "Estado no cambio" }
}

Test-Endpoint "Rechazar transicion invalida" {
    try {
        $token = Get-Token "GH"
        $headers = @{ Authorization = "Bearer $token"; "Content-Type" = "application/json" }
        $body = @{
            estado = "validada"
            observaciones = "Intento invalido"
        } | ConvertTo-Json
        Invoke-RestMethod -Uri "$API_URL/incapacidades/$global:idEstados/estado" -Method PUT -Headers $headers -Body $body -TimeoutSec 10
        throw "Debio rechazar"
    } catch {
        if ($_.Exception.Message -notlike "*400*") { throw $_ }
    }
}

Test-Endpoint "Colab NO puede cambiar estado (403)" {
    try {
        $token = Get-Token "Colab1"
        $headers = @{ Authorization = "Bearer $token"; "Content-Type" = "application/json" }
        $body = @{
            estado = "en_revision"
            observaciones = "No permitido"
        } | ConvertTo-Json
        Invoke-RestMethod -Uri "$API_URL/incapacidades/$global:idEstados/estado" -Method PUT -Headers $headers -Body $body -TimeoutSec 10
        throw "Debio rechazar"
    } catch {
        if ($_.Exception.Message -notlike "*403*") { throw $_ }
    }
}

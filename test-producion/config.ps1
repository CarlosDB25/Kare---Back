# Configuración de Tests de Producción

# URL del API
$global:API_URL = "https://kare-back.onrender.com/api"

# Credenciales de prueba
$global:CREDENCIALES = @{
    GH = @{ email = "gh@kare.com"; password = "123456"; nombre = "GH" }
    Conta = @{ email = "conta@kare.com"; password = "123456"; nombre = "Contabilidad" }
    Lider = @{ email = "lider1@kare.com"; password = "123456"; nombre = "Líder" }
    Colab1 = @{ email = "colab1@kare.com"; password = "123456"; nombre = "Colaborador 1" }
    Colab2 = @{ email = "colab2@kare.com"; password = "123456"; nombre = "Colaborador 2" }
}

# Timeouts
$global:TIMEOUT_NORMAL = 10  # segundos
$global:TIMEOUT_RENDIMIENTO = 5  # segundos

# Configuración de errores
$ErrorActionPreference = "Continue"

Write-Host "✓ Configuración cargada" -ForegroundColor Gray

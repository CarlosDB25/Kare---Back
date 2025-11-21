# 📡 API REST - Sistema KARE (Parte 2)

> Documentación simple y directa de endpoints

**URL Base:** `http://localhost:3000/api`

👈 **Parte 1:** [Autenticación, Incapacidades, Notificaciones](USO_ENDPOINTS_PARTE1.md)

---

## 📋 Índice

- [Conciliaciones](#conciliaciones)
- [Reemplazos](#reemplazos)
- [Usuarios](#usuarios)
- [Health Check](#health-check)

---

## 💰 Conciliaciones

### POST /conciliaciones

Crear conciliación de incapacidad (solo Contabilidad).

**Request:**
```json
{
  "incapacidad_id": 123,
  "ibc": "3000000",
  "observaciones": "Conciliación verificada"
}
```

**Response 201:**
```json
{
  "success": true,
  "data": {
    "id": 45,
    "incapacidad_id": 123,
    "ibc": "3000000.00",
    "dias_empresa": 2,
    "monto_empresa": "200000.00",
    "dias_eps": 3,
    "monto_eps": "200010.00",
    "total": "400010.00",
    "estado_pago": "pendiente",
    "created_at": "2025-11-20T10:00:00Z"
  }
}
```

**Cálculo automático:**
```
Días 1-2 (Empresa - 100%): 2 × (IBC/30) × 100%
Días 3+ (EPS - 66.67%): N × (IBC/30) × 66.67%
```

**Errores:**
- `400` - Incapacidad ya tiene conciliación
- `403` - Solo Contabilidad puede crear
- `404` - Incapacidad no existe

---

### GET /conciliaciones

Listar conciliaciones.

**Query params:**
```
?estado_pago=pendiente
?fecha_inicio=2025-11-01
```

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": 45,
      "incapacidad_id": 123,
      "total": "400010.00",
      "estado_pago": "pendiente",
      "usuario": "Juan Pérez",
      "tipo_incapacidad": "EPS",
      "created_at": "2025-11-20T10:00:00Z"
    }
  ]
}
```

**Permisos:**
- `conta/gh` - Todas las conciliaciones
- `lider` - Solo de su área
- `colaborador` - No permitido

---

### GET /conciliaciones/:id

Obtener conciliación específica.

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": 45,
    "ibc": "3000000.00",
    "dias_empresa": 2,
    "monto_empresa": "200000.00",
    "dias_eps": 3,
    "monto_eps": "200010.00",
    "total": "400010.00",
    "estado_pago": "pendiente",
    "incapacidad": {
      "id": 123,
      "tipo": "EPS",
      "fecha_inicio": "2025-11-20",
      "fecha_fin": "2025-11-25"
    },
    "usuario": {
      "nombre": "Juan Pérez",
      "email": "juan@empresa.com"
    }
  }
}
```

---

### GET /conciliaciones/stats

Obtener estadísticas de conciliaciones.

**Response 200:**
```json
{
  "success": true,
  "data": {
    "total": 50,
    "pendientes": 10,
    "pagadas": 40,
    "monto_total_pendiente": "5000000.00",
    "monto_total_pagado": "45000000.00"
  }
}
```

---

## 👥 Reemplazos

### POST /reemplazos

Crear reemplazo para incapacidad (solo Líderes).

**Request:**
```json
{
  "incapacidad_id": 123,
  "reemplazante_id": 8,
  "fecha_inicio": "2025-11-20",
  "fecha_fin": "2025-11-25",
  "tareas": "Atender clientes, revisar emails"
}
```

**Response 201:**
```json
{
  "success": true,
  "data": {
    "id": 67,
    "incapacidad_id": 123,
    "reemplazante_id": 8,
    "fecha_inicio": "2025-11-20",
    "fecha_fin": "2025-11-25",
    "estado": "activo",
    "tareas": "Atender clientes, revisar emails",
    "created_at": "2025-11-20T10:00:00Z"
  }
}
```

**Errores:**
- `400` - Fechas inválidas o auto-reemplazo
- `403` - Solo Líderes pueden crear
- `404` - Incapacidad o reemplazante no existe

---

### GET /reemplazos

Listar reemplazos.

**Query params:**
```
?estado=activo
?reemplazante_id=8
```

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": 67,
      "estado": "activo",
      "fecha_inicio": "2025-11-20",
      "fecha_fin": "2025-11-25",
      "ausente": {
        "nombre": "Juan Pérez",
        "area": "Ventas"
      },
      "reemplazante": {
        "nombre": "María López",
        "email": "maria@empresa.com"
      }
    }
  ]
}
```

---

### GET /reemplazos/mis-reemplazos

Obtener reemplazos asignados al usuario autenticado.

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": 67,
      "fecha_inicio": "2025-11-20",
      "fecha_fin": "2025-11-25",
      "tareas": "Atender clientes, revisar emails",
      "ausente": {
        "nombre": "Juan Pérez"
      }
    }
  ]
}
```

---

### PUT /reemplazos/:id/finalizar

Marcar reemplazo como finalizado.

**Response 200:**
```json
{
  "success": true,
  "message": "Reemplazo finalizado",
  "data": {
    "id": 67,
    "estado": "finalizado",
    "fecha_finalizacion": "2025-11-25T18:00:00Z"
  }
}
```

---

## 👤 Usuarios

### GET /usuarios

Listar usuarios (solo GH/Conta).

**Query params:**
```
?rol=colaborador
?area=Ventas
?limit=20
```

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": 5,
      "nombre": "Juan Pérez",
      "email": "juan@empresa.com",
      "rol": "colaborador",
      "area": "Ventas",
      "salario_base": "3000000.00",
      "activo": true
    }
  ]
}
```

**Permisos:**
- `gh/conta` - Todos los usuarios
- `lider/colaborador` - No permitido

---

### GET /usuarios/stats

Estadísticas de usuarios (solo GH).

**Response 200:**
```json
{
  "success": true,
  "data": {
    "total": 50,
    "por_rol": {
      "colaborador": 40,
      "lider": 5,
      "gh": 3,
      "conta": 2
    },
    "por_area": {
      "Ventas": 15,
      "Producción": 20,
      "Administración": 15
    },
    "activos": 48,
    "inactivos": 2
  }
}
```

---

## ❤️ Health Check

### GET /health

Verificar estado del servidor.

**No requiere autenticación.**

**Response 200:**
```json
{
  "status": "OK",
  "timestamp": "2025-11-20T10:00:00Z",
  "uptime": 3600
}
```

---

## 📊 Códigos HTTP

| Código | Significado | Cuándo |
|--------|-------------|--------|
| `200` | OK | Solicitud exitosa |
| `201` | Created | Recurso creado |
| `400` | Bad Request | Datos inválidos |
| `401` | Unauthorized | Sin token o token inválido |
| `403` | Forbidden | Sin permisos |
| `404` | Not Found | Recurso no existe |
| `500` | Server Error | Error del servidor |

---

## 🚀 Ejemplos Rápidos

### JavaScript (Fetch)
```javascript
// Login
const res = await fetch('http://localhost:3000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'gh@kare.com', password: 'gh123' })
});
const { data } = await res.json();
const token = data.token;

// Crear incapacidad
await fetch('http://localhost:3000/api/incapacidades', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    tipo: 'EPS',
    fecha_inicio: '2025-11-20',
    fecha_fin: '2025-11-25'
  })
});
```

### cURL
```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"gh@kare.com","password":"gh123"}'

# Listar incapacidades
curl http://localhost:3000/api/incapacidades \
  -H "Authorization: Bearer {token}"
```

### PowerShell
```powershell
# Login
$body = @{ email = "gh@kare.com"; password = "gh123" } | ConvertTo-Json
$res = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" -Method POST -Body $body -ContentType "application/json"
$token = $res.data.token

# Listar incapacidades
$headers = @{ Authorization = "Bearer $token" }
Invoke-RestMethod -Uri "http://localhost:3000/api/incapacidades" -Headers $headers
```

---

## 📚 Recursos Adicionales

- [Documentación Técnica Completa](DOCUMENTACION_TECNICA.md)
- [Guía de Tests](GUIA_COMPLETA_TESTS.md)
- [Guía Visual de Interfaz](GUIA_VISUAL_INTERFAZ_PARTE1.md)

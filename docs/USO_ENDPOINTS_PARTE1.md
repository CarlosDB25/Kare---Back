# 📡 API REST - Sistema KARE

> Documentación simple y directa de endpoints

**Versión API:** 1.1.0  
**URL Base:** `http://localhost:3000/api`

---

## 📋 Índice

- [Autenticación](#autenticación)
- [Incapacidades](#incapacidades)
- [Documentos OCR](#documentos-ocr)
- [Estados](#estados)
- [Notificaciones](#notificaciones)

**Parte 2:** [Conciliaciones, Reemplazos, Usuarios →](USO_ENDPOINTS_PARTE2.md)

---

## 🔑 Autenticación

Todos los endpoints (excepto login) requieren:

```http
Authorization: Bearer {tu_token_jwt}
```

### POST /auth/login

Iniciar sesión y obtener token JWT.

**Request:**
```json
{
  "email": "gh@kare.com",
  "password": "gh123"
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "usuario": {
      "id": 1,
      "nombre": "Ana María González",
      "email": "gh@kare.com",
      "rol": "gh"
    }
  }
}
```

**Errores:**
- `400` - Credenciales incorrectas
- `404` - Usuario no existe

---

### GET /auth/profile

Obtener datos del usuario autenticado.

**Headers:**
```http
Authorization: Bearer {token}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "nombre": "Ana María González",
    "email": "gh@kare.com",
    "rol": "gh",
    "area": "Recursos Humanos"
  }
}
```

---

## 📋 Incapacidades

### POST /incapacidades

Crear nueva incapacidad (solo Colaboradores).

**Request:**
```json
{
  "tipo": "EPS",
  "fecha_inicio": "2025-11-20",
  "fecha_fin": "2025-11-25",
  "diagnostico": "Gripe común",
  "observaciones": "Reposo médico"
}
```

**Response 201:**
```json
{
  "success": true,
  "data": {
    "id": 123,
    "tipo": "EPS",
    "fecha_inicio": "2025-11-20",
    "fecha_fin": "2025-11-25",
    "dias_incapacidad": 6,
    "estado": "reportada",
    "created_at": "2025-11-20T10:30:00Z"
  }
}
```

**Tipos válidos:**
- `EPS` - Enfermedad General (máx 180 días)
- `ARL` - Accidente Laboral (máx 540 días)
- `Licencia_Maternidad` - Maternidad (máx 126 días)
- `Licencia_Paternidad` - Paternidad (máx 14 días)

**Errores:**
- `400` - Fechas inválidas o solapamiento
- `401` - Sin autenticación
- `403` - Solo colaboradores pueden crear

---

### GET /incapacidades

Listar incapacidades (filtradas por rol).

**Query params (opcionales):**
```
?estado=reportada
?tipo=EPS
?fecha_inicio=2025-11-01
```

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": 123,
      "tipo": "EPS",
      "fecha_inicio": "2025-11-20",
      "fecha_fin": "2025-11-25",
      "dias_incapacidad": 6,
      "estado": "reportada",
      "usuario": {
        "nombre": "Juan Pérez",
        "email": "juan@empresa.com"
      }
    }
  ]
}
```

**Permisos:**
- `colaborador` - Solo sus incapacidades
- `lider` - Solo de su área
- `gh/conta` - Todas

---

### GET /incapacidades/:id

Obtener incapacidad específica.

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": 123,
    "tipo": "EPS",
    "fecha_inicio": "2025-11-20",
    "fecha_fin": "2025-11-25",
    "diagnostico": "Gripe común",
    "estado": "en_revision",
    "observaciones": "Documento adjunto",
    "usuario": {
      "nombre": "Juan Pérez"
    }
  }
}
```

---

### PUT /incapacidades/:id/estado

Cambiar estado de incapacidad (solo GH/Conta).

**Request:**
```json
{
  "nuevo_estado": "validada",
  "observaciones": "Documento verificado correctamente"
}
```

**Response 200:**
```json
{
  "success": true,
  "message": "Estado actualizado",
  "data": {
    "id": 123,
    "estado_anterior": "en_revision",
    "estado_nuevo": "validada"
  }
}
```

**Estados válidos:**
```
reportada → en_revision → validada → en_conciliacion → 
conciliada → aprobada_pago → pagada
```

**Errores:**
- `400` - Transición inválida
- `403` - Sin permisos (solo GH/Conta)
- `404` - Incapacidad no existe

---

### DELETE /incapacidades/:id

Eliminar incapacidad.

**Permisos:**
- **GH/Conta:** Puede eliminar cualquier incapacidad
- **Colaborador/Líder:** Solo si es el dueño y está en estado `reportada`

**Response 200:**
```json
{
  "success": true,
  "message": "Incapacidad eliminada exitosamente",
  "data": null
}
```

**Proceso de eliminación:**
1. Elimina historial de estados (cascada)
2. Elimina archivo físico del servidor
3. Elimina registro de la base de datos

**Errores:**
- `403` - Sin permisos o estado no es `reportada` (colaborador)
- `404` - Incapacidad no existe

**Ejemplo PowerShell:**
```powershell
$headers = @{
    Authorization = "Bearer $token"
}
Invoke-RestMethod -Uri "https://api.kare.com/api/incapacidades/123" `
    -Method DELETE -Headers $headers
```

---

## 📄 Documentos OCR

### POST /incapacidades/validar-documento

Validar documento con OCR (extrae datos automáticamente).

**Request (multipart/form-data):**
```
documento: [archivo.pdf o .jpg]
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "tipo_detectado": "Enfermedad General",
    "campos_extraidos": {
      "nombre": "Juan Pérez",
      "documento": "1234567890",
      "fecha_inicio": "2025-11-20",
      "fecha_fin": "2025-11-25",
      "dias_incapacidad": 6,
      "diagnostico": "J06.9 - Infección respiratoria aguda",
      "entidad": "EPS Sura"
    },
    "confianza_ocr": 89,
    "sugerencia_accion": "APROBAR",
    "advertencias": [
      "No se detectó número de radicado"
    ]
  }
}
```

**Formatos soportados:** `.pdf`, `.jpg`, `.jpeg`, `.png`

**Sugerencias de acción:**
- `APROBAR` - ≥75% campos + alta confianza
- `REVISAR_MANUALMENTE` - 50-74% campos
- `RECHAZAR` - <50% campos o errores críticos

**Errores:**
- `400` - Formato no soportado
- `500` - Error procesando OCR

---

### POST /incapacidades/:id/documento

Subir documento a incapacidad existente.

**Request (multipart/form-data):**
```
documento: [archivo.pdf]
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": 123,
    "documento_path": "uploads/user_5/123_certificado.pdf"
  }
}
```

---

### GET /incapacidades/:id/documento

Descargar documento de incapacidad.

**Response 200:**
```
Content-Type: application/pdf
Content-Disposition: attachment; filename="certificado.pdf"

[archivo binario]
```

**Errores:**
- `404` - Documento no existe

---

## 📊 Estados

### GET /incapacidades/:id/estados

Obtener historial de cambios de estado.

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "estado_anterior": "reportada",
      "estado_nuevo": "en_revision",
      "observaciones": "Iniciando revisión",
      "changed_by": "Ana González (GH)",
      "changed_at": "2025-11-20T10:00:00Z"
    },
    {
      "id": 2,
      "estado_anterior": "en_revision",
      "estado_nuevo": "validada",
      "observaciones": "Documento válido",
      "changed_by": "Ana González (GH)",
      "changed_at": "2025-11-20T11:30:00Z"
    }
  ]
}
```

---

## 🔔 Notificaciones

### GET /notificaciones

Listar notificaciones del usuario.

**Query params:**
```
?solo_no_leidas=true
?limit=10
```

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": 45,
      "tipo": "incapacidad_validada",
      "titulo": "Incapacidad aprobada",
      "mensaje": "Tu incapacidad #123 ha sido validada",
      "leida": false,
      "created_at": "2025-11-20T10:00:00Z"
    }
  ],
  "count": 5,
  "no_leidas": 3
}
```

---

### PUT /notificaciones/:id/leer

Marcar notificación como leída.

**Response 200:**
```json
{
  "success": true,
  "message": "Notificación marcada como leída"
}
```

---

### PUT /notificaciones/leer-todas

Marcar todas las notificaciones como leídas.

**Response 200:**
```json
{
  "success": true,
  "message": "Todas las notificaciones marcadas como leídas",
  "count": 5
}
```

---

### DELETE /notificaciones

Eliminar todas las notificaciones del usuario.

**Response 200:**
```json
{
  "success": true,
  "message": "Notificaciones eliminadas",
  "count": 5
}
```

---

## 📖 Continúa en Parte 2

👉 [USO_ENDPOINTS_PARTE2.md](USO_ENDPOINTS_PARTE2.md)

- Conciliaciones
- Reemplazos  
- Usuarios
- Estadísticas

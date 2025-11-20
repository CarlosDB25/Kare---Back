# 📡 GUÍA VISUAL DE USO DE ENDPOINTS - SISTEMA KARE (PARTE 1)

**Versión:** 1.0.0  
**Fecha:** 19 de noviembre de 2025

---

## 📋 ÍNDICE - PARTE 1

1. [Introducción](#introducción)
2. [Configuración Inicial](#configuración-inicial)
3. [MÓDULO 1: Autenticación](#módulo-1-autenticación)
4. [MÓDULO 2: Gestión de Incapacidades](#módulo-2-gestión-de-incapacidades)
5. [MÓDULO 3: Notificaciones](#módulo-3-notificaciones)

**Continúa en:** [USO_ENDPOINTS_PARTE2.md](USO_ENDPOINTS_PARTE2.md)

---

## 🎯 INTRODUCCIÓN

Este documento muestra **visualmente** cómo usar cada endpoint del sistema KARE con:

- ✅ URL completa del endpoint
- ✅ Método HTTP (GET, POST, PUT, DELETE)
- ✅ Headers requeridos
- ✅ Body de ejemplo (JSON)
- ✅ Respuesta esperada
- ✅ Códigos de estado HTTP
- ✅ Casos de uso prácticos
- ✅ Ejemplos con curl, PowerShell y JavaScript

### 🎨 Para Desarrolladores Frontend

Este documento está diseñado para ayudarte a:
- **Integrar rápidamente** el backend en tu aplicación
- **Copiar y pegar** ejemplos funcionales
- **Entender errores** con códigos HTTP claros
- **Validar datos** antes de enviarlos al servidor

**💡 CONSEJO:** Si desarrollas frontend, consulta también:
- [GUIA_FRONTEND_VISUAL.md](GUIA_FRONTEND_VISUAL.md) - Componentes React, hooks y ejemplos completos
- [GUIA_COMPLETA_TESTS.md](GUIA_COMPLETA_TESTS.md) - Para entender qué validaciones hace el backend

---

## ⚙️ CONFIGURACIÓN INICIAL

### URL Base

```
http://localhost:3000/api
```

### Variables de Entorno

```env
PORT=3000
JWT_SECRET=kare_secret_key_2024
JWT_EXPIRES_IN=24h
```

### Headers Comunes

```http
Content-Type: application/json
Authorization: Bearer {token}
```

### 🔧 Herramientas Recomendadas

| Herramienta | Uso | Ventaja |
|-------------|-----|---------|
| **Thunder Client** (VS Code) | Testing rápido | Integrado en el editor |
| **Postman** | Colecciones completas | Variables de entorno |
| **curl** | Scripts y CI/CD | Automatización |
| **Axios** (Frontend) | Integración React/Vue | Interceptors, mejor manejo errores |

### 📱 Arquitectura del Sistema

```
┌─────────────┐           ┌─────────────┐           ┌─────────────┐
│   Frontend  │  HTTP     │   Backend   │  SQLite   │  Base de    │
│  (React/    │ ────────► │  (Express)  │ ────────► │  Datos      │
│   Vue/etc)  │ ◄──────── │  Port 3000  │ ◄──────── │  (kare.db)  │
└─────────────┘   JSON    └─────────────┘           └─────────────┘
      │                          │
      │                          │
      ▼                          ▼
  Axios/Fetch              JWT Auth + CORS
  Interceptors             Validaciones
  Error Handling           Notificaciones
```

---

## 🔐 MÓDULO 1: AUTENTICACIÓN

### 1.1 Registrar Usuario

**Endpoint:** `POST /api/auth/register`

**URL Completa:**
```
http://localhost:3000/api/auth/register
```

**Método:** `POST`

**Headers:**
```http
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "nombre": "Juan Pérez",
  "email": "juan.perez@empresa.com",
  "password": "password123",
  "rol": "colaborador",
  "salario_base": "3500000",
  "ibc": "3500000"
}
```

**Ejemplo con curl:**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Juan Pérez",
    "email": "juan.perez@empresa.com",
    "password": "password123",
    "rol": "colaborador",
    "salario_base": "3500000",
    "ibc": "3500000"
  }'
```

**Ejemplo con PowerShell:**
```powershell
$body = @{
    nombre = "Juan Pérez"
    email = "juan.perez@empresa.com"
    password = "password123"
    rol = "colaborador"
    salario_base = "3500000"
    ibc = "3500000"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/auth/register" `
  -Method POST `
  -ContentType "application/json" `
  -Body $body
```

**Respuesta Exitosa (201 Created):**
```json
{
  "success": true,
  "message": "Usuario registrado exitosamente",
  "data": {
    "id": 9,
    "nombre": "Juan Pérez",
    "email": "juan.perez@empresa.com",
    "rol": "colaborador"
  }
}
```

**Respuesta Error (400 Bad Request):**
```json
{
  "success": false,
  "message": "El email ya está registrado",
  "data": null
}
```

**Códigos de Estado:**
- `201` - Usuario creado exitosamente
- `400` - Email duplicado o datos inválidos
- `500` - Error del servidor

**Roles Válidos:**
- `gh` - Gestión Humana
- `conta` - Contabilidad
- `lider` - Líder de Equipo
- `colaborador` - Colaborador

**🎨 Para Frontend - Ejemplo de Componente:**

```javascript
// FormularioRegistro.jsx
import { useState } from 'react';

function FormularioRegistro() {
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    password: '',
    rol: 'colab'
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert('✅ Usuario creado');
        // Guardar token
        localStorage.setItem('token', data.data.token);
      } else {
        alert(`❌ Error: ${data.message}`);
      }
    } catch (error) {
      alert('❌ Error de conexión');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input 
        type="email" 
        value={formData.email}
        onChange={(e) => setFormData({...formData, email: e.target.value})}
        placeholder="Email"
        required 
      />
      {/* Resto de campos... */}
      <button type="submit">Registrar</button>
    </form>
  );
}
```

---

### 1.2 Login (Iniciar Sesión)

**Endpoint:** `POST /api/auth/login`

**URL Completa:**
```
http://localhost:3000/api/auth/login
```

**Método:** `POST`

**Headers:**
```http
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "email": "colab1@kare.com",
  "password": "123456"
}
```

**Ejemplo con curl:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "colab1@kare.com",
    "password": "123456"
  }'
```

**Ejemplo con JavaScript (fetch):**
```javascript
const response = await fetch('http://localhost:3000/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: 'colab1@kare.com',
    password: '123456'
  })
});

const data = await response.json();
console.log('Token:', data.data.token);
```

**Respuesta Exitosa (200 OK):**
```json
{
  "success": true,
  "message": "Login exitoso",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NCwibm9tYnJlIjoiQ29sYWJvcmFkb3IgMSIsImVtYWlsIjoiY29sYWIxQGthcmUuY29tIiwicm9sIjoiY29sYWJvcmFkb3IiLCJpYXQiOjE3MDAzODkyMDAsImV4cCI6MTcwMDQ3NTYwMH0.xyz123abc",
    "usuario": {
      "id": 4,
      "nombre": "Colaborador 1",
      "email": "colab1@kare.com",
      "rol": "colaborador"
    }
  }
}
```

**Respuesta Error (401 Unauthorized):**
```json
{
  "success": false,
  "message": "Credenciales inválidas",
  "data": null
}
```

**Códigos de Estado:**
- `200` - Login exitoso
- `400` - Email o password faltante
- `401` - Credenciales incorrectas
- `500` - Error del servidor

**⚠️ IMPORTANTE:**
Guardar el `token` para usarlo en endpoints protegidos:

```javascript
const token = data.data.token;
// Usar en header: Authorization: Bearer {token}
```

**🎨 Para Frontend - Flujo Completo de Login:**

```javascript
// useAuth.js - Hook personalizado
import { useState } from 'react';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));

  const login = async (email, password) => {
    const response = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();
    
    if (data.success) {
      setToken(data.data.token);
      setUser(data.data.user);
      localStorage.setItem('token', data.data.token);
      return { success: true, user: data.data.user };
    } else {
      throw new Error(data.message);
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
  };

  return { user, token, login, logout };
};
```

**💡 CONSEJO:** Ver [GUIA_FRONTEND_VISUAL.md](GUIA_FRONTEND_VISUAL.md) para implementación completa con Context API

---

### 1.3 Obtener Perfil

**Endpoint:** `GET /api/auth/profile`

**URL Completa:**
```
http://localhost:3000/api/auth/profile
```

**Método:** `GET`

**Headers:**
```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Body:** Ninguno

**Ejemplo con curl:**
```bash
curl -X GET http://localhost:3000/api/auth/profile \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Ejemplo con JavaScript:**
```javascript
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';

const response = await fetch('http://localhost:3000/api/auth/profile', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const data = await response.json();
console.log('Perfil:', data.data);
```

**Respuesta Exitosa (200 OK):**
```json
{
  "success": true,
  "message": "Perfil obtenido",
  "data": {
    "id": 4,
    "nombre": "Colaborador 1",
    "email": "colab1@kare.com",
    "rol": "colaborador",
    "salario_base": "3000000.00",
    "ibc": "3000000.00",
    "created_at": "2025-11-19T20:00:00.000Z"
  }
}
```

**Respuesta Error (401 Unauthorized):**
```json
{
  "success": false,
  "message": "Token no proporcionado",
  "data": null
}
```

**Códigos de Estado:**
- `200` - Perfil obtenido exitosamente
- `401` - Token faltante, inválido o expirado
- `500` - Error del servidor

---

## 📋 MÓDULO 2: GESTIÓN DE INCAPACIDADES

### 2.1 Crear Incapacidad

**Endpoint:** `POST /api/incapacidades`

**URL Completa:**
```
http://localhost:3000/api/incapacidades
```

**Método:** `POST`

**Headers:**
```http
Content-Type: application/json
Authorization: Bearer {token}
```

**Roles Permitidos:** Todos los autenticados

**Body (JSON):**
```json
{
  "tipo": "EPS",
  "fecha_inicio": "2026-01-20",
  "fecha_fin": "2026-01-25",
  "diagnostico": "Gripe viral aguda",
  "ibc": "3000000",
  "observaciones": "Reposo médico recomendado"
}
```

**Campos Opcionales:**
- `documento` - Ruta del archivo PDF
- `observaciones` - Comentarios adicionales
- `porcentaje_pago` - Se calcula automáticamente
- `entidad_pagadora` - Se asigna automáticamente

**Ejemplo con curl:**
```bash
curl -X POST http://localhost:3000/api/incapacidades \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{
    "tipo": "EPS",
    "fecha_inicio": "2026-01-20",
    "fecha_fin": "2026-01-25",
    "diagnostico": "Gripe viral aguda",
    "ibc": "3000000"
  }'
```

**Respuesta Exitosa (201 Created):**
```json
{
  "success": true,
  "message": "Incapacidad creada exitosamente",
  "data": {
    "id": 1,
    "usuario_id": 4,
    "tipo": "EPS",
    "fecha_inicio": "2026-01-20",
    "fecha_fin": "2026-01-25",
    "dias_incapacidad": 5,
    "diagnostico": "Gripe viral aguda",
    "documento": null,
    "observaciones": "Reposo médico recomendado",
    "estado": "reportada",
    "porcentaje_pago": 66.67,
    "entidad_pagadora": "EPS",
    "created_at": "2025-11-19T21:00:00.000Z"
  }
}
```

**Respuesta Error (400 Bad Request):**
```json
{
  "success": false,
  "message": "Errores de validación",
  "data": {
    "errores": [
      "La fecha de inicio no puede ser posterior a la fecha de fin",
      "Tipo de incapacidad inválido. Tipos válidos: EPS, ARL, Licencia"
    ]
  }
}
```

**Códigos de Estado:**
- `201` - Incapacidad creada exitosamente
- `400` - Errores de validación
- `401` - No autenticado
- `500` - Error del servidor

**Validaciones Aplicadas:**

1. **Tipo:** Debe ser EPS, ARL o Licencia
2. **Fechas:** 
   - fecha_inicio ≤ fecha_fin
   - fecha_inicio ≥ Hoy - 60 días
   - fecha_fin ≤ Hoy + 90 días
3. **Duración:**
   - EPS: máximo 180 días
   - ARL: máximo 540 días
   - Licencia: máximo 90 días
4. **Solapamiento:** No puede haber otra incapacidad activa en el mismo rango

**Tipos de Incapacidad:**

| Tipo | Porcentaje | Entidad | Duración Máx |
|------|-----------|---------|--------------|
| EPS | 66.67% (días 3+) | EPS | 180 días |
| ARL | 100% | ARL | 540 días |
| Licencia | Variable | Empresa | 90 días |

**🎨 Para Frontend - Validación de Fechas:**

```javascript
// utils/validators.js
export const validarFechasIncapacidad = (fechaInicio, fechaFin, tipo) => {
  const hoy = new Date();
  const inicio = new Date(fechaInicio);
  const fin = new Date(fechaFin);
  
  // Validación 1: fecha_inicio >= hoy - 60 días
  const hace60dias = new Date();
  hace60dias.setDate(hoy.getDate() - 60);
  if (inicio < hace60dias) {
    return { valid: false, error: 'Fecha inicio muy antigua (máx 60 días atrás)' };
  }
  
  // Validación 2: fecha_fin <= hoy + 90 días
  const dentro90dias = new Date();
  dentro90dias.setDate(hoy.getDate() + 90);
  if (fin > dentro90dias) {
    return { valid: false, error: 'Fecha fin muy futura (máx 90 días adelante)' };
  }
  
  // Validación 3: inicio <= fin
  if (inicio > fin) {
    return { valid: false, error: 'Fecha inicio debe ser anterior a fecha fin' };
  }
  
  // Validación 4: duración según tipo
  const dias = Math.ceil((fin - inicio) / (1000 * 60 * 60 * 24)) + 1;
  const maxDias = { EPS: 180, ARL: 540, Licencia: 90 };
  
  if (dias > maxDias[tipo]) {
    return { valid: false, error: `Duración máxima para ${tipo}: ${maxDias[tipo]} días` };
  }
  
  return { valid: true };
};

// Uso en componente:
const validacion = validarFechasIncapacidad(
  formData.fecha_inicio, 
  formData.fecha_fin, 
  formData.tipo
);

if (!validacion.valid) {
  setError(validacion.error);
  return;
}
```

---

### 2.2 Listar Todas las Incapacidades

**Endpoint:** `GET /api/incapacidades`

**URL Completa:**
```
http://localhost:3000/api/incapacidades
```

**Método:** `GET`

**Headers:**
```http
Authorization: Bearer {token}
```

**Roles Permitidos:** Todos

**Comportamiento por Rol:**
- **Colaborador:** Solo ve sus propias incapacidades
- **Líder:** Solo ve incapacidades de su equipo
- **GH/Conta:** Ven todas las incapacidades

**Ejemplo con curl:**
```bash
curl -X GET http://localhost:3000/api/incapacidades \
  -H "Authorization: Bearer {token}"
```

**Respuesta Exitosa (200 OK):**
```json
{
  "success": true,
  "message": "Incapacidades obtenidas exitosamente",
  "data": [
    {
      "id": 1,
      "usuario_id": 4,
      "usuario_nombre": "Colaborador 1",
      "usuario_email": "colab1@kare.com",
      "tipo": "EPS",
      "fecha_inicio": "2026-01-20",
      "fecha_fin": "2026-01-25",
      "dias_incapacidad": 5,
      "diagnostico": "Gripe viral aguda",
      "estado": "reportada",
      "porcentaje_pago": 66.67,
      "entidad_pagadora": "EPS",
      "created_at": "2025-11-19T21:00:00.000Z",
      "updated_at": "2025-11-19T21:00:00.000Z"
    },
    {
      "id": 2,
      "usuario_id": 4,
      "usuario_nombre": "Colaborador 1",
      "usuario_email": "colab1@kare.com",
      "tipo": "ARL",
      "fecha_inicio": "2026-02-01",
      "fecha_fin": "2026-02-10",
      "dias_incapacidad": 9,
      "diagnostico": "Accidente laboral",
      "estado": "en_revision",
      "porcentaje_pago": 100.00,
      "entidad_pagadora": "ARL",
      "created_at": "2025-11-19T22:00:00.000Z",
      "updated_at": "2025-11-19T22:15:00.000Z"
    }
  ]
}
```

**Códigos de Estado:**
- `200` - Lista obtenida exitosamente
- `401` - No autenticado
- `500` - Error del servidor

---

### 2.3 Obtener Incapacidad por ID

**Endpoint:** `GET /api/incapacidades/:id`

**URL Completa:**
```
http://localhost:3000/api/incapacidades/1
```

**Método:** `GET`

**Headers:**
```http
Authorization: Bearer {token}
```

**Parámetros URL:**
- `id` - ID de la incapacidad

**Ejemplo con curl:**
```bash
curl -X GET http://localhost:3000/api/incapacidades/1 \
  -H "Authorization: Bearer {token}"
```

**Respuesta Exitosa (200 OK):**
```json
{
  "success": true,
  "message": "Incapacidad obtenida",
  "data": {
    "id": 1,
    "usuario_id": 4,
    "tipo": "EPS",
    "fecha_inicio": "2026-01-20",
    "fecha_fin": "2026-01-25",
    "dias_incapacidad": 5,
    "diagnostico": "Gripe viral aguda",
    "documento": null,
    "observaciones": "Reposo médico recomendado",
    "estado": "reportada",
    "porcentaje_pago": 66.67,
    "entidad_pagadora": "EPS",
    "created_at": "2025-11-19T21:00:00.000Z",
    "updated_at": "2025-11-19T21:00:00.000Z"
  }
}
```

**Respuesta Error (404 Not Found):**
```json
{
  "success": false,
  "message": "Incapacidad no encontrada",
  "data": null
}
```

**Códigos de Estado:**
- `200` - Incapacidad encontrada
- `401` - No autenticado
- `403` - Sin permisos para ver esta incapacidad
- `404` - Incapacidad no existe
- `500` - Error del servidor

---

### 2.4 Cambiar Estado de Incapacidad

**Endpoint:** `PUT /api/incapacidades/:id/estado`

**URL Completa:**
```
http://localhost:3000/api/incapacidades/1/estado
```

**Método:** `PUT`

**Headers:**
```http
Content-Type: application/json
Authorization: Bearer {token}
```

**Roles Permitidos:** `gh`, `conta`

**Body (JSON):**
```json
{
  "estado": "en_revision",
  "observaciones": "Documentación recibida, iniciando revisión"
}
```

**Estados Válidos:**
- `reportada` - Incapacidad reportada
- `en_revision` - En proceso de revisión
- `validada` - Validada por GH
- `pagada` - Pago completado
- `rechazada` - Rechazada

**Flujo de Estados:**
```
reportada → en_revision → validada → pagada
         ↘ rechazada (desde cualquier estado)
```

**📊 Diagrama Visual del Flujo:**

```
┌─────────────┐
│  Reportada  │ ◄── Colaborador reporta incapacidad
└──────┬──────┘
       │ GH/Conta: Iniciar revisión
       ▼
┌─────────────┐
│ En Revisión │ ◄── GH revisa documentación
└──────┬──────┘
       │ GH: Aprobar
       ▼
┌─────────────┐
│  Validada   │ ◄── Crear conciliación (Conta)
└──────┬──────┘
       │ Conta: Registrar pago
       ▼
┌─────────────┐
│   Pagada    │ ◄── Estado final
└─────────────┘

       ❌ Rechazada ◄── Desde cualquier estado
```

**🎨 Para Frontend - Componente de Estado:**

```javascript
// EstadoBadge.jsx
const ESTADO_CONFIG = {
  reportada: { color: '#FFA500', icon: '📝', label: 'Reportada' },
  en_revision: { color: '#007BFF', icon: '🔍', label: 'En Revisión' },
  validada: { color: '#28A745', icon: '✅', label: 'Validada' },
  pagada: { color: '#28A745', icon: '💰', label: 'Pagada' },
  rechazada: { color: '#DC3545', icon: '❌', label: 'Rechazada' }
};

function EstadoBadge({ estado }) {
  const config = ESTADO_CONFIG[estado];
  
  return (
    <span style={{
      backgroundColor: config.color,
      color: 'white',
      padding: '4px 12px',
      borderRadius: '16px',
      fontSize: '12px',
      fontWeight: 'bold'
    }}>
      {config.icon} {config.label}
    </span>
  );
}

// Uso: <EstadoBadge estado="en_revision" />
```

**Ejemplo con curl:**
```bash
curl -X PUT http://localhost:3000/api/incapacidades/1/estado \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{
    "estado": "en_revision",
    "observaciones": "Documentación recibida"
  }'
```

**Respuesta Exitosa (200 OK):**
```json
{
  "success": true,
  "message": "Estado actualizado exitosamente",
  "data": {
    "id": 1,
    "estado": "en_revision",
    "observaciones": "Documentación recibida, iniciando revisión",
    "updated_at": "2025-11-19T21:30:00.000Z"
  }
}
```

**Respuesta Error (400 Bad Request):**
```json
{
  "success": false,
  "message": "Transición de estado no permitida: pagada → reportada",
  "data": null
}
```

**Respuesta Error (403 Forbidden):**
```json
{
  "success": false,
  "message": "No tienes permisos para realizar esta acción",
  "data": null
}
```

**Códigos de Estado:**
- `200` - Estado actualizado exitosamente
- `400` - Transición inválida o datos incorrectos
- `401` - No autenticado
- `403` - Sin permisos (solo GH/Conta)
- `404` - Incapacidad no encontrada
- `500` - Error del servidor

**Efectos Secundarios:**
1. Se crea registro en `historial_estados`
2. Se crea notificación al usuario afectado

---

### 2.5 Validar Documento de Incapacidad (OCR)

**Endpoint:** `POST /api/incapacidades/validar-documento`

**URL Completa:**
```
http://localhost:3000/api/incapacidades/validar-documento
```

**Método:** `POST`

**Headers:**
```http
Content-Type: multipart/form-data
Authorization: Bearer {token}
```

**Body (Form-Data):**
```
documento: [archivo PDF]
```

**Ejemplo con curl:**
```bash
curl -X POST http://localhost:3000/api/incapacidades/validar-documento \
  -H "Authorization: Bearer {token}" \
  -F "documento=@/ruta/incapacidad.pdf"
```

**Ejemplo con JavaScript (FormData):**
```javascript
const formData = new FormData();
formData.append('documento', archivoPDF);

const response = await fetch('http://localhost:3000/api/incapacidades/validar-documento', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});

const data = await response.json();
console.log('Datos extraídos:', data.data);
```

**Respuesta Exitosa (200 OK):**
```json
{
  "success": true,
  "message": "Documento procesado exitosamente",
  "data": {
    "textoExtraido": "CERTIFICADO DE INCAPACIDAD\nFecha Inicio: 20/01/2026\nFecha Fin: 25/01/2026\nDiagnóstico: Gripe viral aguda\nTipo: EPS",
    "datosExtraidos": {
      "fecha_inicio": "2026-01-20",
      "fecha_fin": "2026-01-25",
      "diagnostico": "Gripe viral aguda",
      "tipo": "EPS",
      "dias": 5
    },
    "validacion": {
      "valido": true,
      "inconsistencias": []
    }
  }
}
```

**Respuesta con Inconsistencias (200 OK):**
```json
{
  "success": true,
  "message": "Documento procesado con advertencias",
  "data": {
    "textoExtraido": "...",
    "datosExtraidos": {
      "fecha_inicio": "2026-01-25",
      "fecha_fin": "2026-01-20",
      "diagnostico": "Gripe",
      "tipo": "EPS",
      "dias": -5
    },
    "validacion": {
      "valido": false,
      "inconsistencias": [
        "La fecha de inicio (2026-01-25) es posterior a la fecha de fin (2026-01-20)",
        "Los días calculados son negativos o inválidos"
      ]
    }
  }
}
```

**Respuesta Error (400 Bad Request):**
```json
{
  "success": false,
  "message": "No se proporcionó ningún documento",
  "data": null
}
```

**Códigos de Estado:**
- `200` - Documento procesado (puede tener inconsistencias)
- `400` - No se proporcionó archivo o formato inválido
- `401` - No autenticado
- `500` - Error procesando OCR

**Formatos Soportados:**
- PDF (recomendado)
- Imágenes (PNG, JPG) si contienen texto legible

**Campos Extraídos:**
- `fecha_inicio` - Fecha de inicio de incapacidad
- `fecha_fin` - Fecha de finalización
- `diagnostico` - Diagnóstico médico
- `tipo` - Tipo de incapacidad (EPS, ARL, Licencia)
- `dias` - Días de incapacidad calculados

---

### 2.6 Subir/Actualizar Documento de Incapacidad

**Endpoint:** `POST /api/incapacidades/:id/documento`

**URL Completa:**
```
http://localhost:3000/api/incapacidades/:id/documento
```

**Método:** `POST`

**Headers:**
```http
Content-Type: multipart/form-data
Authorization: Bearer {token}
```

**Body (Form-Data):**
```
documento: [archivo PDF o imagen]
```

**Roles Permitidos:** 
- Propietario de la incapacidad
- Gestor de RRHH
- Contador/a

**Comportamiento:**
- Reemplaza el documento anterior si existe
- Organiza automáticamente en carpeta `uploads/user_{id}/`
- Genera nombre único: `{timestamp}-user{userId}-{nombre}.ext`
- Notifica al usuario cuando GH/Contador sube documento
- Formatos soportados: PDF, PNG, JPG, JPEG

**Ejemplo con curl (PDF):**
```bash
curl -X POST http://localhost:3000/api/incapacidades/5/documento \
  -H "Authorization: Bearer {token}" \
  -F "documento=@C:/Users/usuario/certificado_medico.pdf"
```

**Ejemplo con JavaScript (Imagen):**
```javascript
// Subir imagen de certificado médico
const inputFile = document.querySelector('#fileInput');
const file = inputFile.files[0]; // test-incapacidad.jpg

const formData = new FormData();
formData.append('documento', file);

const response = await fetch('http://localhost:3000/api/incapacidades/5/documento', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});

const data = await response.json();
console.log('Documento subido:', data.data.documento);
// Salida: "1732138745123-user4-certificado_medico.jpg"
```

**Ejemplo React (Componente completo):**
```jsx
function SubirDocumento({ incapacidadId }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async () => {
    if (!file) return;
    
    setUploading(true);
    const formData = new FormData();
    formData.append('documento', file);

    try {
      const res = await fetch(`/api/incapacidades/${incapacidadId}/documento`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      const data = await res.json();
      if (data.success) {
        alert('Documento subido exitosamente');
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <input 
        type="file" 
        accept=".pdf,.jpg,.jpeg,.png"
        onChange={(e) => setFile(e.target.files[0])}
      />
      <button onClick={handleUpload} disabled={uploading}>
        {uploading ? 'Subiendo...' : 'Subir Documento'}
      </button>
    </div>
  );
}
```

**Respuesta Exitosa (200 OK):**
```json
{
  "success": true,
  "message": "Documento actualizado exitosamente",
  "data": {
    "id": 5,
    "documento": "1732138745123-user4-certificado_medico.pdf",
    "tipo": "EPS",
    "fecha_inicio": "2026-01-20",
    "fecha_fin": "2026-01-25",
    "diagnostico": "Gripe viral aguda",
    "estado": "reportada"
  }
}
```

**Respuesta Error (403 Forbidden):**
```json
{
  "success": false,
  "message": "No tienes permiso para modificar esta incapacidad",
  "data": null
}
```

**Respuesta Error (404 Not Found):**
```json
{
  "success": false,
  "message": "Incapacidad no encontrada",
  "data": null
}
```

**Códigos de Estado:**
- `200` - Documento actualizado exitosamente
- `400` - No se proporcionó archivo o formato inválido
- `401` - No autenticado
- `403` - Sin permiso (no es propietario ni GH/Contador)
- `404` - Incapacidad no encontrada
- `500` - Error del servidor

**Tamaño Máximo:** 5 MB

**🔐 Seguridad:**
- Solo el propietario o usuarios con rol GH/Contador pueden subir
- Los archivos se organizan en carpetas separadas por usuario
- Nombres sanitizados (caracteres especiales → `_`)
- Validación de tipo de archivo

**💡 Escenarios de Uso:**

**Caso 1: Colaborador sube certificado médico inicial**
```bash
# Usuario sube certificado después de crear incapacidad
curl -X POST http://localhost:3000/api/incapacidades/10/documento \
  -H "Authorization: Bearer {tokenColaborador}" \
  -F "documento=@/ruta/foto_certificado.jpg"

# Resultado: Archivo guardado en uploads/user_4/1732138745123-user4-foto_certificado.jpg
```

**Caso 2: GH actualiza con versión escaneada en PDF**
```bash
# Gestor de RRHH reemplaza imagen por PDF de mejor calidad
curl -X POST http://localhost:3000/api/incapacidades/10/documento \
  -H "Authorization: Bearer {tokenGH}" \
  -F "documento=@/ruta/certificado_escaneado.pdf"

# Resultado: Documento actualizado, usuario recibe notificación
# Archivo guardado en uploads/user_4/1732139000456-user4-certificado_escaneado.pdf
```

---

### 2.7 Descargar Documento de Incapacidad

**Endpoint:** `GET /api/incapacidades/:id/documento`

**URL Completa:**
```
http://localhost:3000/api/incapacidades/:id/documento
```

**Método:** `GET`

**Headers:**
```http
Authorization: Bearer {token}
```

**Roles Permitidos:**
- Propietario de la incapacidad
- Gestor de RRHH
- Contador/a

**Comportamiento:**
- Busca el archivo en 3 ubicaciones (compatibilidad):
  1. `uploads/user_{id}/`
  2. `uploads/` (raíz)
  3. `uploads/temp/`
- Retorna el archivo para descarga/visualización
- Content-Type automático según extensión (PDF, imagen)

**Ejemplo con curl:**
```bash
curl -X GET http://localhost:3000/api/incapacidades/5/documento \
  -H "Authorization: Bearer {token}" \
  -o certificado_descargado.pdf
```

**Ejemplo con JavaScript (Descargar):**
```javascript
async function descargarDocumento(incapacidadId) {
  const response = await fetch(`http://localhost:3000/api/incapacidades/${incapacidadId}/documento`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (response.ok) {
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `incapacidad_${incapacidadId}.pdf`;
    a.click();
    window.URL.revokeObjectURL(url);
  }
}

descargarDocumento(5);
```

**Ejemplo React (Vista previa de imagen):**
```jsx
function VistaDocumento({ incapacidadId }) {
  const [docUrl, setDocUrl] = useState(null);

  useEffect(() => {
    const cargarDocumento = async () => {
      const res = await fetch(`/api/incapacidades/${incapacidadId}/documento`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        setDocUrl(url);
      }
    };

    cargarDocumento();
    return () => docUrl && URL.revokeObjectURL(docUrl);
  }, [incapacidadId]);

  return docUrl ? (
    <div>
      <h3>Certificado Médico</h3>
      <img src={docUrl} alt="Documento" style={{ maxWidth: '100%' }} />
    </div>
  ) : (
    <p>Cargando documento...</p>
  );
}
```

**Respuesta Exitosa (200 OK):**
```
Content-Type: application/pdf (o image/jpeg, image/png)
Content-Disposition: inline; filename="1732138745123-user4-certificado.pdf"

[CONTENIDO BINARIO DEL ARCHIVO]
```

**Respuesta Error (403 Forbidden):**
```json
{
  "success": false,
  "message": "No tienes permiso para ver esta incapacidad",
  "data": null
}
```

**Respuesta Error (404 Not Found):**
```json
{
  "success": false,
  "message": "No se encontró documento para esta incapacidad",
  "data": null
}
```

**Códigos de Estado:**
- `200` - Documento descargado exitosamente
- `401` - No autenticado
- `403` - Sin permiso (no es propietario ni GH/Contador)
- `404` - Incapacidad no encontrada o sin documento
- `500` - Error del servidor

**🔐 Seguridad:**
- Solo el propietario o usuarios con rol GH/Contador pueden descargar
- Validación de existencia de archivo en sistema de archivos
- Headers de seguridad para prevenir XSS

**💡 Escenarios de Uso:**

**Caso 1: Colaborador descarga su propio certificado**
```bash
# Usuario descarga certificado que subió previamente
curl -X GET http://localhost:3000/api/incapacidades/10/documento \
  -H "Authorization: Bearer {tokenColaborador}" \
  -o mi_certificado.pdf

# Resultado: Descarga exitosa del archivo PDF
```

**Caso 2: GH revisa certificado médico para validación**
```javascript
// Gestor de RRHH abre documento para revisión
const response = await fetch('/api/incapacidades/10/documento', {
  headers: { 'Authorization': `Bearer ${tokenGH}` }
});

const blob = await response.blob();
const url = URL.createObjectURL(blob);
window.open(url); // Abre en nueva pestaña

// Resultado: PDF se abre para revisión
```

**Caso 3: Contador descarga para archivo contable**
```bash
# Contador descarga todos los certificados del mes
for id in 15 16 17 18; do
  curl -X GET http://localhost:3000/api/incapacidades/$id/documento \
    -H "Authorization: Bearer {tokenContador}" \
    -o "certificado_$id.pdf"
done

# Resultado: 4 PDFs descargados para contabilidad
```

---

## 🔔 MÓDULO 3: NOTIFICACIONES

### 3.1 Listar Mis Notificaciones

**Endpoint:** `GET /api/notificaciones`

**URL Completa:**
```
http://localhost:3000/api/notificaciones
```

**Método:** `GET`

**Headers:**
```http
Authorization: Bearer {token}
```

**Roles Permitidos:** Todos

**Comportamiento:**
Retorna solo las notificaciones del usuario autenticado.

**Ejemplo con curl:**
```bash
curl -X GET http://localhost:3000/api/notificaciones \
  -H "Authorization: Bearer {token}"
```

**Respuesta Exitosa (200 OK):**
```json
{
  "success": true,
  "message": "Notificaciones obtenidas",
  "data": [
    {
      "id": 1,
      "usuario_id": 4,
      "incapacidad_id": 1,
      "tipo": "cambio_estado",
      "mensaje": "Tu incapacidad ha cambiado a estado: en_revision",
      "leida": false,
      "created_at": "2025-11-19T21:30:00.000Z"
    },
    {
      "id": 2,
      "usuario_id": 4,
      "incapacidad_id": 1,
      "tipo": "cambio_estado",
      "mensaje": "Tu incapacidad ha cambiado a estado: validada",
      "leida": false,
      "created_at": "2025-11-19T22:00:00.000Z"
    },
    {
      "id": 3,
      "usuario_id": 4,
      "incapacidad_id": 2,
      "tipo": "conciliacion_creada",
      "mensaje": "Se ha creado una conciliación para tu incapacidad",
      "leida": true,
      "created_at": "2025-11-19T22:30:00.000Z"
    }
  ]
}
```

**Códigos de Estado:**
- `200` - Notificaciones obtenidas exitosamente
- `401` - No autenticado
- `500` - Error del servidor

**Tipos de Notificación:**
- `cambio_estado` - Estado de incapacidad cambió
- `conciliacion_creada` - Nueva conciliación
- `reemplazo_asignado` - Reemplazo asignado
- `pago_realizado` - Pago completado

---

### 3.2 Contador de No Leídas

**Endpoint:** `GET /api/notificaciones/no-leidas/count`

**URL Completa:**
```
http://localhost:3000/api/notificaciones/no-leidas/count
```

**Método:** `GET`

**Headers:**
```http
Authorization: Bearer {token}
```

**Ejemplo con curl:**
```bash
curl -X GET http://localhost:3000/api/notificaciones/no-leidas/count \
  -H "Authorization: Bearer {token}"
```

**Respuesta Exitosa (200 OK):**
```json
{
  "success": true,
  "message": "Contador obtenido",
  "data": {
    "count": 2
  }
}
```

**Códigos de Estado:**
- `200` - Contador obtenido
- `401` - No autenticado
- `500` - Error del servidor

**Uso Típico:**
Mostrar badge con número de notificaciones no leídas en UI.

```javascript
// Ejemplo en frontend
const response = await fetch('http://localhost:3000/api/notificaciones/no-leidas/count', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const data = await response.json();

// Actualizar badge
document.getElementById('badge').textContent = data.data.count;
```

**🎨 Para Frontend - Componente Completo de Notificaciones:**

```javascript
// NotificacionesBell.jsx
import { useState, useEffect } from 'react';

function NotificacionesBell() {
  const [noLeidas, setNoLeidas] = useState(0);
  const [mostrarPanel, setMostrarPanel] = useState(false);
  const [notificaciones, setNotificaciones] = useState([]);
  const token = localStorage.getItem('token');

  // Cargar contador cada 30 segundos
  useEffect(() => {
    cargarContador();
    const interval = setInterval(cargarContador, 30000);
    return () => clearInterval(interval);
  }, []);

  const cargarContador = async () => {
    const response = await fetch(
      'http://localhost:3000/api/notificaciones/no-leidas/count',
      { headers: { 'Authorization': `Bearer ${token}` } }
    );
    const data = await response.json();
    setNoLeidas(data.data.count);
  };

  const cargarNotificaciones = async () => {
    const response = await fetch(
      'http://localhost:3000/api/notificaciones',
      { headers: { 'Authorization': `Bearer ${token}` } }
    );
    const data = await response.json();
    setNotificaciones(data.data);
  };

  const marcarLeida = async (id) => {
    await fetch(`http://localhost:3000/api/notificaciones/${id}/leer`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    cargarContador();
    cargarNotificaciones();
  };

  const togglePanel = () => {
    if (!mostrarPanel) cargarNotificaciones();
    setMostrarPanel(!mostrarPanel);
  };

  return (
    <div className="notificaciones-container">
      <button className="bell-button" onClick={togglePanel}>
        🔔
        {noLeidas > 0 && (
          <span className="badge">{noLeidas}</span>
        )}
      </button>

      {mostrarPanel && (
        <div className="notificaciones-panel">
          {notificaciones.length === 0 ? (
            <p>No hay notificaciones</p>
          ) : (
            notificaciones.map(notif => (
              <div 
                key={notif.id}
                className={notif.leida ? 'leida' : 'no-leida'}
                onClick={() => !notif.leida && marcarLeida(notif.id)}
              >
                <h4>{notif.titulo}</h4>
                <p>{notif.mensaje}</p>
                <small>{new Date(notif.created_at).toLocaleString()}</small>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

/* CSS recomendado:
.bell-button {
  position: relative;
  background: transparent;
  border: none;
  font-size: 24px;
  cursor: pointer;
}

.badge {
  position: absolute;
  top: -5px;
  right: -5px;
  background: #DC3545;
  color: white;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
}

.notificaciones-panel {
  position: absolute;
  top: 50px;
  right: 0;
  width: 300px;
  max-height: 400px;
  overflow-y: auto;
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.no-leida {
  background: #E3F2FD;
  border-left: 4px solid #007BFF;
}
*/
```

---

### 3.3 Marcar Notificación Como Leída

**Endpoint:** `PUT /api/notificaciones/:id/leer`

**URL Completa:**
```
http://localhost:3000/api/notificaciones/1/leer
```

**Método:** `PUT`

**Headers:**
```http
Authorization: Bearer {token}
```

**Parámetros URL:**
- `id` - ID de la notificación

**Body:** Ninguno

**Ejemplo con curl:**
```bash
curl -X PUT http://localhost:3000/api/notificaciones/1/leer \
  -H "Authorization: Bearer {token}"
```

**Respuesta Exitosa (200 OK):**
```json
{
  "success": true,
  "message": "Notificación marcada como leída",
  "data": null
}
```

**Respuesta Error (404 Not Found):**
```json
{
  "success": false,
  "message": "Notificación no encontrada",
  "data": null
}
```

**Códigos de Estado:**
- `200` - Marcada como leída
- `401` - No autenticado
- `403` - Notificación no pertenece al usuario
- `404` - Notificación no existe
- `500` - Error del servidor

---

### 3.4 Marcar Todas Como Leídas

**Endpoint:** `PUT /api/notificaciones/leer-todas`

**URL Completa:**
```
http://localhost:3000/api/notificaciones/leer-todas
```

**Método:** `PUT`

**Headers:**
```http
Authorization: Bearer {token}
```

**Body:** Ninguno

**Ejemplo con curl:**
```bash
curl -X PUT http://localhost:3000/api/notificaciones/leer-todas \
  -H "Authorization: Bearer {token}"
```

**Respuesta Exitosa (200 OK):**
```json
{
  "success": true,
  "message": "Todas las notificaciones marcadas como leídas",
  "data": {
    "marcadas": 5
  }
}
```

**Códigos de Estado:**
- `200` - Notificaciones marcadas
- `401` - No autenticado
- `500` - Error del servidor

---

### 3.5 Eliminar Notificación

**Endpoint:** `DELETE /api/notificaciones/:id`

**URL Completa:**
```
http://localhost:3000/api/notificaciones/1
```

**Método:** `DELETE`

**Headers:**
```http
Authorization: Bearer {token}
```

**Parámetros URL:**
- `id` - ID de la notificación

**Ejemplo con curl:**
```bash
curl -X DELETE http://localhost:3000/api/notificaciones/1 \
  -H "Authorization: Bearer {token}"
```

**Respuesta Exitosa (200 OK):**
```json
{
  "success": true,
  "message": "Notificación eliminada",
  "data": null
}
```

**Respuesta Error (404 Not Found):**
```json
{
  "success": false,
  "message": "Notificación no encontrada",
  "data": null
}
```

**Códigos de Estado:**
- `200` - Notificación eliminada
- `401` - No autenticado
- `403` - Notificación no pertenece al usuario
- `404` - Notificación no existe
- `500` - Error del servidor

---

## 📊 EJEMPLOS DE FLUJOS COMPLETOS

### Flujo 1: Colaborador Reporta Incapacidad

```javascript
// 1. Login
const loginRes = await fetch('http://localhost:3000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'colab1@kare.com',
    password: '123456'
  })
});
const { data: { token } } = await loginRes.json();

// 2. Crear incapacidad
const incapRes = await fetch('http://localhost:3000/api/incapacidades', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    tipo: 'EPS',
    fecha_inicio: '2026-01-20',
    fecha_fin: '2026-01-25',
    diagnostico: 'Gripe viral',
    ibc: '3000000'
  })
});
const incapacidad = await incapRes.json();
console.log('Incapacidad creada:', incapacidad.data.id);

// 3. Ver mis notificaciones
const notiRes = await fetch('http://localhost:3000/api/notificaciones', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const notificaciones = await notiRes.json();
console.log('Notificaciones:', notificaciones.data.length);
```

---

**Continúa en:** [USO_ENDPOINTS_PARTE2.md](USO_ENDPOINTS_PARTE2.md)

---

**Sistema KARE - Guía de Endpoints Parte 1**  
**Versión:** 1.0.0  
**Fecha:** 19 de noviembre de 2025

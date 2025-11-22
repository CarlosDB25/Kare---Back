# 🎯 GUÍA SÚPER FÁCIL DE ENDPOINTS - SISTEMA KARE

> **¿Qué necesitas saber?** Esta guía te explica paso a paso cómo usar cada endpoint del sistema.  
> **Formato:** ✅ Qué enviar | ✅ Qué recibes | ✅ Ejemplos reales

---

## 📋 LISTA COMPLETA DE ENDPOINTS (36 TOTAL)

### 🔐 AUTENTICACIÓN (3 endpoints)
- `POST /api/auth/register` - Registrar usuario
- `POST /api/auth/login` - Iniciar sesión
- `GET /api/auth/profile` - Ver mi perfil

### 📄 INCAPACIDADES (8 endpoints)
- `POST /api/incapacidades` - Crear incapacidad
- `GET /api/incapacidades` - Listar incapacidades
- `GET /api/incapacidades/:id` - Ver una incapacidad
- `PUT /api/incapacidades/:id/estado` - Cambiar estado
- `DELETE /api/incapacidades/:id` - Eliminar incapacidad
- `POST /api/incapacidades/:id/documento` - Subir documento
- `GET /api/incapacidades/:id/documento` - Descargar documento
- `POST /api/incapacidades/validar-documento` - OCR (extraer datos del PDF/imagen)

### 🔔 NOTIFICACIONES (5 endpoints)
- `GET /api/notificaciones` - Ver mis notificaciones
- `GET /api/notificaciones/no-leidas/count` - Contador de no leídas
- `PUT /api/notificaciones/:id/leer` - Marcar como leída
- `PUT /api/notificaciones/leer-todas` - Marcar todas como leídas
- `DELETE /api/notificaciones/:id` - Eliminar una notificación

### 💰 CONCILIACIONES (6 endpoints)
- `POST /api/conciliaciones` - Crear conciliación (calcular valores)
- `GET /api/conciliaciones` - Listar conciliaciones
- `GET /api/conciliaciones/incapacidad/:incapacidad_id` - Conciliación de una incapacidad
- `GET /api/conciliaciones/estadisticas` - Estadísticas financieras
- `PUT /api/conciliaciones/:id` - Actualizar conciliación

### 🔄 REEMPLAZOS (8 endpoints)
- `POST /api/reemplazos` - Crear reemplazo
- `GET /api/reemplazos` - Listar reemplazos
- `GET /api/reemplazos/:id` - Ver un reemplazo
- `GET /api/reemplazos/mis-reemplazos` - Mis reemplazos activos
- `GET /api/reemplazos/incapacidad/:incapacidad_id` - Reemplazos de una incapacidad
- `GET /api/reemplazos/estadisticas` - Estadísticas de reemplazos
- `PUT /api/reemplazos/:id/finalizar` - Finalizar reemplazo
- `PUT /api/reemplazos/:id/cancelar` - Cancelar reemplazo

### 👥 USUARIOS (2 endpoints)
- `GET /api/usuarios` - Listar todos los usuarios
- `PUT /api/usuarios/:id/rol` - Cambiar rol de un usuario

---

## 📖 CÓMO LEER ESTA GUÍA

### Cada endpoint tiene esta estructura:

```
🔹 NOMBRE DEL ENDPOINT
├─ 📍 URL: La dirección a donde envías la petición
├─ 🔑 Token: ¿Necesitas estar logueado? (Sí/No)
├─ 👤 Quién puede: Qué roles tienen permiso
├─ 📤 QUÉ ENVÍAS: Los datos que debes mandar
├─ 📥 QUÉ RECIBES: Lo que te responde el servidor
└─ 💡 EJEMPLO REAL: Código que puedes copiar y pegar
```

---

## 🔐 MÓDULO 1: AUTENTICACIÓN

### 1.1 Login (Iniciar Sesión)

```
📍 URL: POST http://localhost:3000/api/auth/login
🔑 Token: NO necesitas
👤 Quién puede: Cualquiera
```

**📤 QUÉ ENVÍAS:**
```json
{
  "email": "colab1@kare.com",
  "password": "123456"
}
```

**📥 QUÉ RECIBES (si es correcto):**
```json
{
  "success": true,
  "message": "Login exitoso",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",  ← GUARDA ESTO
    "usuario": {
      "id": 4,
      "nombre": "Juan Pablo Martínez",
      "email": "colab1@kare.com",
      "rol": "colab"
    }
  }
}
```

**💡 EJEMPLO REAL (JavaScript):**
```javascript
// Hacer login
const response = await fetch('http://localhost:3000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'colab1@kare.com',
    password: '123456'
  })
});

const data = await response.json();

// PASO IMPORTANTE: Guardar el token
const token = data.data.token;
localStorage.setItem('token', token);

console.log('✅ Login exitoso! Token guardado');
```

**❌ QUÉ RECIBES (si la contraseña está mal):**
```json
{
  "success": false,
  "message": "Credenciales inválidas",
  "data": null
}
```

---

### 1.2 Registrar Usuario

```
📍 URL: POST http://localhost:3000/api/auth/register
🔑 Token: NO necesitas
👤 Quién puede: Cualquiera
```

**📤 QUÉ ENVÍAS:**
```json
{
  "nombre": "Pedro García",
  "email": "pedro@kare.com",
  "password": "MiContraseña123",
  "rol": "colab",
  "area": "Ventas",
  "cargo": "Vendedor",
  "salario_base": 2500000,
  "ibc": 2500000
}
```

**📝 ROLES VÁLIDOS:**
- `"colab"` - Colaborador
- `"lider"` - Líder de área
- `"gh"` - Gestión Humana
- `"conta"` - Contabilidad

**📥 QUÉ RECIBES:**
```json
{
  "success": true,
  "message": "Usuario registrado exitosamente",
  "data": {
    "id": 9,
    "nombre": "Pedro García",
    "email": "pedro@kare.com",
    "rol": "colab"
  }
}
```

**💡 EJEMPLO REAL:**
```javascript
const response = await fetch('http://localhost:3000/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    nombre: 'Pedro García',
    email: 'pedro@kare.com',
    password: 'MiContraseña123',
    rol: 'colab',
    area: 'Ventas',
    cargo: 'Vendedor',
    salario_base: 2500000,
    ibc: 2500000
  })
});

const data = await response.json();
console.log('✅ Usuario creado con ID:', data.data.id);
```

---

### 1.3 Ver Mi Perfil

```
📍 URL: GET http://localhost:3000/api/auth/profile
🔑 Token: SÍ necesitas
👤 Quién puede: Todos los que estén logueados
```

**📤 QUÉ ENVÍAS:**
```
NADA en el body, solo el token en el header:
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**📥 QUÉ RECIBES:**
```json
{
  "success": true,
  "message": "Perfil obtenido",
  "data": {
    "id": 4,
    "nombre": "Juan Pablo Martínez",
    "email": "colab1@kare.com",
    "rol": "colab",
    "area": "Ventas",
    "cargo": "Vendedor",
    "salario_base": 3000000,
    "ibc": 3000000
  }
}
```

**💡 EJEMPLO REAL:**
```javascript
// Obtener mi perfil
const token = localStorage.getItem('token');

const response = await fetch('http://localhost:3000/api/auth/profile', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`  ← Aquí va el token que guardaste
  }
});

const data = await response.json();
console.log('Mi perfil:', data.data);
```

---

## 📋 MÓDULO 2: INCAPACIDADES

### 2.1 Crear Incapacidad

```
📍 URL: POST http://localhost:3000/api/incapacidades
🔑 Token: SÍ necesitas
👤 Quién puede: Colaboradores, Líderes
```

**📤 QUÉ ENVÍAS:**
```json
{
  "tipo": "EPS",
  "fecha_inicio": "2025-11-25",
  "fecha_fin": "2025-11-28",
  "diagnostico": "Gripa"
}
```

**📝 TIPOS VÁLIDOS:**
- `"EPS"` - Enfermedad general
- `"ARL"` - Accidente laboral
- `"Licencia_Maternidad"` - Licencia de maternidad
- `"Licencia_Paternidad"` - Licencia de paternidad

**📥 QUÉ RECIBES:**
```json
{
  "success": true,
  "message": "Incapacidad creada exitosamente",
  "data": {
    "id": 15,  ← ID de la incapacidad creada
    "tipo": "EPS",
    "fecha_inicio": "2025-11-25",
    "fecha_fin": "2025-11-28",
    "dias_incapacidad": 4,
    "estado": "reportada"
  }
}
```

**💡 EJEMPLO REAL:**
```javascript
const token = localStorage.getItem('token');

const response = await fetch('http://localhost:3000/api/incapacidades', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    tipo: 'EPS',
    fecha_inicio: '2025-11-25',
    fecha_fin: '2025-11-28',
    diagnostico: 'Gripa fuerte'
  })
});

const data = await response.json();
console.log('Incapacidad creada con ID:', data.data.id);
```

---

### 2.2 Subir Documento de Incapacidad

```
📍 URL: POST http://localhost:3000/api/incapacidades/:id/documento
🔑 Token: SÍ necesitas
👤 Quién puede: El colaborador dueño o GH
```

**📤 QUÉ ENVÍAS:**
```
Un archivo (PDF, JPG, JPEG, PNG)
```

**💡 EJEMPLO REAL (con formulario HTML):**
```html
<!-- HTML -->
<form id="uploadForm">
  <input type="file" id="fileInput" accept=".pdf,.jpg,.jpeg,.png">
  <button type="submit">Subir Documento</button>
</form>

<script>
document.getElementById('uploadForm').onsubmit = async (e) => {
  e.preventDefault();
  
  const file = document.getElementById('fileInput').files[0];
  const formData = new FormData();
  formData.append('documento', file);
  
  const incapacidadId = 15; // ID de tu incapacidad
  const token = localStorage.getItem('token');
  
  const response = await fetch(`http://localhost:3000/api/incapacidades/${incapacidadId}/documento`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData  ← No pongas Content-Type, FormData lo hace automático
  });
  
  const data = await response.json();
  console.log('✅ Documento subido:', data.data.documento);
};
</script>
```

**📥 QUÉ RECIBES:**
```json
{
  "success": true,
  "message": "Documento subido exitosamente",
  "data": {
    "id": 15,
    "documento": "1763743567557-user4-pdf-incapacidad_1.pdf"
  }
}
```

---

### 2.3 Listar Mis Incapacidades

```
📍 URL: GET http://localhost:3000/api/incapacidades
🔑 Token: SÍ necesitas
👤 Quién puede: Todos
```

**📤 QUÉ ENVÍAS:**
```
NADA, solo el token en el header
```

**📥 QUÉ RECIBES:**
```json
{
  "success": true,
  "message": "Incapacidades obtenidas",
  "data": [
    {
      "id": 15,
      "tipo": "EPS",
      "fecha_inicio": "2025-11-25",
      "fecha_fin": "2025-11-28",
      "dias_incapacidad": 4,
      "diagnostico": "Gripa",
      "estado": "reportada",
      "documento": "archivo.pdf",
      "created_at": "2025-11-21T10:30:00.000Z"
    },
    {
      "id": 16,
      "tipo": "ARL",
      ...
    }
  ]
}
```

**💡 EJEMPLO REAL:**
```javascript
const token = localStorage.getItem('token');

const response = await fetch('http://localhost:3000/api/incapacidades', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const data = await response.json();

// Mostrar en pantalla
data.data.forEach(incapacidad => {
  console.log(`ID: ${incapacidad.id}`);
  console.log(`Tipo: ${incapacidad.tipo}`);
  console.log(`Estado: ${incapacidad.estado}`);
  console.log(`Días: ${incapacidad.dias_incapacidad}`);
  console.log('---');
});
```

---

### 2.4 Ver Una Incapacidad

```
📍 URL: GET http://localhost:3000/api/incapacidades/:id
🔑 Token: SÍ necesitas
👤 Quién puede: Todos
```

**📤 QUÉ ENVÍAS:**
```
NADA en el body
URL: /api/incapacidades/15  ← El 15 es el ID de la incapacidad
```

**📥 QUÉ RECIBES:**
```json
{
  "success": true,
  "message": "Incapacidad obtenida",
  "data": {
    "id": 15,
    "tipo": "EPS",
    "fecha_inicio": "2025-11-25",
    "fecha_fin": "2025-11-28",
    "dias_incapacidad": 4,
    "diagnostico": "Gripa fuerte",
    "estado": "validada",
    "documento": "archivo.pdf",
    "usuario_id": 4,
    "created_at": "2025-11-21T10:00:00.000Z"
  }
}
```

**💡 EJEMPLO REAL:**
```javascript
const token = localStorage.getItem('token');
const incapacidadId = 15;

const response = await fetch(`http://localhost:3000/api/incapacidades/${incapacidadId}`, {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const data = await response.json();
console.log('Incapacidad:', data.data);
```

---

### 2.5 Eliminar Incapacidad

```
📍 URL: DELETE http://localhost:3000/api/incapacidades/:id
🔑 Token: SÍ necesitas
👤 Quién puede: GH/Conta (cualquiera) | Colaborador/Líder (solo si es dueño y estado='reportada')
```

**📤 QUÉ ENVÍAS:**
```
NADA en el body
URL: /api/incapacidades/15  ← El 15 es el ID a eliminar
```

**📥 QUÉ RECIBES (éxito):**
```json
{
  "success": true,
  "message": "Incapacidad eliminada exitosamente",
  "data": null
}
```

**📥 SI NO TIENES PERMISO:**
```json
{
  "success": false,
  "message": "Solo puedes eliminar incapacidades en estado 'reportada'"
}
```

**❗ LO QUE SE ELIMINA:**
1. Historial de cambios de estado
2. Archivo PDF/imagen del servidor
3. Registro de la base de datos

**💡 EJEMPLO REAL:**
```javascript
const token = localStorage.getItem('token');
const incapacidadId = 15;

const response = await fetch(`http://localhost:3000/api/incapacidades/${incapacidadId}`, {
  method: 'DELETE',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const data = await response.json();
if (data.success) {
  console.log('✅ Incapacidad eliminada');
} else {
  console.error('❌ Error:', data.message);
}
```

**⚠️ IMPORTANTE:**
- Colaboradores/Líderes **solo** pueden eliminar sus propias incapacidades si están en estado `reportada`
- GH y Conta pueden eliminar **cualquier** incapacidad en **cualquier** estado
- La eliminación es **permanente** y no se puede deshacer
- Útil para limpiar datos de prueba o corregir errores de captura

---

### 2.6 Descargar Documento

```
📍 URL: GET http://localhost:3000/api/incapacidades/:id/documento
🔑 Token: SÍ necesitas
👤 Quién puede: El dueño, GH, Conta
```

**📤 QUÉ ENVÍAS:**
```
NADA en el body
URL: /api/incapacidades/15/documento
```

**📥 QUÉ RECIBES:**
```
El archivo PDF o imagen directamente
```

**💡 EJEMPLO REAL:**
```javascript
const token = localStorage.getItem('token');
const incapacidadId = 15;

const response = await fetch(`http://localhost:3000/api/incapacidades/${incapacidadId}/documento`, {
  headers: { 'Authorization': `Bearer ${token}` }
});

const blob = await response.blob();
const url = window.URL.createObjectURL(blob);

// Abrir en nueva pestaña
window.open(url, '_blank');

// O descargar
const a = document.createElement('a');
a.href = url;
a.download = 'incapacidad.pdf';
a.click();
```

---

## 🔄 MÓDULO 3: CAMBIAR ESTADO DE INCAPACIDAD

```
📍 URL: PUT http://localhost:3000/api/incapacidades/:id/estado
🔑 Token: SÍ necesitas
👤 Quién puede: Solo GH y Conta
```

**📤 QUÉ ENVÍAS:**
```json
{
  "nuevo_estado": "validada",
  "observaciones": "Documento correcto, incapacidad aprobada"
}
```

**📝 ESTADOS VÁLIDOS:**
```
reportada → en_revision → validada → conciliada → pagada → archivada
```

**📥 QUÉ RECIBES:**
```json
{
  "success": true,
  "message": "Estado actualizado exitosamente",
  "data": {
    "id": 15,
    "estado_anterior": "reportada",
    "estado_nuevo": "validada"
  }
}
```

**💡 EJEMPLO REAL:**
```javascript
const token = localStorage.getItem('token'); // Token de GH o Conta

const incapacidadId = 15;

const response = await fetch(`http://localhost:3000/api/incapacidades/${incapacidadId}/estado`, {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    nuevo_estado: 'validada',
    observaciones: 'Todo OK'
  })
});

const data = await response.json();
console.log('✅ Estado cambiado:', data.data.estado_nuevo);
```

---

## 💰 MÓDULO 4: CONCILIACIONES

### 4.1 Crear Conciliación

```
📍 URL: POST http://localhost:3000/api/conciliaciones
🔑 Token: SÍ necesitas
👤 Quién puede: Solo Conta
```

**📤 QUÉ ENVÍAS:**
```json
{
  "incapacidad_id": 15
}
```

**📥 QUÉ RECIBES:**
```json
{
  "success": true,
  "message": "Conciliación creada",
  "data": {
    "id": 5,
    "incapacidad_id": 15,
    "dias_incapacidad": 4,
    "ibc": 3000000,
    "salario_base": 3000000,
    "valor_dia": 100000,
    "dias_empresa": 2,
    "valor_empresa": 133340,
    "dias_eps": 2,
    "valor_eps": 133340,
    "valor_total": 266680
  }
}
```

**💡 EJEMPLO REAL:**
```javascript
const token = localStorage.getItem('token'); // Token de Conta

const response = await fetch('http://localhost:3000/api/conciliaciones', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    incapacidad_id: 15
  })
});

const data = await response.json();
console.log('💰 Valor total:', data.data.valor_total);
console.log('💼 Empresa paga:', data.data.valor_empresa);
console.log('🏥 EPS paga:', data.data.valor_eps);
```

---

### 4.2 Listar Conciliaciones

```
📍 URL: GET http://localhost:3000/api/conciliaciones
🔑 Token: SÍ necesitas
👤 Quién puede: Solo Conta y GH
```

**📤 QUÉ ENVÍAS:**
```
NADA, solo el token
```

**📥 QUÉ RECIBES:**
```json
{
  "success": true,
  "message": "Conciliaciones obtenidas",
  "data": [
    {
      "id": 5,
      "incapacidad_id": 15,
      "dias_incapacidad": 4,
      "ibc": 3000000,
      "salario_base": 3000000,
      "valor_dia": 100000,
      "dias_empresa": 2,
      "valor_empresa": 133340,
      "dias_eps": 2,
      "valor_eps": 133340,
      "valor_total": 266680,
      "created_at": "2025-11-21T12:00:00.000Z"
    },
    ...
  ]
}
```

**💡 EJEMPLO REAL:**
```javascript
const token = localStorage.getItem('token'); // Token de Conta o GH

const response = await fetch('http://localhost:3000/api/conciliaciones', {
  headers: { 'Authorization': `Bearer ${token}` }
});

const data = await response.json();

// Sumar total de todas las conciliaciones
const totalGeneral = data.data.reduce((sum, c) => sum + c.valor_total, 0);
console.log('💰 Total de todas las conciliaciones:', totalGeneral);
```

---

### 4.3 Ver Una Conciliación

```
📍 URL: GET http://localhost:3000/api/conciliaciones/incapacidad/:incapacidad_id
🔑 Token: SÍ necesitas
👤 Quién puede: Todos
```

**📤 QUÉ ENVÍAS:**
```
NADA en el body
URL: /api/conciliaciones/incapacidad/15  ← ID de la incapacidad
```

**📥 QUÉ RECIBES:**
```json
{
  "success": true,
  "message": "Conciliación obtenida",
  "data": {
    "id": 5,
    "incapacidad_id": 15,
    "valor_total": 266680,
    "valor_empresa": 133340,
    "valor_eps": 133340
  }
}
```

---

### 4.4 Estadísticas Financieras

```
📍 URL: GET http://localhost:3000/api/conciliaciones/estadisticas
🔑 Token: SÍ necesitas
👤 Quién puede: Solo Conta y GH
```

**📤 QUÉ ENVÍAS:**
```
NADA, solo el token
```

**📥 QUÉ RECIBES:**
```json
{
  "success": true,
  "message": "Estadísticas obtenidas",
  "data": {
    "total_conciliaciones": 15,
    "valor_total_general": 5000000,
    "valor_empresa_total": 2500000,
    "valor_eps_total": 2500000,
    "promedio_por_conciliacion": 333333
  }
}
```

**💡 EJEMPLO REAL:**
```javascript
const token = localStorage.getItem('token');

const response = await fetch('http://localhost:3000/api/conciliaciones/estadisticas', {
  headers: { 'Authorization': `Bearer ${token}` }
});

const data = await response.json();
console.log('📊 Total a pagar por empresa:', data.data.valor_empresa_total);
console.log('🏥 Total a pagar por EPS:', data.data.valor_eps_total);
```

---

### 4.5 Actualizar Conciliación

```
📍 URL: PUT http://localhost:3000/api/conciliaciones/:id
🔑 Token: SÍ necesitas
👤 Quién puede: Solo Conta
```

**📤 QUÉ ENVÍAS:**
```json
{
  "valor_empresa": 150000,
  "valor_eps": 150000,
  "valor_total": 300000,
  "observaciones": "Valores ajustados por corrección"
}
```

**📥 QUÉ RECIBES:**
```json
{
  "success": true,
  "message": "Conciliación actualizada",
  "data": {
    "id": 5,
    "valor_empresa": 150000,
    "valor_eps": 150000,
    "valor_total": 300000
  }
}
```

**💡 EJEMPLO REAL:**
```javascript
const token = localStorage.getItem('token'); // Token de Conta
const conciliacionId = 5;

const response = await fetch(`http://localhost:3000/api/conciliaciones/${conciliacionId}`, {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    valor_empresa: 150000,
    valor_eps: 150000,
    valor_total: 300000,
    observaciones: 'Valores corregidos'
  })
});

const data = await response.json();
console.log('✅ Conciliación actualizada');
```

---

## 🔄 MÓDULO 5: REEMPLAZOS

### 5.1 Crear Reemplazo

```
📍 URL: POST http://localhost:3000/api/reemplazos
🔑 Token: SÍ necesitas
👤 Quién puede: Solo Líder
```

**📤 QUÉ ENVÍAS:**
```json
{
  "incapacidad_id": 15,
  "colaborador_reemplazo_id": 6,
  "fecha_inicio": "2025-11-25",
  "fecha_fin": "2025-11-28",
  "funciones_asignadas": "Atención al cliente y gestión de pedidos",
  "observaciones": "María cubre mientras Juan está de incapacidad"
}
```

**📥 QUÉ RECIBES:**
```json
{
  "success": true,
  "message": "Reemplazo creado exitosamente",
  "data": {
    "id": 3,
    "incapacidad_id": 15,
    "colaborador_ausente_id": 4,
    "colaborador_reemplazo_id": 6,
    "fecha_inicio": "2025-11-25",
    "fecha_fin": "2025-11-28",
    "estado": "activo"
  }
}
```

**💡 EJEMPLO REAL:**
```javascript
const token = localStorage.getItem('token'); // Token de Líder

const response = await fetch('http://localhost:3000/api/reemplazos', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    incapacidad_id: 15,
    colaborador_reemplazo_id: 6,  // ID de Pedro Torres
    fecha_inicio: '2025-11-25',
    fecha_fin: '2025-11-28',
    funciones_asignadas: 'Atender clientes',
    observaciones: 'Pedro cubre a Juan'
  })
});

const data = await response.json();
console.log('✅ Reemplazo creado con ID:', data.data.id);
```

---

### 5.2 Listar Reemplazos

```
📍 URL: GET http://localhost:3000/api/reemplazos
🔑 Token: SÍ necesitas
👤 Quién puede: Todos
```

**📤 QUÉ ENVÍAS:**
```
NADA, solo el token
```

**📥 QUÉ RECIBES:**
```json
{
  "success": true,
  "message": "Reemplazos obtenidos",
  "data": [
    {
      "id": 3,
      "incapacidad_id": 15,
      "colaborador_ausente_id": 4,
      "colaborador_reemplazo_id": 6,
      "fecha_inicio": "2025-11-25",
      "fecha_fin": "2025-11-28",
      "funciones_asignadas": "Atención al cliente",
      "estado": "activo",
      "created_at": "2025-11-21T11:00:00.000Z"
    },
    ...
  ]
}
```

**💡 EJEMPLO REAL:**
```javascript
const token = localStorage.getItem('token');

const response = await fetch('http://localhost:3000/api/reemplazos', {
  headers: { 'Authorization': `Bearer ${token}` }
});

const data = await response.json();

// Filtrar solo reemplazos activos
const activos = data.data.filter(r => r.estado === 'activo');
console.log(`Hay ${activos.length} reemplazos activos`);
```

---

### 5.3 Ver Un Reemplazo

```
📍 URL: GET http://localhost:3000/api/reemplazos/:id
🔑 Token: SÍ necesitas
👤 Quién puede: Todos
```

**📤 QUÉ ENVÍAS:**
```
NADA en el body
URL: /api/reemplazos/3  ← ID del reemplazo
```

**📥 QUÉ RECIBES:**
```json
{
  "success": true,
  "message": "Reemplazo obtenido",
  "data": {
    "id": 3,
    "incapacidad_id": 15,
    "colaborador_ausente": {
      "id": 4,
      "nombre": "Juan Pablo Martínez",
      "email": "colab1@kare.com"
    },
    "colaborador_reemplazo": {
      "id": 6,
      "nombre": "Pedro Torres",
      "email": "colab2@kare.com"
    },
    "fecha_inicio": "2025-11-25",
    "fecha_fin": "2025-11-28",
    "funciones_asignadas": "Atención al cliente",
    "estado": "activo"
  }
}
```

---

### 5.4 Mis Reemplazos Activos

```
📍 URL: GET http://localhost:3000/api/reemplazos/mis-reemplazos
🔑 Token: SÍ necesitas
👤 Quién puede: Todos
```

**📤 QUÉ ENVÍAS:**
```
NADA, solo el token
```

**📥 QUÉ RECIBES:**
```json
{
  "success": true,
  "message": "Mis reemplazos activos",
  "data": [
    {
      "id": 3,
      "colaborador_ausente": "Juan Pablo Martínez",
      "funciones_asignadas": "Atención al cliente",
      "fecha_inicio": "2025-11-25",
      "fecha_fin": "2025-11-28"
    }
  ]
}
```

**💡 EJEMPLO REAL:**
```javascript
const token = localStorage.getItem('token');

const response = await fetch('http://localhost:3000/api/reemplazos/mis-reemplazos', {
  headers: { 'Authorization': `Bearer ${token}` }
});

const data = await response.json();

if (data.data.length > 0) {
  console.log('🔄 Estoy cubriendo:', data.data[0].colaborador_ausente);
  console.log('📋 Funciones:', data.data[0].funciones_asignadas);
} else {
  console.log('No tengo reemplazos activos');
}
```

---

### 5.5 Reemplazos de una Incapacidad

```
📍 URL: GET http://localhost:3000/api/reemplazos/incapacidad/:incapacidad_id
🔑 Token: SÍ necesitas
👤 Quién puede: Todos
```

**📤 QUÉ ENVÍAS:**
```
NADA en el body
URL: /api/reemplazos/incapacidad/15  ← ID de la incapacidad
```

**📥 QUÉ RECIBES:**
```json
{
  "success": true,
  "message": "Reemplazos de la incapacidad",
  "data": [
    {
      "id": 3,
      "colaborador_reemplazo": "Pedro Torres",
      "estado": "activo"
    }
  ]
}
```

---

### 5.6 Estadísticas de Reemplazos

```
📍 URL: GET http://localhost:3000/api/reemplazos/estadisticas
🔑 Token: SÍ necesitas
👤 Quién puede: Solo GH, Conta, Líder
```

**📤 QUÉ ENVÍAS:**
```
NADA, solo el token
```

**📥 QUÉ RECIBES:**
```json
{
  "success": true,
  "message": "Estadísticas obtenidas",
  "data": {
    "total_reemplazos": 25,
    "activos": 10,
    "finalizados": 12,
    "cancelados": 3,
    "promedio_duracion_dias": 5
  }
}
```

**💡 EJEMPLO REAL:**
```javascript
const token = localStorage.getItem('token'); // Token de GH, Conta o Líder

const response = await fetch('http://localhost:3000/api/reemplazos/estadisticas', {
  headers: { 'Authorization': `Bearer ${token}` }
});

const data = await response.json();
console.log('📊 Reemplazos activos:', data.data.activos);
console.log('✅ Reemplazos finalizados:', data.data.finalizados);
```

---

### 5.7 Finalizar Reemplazo

```
📍 URL: PUT http://localhost:3000/api/reemplazos/:id/finalizar
🔑 Token: SÍ necesitas
👤 Quién puede: Solo Líder
```

**📤 QUÉ ENVÍAS:**
```json
{
  "observaciones": "Reemplazo completado exitosamente"
}
```

**📥 QUÉ RECIBES:**
```json
{
  "success": true,
  "message": "Reemplazo finalizado",
  "data": {
    "id": 3,
    "estado": "finalizado"
  }
}
```

**💡 EJEMPLO REAL:**
```javascript
const token = localStorage.getItem('token'); // Token de Líder
const reemplazoId = 3;

const response = await fetch(`http://localhost:3000/api/reemplazos/${reemplazoId}/finalizar`, {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    observaciones: 'Reemplazo completado exitosamente'
  })
});

const data = await response.json();
console.log('✅ Reemplazo finalizado');
```

---

### 5.8 Cancelar Reemplazo

```
📍 URL: PUT http://localhost:3000/api/reemplazos/:id/cancelar
🔑 Token: SÍ necesitas
👤 Quién puede: Solo Líder
```

**📤 QUÉ ENVÍAS:**
```json
{
  "motivo": "Colaborador regresó antes de lo esperado"
}
```

**📥 QUÉ RECIBES:**
```json
{
  "success": true,
  "message": "Reemplazo cancelado",
  "data": {
    "id": 3,
    "estado": "cancelado"
  }
}
```

**💡 EJEMPLO REAL:**
```javascript
const token = localStorage.getItem('token'); // Token de Líder
const reemplazoId = 3;

const response = await fetch(`http://localhost:3000/api/reemplazos/${reemplazoId}/cancelar`, {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    motivo: 'Colaborador regresó anticipadamente'
  })
});

const data = await response.json();
console.log('❌ Reemplazo cancelado');
```

---

## 📬 MÓDULO 6: NOTIFICACIONES

### 6.1 Ver Mis Notificaciones

```
📍 URL: GET http://localhost:3000/api/notificaciones
🔑 Token: SÍ necesitas
👤 Quién puede: Todos
```

**📤 QUÉ ENVÍAS:**
```
NADA, solo el token
```

**📥 QUÉ RECIBES:**
```json
{
  "success": true,
  "message": "Notificaciones obtenidas",
  "data": [
    {
      "id": 25,
      "tipo": "estado_cambiado",
      "titulo": "Incapacidad validada",
      "mensaje": "Tu incapacidad EPS cambió a estado: validada",
      "leida": 0,  ← 0 = no leída, 1 = leída
      "created_at": "2025-11-21T11:00:00.000Z"
    },
    {
      "id": 24,
      "tipo": "documento_subido",
      "titulo": "Documento actualizado",
      "mensaje": "Tu documento ha sido actualizado",
      "leida": 1,
      "created_at": "2025-11-21T10:30:00.000Z"
    }
  ]
}
```

**💡 EJEMPLO REAL:**
```javascript
const token = localStorage.getItem('token');

const response = await fetch('http://localhost:3000/api/notificaciones', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const data = await response.json();

// Contar no leídas
const noLeidas = data.data.filter(n => n.leida === 0).length;
console.log(`Tienes ${noLeidas} notificaciones sin leer`);

// Mostrar solo las no leídas
data.data
  .filter(n => n.leida === 0)
  .forEach(n => {
    console.log(`🔔 ${n.titulo}: ${n.mensaje}`);
  });
```

---

### 6.2 Contador de No Leídas

```
📍 URL: GET http://localhost:3000/api/notificaciones/no-leidas/count
🔑 Token: SÍ necesitas
👤 Quién puede: Todos
```

**📤 QUÉ ENVÍAS:**
```
NADA, solo el token
```

**📥 QUÉ RECIBES:**
```json
{
  "success": true,
  "message": "Contador de no leídas",
  "data": {
    "count": 5
  }
}
```

**💡 EJEMPLO REAL:**
```javascript
const token = localStorage.getItem('token');

const response = await fetch('http://localhost:3000/api/notificaciones/no-leidas/count', {
  headers: { 'Authorization': `Bearer ${token}` }
});

const data = await response.json();

// Mostrar badge en la campana de notificaciones
const badge = document.getElementById('notification-badge');
badge.textContent = data.data.count;
badge.style.display = data.data.count > 0 ? 'block' : 'none';
```

---

### 6.3 Marcar Notificación como Leída

```
📍 URL: PUT http://localhost:3000/api/notificaciones/:id/leer
🔑 Token: SÍ necesitas
👤 Quién puede: Todos (solo tus propias notificaciones)
```

**📤 QUÉ ENVÍAS:**
```
NADA en el body
URL: /api/notificaciones/25/leer  ← ID de la notificación
```

**📥 QUÉ RECIBES:**
```json
{
  "success": true,
  "message": "Notificación marcada como leída",
  "data": null
}
```

**💡 EJEMPLO REAL:**
```javascript
const token = localStorage.getItem('token');
const notificacionId = 25;

const response = await fetch(`http://localhost:3000/api/notificaciones/${notificacionId}/leer`, {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const data = await response.json();
console.log('✅ Notificación marcada como leída');
```

---

### 6.4 Marcar Todas como Leídas

```
📍 URL: PUT http://localhost:3000/api/notificaciones/leer-todas
🔑 Token: SÍ necesitas
👤 Quién puede: Todos
```

**📤 QUÉ ENVÍAS:**
```
NADA en el body
```

**📥 QUÉ RECIBES:**
```json
{
  "success": true,
  "message": "Todas las notificaciones marcadas como leídas",
  "data": {
    "count": 5
  }
}
```

**💡 EJEMPLO REAL:**
```javascript
const token = localStorage.getItem('token');

const response = await fetch('http://localhost:3000/api/notificaciones/leer-todas', {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const data = await response.json();
console.log(`✅ ${data.data.count} notificaciones marcadas como leídas`);
```

---

### 6.5 Eliminar Notificación

```
📍 URL: DELETE http://localhost:3000/api/notificaciones/:id
🔑 Token: SÍ necesitas
👤 Quién puede: Todos (solo tus propias notificaciones)
```

**📤 QUÉ ENVÍAS:**
```
NADA en el body
URL: /api/notificaciones/25  ← ID de la notificación
```

**📥 QUÉ RECIBES:**
```json
{
  "success": true,
  "message": "Notificación eliminada",
  "data": null
}
```

**💡 EJEMPLO REAL:**
```javascript
const token = localStorage.getItem('token');
const notificacionId = 25;

const response = await fetch(`http://localhost:3000/api/notificaciones/${notificacionId}`, {
  method: 'DELETE',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const data = await response.json();
console.log('🗑️ Notificación eliminada');
```

---

## 👥 MÓDULO 7: USUARIOS

### 7.1 Listar Usuarios

```
📍 URL: GET http://localhost:3000/api/usuarios
🔑 Token: SÍ necesitas
👤 Quién puede: Solo GH y Conta
```

**📤 QUÉ ENVÍAS:**
```
NADA, solo el token
```

**📥 QUÉ RECIBES:**
```json
{
  "success": true,
  "message": "Usuarios obtenidos",
  "data": [
    {
      "id": 1,
      "nombre": "Ana María González",
      "email": "gh@kare.com",
      "rol": "gh",
      "area": "Recursos Humanos",
      "cargo": "Jefe de Gestión Humana"
    },
    {
      "id": 4,
      "nombre": "Juan Pablo Martínez",
      "email": "colab1@kare.com",
      "rol": "colab",
      "area": "Ventas",
      "cargo": "Vendedor"
    },
    ...
  ]
}
```

**💡 EJEMPLO REAL:**
```javascript
const token = localStorage.getItem('token'); // Token de GH o Conta

const response = await fetch('http://localhost:3000/api/usuarios', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const data = await response.json();

// Filtrar solo colaboradores
const colaboradores = data.data.filter(u => u.rol === 'colab');
console.log(`Hay ${colaboradores.length} colaboradores`);
```

---

### 7.2 Cambiar Rol de Usuario

```
📍 URL: PUT http://localhost:3000/api/usuarios/:id/rol
🔑 Token: SÍ necesitas
👤 Quién puede: Solo GH
```

**📤 QUÉ ENVÍAS:**
```json
{
  "rol": "lider"
}
```

**📝 ROLES VÁLIDOS:**
- `"colab"` - Colaborador
- `"lider"` - Líder
- `"gh"` - Gestión Humana
- `"conta"` - Contabilidad

**📥 QUÉ RECIBES:**
```json
{
  "success": true,
  "message": "Rol actualizado exitosamente",
  "data": {
    "id": 4,
    "nombre": "Juan Pablo Martínez",
    "rol": "lider"
  }
}
```

**💡 EJEMPLO REAL:**
```javascript
const token = localStorage.getItem('token'); // Token de GH
const usuarioId = 4;

const response = await fetch(`http://localhost:3000/api/usuarios/${usuarioId}/rol`, {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    rol: 'lider'
  })
});

const data = await response.json();
console.log('✅ Rol actualizado a:', data.data.rol);
```

---

## 🤖 MÓDULO 8: OCR (Extraer Texto de Documentos)

### 8.1 Validar Documento con OCR

```
📍 URL: POST http://localhost:3000/api/ocr/validar-documento
🔑 Token: SÍ necesitas
👤 Quién puede: GH
```

**📤 QUÉ ENVÍAS:**
```
Un archivo PDF o imagen (JPG, JPEG, PNG)
```

**💡 EJEMPLO REAL:**
```html
<form id="ocrForm">
  <input type="file" id="ocrFile" accept=".pdf,.jpg,.jpeg,.png">
  <button type="submit">Extraer Texto</button>
</form>

<div id="resultado"></div>

<script>
document.getElementById('ocrForm').onsubmit = async (e) => {
  e.preventDefault();
  
  const file = document.getElementById('ocrFile').files[0];
  const formData = new FormData();
  formData.append('documento', file);
  
  const token = localStorage.getItem('token');
  
  const response = await fetch('http://localhost:3000/api/ocr/validar-documento', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });
  
  const data = await response.json();
  
  // Mostrar resultados
  document.getElementById('resultado').innerHTML = `
    <h3>Resultados del OCR:</h3>
    <p><strong>Tipo detectado:</strong> ${data.data.clasificacion.tipo}</p>
    <p><strong>Confianza:</strong> ${data.data.clasificacion.confianza}%</p>
    <p><strong>Paciente:</strong> ${data.data.campos.paciente || 'No detectado'}</p>
    <p><strong>Diagnóstico:</strong> ${data.data.campos.diagnostico || 'No detectado'}</p>
    <p><strong>Días:</strong> ${data.data.campos.dias || 'No detectado'}</p>
  `;
};
</script>
```

**📥 QUÉ RECIBES:**
```json
{
  "success": true,
  "message": "Documento procesado correctamente",
  "data": {
    "texto_extraido": "INCAPACIDAD MÉDICA\\nNombre: Juan Pablo Martínez...",
    "clasificacion": {
      "tipo": "Enfermedad General",
      "confianza": 89
    },
    "campos": {
      "paciente": "Juan Pablo Martínez",
      "diagnostico": "Gripa",
      "dias": "4",
      "fecha_inicio": "2025-11-25",
      "fecha_fin": "2025-11-28"
    },
    "validacion": {
      "es_valida": true,
      "advertencias": []
    }
  }
}
```

---

## 🎓 USUARIOS DE PRUEBA

Para probar el sistema, usa estos usuarios:

| Email | Contraseña | Rol | Puede hacer |
|-------|------------|-----|-------------|
| `gh@kare.com` | `gh123` | GH | TODO |
| `conta@kare.com` | `conta123` | Conta | Conciliaciones, ver todo |
| `lider@kare.com` | `lider123` | Líder | Crear reemplazos |
| `colab1@kare.com` | `123456` | Colaborador | Crear incapacidades, ver las suyas |
| `colab2@kare.com` | `123456` | Colaborador | Crear incapacidades, ver las suyas |

---

## ❓ PREGUNTAS FRECUENTES

### ¿Cómo sé si una petición fue exitosa?

Mira el campo `success`:
```javascript
const data = await response.json();

if (data.success === true) {
  console.log('✅ Todo bien:', data.data);
} else {
  console.error('❌ Hubo un error:', data.message);
}
```

### ¿Qué hago si me dice "Token inválido"?

Vuelve a hacer login para obtener un token nuevo:
```javascript
// Tu token expiró, vuelve a hacer login
const response = await fetch('http://localhost:3000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'colab1@kare.com',
    password: '123456'
  })
});

const data = await response.json();
localStorage.setItem('token', data.data.token);
```

### ¿Cómo subo un archivo?

Usa `FormData` (NO uses `JSON.stringify`):
```javascript
const formData = new FormData();
formData.append('documento', archivo);  // archivo = file input

await fetch(url, {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: formData  // NO pongas Content-Type
});
```

### ¿Cómo descargo un archivo?

```javascript
const token = localStorage.getItem('token');
const incapacidadId = 15;

const response = await fetch(`http://localhost:3000/api/incapacidades/${incapacidadId}/documento/download`, {
  headers: { 'Authorization': `Bearer ${token}` }
});

const blob = await response.blob();
const url = window.URL.createObjectURL(blob);

// Crear link de descarga
const a = document.createElement('a');
a.href = url;
a.download = 'incapacidad.pdf';
a.click();
```

---

## 🚀 FLUJO COMPLETO DE EJEMPLO

```javascript
// 1. LOGIN
const loginRes = await fetch('http://localhost:3000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'colab1@kare.com',
    password: '123456'
  })
});
const loginData = await loginRes.json();
const token = loginData.data.token;
localStorage.setItem('token', token);

// 2. CREAR INCAPACIDAD
const incapRes = await fetch('http://localhost:3000/api/incapacidades', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    tipo: 'EPS',
    fecha_inicio: '2025-11-25',
    fecha_fin: '2025-11-28',
    diagnostico: 'Gripa'
  })
});
const incapData = await incapRes.json();
const incapacidadId = incapData.data.id;
console.log('✅ Incapacidad creada con ID:', incapacidadId);

// 3. SUBIR DOCUMENTO
const formData = new FormData();
formData.append('documento', fileInput.files[0]);

const docRes = await fetch(`http://localhost:3000/api/incapacidades/${incapacidadId}/documento`, {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: formData
});
const docData = await docRes.json();
console.log('✅ Documento subido:', docData.data.documento);

// 4. VER MIS NOTIFICACIONES
const notifRes = await fetch('http://localhost:3000/api/notificaciones', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const notifData = await notifRes.json();
console.log('📬 Tengo', notifData.data.length, 'notificaciones');
```

---

## 💡 CONSEJOS FINALES

1. **SIEMPRE guarda el token** después del login
2. **SIEMPRE envía el token** en el header `Authorization: Bearer {token}`
3. **Para archivos usa FormData**, NO `JSON.stringify`
4. **Revisa `data.success`** para saber si funcionó
5. **Lee `data.message`** si algo falla

---

¿Tienes dudas? Busca el endpoint en esta guía y sigue el ejemplo paso a paso. 🎯

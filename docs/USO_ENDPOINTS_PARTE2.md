# 📡 GUÍA VISUAL DE USO DE ENDPOINTS - SISTEMA KARE (PARTE 2)

**Versión:** 1.0.0  
**Fecha:** 19 de noviembre de 2025

---

## 📋 ÍNDICE - PARTE 2

4. [MÓDULO 4: Conciliaciones](#módulo-4-conciliaciones)
5. [MÓDULO 5: Reemplazos](#módulo-5-reemplazos)
6. [MÓDULO 6: Gestión de Usuarios](#módulo-6-gestión-de-usuarios)
7. [MÓDULO 7: Health Check](#módulo-7-health-check)
8. [Casos de Uso Completos](#casos-de-uso-completos)
9. [Códigos de Estado HTTP](#códigos-de-estado-http)
10. [Herramientas Recomendadas](#herramientas-recomendadas)

**Ver también:** [USO_ENDPOINTS_PARTE1.md](USO_ENDPOINTS_PARTE1.md)

---

## 💰 MÓDULO 4: CONCILIACIONES

### 4.1 Crear Conciliación

**Endpoint:** `POST /api/conciliaciones`

**URL Completa:**
```
http://localhost:3000/api/conciliaciones
```

**Método:** `POST`

**Headers:**
```http
Content-Type: application/json
Authorization: Bearer {token}
```

**Roles Permitidos:** `conta`

**Body (JSON):**
```json
{
  "incapacidad_id": 1,
  "ibc": "3000000",
  "observaciones": "Conciliación procesada correctamente"
}
```

**Ejemplo con curl:**
```bash
curl -X POST http://localhost:3000/api/conciliaciones \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token_conta}" \
  -d '{
    "incapacidad_id": 1,
    "ibc": "3000000",
    "observaciones": "Conciliación procesada"
  }'
```

**Respuesta Exitosa (201 Created):**
```json
{
  "success": true,
  "message": "Conciliación creada exitosamente",
  "data": {
    "id": 1,
    "incapacidad_id": 1,
    "ibc": "3000000.00",
    "dias_empresa": 2,
    "monto_empresa": "200000.00",
    "dias_eps": 3,
    "monto_eps": "200010.00",
    "total": "400010.00",
    "estado_pago": "pendiente",
    "observaciones": "Conciliación procesada correctamente",
    "created_at": "2025-11-19T22:00:00.000Z"
  }
}
```

**Cálculo Automático:**

Para incapacidad de 5 días con IBC $3,000,000:

```
Días 1-2 (Empresa - 100%):
  2 días × ($3,000,000 / 30) × 100% = $200,000

Días 3-5 (EPS - 66.67%):
  3 días × ($3,000,000 / 30) × 66.67% = $200,010

Total: $400,010
```

**📊 Diagrama del Cálculo:**

```
┌────────────────────────────────────────────────┐
│         INCAPACIDAD DE 5 DÍAS (EPS)            │
└────────────────────────────────────────────────┘
                    │
        ┌───────────┴────────────┐
        │                        │
   Días 1-2                 Días 3-5
   (Empresa)                  (EPS)
     100%                    66.67%
   $200,000                $200,010
        │                        │
        └───────────┬────────────┘
                    ▼
              TOTAL: $400,010
```

**🎨 Para Frontend - Calculadora de Conciliación:**

```javascript
// utils/calcularConciliacion.js
export const calcularConciliacion = (incapacidad, usuario) => {
  const { tipo, fecha_inicio, fecha_fin } = incapacidad;
  const { ibc, salario_base } = usuario;
  
  // Calcular días
  const inicio = new Date(fecha_inicio);
  const fin = new Date(fecha_fin);
  const dias = Math.ceil((fin - inicio) / (1000 * 60 * 60 * 24)) + 1;
  
  // Valor día
  const valorDia = ibc / 30;
  
  let diasEmpresa = 0;
  let porcentajeEmpresa = 100;
  let diasEPS = 0;
  let porcentajeEPS = 66.67;
  let valorEmpresa = 0;
  let valorEPS = 0;
  
  if (tipo === 'EPS') {
    // Primeros 2 días: 100% empresa
    diasEmpresa = Math.min(dias, 2);
    valorEmpresa = diasEmpresa * valorDia * (porcentajeEmpresa / 100);
    
    // Resto: 66.67% EPS
    diasEPS = Math.max(0, dias - 2);
    valorEPS = diasEPS * valorDia * (porcentajeEPS / 100);
  } else if (tipo === 'ARL') {
    // ARL paga 100% desde día 1
    diasEPS = dias;
    porcentajeEPS = 100;
    valorEPS = dias * valorDia;
  }
  
  const valorTotal = valorEmpresa + valorEPS;
  
  return {
    dias_incapacidad: dias,
    salario_base,
    ibc,
    valor_dia: valorDia,
    dias_empresa: diasEmpresa,
    porcentaje_empresa: porcentajeEmpresa,
    valor_empresa: valorEmpresa,
    dias_eps: diasEPS,
    porcentaje_eps: porcentajeEPS,
    valor_eps: valorEPS,
    valor_total: valorTotal
  };
};

// Uso en componente:
const conciliacion = calcularConciliacion(incapacidad, usuario);
console.log('Total a pagar:', conciliacion.valor_total);
```

**Respuesta Error (400 Bad Request):**
```json
{
  "success": false,
  "message": "Ya existe una conciliación para esta incapacidad",
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
- `201` - Conciliación creada exitosamente
- `400` - Duplicado o incapacidad no válida
- `401` - No autenticado
- `403` - Sin permisos (solo Conta)
- `404` - Incapacidad no encontrada
- `500` - Error del servidor

**Validaciones:**
- ✅ Incapacidad debe existir
- ✅ Incapacidad debe estar en estado "validada"
- ✅ No debe existir conciliación previa para la incapacidad
- ✅ IBC debe ser número válido

---

### 4.2 Listar Conciliaciones

**Endpoint:** `GET /api/conciliaciones`

**URL Completa:**
```
http://localhost:3000/api/conciliaciones
```

**Método:** `GET`

**Headers:**
```http
Authorization: Bearer {token}
```

**Roles Permitidos:** `gh`, `conta`

**Ejemplo con curl:**
```bash
curl -X GET http://localhost:3000/api/conciliaciones \
  -H "Authorization: Bearer {token}"
```

**Respuesta Exitosa (200 OK):**
```json
{
  "success": true,
  "message": "Conciliaciones obtenidas",
  "data": [
    {
      "id": 1,
      "incapacidad_id": 1,
      "usuario_id": 4,
      "usuario_nombre": "Colaborador 1",
      "diagnostico": "Gripe viral aguda",
      "tipo_incapacidad": "EPS",
      "ibc": "3000000.00",
      "dias_empresa": 2,
      "monto_empresa": "200000.00",
      "dias_eps": 3,
      "monto_eps": "200010.00",
      "total": "400010.00",
      "estado_pago": "pendiente",
      "fecha_pago": null,
      "created_at": "2025-11-19T22:00:00.000Z"
    },
    {
      "id": 2,
      "incapacidad_id": 3,
      "usuario_id": 5,
      "usuario_nombre": "Colaborador 2",
      "diagnostico": "Accidente laboral",
      "tipo_incapacidad": "ARL",
      "ibc": "2800000.00",
      "dias_empresa": 0,
      "monto_empresa": "0.00",
      "dias_eps": 10,
      "monto_eps": "933333.33",
      "total": "933333.33",
      "estado_pago": "pagada",
      "fecha_pago": "2025-11-20",
      "created_at": "2025-11-19T23:00:00.000Z"
    }
  ]
}
```

**Códigos de Estado:**
- `200` - Conciliaciones obtenidas
- `401` - No autenticado
- `403` - Sin permisos (solo GH/Conta)
- `500` - Error del servidor

---

### 4.3 Obtener Conciliación por Incapacidad

**Endpoint:** `GET /api/conciliaciones/incapacidad/:id`

**URL Completa:**
```
http://localhost:3000/api/conciliaciones/incapacidad/1
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
curl -X GET http://localhost:3000/api/conciliaciones/incapacidad/1 \
  -H "Authorization: Bearer {token}"
```

**Respuesta Exitosa (200 OK):**
```json
{
  "success": true,
  "message": "Conciliación obtenida",
  "data": {
    "id": 1,
    "incapacidad_id": 1,
    "ibc": "3000000.00",
    "dias_empresa": 2,
    "monto_empresa": "200000.00",
    "dias_eps": 3,
    "monto_eps": "200010.00",
    "total": "400010.00",
    "estado_pago": "pendiente",
    "observaciones": "Conciliación procesada correctamente",
    "created_at": "2025-11-19T22:00:00.000Z"
  }
}
```

**Respuesta Error (404 Not Found):**
```json
{
  "success": false,
  "message": "No existe conciliación para esta incapacidad",
  "data": null
}
```

**Códigos de Estado:**
- `200` - Conciliación encontrada
- `401` - No autenticado
- `404` - No existe conciliación para esa incapacidad
- `500` - Error del servidor

---

### 4.4 Estadísticas de Conciliaciones

**Endpoint:** `GET /api/conciliaciones/estadisticas`

**URL Completa:**
```
http://localhost:3000/api/conciliaciones/estadisticas
```

**Método:** `GET`

**Headers:**
```http
Authorization: Bearer {token}
```

**Roles Permitidos:** `gh`, `conta`

**Ejemplo con curl:**
```bash
curl -X GET http://localhost:3000/api/conciliaciones/estadisticas \
  -H "Authorization: Bearer {token}"
```

**Respuesta Exitosa (200 OK):**
```json
{
  "success": true,
  "message": "Estadísticas obtenidas",
  "data": {
    "total_conciliaciones": 15,
    "total_monto": "6500750.00",
    "monto_empresa": "1200000.00",
    "monto_eps": "5300750.00",
    "pendientes": 8,
    "pagadas": 7,
    "promedio_monto": "433383.33",
    "conciliaciones_por_tipo": {
      "EPS": 12,
      "ARL": 2,
      "Licencia": 1
    }
  }
}
```

**Códigos de Estado:**
- `200` - Estadísticas obtenidas
- `401` - No autenticado
- `403` - Sin permisos (solo GH/Conta)
- `500` - Error del servidor

---

### 4.5 Actualizar Estado de Pago

**Endpoint:** `PUT /api/conciliaciones/:id`

**URL Completa:**
```
http://localhost:3000/api/conciliaciones/1
```

**Método:** `PUT`

**Headers:**
```http
Content-Type: application/json
Authorization: Bearer {token}
```

**Roles Permitidos:** `conta`

**Body (JSON):**
```json
{
  "estado_pago": "pagada",
  "fecha_pago": "2025-11-20",
  "observaciones": "Pago transferido exitosamente"
}
```

**Ejemplo con curl:**
```bash
curl -X PUT http://localhost:3000/api/conciliaciones/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{
    "estado_pago": "pagada",
    "fecha_pago": "2025-11-20"
  }'
```

**Respuesta Exitosa (200 OK):**
```json
{
  "success": true,
  "message": "Conciliación actualizada exitosamente",
  "data": {
    "id": 1,
    "estado_pago": "pagada",
    "fecha_pago": "2025-11-20",
    "observaciones": "Pago transferido exitosamente",
    "updated_at": "2025-11-20T10:00:00.000Z"
  }
}
```

**Estados de Pago Válidos:**
- `pendiente` - Pendiente de pago
- `pagada` - Pago realizado
- `rechazada` - Pago rechazado

**Códigos de Estado:**
- `200` - Conciliación actualizada
- `400` - Datos inválidos
- `401` - No autenticado
- `403` - Sin permisos (solo Conta)
- `404` - Conciliación no encontrada
- `500` - Error del servidor

---

## 🔄 MÓDULO 5: REEMPLAZOS

### 5.1 Crear Reemplazo

**Endpoint:** `POST /api/reemplazos`

**URL Completa:**
```
http://localhost:3000/api/reemplazos
```

**Método:** `POST`

**Headers:**
```http
Content-Type: application/json
Authorization: Bearer {token}
```

**Roles Permitidos:** `lider`

**Body (JSON):**
```json
{
  "incapacidad_id": 1,
  "colaborador_reemplazo_id": 5,
  "observaciones": "Reemplazo temporal durante incapacidad"
}
```

**Ejemplo con curl:**
```bash
curl -X POST http://localhost:3000/api/reemplazos \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token_lider}" \
  -d '{
    "incapacidad_id": 1,
    "colaborador_reemplazo_id": 5,
    "observaciones": "Reemplazo temporal"
  }'
```

**Respuesta Exitosa (201 Created):**
```json
{
  "success": true,
  "message": "Reemplazo creado exitosamente",
  "data": {
    "id": 1,
    "incapacidad_id": 1,
    "colaborador_original_id": 4,
    "colaborador_reemplazo_id": 5,
    "fecha_inicio": "2026-01-20",
    "fecha_fin": null,
    "estado": "activo",
    "observaciones": "Reemplazo temporal durante incapacidad",
    "created_at": "2025-11-19T22:30:00.000Z"
  }
}
```

**Respuesta Error (400 Bad Request):**
```json
{
  "success": false,
  "message": "Un colaborador no puede reemplazarse a sí mismo",
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
- `201` - Reemplazo creado exitosamente
- `400` - Auto-reemplazo o datos inválidos
- `401` - No autenticado
- `403` - Sin permisos (solo Líder)
- `404` - Incapacidad o colaborador no encontrado
- `500` - Error del servidor

**Validaciones:**
- ✅ Incapacidad debe existir
- ✅ Colaborador reemplazo debe existir
- ✅ Colaborador no puede reemplazarse a sí mismo
- ✅ No debe haber reemplazo activo previo

**📊 Flujo Visual de Reemplazo:**

```
┌──────────────┐
│ Colaborador  │ ──► Incapacitado (ausente)
│   Ausente    │
└──────────────┘
      │
      │ Líder asigna reemplazo
      ▼
┌──────────────┐
│ Colaborador  │ ──► Asume funciones temporalmente
│  Reemplazo   │
└──────────────┘
      │
      │ Fin de incapacidad
      ▼
┌──────────────┐
│  Finalizar   │ ──► Colaborador regresa
│  Reemplazo   │
└──────────────┘
```

**🎨 Para Frontend - Selector de Reemplazo:**

```javascript
// FormularioReemplazo.jsx
import { useState, useEffect } from 'react';

function FormularioReemplazo({ incapacidad }) {
  const [colaboradores, setColaboradores] = useState([]);
  const [reemplazoId, setReemplazoId] = useState('');
  const token = localStorage.getItem('token');

  useEffect(() => {
    cargarColaboradores();
  }, []);

  const cargarColaboradores = async () => {
    const response = await fetch('http://localhost:3000/api/usuarios', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    
    // Filtrar: excluir al colaborador ausente
    const filtrados = data.data.filter(
      u => u.id !== incapacidad.colaborador_id && u.rol === 'colab'
    );
    setColaboradores(filtrados);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const reemplazo = {
      incapacidad_id: incapacidad.id,
      colaborador_reemplazo_id: parseInt(reemplazoId),
      fecha_inicio: incapacidad.fecha_inicio,
      fecha_fin: incapacidad.fecha_fin,
      observaciones: 'Reemplazo temporal durante incapacidad'
    };

    try {
      const response = await fetch('http://localhost:3000/api/reemplazos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(reemplazo)
      });

      const data = await response.json();
      if (data.success) {
        alert('✅ Reemplazo asignado exitosamente');
      } else {
        alert(`❌ Error: ${data.message}`);
      }
    } catch (error) {
      alert('❌ Error de conexión');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h3>Asignar Reemplazo</h3>
      
      <div className="info-ausente">
        <p><strong>Colaborador Ausente:</strong> {incapacidad.colaborador_nombre}</p>
        <p><strong>Período:</strong> {incapacidad.fecha_inicio} - {incapacidad.fecha_fin}</p>
      </div>

      <label>Colaborador Reemplazo:</label>
      <select 
        value={reemplazoId} 
        onChange={(e) => setReemplazoId(e.target.value)}
        required
      >
        <option value="">Seleccionar colaborador...</option>
        {colaboradores.map(colab => (
          <option key={colab.id} value={colab.id}>
            {colab.nombre} - {colab.cargo}
          </option>
        ))}
      </select>

      <button type="submit">Asignar Reemplazo</button>
    </form>
  );
}
```

---

### 5.2 Listar Reemplazos

**Endpoint:** `GET /api/reemplazos`

**URL Completa:**
```
http://localhost:3000/api/reemplazos
```

**Método:** `GET`

**Headers:**
```http
Authorization: Bearer {token}
```

**Roles Permitidos:** `gh`, `conta`, `lider`

**Ejemplo con curl:**
```bash
curl -X GET http://localhost:3000/api/reemplazos \
  -H "Authorization: Bearer {token}"
```

**Respuesta Exitosa (200 OK):**
```json
{
  "success": true,
  "message": "Reemplazos obtenidos",
  "data": [
    {
      "id": 1,
      "incapacidad_id": 1,
      "colaborador_original_id": 4,
      "colaborador_original": "Colaborador 1",
      "email_original": "colab1@kare.com",
      "colaborador_reemplazo_id": 5,
      "colaborador_reemplazo": "Colaborador 2",
      "email_reemplazo": "colab2@kare.com",
      "fecha_inicio": "2026-01-20",
      "fecha_fin": null,
      "estado": "activo",
      "observaciones": "Reemplazo temporal",
      "created_at": "2025-11-19T22:30:00.000Z"
    },
    {
      "id": 2,
      "incapacidad_id": 3,
      "colaborador_original_id": 6,
      "colaborador_original": "Colaborador 3",
      "email_original": "colab3@kare.com",
      "colaborador_reemplazo_id": 8,
      "colaborador_reemplazo": "Colaborador 4",
      "email_reemplazo": "colab4@kare.com",
      "fecha_inicio": "2026-02-01",
      "fecha_fin": "2026-02-10",
      "estado": "finalizado",
      "observaciones": "Reemplazo completado",
      "created_at": "2025-11-20T10:00:00.000Z"
    }
  ]
}
```

**Códigos de Estado:**
- `200` - Reemplazos obtenidos
- `401` - No autenticado
- `403` - Sin permisos
- `500` - Error del servidor

---

### 5.3 Obtener Reemplazo por ID

**Endpoint:** `GET /api/reemplazos/:id`

**URL Completa:**
```
http://localhost:3000/api/reemplazos/1
```

**Método:** `GET`

**Headers:**
```http
Authorization: Bearer {token}
```

**Parámetros URL:**
- `id` - ID del reemplazo

**Ejemplo con curl:**
```bash
curl -X GET http://localhost:3000/api/reemplazos/1 \
  -H "Authorization: Bearer {token}"
```

**Respuesta Exitosa (200 OK):**
```json
{
  "success": true,
  "message": "Reemplazo obtenido",
  "data": {
    "id": 1,
    "incapacidad_id": 1,
    "colaborador_original": "Colaborador 1",
    "colaborador_reemplazo": "Colaborador 2",
    "fecha_inicio": "2026-01-20",
    "fecha_fin": null,
    "estado": "activo",
    "observaciones": "Reemplazo temporal"
  }
}
```

**Códigos de Estado:**
- `200` - Reemplazo encontrado
- `401` - No autenticado
- `404` - Reemplazo no existe
- `500` - Error del servidor

---

### 5.4 Obtener Mis Reemplazos

**Endpoint:** `GET /api/reemplazos/mis-reemplazos`

**URL Completa:**
```
http://localhost:3000/api/reemplazos/mis-reemplazos
```

**Método:** `GET`

**Headers:**
```http
Authorization: Bearer {token}
```

**Roles Permitidos:** Todos

**Comportamiento:**
Retorna reemplazos donde el usuario autenticado es el reemplazo.

**Ejemplo con curl:**
```bash
curl -X GET http://localhost:3000/api/reemplazos/mis-reemplazos \
  -H "Authorization: Bearer {token_colaborador}"
```

**Respuesta Exitosa (200 OK):**
```json
{
  "success": true,
  "message": "Tus reemplazos obtenidos",
  "data": [
    {
      "id": 1,
      "incapacidad_id": 1,
      "colaborador_original": "Colaborador 1",
      "fecha_inicio": "2026-01-20",
      "fecha_fin": null,
      "estado": "activo",
      "diagnostico": "Gripe viral aguda",
      "observaciones": "Reemplazo temporal"
    }
  ]
}
```

**Códigos de Estado:**
- `200` - Reemplazos obtenidos (puede ser array vacío)
- `401` - No autenticado
- `500` - Error del servidor

**Uso Típico:**
Que un colaborador vea qué compañeros está reemplazando actualmente.

---

### 5.5 Reemplazos por Incapacidad

**Endpoint:** `GET /api/reemplazos/incapacidad/:id`

**URL Completa:**
```
http://localhost:3000/api/reemplazos/incapacidad/1
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
curl -X GET http://localhost:3000/api/reemplazos/incapacidad/1 \
  -H "Authorization: Bearer {token}"
```

**Respuesta Exitosa (200 OK):**
```json
{
  "success": true,
  "message": "Reemplazos obtenidos",
  "data": [
    {
      "id": 1,
      "colaborador_reemplazo": "Colaborador 2",
      "fecha_inicio": "2026-01-20",
      "fecha_fin": null,
      "estado": "activo"
    }
  ]
}
```

**Códigos de Estado:**
- `200` - Reemplazos obtenidos
- `401` - No autenticado
- `404` - Incapacidad no existe
- `500` - Error del servidor

---

### 5.6 Estadísticas de Reemplazos

**Endpoint:** `GET /api/reemplazos/estadisticas`

**URL Completa:**
```
http://localhost:3000/api/reemplazos/estadisticas
```

**Método:** `GET`

**Headers:**
```http
Authorization: Bearer {token}
```

**Roles Permitidos:** `gh`, `conta`, `lider`

**Ejemplo con curl:**
```bash
curl -X GET http://localhost:3000/api/reemplazos/estadisticas \
  -H "Authorization: Bearer {token}"
```

**Respuesta Exitosa (200 OK):**
```json
{
  "success": true,
  "message": "Estadísticas obtenidas",
  "data": {
    "total_reemplazos": 25,
    "activos": 8,
    "finalizados": 15,
    "cancelados": 2,
    "colaborador_mas_reemplazado": {
      "id": 4,
      "nombre": "Colaborador 1",
      "veces": 5
    },
    "colaborador_que_mas_reemplaza": {
      "id": 5,
      "nombre": "Colaborador 2",
      "veces": 7
    }
  }
}
```

**Códigos de Estado:**
- `200` - Estadísticas obtenidas
- `401` - No autenticado
- `403` - Sin permisos
- `500` - Error del servidor

---

### 5.7 Finalizar Reemplazo

**Endpoint:** `PUT /api/reemplazos/:id/finalizar`

**URL Completa:**
```
http://localhost:3000/api/reemplazos/1/finalizar
```

**Método:** `PUT`

**Headers:**
```http
Authorization: Bearer {token}
```

**Roles Permitidos:** `lider`

**Parámetros URL:**
- `id` - ID del reemplazo

**Body:** Ninguno (fecha_fin se asigna automáticamente)

**Ejemplo con curl:**
```bash
curl -X PUT http://localhost:3000/api/reemplazos/1/finalizar \
  -H "Authorization: Bearer {token_lider}"
```

**Respuesta Exitosa (200 OK):**
```json
{
  "success": true,
  "message": "Reemplazo finalizado exitosamente",
  "data": {
    "id": 1,
    "estado": "finalizado",
    "fecha_fin": "2025-11-20",
    "updated_at": "2025-11-20T15:00:00.000Z"
  }
}
```

**Códigos de Estado:**
- `200` - Reemplazo finalizado
- `400` - Reemplazo ya finalizado
- `401` - No autenticado
- `403` - Sin permisos (solo Líder)
- `404` - Reemplazo no encontrado
- `500` - Error del servidor

---

### 5.8 Cancelar Reemplazo

**Endpoint:** `PUT /api/reemplazos/:id/cancelar`

**URL Completa:**
```
http://localhost:3000/api/reemplazos/1/cancelar
```

**Método:** `PUT`

**Headers:**
```http
Content-Type: application/json
Authorization: Bearer {token}
```

**Roles Permitidos:** `lider`

**Body (JSON):**
```json
{
  "motivo": "Cancelado por regreso anticipado del titular"
}
```

**Ejemplo con curl:**
```bash
curl -X PUT http://localhost:3000/api/reemplazos/1/cancelar \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token_lider}" \
  -d '{"motivo": "Regreso anticipado"}'
```

**Respuesta Exitosa (200 OK):**
```json
{
  "success": true,
  "message": "Reemplazo cancelado exitosamente",
  "data": {
    "id": 1,
    "estado": "cancelado",
    "observaciones": "Cancelado por regreso anticipado del titular",
    "updated_at": "2025-11-20T15:30:00.000Z"
  }
}
```

**Códigos de Estado:**
- `200` - Reemplazo cancelado
- `400` - Reemplazo ya finalizado/cancelado
- `401` - No autenticado
- `403` - Sin permisos (solo Líder)
- `404` - Reemplazo no encontrado
- `500` - Error del servidor

---

## 👥 MÓDULO 6: GESTIÓN DE USUARIOS

### 6.1 Listar Usuarios

**Endpoint:** `GET /api/usuarios`

**URL Completa:**
```
http://localhost:3000/api/usuarios
```

**Método:** `GET`

**Headers:**
```http
Authorization: Bearer {token}
```

**Roles Permitidos:** `gh`, `conta`

**Ejemplo con curl:**
```bash
curl -X GET http://localhost:3000/api/usuarios \
  -H "Authorization: Bearer {token_gh}"
```

**Respuesta Exitosa (200 OK):**
```json
{
  "success": true,
  "message": "Usuarios obtenidos",
  "data": [
    {
      "id": 1,
      "nombre": "Gestión Humana",
      "email": "gh@kare.com",
      "rol": "gh",
      "salario_base": null,
      "ibc": null,
      "created_at": "2025-11-19T20:00:00.000Z"
    },
    {
      "id": 2,
      "nombre": "Contabilidad",
      "email": "conta@kare.com",
      "rol": "conta",
      "salario_base": null,
      "ibc": null,
      "created_at": "2025-11-19T20:00:00.000Z"
    },
    {
      "id": 3,
      "nombre": "Líder 1",
      "email": "lider1@kare.com",
      "rol": "lider",
      "salario_base": "4500000.00",
      "ibc": "4500000.00",
      "created_at": "2025-11-19T20:00:00.000Z"
    },
    {
      "id": 4,
      "nombre": "Colaborador 1",
      "email": "colab1@kare.com",
      "rol": "colaborador",
      "salario_base": "3000000.00",
      "ibc": "3000000.00",
      "created_at": "2025-11-19T20:00:00.000Z"
    }
  ]
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
- `200` - Usuarios obtenidos
- `401` - No autenticado
- `403` - Sin permisos (solo GH/Conta)
- `500` - Error del servidor

---

### 6.2 Actualizar Usuario

**Endpoint:** `PUT /api/usuarios/:id`

**URL Completa:**
```
http://localhost:3000/api/usuarios/4
```

**Método:** `PUT`

**Headers:**
```http
Content-Type: application/json
Authorization: Bearer {token}
```

**Roles Permitidos:** `gh`

**Body (JSON):**
```json
{
  "nombre": "Colaborador 1 Actualizado",
  "salario_base": "3500000",
  "ibc": "3500000",
  "rol": "lider"
}
```

**Ejemplo con curl:**
```bash
curl -X PUT http://localhost:3000/api/usuarios/4 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token_gh}" \
  -d '{
    "nombre": "Colaborador 1 Actualizado",
    "salario_base": "3500000",
    "ibc": "3500000"
  }'
```

**Respuesta Exitosa (200 OK):**
```json
{
  "success": true,
  "message": "Usuario actualizado exitosamente",
  "data": {
    "id": 4,
    "nombre": "Colaborador 1 Actualizado",
    "email": "colab1@kare.com",
    "rol": "lider",
    "salario_base": "3500000.00",
    "ibc": "3500000.00",
    "updated_at": "2025-11-20T16:00:00.000Z"
  }
}
```

**Códigos de Estado:**
- `200` - Usuario actualizado
- `400` - Datos inválidos
- `401` - No autenticado
- `403` - Sin permisos (solo GH)
- `404` - Usuario no encontrado
- `500` - Error del servidor

**Campos Actualizables:**
- `nombre` - Nombre del usuario
- `salario_base` - Salario base
- `ibc` - Ingreso Base de Cotización
- `rol` - Rol del usuario

**⚠️ NOTA:** El email no se puede actualizar por seguridad.

---

## ❤️ MÓDULO 7: HEALTH CHECK

### 7.1 Verificar Estado del Servidor

**Endpoint:** `GET /api/health`

**URL Completa:**
```
http://localhost:3000/api/health
```

**Método:** `GET`

**Headers:** Ninguno (público)

**Ejemplo con curl:**
```bash
curl -X GET http://localhost:3000/api/health
```

**Ejemplo con JavaScript:**
```javascript
const response = await fetch('http://localhost:3000/api/health');
const data = await response.json();
console.log('Servidor:', data.data.status);
```

**Respuesta Exitosa (200 OK):**
```json
{
  "success": true,
  "message": "Sistema KARE funcionando correctamente",
  "data": {
    "status": "OK",
    "timestamp": "2025-11-20T16:30:00.000Z",
    "uptime": 3600,
    "version": "1.0.0"
  }
}
```

**Códigos de Estado:**
- `200` - Servidor funcionando correctamente
- `500` - Error del servidor

**Uso Típico:**
- Monitoreo de disponibilidad
- Health checks en CI/CD
- Verificar antes de ejecutar tests

---

## 🎯 CASOS DE USO COMPLETOS

### Caso 1: Flujo Completo de Incapacidad (E2E)

**Participantes:**
- **Colaborador:** Juan (id: 4)
- **GH:** Ana (id: 1)
- **Contabilidad:** Roberto (id: 2)
- **Líder:** Carlos (id: 3)

**📊 Diagrama de Flujo:**

```
Paso 1: Juan reporta incapacidad
   ↓
Paso 2: Ana (GH) revisa documentación
   ↓
Paso 3: Ana valida incapacidad
   ↓
Paso 4: Roberto (Conta) crea conciliación
   ↓
Paso 5: Carlos (Líder) asigna reemplazo
   ↓
Paso 6: Roberto registra pago
```

**Implementación Paso a Paso:**
- Colaborador (reporta)
- GH (valida)
- Conta (concilia)
- Líder (asigna reemplazo)

#### Paso 1: Colaborador Reporta Incapacidad

```bash
# Login colaborador
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "colab1@kare.com", "password": "123456"}'

# Respuesta: { "data": { "token": "token_colab" } }

# Crear incapacidad
curl -X POST http://localhost:3000/api/incapacidades \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer token_colab" \
  -d '{
    "tipo": "EPS",
    "fecha_inicio": "2026-01-20",
    "fecha_fin": "2026-01-25",
    "diagnostico": "Gripe viral",
    "ibc": "3000000"
  }'

# Respuesta: { "data": { "id": 1, "estado": "reportada" } }
```

#### Paso 2: GH Revisa Incapacidad

```bash
# Login GH
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "gh@kare.com", "password": "123456"}'

# Cambiar a en_revision
curl -X PUT http://localhost:3000/api/incapacidades/1/estado \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer token_gh" \
  -d '{
    "estado": "en_revision",
    "observaciones": "Revisando documentación"
  }'

# Validar incapacidad
curl -X PUT http://localhost:3000/api/incapacidades/1/estado \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer token_gh" \
  -d '{
    "estado": "validada",
    "observaciones": "Incapacidad validada correctamente"
  }'
```

#### Paso 3: Conta Crea Conciliación

```bash
# Login Conta
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "conta@kare.com", "password": "123456"}'

# Crear conciliación
curl -X POST http://localhost:3000/api/conciliaciones \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer token_conta" \
  -d '{
    "incapacidad_id": 1,
    "ibc": "3000000"
  }'

# Respuesta: {
#   "data": {
#     "total": "400010.00",
#     "dias_empresa": 2,
#     "monto_empresa": "200000.00",
#     "dias_eps": 3,
#     "monto_eps": "200010.00"
#   }
# }
```

#### Paso 4: Líder Asigna Reemplazo

```bash
# Login Líder
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "lider1@kare.com", "password": "123456"}'

# Crear reemplazo
curl -X POST http://localhost:3000/api/reemplazos \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer token_lider" \
  -d '{
    "incapacidad_id": 1,
    "colaborador_reemplazo_id": 5,
    "observaciones": "Reemplazo temporal"
  }'

# Respuesta: { "data": { "id": 1, "estado": "activo" } }
```

#### Paso 5: GH Marca Como Pagada

```bash
# Marcar como pagada
curl -X PUT http://localhost:3000/api/incapacidades/1/estado \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer token_gh" \
  -d '{
    "estado": "pagada",
    "observaciones": "Pago realizado exitosamente"
  }'
```

#### Paso 6: Colaborador Ve Notificaciones

```bash
# Ver notificaciones
curl -X GET http://localhost:3000/api/notificaciones \
  -H "Authorization: Bearer token_colab"

# Respuesta: [
#   { "mensaje": "Tu incapacidad ha cambiado a estado: en_revision" },
#   { "mensaje": "Tu incapacidad ha cambiado a estado: validada" },
#   { "mensaje": "Se ha creado una conciliación para tu incapacidad" },
#   { "mensaje": "Tu incapacidad ha cambiado a estado: pagada" }
# ]
```

---

### Caso 2: Consulta de Estadísticas (Dashboard)

```javascript
// Login GH
const loginRes = await fetch('http://localhost:3000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'gh@kare.com',
    password: '123456'
  })
});
const { data: { token } } = await loginRes.json();

// Obtener todas las incapacidades
const incapRes = await fetch('http://localhost:3000/api/incapacidades', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const incapacidades = await incapRes.json();

// Obtener estadísticas de conciliaciones
const concilRes = await fetch('http://localhost:3000/api/conciliaciones/estadisticas', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const stats = await concilRes.json();

// Obtener estadísticas de reemplazos
const reempRes = await fetch('http://localhost:3000/api/reemplazos/estadisticas', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const statsReemp = await reempRes.json();

console.log('Dashboard:', {
  total_incapacidades: incapacidades.data.length,
  monto_total_conciliaciones: stats.data.total_monto,
  reemplazos_activos: statsReemp.data.activos
});
```

---

## 📊 CÓDIGOS DE ESTADO HTTP

### Códigos de Éxito (2xx)

| Código | Significado | Cuándo se usa |
|--------|-------------|---------------|
| 200 | OK | Operación exitosa (GET, PUT, DELETE) |
| 201 | Created | Recurso creado (POST) |

### Códigos de Error del Cliente (4xx)

| Código | Significado | Cuándo se usa |
|--------|-------------|---------------|
| 400 | Bad Request | Datos inválidos o faltantes |
| 401 | Unauthorized | Token faltante, inválido o expirado |
| 403 | Forbidden | Sin permisos para la acción |
| 404 | Not Found | Recurso no encontrado |
| 413 | Payload Too Large | Request muy grande |

### Códigos de Error del Servidor (5xx)

| Código | Significado | Cuándo se usa |
|--------|-------------|---------------|
| 500 | Internal Server Error | Error no manejado del servidor |

---

## 🛠️ HERRAMIENTAS RECOMENDADAS

### 1. Postman

**Instalación:**
```
https://www.postman.com/downloads/
```

**Configuración:**
1. Crear Workspace "KARE"
2. Crear Collection "Endpoints KARE"
3. Agregar variable `baseURL`: `http://localhost:3000/api`
4. Agregar variable `token`: (se actualiza tras login)

**Ejemplo de Request en Postman:**
```
POST {{baseURL}}/auth/login
Body (JSON):
{
  "email": "gh@kare.com",
  "password": "123456"
}

Test Script:
pm.environment.set("token", pm.response.json().data.token);
```

### 2. Thunder Client (VS Code Extension)

**Instalación:**
```
code --install-extension rangav.vscode-thunder-client
```

**Ventajas:**
- Integrado en VS Code
- No requiere aplicación externa
- Sintaxis similar a Postman

### 3. curl (Terminal)

**Ventajas:**
- Pre-instalado en mayoría de sistemas
- Scripting fácil
- Ideal para CI/CD

**Tips:**
```bash
# Guardar token en variable
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"gh@kare.com","password":"123456"}' \
  | jq -r '.data.token')

# Usar token en siguiente request
curl -X GET http://localhost:3000/api/incapacidades \
  -H "Authorization: Bearer $TOKEN"
```

### 4. Fetch API (JavaScript/Browser)

**Ventajas:**
- Nativo en navegadores modernos
- Ideal para frontends React/Vue/Angular
- Promesas/async-await

**Ejemplo Helper:**
```javascript
class KareAPI {
  constructor(baseURL = 'http://localhost:3000/api') {
    this.baseURL = baseURL;
    this.token = null;
  }

  async login(email, password) {
    const res = await fetch(`${this.baseURL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    this.token = data.data.token;
    return data;
  }

  async get(endpoint) {
    const res = await fetch(`${this.baseURL}${endpoint}`, {
      headers: { 'Authorization': `Bearer ${this.token}` }
    });
    return res.json();
  }

  async post(endpoint, body) {
    const res = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`
      },
      body: JSON.stringify(body)
    });
    return res.json();
  }
}

// Uso
const api = new KareAPI();
await api.login('gh@kare.com', '123456');
const incapacidades = await api.get('/incapacidades');
```

---

## 📝 RESUMEN DE PERMISOS

| Endpoint | GH | Conta | Líder | Colab |
|----------|----|----|-------|-------|
| **Autenticación** |
| POST /auth/login | ✅ | ✅ | ✅ | ✅ |
| GET /auth/profile | ✅ | ✅ | ✅ | ✅ |
| **Incapacidades** |
| POST /incapacidades | ✅ | ✅ | ✅ | ✅ |
| GET /incapacidades | ✅ (todas) | ✅ (todas) | ✅ (equipo) | ✅ (propias) |
| PUT /incapacidades/:id/estado | ✅ | ✅ | ❌ | ❌ |
| **Notificaciones** |
| GET /notificaciones | ✅ | ✅ | ✅ | ✅ |
| PUT /notificaciones/:id/leer | ✅ | ✅ | ✅ | ✅ |
| **Conciliaciones** |
| POST /conciliaciones | ❌ | ✅ | ❌ | ❌ |
| GET /conciliaciones | ✅ | ✅ | ❌ | ❌ |
| GET /conciliaciones/estadisticas | ✅ | ✅ | ❌ | ❌ |
| **Reemplazos** |
| POST /reemplazos | ❌ | ❌ | ✅ | ❌ |
| GET /reemplazos | ✅ | ✅ | ✅ | ❌ |
| PUT /reemplazos/:id/finalizar | ❌ | ❌ | ✅ | ❌ |
| **Usuarios** |
| GET /usuarios | ✅ | ✅ | ❌ | ❌ |
| PUT /usuarios/:id | ✅ | ❌ | ❌ | ❌ |

---

**Sistema KARE - Guía de Endpoints Parte 2**  
**Versión:** 1.0.0  
**Fecha:** 19 de noviembre de 2025

**Ver también:** [USO_ENDPOINTS_PARTE1.md](USO_ENDPOINTS_PARTE1.md)

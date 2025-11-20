# 📎 GUÍA DE GESTIÓN DE DOCUMENTOS - SISTEMA KARE

**Versión:** 1.1.0  
**Fecha:** 20 de noviembre de 2025

---

## 📋 Índice

1. [Introducción](#introducción)
2. [Arquitectura de Almacenamiento](#arquitectura-de-almacenamiento)
3. [Endpoints Disponibles](#endpoints-disponibles)
4. [Ejemplos de Uso](#ejemplos-de-uso)
5. [Permisos y Seguridad](#permisos-y-seguridad)
6. [Troubleshooting](#troubleshooting)

---

## 📖 Introducción

El sistema KARE permite gestionar documentos relacionados con incapacidades laborales. Cada incapacidad puede tener un documento adjunto (PDF o imagen) que se almacena de forma segura y organizada.

### Características Principales

- ✅ **Subida de documentos** al crear la incapacidad
- ✅ **Actualización de documentos** después de creada
- ✅ **Descarga/visualización** de documentos
- ✅ **Organización por usuario** (cada usuario tiene su carpeta)
- ✅ **Validación OCR** automática (opcional)
- ✅ **Control de permisos** estricto
- ✅ **Formatos soportados**: PDF, JPG, JPEG, PNG
- ✅ **Tamaño máximo**: 5MB

---

## 🗂️ Arquitectura de Almacenamiento

### Estructura de Carpetas

```
src/uploads/
├── user_1/                    # Documentos del usuario con ID 1
│   ├── 1732112345-user1-documento1.pdf
│   └── 1732112346-user1-imagen.jpg
├── user_2/                    # Documentos del usuario con ID 2
│   └── 1732112347-user2-documento.pdf
├── user_3/
└── temp/                      # Archivos temporales (validaciones sin crear incapacidad)
    └── .gitkeep
```

### Nomenclatura de Archivos

Los archivos se guardan con el siguiente formato:
```
{timestamp}-user{userId}-{nombreOriginal}

Ejemplo: 1732112345-user3-certificado_medico.pdf
```

### Metadata de Documentos

En la base de datos (tabla `incapacidades`):
- **documento** (TEXT): Nombre del archivo guardado
- **usuario_id** (INTEGER): ID del propietario
- **created_at** (TIMESTAMP): Fecha de subida inicial
- **updated_at** (TIMESTAMP): Última actualización

---

## 🔌 Endpoints Disponibles

### 1. Crear Incapacidad con Documento

**Endpoint:** `POST /api/incapacidades`  
**Autenticación:** Requerida (JWT)  
**Content-Type:** `multipart/form-data`

**Parámetros:**

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| tipo | string | ✅ | EPS, ARL, Licencia_Maternidad, Licencia_Paternidad |
| fecha_inicio | date | ✅ | Fecha de inicio (YYYY-MM-DD) |
| fecha_fin | date | ✅ | Fecha de fin (YYYY-MM-DD) |
| dias | number | ❌ | Se calcula automáticamente |
| diagnostico | string | ❌ | Diagnóstico médico |
| observaciones | string | ❌ | Observaciones adicionales |
| **documento** | **file** | **❌** | **Archivo PDF/imagen (max 5MB)** |

**Ejemplo (JavaScript con FormData):**

```javascript
const formData = new FormData();
formData.append('tipo', 'EPS');
formData.append('fecha_inicio', '2025-11-21');
formData.append('fecha_fin', '2025-11-23');
formData.append('dias', 3);
formData.append('diagnostico', 'Gripe');
formData.append('documento', archivoFile); // File object del input

const response = await fetch('http://localhost:3000/api/incapacidades', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});

const data = await response.json();
console.log('Incapacidad creada:', data.data);
```

**Ejemplo (cURL):**

```bash
curl -X POST http://localhost:3000/api/incapacidades \
  -H "Authorization: Bearer TOKEN_AQUI" \
  -F "tipo=EPS" \
  -F "fecha_inicio=2025-11-21" \
  -F "fecha_fin=2025-11-23" \
  -F "dias=3" \
  -F "diagnostico=Gripe" \
  -F "documento=@/ruta/al/certificado.pdf"
```

**Respuesta Exitosa (201):**

```json
{
  "success": true,
  "message": "Incapacidad reportada exitosamente",
  "data": {
    "id": 1,
    "usuario_id": 3,
    "tipo": "EPS",
    "fecha_inicio": "2025-11-21",
    "fecha_fin": "2025-11-23",
    "dias_incapacidad": 3,
    "diagnostico": "Gripe",
    "documento": "1732112345-user3-certificado.pdf",
    "estado": "reportada",
    "created_at": "2025-11-20T15:30:00.000Z"
  }
}
```

---

### 2. Subir/Actualizar Documento de Incapacidad Existente

**Endpoint:** `POST /api/incapacidades/:id/documento`  
**Autenticación:** Requerida (JWT)  
**Content-Type:** `multipart/form-data`  
**Permisos:** Propietario de la incapacidad o GH/Conta

**Parámetros:**

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| documento | file | ✅ | Archivo PDF/imagen (max 5MB) |

**Ejemplo (JavaScript):**

```javascript
const formData = new FormData();
formData.append('documento', archivoFile);

const response = await fetch(`http://localhost:3000/api/incapacidades/${incapacidadId}/documento`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});

const data = await response.json();
```

**Ejemplo (cURL):**

```bash
curl -X POST http://localhost:3000/api/incapacidades/1/documento \
  -H "Authorization: Bearer TOKEN_AQUI" \
  -F "documento=@/ruta/al/nuevo_certificado.pdf"
```

**Respuesta Exitosa (200):**

```json
{
  "success": true,
  "message": "Documento subido exitosamente",
  "data": {
    "incapacidad_id": 1,
    "documento": "1732112400-user3-nuevo_certificado.pdf",
    "nombre_original": "nuevo_certificado.pdf",
    "tamaño": 245678,
    "tipo": "application/pdf"
  }
}
```

---

### 3. Obtener/Descargar Documento de Incapacidad

**Endpoint:** `GET /api/incapacidades/:id/documento`  
**Autenticación:** Requerida (JWT)  
**Permisos:** Propietario de la incapacidad o GH/Conta

**Parámetros:** Ninguno (solo el ID en la URL)

**Ejemplo (JavaScript - Descargar):**

```javascript
const response = await fetch(`http://localhost:3000/api/incapacidades/${incapacidadId}/documento`, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

if (response.ok) {
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'documento_incapacidad.pdf';
  a.click();
}
```

**Ejemplo (JavaScript - Mostrar en iframe):**

```javascript
const response = await fetch(`http://localhost:3000/api/incapacidades/${incapacidadId}/documento`, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

if (response.ok) {
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  document.getElementById('pdfViewer').src = url;
}
```

**Ejemplo (cURL - Descargar):**

```bash
curl -X GET http://localhost:3000/api/incapacidades/1/documento \
  -H "Authorization: Bearer TOKEN_AQUI" \
  --output documento.pdf
```

**Respuesta Exitosa (200):**

Retorna el archivo directamente con headers:
```
Content-Type: application/pdf (o image/jpeg, image/png)
Content-Disposition: inline; filename="1732112345-user3-certificado.pdf"
Content-Length: 245678
```

**Respuesta Error (404):**

```json
{
  "success": false,
  "message": "Esta incapacidad no tiene documento adjunto",
  "data": null
}
```

---

### 4. Obtener Incapacidad por ID

**Endpoint:** `GET /api/incapacidades/:id`  
**Autenticación:** Requerida (JWT)  
**Permisos:** Propietario de la incapacidad o GH/Conta

**Ejemplo:**

```javascript
const response = await fetch(`http://localhost:3000/api/incapacidades/${incapacidadId}`, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const data = await response.json();
console.log('Incapacidad:', data.data);
console.log('Tiene documento:', !!data.data.documento);
```

**Respuesta Exitosa (200):**

```json
{
  "success": true,
  "message": "Incapacidad obtenida",
  "data": {
    "id": 1,
    "usuario_id": 3,
    "tipo": "EPS",
    "fecha_inicio": "2025-11-21",
    "fecha_fin": "2025-11-23",
    "dias_incapacidad": 3,
    "diagnostico": "Gripe",
    "documento": "1732112345-user3-certificado.pdf",
    "estado": "reportada",
    "created_at": "2025-11-20T15:30:00.000Z",
    "updated_at": "2025-11-20T15:30:00.000Z"
  }
}
```

---

## 🔒 Permisos y Seguridad

### Matriz de Permisos

| Acción | Colaborador (Propietario) | Colaborador (No Propietario) | GH | Conta | Líder |
|--------|:-------------------------:|:---------------------------:|:--:|:-----:|:-----:|
| **Crear incapacidad con documento** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Ver documento propio** | ✅ | ❌ | ✅ | ✅ | ❌ |
| **Ver documento de otro** | ❌ | ❌ | ✅ | ✅ | ❌ |
| **Subir/actualizar documento propio** | ✅ | ❌ | ✅ | ✅ | ❌ |
| **Subir/actualizar documento de otro** | ❌ | ❌ | ✅ | ✅ | ❌ |

### Validaciones de Seguridad

1. **Autenticación JWT:** Todos los endpoints requieren token válido
2. **Validación de propietario:** Solo el dueño o GH/Conta pueden acceder
3. **Tipos de archivo:** Solo PDF, JPG, JPEG, PNG
4. **Tamaño máximo:** 5MB por archivo
5. **Sanitización de nombres:** Caracteres especiales se reemplazan por `_`
6. **Prevención de path traversal:** Nombres de archivo son sanitizados

---

## 🎨 Ejemplos de Integración Frontend

### React - Componente de Subida

```jsx
import { useState } from 'react';

function SubirDocumento({ incapacidadId, token }) {
  const [archivo, setArchivo] = useState(null);
  const [cargando, setCargando] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!archivo) return;

    setCargando(true);
    const formData = new FormData();
    formData.append('documento', archivo);

    try {
      const response = await fetch(
        `http://localhost:3000/api/incapacidades/${incapacidadId}/documento`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        }
      );

      const data = await response.json();
      
      if (data.success) {
        alert('Documento subido exitosamente');
      } else {
        alert('Error: ' + data.message);
      }
    } catch (error) {
      alert('Error al subir documento');
    } finally {
      setCargando(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        onChange={(e) => setArchivo(e.target.files[0])}
      />
      <button type="submit" disabled={!archivo || cargando}>
        {cargando ? 'Subiendo...' : 'Subir Documento'}
      </button>
    </form>
  );
}
```

### Vue 3 - Composable para Documentos

```javascript
// useDocumentos.js
import { ref } from 'vue';

export function useDocumentos(token) {
  const cargando = ref(false);
  const error = ref(null);

  const subirDocumento = async (incapacidadId, archivo) => {
    cargando.value = true;
    error.value = null;

    const formData = new FormData();
    formData.append('documento', archivo);

    try {
      const response = await fetch(
        `http://localhost:3000/api/incapacidades/${incapacidadId}/documento`,
        {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token.value}` },
          body: formData
        }
      );

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message);
      }

      return data.data;
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      cargando.value = false;
    }
  };

  const descargarDocumento = async (incapacidadId) => {
    try {
      const response = await fetch(
        `http://localhost:3000/api/incapacidades/${incapacidadId}/documento`,
        {
          headers: { 'Authorization': `Bearer ${token.value}` }
        }
      );

      if (!response.ok) throw new Error('Error al descargar');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `documento_incapacidad_${incapacidadId}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      error.value = err.message;
      throw err;
    }
  };

  return {
    cargando,
    error,
    subirDocumento,
    descargarDocumento
  };
}
```

---

## 🛠️ Troubleshooting

### Error: "Tipo de archivo no permitido"

**Causa:** El archivo no es PDF, JPG, JPEG o PNG

**Solución:** Verifica el formato del archivo:
```javascript
const formatosPermitidos = ['application/pdf', 'image/jpeg', 'image/png'];
if (!formatosPermitidos.includes(archivo.type)) {
  alert('Solo se permiten archivos PDF o imágenes JPG/PNG');
}
```

### Error: "File too large"

**Causa:** El archivo supera los 5MB

**Solución:** Valida el tamaño antes de subir:
```javascript
const MAX_SIZE = 5 * 1024 * 1024; // 5MB
if (archivo.size > MAX_SIZE) {
  alert('El archivo no debe superar los 5MB');
}
```

### Error 403: "No tienes permiso"

**Causa:** Intentas acceder a un documento de otra persona sin ser GH/Conta

**Solución:** Verifica que estás accediendo a tus propias incapacidades

### Error 404: "Documento no encontrado"

**Causa:** El documento fue eliminado o nunca se subió

**Solución:** Verifica primero si la incapacidad tiene documento:
```javascript
const incap = await fetch(`/api/incapacidades/${id}`).then(r => r.json());
if (incap.data.documento) {
  // Tiene documento, seguro descargar
}
```

### Documento no se visualiza en el navegador

**Causa:** Content-Type incorrecto o CORS

**Solución:** El backend ya configura los headers correctos. Si persiste:
1. Verifica que el token JWT es válido
2. Usa `blob` response type en Axios:
```javascript
const response = await axios.get(url, {
  responseType: 'blob',
  headers: { 'Authorization': `Bearer ${token}` }
});
```

---

## 📊 Estadísticas de Almacenamiento

Para obtener información sobre documentos almacenados (solo GH):

```javascript
// Endpoint personalizado (a implementar si se requiere)
GET /api/admin/documentos/estadisticas

Respuesta:
{
  "total_documentos": 245,
  "tamaño_total_mb": 1234.5,
  "por_usuario": [
    { "usuario_id": 1, "documentos": 15, "tamaño_mb": 78.3 },
    { "usuario_id": 2, "documentos": 8, "tamaño_mb": 45.2 }
  ],
  "por_tipo": {
    "pdf": 200,
    "jpg": 30,
    "png": 15
  }
}
```

---

## 🔄 Migración de Documentos Antiguos

Si tienes documentos en la carpeta raíz de `uploads/`, el sistema los detecta automáticamente:

```javascript
// El método obtenerDocumento busca en:
1. uploads/user_{usuario_id}/archivo.pdf    // Preferido
2. uploads/archivo.pdf                       // Fallback antiguo
3. uploads/temp/archivo.pdf                  // Temporal
```

Para migrar documentos manualmente:

```bash
# PowerShell
Get-ChildItem src/uploads/*.pdf | ForEach-Object {
  $usuarioId = (Select-String -Path "src/db/kare.db" -Pattern $_.Name).Line
  Move-Item $_.FullName "src/uploads/user_$usuarioId/"
}
```

---

**Sistema KARE v1.1.0** 📎  
**Gestión de Documentos Implementada:** ✅  
**Fecha:** 20 de noviembre de 2025

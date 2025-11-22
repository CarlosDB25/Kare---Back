# 🔌 GUÍA DE INTEGRACIÓN - Conectar tu Frontend con el Backend KARE

**Versión:** 1.1.0  
**Fecha:** 22 de noviembre de 2025  
**Última actualización:** Noviembre 2025  
**Audiencia:** Desarrollador Frontend que ya tiene su UI construida

---

## 📋 ÍNDICE

1. [Prerequisitos](#prerequisitos)
2. [Configuración Inicial](#configuración-inicial)
3. [Integración de Autenticación](#integración-de-autenticación)
4. [Integración de Endpoints por Módulo](#integración-de-endpoints-por-módulo)
5. [Manejo de Errores del Backend](#manejo-de-errores-del-backend)
6. [Testing de la Integración](#testing-de-la-integración)
7. [Troubleshooting](#troubleshooting)

---

## ✅ PREREQUISITOS

### Lo que necesitas tener listo

- [ ] Tu frontend funcionando (React, Vue, Angular, etc.)
- [ ] Backend KARE corriendo en `http://localhost:3000`
- [ ] Conocimiento básico de HTTP requests (fetch o axios)
- [ ] Acceso a las credenciales de prueba

### Verificar que el backend esté corriendo

```bash
# En una terminal separada
cd Kare_main
npm run dev

# Verificar health check
curl http://localhost:3000/api/health
```

**Respuesta esperada:**
```json
{
  "success": true,
  "message": "Servidor funcionando correctamente",
  "data": {
    "status": "ok",
    "timestamp": "2025-11-19T10:30:00.000Z"
  }
}
```

---

## ⚙️ CONFIGURACIÓN INICIAL

### 1. Configurar URL Base del API

**Opción A: Variable de entorno (Recomendado)**

```javascript
// .env o .env.local
VITE_API_URL=http://localhost:3000/api
# o REACT_APP_API_URL para Create React App
# o NEXT_PUBLIC_API_URL para Next.js
```

```javascript
// config/api.js
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
```

**Opción B: Constante hardcodeada**

```javascript
// config/constants.js
export const API_URL = 'http://localhost:3000/api';
```

### 2. Configurar Cliente HTTP

**Si usas Fetch (nativo):**

```javascript
// services/api.js
const API_URL = 'http://localhost:3000/api';

export const apiClient = {
  async request(endpoint, options = {}) {
    const url = `${API_URL}${endpoint}`;
    const token = localStorage.getItem('token');
    
    const config = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();
      
      if (!response.ok) {
        throw { status: response.status, data };
      }
      
      return data;
    } catch (error) {
      throw error;
    }
  },

  get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  },

  post(endpoint, body) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  put(endpoint, body) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  },

  delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  },
};
```

**Si usas Axios:**

```bash
npm install axios
```

```javascript
// services/api.js
import axios from 'axios';

const API_URL = 'http://localhost:3000/api';

const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor para manejar errores
apiClient.interceptors.response.use(
  (response) => response.data, // Retornar solo data
  (error) => {
    if (error.response?.status === 401) {
      // Token expirado
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error.response?.data || error.message);
  }
);

export default apiClient;
```

---

## 🔐 INTEGRACIÓN DE AUTENTICACIÓN

### Paso 1: Adaptar tu formulario de Login

**Tu código actual (ejemplo):**

```javascript
// LoginPage.jsx - ANTES
function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    // TODO: Conectar con backend
    console.log('Login:', email, password);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input type="email" value={email} onChange={e => setEmail(e.target.value)} />
      <input type="password" value={password} onChange={e => setPassword(e.target.value)} />
      <button type="submit">Iniciar Sesión</button>
    </form>
  );
}
```

**Integración con el backend:**

```javascript
// LoginPage.jsx - DESPUÉS
import { apiClient } from '../services/api';

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate(); // o tu método de navegación

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // ✅ LLAMADA AL BACKEND
      const response = await apiClient.post('/auth/login', {
        email,
        password
      });

      // ✅ GUARDAR TOKEN Y USUARIO
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));

      // ✅ REDIRIGIR SEGÚN ROL
      const rol = response.data.user.rol;
      switch (rol) {
        case 'gh':
          navigate('/dashboard/gh');
          break;
        case 'conta':
          navigate('/dashboard/contabilidad');
          break;
        case 'lider':
          navigate('/dashboard/lider');
          break;
        default:
          navigate('/dashboard');
      }
    } catch (err) {
      // ✅ MOSTRAR ERROR DEL BACKEND
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="error">{error}</div>}
      
      <input 
        type="email" 
        value={email} 
        onChange={e => setEmail(e.target.value)}
        placeholder="colab1@kare.com"
        required
      />
      <input 
        type="password" 
        value={password} 
        onChange={e => setPassword(e.target.value)}
        placeholder="123456"
        required
      />
      <button type="submit" disabled={loading}>
        {loading ? 'Iniciando...' : 'Iniciar Sesión'}
      </button>
    </form>
  );
}
```

### Paso 2: Proteger Rutas

**Si tu router NO está protegido:**

```javascript
// App.jsx - ANTES
<Routes>
  <Route path="/dashboard" element={<Dashboard />} />
  <Route path="/incapacidades" element={<Incapacidades />} />
</Routes>
```

**Agregar protección:**

```javascript
// App.jsx - DESPUÉS
function ProtectedRoute({ children, requiredRoles = [] }) {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRoles.length > 0 && !requiredRoles.includes(user.rol)) {
    return <div>❌ No tienes permisos para acceder aquí</div>;
  }

  return children;
}

// Uso:
<Routes>
  <Route path="/login" element={<Login />} />
  
  <Route path="/dashboard" element={
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  } />
  
  <Route path="/usuarios" element={
    <ProtectedRoute requiredRoles={['gh']}>
      <Usuarios />
    </ProtectedRoute>
  } />
</Routes>
```

### Paso 3: Obtener Perfil del Usuario

**Si necesitas verificar el usuario autenticado:**

```javascript
// Agregar a tu código existente
import { apiClient } from '../services/api';

useEffect(() => {
  const verificarUsuario = async () => {
    try {
      const response = await apiClient.get('/auth/profile');
      // Actualizar estado con datos del usuario
      setUsuario(response.data);
    } catch (error) {
      // Token inválido, redirigir a login
      localStorage.removeItem('token');
      navigate('/login');
    }
  };

  if (localStorage.getItem('token')) {
    verificarUsuario();
  }
}, []);
```

---

## 📡 INTEGRACIÓN DE ENDPOINTS POR MÓDULO

### Módulo 1: Incapacidades

**Crear servicio de incapacidades:**

```javascript
// services/incapacidades.service.js
import { apiClient } from './api';

export const incapacidadesService = {
  // Listar todas
  async getAll() {
    const response = await apiClient.get('/incapacidades');
    return response.data; // Array de incapacidades
  },

  // Obtener una por ID
  async getById(id) {
    const response = await apiClient.get(`/incapacidades/${id}`);
    return response.data;
  },

  // Crear nueva
  async create(incapacidad) {
    const response = await apiClient.post('/incapacidades', incapacidad);
    return response.data;
  },

  // Cambiar estado
  async cambiarEstado(id, nuevoEstado, observaciones) {
    const response = await apiClient.put(`/incapacidades/${id}/estado`, {
      nuevo_estado: nuevoEstado,
      observaciones
    });
    return response.data;
  },
};
```

**Integrar en tu componente de lista:**

```javascript
// components/IncapacidadesList.jsx - ANTES
function IncapacidadesList() {
  const [incapacidades, setIncapacidades] = useState([
    // Mock data
    { id: 1, tipo: 'EPS', estado: 'reportada' },
  ]);

  // No hay llamada al backend
}
```

**Después de integrar:**

```javascript
// components/IncapacidadesList.jsx - DESPUÉS
import { incapacidadesService } from '../services/incapacidades.service';

function IncapacidadesList() {
  const [incapacidades, setIncapacidades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    cargarIncapacidades();
  }, []);

  const cargarIncapacidades = async () => {
    try {
      setLoading(true);
      // ✅ LLAMADA AL BACKEND
      const data = await incapacidadesService.getAll();
      setIncapacidades(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Cargando...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      {incapacidades.map(inc => (
        <div key={inc.id}>
          <h3>{inc.tipo} - {inc.estado}</h3>
          <p>{inc.diagnostico}</p>
        </div>
      ))}
    </div>
  );
}
```

**Integrar formulario de creación:**

```javascript
// components/FormIncapacidad.jsx - ANTES
function FormIncapacidad() {
  const [formData, setFormData] = useState({
    tipo: 'EPS',
    fecha_inicio: '',
    fecha_fin: '',
    diagnostico: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Crear:', formData);
    // TODO: Enviar al backend
  };
}
```

**Después de integrar:**

```javascript
// components/FormIncapacidad.jsx - DESPUÉS
import { incapacidadesService } from '../services/incapacidades.service';

function FormIncapacidad({ onSuccess }) {
  const [formData, setFormData] = useState({
    tipo: 'EPS',
    fecha_inicio: '',
    fecha_fin: '',
    diagnostico: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // ✅ ENVIAR AL BACKEND
      const nuevaIncapacidad = await incapacidadesService.create(formData);
      
      // ✅ NOTIFICAR ÉXITO
      alert('✅ Incapacidad creada exitosamente');
      
      // ✅ LIMPIAR FORMULARIO
      setFormData({
        tipo: 'EPS',
        fecha_inicio: '',
        fecha_fin: '',
        diagnostico: ''
      });
      
      // ✅ CALLBACK (si existe)
      onSuccess?.(nuevaIncapacidad);
    } catch (err) {
      // ✅ MOSTRAR ERROR
      setError(err.message || 'Error al crear incapacidad');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="error">{error}</div>}
      
      {/* Tus campos existentes */}
      
      <button type="submit" disabled={loading}>
        {loading ? 'Creando...' : 'Crear Incapacidad'}
      </button>
    </form>
  );
}
```

### Módulo 2: Notificaciones

**Crear servicio:**

```javascript
// services/notificaciones.service.js
import { apiClient } from './api';

export const notificacionesService = {
  async getAll() {
    const response = await apiClient.get('/notificaciones');
    return response.data;
  },

  async getNoLeidasCount() {
    const response = await apiClient.get('/notificaciones/no-leidas/count');
    return response.data.count;
  },

  async marcarLeida(id) {
    const response = await apiClient.put(`/notificaciones/${id}/leer`);
    return response.data;
  },

  async marcarTodasLeidas() {
    const response = await apiClient.put('/notificaciones/leer-todas');
    return response.data;
  },
};
```

**Integrar badge de notificaciones:**

```javascript
// components/NotificationBell.jsx - ANTES
function NotificationBell() {
  const [count, setCount] = useState(3); // Hardcodeado

  return (
    <button className="bell">
      🔔
      {count > 0 && <span className="badge">{count}</span>}
    </button>
  );
}
```

**Después de integrar:**

```javascript
// components/NotificationBell.jsx - DESPUÉS
import { notificacionesService } from '../services/notificaciones.service';

function NotificationBell() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    cargarContador();
    
    // ✅ POLLING cada 30 segundos
    const interval = setInterval(cargarContador, 30000);
    return () => clearInterval(interval);
  }, []);

  const cargarContador = async () => {
    try {
      // ✅ LLAMADA AL BACKEND
      const contador = await notificacionesService.getNoLeidasCount();
      setCount(contador);
    } catch (err) {
      console.error('Error cargando notificaciones:', err);
    }
  };

  return (
    <button className="bell" onClick={handleClick}>
      🔔
      {count > 0 && <span className="badge">{count}</span>}
    </button>
  );
}
```

### Módulo 3: Conciliaciones (Contabilidad)

**Crear servicio:**

```javascript
// services/conciliaciones.service.js
import { apiClient } from './api';

export const conciliacionesService = {
  async getAll() {
    const response = await apiClient.get('/conciliaciones');
    return response.data;
  },

  async create(conciliacion) {
    // El backend solo necesita incapacidad_id
    const response = await apiClient.post('/conciliaciones', {
      incapacidad_id: conciliacion.incapacidad_id
    });
    return response.data;
  },

  async actualizarEstadoPago(id, estadoPago, observaciones) {
    const response = await apiClient.put(`/conciliaciones/${id}`, {
      estado_pago: estadoPago,
      observaciones
    });
    return response.data;
  },

  async getEstadisticas() {
    const response = await apiClient.get('/conciliaciones/estadisticas');
    return response.data;
  },
};
```

**Integrar en componente:**

```javascript
// components/CrearConciliacion.jsx
import { conciliacionesService } from '../services/conciliaciones.service';

function CrearConciliacion({ incapacidadId }) {
  const [loading, setLoading] = useState(false);

  const handleCrear = async () => {
    setLoading(true);
    try {
      // ✅ BACKEND CALCULA TODO AUTOMÁTICAMENTE
      const conciliacion = await conciliacionesService.create({
        incapacidad_id: incapacidadId
      });
      
      alert(`✅ Conciliación creada: Total $${conciliacion.valor_total}`);
    } catch (err) {
      alert(`❌ Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button onClick={handleCrear} disabled={loading}>
      {loading ? 'Creando...' : 'Crear Conciliación'}
    </button>
  );
}
```

### Módulo 4: Reemplazos (Líderes)

**Crear servicio:**

```javascript
// services/reemplazos.service.js
import { apiClient } from './api';

export const reemplazosService = {
  async create(reemplazo) {
    const response = await apiClient.post('/reemplazos', reemplazo);
    return response.data;
  },

  async getMisReemplazos() {
    const response = await apiClient.get('/reemplazos/mis-reemplazos');
    return response.data;
  },

  async finalizar(id) {
    const response = await apiClient.put(`/reemplazos/${id}/finalizar`);
    return response.data;
  },
};
```

---

## 🚨 MANEJO DE ERRORES DEL BACKEND

### Estructura de Respuestas del Backend

**Respuesta exitosa:**
```json
{
  "success": true,
  "message": "Operación exitosa",
  "data": { ... }
}
```

**Respuesta con error:**
```json
{
  "success": false,
  "message": "Descripción del error",
  "data": null
}
```

### Adaptador de Errores

```javascript
// utils/errorHandler.js
export const handleBackendError = (error) => {
  // Error de red (backend no responde)
  if (!error.status) {
    return {
      titulo: 'Error de Conexión',
      mensaje: 'No se puede conectar con el servidor. Verifica que esté corriendo.',
      tipo: 'network'
    };
  }

  // Errores HTTP del backend
  switch (error.status) {
    case 400:
      return {
        titulo: 'Datos Inválidos',
        mensaje: error.data?.message || 'Los datos enviados no son válidos',
        tipo: 'validation'
      };

    case 401:
      localStorage.removeItem('token');
      window.location.href = '/login';
      return {
        titulo: 'Sesión Expirada',
        mensaje: 'Tu sesión ha expirado. Por favor inicia sesión nuevamente.',
        tipo: 'auth'
      };

    case 403:
      return {
        titulo: 'Sin Permisos',
        mensaje: 'No tienes permisos para realizar esta acción',
        tipo: 'permission'
      };

    case 404:
      return {
        titulo: 'No Encontrado',
        mensaje: error.data?.message || 'El recurso solicitado no existe',
        tipo: 'notfound'
      };

    case 500:
      return {
        titulo: 'Error del Servidor',
        mensaje: 'Ocurrió un error en el servidor. Intenta más tarde.',
        tipo: 'server'
      };

    default:
      return {
        titulo: 'Error',
        mensaje: error.data?.message || 'Ocurrió un error inesperado',
        tipo: 'unknown'
      };
  }
};
```

**Uso en componentes:**

```javascript
import { handleBackendError } from '../utils/errorHandler';

try {
  await incapacidadesService.create(formData);
} catch (error) {
  const errorInfo = handleBackendError(error);
  
  // Mostrar en tu UI
  setError(errorInfo.mensaje);
  // o
  showToast(errorInfo.titulo, errorInfo.mensaje, errorInfo.tipo);
}
```

---

## 🧪 TESTING DE LA INTEGRACIÓN

### Checklist de Integración

**1. Autenticación:**
```javascript
// Test manual
const testLogin = async () => {
  const response = await apiClient.post('/auth/login', {
    email: 'colab1@kare.com',
    password: '123456'
  });
  console.log('✅ Token recibido:', response.data.token);
};
```

**2. Endpoints protegidos:**
```javascript
// Test manual
const testProtectedEndpoint = async () => {
  // Sin token (debe fallar)
  localStorage.removeItem('token');
  try {
    await apiClient.get('/incapacidades');
    console.log('❌ NO debería permitir sin token');
  } catch (err) {
    console.log('✅ Rechazó correctamente sin token:', err.status === 401);
  }

  // Con token (debe funcionar)
  localStorage.setItem('token', 'tu-token-aqui');
  const response = await apiClient.get('/incapacidades');
  console.log('✅ Con token funcionó:', Array.isArray(response.data));
};
```

**3. Crear registro:**
```javascript
const testCrear = async () => {
  const nuevaIncapacidad = {
    tipo: 'EPS',
    fecha_inicio: '2025-11-20',
    fecha_fin: '2025-11-22',
    diagnostico: 'Test de integración'  // ⚠️ OBLIGATORIO (v1.1.0)
  };

  const response = await incapacidadesService.create(nuevaIncapacidad);
  console.log('✅ Incapacidad creada:', response);
};
```

**4. Manejo de errores:**
```javascript
const testErrores = async () => {
  try {
    // Intentar crear con datos inválidos
    await incapacidadesService.create({
      tipo: 'INVALIDO'
      // Faltan campos requeridos
    });
  } catch (err) {
    console.log('✅ Error capturado correctamente:', err.message);
  }
  
  try {
    // NUEVO (v1.1.0): Error si falta diagnóstico
    await incapacidadesService.create({
      tipo: 'EPS',
      fecha_inicio: '2025-11-20',
      fecha_fin: '2025-11-22'
      // diagnostico: '' ❌ Causará error 400
    });
  } catch (err) {
    console.log('✅ Error diagnóstico obligatorio:', err.message);
    // "El diagnostico es obligatorio"
  }
};
```

---

## 🔧 TROUBLESHOOTING

### Problema 1: CORS Error

**Error:**
```
Access to fetch at 'http://localhost:3000/api/auth/login' from origin 'http://localhost:5173' 
has been blocked by CORS policy
```

**Solución:**
El backend ya tiene CORS configurado. Verifica:

```javascript
// En tu frontend, asegúrate de usar la URL exacta
const API_URL = 'http://localhost:3000/api'; // ✅ CORRECTO
// NO uses http://127.0.0.1:3000 (diferente origen)
```

### Problema 2: Token no se envía

**Síntoma:** Siempre recibes 401 Unauthorized

**Solución:**

```javascript
// Verifica que el token esté guardado
console.log('Token:', localStorage.getItem('token'));

// Verifica que se envíe en el header
console.log('Headers:', {
  'Authorization': `Bearer ${localStorage.getItem('token')}`
});

// Formato correcto: "Bearer eyJhbGciOiJIUzI1..."
// NO: "eyJhbGciOiJIUzI1..." (falta "Bearer ")
```

### Problema 3: Fechas con timezone incorrecto

**Síntoma:** Las fechas se guardan un día antes/después

**Solución:**

```javascript
// Enviar fechas en formato YYYY-MM-DD (sin hora)
const formatearFecha = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Uso:
const formData = {
  fecha_inicio: formatearFecha(inputFechaInicio),
  fecha_fin: formatearFecha(inputFechaFin)
};
```

### Problema 4: "Cannot read property 'data' of undefined"

**Síntoma:** Error al acceder a response.data

**Solución:**

```javascript
// Siempre verifica que la respuesta exista
const cargarDatos = async () => {
  try {
    const response = await apiClient.get('/incapacidades');
    
    // ✅ Verificar estructura
    if (response && response.data) {
      setIncapacidades(response.data);
    }
  } catch (error) {
    console.error('Error:', error);
    setIncapacidades([]); // Valor por defecto
  }
};
```

### Problema 5: Backend no responde

**Verificación:**

```bash
# ¿Está corriendo el servidor?
# Terminal 1:
cd Kare_main
npm run dev

# ¿Responde el health check?
curl http://localhost:3000/api/health

# ¿Puerto correcto?
netstat -ano | findstr :3000
```

---

## 📋 CHECKLIST DE INTEGRACIÓN COMPLETA

### Configuración Base
- [ ] `API_URL` configurada correctamente
- [ ] Cliente HTTP configurado (fetch o axios)
- [ ] Interceptor de token agregado
- [ ] Interceptor de errores agregado

### Autenticación
- [ ] Login integrado con `/auth/login`
- [ ] Token guardado en localStorage
- [ ] Rutas protegidas implementadas
- [ ] Logout limpia localStorage

### Módulos
- [ ] Servicio de incapacidades creado
- [ ] Servicio de notificaciones creado
- [ ] Servicio de conciliaciones creado (si aplica)
- [ ] Servicio de reemplazos creado (si aplica)

### Componentes
- [ ] Formularios envían datos al backend
- [ ] Listas cargan datos del backend
- [ ] Estados de loading implementados
- [ ] Errores del backend se muestran al usuario

### Testing
- [ ] Login funciona con credenciales de prueba
- [ ] Crear registro funciona
- [ ] Listar registros funciona
- [ ] Manejo de errores funciona
- [ ] Token expirado redirige a login

---

## 🎯 EJEMPLO COMPLETO DE INTEGRACIÓN

**Archivo: `services/api.js`** (Cliente HTTP base)
```javascript
const API_URL = 'http://localhost:3000/api';

export const apiClient = {
  async request(endpoint, options = {}) {
    const url = `${API_URL}${endpoint}`;
    const token = localStorage.getItem('token');
    
    const config = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers,
      },
    };

    const response = await fetch(url, config);
    const data = await response.json();
    
    if (!response.ok) {
      throw { status: response.status, data };
    }
    
    return data;
  },

  get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  },

  post(endpoint, body) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  put(endpoint, body) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  },

  delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  },
};
```

**Archivo: `services/incapacidades.service.js`** (Servicio específico)
```javascript
import { apiClient } from './api';

export const incapacidadesService = {
  getAll: () => apiClient.get('/incapacidades').then(r => r.data),
  getById: (id) => apiClient.get(`/incapacidades/${id}`).then(r => r.data),
  create: (data) => apiClient.post('/incapacidades', data).then(r => r.data),
  cambiarEstado: (id, estado, obs) => 
    apiClient.put(`/incapacidades/${id}/estado`, { 
      nuevo_estado: estado, 
      observaciones: obs 
    }).then(r => r.data),
};
```

**Archivo: `pages/IncapacidadesPage.jsx`** (Uso en componente)
```javascript
import { useState, useEffect } from 'react';
import { incapacidadesService } from '../services/incapacidades.service';

function IncapacidadesPage() {
  const [incapacidades, setIncapacidades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    cargarIncapacidades();
  }, []);

  const cargarIncapacidades = async () => {
    try {
      setLoading(true);
      const data = await incapacidadesService.getAll();
      setIncapacidades(data);
    } catch (err) {
      setError(err.data?.message || 'Error al cargar');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Cargando...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h1>Incapacidades ({incapacidades.length})</h1>
      {incapacidades.map(inc => (
        <div key={inc.id}>
          <h3>{inc.tipo} - {inc.estado}</h3>
          <p>{inc.diagnostico}</p>
        </div>
      ))}
    </div>
  );
}
```

---

## 📚 RECURSOS DE REFERENCIA

### Documentación de Endpoints
- [USO_ENDPOINTS_PARTE1.md](USO_ENDPOINTS_PARTE1.md) - Auth, Incapacidades, Notificaciones
- [USO_ENDPOINTS_PARTE2.md](USO_ENDPOINTS_PARTE2.md) - Conciliaciones, Reemplazos, Usuarios

### Credenciales de Prueba
```javascript
// Para testing
const USUARIOS_PRUEBA = {
  gh: { email: 'gh@kare.com', password: '123456' },
  conta: { email: 'conta@kare.com', password: '123456' },
  lider: { email: 'lider1@kare.com', password: '123456' },
  colab: { email: 'colab1@kare.com', password: '123456' },
};
```

### Health Check
```javascript
// Verificar que el backend esté disponible
const verificarBackend = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/health');
    const data = await response.json();
    console.log('Backend status:', data.data.status); // "ok"
  } catch (error) {
    console.error('Backend no disponible');
  }
};
```

---

## 🚀 PRÓXIMOS PASOS

1. **Configurar cliente HTTP** (fetch o axios)
2. **Integrar login** en tu página de autenticación
3. **Crear servicios** para cada módulo que uses
4. **Adaptar componentes** para llamar a los servicios
5. **Implementar manejo de errores**
6. **Testing** con credenciales de prueba

---

**¡Éxito con la integración! 🔌**

Si tienes problemas específicos, consulta la sección de Troubleshooting o revisa los ejemplos de código completo.

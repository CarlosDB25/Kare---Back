# 🎨 GUÍA VISUAL DE INTERFAZ - SISTEMA KARE (PARTE 1)

**Versión:** 1.0.0  
**Fecha:** 20 de noviembre de 2025  
**Audiencia:** Desarrolladores Frontend, Diseñadores UI/UX

---

## 📋 ÍNDICE - PARTE 1

1. [Introducción](#introducción)
2. [Paleta de Colores y Diseño](#paleta-de-colores-y-diseño)
3. [Vista: Login](#vista-login)
4. [Vista: Dashboard Principal](#vista-dashboard-principal)
5. [Vista: Incapacidades - Lista](#vista-incapacidades---lista)
6. [Vista: Incapacidades - Crear/Reportar](#vista-incapacidades---crearreportar)
7. [Vista: Validación OCR de Documentos](#vista-validación-ocr-de-documentos)

**Continúa en:** [GUIA_VISUAL_INTERFAZ_PARTE2.md](GUIA_VISUAL_INTERFAZ_PARTE2.md)

---

## 🎯 INTRODUCCIÓN

Este documento presenta un **diseño completo de interfaz de usuario** para el Sistema KARE sin escribir código frontend. Incluye:

- ✅ Wireframes textuales de cada vista
- ✅ Elementos visuales (botones, formularios, tablas)
- ✅ Flujos de usuario por rol
- ✅ Integración con endpoints del backend
- ✅ Manejo de estados y errores
- ✅ Componentes reutilizables

### 🎨 Filosofía de Diseño

- **Minimalista:** Interfaz limpia, sin elementos innecesarios
- **Responsive:** Diseño adaptable a móvil, tablet y desktop
- **Accesible:** Contraste suficiente, textos legibles
- **Intuitiva:** Acciones claras, navegación obvia
- **Eficiente:** Mínimos clics para completar tareas

---

## 🎨 PALETA DE COLORES Y DISEÑO

### Colores Principales

```css
/* Colores del Sistema */
--primary: #2563eb;        /* Azul principal - Botones primarios */
--primary-hover: #1d4ed8;  /* Azul oscuro - Hover */
--secondary: #64748b;      /* Gris - Botones secundarios */
--success: #10b981;        /* Verde - Estados exitosos */
--warning: #f59e0b;        /* Naranja - Advertencias */
--danger: #ef4444;         /* Rojo - Errores/Rechazos */
--info: #3b82f6;           /* Azul claro - Información */

/* Estados de Incapacidad */
--estado-reportada: #f59e0b;    /* Naranja */
--estado-en-revision: #3b82f6;  /* Azul */
--estado-validada: #10b981;     /* Verde */
--estado-pagada: #059669;       /* Verde oscuro */
--estado-rechazada: #ef4444;    /* Rojo */

/* Fondos */
--bg-primary: #ffffff;     /* Blanco - Fondo principal */
--bg-secondary: #f8fafc;   /* Gris muy claro - Cards */
--bg-sidebar: #1e293b;     /* Gris oscuro - Sidebar */

/* Textos */
--text-primary: #0f172a;   /* Negro - Títulos */
--text-secondary: #64748b; /* Gris - Subtítulos */
--text-muted: #94a3b8;     /* Gris claro - Ayuda */
```

### Tipografía

```css
/* Fuentes */
--font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;

/* Tamaños */
--text-xs: 12px;    /* Textos muy pequeños */
--text-sm: 14px;    /* Textos pequeños */
--text-base: 16px;  /* Texto normal */
--text-lg: 18px;    /* Texto grande */
--text-xl: 20px;    /* Subtítulos */
--text-2xl: 24px;   /* Títulos */
--text-3xl: 30px;   /* Títulos principales */
```

### Espaciado

```css
/* Espacios */
--space-xs: 4px;
--space-sm: 8px;
--space-md: 16px;
--space-lg: 24px;
--space-xl: 32px;
```

---

## 🔐 VISTA: LOGIN

### Wireframe

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│                         [LOGO KARE]                         │
│                 Sistema de Gestión de Incapacidades         │
│                                                             │
│     ┌───────────────────────────────────────────────┐      │
│     │                                               │      │
│     │  Email:                                       │      │
│     │  ┌─────────────────────────────────────────┐ │      │
│     │  │ colab1@kare.com                         │ │      │
│     │  └─────────────────────────────────────────┘ │      │
│     │                                               │      │
│     │  Contraseña:                                  │      │
│     │  ┌─────────────────────────────────────────┐ │      │
│     │  │ ••••••                                  │ │      │
│     │  └─────────────────────────────────────────┘ │      │
│     │                                               │      │
│     │  [ ] Recordarme                               │      │
│     │                                               │      │
│     │       ┌─────────────────────────┐             │      │
│     │       │   Iniciar Sesión        │             │      │
│     │       └─────────────────────────┘             │      │
│     │                                               │      │
│     │       ¿Olvidaste tu contraseña?               │      │
│     │                                               │      │
│     └───────────────────────────────────────────────┘      │
│                                                             │
│              © 2025 KARE - Todos los derechos reservados   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Elementos

**1. Logo**
- Tamaño: 120x120px
- Posición: Centro superior
- Margen inferior: 24px

**2. Título**
- Texto: "Sistema de Gestión de Incapacidades"
- Tamaño: 18px
- Color: `--text-secondary`
- Margen inferior: 32px

**3. Card de Login**
- Ancho máximo: 400px
- Padding: 32px
- Border radius: 8px
- Box shadow: 0 4px 6px rgba(0,0,0,0.1)
- Fondo: `--bg-primary`

**4. Inputs**
- Alto: 44px
- Border: 1px solid #e2e8f0
- Border radius: 6px
- Padding: 12px 16px
- Font size: 16px
- Focus: Border azul (`--primary`)

**5. Botón "Iniciar Sesión"**
- Ancho: 100%
- Alto: 44px
- Background: `--primary`
- Color texto: blanco
- Border radius: 6px
- Hover: `--primary-hover`
- Loading: Spinner + "Iniciando..."

**6. Estados de Error**
```
┌─────────────────────────────────────────────┐
│ ⚠️ Email o contraseña incorrectos           │
└─────────────────────────────────────────────┘
```
- Fondo: #fef2f2 (rojo claro)
- Border: 1px solid #fca5a5
- Padding: 12px
- Border radius: 6px

### Endpoint Integrado

```javascript
// POST /api/auth/login
{
  email: "colab1@kare.com",
  password: "123456"
}

// Respuesta:
{
  success: true,
  data: {
    token: "eyJhbGciOiJIUzI1NiIs...",
    user: {
      id: 5,
      nombre: "Juan Pablo Martínez",
      email: "colab1@kare.com",
      rol: "colab"
    }
  }
}
```

### Flujo de Usuario

1. Usuario ingresa email y contraseña
2. Clic en "Iniciar Sesión"
3. **Loading:** Botón muestra spinner
4. **Éxito:** Guardar token → Redirigir a dashboard según rol
5. **Error:** Mostrar mensaje de error rojo

### Validaciones Frontend

- Email formato válido
- Contraseña no vacía
- Botón deshabilitado mientras carga

---

## 📊 VISTA: DASHBOARD PRINCIPAL

### Wireframe (Rol: GH - Gestor de RRHH)

```
┌──────┬──────────────────────────────────────────────────────────────────┐
│      │  [LOGO]  KARE - Dashboard                    🔔(5)  👤 Ana María │
│      ├──────────────────────────────────────────────────────────────────┤
│ 📊   │                                                                  │
│ Casa │  Estadísticas Generales                        📅 20 Nov 2025   │
│      │                                                                  │
│ 📄   │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐            │
│ Inca │  │   📋 Total   │ │ ⏳ Pendientes│ │ ✅ Validadas │            │
│      │  │      24      │ │      8       │ │      16      │            │
│ 🔔   │  └──────────────┘ └──────────────┘ └──────────────┘            │
│ Noti │                                                                  │
│      │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐            │
│ 💰   │  │ 💵 Por Pagar │ │ ✔️ Pagadas   │ │ 👥 Reemplazos│            │
│ Conc │  │  $2,450,000  │ │  $8,320,000  │ │      12      │            │
│      │  └──────────────┘ └──────────────┘ └──────────────┘            │
│ 👥   │                                                                  │
│ User │  ────────────────────────────────────────────────────────────── │
│      │                                                                  │
│ 🚪   │  Incapacidades Recientes                    [Ver todas →]      │
│ Sali │                                                                  │
│      │  ┌──────────────────────────────────────────────────────────┐   │
│      │  │ ID  │ Colaborador      │ Tipo │ Días │ Estado      │ 🔧 │   │
│      │  ├──────────────────────────────────────────────────────────┤   │
│      │  │ 144 │ Juan P. Martínez │ EPS  │  5   │ 🟡 Reportada│ ⚙️ │   │
│      │  │ 143 │ María González   │ ARL  │  10  │ 🔵 Revisión │ ⚙️ │   │
│      │  │ 142 │ Carlos Rodríguez │ EPS  │  3   │ 🟢 Validada │ ⚙️ │   │
│      │  └──────────────────────────────────────────────────────────┘   │
│      │                                                                  │
│      │  ────────────────────────────────────────────────────────────── │
│      │                                                                  │
│      │  Gráficos                                                        │
│      │                                                                  │
│      │  ┌─────────────────────┐  ┌─────────────────────┐              │
│      │  │ Tipos de Incapacidad│  │ Estados Actuales    │              │
│      │  │                     │  │                     │              │
│      │  │  EPS: 60%  ████████ │  │  Reportada: 33% ███ │              │
│      │  │  ARL: 25%  ████     │  │  Revisión:  25% ██  │              │
│      │  │  Lic:  15%  ██      │  │  Validada:  42% ████│              │
│      │  └─────────────────────┘  └─────────────────────┘              │
│      │                                                                  │
└──────┴──────────────────────────────────────────────────────────────────┘
```

### Elementos del Dashboard

**1. Header Superior**
- Logo + Título del sistema
- Badge de notificaciones: `🔔(5)` → Link a `/notificaciones`
- Avatar + Nombre usuario: `👤 Ana María` → Dropdown con Perfil/Cerrar Sesión

**2. Sidebar (Navegación)**

```
┌─────────────────┐
│ 📊 Dashboard    │  ← Activo (fondo azul)
│ 📄 Incapacidades│
│ 🔔 Notificaciones│
│ 💰 Conciliaciones│  ← Solo GH/Conta
│ 👥 Usuarios     │  ← Solo GH/Conta
│ 🚪 Cerrar Sesión│
└─────────────────┘
```

**Items del Sidebar:**
- Alto: 48px
- Padding: 12px 16px
- Hover: Fondo gris claro
- Activo: Fondo azul + texto blanco
- Iconos: 20x20px a la izquierda

**3. Cards de Estadísticas**
- Ancho: 31% (3 columnas con gap)
- Padding: 24px
- Border radius: 8px
- Box shadow: leve
- Número grande: 32px bold
- Etiqueta: 14px gris

**4. Tabla de Incapacidades Recientes**
- Ancho: 100%
- Filas: Hover con fondo gris claro
- Estados con badges de colores:
  - 🟡 Reportada (naranja)
  - 🔵 En Revisión (azul)
  - 🟢 Validada (verde)
  - ✅ Pagada (verde oscuro)
  - ❌ Rechazada (rojo)

**5. Botón de Acciones (⚙️)**
- Dropdown con:
  - Ver detalles
  - Cambiar estado
  - Ver documento
  - Editar

**6. Gráficos**
- Librería recomendada: Chart.js o Recharts
- Tipos: Barras horizontales o Pie charts
- Colores consistentes con paleta

### Endpoints Integrados

```javascript
// GET /api/incapacidades → Últimas 5
// GET /api/conciliaciones/estadisticas
// GET /api/reemplazos/estadisticas
// GET /api/notificaciones/no-leidas/count
```

### Variantes por Rol

**Colaborador:**
- Solo ve sus propias incapacidades
- Botón flotante: `+ Reportar Incapacidad`
- Sin acceso a Conciliaciones/Usuarios

**Líder:**
- Ve incapacidades de su área
- Acceso a Reemplazos
- Sin Conciliaciones

**Contabilidad:**
- Acceso a Conciliaciones
- Estadísticas financieras
- Sin Reemplazos

---

## 📄 VISTA: INCAPACIDADES - LISTA

### Wireframe

```
┌──────┬──────────────────────────────────────────────────────────────────┐
│      │  Gestión de Incapacidades                    🔔(3)  👤 Ana María │
│      ├──────────────────────────────────────────────────────────────────┤
│ Side │                                                                  │
│ bar  │  ┌────────────────────────────────────────────────────────────┐ │
│      │  │ 🔍 Buscar... [nombre, diagnóstico, ID]                     │ │
│      │  └────────────────────────────────────────────────────────────┘ │
│      │                                                                  │
│      │  Filtros:  [📅 Todas las fechas ▼] [📋 Todos los tipos ▼]      │
│      │            [🎯 Todos los estados ▼] [🧑 Todos usuarios ▼]       │
│      │                                                                  │
│      │                            [🔄 Limpiar] [+ Nueva Incapacidad]   │
│      │                                                                  │
│      │  ────────────────────────────────────────────────────────────── │
│      │                                                                  │
│      │  Mostrando 24 incapacidades                                     │
│      │                                                                  │
│      │  ┌──────────────────────────────────────────────────────────────┐│
│      │  │ID │Colaborador   │Tipo│Diagnóstico │Fechas     │Días│Estado││
│      │  ├──────────────────────────────────────────────────────────────┤│
│      │  │144│Juan Martínez │EPS │J06.9 IRA   │20-22 Nov  │ 3  │🟡 Rep││
│      │  │   │              │    │            │           │    │      ││
│      │  │   │ 📎 documento.pdf              [👁️ Ver] [✏️ Editar]     ││
│      │  ├──────────────────────────────────────────────────────────────┤│
│      │  │143│María Glez    │ARL │M79.3 Lumbal│18-27 Nov  │ 10 │🔵 Rev││
│      │  │   │              │    │            │           │    │      ││
│      │  │   │ 📎 incapacidad.jpg            [👁️ Ver] [✏️ Editar]     ││
│      │  ├──────────────────────────────────────────────────────────────┤│
│      │  │142│Carlos Rod.   │EPS │A09 Gastro  │15-17 Nov  │ 3  │🟢 Val││
│      │  │   │              │    │            │           │    │      ││
│      │  │   │ 📎 Sin documento              [📤 Subir] [✏️ Editar]    ││
│      │  └──────────────────────────────────────────────────────────────┘│
│      │                                                                  │
│      │  ◀ Anterior    [1] 2 3 4 5    Siguiente ▶                       │
│      │                                                                  │
└──────┴──────────────────────────────────────────────────────────────────┘
```

### Elementos

**1. Barra de Búsqueda**
- Ancho: 100%
- Alto: 44px
- Placeholder: "🔍 Buscar por nombre, diagnóstico o ID"
- Búsqueda en tiempo real (debounce 300ms)

**2. Filtros Dropdown**
```
Filtro de Tipo:
┌─────────────────┐
│ ✓ EPS           │
│ ✓ ARL           │
│   Licencia Mater│
│   Licencia Pater│
│   [Aplicar]     │
└─────────────────┘
```

**3. Botón "Nueva Incapacidad"**
- Color: `--primary`
- Icono: `+`
- Solo visible para: Colaborador, GH
- Acción: Modal o redirect a `/incapacidades/crear`

**4. Tabla Expandible**
- Fila principal: Datos básicos
- Fila expandida: Documento + acciones
- Hover: Fondo gris claro
- Click en fila: Expande/colapsa

**5. Estados con Badges**
```css
.badge-reportada { background: #fef3c7; color: #92400e; }
.badge-revision { background: #dbeafe; color: #1e40af; }
.badge-validada { background: #d1fae5; color: #065f46; }
.badge-pagada { background: #a7f3d0; color: #064e3b; }
.badge-rechazada { background: #fee2e2; color: #991b1b; }
```

**6. Acciones por Fila**
- 👁️ Ver detalles (modal)
- ✏️ Editar (solo propietario o GH)
- 📤 Subir documento
- 🗑️ Eliminar (solo si estado = reportada)

**7. Paginación**
- Items por página: 10
- Botones: ◀ Anterior, Números, Siguiente ▶
- Página activa: Fondo azul

### Endpoints Integrados

```javascript
// GET /api/incapacidades
// Query params: ?tipo=EPS&estado=reportada&page=1&limit=10

// Respuesta:
{
  success: true,
  data: [
    {
      id: 144,
      usuario: { nombre: "Juan Pablo Martínez" },
      tipo: "EPS",
      diagnostico: "J06.9 Infección Respiratoria Aguda",
      fecha_inicio: "2025-11-20",
      fecha_fin: "2025-11-22",
      dias_incapacidad: 3,
      estado: "reportada",
      documento: "documento.pdf"
    }
  ]
}
```

### Funcionalidades

**Búsqueda:**
```javascript
const handleBuscar = (termino) => {
  const filtrados = incapacidades.filter(inc =>
    inc.usuario.nombre.toLowerCase().includes(termino) ||
    inc.diagnostico.toLowerCase().includes(termino) ||
    inc.id.toString().includes(termino)
  );
  setIncapacidadesFiltradas(filtrados);
};
```

**Filtros Múltiples:**
```javascript
const aplicarFiltros = () => {
  let resultado = incapacidades;
  
  if (filtroTipo.length > 0) {
    resultado = resultado.filter(inc => filtroTipo.includes(inc.tipo));
  }
  
  if (filtroEstado.length > 0) {
    resultado = resultado.filter(inc => filtroEstado.includes(inc.estado));
  }
  
  setIncapacidadesFiltradas(resultado);
};
```

---

## ✍️ VISTA: INCAPACIDADES - CREAR/REPORTAR

### Wireframe

```
┌──────┬──────────────────────────────────────────────────────────────────┐
│      │  Reportar Nueva Incapacidad             🔔(3)  👤 Juan Martínez  │
│      ├──────────────────────────────────────────────────────────────────┤
│ Side │                                                                  │
│ bar  │  Paso 1 de 2: Subir Documento                                    │
│      │                                                                  │
│      │  ┌────────────────────────────────────────────────────────────┐ │
│      │  │                                                            │ │
│      │  │              📤                                            │ │
│      │  │                                                            │ │
│      │  │       Arrastra tu documento aquí                          │ │
│      │  │       o haz clic para seleccionar                         │ │
│      │  │                                                            │ │
│      │  │       Formatos: PDF, PNG, JPG, JPEG, WEBP                 │ │
│      │  │       Tamaño máximo: 5MB                                  │ │
│      │  │                                                            │ │
│      │  └────────────────────────────────────────────────────────────┘ │
│      │                                                                  │
│      │  ───── O COMPLETA MANUALMENTE ─────                             │
│      │                                                                  │
│      │  ┌─────────────────────────────────────────────────────────────┐│
│      │  │ Tipo de Incapacidad *                                       ││
│      │  │ ┌─────────────────────────────────────────────────────────┐ ││
│      │  │ │ EPS (Enfermedad General)                            ▼   │ ││
│      │  │ └─────────────────────────────────────────────────────────┘ ││
│      │  │                                                             ││
│      │  │ Diagnóstico *                                               ││
│      │  │ ┌─────────────────────────────────────────────────────────┐ ││
│      │  │ │ Ej: J06.9 Infección Respiratoria Aguda                  │ ││
│      │  │ └─────────────────────────────────────────────────────────┘ ││
│      │  │                                                             ││
│      │  │ Fecha de Inicio *        Fecha de Fin *                     ││
│      │  │ ┌──────────────────┐     ┌──────────────────┐              ││
│      │  │ │ 2025-11-20       │     │ 2025-11-22       │              ││
│      │  │ └──────────────────┘     └──────────────────┘              ││
│      │  │                                                             ││
│      │  │ Días calculados: 3 días                                     ││
│      │  │                                                             ││
│      │  │ Observaciones (opcional)                                    ││
│      │  │ ┌─────────────────────────────────────────────────────────┐ ││
│      │  │ │                                                         │ ││
│      │  │ │                                                         │ ││
│      │  │ └─────────────────────────────────────────────────────────┘ ││
│      │  │                                                             ││
│      │  │         [Cancelar]              [Crear Incapacidad]        ││
│      │  └─────────────────────────────────────────────────────────────┘│
│      │                                                                  │
└──────┴──────────────────────────────────────────────────────────────────┘
```

### Elementos

**1. Drag & Drop Zone**
```
┌─────────────────────────────────────┐
│                                     │
│          📤 Icono grande            │
│                                     │
│   Arrastra tu documento aquí        │
│   o haz clic para seleccionar       │
│                                     │
│   Formatos: PDF, PNG, JPG           │
│   Tamaño máximo: 5MB                │
│                                     │
└─────────────────────────────────────┘
```

- Border: 2px dashed `--primary`
- Padding: 48px
- Border radius: 8px
- Hover: Fondo azul muy claro
- Drag over: Border sólido azul

**2. Preview del Archivo**
```
┌─────────────────────────────────────┐
│ 📄 incapacidad.pdf    [❌ Eliminar] │
│ 352 KB                              │
│                                     │
│ ✅ Procesando con OCR...            │
│ [████████████░░░░░░░] 75%           │
└─────────────────────────────────────┘
```

**3. Select de Tipo**
```html
<select>
  <option>EPS (Enfermedad General)</option>
  <option>ARL (Accidente Laboral)</option>
  <option>Licencia de Maternidad</option>
  <option>Licencia de Paternidad</option>
</select>
```

**4. Input de Diagnóstico**
- Autocompletado con diagnósticos comunes
- Validación: Mínimo 3 caracteres
- Sugerencias con códigos CIE-10

**5. Date Pickers**
- Formato: YYYY-MM-DD
- Validación:
  - `fecha_inicio` no puede ser > `fecha_fin`
  - Rango permitido: -60 a +90 días desde hoy
  - Sin solapamiento con incapacidades existentes

**6. Cálculo Automático de Días**
```javascript
const calcularDias = (inicio, fin) => {
  const diff = new Date(fin) - new Date(inicio);
  const dias = Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1;
  return dias;
};
```

**7. Botones**
- **Cancelar:** Color gris, redirect a `/incapacidades`
- **Crear Incapacidad:** Color azul, disabled mientras carga

### Flujo con OCR

**1. Usuario sube documento PDF/imagen:**
```javascript
const handleFileUpload = async (file) => {
  setLoading(true);
  
  // Crear FormData
  const formData = new FormData();
  formData.append('documento', file);
  
  try {
    // Llamar endpoint OCR
    const response = await fetch('/api/incapacidades/validar-documento', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData
    });
    
    const { data } = await response.json();
    
    // Pre-llenar formulario con datos extraídos
    setFormulario({
      tipo: data.tipo_detectado === 'EPS' ? 'EPS' : 'ARL',
      diagnostico: data.campos_extraidos.diagnostico || '',
      fecha_inicio: data.campos_extraidos.fecha_inicio || '',
      fecha_fin: data.campos_extraidos.fecha_fin || '',
      observaciones: ''
    });
    
    // Mostrar advertencias si existen
    if (data.advertencias.length > 0) {
      setAdvertencias(data.advertencias);
    }
    
    // Mostrar sugerencia
    setSugerencia(data.accion_sugerida);
    
  } catch (error) {
    alert('Error al procesar documento: ' + error.message);
  } finally {
    setLoading(false);
  }
};
```

**2. Mostrar Advertencias:**
```
┌─────────────────────────────────────────────┐
│ ⚠️ Advertencias del documento:              │
│                                             │
│ • No se detectó diagnóstico completo        │
│ • Verificar fecha de expedición             │
│                                             │
│ Por favor, completa los campos faltantes.   │
└─────────────────────────────────────────────┘
```

**3. Sugerencia de Acción:**
```javascript
switch (accion_sugerida) {
  case 'APROBAR':
    <Alert color="success">
      ✅ Documento válido - Todos los campos extraídos correctamente
    </Alert>
    break;
    
  case 'REVISAR_MANUALMENTE':
    <Alert color="warning">
      ⚠️ Completar campos faltantes antes de enviar
    </Alert>
    break;
    
  case 'RECHAZAR':
    <Alert color="danger">
      ❌ Documento de baja calidad - Subir nueva foto o escaneo
    </Alert>
    break;
}
```

### Endpoint Integrado

```javascript
// POST /api/incapacidades
{
  tipo: "EPS",
  diagnostico: "J06.9 Infección Respiratoria Aguda",
  fecha_inicio: "2025-11-20",
  fecha_fin: "2025-11-22",
  observaciones: "Gripe fuerte"
}

// Respuesta:
{
  success: true,
  message: "Incapacidad creada exitosamente",
  data: {
    id: 144,
    usuario_id: 5,
    tipo: "EPS",
    estado: "reportada",
    dias_incapacidad: 3
  }
}
```

### Validaciones Frontend

```javascript
const validarFormulario = () => {
  const errores = [];
  
  if (!formulario.tipo) {
    errores.push('Selecciona un tipo de incapacidad');
  }
  
  if (!formulario.diagnostico || formulario.diagnostico.length < 3) {
    errores.push('El diagnóstico debe tener al menos 3 caracteres');
  }
  
  if (!formulario.fecha_inicio || !formulario.fecha_fin) {
    errores.push('Las fechas son obligatorias');
  }
  
  if (new Date(formulario.fecha_inicio) > new Date(formulario.fecha_fin)) {
    errores.push('La fecha de inicio debe ser anterior a la fecha de fin');
  }
  
  const dias = calcularDias(formulario.fecha_inicio, formulario.fecha_fin);
  
  if (formulario.tipo === 'EPS' && dias > 180) {
    errores.push('EPS no puede exceder 180 días (normativa legal)');
  }
  
  if (formulario.tipo === 'ARL' && dias > 540) {
    errores.push('ARL no puede exceder 540 días (normativa legal)');
  }
  
  return errores;
};
```

---

## 🔍 VISTA: VALIDACIÓN OCR DE DOCUMENTOS

### Wireframe (Modal)

```
┌────────────────────────────────────────────────────────────────┐
│ Validar Documento con OCR                              [✖️]    │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Incapacidad #144 - Juan Pablo Martínez                       │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  Paso 1: Subir Documento                                │ │
│  │                                                          │ │
│  │  ┌────────────────────────────────────────────────────┐ │ │
│  │  │         📤 Arrastra o selecciona archivo           │ │ │
│  │  │         PDF, PNG, JPG, JPEG, WEBP (máx 5MB)        │ │ │
│  │  └────────────────────────────────────────────────────┘ │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
│  ──────────────────────────────────────────────────────────── │
│                                                                │
│  Paso 2: Resultados de Extracción OCR                         │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ 📄 Archivo: incapacidad_nueva_eps.pdf                   │ │
│  │ 📊 Confianza OCR: 100%  ██████████████████████           │ │
│  │ 🏥 Tipo Detectado: EPS                                   │ │
│  │ ✅ Sugerencia: APROBAR                                   │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
│  Campos Extraídos:                                             │
│                                                                │
│  ┌──────────────────────────┬────────────────────────────────┐│
│  │ Campo                    │ Valor Detectado                ││
│  ├──────────────────────────┼────────────────────────────────┤│
│  │ 👤 Nombre                │ ADRIANA LUCIA BARRERA HENAO    ││
│  │ 🆔 Documento             │ 52468791                       ││
│  │ 🏥 Diagnóstico           │ J06.9 Infección Resp. Aguda    ││
│  │ 📅 Fecha Inicio          │ 2024-11-21                     ││
│  │ 📅 Fecha Fin             │ 2024-11-25                     ││
│  │ 📆 Días                  │ 5 días                         ││
│  │ 🏢 Entidad               │ NUEVA EPS                      ││
│  │ 📋 Fecha Expedición      │ 2024-11-21                     ││
│  └──────────────────────────┴────────────────────────────────┘│
│                                                                │
│  ⚠️ Advertencias: (0)                                          │
│                                                                │
│  ───────────────────────────────────────                      │
│                                                                │
│              [Rechazar Documento]  [Aprobar y Guardar]        │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### Estados de Procesamiento

**Estado 1: Subiendo archivo**
```
┌─────────────────────────────┐
│ 📤 Subiendo archivo...      │
│ [████████░░░░] 80%          │
└─────────────────────────────┘
```

**Estado 2: Procesando OCR**
```
┌─────────────────────────────┐
│ 🔍 Extrayendo texto con OCR │
│ ⏳ Por favor espera...      │
│ [Spinner animado]           │
└─────────────────────────────┘
```

**Estado 3: Resultados - APROBAR (8/8 campos)**
```
┌─────────────────────────────────────────┐
│ ✅ Documento válido                     │
│                                         │
│ Todos los campos extraídos              │
│ correctamente (8/8)                     │
│                                         │
│ Sugerencia: APROBAR automáticamente     │
└─────────────────────────────────────────┘
```

**Estado 4: Resultados - REVISAR (5/8 campos)**
```
┌─────────────────────────────────────────┐
│ ⚠️ Revisar manualmente                  │
│                                         │
│ Campos extraídos: 5 de 8                │
│                                         │
│ Advertencias:                           │
│ • No se detectó diagnóstico             │
│ • No se detectó documento del paciente  │
│ • Fecha de expedición faltante          │
│                                         │
│ Por favor completa campos faltantes.    │
└─────────────────────────────────────────┘
```

**Estado 5: Resultados - RECHAZAR (2/8 campos)**
```
┌─────────────────────────────────────────┐
│ ❌ Documento de baja calidad            │
│                                         │
│ Solo 2 de 8 campos detectados           │
│                                         │
│ Sugerencia: Subir nueva foto/escaneo   │
│ con mejor calidad (mínimo 300 DPI)      │
└─────────────────────────────────────────┘
```

### Barra de Confianza OCR

```javascript
// Componente de barra de confianza
const ConfianzaBar = ({ confianza }) => {
  const getColor = (value) => {
    if (value >= 90) return '#10b981'; // Verde
    if (value >= 70) return '#f59e0b'; // Naranja
    return '#ef4444'; // Rojo
  };
  
  return (
    <div style={{ width: '100%', background: '#e5e7eb', borderRadius: '4px' }}>
      <div style={{
        width: `${confianza}%`,
        background: getColor(confianza),
        height: '24px',
        borderRadius: '4px',
        textAlign: 'center',
        color: 'white',
        fontWeight: 'bold',
        lineHeight: '24px'
      }}>
        {confianza}%
      </div>
    </div>
  );
};
```

### Tabla de Campos Extraídos

```javascript
// Componente de tabla con iconos
const CamposTable = ({ campos }) => {
  const iconos = {
    nombre: '👤',
    documento: '🆔',
    diagnostico: '🏥',
    fecha_inicio: '📅',
    fecha_fin: '📅',
    dias_incapacidad: '📆',
    entidad: '🏢',
    fecha_expedicion: '📋'
  };
  
  return (
    <table>
      <tbody>
        {Object.entries(campos).map(([campo, valor]) => (
          <tr key={campo}>
            <td>{iconos[campo]} {campo.replace('_', ' ')}</td>
            <td>{valor || <em style={{color: '#94a3b8'}}>No detectado</em>}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};
```

### Endpoint Integrado

```javascript
// POST /api/incapacidades/validar-documento
const formData = new FormData();
formData.append('documento', archivoSeleccionado);

const response = await fetch('/api/incapacidades/validar-documento', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: formData
});

const resultado = await response.json();

// resultado.data:
{
  tipo_detectado: "EPS",
  campos_extraidos: {
    nombre: "ADRIANA LUCIA BARRERA HENAO",
    documento: "52468791",
    diagnostico: "J06.9 Infección Respiratoria Aguda",
    fecha_inicio: "2024-11-21",
    fecha_fin: "2024-11-25",
    dias_incapacidad: 5,
    entidad: "NUEVA EPS",
    fecha_expedicion: "2024-11-21"
  },
  advertencias: [],
  accion_sugerida: "APROBAR",
  confianza_ocr: 100
}
```

### Botones de Acción

**Rechazar Documento:**
- Color: Gris
- Acción: Cerrar modal, no guardar nada
- Confirmación: "¿Seguro que quieres descartar este documento?"

**Aprobar y Guardar:**
- Color: Verde
- Acción: 
  1. POST `/api/incapacidades/:id/documento` (subir archivo)
  2. PUT `/api/incapacidades/:id` (actualizar campos extraídos)
  3. Cerrar modal
  4. Mostrar notificación éxito
  5. Recargar lista de incapacidades

---

**Continúa en:** [GUIA_VISUAL_INTERFAZ_PARTE2.md](GUIA_VISUAL_INTERFAZ_PARTE2.md)

- Vista: Cambiar Estado de Incapacidad
- Vista: Notificaciones
- Vista: Conciliaciones
- Vista: Reemplazos
- Vista: Gestión de Usuarios
- Componentes Reutilizables
- Responsive Design

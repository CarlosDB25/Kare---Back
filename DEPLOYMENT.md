# 🚀 GUÍA DE DEPLOYMENT - Sistema KARE

Esta guía te ayudará a desplegar el sistema KARE desde cero después de clonar el repositorio.

---

## 📋 Prerequisitos

Antes de comenzar, asegúrate de tener instalado:

- ✅ **Node.js** v22.x o superior ([Descargar](https://nodejs.org/))
- ✅ **npm** v10.x o superior (viene con Node.js)
- ✅ **Git** ([Descargar](https://git-scm.com/))
- ✅ **PowerShell** o **Bash** (según tu sistema operativo)

---

## 🔧 Instalación Paso a Paso

### 1. Clonar el Repositorio

```powershell
# Clonar desde GitHub
git clone https://github.com/CarlosDB25/Kare---Back.git

# Entrar al directorio
cd Kare---Back
```

---

### 2. Instalar Dependencias

```powershell
# Instalar todas las dependencias del proyecto
npm install
```

**📦 Dependencias instaladas:**
- express (Framework web)
- sqlite3 (Base de datos)
- jsonwebtoken (Autenticación JWT)
- bcryptjs (Hash de contraseñas)
- multer (Upload de archivos)
- tesseract.js (OCR para imágenes)
- pdf-parse (Extracción de PDFs)
- cors (Cross-Origin Resource Sharing)
- dotenv (Variables de entorno)
- date-fns (Manejo de fechas)

---

### 3. Configurar Variables de Entorno

Crear un archivo `.env` en la raíz del proyecto:

**PowerShell:**
```powershell
@"
PORT=3000
JWT_SECRET=kare_secret_super_seguro_2025_CAMBIAR_EN_PRODUCCION
NODE_ENV=development
"@ | Out-File -FilePath .env -Encoding utf8
```

**Bash/Linux/Mac:**
```bash
cat > .env << 'EOF'
PORT=3000
JWT_SECRET=kare_secret_super_seguro_2025_CAMBIAR_EN_PRODUCCION
NODE_ENV=development
EOF
```

**⚠️ IMPORTANTE PARA PRODUCCIÓN:**
- Cambia `JWT_SECRET` por un valor aleatorio y seguro
- Usa `NODE_ENV=production` en producción
- Nunca compartas el archivo `.env` (ya está en `.gitignore`)

---

### 4. Crear Carpeta de Uploads

```powershell
# PowerShell
New-Item -ItemType Directory -Path "src/uploads" -Force

# Bash/Linux/Mac
mkdir -p src/uploads
```

Esta carpeta almacenará los documentos PDF/imágenes subidos por los usuarios.

---

### 5. Iniciar el Servidor

```powershell
# Modo desarrollo (con auto-reload)
npm run dev

# O modo producción
npm start
```

**✅ El servidor se iniciará automáticamente y:**
1. Creará la base de datos SQLite (`kare.db`)
2. Creará las tablas necesarias
3. Insertará usuarios de prueba
4. Escuchará en el puerto 3000

---

## 🔍 Verificación de la Instalación

### 1. Health Check

Abrir en navegador o hacer un curl:
```bash
curl http://localhost:3000/api/health
```

**Respuesta esperada:**
```json
{
  "success": true,
  "message": "KARE API funcionando correctamente",
  "data": {
    "timestamp": "2025-11-21T..."
  }
}
```

### 2. Login de Prueba

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"gh@kare.com","password":"gh123"}'
```

**Respuesta esperada:**
```json
{
  "success": true,
  "message": "Login exitoso",
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

---

## 👥 Usuarios de Prueba Creados Automáticamente

| Rol | Email | Password | Descripción |
|-----|-------|----------|-------------|
| **GH** | gh@kare.com | gh123 | Gestión Humana (acceso total) |
| **Conta** | conta@kare.com | conta123 | Contabilidad (conciliaciones) |
| **Líder** | lider@kare.com | lider123 | Líder de área (reemplazos) |
| **Colab1** | colab1@kare.com | 123456 | Colaborador 1 |
| **Colab2** | colab2@kare.com | 123456 | Colaborador 2 |
| **Colab3** | colab3@kare.com | 123456 | Colaborador 3 |
| **Colab4** | colab4@kare.com | 123456 | Colaborador 4 |
| **Colab5** | colab5@kare.com | 123456 | Colaborador 5 |

---

## 🗂️ Estructura de Archivos Generados

Después de la instalación, tu proyecto tendrá:

```
Kare---Back/
├── node_modules/         # ✅ Generado por npm install
├── src/
│   ├── uploads/          # ✅ Creado manualmente
│   └── db/
│       └── kare.db       # ✅ Generado al iniciar servidor
├── .env                  # ✅ Creado manualmente
└── ... (resto del código del repo)
```

---

## 🚨 Troubleshooting

### Error: "Cannot find module 'express'"

**Solución:**
```powershell
npm install
```

---

### Error: "EADDRINUSE: address already in use"

**Problema:** El puerto 3000 ya está en uso.

**Solución 1 - Cambiar puerto:**
```powershell
# Editar .env y cambiar:
PORT=3001
```

**Solución 2 - Matar proceso en puerto 3000:**
```powershell
# PowerShell
Stop-Process -Name "node" -Force

# Bash/Linux
lsof -ti:3000 | xargs kill -9
```

---

### Error: "ENOENT: no such file or directory, open '.env'"

**Problema:** El archivo `.env` no existe.

**Solución:**
```powershell
# Crear .env con el comando del paso 3
```

---

### Error: "Cannot create directory 'uploads'"

**Problema:** No tienes permisos para crear carpetas.

**Solución:**
```powershell
# Ejecutar como administrador o con sudo
```

---

### Base de datos no se crea

**Problema:** Falta la carpeta `src/db/`.

**Solución:**
```powershell
mkdir src/db
npm run dev
```

---

### "CORS policy" error en navegador

**Problema:** El frontend está en diferente dominio.

**Solución:** El backend ya tiene CORS configurado. Verifica que estés usando:
```
http://localhost:3000/api
```

---

## 🌐 Deploy a Producción

### Cambios Necesarios para Producción

1. **Variables de entorno:**
```bash
PORT=80 o 443 (según el servidor)
JWT_SECRET=<CLAVE_ALEATORIA_SUPER_SEGURA>
NODE_ENV=production
```

2. **Generar JWT_SECRET seguro:**
```powershell
# PowerShell
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 64 | % {[char]$_})

# Bash
openssl rand -base64 64
```

3. **Base de datos:**
   - SQLite funciona, pero considera migrar a PostgreSQL o MySQL para producción
   - Backup automático de `kare.db`

4. **Servidor:**
   - Usar PM2 o similar para mantener el proceso corriendo
   - Nginx como reverse proxy
   - HTTPS con Let's Encrypt

---

## 📝 Scripts Disponibles

```json
{
  "start": "node src/server.js",     // Producción
  "dev": "node src/server.js"        // Desarrollo
}
```

---

## 🔐 Seguridad

### Checklist de Seguridad

- ✅ `.env` en `.gitignore`
- ✅ `kare.db` en `.gitignore`
- ✅ `node_modules/` en `.gitignore`
- ✅ `src/uploads/` en `.gitignore`
- ✅ JWT_SECRET único y seguro
- ✅ Passwords hasheados con bcrypt (10 rounds)
- ✅ Validación de entrada en todos los endpoints
- ✅ Control de acceso por roles
- ✅ CORS configurado

---

## 📚 Documentación Adicional

- [README.md](README.md) - Guía principal del proyecto
- [GUIA_ENDPOINTS_FACIL.md](docs/GUIA_ENDPOINTS_FACIL.md) - 30 endpoints explicados
- [GUIA_INTEGRACION_BACKEND.md](docs/GUIA_INTEGRACION_BACKEND.md) - Integrar con frontend
- [DOCUMENTACION_TECNICA.md](docs/DOCUMENTACION_TECNICA.md) - Arquitectura completa

---

## 🆘 Soporte

Si tienes problemas durante el deployment:

1. Verifica los logs del servidor en la consola
2. Revisa que todos los archivos necesarios estén creados
3. Consulta la sección de Troubleshooting arriba
4. Verifica que las dependencias se instalaron correctamente: `npm list`

---

**✅ ¡Deployment exitoso!** El sistema KARE debería estar corriendo en http://localhost:3000

---

*Última actualización: 21 de Noviembre de 2025*

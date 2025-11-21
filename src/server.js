import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { initDatabase } from './db/database.js';

// Importar rutas
import authRoutes from './routes/authRoutes.js';
import incapacidadRoutes from './routes/incapacidadRoutes.js';
import usuarioRoutes from './routes/usuarioRoutes.js';
import notificacionRoutes from './routes/notificacionRoutes.js';
import conciliacionRoutes from './routes/conciliacionRoutes.js';
import reemplazoRoutes from './routes/reemplazoRoutes.js';

// Configuración
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos (uploads)
app.use('/uploads', express.static(join(__dirname, 'uploads')));

// Ruta raíz - Página de bienvenida
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>KARE API - Sistema de Gestión de Incapacidades</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }
        .container {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border-radius: 20px;
          padding: 40px;
          max-width: 600px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        }
        h1 { font-size: 2.5rem; margin-bottom: 10px; }
        .subtitle { opacity: 0.9; margin-bottom: 30px; }
        .status { 
          background: rgba(34, 197, 94, 0.2);
          padding: 15px;
          border-radius: 10px;
          margin: 20px 0;
          border-left: 4px solid #22c55e;
        }
        .endpoint {
          background: rgba(0, 0, 0, 0.2);
          padding: 10px 15px;
          border-radius: 8px;
          margin: 10px 0;
          font-family: 'Courier New', monospace;
        }
        .info { margin: 20px 0; line-height: 1.6; }
        a { color: #fbbf24; text-decoration: none; }
        a:hover { text-decoration: underline; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🏥 KARE API</h1>
        <p class="subtitle">Sistema de Gestión de Incapacidades Laborales</p>
        
        <div class="status">
          ✓ API funcionando correctamente
        </div>
        
        <div class="info">
          <h3>📡 Endpoints Disponibles:</h3>
          <div class="endpoint">GET /api/health</div>
          <div class="endpoint">POST /api/auth/login</div>
          <div class="endpoint">GET /api/incapacidades</div>
          <div class="endpoint">GET /api/usuarios</div>
          <div class="endpoint">... y más</div>
        </div>
        
        <div class="info">
          <h3>📚 Documentación:</h3>
          <p>
            <a href="https://github.com/CarlosDB25/Kare---Back" target="_blank">
              Ver README en GitHub →
            </a>
          </p>
        </div>
        
        <div class="info">
          <h3>🧪 Prueba rápida:</h3>
          <div class="endpoint">curl ${req.protocol}://${req.get('host')}/api/health</div>
        </div>
      </div>
    </body>
    </html>
  `);
});

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/incapacidades', incapacidadRoutes);
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/notificaciones', notificacionRoutes);
app.use('/api/conciliaciones', conciliacionRoutes);
app.use('/api/reemplazos', reemplazoRoutes);

// Ruta de prueba
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'KARE API funcionando correctamente',
    data: { timestamp: new Date().toISOString() }
  });
});

// Manejo de errores global
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Error interno del servidor',
    data: null
  });
});

// Ruta no encontrada
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Ruta no encontrada',
    data: null
  });
});

// Iniciar servidor
app.listen(PORT, async () => {
  console.log(`[KARE] Servidor ejecutándose en puerto ${PORT}`);
  console.log(`[KARE] Ambiente: ${process.env.NODE_ENV || 'development'}`);
  
  // Inicializar base de datos
  try {
    await initDatabase();
    console.log('[KARE] Sistema listo para usar');
  } catch (error) {
    console.error('[KARE] Error al inicializar base de datos:', error);
  }
});

export default app;

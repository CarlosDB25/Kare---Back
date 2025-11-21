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
        * { 
          margin: 0; 
          padding: 0; 
          box-sizing: border-box; 
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          background: #ffffff;
          color: #1a1a1a;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }
        .container {
          max-width: 700px;
          width: 100%;
        }
        h1 { 
          font-size: 3rem;
          font-weight: 700;
          margin-bottom: 8px;
          color: #000;
          letter-spacing: -1px;
        }
        .subtitle { 
          font-size: 1.1rem;
          color: #666;
          margin-bottom: 40px;
          font-weight: 400;
        }
        .status { 
          background: #f8f9fa;
          border: 2px solid #000;
          padding: 16px 20px;
          margin: 30px 0;
          font-size: 1rem;
          font-weight: 500;
        }
        .status::before {
          content: '●';
          color: #22c55e;
          margin-right: 8px;
        }
        .section {
          margin: 40px 0;
        }
        h2 { 
          font-size: 0.875rem;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: #666;
          margin-bottom: 16px;
          font-weight: 600;
        }
        .endpoint {
          background: #000;
          color: #fff;
          padding: 12px 16px;
          margin: 8px 0;
          font-family: 'Courier New', Consolas, monospace;
          font-size: 0.9rem;
          border-radius: 4px;
        }
        .endpoint-list {
          display: grid;
          gap: 4px;
        }
        a { 
          color: #000;
          text-decoration: none;
          border-bottom: 2px solid #000;
          transition: opacity 0.2s;
          font-weight: 500;
        }
        a:hover { 
          opacity: 0.6;
        }
        .footer {
          margin-top: 60px;
          padding-top: 30px;
          border-top: 1px solid #e5e5e5;
          color: #999;
          font-size: 0.875rem;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>KARE API</h1>
        <p class="subtitle">Sistema de Gestión de Incapacidades Laborales</p>
        
        <div class="status">
          API activa y operacional
        </div>
        
        <div class="section">
          <h2>Endpoints Principales</h2>
          <div class="endpoint-list">
            <div class="endpoint">GET  /api/health</div>
            <div class="endpoint">POST /api/auth/login</div>
            <div class="endpoint">GET  /api/incapacidades</div>
            <div class="endpoint">GET  /api/usuarios</div>
            <div class="endpoint">POST /api/conciliaciones</div>
          </div>
        </div>
        
        <div class="section">
          <h2>Documentación</h2>
          <p>
            <a href="https://github.com/CarlosDB25/Kare---Back" target="_blank">
              Ver documentación completa en GitHub
            </a>
          </p>
        </div>
        
        <div class="section">
          <h2>Prueba Rápida</h2>
          <div class="endpoint">curl ${req.protocol}://${req.get('host')}/api/health</div>
        </div>

        <div class="footer">
          KARE v1.0.0 · Node.js + Express + SQLite
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

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

// src/routes/conciliacionRoutes.js
// Rutas para gestión de conciliaciones financieras

import express from 'express';
import { ConciliacionController } from '../controller/conciliacionController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { roleMiddleware } from '../middlewares/roleMiddleware.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// POST /api/conciliaciones - Crear conciliación (solo contabilidad)
router.post('/', roleMiddleware(['conta']), ConciliacionController.crear);

// GET /api/conciliaciones/estadisticas - Estadísticas (conta, gh)
router.get('/estadisticas', roleMiddleware(['conta', 'gh']), ConciliacionController.obtenerEstadisticas);

// GET /api/conciliaciones/incapacidad/:incapacidad_id - Obtener por incapacidad
router.get('/incapacidad/:incapacidad_id', ConciliacionController.obtenerPorIncapacidad);

// GET /api/conciliaciones - Listar conciliaciones (conta, gh)
router.get('/', roleMiddleware(['conta', 'gh']), ConciliacionController.listar);

// PUT /api/conciliaciones/:id - Actualizar conciliación (solo contabilidad)
router.put('/:id', roleMiddleware(['conta']), ConciliacionController.actualizar);

export default router;

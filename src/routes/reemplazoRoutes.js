// src/routes/reemplazoRoutes.js
// Rutas para gestión de reemplazos temporales

import express from 'express';
import { ReemplazoController } from '../controller/reemplazoController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { roleMiddleware } from '../middlewares/roleMiddleware.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// POST /api/reemplazos - Crear reemplazo (solo líderes)
router.post('/', roleMiddleware(['lider']), ReemplazoController.crear);

// GET /api/reemplazos/estadisticas - Estadísticas (gh, conta, lider)
router.get('/estadisticas', roleMiddleware(['gh', 'conta', 'lider']), ReemplazoController.obtenerEstadisticas);

// GET /api/reemplazos/mis-reemplazos - Mis reemplazos activos (cualquier usuario)
router.get('/mis-reemplazos', ReemplazoController.obtenerMisReemplazos);

// GET /api/reemplazos/incapacidad/:incapacidad_id - Reemplazos de una incapacidad
router.get('/incapacidad/:incapacidad_id', ReemplazoController.obtenerPorIncapacidad);

// GET /api/reemplazos/:id - Obtener reemplazo por ID
router.get('/:id', ReemplazoController.obtenerPorId);

// GET /api/reemplazos - Listar reemplazos
router.get('/', ReemplazoController.listar);

// PUT /api/reemplazos/:id/finalizar - Finalizar reemplazo (solo líderes)
router.put('/:id/finalizar', roleMiddleware(['lider']), ReemplazoController.finalizar);

// PUT /api/reemplazos/:id/cancelar - Cancelar reemplazo (solo líderes)
router.put('/:id/cancelar', roleMiddleware(['lider']), ReemplazoController.cancelar);

export default router;

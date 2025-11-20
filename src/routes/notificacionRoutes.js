// src/routes/notificacionRoutes.js
// Rutas para gestión de notificaciones

import express from 'express';
import { NotificacionController } from '../controller/notificacionController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// GET /api/notificaciones - Obtener notificaciones del usuario
// Query params: ?solo_no_leidas=true
router.get('/', NotificacionController.obtenerMisNotificaciones);

// GET /api/notificaciones/no-leidas/count - Contador de no leídas
router.get('/no-leidas/count', NotificacionController.contarNoLeidas);

// PUT /api/notificaciones/:id/leer - Marcar como leída
router.put('/:id/leer', NotificacionController.marcarLeida);

// PUT /api/notificaciones/leer-todas - Marcar todas como leídas
router.put('/leer-todas', NotificacionController.marcarTodasLeidas);

// DELETE /api/notificaciones/:id - Eliminar notificación
router.delete('/:id', NotificacionController.eliminar);

export default router;

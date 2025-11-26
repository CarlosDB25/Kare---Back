// src/routes/notificacionRoutes.js
// Rutas para gestión de notificaciones

import express from 'express';
import { NotificacionController } from '../controller/notificacionController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

/**
 * @swagger
 * /api/notificaciones:
 *   get:
 *     summary: Obtener mis notificaciones
 *     tags: [Notificaciones]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: solo_no_leidas
 *         schema:
 *           type: boolean
 *         description: Filtrar solo notificaciones no leídas
 *     responses:
 *       200:
 *         description: Lista de notificaciones
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Notificacion'
 *       401:
 *         description: No autorizado
 */
router.get('/', NotificacionController.obtenerMisNotificaciones);

/**
 * @swagger
 * /api/notificaciones/no-leidas/count:
 *   get:
 *     summary: Contar notificaciones no leídas
 *     tags: [Notificaciones]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Cantidad de notificaciones no leídas
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: integer
 *       401:
 *         description: No autorizado
 */
router.get('/no-leidas/count', NotificacionController.contarNoLeidas);

/**
 * @swagger
 * /api/notificaciones/{id}/leer:
 *   put:
 *     summary: Marcar notificación como leída
 *     tags: [Notificaciones]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la notificación
 *     responses:
 *       200:
 *         description: Notificación marcada como leída
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Notificación no encontrada
 */
router.put('/:id/leer', NotificacionController.marcarLeida);

/**
 * @swagger
 * /api/notificaciones/leer-todas:
 *   put:
 *     summary: Marcar todas las notificaciones como leídas
 *     tags: [Notificaciones]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Todas las notificaciones marcadas como leídas
 *       401:
 *         description: No autorizado
 */
router.put('/leer-todas', NotificacionController.marcarTodasLeidas);

/**
 * @swagger
 * /api/notificaciones/{id}:
 *   delete:
 *     summary: Eliminar notificación
 *     tags: [Notificaciones]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la notificación
 *     responses:
 *       200:
 *         description: Notificación eliminada
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Notificación no encontrada
 */
router.delete('/:id', NotificacionController.eliminar);

export default router;

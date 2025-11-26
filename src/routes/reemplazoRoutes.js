// src/routes/reemplazoRoutes.js
// Rutas para gestión de reemplazos temporales

import express from 'express';
import { ReemplazoController } from '../controller/reemplazoController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { roleMiddleware } from '../middlewares/roleMiddleware.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

/**
 * @swagger
 * /api/reemplazos:
 *   post:
 *     summary: Crear reemplazo temporal (solo Líderes)
 *     tags: [Reemplazos]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - incapacidad_id
 *               - usuario_reemplazo_id
 *               - fecha_inicio
 *               - fecha_fin
 *             properties:
 *               incapacidad_id:
 *                 type: integer
 *               usuario_reemplazo_id:
 *                 type: integer
 *               fecha_inicio:
 *                 type: string
 *                 format: date
 *               fecha_fin:
 *                 type: string
 *                 format: date
 *               observaciones:
 *                 type: string
 *     responses:
 *       201:
 *         description: Reemplazo creado exitosamente
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Acceso denegado (requiere rol lider)
 */
router.post('/', roleMiddleware(['lider']), ReemplazoController.crear);

/**
 * @swagger
 * /api/reemplazos/estadisticas:
 *   get:
 *     summary: Obtener estadísticas de reemplazos (GH/Contabilidad/Líderes)
 *     tags: [Reemplazos]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Estadísticas de reemplazos
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Acceso denegado
 */
router.get('/estadisticas', roleMiddleware(['gh', 'conta', 'lider']), ReemplazoController.obtenerEstadisticas);

/**
 * @swagger
 * /api/reemplazos/activos:
 *   get:
 *     summary: Listar reemplazos activos
 *     tags: [Reemplazos]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de reemplazos activos
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
 *                     $ref: '#/components/schemas/Reemplazo'
 *       401:
 *         description: No autorizado
 */
router.get('/activos', ReemplazoController.listarActivos);

/**
 * @swagger
 * /api/reemplazos/mis-reemplazos:
 *   get:
 *     summary: Obtener mis reemplazos activos
 *     tags: [Reemplazos]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de mis reemplazos
 *       401:
 *         description: No autorizado
 */
router.get('/mis-reemplazos', ReemplazoController.obtenerMisReemplazos);

/**
 * @swagger
 * /api/reemplazos/incapacidad/{incapacidad_id}:
 *   get:
 *     summary: Obtener reemplazos de una incapacidad
 *     tags: [Reemplazos]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: incapacidad_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la incapacidad
 *     responses:
 *       200:
 *         description: Reemplazos de la incapacidad
 *       401:
 *         description: No autorizado
 */
router.get('/incapacidad/:incapacidad_id', ReemplazoController.obtenerPorIncapacidad);

/**
 * @swagger
 * /api/reemplazos/{id}:
 *   get:
 *     summary: Obtener reemplazo por ID
 *     tags: [Reemplazos]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del reemplazo
 *     responses:
 *       200:
 *         description: Detalles del reemplazo
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Reemplazo'
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Reemplazo no encontrado
 */
router.get('/:id', ReemplazoController.obtenerPorId);

/**
 * @swagger
 * /api/reemplazos:
 *   get:
 *     summary: Listar todos los reemplazos
 *     tags: [Reemplazos]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de reemplazos
 *       401:
 *         description: No autorizado
 */
router.get('/', ReemplazoController.listar);

/**
 * @swagger
 * /api/reemplazos/{id}/finalizar:
 *   put:
 *     summary: Finalizar reemplazo (solo Líderes)
 *     tags: [Reemplazos]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del reemplazo
 *     responses:
 *       200:
 *         description: Reemplazo finalizado
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Acceso denegado
 *       404:
 *         description: Reemplazo no encontrado
 */
router.put('/:id/finalizar', roleMiddleware(['lider']), ReemplazoController.finalizar);

/**
 * @swagger
 * /api/reemplazos/{id}/cancelar:
 *   put:
 *     summary: Cancelar reemplazo (solo Líderes)
 *     tags: [Reemplazos]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del reemplazo
 *     responses:
 *       200:
 *         description: Reemplazo cancelado
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Acceso denegado
 *       404:
 *         description: Reemplazo no encontrado
 */
router.put('/:id/cancelar', roleMiddleware(['lider']), ReemplazoController.cancelar);

export default router;

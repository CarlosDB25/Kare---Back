// src/routes/conciliacionRoutes.js
// Rutas para gestión de conciliaciones financieras

import express from 'express';
import { ConciliacionController } from '../controller/conciliacionController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { roleMiddleware } from '../middlewares/roleMiddleware.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

/**
 * @swagger
 * /api/conciliaciones:
 *   post:
 *     summary: Crear conciliación financiera (solo Contabilidad)
 *     tags: [Conciliaciones]
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
 *               - valor_eps
 *               - valor_empresa
 *             properties:
 *               incapacidad_id:
 *                 type: integer
 *               valor_eps:
 *                 type: number
 *               valor_empresa:
 *                 type: number
 *               observaciones:
 *                 type: string
 *     responses:
 *       201:
 *         description: Conciliación creada
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Acceso denegado (requiere rol conta)
 */
router.post('/', roleMiddleware(['conta']), ConciliacionController.crear);

/**
 * @swagger
 * /api/conciliaciones/estadisticas:
 *   get:
 *     summary: Obtener estadísticas de conciliaciones (Contabilidad/GH)
 *     tags: [Conciliaciones]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Estadísticas financieras
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Acceso denegado
 */
router.get('/estadisticas', roleMiddleware(['conta', 'gh']), ConciliacionController.obtenerEstadisticas);

/**
 * @swagger
 * /api/conciliaciones/incapacidad/{incapacidad_id}:
 *   get:
 *     summary: Obtener conciliación de una incapacidad
 *     tags: [Conciliaciones]
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
 *         description: Conciliación encontrada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Conciliacion'
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Conciliación no encontrada
 */
router.get('/incapacidad/:incapacidad_id', ConciliacionController.obtenerPorIncapacidad);

/**
 * @swagger
 * /api/conciliaciones:
 *   get:
 *     summary: Listar todas las conciliaciones (Contabilidad/GH)
 *     tags: [Conciliaciones]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de conciliaciones
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
 *                     $ref: '#/components/schemas/Conciliacion'
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Acceso denegado
 */
router.get('/', roleMiddleware(['conta', 'gh']), ConciliacionController.listar);

/**
 * @swagger
 * /api/conciliaciones/{id}:
 *   put:
 *     summary: Actualizar conciliación (solo Contabilidad)
 *     tags: [Conciliaciones]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la conciliación
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               valor_eps:
 *                 type: number
 *               valor_empresa:
 *                 type: number
 *               observaciones:
 *                 type: string
 *     responses:
 *       200:
 *         description: Conciliación actualizada
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Acceso denegado
 *       404:
 *         description: Conciliación no encontrada
 */
router.put('/:id', roleMiddleware(['conta']), ConciliacionController.actualizar);

export default router;

import express from 'express';
import { UsuarioController } from '../controller/usuarioController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { roleMiddleware } from '../middlewares/roleMiddleware.js';

const router = express.Router();

/**
 * Rutas de administración de usuarios
 * Gestión Humana, Contabilidad y Líderes pueden acceder
 */

/**
 * @swagger
 * /api/usuarios:
 *   get:
 *     summary: Obtener todos los usuarios (GH/Contabilidad/Líderes)
 *     tags: [Usuarios]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de usuarios
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
 *                     $ref: '#/components/schemas/Usuario'
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Acceso denegado
 */
router.get(
  '/',
  authMiddleware,
  roleMiddleware(['gh', 'conta', 'lider']),
  UsuarioController.obtenerTodos
);

/**
 * @swagger
 * /api/usuarios/{id}:
 *   get:
 *     summary: Obtener usuario por ID (GH/Contabilidad)
 *     tags: [Usuarios]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del usuario
 *     responses:
 *       200:
 *         description: Detalles del usuario
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Usuario'
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Acceso denegado
 *       404:
 *         description: Usuario no encontrado
 */
router.get(
  '/:id',
  authMiddleware,
  roleMiddleware(['gh', 'conta']),
  UsuarioController.obtenerPorId
);

/**
 * @swagger
 * /api/usuarios/{id}/rol:
 *   put:
 *     summary: Actualizar rol de usuario (solo GH)
 *     tags: [Usuarios]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del usuario
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - rol
 *             properties:
 *               rol:
 *                 type: string
 *                 enum: [empleado, lider, conta, gh]
 *     responses:
 *       200:
 *         description: Rol actualizado exitosamente
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Acceso denegado
 *       404:
 *         description: Usuario no encontrado
 */
router.put(
  '/:id/rol',
  authMiddleware,
  roleMiddleware(['gh']),
  UsuarioController.actualizarRol
);

/**
 * @swagger
 * /api/usuarios/{id}/completar-datos:
 *   put:
 *     summary: Completar datos de usuario (solo GH)
 *     tags: [Usuarios]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del usuario
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               cargo:
 *                 type: string
 *               area:
 *                 type: string
 *               fecha_ingreso:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Datos actualizados exitosamente
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Acceso denegado
 *       404:
 *         description: Usuario no encontrado
 */
router.put(
  '/:id/completar-datos',
  authMiddleware,
  roleMiddleware(['gh']),
  UsuarioController.completarDatos
);

export default router;

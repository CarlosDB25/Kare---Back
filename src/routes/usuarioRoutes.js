import express from 'express';
import { UsuarioController } from '../controller/usuarioController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { roleMiddleware } from '../middlewares/roleMiddleware.js';

const router = express.Router();

/**
 * Rutas de administración de usuarios
 * Gestión Humana y Contabilidad pueden acceder
 */

// GET /api/usuarios - Obtener todos los usuarios
router.get(
  '/',
  authMiddleware,
  roleMiddleware(['gh', 'conta']),
  UsuarioController.obtenerTodos
);

// PUT /api/usuarios/:id/rol - Actualizar rol de usuario
router.put(
  '/:id/rol',
  authMiddleware,
  roleMiddleware(['gh']),
  UsuarioController.actualizarRol
);

export default router;

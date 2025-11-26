import express from 'express';
import { UsuarioController } from '../controller/usuarioController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { roleMiddleware } from '../middlewares/roleMiddleware.js';

const router = express.Router();

/**
 * Rutas de administración de usuarios
 * Gestión Humana, Contabilidad y Líderes pueden acceder
 */

// GET /api/usuarios - Obtener todos los usuarios
router.get(
  '/',
  authMiddleware,
  roleMiddleware(['gh', 'conta', 'lider']),
  UsuarioController.obtenerTodos
);

// GET /api/usuarios/:id - Obtener usuario por ID
router.get(
  '/:id',
  authMiddleware,
  roleMiddleware(['gh', 'conta']),
  UsuarioController.obtenerPorId
);

// PUT /api/usuarios/:id/rol - Actualizar rol de usuario
router.put(
  '/:id/rol',
  authMiddleware,
  roleMiddleware(['gh']),
  UsuarioController.actualizarRol
);

// PUT /api/usuarios/:id/completar-datos - Completar datos de usuario
router.put(
  '/:id/completar-datos',
  authMiddleware,
  roleMiddleware(['gh']),
  UsuarioController.completarDatos
);

export default router;

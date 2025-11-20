import express from 'express';
import { AuthController } from '../controller/authController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = express.Router();

/**
 * Rutas de autenticación
 */

// POST /api/auth/register - Registrar nuevo usuario
router.post('/register', AuthController.register);

// POST /api/auth/login - Iniciar sesión
router.post('/login', AuthController.login);

// GET /api/auth/profile - Obtener perfil del usuario autenticado
router.get('/profile', authMiddleware, AuthController.profile);

export default router;

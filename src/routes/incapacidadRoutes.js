import express from 'express';
import { IncapacidadController } from '../controller/incapacidadController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { roleMiddleware } from '../middlewares/roleMiddleware.js';
import { upload } from '../middlewares/uploadMiddleware.js';

const router = express.Router();

/**
 * Rutas de incapacidades
 * Todas requieren autenticación
 */

// POST /api/incapacidades - Crear incapacidad (con upload de documento)
// Cualquier usuario autenticado puede crear
router.post(
  '/',
  authMiddleware,
  upload.single('documento'),
  IncapacidadController.crear
);

// GET /api/incapacidades - Obtener incapacidades
// Colaborador: solo las suyas
// GH, Líder, Conta: todas
router.get(
  '/',
  authMiddleware,
  IncapacidadController.obtener
);

// PUT /api/incapacidades/:id/estado - Actualizar estado
// Solo Gestión Humana y Contabilidad pueden cambiar estados
router.put(
  '/:id/estado',
  authMiddleware,
  roleMiddleware(['gh', 'conta']),
  IncapacidadController.actualizarEstado
);

// POST /api/incapacidades/validar-documento - Validar documento con OCR
// Cualquier usuario autenticado puede validar
router.post(
  '/validar-documento',
  authMiddleware,
  upload.single('documento'),
  IncapacidadController.validarDocumento
);

export default router;

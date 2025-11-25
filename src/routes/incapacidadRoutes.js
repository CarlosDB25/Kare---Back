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
// GH y Contabilidad pueden cambiar estados
// Colaboradores pueden reenviar sus propias incapacidades rechazadas
router.put(
  '/:id/estado',
  authMiddleware,
  roleMiddleware(['gh', 'conta', 'colaborador']),
  IncapacidadController.actualizarEstado
);

// PUT /api/incapacidades/:id - Actualizar datos de incapacidad rechazada
// Solo el colaborador dueño puede actualizar su incapacidad rechazada
router.put(
  '/:id',
  authMiddleware,
  IncapacidadController.actualizar
);

// POST /api/incapacidades/validar-documento - Validar documento con OCR
// Cualquier usuario autenticado puede validar
router.post(
  '/validar-documento',
  authMiddleware,
  (req, res, next) => {
    upload.single('documento')(req, res, (err) => {
      if (err) {
        // Si es error de multer (tipo de archivo), retornar 400
        return res.status(err.statusCode || 400).json({
          success: false,
          message: err.message || 'Error al procesar archivo'
        });
      }
      next();
    });
  },
  IncapacidadController.validarDocumento
);

// GET /api/incapacidades/:id - Obtener incapacidad por ID
router.get(
  '/:id',
  authMiddleware,
  IncapacidadController.obtenerPorId
);

// POST /api/incapacidades/:id/documento - Subir documento a incapacidad existente
// El dueño de la incapacidad o GH/Conta pueden subir
router.post(
  '/:id/documento',
  authMiddleware,
  upload.single('documento'),
  IncapacidadController.subirDocumento
);

// GET /api/incapacidades/:id/documento - Obtener/descargar documento de incapacidad
// El dueño de la incapacidad o GH/Conta pueden descargar
router.get(
  '/:id/documento',
  authMiddleware,
  IncapacidadController.obtenerDocumento
);

// DELETE /api/incapacidades/:id - Eliminar incapacidad
// Solo GH y Conta pueden eliminar cualquier incapacidad
// Colaboradores pueden eliminar las suyas si están en estado 'reportada'
router.delete(
  '/:id',
  authMiddleware,
  IncapacidadController.eliminar
);

export default router;

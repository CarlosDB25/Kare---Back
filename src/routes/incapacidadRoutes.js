import express from 'express';
import { IncapacidadController } from '../controller/incapacidadController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { roleMiddleware } from '../middlewares/roleMiddleware.js';
import { upload } from '../middlewares/uploadMiddleware.js';

const router = express.Router();

/**
 * @swagger
 * /incapacidades:
 *   post:
 *     summary: Crear nueva incapacidad
 *     description: |
 *       Permite crear una nueva incapacidad. **DOCUMENTO OBLIGATORIO para colaboradores** (excepto usuarios de prueba).
 *       
 *       **Validaciones automáticas:**
 *       - ✅ Fechas coherentes (inicio ≤ fin)
 *       - ✅ Rango permitido (60 días atrás, 365 adelante)
 *       - ✅ Límites por tipo (EPS: 1-180d, ARL: 1-540d, Licencias: según normativa)
 *       - ✅ Sin solapamiento con otras incapacidades activas
 *       - ✅ Documento obligatorio para colaboradores
 *     tags: [Incapacidades]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - tipo
 *               - fecha_inicio
 *               - fecha_fin
 *               - diagnostico
 *             properties:
 *               tipo:
 *                 type: string
 *                 enum: [EPS, ARL, Licencia_Maternidad, Licencia_Paternidad]
 *                 example: EPS
 *               fecha_inicio:
 *                 type: string
 *                 format: date
 *                 example: "2025-11-20"
 *               fecha_fin:
 *                 type: string
 *                 format: date
 *                 example: "2025-11-25"
 *               diagnostico:
 *                 type: string
 *                 example: J06.9 Infección Respiratoria Aguda
 *               observaciones:
 *                 type: string
 *                 example: Reposo absoluto
 *               documento:
 *                 type: string
 *                 format: binary
 *                 description: PDF o imagen (JPG/PNG) - OBLIGATORIO para colaboradores
 *     responses:
 *       201:
 *         description: Incapacidad creada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Incapacidad reportada exitosamente
 *                 data:
 *                   $ref: '#/components/schemas/Incapacidad'
 *       400:
 *         description: Errores de validación
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: No autenticado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
  '/',
  authMiddleware,
  upload.single('documento'),
  IncapacidadController.crear
);

/**
 * @swagger
 * /incapacidades:
 *   get:
 *     summary: Listar incapacidades
 *     description: |
 *       **Colaborador:** Solo sus propias incapacidades
 *       
 *       **GH/Líder/Conta:** Todas las incapacidades del sistema
 *     tags: [Incapacidades]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de incapacidades
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Incapacidades obtenidas
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Incapacidad'
 *       401:
 *         description: No autenticado
 */
router.get(
  '/',
  authMiddleware,
  IncapacidadController.obtener
);

/**
 * @swagger
 * /incapacidades/validar-documento:
 *   post:
 *     summary: Validar documento con OCR
 *     description: |
 *       **Extracción automática de datos con OCR (Tesseract.js + pdf-parse)**
 *       
 *       **Campos extraídos (8):**
 *       - Nombre completo del paciente
 *       - Número de documento (cédula)
 *       - Fecha de inicio y fin
 *       - Días totales
 *       - Diagnóstico (código CIE-10)
 *       - Entidad pagadora (EPS/ARL)
 *       - Número de radicado
 *       
 *       **Sistema flexible:**
 *       - ⚠️ Advertencias: NO bloquean (campos faltantes, similitud moderada)
 *       - ❌ Errores críticos: Sí bloquean (documento ilegible, formato no soportado)
 *       - 💡 Sugerencia: APROBAR | REVISAR_MANUALMENTE | RECHAZAR
 *       
 *       **Precisión:**
 *       - PDF: 100% confianza
 *       - JPG alta calidad: 85-95%
 *       - JPG media calidad: 75-85%
 *     tags: [Incapacidades]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - documento
 *             properties:
 *               documento:
 *                 type: string
 *                 format: binary
 *                 description: PDF o imagen (JPG/PNG/WEBP)
 *     responses:
 *       200:
 *         description: Documento procesado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Análisis OCR completado
 *                 data:
 *                   type: object
 *                   properties:
 *                     tipo_detectado:
 *                       type: string
 *                       example: EPS
 *                     campos_extraidos:
 *                       type: object
 *                       properties:
 *                         nombre:
 *                           type: string
 *                           example: ADRIANA LUCIA BARRERA HENAO
 *                         documento:
 *                           type: string
 *                           example: "52468791"
 *                         fecha_inicio:
 *                           type: string
 *                           example: "2024-11-21"
 *                         fecha_fin:
 *                           type: string
 *                           example: "2024-11-25"
 *                         dias_totales:
 *                           type: integer
 *                           example: 5
 *                         diagnostico:
 *                           type: string
 *                           example: J06.9 Infección Respiratoria Aguda
 *                         entidad:
 *                           type: string
 *                           example: NUEVA EPS
 *                     confianza_ocr:
 *                       type: number
 *                       example: 94
 *                     advertencias:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           tipo:
 *                             type: string
 *                           gravedad:
 *                             type: string
 *                           mensaje:
 *                             type: string
 *                     sugerencia_para_gh:
 *                       type: object
 *                       properties:
 *                         accion_sugerida:
 *                           type: string
 *                           enum: [APROBAR, REVISAR_MANUALMENTE, RECHAZAR]
 *                           example: APROBAR
 *                         confianza:
 *                           type: number
 *                           example: 100
 *                         justificacion:
 *                           type: string
 *       400:
 *         description: No se proporcionó documento
 *       500:
 *         description: Error procesando documento
 */
router.post(
  '/validar-documento',
  authMiddleware,
  (req, res, next) => {
    upload.single('documento')(req, res, (err) => {
      if (err) {
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

/**
 * @swagger
 * /incapacidades/{id}/estado:
 *   put:
 *     summary: Cambiar estado de incapacidad
 *     description: |
 *       **Permisos:** Solo GH y Contabilidad pueden cambiar estados
 *       
 *       **Transiciones válidas:**
 *       - reportada → en_revision, rechazada
 *       - en_revision → validada, rechazada
 *       - validada → pagada
 *       - rechazada → reportada (con correcciones)
 *       - pagada → (estado final, no cambia)
 *     tags: [Incapacidades]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la incapacidad
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nuevo_estado
 *             properties:
 *               nuevo_estado:
 *                 type: string
 *                 enum: [reportada, en_revision, validada, rechazada, pagada]
 *                 example: en_revision
 *               observaciones:
 *                 type: string
 *                 example: Revisión iniciada por GH
 *     responses:
 *       200:
 *         description: Estado actualizado exitosamente
 *       400:
 *         description: Transición no permitida
 *       403:
 *         description: Sin permisos (requiere rol GH o Conta)
 *       404:
 *         description: Incapacidad no encontrada
 */
router.put(
  '/:id/estado',
  authMiddleware,
  roleMiddleware(['gh', 'conta', 'colaborador']),
  IncapacidadController.actualizarEstado
);

/**
 * @swagger
 * /incapacidades/{id}:
 *   put:
 *     summary: Actualizar datos de incapacidad rechazada
 *     description: Solo el colaborador dueño puede actualizar su incapacidad si está en estado 'rechazada'
 *     tags: [Incapacidades]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la incapacidad
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               diagnostico:
 *                 type: string
 *               fecha_inicio:
 *                 type: string
 *                 format: date
 *               fecha_fin:
 *                 type: string
 *                 format: date
 *               observaciones:
 *                 type: string
 *     responses:
 *       200:
 *         description: Incapacidad actualizada
 *       403:
 *         description: Solo el dueño o estado no es 'rechazada'
 *       404:
 *         description: Incapacidad no encontrada
 */
router.put(
  '/:id',
  authMiddleware,
  IncapacidadController.actualizar
);

/**
 * @swagger
 * /incapacidades/{id}:
 *   get:
 *     summary: Obtener incapacidad por ID
 *     description: El dueño o GH/Conta pueden ver detalles de una incapacidad
 *     tags: [Incapacidades]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la incapacidad
 *     responses:
 *       200:
 *         description: Incapacidad obtenida
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Incapacidad'
 *       403:
 *         description: Sin permisos
 *       404:
 *         description: Incapacidad no encontrada
 */
router.get(
  '/:id',
  authMiddleware,
  IncapacidadController.obtenerPorId
);

/**
 * @swagger
 * /incapacidades/{id}/documento:
 *   post:
 *     summary: Subir documento a incapacidad existente
 *     description: El dueño de la incapacidad o GH/Conta pueden subir/actualizar documento
 *     tags: [Incapacidades]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la incapacidad
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - documento
 *             properties:
 *               documento:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Documento subido exitosamente
 *       403:
 *         description: Sin permisos
 *       404:
 *         description: Incapacidad no encontrada
 */
router.post(
  '/:id/documento',
  authMiddleware,
  upload.single('documento'),
  IncapacidadController.subirDocumento
);

/**
 * @swagger
 * /incapacidades/{id}/documento:
 *   get:
 *     summary: Descargar documento de incapacidad
 *     description: El dueño de la incapacidad o GH/Conta pueden descargar el documento
 *     tags: [Incapacidades]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la incapacidad
 *     responses:
 *       200:
 *         description: Archivo del documento
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *           image/jpeg:
 *             schema:
 *               type: string
 *               format: binary
 *           image/png:
 *             schema:
 *               type: string
 *               format: binary
 *       403:
 *         description: Sin permisos
 *       404:
 *         description: Documento no encontrado
 */
router.get(
  '/:id/documento',
  authMiddleware,
  IncapacidadController.obtenerDocumento
);

/**
 * @swagger
 * /incapacidades/{id}:
 *   delete:
 *     summary: Eliminar incapacidad
 *     description: |
 *       **GH/Conta:** Pueden eliminar cualquier incapacidad
 *       
 *       **Colaboradores:** Solo pueden eliminar las suyas si están en estado 'reportada'
 *     tags: [Incapacidades]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la incapacidad
 *     responses:
 *       200:
 *         description: Incapacidad eliminada exitosamente
 *       403:
 *         description: Sin permisos para eliminar
 *       404:
 *         description: Incapacidad no encontrada
 */
router.delete(
  '/:id',
  authMiddleware,
  IncapacidadController.eliminar
);

export default router;

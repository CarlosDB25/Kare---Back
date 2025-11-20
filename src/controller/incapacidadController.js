import { IncapacidadModel } from '../models/Incapacidad.js';
import HistorialEstadoModel from '../models/HistorialEstado.js';
import NotificacionModel from '../models/Notificacion.js';
import { UsuarioModel } from '../models/Usuario.js';
import { extraerTextoDocumento } from '../services/ocrService.js';
import { analizarDocumento, calcularSimilitudNombres } from '../services/documentAnalyzer.js';
import { validarIncapacidad, validarTransicionEstado, calcularDias } from '../services/validationService.js';
import path from 'path';
import fs from 'fs';

/**
 * Controlador de incapacidades
 */
export const IncapacidadController = {
  /**
   * Crear una nueva incapacidad
   * POST /api/incapacidades
   */
  async crear(req, res) {
    try {
      const { tipo, fecha_inicio, fecha_fin, dias, diagnostico, observaciones } = req.body;
      const usuario_id = req.user.id;

      // Validar datos requeridos
      if (!tipo) {
        return res.status(400).json({
          success: false,
          message: 'El tipo de incapacidad es obligatorio',
          data: null
        });
      }

      if (!fecha_inicio || !fecha_fin) {
        return res.status(400).json({
          success: false,
          message: 'Las fechas de inicio y fin son obligatorias',
          data: null
        });
      }

      // Preparar datos para validación
      const datosIncapacidad = {
        usuario_id,
        tipo,
        fecha_inicio,
        fecha_fin,
        dias: dias || calcularDias(fecha_inicio, fecha_fin),
        diagnostico,
        observaciones
      };

      // Validar incapacidad (fechas, duplicados, límites)
      const validacion = await validarIncapacidad(datosIncapacidad);
      
      if (!validacion.valido) {
        return res.status(400).json({
          success: false,
          message: 'Errores de validación',
          data: { errores: validacion.errores }
        });
      }

      // Verificar si se subió un archivo
      const documento = req.file ? req.file.filename : null;

      // Crear incapacidad con datos validados
      const incapacidadId = await IncapacidadModel.crear({
        ...validacion.datos,
        documento
      });

      // Obtener incapacidad creada
      const incapacidadCreada = await IncapacidadModel.obtenerPorId(incapacidadId);

      res.status(201).json({
        success: true,
        message: 'Incapacidad reportada exitosamente',
        data: incapacidadCreada
      });
    } catch (error) {
      console.error('Error en crear incapacidad:', error);
      console.error('Stack:', error.stack);
      res.status(500).json({
        success: false,
        message: 'Error al crear incapacidad: ' + error.message,
        data: null
      });
    }
  },

  /**
   * Obtener incapacidades
   * GET /api/incapacidades
   * - Colaborador: solo sus incapacidades
   * - Gestión Humana/Contabilidad: todas
   */
  async obtener(req, res) {
    try {
      // TODO: Implementar obtención de incapacidades
      const { rol, id: usuarioId } = req.user;

      let incapacidades;

      if (rol === 'colab') {
        // Colaborador solo ve sus incapacidades
        incapacidades = await IncapacidadModel.obtenerPorUsuario(usuarioId);
      } else {
        // GH, Líder y Contabilidad ven todas
        incapacidades = await IncapacidadModel.obtenerTodas();
      }

      res.json({
        success: true,
        message: 'Incapacidades obtenidas',
        data: incapacidades
      });
    } catch (error) {
      console.error('Error en obtener incapacidades:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener incapacidades',
        data: null
      });
    }
  },

  /**
   * Actualizar estado de una incapacidad
   * PUT /api/incapacidades/:id/estado
   * Solo GH/Conta pueden cambiar estados
   */
  async actualizarEstado(req, res) {
    try {
      const { id } = req.params;
      const { nuevo_estado, observaciones } = req.body;

      // Validar estado
      const estadosValidos = ['reportada', 'en_revision', 'validada', 'rechazada', 'conciliada', 'pagada', 'archivada', 'radicada'];
      if (!nuevo_estado || !estadosValidos.includes(nuevo_estado)) {
        return res.status(400).json({
          success: false,
          message: 'Estado inválido',
          data: null
        });
      }

      // Verificar que la incapacidad existe
      const incapacidad = await IncapacidadModel.obtenerPorId(id);
      if (!incapacidad) {
        return res.status(404).json({
          success: false,
          message: 'Incapacidad no encontrada',
          data: null
        });
      }

      const estadoAnterior = incapacidad.estado;

      // Validar transición de estado
      const validacionTransicion = validarTransicionEstado(estadoAnterior, nuevo_estado);
      if (!validacionTransicion.valido) {
        return res.status(400).json({
          success: false,
          message: validacionTransicion.mensaje,
          data: null
        });
      }

      // Actualizar estado
      const actualizado = await IncapacidadModel.actualizarEstado(id, nuevo_estado, observaciones);

      if (actualizado) {
        // Registrar en historial
        await HistorialEstadoModel.crear({
          incapacidad_id: id,
          estado_anterior: estadoAnterior,
          estado_nuevo: nuevo_estado,
          cambiado_por: req.user.id,
          observaciones
        });

        // Crear notificación para el usuario dueño de la incapacidad
        await NotificacionModel.crear({
          usuario_id: incapacidad.usuario_id,
          tipo: 'estado_cambiado',
          titulo: `Incapacidad ${nuevo_estado}`,
          mensaje: `Tu incapacidad ${incapacidad.tipo} cambió a estado: ${nuevo_estado}. ${observaciones || ''}`,
          incapacidad_id: id
        });

        res.json({
          success: true,
          message: 'Estado actualizado exitosamente',
          data: { id, estado_anterior: estadoAnterior, estado_nuevo: nuevo_estado }
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'No se pudo actualizar el estado',
          data: null
        });
      }
    } catch (error) {
      console.error('Error en actualizar estado:', error);
      res.status(500).json({
        success: false,
        message: 'Error al actualizar estado',
        data: null
      });
    }
  },

  /**
   * Validar documento de incapacidad con OCR
   * POST /api/incapacidades/validar-documento
   * Extrae y valida información antes de crear la incapacidad
   */
  async validarDocumento(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No se proporcionó ningún documento',
          data: null
        });
      }

      const rutaArchivo = req.file.path;
      const nombreArchivo = req.file.originalname;

      // 1. Extraer texto del documento
      const { texto, confianza } = await extraerTextoDocumento(rutaArchivo, nombreArchivo);

      // 2. Verificar confianza mínima (solo para imágenes OCR)
      if (confianza < 70 && !nombreArchivo.toLowerCase().endsWith('.pdf')) {
        fs.unlinkSync(rutaArchivo);
        return res.status(400).json({
          success: false,
          message: `Documento no legible (OCR confianza: ${confianza}%). Intente con mejor calidad o use PDF`,
          data: { confianza }
        });
      }

      // 3. Analizar documento
      const { tipo, campos, errores, valido } = analizarDocumento(texto);

      // 4. Obtener datos del usuario
      const usuario = await UsuarioModel.obtenerPorId(req.user.id);
      const erroresUsuario = [];

      // 5. Validar contra datos del usuario
      if (campos.nombre && usuario.nombre) {
        const similitud = calcularSimilitudNombres(campos.nombre, usuario.nombre);
        if (similitud < 60) {
          erroresUsuario.push(
            `Nombre en documento "${campos.nombre}" no coincide suficientemente con tu perfil "${usuario.nombre}" (similitud: ${similitud}%)`
          );
        }
      }

      if (campos.documento && usuario.documento) {
        if (campos.documento !== usuario.documento.toString()) {
          erroresUsuario.push(
            `Documento en archivo (${campos.documento}) no coincide con tu perfil (${usuario.documento})`
          );
        }
      }

      // 6. Eliminar archivo temporal
      fs.unlinkSync(rutaArchivo);

      // 7. Combinar errores
      const todosLosErrores = [...errores, ...erroresUsuario];

      // 8. Responder
      res.json({
        success: todosLosErrores.length === 0,
        message: todosLosErrores.length === 0 
          ? 'Documento valido y datos coinciden' 
          : 'Se encontraron advertencias en el documento',
        data: {
          tipo_detectado: tipo,
          campos_extraidos: {
            nombre: campos.nombre,
            documento: campos.documento,
            fecha_inicio: campos.fecha_inicio,
            fecha_fin: campos.fecha_fin,
            dias_incapacidad: campos.dias_incapacidad,
            diagnostico: campos.diagnostico,
            numero_radicado: campos.numero_radicado,
            entidad: campos.entidad
          },
          confianza_ocr: confianza,
          validacion: {
            documento_legible: confianza >= 70,
            campos_completos: errores.length === 0,
            usuario_coincide: erroresUsuario.length === 0,
            errores: todosLosErrores
          }
        }
      });

    } catch (error) {
      console.error('Error validando documento:', error);

      // Limpiar archivo si existe
      if (req.file?.path && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }

      res.status(500).json({
        success: false,
        message: 'Error procesando documento: ' + error.message,
        data: null
      });
    }
  }
};

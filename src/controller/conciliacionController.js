// src/controller/conciliacionController.js
// Controlador para gestión de conciliaciones financieras

import ConciliacionModel, { calcularConciliacion } from '../models/Conciliacion.js';
import { IncapacidadModel } from '../models/Incapacidad.js';
import { UsuarioModel } from '../models/Usuario.js';
import NotificacionModel from '../models/Notificacion.js';

export const ConciliacionController = {
  /**
   * Crear conciliación para una incapacidad
   * POST /api/conciliaciones
   * Body: { incapacidad_id }
   * Requiere rol: conta
   */
  async crear(req, res) {
    try {
      const { incapacidad_id } = req.body;
      const creado_por = req.user.id;

      if (!incapacidad_id) {
        return res.status(400).json({
          success: false,
          message: 'incapacidad_id es requerido',
          data: null
        });
      }

      // Verificar que la incapacidad existe
      const incapacidad = await IncapacidadModel.obtenerPorId(incapacidad_id);
      if (!incapacidad) {
        return res.status(404).json({
          success: false,
          message: 'Incapacidad no encontrada',
          data: null
        });
      }

      // Verificar que la incapacidad está validada
      if (incapacidad.estado !== 'validada') {
        return res.status(400).json({
          success: false,
          message: 'La incapacidad debe estar en estado validada para crear conciliación',
          data: null
        });
      }

      // Verificar si ya existe una conciliación
      const conciliacionExistente = await ConciliacionModel.obtenerPorIncapacidad(incapacidad_id);
      if (conciliacionExistente) {
        return res.status(400).json({
          success: false,
          message: 'Ya existe una conciliación para esta incapacidad',
          data: conciliacionExistente
        });
      }

      // Obtener datos del usuario
      const usuario = await UsuarioModel.obtenerPorId(incapacidad.usuario_id);
      if (!usuario) {
        return res.status(404).json({
          success: false,
          message: 'Usuario de la incapacidad no encontrado',
          data: null
        });
      }

      // Calcular conciliación
      const calculoConciliacion = calcularConciliacion(incapacidad, usuario);

      // Crear conciliación en la base de datos
      const id = await ConciliacionModel.crear({
        incapacidad_id,
        dias_incapacidad: incapacidad.dias_totales || incapacidad.dias || 0,
        salario_base: usuario.salario_base || 0,
        ibc: usuario.ibc || usuario.salario_base || 0,
        valor_dia: calculoConciliacion.valor_dia,
        dias_eps_100: calculoConciliacion.dias_eps || 0,
        monto_eps_100: calculoConciliacion.valor_eps || 0,
        dias_empresa_67: calculoConciliacion.dias_empresa || 0,
        monto_empresa_67: calculoConciliacion.valor_empresa || 0,
        dias_arl_100: calculoConciliacion.dias_arl || 0,
        monto_arl_100: calculoConciliacion.valor_arl || 0,
        total_a_pagar: calculoConciliacion.valor_total,
        observaciones: calculoConciliacion.observaciones
      });

      // Cambiar estado de la incapacidad a 'pagada' automáticamente
      await IncapacidadModel.actualizarEstado(incapacidad_id, 'pagada', 'Conciliación creada automáticamente');

      // Crear notificación para el usuario de la incapacidad
      await NotificacionModel.crear({
        usuario_id: incapacidad.usuario_id,
        tipo: 'success',
        titulo: 'Conciliación creada',
        mensaje: `Se ha creado la conciliación financiera de tu incapacidad. Valor total: $${calculoConciliacion.valor_total.toLocaleString('es-CO')}`,
        incapacidad_id
      });

      const conciliacion = await ConciliacionModel.obtenerPorIncapacidad(incapacidad_id);

      res.status(201).json({
        success: true,
        message: 'Conciliación creada exitosamente',
        data: conciliacion
      });
    } catch (error) {
      console.error('Error creando conciliación:', error);
      console.error('Stack:', error.stack);
      res.status(500).json({
        success: false,
        message: 'Error al crear conciliación: ' + error.message,
        data: null
      });
    }
  },

  /**
   * Obtener conciliación de una incapacidad
   * GET /api/conciliaciones/incapacidad/:incapacidad_id
   */
  async obtenerPorIncapacidad(req, res) {
    try {
      const { incapacidad_id } = req.params;
      const conciliaciones = await ConciliacionModel.obtenerPorIncapacidad(incapacidad_id);

      if (conciliaciones.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'No se encontró conciliación para esta incapacidad',
          data: null
        });
      }

      res.json({
        success: true,
        message: 'Conciliación obtenida',
        data: conciliaciones[0]
      });
    } catch (error) {
      console.error('Error obteniendo conciliación:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener conciliación',
        data: null
      });
    }
  },

  /**
   * Listar todas las conciliaciones (con filtros)
   * GET /api/conciliaciones
   * Query params: ?mes=2024-01&limit=50
   * Requiere rol: conta, gh
   */
  async listar(req, res) {
    try {
      const { mes, limit } = req.query;
      const conciliaciones = await ConciliacionModel.listar({ mes, limit: limit ? parseInt(limit) : 100 });

      res.json({
        success: true,
        message: 'Conciliaciones obtenidas',
        data: conciliaciones
      });
    } catch (error) {
      console.error('Error listando conciliaciones:', error);
      res.status(500).json({
        success: false,
        message: 'Error al listar conciliaciones',
        data: null
      });
    }
  },

  /**
   * Obtener estadísticas de conciliaciones
   * GET /api/conciliaciones/estadisticas
   * Query params: ?fecha_inicio=2024-01-01&fecha_fin=2024-01-31
   * Requiere rol: conta, gh
   */
  async obtenerEstadisticas(req, res) {
    try {
      const { fecha_inicio, fecha_fin } = req.query;
      const stats = await ConciliacionModel.obtenerEstadisticas({ fecha_inicio, fecha_fin });

      res.json({
        success: true,
        message: 'Estadísticas obtenidas',
        data: stats
      });
    } catch (error) {
      console.error('Error obteniendo estadísticas:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener estadísticas',
        data: null
      });
    }
  },

  /**
   * Actualizar estado de pago de conciliación
   * PUT /api/conciliaciones/:id
   * Body: { pagado: true, fecha_pago: '2024-01-15' }
   * Requiere rol: conta
   */
  async actualizar(req, res) {
    try {
      const { id } = req.params;
      const { pagado, fecha_pago, observaciones } = req.body;

      const cambios = await ConciliacionModel.actualizar(id, {
        pagado,
        fecha_pago,
        observaciones
      });

      if (cambios === 0) {
        return res.status(404).json({
          success: false,
          message: 'Conciliación no encontrada',
          data: null
        });
      }

      // Obtener la conciliación actualizada
      const conciliaciones = await ConciliacionModel.obtenerPorIncapacidad(
        (await ConciliacionModel.listar({ limit: 1000 }))
          .find(c => c.id === parseInt(id))?.incapacidad_id
      );

      res.json({
        success: true,
        message: 'Conciliación actualizada',
        data: conciliaciones[0]
      });
    } catch (error) {
      console.error('Error actualizando conciliación:', error);
      res.status(500).json({
        success: false,
        message: 'Error al actualizar conciliación',
        data: null
      });
    }
  }
};

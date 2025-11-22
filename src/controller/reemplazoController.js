// src/controller/reemplazoController.js
// Controlador para gestión de reemplazos temporales

import ReemplazoModel from '../models/Reemplazo.js';
import { IncapacidadModel } from '../models/Incapacidad.js';
import { UsuarioModel } from '../models/Usuario.js';
import NotificacionModel from '../models/Notificacion.js';

export const ReemplazoController = {
  /**
   * Crear un nuevo reemplazo
   * POST /api/reemplazos
   * Body: { incapacidad_id, colaborador_reemplazo_id, fecha_inicio, fecha_fin, funciones_asignadas, observaciones }
   * Requiere rol: lider
   */
  async crear(req, res) {
    try {
      const {
        incapacidad_id,
        colaborador_reemplazo_id,
        fecha_inicio,
        fecha_fin,
        observaciones
      } = req.body;

      // Validar datos requeridos
      if (!incapacidad_id || !colaborador_reemplazo_id || !fecha_inicio || !fecha_fin) {
        return res.status(400).json({
          success: false,
          message: 'Faltan datos requeridos: incapacidad_id, colaborador_reemplazo_id, fecha_inicio, fecha_fin',
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

      // Verificar que el colaborador de reemplazo existe
      const colaboradorReemplazo = await UsuarioModel.obtenerPorId(colaborador_reemplazo_id);
      if (!colaboradorReemplazo) {
        return res.status(404).json({
          success: false,
          message: 'Colaborador de reemplazo no encontrado',
          data: null
        });
      }

      // Validar que no sea el mismo colaborador
      if (incapacidad.usuario_id === colaborador_reemplazo_id) {
        return res.status(400).json({
          success: false,
          message: 'El colaborador de reemplazo no puede ser el mismo que el colaborador ausente',
          data: null
        });
      }

      // Verificar que el colaborador de reemplazo no tenga otro reemplazo activo en el mismo periodo
      const tieneReemplazoActivo = await ReemplazoModel.tieneReemplazoActivo(
        colaborador_reemplazo_id,
        fecha_inicio,
        fecha_fin
      );

      if (tieneReemplazoActivo) {
        return res.status(400).json({
          success: false,
          message: 'El colaborador ya tiene un reemplazo activo en el periodo indicado',
          data: null
        });
      }

      // Crear reemplazo
      const reemplazoId = await ReemplazoModel.crear({
        incapacidad_id,
        colaborador_reemplazo_id,
        fecha_inicio,
        fecha_fin,
        observaciones,
        created_by: req.user.id
      });

      // Obtener reemplazo creado con toda la información
      const reemplazo = await ReemplazoModel.obtenerPorId(reemplazoId);

      // Notificar al colaborador de reemplazo
      await NotificacionModel.crear({
        usuario_id: colaborador_reemplazo_id,
        tipo: 'info',
        titulo: 'Nuevo reemplazo asignado',
        mensaje: `Se te ha asignado un reemplazo de ${reemplazo.nombre_ausente} del ${fecha_inicio} al ${fecha_fin}`,
        incapacidad_id
      });

      // Notificar al colaborador ausente
      await NotificacionModel.crear({
        usuario_id: incapacidad.usuario_id,
        tipo: 'success',
        titulo: 'Reemplazo asignado',
        mensaje: `${colaboradorReemplazo.nombre} cubrirá tus funciones durante tu incapacidad`,
        incapacidad_id
      });

      res.status(201).json({
        success: true,
        message: 'Reemplazo creado exitosamente',
        data: reemplazo
      });
    } catch (error) {
      console.error('Error creando reemplazo:', error);
      res.status(500).json({
        success: false,
        message: 'Error al crear reemplazo: ' + error.message,
        data: null
      });
    }
  },

  /**
   * Listar reemplazos
   * GET /api/reemplazos?estado=activo&colaborador_id=1
   */
  async listar(req, res) {
    try {
      const { estado, colaborador_reemplazo_id, colaborador_ausente_id } = req.query;
      const { rol, id: usuarioId } = req.user;

      let filtros = { estado, colaborador_reemplazo_id, colaborador_ausente_id };

      // Si es colaborador, no puede listar todos los reemplazos
      if (rol === 'colaborador') {
        return res.status(403).json({
          success: false,
          message: 'No tiene permisos para listar todos los reemplazos',
          data: null
        });
      }

      // Líder, GH, Conta ven todos los reemplazos
      const reemplazos = await ReemplazoModel.listar(filtros);

      res.json({
        success: true,
        message: 'Reemplazos obtenidos',
        data: reemplazos
      });
    } catch (error) {
      console.error('Error listando reemplazos:', error);
      res.status(500).json({
        success: false,
        message: 'Error al listar reemplazos',
        data: null
      });
    }
  },

  /**
   * Obtener un reemplazo por ID
   * GET /api/reemplazos/:id
   */
  async obtenerPorId(req, res) {
    try {
      const { id } = req.params;

      const reemplazo = await ReemplazoModel.obtenerPorId(id);

      if (!reemplazo) {
        return res.status(404).json({
          success: false,
          message: 'Reemplazo no encontrado',
          data: null
        });
      }

      res.json({
        success: true,
        message: 'Reemplazo obtenido',
        data: reemplazo
      });
    } catch (error) {
      console.error('Error obteniendo reemplazo:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener reemplazo',
        data: null
      });
    }
  },

  /**
   * Obtener reemplazos de una incapacidad
   * GET /api/reemplazos/incapacidad/:incapacidad_id
   */
  async obtenerPorIncapacidad(req, res) {
    try {
      const { incapacidad_id } = req.params;

      const reemplazos = await ReemplazoModel.obtenerPorIncapacidad(incapacidad_id);

      res.json({
        success: true,
        message: 'Reemplazos obtenidos',
        data: reemplazos
      });
    } catch (error) {
      console.error('Error obteniendo reemplazos por incapacidad:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener reemplazos',
        data: null
      });
    }
  },

  /**
   * Obtener mis reemplazos activos (los que estoy cubriendo)
   * GET /api/reemplazos/mis-reemplazos
   */
  async obtenerMisReemplazos(req, res) {
    try {
      const colaborador_id = req.user.id;

      const reemplazos = await ReemplazoModel.obtenerActivosDeColaborador(colaborador_id);

      res.json({
        success: true,
        message: 'Mis reemplazos activos',
        data: reemplazos
      });
    } catch (error) {
      console.error('Error obteniendo mis reemplazos:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener reemplazos',
        data: null
      });
    }
  },

  /**
   * Listar reemplazos activos
   * GET /api/reemplazos/activos
   */
  async listarActivos(req, res) {
    try {
      const reemplazos = await ReemplazoModel.listar({ estado: 'activo' });

      res.json({
        success: true,
        message: 'Reemplazos activos obtenidos',
        data: reemplazos
      });
    } catch (error) {
      console.error('Error listando reemplazos activos:', error);
      res.status(500).json({
        success: false,
        message: 'Error al listar reemplazos activos',
        data: null
      });
    }
  },

  /**
   * Listar reemplazos activos
   * GET /api/reemplazos/activos
   */
  async listarActivos(req, res) {
    try {
      const reemplazos = await ReemplazoModel.listar({ estado: 'activo' });

      res.json({
        success: true,
        message: 'Reemplazos activos obtenidos',
        data: reemplazos
      });
    } catch (error) {
      console.error('Error listando reemplazos activos:', error);
      res.status(500).json({
        success: false,
        message: 'Error al listar reemplazos activos',
        data: null
      });
    }
  },

  /**
   * Finalizar un reemplazo
   * PUT /api/reemplazos/:id/finalizar
   * Requiere rol: lider
   */
  async finalizar(req, res) {
    try {
      const { id } = req.params;
      const { observaciones } = req.body;

      const reemplazo = await ReemplazoModel.obtenerPorId(id);

      if (!reemplazo) {
        return res.status(404).json({
          success: false,
          message: 'Reemplazo no encontrado',
          data: null
        });
      }

      if (reemplazo.estado !== 'activo') {
        return res.status(400).json({
          success: false,
          message: `No se puede finalizar un reemplazo en estado '${reemplazo.estado}'`,
          data: null
        });
      }

      const finalizado = await ReemplazoModel.finalizar(id, observaciones);

      if (finalizado) {
        // Notificar al colaborador de reemplazo
        await NotificacionModel.crear({
          usuario_id: reemplazo.colaborador_reemplazo_id,
          tipo: 'success',
          titulo: 'Reemplazo finalizado',
          mensaje: `Tu reemplazo de ${reemplazo.nombre_ausente} ha finalizado. ${observaciones || ''}`,
          incapacidad_id: reemplazo.incapacidad_id
        });

        res.json({
          success: true,
          message: 'Reemplazo finalizado exitosamente',
          data: { id, estado: 'finalizado' }
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Error al finalizar reemplazo',
          data: null
        });
      }
    } catch (error) {
      console.error('Error finalizando reemplazo:', error);
      res.status(500).json({
        success: false,
        message: 'Error al finalizar reemplazo',
        data: null
      });
    }
  },

  /**
   * Cancelar un reemplazo
   * PUT /api/reemplazos/:id/cancelar
   * Requiere rol: lider
   */
  async cancelar(req, res) {
    try {
      const { id } = req.params;
      const { observaciones } = req.body;

      if (!observaciones) {
        return res.status(400).json({
          success: false,
          message: 'Las observaciones son requeridas para cancelar un reemplazo',
          data: null
        });
      }

      const reemplazo = await ReemplazoModel.obtenerPorId(id);

      if (!reemplazo) {
        return res.status(404).json({
          success: false,
          message: 'Reemplazo no encontrado',
          data: null
        });
      }

      const cancelado = await ReemplazoModel.cancelar(id, observaciones);

      if (cancelado) {
        // Notificar al colaborador de reemplazo
        await NotificacionModel.crear({
          usuario_id: reemplazo.colaborador_reemplazo_id,
          tipo: 'warning',
          titulo: 'Reemplazo cancelado',
          mensaje: `Tu reemplazo de ${reemplazo.nombre_ausente} ha sido cancelado. Motivo: ${observaciones}`,
          incapacidad_id: reemplazo.incapacidad_id
        });

        res.json({
          success: true,
          message: 'Reemplazo cancelado exitosamente',
          data: { id, estado: 'cancelado' }
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Error al cancelar reemplazo',
          data: null
        });
      }
    } catch (error) {
      console.error('Error cancelando reemplazo:', error);
      res.status(500).json({
        success: false,
        message: 'Error al cancelar reemplazo',
        data: null
      });
    }
  },

  /**
   * Obtener estadísticas de reemplazos
   * GET /api/reemplazos/estadisticas?fecha_inicio=2024-01-01&fecha_fin=2024-12-31
   * Requiere rol: gh, conta, lider
   */
  async obtenerEstadisticas(req, res) {
    try {
      const { fecha_inicio, fecha_fin } = req.query;

      const stats = await ReemplazoModel.obtenerEstadisticas({ fecha_inicio, fecha_fin });

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
  }
};

// src/controller/notificacionController.js
// Controlador para gestión de notificaciones

import NotificacionModel from '../models/Notificacion.js';

export const NotificacionController = {
  /**
   * Obtener notificaciones del usuario actual
   * GET /api/notificaciones
   */
  async obtenerMisNotificaciones(req, res) {
    try {
      const usuario_id = req.user.id;
      const { solo_no_leidas } = req.query;

      const notificaciones = await NotificacionModel.obtenerPorUsuario(usuario_id, {
        solo_no_leidas: solo_no_leidas === 'true'
      });

      res.json({
        success: true,
        message: 'Notificaciones obtenidas',
        data: notificaciones
      });
    } catch (error) {
      console.error('Error obteniendo notificaciones:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener notificaciones',
        data: null
      });
    }
  },

  /**
   * Contar notificaciones no leídas
   * GET /api/notificaciones/no-leidas/count
   */
  async contarNoLeidas(req, res) {
    try {
      const usuario_id = req.user.id;
      const count = await NotificacionModel.contarNoLeidas(usuario_id);

      res.json({
        success: true,
        message: 'Contador de no leídas',
        data: { count }
      });
    } catch (error) {
      console.error('Error contando notificaciones:', error);
      res.status(500).json({
        success: false,
        message: 'Error al contar notificaciones',
        data: null
      });
    }
  },

  /**
   * Marcar notificación como leída
   * PUT /api/notificaciones/:id/leer
   */
  async marcarLeida(req, res) {
    try {
      const { id } = req.params;
      const usuario_id = req.user.id;

      const cambios = await NotificacionModel.marcarComoLeida(id, usuario_id);

      if (cambios === 0) {
        return res.status(404).json({
          success: false,
          message: 'Notificación no encontrada o no pertenece al usuario',
          data: null
        });
      }

      res.json({
        success: true,
        message: 'Notificación marcada como leída',
        data: { id }
      });
    } catch (error) {
      console.error('Error marcando como leída:', error);
      res.status(500).json({
        success: false,
        message: 'Error al marcar notificación',
        data: null
      });
    }
  },

  /**
   * Marcar todas las notificaciones como leídas
   * PUT /api/notificaciones/leer-todas
   */
  async marcarTodasLeidas(req, res) {
    try {
      const usuario_id = req.user.id;
      const cambios = await NotificacionModel.marcarTodasLeidas(usuario_id);

      res.json({
        success: true,
        message: `${cambios} notificaciones marcadas como leídas`,
        data: { actualizadas: cambios }
      });
    } catch (error) {
      console.error('Error marcando todas como leídas:', error);
      res.status(500).json({
        success: false,
        message: 'Error al marcar notificaciones',
        data: null
      });
    }
  },

  /**
   * Eliminar notificación
   * DELETE /api/notificaciones/:id
   */
  async eliminar(req, res) {
    try {
      const { id } = req.params;
      const usuario_id = req.user.id;

      const cambios = await NotificacionModel.eliminar(id, usuario_id);

      if (cambios === 0) {
        return res.status(404).json({
          success: false,
          message: 'Notificación no encontrada',
          data: null
        });
      }

      res.json({
        success: true,
        message: 'Notificación eliminada',
        data: { id }
      });
    } catch (error) {
      console.error('Error eliminando notificación:', error);
      res.status(500).json({
        success: false,
        message: 'Error al eliminar notificación',
        data: null
      });
    }
  }
};

import { UsuarioModel } from '../models/Usuario.js';

/**
 * Controlador de usuarios (administración)
 */
export const UsuarioController = {
  /**
   * Obtener usuario por ID
   * GET /api/usuarios/:id
   */
  async obtenerPorId(req, res) {
    try {
      const { id } = req.params;
      const usuario = await UsuarioModel.obtenerPorId(id);

      if (!usuario) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado',
          data: null
        });
      }

      // No enviar el password
      delete usuario.password;

      res.json({
        success: true,
        message: 'Usuario obtenido',
        data: usuario
      });
    } catch (error) {
      console.error('Error en obtener usuario:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener usuario',
        data: null
      });
    }
  },

  /**
   * Obtener todos los usuarios
   * GET /api/usuarios
   * Solo GH puede acceder
   */
  async obtenerTodos(req, res) {
    try {
      const usuarios = await UsuarioModel.obtenerTodos();

      res.json({
        success: true,
        message: 'Usuarios obtenidos',
        data: usuarios
      });
    } catch (error) {
      console.error('Error en obtener usuarios:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener usuarios',
        data: null
      });
    }
  },

  /**
   * Actualizar rol de un usuario
   * PUT /api/usuarios/:id/rol
   * Solo GH puede acceder
   */
  async actualizarRol(req, res) {
    try {
      const { id } = req.params;
      const { rol } = req.body;

      // Validar rol
      const rolesValidos = ['colab', 'gh', 'lider', 'conta'];
      if (!rolesValidos.includes(rol)) {
        return res.status(400).json({
          success: false,
          message: 'Rol inválido',
          data: null
        });
      }

      // Verificar que el usuario existe
      const usuario = await UsuarioModel.buscarPorId(id);
      if (!usuario) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado',
          data: null
        });
      }

      // Actualizar rol
      const actualizado = await UsuarioModel.actualizarRol(id, rol);

      if (actualizado) {
        res.json({
          success: true,
          message: 'Rol actualizado exitosamente',
          data: { id, rol }
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'No se pudo actualizar el rol',
          data: null
        });
      }
    } catch (error) {
      console.error('Error en actualizar rol:', error);
      res.status(500).json({
        success: false,
        message: 'Error al actualizar rol',
        data: null
      });
    }
  }
};

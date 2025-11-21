import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UsuarioModel } from '../models/Usuario.js';

/**
 * Controlador de autenticación
 */
export const AuthController = {
  /**
   * Registrar un nuevo usuario
   * POST /api/auth/register
   */
  async register(req, res) {
    try {
      const { nombre, email, password, rol } = req.body;

      // Validar datos
      if (!nombre || !email || !password || !rol) {
        return res.status(400).json({
          success: false,
          message: 'Todos los campos son obligatorios',
          data: null
        });
      }

      // Validar rol
      const rolesValidos = ['colab', 'gh', 'lider', 'conta'];
      if (!rolesValidos.includes(rol)) {
        return res.status(400).json({
          success: false,
          message: 'Rol inválido',
          data: null
        });
      }

      // Verificar si el usuario ya existe
      const usuarioExistente = await UsuarioModel.buscarPorEmail(email);
      if (usuarioExistente) {
        return res.status(400).json({
          success: false,
          message: 'El email ya está registrado',
          data: null
        });
      }

      // Hash de la contraseña
      const passwordHash = await bcrypt.hash(password, 10);

      // Crear usuario
      const usuarioId = await UsuarioModel.crear({
        nombre,
        email,
        password: passwordHash,
        rol
      });

      res.status(201).json({
        success: true,
        message: 'Usuario registrado exitosamente',
        data: { id: usuarioId, nombre, email, rol }
      });
    } catch (error) {
      console.error('Error en register:', error);
      res.status(500).json({
        success: false,
        message: 'Error al registrar usuario',
        data: null
      });
    }
  },

  /**
   * Iniciar sesión
   * POST /api/auth/login
   */
  async login(req, res) {
    try {
      const { email, password } = req.body;

      // Validar datos
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email y contraseña son obligatorios',
          data: null
        });
      }

      // Buscar usuario
      const usuario = await UsuarioModel.buscarPorEmail(email);
      if (!usuario) {
        return res.status(401).json({
          success: false,
          message: 'Credenciales inválidas',
          data: null
        });
      }

      // Verificar contraseña
      const passwordValido = await bcrypt.compare(password, usuario.password);
      if (!passwordValido) {
        return res.status(401).json({
          success: false,
          message: 'Credenciales inválidas',
          data: null
        });
      }

      // Generar token JWT
      const token = jwt.sign(
        { 
          id: usuario.id, 
          email: usuario.email, 
          rol: usuario.rol 
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
      );

      res.json({
        success: true,
        message: 'Inicio de sesión exitoso',
        data: {
          token,
          usuario: {
            id: usuario.id,
            nombre: usuario.nombre,
            email: usuario.email,
            rol: usuario.rol
          }
        }
      });
    } catch (error) {
      console.error('Error en login:', error);
      res.status(500).json({
        success: false,
        message: 'Error al iniciar sesión',
        data: null
      });
    }
  },

  /**
   * Obtener perfil del usuario autenticado
   * GET /api/auth/profile
   */
  async profile(req, res) {
    try {
      const usuario = await UsuarioModel.obtenerPorId(req.user.id);
      
      if (!usuario) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado',
          data: null
        });
      }

      // Eliminar password de la respuesta
      const { password, ...datosUsuario } = usuario;

      res.json({
        success: true,
        message: 'Perfil obtenido',
        data: datosUsuario
      });
    } catch (error) {
      console.error('Error en profile:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener perfil',
        data: null
      });
    }
  }
};

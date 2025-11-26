import { getDatabase } from '../db/database.js';

/**
 * Modelo para la tabla de usuarios
 */
export const UsuarioModel = {
  /**
   * Crear un nuevo usuario
   */
  async crear(usuario) {
    const db = getDatabase();
    const { nombre, email, password, rol, documento } = usuario;

    const result = await db.run(
      'INSERT INTO usuarios (nombre, email, password, rol, documento) VALUES (?, ?, ?, ?, ?)',
      [nombre, email, password, rol, documento]
    );

    return result.lastID;
  },

  /**
   * Buscar usuario por email
   */
  async buscarPorEmail(email) {
    const db = getDatabase();
    return await db.get('SELECT * FROM usuarios WHERE email = ?', [email]);
  },

  /**
   * Buscar usuario por ID
   */
  async buscarPorId(id) {
    const db = getDatabase();
    return await db.get('SELECT * FROM usuarios WHERE id = ?', [id]);
  },

  /**
   * Obtener usuario por ID (alias de buscarPorId)
   */
  async obtenerPorId(id) {
    return await this.buscarPorId(id);
  },

  /**
   * Obtener todos los usuarios
   */
  async obtenerTodos() {
    const db = getDatabase();
    return await db.all('SELECT id, nombre, email, rol, area, cargo, ibc, salario_base as salario, created_at FROM usuarios');
  },

  /**
   * Obtener usuarios por roles específicos
   */
  async obtenerPorRoles(roles) {
    const db = getDatabase();
    const placeholders = roles.map(() => '?').join(',');
    return await db.all(
      `SELECT id, nombre, email, rol FROM usuarios WHERE rol IN (${placeholders})`,
      roles
    );
  },

  /**
   * Obtener usuarios por un rol específico
   */
  async obtenerPorRol(rol) {
    const db = getDatabase();
    return await db.all(
      'SELECT id, nombre, email, rol FROM usuarios WHERE rol = ?',
      [rol]
    );
  },

  /**
   * Actualizar rol de un usuario
   */
  async actualizarRol(id, nuevoRol) {
    const db = getDatabase();
    const result = await db.run(
      'UPDATE usuarios SET rol = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [nuevoRol, id]
    );

    return result.changes > 0;
  }
};

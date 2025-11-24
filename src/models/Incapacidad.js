import { getDatabase } from '../db/database.js';

/**
 * Modelo para la tabla de incapacidades
 */
export const IncapacidadModel = {
  /**
   * Crear una nueva incapacidad
   */
  async crear(incapacidad) {
    const db = getDatabase();
    const { 
      usuario_id, 
      tipo, 
      fecha_inicio, 
      fecha_fin, 
      dias, 
      diagnostico, 
      documento_url, 
      observaciones
    } = incapacidad;

    const result = await db.run(
      `INSERT INTO incapacidades 
       (usuario_id, tipo, fecha_inicio, fecha_fin, dias_totales, diagnostico, 
        documento_url, observaciones, estado) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [usuario_id, tipo, fecha_inicio, fecha_fin, dias, diagnostico, 
       documento_url, observaciones, 'reportada']
    );

    return result.lastID;
  },

  /**
   * Obtener incapacidades por usuario
   */
  async obtenerPorUsuario(usuarioId) {
    const db = getDatabase();
    return await db.all(
      'SELECT * FROM incapacidades WHERE usuario_id = ? ORDER BY created_at DESC',
      [usuarioId]
    );
  },

  /**
   * Obtener todas las incapacidades
   */
  async obtenerTodas() {
    const db = getDatabase();
    return await db.all(`
      SELECT i.*, u.nombre as usuario_nombre, u.email as usuario_email 
      FROM incapacidades i 
      LEFT JOIN usuarios u ON i.usuario_id = u.id 
      ORDER BY i.created_at DESC
    `);
  },

  /**
   * Obtener incapacidad por ID
   */
  async obtenerPorId(id) {
    const db = getDatabase();
    return await db.get(
      `SELECT 
        i.*,
        u.nombre as usuario_nombre,
        u.email as usuario_email,
        u.ibc as usuario_ibc
      FROM incapacidades i
      LEFT JOIN usuarios u ON i.usuario_id = u.id
      WHERE i.id = ?`,
      [id]
    );
  },

  /**
   * Actualizar estado de una incapacidad
   */
  async actualizarEstado(id, nuevoEstado, observaciones = null) {
    const db = getDatabase();
    
    if (observaciones) {
      const result = await db.run(
        'UPDATE incapacidades SET estado = ?, observaciones = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [nuevoEstado, observaciones, id]
      );
      return result.changes > 0;
    } else {
      const result = await db.run(
        'UPDATE incapacidades SET estado = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [nuevoEstado, id]
      );
      return result.changes > 0;
    }
  },

  /**
   * Obtener incapacidades por estado
   */
  async obtenerPorEstado(estado) {
    const db = getDatabase();
    return await db.all(
      'SELECT * FROM incapacidades WHERE estado = ? ORDER BY created_at DESC',
      [estado]
    );
  }
};

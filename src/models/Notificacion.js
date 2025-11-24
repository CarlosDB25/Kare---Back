// src/models/Notificacion.js
// Modelo para sistema de notificaciones internas

import { getDatabase } from '../db/database.js';

export default class NotificacionModel {
  /**
   * Crea una nueva notificación
   */
  static async crear(datos) {
    const { usuario_id, tipo, titulo, mensaje, incapacidad_id } = datos;
    const db = getDatabase();
    
    const result = await db.run(
      `INSERT INTO notificaciones 
       (usuario_id, tipo, titulo, mensaje, incapacidad_id)
       VALUES (?, ?, ?, ?, ?)`,
      [usuario_id, tipo, titulo, mensaje, incapacidad_id || null]
    );
    
    return result.lastID;
  }
  
  /**
   * Obtiene las notificaciones de un usuario
   */
  static async obtenerPorUsuario(usuario_id, opciones = {}) {
    const db = getDatabase();
    
    const { solo_no_leidas = false, limite = 50 } = opciones;
    
    let query = `
      SELECT 
        n.*,
        i.tipo as incapacidad_tipo,
        i.estado as incapacidad_estado
      FROM notificaciones n
      LEFT JOIN incapacidades i ON n.incapacidad_id = i.id
      WHERE n.usuario_id = ?
    `;
    
    if (solo_no_leidas) {
      query += ` AND n.leida = 0`;
    }
    
    query += ` ORDER BY n.created_at DESC LIMIT ?`;
    
    return db.all(query, [usuario_id, limite]);
  }
  
  /**
   * Marca una notificación como leída
   */
  static async marcarComoLeida(id, usuario_id) {
    const db = getDatabase();
    
    const result = await db.run(
      `UPDATE notificaciones 
       SET leida = 1 
       WHERE id = ? AND usuario_id = ?`,
      [id, usuario_id]
    );
    
    return result.changes;
  }
  
  /**
   * Marca todas las notificaciones de un usuario como leídas
   */
  static async marcarTodasLeidas(usuario_id) {
    const db = getDatabase();
    
    const result = await db.run(
      `UPDATE notificaciones 
       SET leida = 1 
       WHERE usuario_id = ? AND leida = 0`,
      [usuario_id]
    );
    
    return result.changes;
  }
  
  /**
   * Cuenta las notificaciones no leídas de un usuario
   */
  static async contarNoLeidas(usuario_id) {
    const db = getDatabase();
    
    const result = await db.get(
      `SELECT COUNT(*) as count 
       FROM notificaciones 
       WHERE usuario_id = ? AND leida = 0`,
      [usuario_id]
    );
    
    return result.count;
  }
  
  /**
   * Elimina una notificación
   */
  static async eliminar(id, usuario_id) {
    const db = getDatabase();
    
    const result = await db.run(
      `DELETE FROM notificaciones 
       WHERE id = ? AND usuario_id = ?`,
      [id, usuario_id]
    );
    
    return result.changes;
  }
  
  /**
   * Elimina notificaciones antiguas (más de X días)
   */
  static async limpiarAntiguas(dias = 30) {
    const db = getDatabase();
    
    const result = await db.run(
      `DELETE FROM notificaciones 
       WHERE leida = 1 
       AND DATE(created_at) < DATE('now', '-' || ? || ' days')`,
      [dias]
    );
    
    return result.changes;
  }
}

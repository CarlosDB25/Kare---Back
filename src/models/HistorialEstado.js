// src/models/HistorialEstado.js
// Modelo para auditoría de cambios de estado de incapacidades

import { getDatabase } from '../db/database.js';

export default class HistorialEstadoModel {
  /**
   * Registra un cambio de estado en el historial
   */
  static async crear(datos) {
    const { 
      incapacidad_id, 
      estado_anterior, 
      estado_nuevo, 
      usuario_cambio_id, 
      observaciones 
    } = datos;
    
    const db = getDatabase();
    
    const result = await db.run(
      `INSERT INTO historial_estados 
       (incapacidad_id, estado_anterior, estado_nuevo, usuario_cambio_id, observaciones)
       VALUES (?, ?, ?, ?, ?)`,
      [incapacidad_id, estado_anterior, estado_nuevo, usuario_cambio_id, observaciones || null]
    );
    
    return result.lastID;
  }
  
  /**
   * Obtiene el historial completo de una incapacidad
   */
  static async obtenerPorIncapacidad(incapacidad_id) {
    const db = getDatabase();
    
    const historial = await db.all(
      `SELECT 
        h.*,
        u.nombre as cambiado_por_nombre,
        u.rol as cambiado_por_rol
       FROM historial_estados h
       LEFT JOIN usuarios u ON h.usuario_cambio_id = u.id
       WHERE h.incapacidad_id = ?
       ORDER BY h.created_at DESC`,
      [incapacidad_id]
    );
    
    return historial;
  }
  
  /**
   * Obtiene el último cambio de estado de una incapacidad
   */
  static async obtenerUltimo(incapacidad_id) {
    const db = getDatabase();
    
    const ultimo = await db.get(
      `SELECT 
        h.*,
        u.nombre as cambiado_por_nombre
       FROM historial_estados h
       LEFT JOIN usuarios u ON h.usuario_cambio_id = u.id
       WHERE h.incapacidad_id = ?
       ORDER BY h.created_at DESC
       LIMIT 1`,
      [incapacidad_id]
    );
    
    return ultimo;
  }
  
  /**
   * Obtiene estadísticas de cambios de estado
   */
  static async obtenerEstadisticas(fecha_inicio, fecha_fin) {
    const db = getDatabase();
    
    let query = `
      SELECT 
        estado_nuevo,
        COUNT(*) as total,
        COUNT(DISTINCT incapacidad_id) as incapacidades_unicas
      FROM historial_estados
      WHERE 1=1
    `;
    
    const params = [];
    
    if (fecha_inicio) {
      query += ` AND DATE(created_at) >= ?`;
      params.push(fecha_inicio);
    }
    
    if (fecha_fin) {
      query += ` AND DATE(created_at) <= ?`;
      params.push(fecha_fin);
    }
    
    query += ` GROUP BY estado_nuevo ORDER BY total DESC`;
    
    return db.all(query, params);
  }
}

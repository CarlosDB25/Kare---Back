// src/models/Reemplazo.js
// Modelo para gestión de reemplazos temporales durante incapacidades

import { getDatabase } from '../db/database.js';

export default class ReemplazoModel {
  /**
   * Crear un nuevo reemplazo
   */
  static async crear(datos) {
    const {
      incapacidad_id,
      colaborador_ausente_id,
      colaborador_reemplazo_id,
      fecha_inicio,
      fecha_fin,
      funciones_asignadas,
      observaciones,
      asignado_por
    } = datos;

    const db = getDatabase();

    const result = await db.run(
      `INSERT INTO reemplazos (
        incapacidad_id, colaborador_ausente_id, colaborador_reemplazo_id,
        fecha_inicio, fecha_fin, funciones_asignadas, observaciones, asignado_por, estado
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'activo')`,
      [
        incapacidad_id,
        colaborador_ausente_id,
        colaborador_reemplazo_id,
        fecha_inicio,
        fecha_fin,
        funciones_asignadas,
        observaciones,
        asignado_por
      ]
    );

    return result.lastID;
  }

  /**
   * Obtener reemplazo por ID con información de colaboradores
   */
  static async obtenerPorId(id) {
    const db = getDatabase();

    const reemplazo = await db.get(
      `SELECT 
        r.*,
        u_ausente.nombre as nombre_ausente,
        u_ausente.cargo as cargo_ausente,
        u_reemplazo.nombre as nombre_reemplazo,
        u_reemplazo.cargo as cargo_reemplazo,
        u_lider.nombre as nombre_lider,
        i.tipo as tipo_incapacidad,
        i.estado as estado_incapacidad
      FROM reemplazos r
      LEFT JOIN usuarios u_ausente ON r.colaborador_ausente_id = u_ausente.id
      LEFT JOIN usuarios u_reemplazo ON r.colaborador_reemplazo_id = u_reemplazo.id
      LEFT JOIN usuarios u_lider ON r.asignado_por = u_lider.id
      LEFT JOIN incapacidades i ON r.incapacidad_id = i.id
      WHERE r.id = ?`,
      [id]
    );

    return reemplazo;
  }

  /**
   * Listar reemplazos con filtros
   */
  static async listar(filtros = {}) {
    const db = getDatabase();
    const { estado, colaborador_reemplazo_id, colaborador_ausente_id } = filtros;

    let query = `
      SELECT 
        r.*,
        u_ausente.nombre as nombre_ausente,
        u_reemplazo.nombre as nombre_reemplazo,
        i.tipo as tipo_incapacidad
      FROM reemplazos r
      LEFT JOIN usuarios u_ausente ON r.colaborador_ausente_id = u_ausente.id
      LEFT JOIN usuarios u_reemplazo ON r.colaborador_reemplazo_id = u_reemplazo.id
      LEFT JOIN incapacidades i ON r.incapacidad_id = i.id
      WHERE 1=1
    `;

    const params = [];

    if (estado) {
      query += ` AND r.estado = ?`;
      params.push(estado);
    }

    if (colaborador_reemplazo_id) {
      query += ` AND r.colaborador_reemplazo_id = ?`;
      params.push(colaborador_reemplazo_id);
    }

    if (colaborador_ausente_id) {
      query += ` AND r.colaborador_ausente_id = ?`;
      params.push(colaborador_ausente_id);
    }

    query += ` ORDER BY r.created_at DESC`;

    const reemplazos = await db.all(query, params);
    return reemplazos;
  }

  /**
   * Obtener reemplazos activos de un colaborador (los que está cubriendo)
   */
  static async obtenerActivosDeColaborador(colaborador_id) {
    const db = getDatabase();

    const reemplazos = await db.all(
      `SELECT 
        r.*,
        u_ausente.nombre as nombre_ausente,
        u_ausente.cargo as cargo_ausente,
        i.tipo as tipo_incapacidad,
        i.diagnostico
      FROM reemplazos r
      LEFT JOIN usuarios u_ausente ON r.colaborador_ausente_id = u_ausente.id
      LEFT JOIN incapacidades i ON r.incapacidad_id = i.id
      WHERE r.colaborador_reemplazo_id = ? AND r.estado = 'activo'
      ORDER BY r.fecha_inicio DESC`,
      [colaborador_id]
    );

    return reemplazos;
  }

  /**
   * Obtener reemplazos de una incapacidad
   */
  static async obtenerPorIncapacidad(incapacidad_id) {
    const db = getDatabase();

    const reemplazos = await db.all(
      `SELECT 
        r.*,
        u_reemplazo.nombre as nombre_reemplazo,
        u_reemplazo.cargo as cargo_reemplazo,
        u_lider.nombre as nombre_lider
      FROM reemplazos r
      LEFT JOIN usuarios u_reemplazo ON r.colaborador_reemplazo_id = u_reemplazo.id
      LEFT JOIN usuarios u_lider ON r.asignado_por = u_lider.id
      WHERE r.incapacidad_id = ?
      ORDER BY r.created_at DESC`,
      [incapacidad_id]
    );

    return reemplazos;
  }

  /**
   * Actualizar estado del reemplazo
   */
  static async actualizarEstado(id, estado, observaciones = null) {
    const db = getDatabase();

    let query = `UPDATE reemplazos SET estado = ?, updated_at = CURRENT_TIMESTAMP`;
    const params = [estado];

    if (observaciones) {
      query += `, observaciones = ?`;
      params.push(observaciones);
    }

    query += ` WHERE id = ?`;
    params.push(id);

    const result = await db.run(query, params);
    return result.changes > 0;
  }

  /**
   * Finalizar reemplazo (cambiar a 'finalizado')
   */
  static async finalizar(id, observaciones = null) {
    return await this.actualizarEstado(id, 'finalizado', observaciones);
  }

  /**
   * Cancelar reemplazo
   */
  static async cancelar(id, observaciones) {
    return await this.actualizarEstado(id, 'cancelado', observaciones);
  }

  /**
   * Actualizar fechas del reemplazo
   */
  static async actualizarFechas(id, fecha_inicio, fecha_fin) {
    const db = getDatabase();

    const result = await db.run(
      `UPDATE reemplazos 
       SET fecha_inicio = ?, fecha_fin = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [fecha_inicio, fecha_fin, id]
    );

    return result.changes > 0;
  }

  /**
   * Verificar si un colaborador ya tiene un reemplazo activo en el periodo
   */
  static async tieneReemplazoActivo(colaborador_id, fecha_inicio, fecha_fin) {
    const db = getDatabase();

    const reemplazo = await db.get(
      `SELECT id FROM reemplazos
       WHERE colaborador_reemplazo_id = ?
       AND estado = 'activo'
       AND ((fecha_inicio <= ? AND fecha_fin >= ?)
            OR (fecha_inicio <= ? AND fecha_fin >= ?)
            OR (fecha_inicio >= ? AND fecha_fin <= ?))`,
      [
        colaborador_id,
        fecha_fin, fecha_inicio,
        fecha_fin, fecha_fin,
        fecha_inicio, fecha_fin
      ]
    );

    return reemplazo !== undefined;
  }

  /**
   * Obtener estadísticas de reemplazos
   */
  static async obtenerEstadisticas(filtros = {}) {
    const db = getDatabase();
    const { fecha_inicio, fecha_fin } = filtros;

    let query = `
      SELECT 
        COUNT(*) as total_reemplazos,
        SUM(CASE WHEN estado = 'activo' THEN 1 ELSE 0 END) as activos,
        SUM(CASE WHEN estado = 'finalizado' THEN 1 ELSE 0 END) as finalizados,
        SUM(CASE WHEN estado = 'cancelado' THEN 1 ELSE 0 END) as cancelados
      FROM reemplazos
      WHERE 1=1
    `;

    const params = [];

    if (fecha_inicio && fecha_fin) {
      query += ` AND fecha_inicio >= ? AND fecha_fin <= ?`;
      params.push(fecha_inicio, fecha_fin);
    }

    const stats = await db.get(query, params);
    return stats;
  }
}

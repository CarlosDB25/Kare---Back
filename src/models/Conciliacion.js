// src/models/Conciliacion.js
// Modelo para conciliaciones financieras de incapacidades

import { getDatabase } from '../db/database.js';

export default class ConciliacionModel {
  /**
   * Crea una nueva conciliación
   */
  static async crear(datos) {
    const db = getDatabase();
    
    const {
      incapacidad_id,
      dias_incapacidad,
      salario_base,
      ibc,
      valor_dia,
      dias_empresa,
      porcentaje_empresa,
      valor_empresa,
      dias_eps,
      porcentaje_eps,
      valor_eps,
      valor_total,
      observaciones,
      conciliado_por
    } = datos;
    
    const result = await db.run(
      `INSERT INTO conciliaciones 
       (incapacidad_id, dias_incapacidad, salario_base, ibc, valor_dia,
        dias_empresa, porcentaje_empresa, valor_empresa,
        dias_eps, porcentaje_eps, valor_eps,
        valor_total, observaciones, conciliado_por)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        incapacidad_id, dias_incapacidad, salario_base, ibc, valor_dia,
        dias_empresa, porcentaje_empresa, valor_empresa,
        dias_eps, porcentaje_eps, valor_eps,
        valor_total, observaciones || null, conciliado_por
      ]
    );
    
    return result.lastID;
  }
  
  /**
   * Obtiene la conciliación de una incapacidad
   */
  static async obtenerPorIncapacidad(incapacidad_id) {
    const db = getDatabase();
    
    const conciliacion = await db.get(
      `SELECT 
        c.*,
        u.nombre as conciliado_por_nombre,
        u.rol as conciliado_por_rol
       FROM conciliaciones c
       INNER JOIN usuarios u ON c.conciliado_por = u.id
       WHERE c.incapacidad_id = ?`,
      [incapacidad_id]
    );
    
    return conciliacion;
  }
  
  /**
   * Actualiza una conciliación existente
   */
  static async actualizar(id, datos) {
    const db = getDatabase();
    
    const { observaciones, valor_total } = datos;
    
    const result = await db.run(
      `UPDATE conciliaciones 
       SET observaciones = ?,
           valor_total = ?,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [observaciones, valor_total, id]
    );
    
    return result.changes;
  }
  
  /**
   * Lista todas las conciliaciones con filtros opcionales
   */
  static async listar(filtros = {}) {
    const db = getDatabase();
    
    let query = `
      SELECT 
        c.*,
        i.tipo as incapacidad_tipo,
        u_colab.nombre as colaborador_nombre,
        u_conciliador.nombre as conciliado_por_nombre
      FROM conciliaciones c
      INNER JOIN incapacidades i ON c.incapacidad_id = i.id
      INNER JOIN usuarios u_colab ON i.usuario_id = u_colab.id
      INNER JOIN usuarios u_conciliador ON c.conciliado_por = u_conciliador.id
      WHERE 1=1
    `;
    
    const params = [];
    
    if (filtros.conciliado_por) {
      query += ` AND c.conciliado_por = ?`;
      params.push(filtros.conciliado_por);
    }
    
    if (filtros.fecha_desde) {
      query += ` AND DATE(c.created_at) >= ?`;
      params.push(filtros.fecha_desde);
    }
    
    if (filtros.fecha_hasta) {
      query += ` AND DATE(c.created_at) <= ?`;
      params.push(filtros.fecha_hasta);
    }
    
    query += ` ORDER BY c.created_at DESC`;
    
    return db.all(query, params);
  }
  
  /**
   * Obtiene estadísticas de conciliaciones
   */
  static async obtenerEstadisticas() {
    const db = getDatabase();
    
    const stats = await db.get(`
      SELECT 
        COUNT(*) as total_conciliaciones,
        SUM(valor_total) as valor_total_conciliado,
        AVG(valor_total) as valor_promedio,
        SUM(valor_empresa) as total_pagado_empresa,
        SUM(valor_eps) as total_pagado_eps,
        AVG(dias_incapacidad) as promedio_dias
      FROM conciliaciones
    `);
    
    return stats;
  }
}

/**
 * Calcula la conciliación de una incapacidad según normativa colombiana
 * 
 * Reglas:
 * - Primeros 2 días: Empresa paga 100%
 * - Desde día 3: EPS/ARL paga 66.67%
 * - Base de cálculo: IBC / 30 (valor día)
 */
export function calcularConciliacion(incapacidad, usuario) {
  const { fecha_inicio, fecha_fin } = incapacidad;
  const { ibc, salario_base } = usuario;
  
  if (!ibc || !fecha_inicio || !fecha_fin) {
    throw new Error('Faltan datos para calcular conciliación: IBC, fecha_inicio, fecha_fin');
  }
  
  // Calcular días de incapacidad
  const inicio = new Date(fecha_inicio);
  const fin = new Date(fecha_fin);
  const dias_incapacidad = Math.ceil((fin - inicio) / (1000 * 60 * 60 * 24)) + 1;
  
  if (dias_incapacidad <= 0) {
    throw new Error('El rango de fechas es inválido');
  }
  
  // Valor de un día de trabajo
  const valor_dia = ibc / 30;
  
  // Primeros 2 días: empresa paga 100%
  const dias_empresa = Math.min(dias_incapacidad, 2);
  const valor_empresa = valor_dia * dias_empresa;
  
  // Resto de días: EPS/ARL paga 66.67%
  const dias_eps = Math.max(dias_incapacidad - 2, 0);
  const valor_eps = valor_dia * dias_eps * 0.6667;
  
  // Total que recibe el colaborador
  const valor_total = valor_empresa + valor_eps;
  
  return {
    dias_incapacidad,
    salario_base: salario_base || ibc,
    ibc,
    valor_dia: Math.round(valor_dia * 100) / 100,
    dias_empresa,
    porcentaje_empresa: 100.00,
    valor_empresa: Math.round(valor_empresa * 100) / 100,
    dias_eps,
    porcentaje_eps: 66.67,
    valor_eps: Math.round(valor_eps * 100) / 100,
    valor_total: Math.round(valor_total * 100) / 100
  };
}

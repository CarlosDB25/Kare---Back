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
        i.tipo as incapacidad_tipo,
        u.nombre as colaborador_nombre
       FROM conciliaciones c
       INNER JOIN incapacidades i ON c.incapacidad_id = i.id
       INNER JOIN usuarios u ON i.usuario_id = u.id
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
        u_colab.nombre as colaborador_nombre
      FROM conciliaciones c
      INNER JOIN incapacidades i ON c.incapacidad_id = i.id
      INNER JOIN usuarios u_colab ON i.usuario_id = u_colab.id
      WHERE 1=1
    `;
    
    const params = [];
    
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
        SUM(total_a_pagar) as valor_total_conciliado,
        AVG(total_a_pagar) as valor_promedio,
        SUM(monto_empresa_67) as total_pagado_empresa,
        SUM(monto_eps_100) as total_pagado_eps,
        AVG(dias_incapacidad) as promedio_dias
      FROM conciliaciones
    `);
    
    return stats;
  }
}

/**
 * Calcula la conciliación de una incapacidad según normativa colombiana 2025
 * 
 * NORMATIVA LEGAL COLOMBIANA:
 * 
 * EPS (Enfermedad General - Origen Común):
 * - Día 1-2: Empleador paga 66.67% del salario (2/3 del salario)
 * - Día 3-90: EPS paga 66.67% del IBC (mínimo 1 SMLV proporcional)
 * - Día 91-180: EPS paga 50% del IBC (aplica si trabajador aún no está en valoración de pérdida de capacidad laboral)
 * - Día 181-540: Remite a Fondo de Pensiones para definición de invalidez
 * 
 * ARL (Accidente o Enfermedad Laboral):
 * - Desde día 1: ARL paga 100% del IBC (sin excepciones)
 * 
 * Licencia de Maternidad (Ley 1822 de 2017):
 * - 126 días (18 semanas): EPS paga 100% del IBC (mínimo 1 SMLV)
 * 
 * Licencia de Paternidad (Ley 1468 de 2011):
 * - Hasta 14 días: EPS paga 100% del IBC (proporcional a cotización si incompleta)
 */
export function calcularConciliacion(incapacidad, usuario) {
  const { fecha_inicio, fecha_fin, tipo } = incapacidad;
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
  
  let dias_empresa = 0;
  let valor_empresa = 0;
  let dias_eps = 0;
  let valor_eps = 0;
  let dias_arl = 0;
  let valor_arl = 0;
  let desglose = [];
  
  if (tipo === 'EPS') {
    // NORMATIVA EPS (Enfermedad General - Origen Común)
    
    // Tramo 1: Día 1-2 (Empleador paga 66.67%)
    if (dias_incapacidad >= 1) {
      dias_empresa = Math.min(dias_incapacidad, 2);
      valor_empresa = valor_dia * dias_empresa * 0.6667;
      desglose.push({
        dias: `1-${dias_empresa}`,
        cantidad_dias: dias_empresa,
        porcentaje: 66.67,
        quien_paga: 'Empleador',
        valor: Math.round(valor_empresa * 100) / 100
      });
    }
    
    // Tramo 2: Día 3-90 (EPS paga 66.67%)
    if (dias_incapacidad >= 3) {
      const dias_eps_66 = Math.min(dias_incapacidad - 2, 88); // Máximo 88 días (del día 3 al 90)
      const valor_eps_66 = valor_dia * dias_eps_66 * 0.6667;
      dias_eps += dias_eps_66;
      valor_eps += valor_eps_66;
      desglose.push({
        dias: `3-${2 + dias_eps_66}`,
        cantidad_dias: dias_eps_66,
        porcentaje: 66.67,
        quien_paga: 'EPS',
        valor: Math.round(valor_eps_66 * 100) / 100
      });
    }
    
    // Tramo 3: Día 91-180 (EPS paga 50%)
    if (dias_incapacidad >= 91) {
      const dias_eps_50 = Math.min(dias_incapacidad - 90, 90); // Máximo 90 días (del día 91 al 180)
      const valor_eps_50 = valor_dia * dias_eps_50 * 0.50;
      dias_eps += dias_eps_50;
      valor_eps += valor_eps_50;
      desglose.push({
        dias: `91-${90 + dias_eps_50}`,
        cantidad_dias: dias_eps_50,
        porcentaje: 50.00,
        quien_paga: 'EPS',
        valor: Math.round(valor_eps_50 * 100) / 100,
        nota: 'Aplica si aún no está en valoración de pérdida de capacidad laboral'
      });
    }
    
    // Tramo 4: Día 181+ (Fondo de Pensiones)
    if (dias_incapacidad >= 181) {
      desglose.push({
        dias: `181-${dias_incapacidad}`,
        cantidad_dias: dias_incapacidad - 180,
        porcentaje: 50.00,
        quien_paga: 'Fondo de Pensiones',
        valor: 0,
        nota: 'EPS remite al fondo de pensiones para definición de invalidez'
      });
    }
    
  } else if (tipo === 'ARL') {
    // NORMATIVA ARL (Accidente o Enfermedad Laboral)
    // Desde día 1: ARL paga 100% del IBC
    dias_arl = dias_incapacidad;
    valor_arl = valor_dia * dias_arl;
    desglose.push({
      dias: `1-${dias_incapacidad}`,
      cantidad_dias: dias_incapacidad,
      porcentaje: 100.00,
      quien_paga: 'ARL',
      valor: Math.round(valor_arl * 100) / 100,
      nota: 'ARL paga 100% desde el primer día sin excepciones'
    });
    
  } else if (tipo === 'Licencia_Maternidad') {
    // NORMATIVA Licencia de Maternidad (Ley 1822 de 2017)
    // 126 días (18 semanas): 100% paga EPS
    dias_eps = dias_incapacidad;
    valor_eps = valor_dia * dias_eps;
    desglose.push({
      dias: `1-${dias_incapacidad}`,
      cantidad_dias: dias_incapacidad,
      porcentaje: 100.00,
      quien_paga: 'EPS',
      valor: Math.round(valor_eps * 100) / 100,
      nota: 'Licencia de Maternidad: 100% del IBC por 126 días (mínimo 1 SMLV)'
    });
    
  } else if (tipo === 'Licencia_Paternidad') {
    // NORMATIVA Licencia de Paternidad (Ley 1468 de 2011)
    // Hasta 14 días: 100% paga EPS
    dias_eps = dias_incapacidad;
    valor_eps = valor_dia * dias_eps;
    desglose.push({
      dias: `1-${dias_incapacidad}`,
      cantidad_dias: dias_incapacidad,
      porcentaje: 100.00,
      quien_paga: 'EPS',
      valor: Math.round(valor_eps * 100) / 100,
      nota: 'Licencia de Paternidad: 100% del IBC (proporcional si cotización incompleta)'
    });
  }
  
  // Total que recibe el colaborador
  const valor_total = valor_empresa + valor_eps + valor_arl;
  
  return {
    dias_incapacidad,
    salario_base: salario_base || ibc,
    ibc,
    valor_dia: Math.round(valor_dia * 100) / 100,
    dias_empresa,
    porcentaje_empresa: dias_empresa > 0 ? 66.67 : 0,
    valor_empresa: Math.round(valor_empresa * 100) / 100,
    dias_eps,
    porcentaje_eps: dias_eps > 0 ? (tipo === 'EPS' && dias_incapacidad >= 91 ? 58.34 : 66.67) : 0, // Promedio ponderado si aplica tramo de 50%
    valor_eps: Math.round(valor_eps * 100) / 100,
    dias_arl,
    valor_arl: Math.round(valor_arl * 100) / 100,
    valor_total: Math.round(valor_total * 100) / 100,
    desglose_detallado: desglose,
    normativa_aplicada: tipo === 'EPS' ? 'Enfermedad General - Origen Común' : 
                       tipo === 'ARL' ? 'Accidente o Enfermedad Laboral' :
                       tipo === 'Licencia_Maternidad' ? 'Ley 1822 de 2017' :
                       tipo === 'Licencia_Paternidad' ? 'Ley 1468 de 2011' : 'N/A'
  };
}

// src/services/validationService.js
// Servicio de validaciones de negocio para incapacidades

import { IncapacidadModel } from '../models/Incapacidad.js';

/**
 * Validaciones de transiciones de estado permitidas
 */
const TRANSICIONES_VALIDAS = {
  'reportada': ['en_revision', 'rechazada'],
  'en_revision': ['validada', 'rechazada'],
  'validada': ['pagada'],
  'rechazada': ['reportada'], // Puede volver a reportarse con correcciones
  'pagada': [] // Estado final, no puede cambiar
};

/**
 * Valida si una transición de estado es permitida
 */
export function validarTransicionEstado(estadoActual, nuevoEstado) {
  if (!TRANSICIONES_VALIDAS[estadoActual]) {
    return {
      valido: false,
      mensaje: `Estado actual '${estadoActual}' no es válido`
    };
  }

  if (!TRANSICIONES_VALIDAS[estadoActual].includes(nuevoEstado)) {
    return {
      valido: false,
      mensaje: `No se puede cambiar de '${estadoActual}' a '${nuevoEstado}'. Transiciones permitidas: ${TRANSICIONES_VALIDAS[estadoActual].join(', ')}`
    };
  }

  return { valido: true };
}

/**
 * Valida que las fechas sean coherentes
 */
export function validarFechas(fecha_inicio, fecha_fin) {
  const inicio = new Date(fecha_inicio);
  const fin = new Date(fecha_fin);
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  // Validar que fecha_inicio no sea muy antigua (máximo 60 días atrás)
  const hace60Dias = new Date();
  hace60Dias.setDate(hace60Dias.getDate() - 60);
  
  if (inicio < hace60Dias) {
    return {
      valido: false,
      mensaje: 'La fecha de inicio no puede ser mayor a 60 días en el pasado'
    };
  }

  // Validar que fecha_fin no sea muy futura (máximo 90 días adelante)
  const en90Dias = new Date();
  en90Dias.setDate(en90Dias.getDate() + 90);
  
  if (fin > en90Dias) {
    return {
      valido: false,
      mensaje: 'La fecha de fin no puede ser mayor a 90 días en el futuro'
    };
  }

  // Validar que inicio <= fin
  if (inicio > fin) {
    return {
      valido: false,
      mensaje: 'La fecha de inicio no puede ser posterior a la fecha de fin'
    };
  }

  // Validar duración máxima (180 días)
  const diasDiferencia = Math.ceil((fin - inicio) / (1000 * 60 * 60 * 24));
  if (diasDiferencia > 180) {
    return {
      valido: false,
      mensaje: 'La incapacidad no puede durar más de 180 días'
    };
  }

  return { valido: true };
}

/**
 * Detecta incapacidades duplicadas o solapadas
 */
export async function detectarDuplicados(usuario_id, fecha_inicio, fecha_fin, incapacidad_id = null) {
  try {
    const incapacidades = await IncapacidadModel.obtenerPorUsuario(usuario_id);
    
    const inicio = new Date(fecha_inicio);
    const fin = new Date(fecha_fin);

    for (const incap of incapacidades) {
      // Saltar la misma incapacidad si estamos editando
      if (incapacidad_id && incap.id === incapacidad_id) {
        continue;
      }

      // Saltar incapacidades rechazadas
      if (incap.estado === 'rechazada') {
        continue;
      }

      const incapInicio = new Date(incap.fecha_inicio);
      const incapFin = new Date(incap.fecha_fin);

      // Verificar solapamiento de fechas
      const haysolape = (inicio <= incapFin && fin >= incapInicio);

      if (haysolape) {
        return {
          duplicado: true,
          mensaje: `Ya existe una incapacidad activa (ID: ${incap.id}) que se solapa con estas fechas (${incap.fecha_inicio} a ${incap.fecha_fin})`,
          incapacidad_existente: incap
        };
      }
    }

    return { duplicado: false };
  } catch (error) {
    console.error('Error detectando duplicados:', error);
    return { duplicado: false }; // En caso de error, permitir continuar
  }
}

/**
 * Valida límites de días según tipo de incapacidad (NORMATIVA COLOMBIANA)
 */
export function validarLimitesDiasPorTipo(tipo, dias) {
  const limites = {
    'EPS': { min: 1, max: 180, mensaje: 'EPS: 1-180 días (Ley colombiana)' },
    'ARL': { min: 1, max: 540, mensaje: 'ARL: 1-540 días (18 meses, Ley colombiana)' },
    'Licencia_Maternidad': { min: 1, max: 126, mensaje: 'Licencia de Maternidad: 126 días (18 semanas, Ley 1822 de 2017)' },
    'Licencia_Paternidad': { min: 1, max: 14, mensaje: 'Licencia de Paternidad: hasta 14 días según cotización (Ley 1468 de 2011)' }
  };

  const limite = limites[tipo];
  if (!limite) {
    return { valido: true }; // Si no hay límite definido, permitir
  }

  if (dias < limite.min || dias > limite.max) {
    return {
      valido: false,
      mensaje: `El número de días (${dias}) no es válido para tipo '${tipo}'. ${limite.mensaje}`
    };
  }

  return { valido: true };
}

/**
 * Calcula porcentaje de pago según normativa colombiana
 * Retorna objeto con desglose de días y porcentajes
 */
export function calcularPorcentajesPago(tipo, dias_incapacidad) {
  const resultado = {
    tipo,
    dias_totales: dias_incapacidad,
    tramos: []
  };

  if (tipo === 'EPS') {
    // NORMATIVA EPS (Enfermedad General - Origen Común)
    // Día 1-2: 66.67% paga Empleador
    // Día 3-90: 66.67% paga EPS
    // Día 91-180: 50% paga EPS
    
    if (dias_incapacidad >= 1) {
      const diasEmpleador = Math.min(dias_incapacidad, 2);
      resultado.tramos.push({
        dias_inicio: 1,
        dias_fin: diasEmpleador,
        dias_total: diasEmpleador,
        porcentaje: 66.67,
        quien_paga: 'Empleador',
        nota: 'Primeros 2 días asume empleador (2/3 del salario)'
      });
    }

    if (dias_incapacidad >= 3) {
      const diasEPS_66 = Math.min(dias_incapacidad - 2, 88); // Días 3-90 = 88 días
      resultado.tramos.push({
        dias_inicio: 3,
        dias_fin: 2 + diasEPS_66,
        dias_total: diasEPS_66,
        porcentaje: 66.67,
        quien_paga: 'EPS',
        nota: 'Día 3-90: EPS paga 66.67% del IBC (SMLV mínimo)'
      });
    }

    if (dias_incapacidad >= 91) {
      const diasEPS_50 = dias_incapacidad - 90; // Días 91-180
      resultado.tramos.push({
        dias_inicio: 91,
        dias_fin: dias_incapacidad,
        dias_total: diasEPS_50,
        porcentaje: 50,
        quien_paga: 'EPS',
        nota: 'Día 91-180: EPS paga 50% del IBC (valoración pérdida capacidad laboral)'
      });
    }

  } else if (tipo === 'ARL') {
    // NORMATIVA ARL (Accidente o Enfermedad Laboral)
    // Desde día 1: 100% paga ARL
    resultado.tramos.push({
      dias_inicio: 1,
      dias_fin: dias_incapacidad,
      dias_total: dias_incapacidad,
      porcentaje: 100,
      quien_paga: 'ARL',
      nota: 'ARL paga 100% del IBC desde el primer día sin excepciones'
    });

  } else if (tipo === 'Licencia_Maternidad') {
    // NORMATIVA Licencia de Maternidad (Ley 1822 de 2017)
    // 126 días (18 semanas): 100% paga EPS
    resultado.tramos.push({
      dias_inicio: 1,
      dias_fin: dias_incapacidad,
      dias_total: dias_incapacidad,
      porcentaje: 100,
      quien_paga: 'EPS',
      nota: 'Licencia de Maternidad: 100% del IBC por 126 días (mínimo 1 SMLV)'
    });

  } else if (tipo === 'Licencia_Paternidad') {
    // NORMATIVA Licencia de Paternidad (Ley 1468 de 2011)
    // Depende de semanas cotizadas: 100% paga EPS
    resultado.tramos.push({
      dias_inicio: 1,
      dias_fin: dias_incapacidad,
      dias_total: dias_incapacidad,
      porcentaje: 100,
      quien_paga: 'EPS',
      nota: 'Licencia de Paternidad: 100% del IBC (proporcional a cotización incompleta)'
    });
  }

  return resultado;
}

/**
 * Calcula días entre dos fechas
 */
export function calcularDias(fecha_inicio, fecha_fin) {
  const inicio = new Date(fecha_inicio);
  const fin = new Date(fecha_fin);
  const diferencia = fin - inicio;
  const dias = Math.ceil(diferencia / (1000 * 60 * 60 * 24)) + 1; // +1 para incluir ambos días
  return dias;
}

/**
 * Validación completa al crear/editar incapacidad
 */
export async function validarIncapacidad(datos, incapacidad_id = null) {
  const errores = [];

  // Validar tipo
  const tiposValidos = ['EPS', 'ARL', 'Licencia_Maternidad', 'Licencia_Paternidad'];
  if (datos.tipo && !tiposValidos.includes(datos.tipo)) {
    errores.push(`Tipo de incapacidad inválido. Tipos permitidos: ${tiposValidos.join(', ')}`);
  }

  // Validar fechas
  if (datos.fecha_inicio && datos.fecha_fin) {
    const validacionFechas = validarFechas(datos.fecha_inicio, datos.fecha_fin);
    if (!validacionFechas.valido) {
      errores.push(validacionFechas.mensaje);
    }

    // Calcular días si no se proporcionan
    if (!datos.dias) {
      datos.dias = calcularDias(datos.fecha_inicio, datos.fecha_fin);
    }
  }

  // Validar límites por tipo
  if (datos.tipo && datos.dias) {
    const validacionLimites = validarLimitesDiasPorTipo(datos.tipo, datos.dias);
    if (!validacionLimites.valido) {
      errores.push(validacionLimites.mensaje);
    }
  }

  // Detectar duplicados
  if (datos.usuario_id && datos.fecha_inicio && datos.fecha_fin) {
    const deteccionDuplicados = await detectarDuplicados(
      datos.usuario_id,
      datos.fecha_inicio,
      datos.fecha_fin,
      incapacidad_id
    );
    
    if (deteccionDuplicados.duplicado) {
      errores.push(deteccionDuplicados.mensaje);
    }
  }

  return {
    valido: errores.length === 0,
    errores,
    datos // Retornar datos (pueden haber sido modificados, ej: días calculados)
  };
}

// src/services/documentAnalyzer.js
// Analiza documentos de incapacidad y extrae información estructurada

/**
 * Analiza un documento de incapacidad y extrae información relevante
 * NOTA: Sistema de validación flexible para diferentes formatos de entidades
 * @param {string} texto - Texto extraído del documento (OCR)
 * @returns {{tipo: string, campos: object, errores: string[], advertencias: string[], valido: boolean}}
 */
export function analizarDocumento(texto) {
  const tipo = identificarTipo(texto);
  const campos = extraerCampos(texto, tipo);
  const errores = validarCampos(campos, tipo);
  const advertencias = generarAdvertencias(campos, tipo);
  
  return {
    tipo,
    campos,
    errores,
    advertencias,
    valido: errores.length === 0
  };
}

/**
 * Genera advertencias para campos opcionales que faltan o tienen posibles problemas
 * NOTA: Las advertencias NO bloquean la validación, solo informan a GH
 * @param {object} campos - Campos extraídos
 * @param {string} tipo - Tipo de incapacidad
 * @returns {string[]} - Lista de advertencias
 */
function generarAdvertencias(campos, tipo) {
  const advertencias = [];
  
  // Advertencia 1: Nombre no encontrado (GH puede ingresarlo manualmente)
  if (!campos.nombre) {
    advertencias.push('No se encontró el nombre del paciente. Gestión Humana debe verificar/ingresar manualmente.');
  }
  
  // Advertencia 2: Documento no encontrado (GH puede buscarlo)
  if (!campos.documento) {
    advertencias.push('No se encontró el número de documento. Gestión Humana debe verificar/ingresar manualmente.');
  }
  
  // Advertencia 3: Fecha inicio no encontrada
  if (!campos.fecha_inicio) {
    advertencias.push('No se encontró fecha de inicio. Gestión Humana debe verificar el documento original.');
  }
  
  // Advertencia 4: Fecha fin no encontrada
  if (!campos.fecha_fin) {
    advertencias.push('No se encontró fecha de fin. Gestión Humana debe verificar el documento original.');
  }
  
  // Advertencia 5: Diagnóstico no encontrado (importante para ARL)
  if (!campos.diagnostico) {
    if (tipo === 'Accidente Laboral') {
      advertencias.push('No se encontró diagnóstico/causa. Es importante para accidentes laborales - revisar manualmente.');
    } else {
      advertencias.push('No se encontró diagnóstico. Gestión Humana puede ingresarlo si está disponible.');
    }
  }
  
  // Advertencia 6: Entidad no detectada
  if (!campos.entidad) {
    advertencias.push('No se detectó la entidad emisora (EPS/ARL). Verificar sello o membrete del documento.');
  }
  
  // Advertencia 7: Incoherencia tipo vs entidad (solo advertencia)
  if (tipo === 'Accidente Laboral' && campos.entidad && !campos.entidad.includes('ARL')) {
    advertencias.push('Documento clasificado como Accidente Laboral pero no parece ser de ARL. Revisar tipo.');
  }
  
  if (tipo === 'Enfermedad General' && campos.entidad && !campos.entidad.includes('EPS')) {
    advertencias.push('Documento clasificado como Enfermedad General pero no parece ser de EPS. Revisar tipo.');
  }
  
  // Advertencia 8: Número de radicado no encontrado
  if (!campos.radicado) {
    advertencias.push('No se encontró número de radicado/certificado. Gestión Humana puede anotarlo manualmente.');
  }
  
  return advertencias;
}


/**
 * Identifica el tipo de incapacidad según palabras clave
 * @param {string} texto - Texto del documento
 * @returns {string} - Tipo de incapacidad
 */
function identificarTipo(texto) {
  const textoUpper = texto.toUpperCase();
  
  // Palabras clave por tipo
  if (textoUpper.includes('EPS') || 
      textoUpper.includes('ENTIDAD PROMOTORA') ||
      textoUpper.includes('SALUD') ||
      textoUpper.includes('ENFERMEDAD GENERAL')) {
    return 'Enfermedad General';
  }
  
  if (textoUpper.includes('ARL') ||
      textoUpper.includes('RIESGOS LABORALES') ||
      textoUpper.includes('ACCIDENTE LABORAL') ||
      textoUpper.includes('ACCIDENTE DE TRABAJO')) {
    return 'Accidente Laboral';
  }
  
  if (textoUpper.includes('MATERNIDAD') ||
      textoUpper.includes('LICENCIA DE MATERNIDAD') ||
      textoUpper.includes('PARTO')) {
    return 'Licencia Maternidad';
  }
  
  if (textoUpper.includes('PATERNIDAD') ||
      textoUpper.includes('LICENCIA DE PATERNIDAD')) {
    return 'Licencia Paternidad';
  }
  
  if (textoUpper.includes('ACCIDENTE COMÚN') ||
      textoUpper.includes('ACCIDENTE NO LABORAL')) {
    return 'Accidente Común';
  }
  
  return 'DESCONOCIDO';
}

/**
 * Extrae campos específicos del texto usando expresiones regulares
 * NOTA: Regex mejorados para capturar variaciones de diferentes entidades
 * @param {string} texto - Texto del documento
 * @param {string} tipo - Tipo de incapacidad
 * @returns {object} - Campos extraídos
 */
function extraerCampos(texto, tipo) {
  // 1. FECHAS DE INCAPACIDAD (ignorar fechas de nacimiento)
  // Buscar específicamente fechas de inicio y fin de incapacidad
  const regexFechaInicio = /(?:Fecha\s+(?:de\s+)?(?:inicio|inicial)(?:\s+(?:de\s+)?incapacidad)?|Fecha\s+inicio\s+incapacidad)[:.]?\s*(\d{2})[\/\-](\d{2})[\/\-](\d{4})/i;
  const regexFechaFin = /(?:Fecha\s+(?:de\s+)?(?:fin|final|terminaci[oó]n|egreso)(?:\s+(?:de\s+)?incapacidad)?|Fecha\s+fin\s+incapacidad)[:.]?\s*(\d{2})[\/\-](\d{2})[\/\-](\d{4})/i;
  
  const matchInicio = texto.match(regexFechaInicio);
  const matchFin = texto.match(regexFechaFin);
  
  const fechas = [];
  if (matchInicio) {
    const [_, dia, mes, anio] = matchInicio;
    fechas.push(`${anio}-${mes}-${dia}`);
  }
  if (matchFin) {
    const [_, dia, mes, anio] = matchFin;
    fechas.push(`${anio}-${mes}-${dia}`);
  }
  
  // 2. NOMBRE - MEJORADO: Buscar nombre completo (al menos 2 palabras)
  // Captura después de: NOMBRE, PACIENTE, AFILIADO, etc. y requiere al menos 2 palabras
  const regexNombre = /(?:Nombre\s+(?:del\s+)?(?:paciente|afiliado)|PACIENTE|Beneficiario)[:.]?\s*(?:CC\s*\d+\s+)?([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+){1,4})(?=\s+(?:Tipo|Edad|Fecha|CC|C\.C|Cedula|Cédula|Sexo|Episodio)|$)/i;
  const matchNombre = texto.match(regexNombre);
  let nombre = matchNombre?.[1]?.trim();
  
  // Validar que el nombre tenga al menos 2 palabras (nombre y apellido)
  if (nombre && nombre.split(/\s+/).length < 2) {
    nombre = null; // Descartar nombres de una sola palabra como "Contributivo" o "Empleado"
  }
  
  // 3. DOCUMENTO DE IDENTIDAD - MEJORADO: Más variaciones
  // Captura después de: CC, C.C., CEDULA, DOCUMENTO, IDENTIFICACION, No. ID, etc.
  const regexDoc = /(?:CC|C\.C\.|CEDULA|CÉDULA|DOCUMENTO(?:\s+(?:DE\s+)?IDENTIDAD)?|IDENTIFICACION|IDENTIFICACIÓN|N(?:o|°|º)?\.?\s*(?:DE\s+)?(?:ID|DOCUMENTO|IDENTIFICACIÓN))[:.\s]*(\d{6,11})/i;
  const matchDoc = texto.match(regexDoc);
  const documento = matchDoc?.[1];
  
  // 4. DIAGNÓSTICO - MEJORADO: Buscar códigos CIE-10 y descripciones
  // Primero buscar código CIE-10 (formato: letra + 2-3 dígitos, ej: A07.1, N30)
  const regexCIE10 = /(?:Diagn[oó]stico\s+(?:Principal|Ppal|paciente)|Tipo\s+Incapacidad|Diagnostico)[:.]?\s*(?:\()?([A-Z]\d{2,3}(?:\.\d)?)/i;
  const matchCIE = texto.match(regexCIE10);
  
  // Luego buscar descripción completa del diagnóstico
  const regexDiagTexto = /(?:Diagn[oó]stico(?:\s+(?:Principal|Ppal|paciente))?|Observaciones|Concepto\s+Incapacidad)[:.]?\s*(.{20,300})(?=\n(?:Tipo|Firma|Profesional|Responsable|Fecha|--|$))/i;
  const matchDiagTexto = texto.match(regexDiagTexto);
  
  let diagnostico = null;
  if (matchCIE) {
    diagnostico = matchCIE[1].trim();
    // Si hay descripción, agregarla
    if (matchDiagTexto) {
      const descripcion = matchDiagTexto[1].trim().substring(0, 150);
      diagnostico += ` - ${descripcion}`;
    }
  } else if (matchDiagTexto) {
    diagnostico = matchDiagTexto[1].trim().substring(0, 200);
  }
  
  // 5. NÚMERO DE RADICADO / INCAPACIDAD - MEJORADO: Patrones variables
  // Captura: RAD-2025-001234, EPS-001234, ARL2025001234, etc.
  const regexRadicado = /(?:RADICADO|INCAPACIDAD|CERTIFICADO|N(?:o|°|º)?\.?\s*(?:RADICADO|INCAPACIDAD|CERTIFICADO)?)[:.\s]*([A-Z]{2,5}[-\s]?\d{4,10}|[A-Z0-9\-]{8,20})/i;
  const matchRadicado = texto.match(regexRadicado);
  const numero_radicado = matchRadicado?.[1];
  
  // 6. DÍAS DE INCAPACIDAD - MEJORADO: Más variaciones
  // Captura: "Días: 5", "Días de incapacidad: 5", "Duración: 5 días", etc.
  const regexDias = /(?:Días?(?:\s+(?:de\s+)?incapacidad)?|Duración(?:\s+(?:de\s+)?(?:la\s+)?incapacidad)?)[:.\s]*(\d{1,3})(?:\s+días?)?/i;
  const matchDias = texto.match(regexDias);
  const dias = matchDias?.[1] ? parseInt(matchDias[1]) : null;
  
  // 7. EPS/ARL - MEJORADO: Extrae nombre de entidad con más variaciones
  // Captura: "EPS Sura", "SURA EPS", "Compensar", "Nueva EPS", "ARL Colpatria", etc.
  const regexEPS = /(?:(?:EPS|ARL|ENTIDAD)\s+)?(?:SURA|SANITAS|COMPENSAR|SALUD\s+TOTAL|NUEVA\s+EPS|FAMISANAR|COOMEVA|COLPATRIA|POSITIVA|LIBERTY|BOLÍVAR|BOLIVAR)(?:\s+(?:EPS|ARL))?/i;
  const matchEPS = texto.match(regexEPS);
  let entidad = matchEPS?.[0]?.trim();
  
  // Si no se encontró por nombre específico, buscar patrón genérico
  if (!entidad) {
    const regexGenerico = /(?:EPS|ARL|ENTIDAD(?:\s+PROMOTORA)?)\s*:?\s*([A-ZÁÉÍÓÚÑ\s]{3,30})/i;
    const matchGenerico = texto.match(regexGenerico);
    entidad = matchGenerico?.[1]?.trim().split('\n')[0];
  }
  
  return {
    tipo,
    nombre,
    documento,
    fecha_inicio: fechas[0] || null,     // Primera fecha encontrada
    fecha_fin: fechas[1] || null,         // Segunda fecha encontrada
    diagnostico,
    numero_radicado,
    dias_totales: dias,
    entidad,
    texto_completo: texto.substring(0, 500) // Primeros 500 caracteres para referencia
  };
}

/**
 * Valida que los campos extraídos sean coherentes
 * NOTA: Validación flexible - cada entidad (EPS, ARL) tiene formatos diferentes
 * Solo se validan campos críticos, los demás son opcionales
 * @param {object} campos - Campos extraídos
 * @param {string} tipo - Tipo de incapacidad
 * @returns {string[]} - Lista de errores CRÍTICOS encontrados
 */
function validarCampos(campos, tipo) {
  const errores = [];
  
  // VALIDACIÓN CRÍTICA 1: Coherencia de fechas (si ambas existen)
  if (campos.fecha_inicio && campos.fecha_fin) {
    const inicio = new Date(campos.fecha_inicio);
    const fin = new Date(campos.fecha_fin);
    
    // Error grave: fecha inicio > fecha fin
    if (inicio > fin) {
      errores.push(`Fechas incoherentes: inicio (${campos.fecha_inicio}) es posterior a fin (${campos.fecha_fin})`);
    }
    
    // Validar que fechas no sean absurdas (más de 90 días en el futuro)
    const hoy = new Date();
    const maxFuturo = new Date();
    maxFuturo.setDate(maxFuturo.getDate() + 90);
    
    if (inicio > maxFuturo) {
      errores.push('Fecha de inicio muy lejana en el futuro (>90 días)');
    }
    
    // Validar que no sea muy antigua (más de 3 años atrás)
    const tresPasado = new Date();
    tresPasado.setFullYear(tresPasado.getFullYear() - 3);
    
    if (inicio < tresPasado) {
      errores.push('Fecha de inicio muy antigua (>3 años)');
    }
  }
  
  // VALIDACIÓN CRÍTICA 2: Documento válido (si existe)
  // NOTA: No es error si no se encuentra, pero si existe debe ser válido
  if (campos.documento) {
    if (campos.documento.length < 6 || campos.documento.length > 11) {
      errores.push(`Documento ${campos.documento} tiene formato inválido (debe ser 6-11 dígitos)`);
    }
  }
  
  // VALIDACIÓN CRÍTICA 3: Tipo desconocido
  // Solo es error grave si no se pudo clasificar el documento
  if (tipo === 'DESCONOCIDO') {
    errores.push('No se pudo identificar el tipo de incapacidad en el documento');
  }
  
  // NOTA: Los siguientes NO son errores críticos:
  // - Nombre faltante: Muchos formatos no incluyen nombre explícitamente
  // - Documento faltante: Algunos certificados solo tienen número de radicado
  // - Fechas faltantes: GH puede ingresarlas manualmente
  // - Diagnóstico faltante: Opcional según entidad
  // - Entidad faltante: Se puede deducir del tipo
  
  return errores;
}

/**
 * Calcula la similitud entre dos nombres (para validación)
 * @param {string} nombre1 
 * @param {string} nombre2 
 * @returns {number} - Porcentaje de similitud (0-100)
 */
export function calcularSimilitudNombres(nombre1, nombre2) {
  if (!nombre1 || !nombre2) return 0;
  
  const n1 = nombre1.toUpperCase().trim();
  const n2 = nombre2.toUpperCase().trim();
  
  // Si son idénticos
  if (n1 === n2) return 100;
  
  // Verificar si el primer nombre está incluido
  const palabras1 = n1.split(/\s+/);
  const palabras2 = n2.split(/\s+/);
  
  const primerNombre1 = palabras1[0];
  const primerNombre2 = palabras2[0];
  
  if (primerNombre1 === primerNombre2) return 80;
  
  // Verificar si alguna palabra coincide
  const coincidencias = palabras1.filter(p => palabras2.includes(p));
  const porcentaje = (coincidencias.length / Math.max(palabras1.length, palabras2.length)) * 100;
  
  return Math.round(porcentaje);
}

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
  // 1. FECHAS DE INCAPACIDAD - Múltiples formatos y validación contextual
  let fecha_inicio = null;
  let fecha_fin = null;
  
  // Patrón 1: "Fecha inicio: 01/12/2024" o "Desde: 01-12-2024"
  const regexInicio1 = /(?:Fecha\s+(?:de\s+)?(?:inicio|inicial)(?:\s+(?:de\s+)?incapacidad)?|Desde|Inicia|Inicio\s+incapacidad)[:.]?\s*(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/i;
  
  // Patrón 2: "Fecha fin: 05/12/2024" o "Hasta: 05-12-2024"
  const regexFin1 = /(?:Fecha\s+(?:de\s+)?(?:fin|final|terminaci[oó]n|t[ée]rmino|egreso)(?:\s+(?:de\s+)?incapacidad)?|Hasta|Termina|Fin\s+incapacidad)[:.]?\s*(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/i;
  
  // Patrón 3: "Del 01/12/2024 al 05/12/2024"
  const regexRango = /(?:Del|Desde)\s+(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})\s+(?:al|hasta)\s+(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/i;
  
  const matchInicio = texto.match(regexInicio1);
  const matchFin = texto.match(regexFin1);
  const matchRango = texto.match(regexRango);
  
  if (matchRango) {
    // Formato de rango completo
    const [_, diaI, mesI, anioI, diaF, mesF, anioF] = matchRango;
    fecha_inicio = `${anioI}-${mesI.padStart(2, '0')}-${diaI.padStart(2, '0')}`;
    fecha_fin = `${anioF}-${mesF.padStart(2, '0')}-${diaF.padStart(2, '0')}`;
  } else {
    // Fechas separadas
    if (matchInicio) {
      const [_, dia, mes, anio] = matchInicio;
      fecha_inicio = `${anio}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
    }
    if (matchFin) {
      const [_, dia, mes, anio] = matchFin;
      fecha_fin = `${anio}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
    }
  }
  
  // 2. NOMBRE - MEJORADO: Múltiples patrones para diferentes formatos
  let nombre = null;
  
  // Patrón 1: "Nombre del paciente: JUAN PEREZ GOMEZ"
  const regexNombre1 = /(?:Nombre\s+(?:del\s+)?(?:paciente|afiliado|trabajador|empleado)|PACIENTE|Beneficiario|AFILIADO)[:.]?\s*(?:CC\s*\d+\s+)?([A-ZÁÉÍÓÚÑ][a-záéíóúñA-ZÁÉÍÓÚÑ\s]{4,60})(?=\s*(?:\n|Tipo|Edad|Fecha|CC|C\.C|Cedula|Cédula|Sexo|Episodio|Documento|Identificación))/i;
  
  // Patrón 2: "NOMBRES Y APELLIDOS: Juan Carlos Pérez"
  const regexNombre2 = /(?:NOMBRES?\s+Y\s+APELLIDOS?|APELLIDOS?\s+Y\s+NOMBRES?)[:.]?\s*([A-ZÁÉÍÓÚÑ][a-záéíóúñA-ZÁÉÍÓÚÑ\s]{4,60})(?=\s*(?:\n|CC|Documento|Identificación|Tipo))/i;
  
  // Patrón 3: Línea que empieza con nombre (después de encabezados)
  const regexNombre3 = /(?:Datos\s+del\s+Paciente|Información\s+Personal)[\s\S]{0,100}?\n\s*([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+){0,3})\s*(?:\n|CC)/i;
  
  const matchNombre1 = texto.match(regexNombre1);
  const matchNombre2 = texto.match(regexNombre2);
  const matchNombre3 = texto.match(regexNombre3);
  
  if (matchNombre1) nombre = matchNombre1[1].trim();
  else if (matchNombre2) nombre = matchNombre2[1].trim();
  else if (matchNombre3) nombre = matchNombre3[1].trim();
  
  // Validar y limpiar nombre
  if (nombre) {
    nombre = nombre.replace(/\s+/g, ' ').trim();
    const palabras = nombre.split(' ');
    // Debe tener al menos 2 palabras y no contener palabras clave de formulario
    const palabrasInvalidas = ['CONTRIBUTIVO', 'SUBSIDIADO', 'VINCULADO', 'EMPLEADO', 'AFILIADO', 'TIPO', 'REGIMEN'];
    if (palabras.length < 2 || palabras.some(p => palabrasInvalidas.includes(p.toUpperCase()))) {
      nombre = null;
    }
  }
  
  // 3. DOCUMENTO DE IDENTIDAD - MEJORADO: Múltiples patrones robustos
  let documento = null;
  
  // Patrón 1: "CC: 1234567890" o "C.C. 1234567890"
  const regexDoc1 = /(?:^|\s|\n)(?:CC|C\.C\.|CEDULA|CÉDULA)[:.]?\s*(\d{6,11})(?=\s|\n|$)/i;
  
  // Patrón 2: "Documento de Identidad: 1234567890"
  const regexDoc2 = /(?:DOCUMENTO(?:\s+(?:DE\s+)?IDENTIDAD)?|IDENTIFICACION|IDENTIFICACIÓN)[:.]?\s*(\d{6,11})/i;
  
  // Patrón 3: "No. Identificación: 1234567890"
  const regexDoc3 = /N(?:o|°|º|ú|u|úm|um)\.?\s*(?:DE\s+)?(?:ID|IDENTIFICACIÓN|IDENTIFICACION|DOCUMENTO)[:.]?\s*(\d{6,11})/i;
  
  // Patrón 4: Número aislado de 7-10 dígitos después de "CC" en la misma línea del nombre
  const regexDoc4 = /(?:PACIENTE|AFILIADO|NOMBRE)[\s\S]{0,80}?CC[:.\s]*(\d{7,10})(?=\s|\n)/i;
  
  const matchDoc1 = texto.match(regexDoc1);
  const matchDoc2 = texto.match(regexDoc2);
  const matchDoc3 = texto.match(regexDoc3);
  const matchDoc4 = texto.match(regexDoc4);
  
  if (matchDoc1) documento = matchDoc1[1];
  else if (matchDoc2) documento = matchDoc2[1];
  else if (matchDoc3) documento = matchDoc3[1];
  else if (matchDoc4) documento = matchDoc4[1];
  
  // Validar longitud (CC colombiana: 6-11 dígitos, usualmente 7-10)
  if (documento && (documento.length < 6 || documento.length > 11)) {
    documento = null;
  }
  
  // 4. DIAGNÓSTICO - MEJORADO: Captura de códigos CIE-10 + descripción
  let diagnostico = null;
  
  // Patrón 1: Código CIE-10 (ej: "Diagnóstico: J00 - Resfriado común")
  const regexCIE10_1 = /(?:Diagn[oó]stico\s+(?:Principal|Ppal)?|Enfermedad|Patología)[:.]?\s*(?:\()?([A-Z]\d{2}(?:\.\d{1,2})?)(?:\))?(?:\s*[-:]?\s*([^\n]{5,150}))?/i;
  
  // Patrón 2: Descripción sin código
  const regexDiagTexto = /(?:Diagn[oó]stico|Observaciones?|Concepto(?:\s+de)?\s+(?:la\s+)?Incapacidad|Motivo)[:.]?\s*([A-Z][^\n]{15,200})(?=\n|$)/i;
  
  // Patrón 3: Código CIE-10 suelto en el documento
  const regexCIE10_solo = /\b([A-Z]\d{2}(?:\.\d{1,2})?)\b/;
  
  const matchCIE1 = texto.match(regexCIE10_1);
  const matchDiag = texto.match(regexDiagTexto);
  const matchCIE_solo = texto.match(regexCIE10_solo);
  
  if (matchCIE1) {
    diagnostico = matchCIE1[1]; // Código CIE-10
    if (matchCIE1[2]) {
      // Limpiar y agregar descripción
      let desc = matchCIE1[2].trim()
        .replace(/\s+/g, ' ')
        .substring(0, 150);
      diagnostico += ` - ${desc}`;
    }
  } else if (matchDiag) {
    // Solo descripción
    diagnostico = matchDiag[1].trim()
      .replace(/\s+/g, ' ')
      .substring(0, 200);
  } else if (matchCIE_solo) {
    // Solo código encontrado
    diagnostico = matchCIE_solo[1];
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
    fecha_inicio,
    fecha_fin,
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

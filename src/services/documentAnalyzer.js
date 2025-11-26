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
 * Construye y valida una fecha, corrigiendo errores comunes de OCR
 * @param {string} dia - Día extraído
 * @param {string} mes - Mes extraído
 * @param {string} anio - Año extraído
 * @returns {string|null} - Fecha en formato YYYY-MM-DD o null si es inválida
 */
function construirFechaValida(dia, mes, anio) {
  // Convertir a números
  let d = parseInt(dia);
  let m = parseInt(mes);
  const a = parseInt(anio);
  
  // Validar año
  if (a < 1900 || a > 2100) return null;
  
  // Corregir mes = 0 (error común de OCR: 08 → 00)
  // Si el mes es 0, probablemente el OCR confundió 08 con 00
  if (m === 0) {
    m = 8; // Asumir agosto (mes más común con 0)
    console.warn(`[Fecha] Mes 0 detectado, corrigiendo a 08 (agosto)`);
  }
  
  // Validar mes (1-12)
  if (m < 1 || m > 12) {
    console.warn(`[Fecha] Mes inválido: ${m}, descartando fecha`);
    return null;
  }
  
  // Validar día (1-31)
  if (d < 1 || d > 31) {
    console.warn(`[Fecha] Día inválido: ${d}, descartando fecha`);
    return null;
  }
  
  // Validar días por mes
  const diasPorMes = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  
  // Año bisiesto
  if (a % 4 === 0 && (a % 100 !== 0 || a % 400 === 0)) {
    diasPorMes[1] = 29;
  }
  
  if (d > diasPorMes[m - 1]) {
    console.warn(`[Fecha] Día ${d} inválido para mes ${m}, descartando fecha`);
    return null;
  }
  
  // Construir fecha válida
  const fechaFormateada = `${a}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  console.log(`[Fecha] ✓ Fecha válida construida: ${fechaFormateada}`);
  return fechaFormateada;
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
    fecha_inicio = construirFechaValida(diaI, mesI, anioI);
    fecha_fin = construirFechaValida(diaF, mesF, anioF);
  } else {
    // Fechas separadas
    if (matchInicio) {
      const [_, dia, mes, anio] = matchInicio;
      fecha_inicio = construirFechaValida(dia, mes, anio);
    }
    if (matchFin) {
      const [_, dia, mes, anio] = matchFin;
      fecha_fin = construirFechaValida(dia, mes, anio);
    }
  }
  
  // 2. NOMBRE - MEJORADO: Múltiples patrones para diferentes formatos
  let nombre = null;
  
  // Patrón 1: "Nombre del paciente: JUAN PEREZ GOMEZ" (más flexible)
  const regexNombre1 = /(?:Nombre\s+(?:del\s+)?(?:paciente|afiliado|trabajador|empleado))[:.]?\s*([A-ZÁÉÍÓÚÑ][a-záéíóúñA-ZÁÉÍÓÚÑ\s]{4,60})(?=\s*\n|$)/i;
  
  // Patrón 1b: "PACIENTE: Juan Perez" (sin requerir lookahead estricto)
  const regexNombre1b = /(?:^|\n)(?:PACIENTE|BENEFICIARIO|AFILIADO)[:.\s]+([A-ZÁÉÍÓÚÑ][a-záéíóúñA-ZÁÉÍÓÚÑ\s]{4,60})(?=\s*\n|$)/im;
  
  // Patrón 2: "NOMBRES Y APELLIDOS: Juan Carlos Pérez"
  const regexNombre2 = /(?:NOMBRES?\s+Y\s+APELLIDOS?|APELLIDOS?\s+Y\s+NOMBRES?)[:.]?\s*([A-ZÁÉÍÓÚÑ][a-záéíóúñA-ZÁÉÍÓÚÑ\s]{4,60})(?=\s*(?:\n|CC|Documento|Identificación|Tipo))/i;
  
  // Patrón 3: Línea que empieza con nombre (después de encabezados)
  const regexNombre3 = /(?:Datos\s+del\s+Paciente|Información\s+Personal)[\s\S]{0,100}?\n\s*([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+){0,3})\s*(?:\n|CC)/i;
  
  // Patrón 4: "Cotizante C 1234567890 APELLIDO1 APELLIDO2 NOMBRE" (formato ARL/EPS específico)
  const regexNombre4 = /(?:Cotizante|Afiliado|Trabajador|Empleado)\s+[A-Z]\s+\d{6,11}\s+([A-ZÁÉÍÓÚÑ][a-záéíóúñA-ZÁÉÍÓÚÑ\s]{10,60})(?=\s*(?:\n|Tipo|Diagnóstico|Fecha|EPS|ARL))/i;
  
  const matchNombre1 = texto.match(regexNombre1);
  const matchNombre1b = texto.match(regexNombre1b);
  const matchNombre2 = texto.match(regexNombre2);
  const matchNombre3 = texto.match(regexNombre3);
  const matchNombre4 = texto.match(regexNombre4);
  
  if (matchNombre1) nombre = matchNombre1[1].trim();
  else if (matchNombre1b) nombre = matchNombre1b[1].trim();
  else if (matchNombre2) nombre = matchNombre2[1].trim();
  else if (matchNombre4) nombre = matchNombre4[1].trim();
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
  
  // Patrón 5: "Cotizante C 1234567890" (formato ARL/EPS con letra de tipo)
  const regexDoc5 = /(?:Cotizante|Afiliado|Trabajador|Empleado)\s+[A-Z]\s+(\d{6,11})(?=\s)/i;
  
  const matchDoc1 = texto.match(regexDoc1);
  const matchDoc2 = texto.match(regexDoc2);
  const matchDoc3 = texto.match(regexDoc3);
  const matchDoc4 = texto.match(regexDoc4);
  const matchDoc5 = texto.match(regexDoc5);
  
  if (matchDoc5) documento = matchDoc5[1]; // Priorizar formato "Cotizante C 123456"
  else if (matchDoc1) documento = matchDoc1[1];
  else if (matchDoc2) documento = matchDoc2[1];
  else if (matchDoc3) documento = matchDoc3[1];
  else if (matchDoc4) documento = matchDoc4[1];
  
  // Validar longitud (CC colombiana: 6-11 dígitos, usualmente 7-10)
  if (documento && (documento.length < 6 || documento.length > 11)) {
    documento = null;
  }
  
  // 4. DIAGNÓSTICO - MEJORADO: Captura de códigos CIE-10 + descripción
  let diagnostico = null;
  
  // Patrón 1 (PRIORITARIO): "Diagnóstico principal: A05.9" (buscar explícitamente "principal" + código)
  const regexCIE10_principal = /(?:Diagn[oó]stico\s+(?:Principal|Ppal))[:.]?\s*([A-Z]\d{2}(?:\.\d{1,2})?)/i;
  
  // Patrón 2: "Diagnóstico: J00 - Resfriado común"
  const regexCIE10_1 = /(?:Diagn[oó]stico|Enfermedad|Patología)[:.]?\s*(?:\()?([A-Z]\d{2}(?:\.\d{1,2})?)(?:\))?(?:\s*[-:]?\s*([^\n]{5,150}))?/i;
  
  // Patrón 3: Descripción sin código (menos prioritario)
  const regexDiagTexto = /(?:Diagn[oó]stico|Observaciones?|Concepto(?:\s+de)?\s+(?:la\s+)?Incapacidad|Motivo)[:.]?\s*([A-Z][^\n]{15,200})(?=\n|$)/i;
  
  // Patrón 4: Código CIE-10 suelto en el documento (última opción)
  const regexCIE10_solo = /\b([A-Z]\d{2}(?:\.\d{1,2})?)\b/;
  
  const matchCIE_principal = texto.match(regexCIE10_principal);
  const matchCIE1 = texto.match(regexCIE10_1);
  const matchDiag = texto.match(regexDiagTexto);
  const matchCIE_solo = texto.match(regexCIE10_solo);
  
  // Priorizar "Diagnóstico principal"
  if (matchCIE_principal) {
    diagnostico = matchCIE_principal[1]; // Solo código CIE-10 principal
  } else if (matchCIE1) {
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
  let numero_radicado = null;
  
  // Patrón 1: "RADICADO: RAD-2025-001234" o "INCAPACIDAD: EPS-001234"
  const regexRadicado1 = /(?:RADICADO|INCAPACIDAD|CERTIFICADO)[:.\s]*([A-Z]{2,5}[-\s]?\d{4,10}|[A-Z0-9\-]{8,20})/i;
  
  // Patrón 2: "Nro. Incapacidad 00010593256" o "No. De autorización 229385"
  const regexRadicado2 = /(?:Nro?\.?\s+(?:de\s+)?(?:Incapacidad|incapacidad|Autorización|autorización|Certificado|certificado)|No?\.?\s+(?:de\s+)?(?:Autorización|autorización|Incapacidad|incapacidad))[:.\s]*(\d{6,15})/i;
  
  // Patrón 3: "N°. RADICADO: 123456"
  const regexRadicado3 = /N(?:o|°|º|ú|u|úm|um)\.?\s*(?:de\s+)?(?:RADICADO|INCAPACIDAD|CERTIFICADO|AUTORIZACIÓN)[:.\s]*(\d{6,15})/i;
  
  // Patrón 4: "Consecutivo: 123456" o "Consecutivo 123456"
  const regexConsecutivo = /Consecutivo[:.\s]*(\d{6,15})/i;
  
  const matchRadicado1 = texto.match(regexRadicado1);
  const matchRadicado2 = texto.match(regexRadicado2);
  const matchRadicado3 = texto.match(regexRadicado3);
  const matchConsecutivo = texto.match(regexConsecutivo);
  
  if (matchRadicado2) numero_radicado = matchRadicado2[1]; // Priorizar "Nro. Incapacidad"
  else if (matchConsecutivo) numero_radicado = matchConsecutivo[1]; // "Consecutivo"
  else if (matchRadicado3) numero_radicado = matchRadicado3[1];
  else if (matchRadicado1) numero_radicado = matchRadicado1[1];
  
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

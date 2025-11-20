// src/services/documentAnalyzer.js
// Analiza documentos de incapacidad y extrae información estructurada

/**
 * Analiza un documento de incapacidad y extrae información relevante
 * @param {string} texto - Texto extraído del documento (OCR)
 * @returns {{tipo: string, campos: object, errores: string[], valido: boolean}}
 */
export function analizarDocumento(texto) {
  const tipo = identificarTipo(texto);
  const campos = extraerCampos(texto, tipo);
  const errores = validarCampos(campos, tipo);
  
  return {
    tipo,
    campos,
    errores,
    valido: errores.length === 0
  };
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
 * @param {string} texto - Texto del documento
 * @param {string} tipo - Tipo de incapacidad
 * @returns {object} - Campos extraídos
 */
function extraerCampos(texto, tipo) {
  // 1. FECHAS (DD/MM/YYYY o DD-MM-YYYY)
  const regexFecha = /(\d{2})[\/\-](\d{2})[\/\-](\d{4})/g;
  const fechasEncontradas = [...texto.matchAll(regexFecha)];
  
  // Convertir a formato YYYY-MM-DD
  const fechas = fechasEncontradas.map(match => {
    const [_, dia, mes, anio] = match;
    return `${anio}-${mes}-${dia}`;
  });
  
  // 2. NOMBRE (después de "NOMBRE:", "PACIENTE:", "AFILIADO:", etc.)
  // Mejorado: captura hasta salto de línea o hasta encontrar "CC" o "CEDULA"
  const regexNombre = /(?:NOMBRE|PACIENTE|AFILIADO|TRABAJADOR|EMPLEADO):\s*([A-ZÁÉÍÓÚÑ\s]+?)(?=\n|CC|CEDULA|CÉDULA|C\.C\.|$)/i;
  const matchNombre = texto.match(regexNombre);
  const nombre = matchNombre?.[1]?.trim();
  
  // 3. DOCUMENTO DE IDENTIDAD
  const regexDoc = /(?:CC|C\.C\.|CEDULA|CÉDULA|DOCUMENTO|IDENTIFICACION|IDENTIFICACIÓN):\s*(\d{6,11})/i;
  const matchDoc = texto.match(regexDoc);
  const documento = matchDoc?.[1];
  
  // 4. DIAGNÓSTICO
  // Mejorado: captura hasta salto de línea doble o hasta 200 caracteres
  const regexDiag = /(?:DIAGNOSTICO|DIAGNÓSTICO|DX|ENFERMEDAD|CAUSA):\s*([A-ZÁÉÍÓÚÑ0-9\s,\.;\-]+?)(?=\n\n|\nFecha|\nDías|$)/i;
  const matchDiag = texto.match(regexDiag);
  const diagnostico = matchDiag?.[1]?.trim().substring(0, 200); // Limitar a 200 caracteres
  
  // 5. NÚMERO DE RADICADO / INCAPACIDAD
  // Mejorado: busca patrones como RAD-2025-001234, EPS-2025-001234, etc.
  const regexRadicado = /(?:RADICADO|INCAPACIDAD|N°|NO\.)\s*[::\s]*([A-Z]{2,5}-\d{4}-\d{4,6}|[A-Z0-9\-]{6,20})/i;
  const matchRadicado = texto.match(regexRadicado);
  const numero_radicado = matchRadicado?.[1];
  
  // 6. DÍAS DE INCAPACIDAD
  // Mejorado: busca solo líneas que hablen específicamente de días
  const regexDias = /(?:Días?\s+(?:de\s+)?incapacidad|Días?):\s*(\d{1,3})/i;
  const matchDias = texto.match(regexDias);
  const dias = matchDias?.[1] ? parseInt(matchDias[1]) : null;
  
  // 7. EPS/ARL - Mejorado: extrae nombre de la entidad
  const regexEPS = /(?:EPS|ENTIDAD PROMOTORA|ADMINISTRADORA)\s+(?:DE\s+)?(?:SALUD\s+)?(?:RIESGOS\s+LABORALES\s+)?[-\s]*([A-ZÁÉÍÓÚÑ\s]+)/i;
  const matchEPS = texto.match(regexEPS);
  const entidad = matchEPS?.[1]?.trim().split('\n')[0];
  
  return {
    tipo,
    nombre,
    documento,
    fecha_inicio: fechas[0] || null,     // Primera fecha encontrada
    fecha_fin: fechas[1] || null,         // Segunda fecha encontrada
    diagnostico,
    numero_radicado,
    dias_incapacidad: dias,
    entidad,
    texto_completo: texto.substring(0, 500) // Primeros 500 caracteres para referencia
  };
}

/**
 * Valida que los campos extraídos sean coherentes
 * @param {object} campos - Campos extraídos
 * @param {string} tipo - Tipo de incapacidad
 * @returns {string[]} - Lista de errores encontrados
 */
function validarCampos(campos, tipo) {
  const errores = [];
  
  // 1. Validar fecha de inicio
  if (!campos.fecha_inicio) {
    errores.push('No se encontró fecha de inicio de la incapacidad');
  }
  
  // 2. Validar fecha de fin
  if (!campos.fecha_fin) {
    errores.push('No se encontró fecha de fin de la incapacidad');
  }
  
  // 3. Validar coherencia de fechas
  if (campos.fecha_inicio && campos.fecha_fin) {
    const inicio = new Date(campos.fecha_inicio);
    const fin = new Date(campos.fecha_fin);
    
    if (inicio > fin) {
      errores.push(`Fecha de inicio (${campos.fecha_inicio}) es posterior a fecha de fin (${campos.fecha_fin})`);
    }
    
    // Validar que no sean fechas futuras (más de 7 días en el futuro)
    const hoy = new Date();
    const maxFuturo = new Date();
    maxFuturo.setDate(maxFuturo.getDate() + 7);
    
    if (inicio > maxFuturo) {
      errores.push('Fecha de inicio no puede ser más de 7 días en el futuro');
    }
    
    // Validar que no sea muy antigua (más de 2 años atrás)
    const dosPasado = new Date();
    dosPasado.setFullYear(dosPasado.getFullYear() - 2);
    
    if (inicio < dosPasado) {
      errores.push('Fecha de inicio no puede ser mayor a 2 años en el pasado');
    }
  }
  
  // 4. Validar nombre
  if (!campos.nombre) {
    errores.push('No se encontró el nombre del paciente/trabajador');
  }
  
  // 5. Validar documento
  if (!campos.documento) {
    errores.push('No se encontró el número de documento de identidad');
  } else if (campos.documento.length < 6 || campos.documento.length > 11) {
    errores.push(`Documento ${campos.documento} tiene longitud inválida (debe ser 6-11 dígitos)`);
  }
  
  // 6. Validaciones específicas por tipo
  if (tipo === 'Accidente Laboral') {
    if (!campos.diagnostico) {
      errores.push('Accidente laboral requiere diagnóstico/causa del accidente');
    }
    if (!campos.entidad || !campos.entidad.includes('ARL')) {
      errores.push('Accidente laboral debe ser emitido por ARL');
    }
  }
  
  if (tipo === 'Enfermedad General') {
    if (!campos.entidad || !campos.entidad.includes('EPS')) {
      // Advertencia, no error bloqueante
      console.warn('Advertencia: Enfermedad General debería ser emitida por EPS');
    }
  }
  
  if (tipo === 'DESCONOCIDO') {
    errores.push('No se pudo identificar el tipo de incapacidad. Verifique que el documento sea válido.');
  }
  
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

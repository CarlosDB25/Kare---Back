// src/services/ocrService.js
// Servicio para extraer texto de documentos PDF e imágenes usando OCR

import Tesseract from 'tesseract.js';
import fs from 'fs';

// Intentar cargar pdf-parse de manera más robusta
let pdfParse = null;

async function cargarPdfParse() {
  if (pdfParse !== null) return pdfParse;
  
  try {
    // pdf-parse v2+ exporta como named export "PDFParse"
    const { createRequire } = await import('module');
    const require = createRequire(import.meta.url);
    const module = require('pdf-parse');
    
    // La función de parsing está en module.PDFParse
    pdfParse = module.PDFParse;
    
    if (typeof pdfParse !== 'function') {
      console.error('[PDF-Parse] PDFParse no es función. Disponibles:', Object.keys(module));
      pdfParse = false;
      return false;
    }
    
    console.log('[PDF-Parse] ✓ Cargado exitosamente (PDFParse)');
    return pdfParse;
  } catch (error) {
    console.error('[PDF-Parse] Error de carga:', error.message);
    pdfParse = false;
    return false;
  }
}

/**
 * Extrae texto de un archivo PDF
 * NOTA: Solo funciona con PDFs que tienen texto seleccionable
 * Para PDFs escaneados (imágenes), usar extraerTextoImagen directamente
 * @param {string} rutaArchivo - Ruta al archivo PDF
 * @returns {Promise<string>} - Texto extraído del PDF
 */
export async function extraerTextoPDF(rutaArchivo) {
  try {
    const PDFParseClass = await cargarPdfParse();
    
    if (!PDFParseClass) {
      throw new Error('PDF_PARSER_NO_DISPONIBLE');
    }
    
    const dataBuffer = fs.readFileSync(rutaArchivo);
    console.log(`[PDF-Parse] Procesando archivo de ${dataBuffer.length} bytes`);
    
    // pdf-parse v2+ usa una clase: new PDFParse({data: buffer})
    const parser = new PDFParseClass({ data: dataBuffer });
    const result = await parser.getText();
    
    // Destruir el parser para liberar recursos
    await parser.destroy();
    
    if (!result || !result.text || result.text.trim().length < 10) {
      throw new Error('PDF_SIN_TEXTO');
    }
    
    console.log(`[PDF-Parse] ✓ Texto extraído: ${result.text.length} caracteres`);
    return result.text;
  } catch (error) {
    console.error('Error extrayendo texto de PDF:', error.message);
    
    // Si el PDF no tiene texto, es probable que sea escaneado
    if (error.message === 'PDF_SIN_TEXTO') {
      throw new Error('PDF_ESCANADO');
    }
    
    if (error.message === 'PDF_PARSER_NO_DISPONIBLE') {
      throw new Error('PDF_PARSER_NO_DISPONIBLE');
    }
    
    throw new Error(`Error procesando PDF: ${error.message || 'Archivo corrupto'}`);
  }
}

/**
 * Extrae texto de una imagen usando OCR (Tesseract)
 * Mejorado con pre-procesamiento y configuraciones avanzadas
 * @param {string} rutaArchivo - Ruta a la imagen (JPG, PNG, etc.)
 * @returns {Promise<{texto: string, confianza: number}>} - Texto extraído y nivel de confianza
 */
export async function extraerTextoImagen(rutaArchivo) {
  try {
    console.log('[OCR] Iniciando reconocimiento con Tesseract (configuración avanzada)...');
    
    const { data: { text, confidence, lines } } = await Tesseract.recognize(
      rutaArchivo,
      'spa', // Español
      {
        logger: m => {
          if (m.status === 'recognizing text') {
            console.log(`[OCR] Progreso: ${Math.round(m.progress * 100)}%`);
          }
        },
        // Configuración optimizada para documentos médicos formales
        tessedit_pageseg_mode: Tesseract.PSM.AUTO, // Detección automática de diseño
        tessedit_ocr_engine_mode: Tesseract.OEM.LSTM_ONLY, // Motor LSTM (mejor precisión)
        preserve_interword_spaces: '1',
        // Sin whitelist para capturar todos los caracteres especiales médicos
      }
    );
    
    // Limpieza avanzada del texto
    let textoLimpio = text
      // 1. Normalizar saltos de línea múltiples
      .replace(/\r\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      // 2. Corregir errores comunes de OCR
      .replace(/([a-z])I([a-z])/g, '$1l$2')  // I en medio de palabras → l
      .replace(/([A-Z])l([A-Z])/g, '$1I$2')  // l en medio de mayúsculas → I
      .replace(/0(?=[A-Z]{2})/g, 'O')        // 0 antes de mayúsculas → O (ej: 0CR → OCR)
      .replace(/O(?=\d{2,})/g, '0')          // O antes de números → 0 (ej: O123 → 0123)
      // 3. Limpiar caracteres raros pero mantener acentos y ñ
      .replace(/[`´']/g, "'")                // Normalizar apóstrofes
      .replace(/[""]/g, '"')                 // Normalizar comillas
      // 4. Normalizar espacios pero preservar estructura
      .replace(/[ \t]+/g, ' ')               // Múltiples espacios → 1 espacio
      .replace(/\n /g, '\n')                 // Quitar espacios al inicio de línea
      .replace(/ \n/g, '\n')                 // Quitar espacios al final de línea
      .trim();
    
    console.log(`[OCR] ✓ Extraídos ${textoLimpio.length} caracteres, confianza: ${Math.round(confidence)}%`);
    
    // Advertencias de calidad
    if (textoLimpio.length < 50) {
      console.warn('[OCR] ⚠ Texto muy corto - revisar calidad de imagen');
    }
    if (confidence < 60) {
      console.warn('[OCR] ⚠ Confianza baja - documento puede tener errores');
    }
    
    return {
      texto: textoLimpio,
      confianza: Math.round(confidence)
    };
  } catch (error) {
    console.error('[OCR] Error:', error.message);
    throw new Error('Error procesando imagen. Verifique que sea JPG/PNG con texto legible y buena calidad.');
  }
}

/**
 * Determina el tipo de archivo y extrae el texto correspondiente
 * @param {string} rutaArchivo - Ruta al archivo
 * @param {string} nombreArchivo - Nombre original del archivo
 * @returns {Promise<{texto: string, confianza: number}>}
 */
export async function extraerTextoDocumento(rutaArchivo, nombreArchivo) {
  const extension = nombreArchivo.toLowerCase().split('.').pop();
  
  console.log(`[OCR] Procesando archivo: ${nombreArchivo}, extensión: ${extension}`);
  
  if (extension === 'pdf') {
    try {
      const texto = await extraerTextoPDF(rutaArchivo);
      console.log(`[OCR] PDF procesado exitosamente: ${texto.length} caracteres extraídos`);
      return { texto, confianza: 100 }; // PDF con texto tiene 100% confianza
    } catch (error) {
      // Si el parser no está disponible, sugerir usar imágenes
      if (error.message === 'PDF_PARSER_NO_DISPONIBLE') {
        throw new Error('El procesamiento de PDFs no está disponible temporalmente. Por favor, convierta el documento a imagen JPG o PNG para usar OCR.');
      }
      
      // Si el PDF está escaneado, NO intentar OCR directo (Tesseract no soporta PDF)
      if (error.message === 'PDF_ESCANADO') {
        throw new Error('El PDF no contiene texto extraíble (probablemente es una imagen escaneada). Por favor, convierta el documento a imagen JPG o PNG para usar OCR.');
      }
      throw error;
    }
  }
  
  if (['jpg', 'jpeg', 'png', 'bmp', 'tiff'].includes(extension)) {
    console.log(`[OCR] Usando Tesseract para imagen ${extension}`);
    return await extraerTextoImagen(rutaArchivo);
  }
  
  throw new Error(`Formato de archivo no soportado: ${extension}. Use PDF con texto seleccionable, o imágenes JPG/PNG.`);
}

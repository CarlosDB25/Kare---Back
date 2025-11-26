// src/services/ocrService.js
// Servicio para extraer texto de documentos PDF e imágenes usando OCR

import Tesseract from 'tesseract.js';
import fs from 'fs';
import { createRequire } from 'module';

// Importar pdf-parse usando require (más confiable para CommonJS modules)
const require = createRequire(import.meta.url);
let pdfParse;
try {
  pdfParse = require('pdf-parse');
} catch (e) {
  console.error('No se pudo cargar pdf-parse:', e.message);
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
    if (!pdfParse || typeof pdfParse !== 'function') {
      throw new Error('pdf-parse no está disponible');
    }
    
    const dataBuffer = fs.readFileSync(rutaArchivo);
    const data = await pdfParse(dataBuffer);
    
    if (!data || !data.text || data.text.trim().length < 10) {
      throw new Error('PDF_SIN_TEXTO');
    }
    
    return data.text;
  } catch (error) {
    console.error('Error extrayendo texto de PDF:', error.message);
    
    // Si el PDF no tiene texto, es probable que sea escaneado
    if (error.message === 'PDF_SIN_TEXTO') {
      throw new Error('PDF_ESCANADO');
    }
    
    throw new Error(`Error procesando PDF: ${error.message || 'Archivo corrupto'}`);
  }
}

/**
 * Extrae texto de una imagen usando OCR (Tesseract)
 * @param {string} rutaArchivo - Ruta a la imagen (JPG, PNG, etc.)
 * @returns {Promise<{texto: string, confianza: number}>} - Texto extraído y nivel de confianza
 */
export async function extraerTextoImagen(rutaArchivo) {
  try {
    const { data: { text, confidence } } = await Tesseract.recognize(
      rutaArchivo,
      'spa', // Idioma español
      {
        logger: m => {
          // Log del progreso (opcional)
          if (m.status === 'recognizing text') {
            console.log(`OCR progreso: ${Math.round(m.progress * 100)}%`);
          }
        }
      }
    );
    
    return {
      texto: text,
      confianza: Math.round(confidence)
    };
  } catch (error) {
    console.error('Error en OCR de imagen:', error.message);
    throw new Error('No se pudo procesar la imagen. Verifique que sea un formato válido (JPG, PNG) y que tenga texto legible.');
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
  
  console.log(`[OCR] Procesando archivo: ${nombreArchivo}, extensión detectada: ${extension}`);
  
  if (extension === 'pdf') {
    try {
      const texto = await extraerTextoPDF(rutaArchivo);
      return { texto, confianza: 100 }; // PDF con texto tiene 100% confianza
    } catch (error) {
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

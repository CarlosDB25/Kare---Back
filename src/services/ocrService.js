// src/services/ocrService.js
// Servicio para extraer texto de documentos PDF e imágenes usando OCR

import Tesseract from 'tesseract.js';
import fs from 'fs';

/**
 * Extrae texto de un archivo PDF
 * NOTA: Solo funciona con PDFs que tienen texto seleccionable
 * Para PDFs escaneados (imágenes), usar extraerTextoImagen directamente
 * @param {string} rutaArchivo - Ruta al archivo PDF
 * @returns {Promise<string>} - Texto extraído del PDF
 */
export async function extraerTextoPDF(rutaArchivo) {
  try {
    // Intentar importación dinámica
    const pdfParse = (await import('pdf-parse')).default;
    
    if (typeof pdfParse !== 'function') {
      throw new Error('pdf-parse no se cargó correctamente');
    }
    
    const dataBuffer = fs.readFileSync(rutaArchivo);
    const data = await pdfParse(dataBuffer);
    
    if (!data || !data.text || data.text.trim().length < 10) {
      throw new Error('PDF_SIN_TEXTO');
    }
    
    return data.text;
  } catch (error) {
    console.error('Error extrayendo texto de PDF:', error.message);
    
    // Si el PDF no tiene texto, intentar OCR sobre el PDF como imagen
    if (error.message === 'PDF_SIN_TEXTO' || error.message.includes('pdf-parse')) {
      console.log('PDF sin texto extraíble, intentando OCR...');
      // Para PDFs escaneados, sugerir convertir a imagen
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
        langPath: './spa.traineddata', // Ruta al archivo de idioma
      }
    );
    
    return {
      texto: text,
      confianza: Math.round(confidence)
    };
  } catch (error) {
    console.error('Error en OCR de imagen:', error);
    throw new Error('No se pudo procesar la imagen. Intente con mejor calidad o iluminación.');
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
  
  if (extension === 'pdf') {
    try {
      const texto = await extraerTextoPDF(rutaArchivo);
      return { texto, confianza: 100 }; // PDF con texto tiene 100% confianza
    } catch (error) {
      // Si el PDF está escaneado, intentar OCR como si fuera imagen
      if (error.message === 'PDF_ESCANADO') {
        console.log('Intentando OCR en PDF escaneado...');
        return await extraerTextoImagen(rutaArchivo);
      }
      throw error;
    }
  }
  
  if (['jpg', 'jpeg', 'png', 'bmp', 'tiff'].includes(extension)) {
    return await extraerTextoImagen(rutaArchivo);
  }
  
  throw new Error(`Formato de archivo no soportado: ${extension}. Use PDF, JPG o PNG.`);
}

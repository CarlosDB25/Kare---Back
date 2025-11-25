// src/services/ocrService.js
// Servicio para extraer texto de documentos PDF e imágenes usando OCR

import Tesseract from 'tesseract.js';
import fs from 'fs';

/**
 * Extrae texto de un archivo PDF
 * @param {string} rutaArchivo - Ruta al archivo PDF
 * @returns {Promise<string>} - Texto extraído del PDF
 */
export async function extraerTextoPDF(rutaArchivo) {
  try {
    // Importación dinámica de pdf-parse
    const pdfParse = (await import('pdf-parse')).default;
    const dataBuffer = fs.readFileSync(rutaArchivo);
    const data = await pdfParse(dataBuffer);
    
    if (!data || !data.text) {
      throw new Error('El PDF no contiene texto extraíble');
    }
    
    return data.text;
  } catch (error) {
    console.error('Error extrayendo texto de PDF:', error.message);
    // Si el PDF es imagen escaneada, sugerir usar OCR de imagen
    if (error.message && error.message.includes('text')) {
      throw new Error('El PDF parece ser una imagen escaneada. Intente convertirlo a imagen (JPG/PNG) para OCR.');
    }
    throw new Error(`Error procesando PDF: ${error.message || 'Archivo corrupto o no compatible'}`);
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
    const texto = await extraerTextoPDF(rutaArchivo);
    return { texto, confianza: 100 }; // PDF siempre tiene 100% confianza
  }
  
  if (['jpg', 'jpeg', 'png', 'bmp', 'tiff'].includes(extension)) {
    return await extraerTextoImagen(rutaArchivo);
  }
  
  throw new Error(`Formato de archivo no soportado: ${extension}. Use PDF, JPG o PNG.`);
}

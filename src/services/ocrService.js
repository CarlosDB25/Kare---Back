// src/services/ocrService.js
// Servicio para extraer texto de documentos PDF e imágenes usando OCR

import Tesseract from 'tesseract.js';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { PDFParse } = require('pdf-parse');
import fs from 'fs';

/**
 * Extrae texto de un archivo PDF
 * @param {string} rutaArchivo - Ruta al archivo PDF
 * @returns {Promise<string>} - Texto extraído del PDF
 */
export async function extraerTextoPDF(rutaArchivo) {
  try {
    const buffer = fs.readFileSync(rutaArchivo);
    const parser = new PDFParse({ data: buffer });
    const result = await parser.getText();
    await parser.destroy();
    
    console.log(`PDF procesado: ${result.totalPages} páginas, ${result.text.length} caracteres`);
    
    return result.text;
  } catch (error) {
    console.error('Error extrayendo texto de PDF:', error);
    throw new Error('No se pudo procesar el PDF. Verifique que el archivo no esté corrupto.');
  }
}

/**
 * Extrae texto de una imagen usando OCR (Tesseract)
 * @param {string} rutaArchivo - Ruta a la imagen (JPG, PNG, etc.)
 * @returns {Promise<{texto: string, confianza: number}>} - Texto extraído y nivel de confianza
 */
export async function extraerTextoImagen(rutaArchivo) {
  try {
    console.log('Iniciando OCR de imagen...');
    
    const { data: { text, confidence } } = await Tesseract.recognize(
      rutaArchivo,
      'spa', // Idioma español
      {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            console.log(`OCR progreso: ${Math.round(m.progress * 100)}%`);
          }
        }
      }
    );
    
    console.log(`OCR completado: Confianza ${Math.round(confidence)}%`);
    
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

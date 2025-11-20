import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let db = null;

/**
 * Inicializa la conexión a la base de datos SQLite
 */
export async function initDatabase() {
  if (db) return db;

  const dbPath = process.env.DB_PATH || join(__dirname, 'kare.db');

  db = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });

  console.log('Base de datos conectada:', dbPath);

  // Crear tablas si no existen
  await createTables();

  return db;
}

/**
 * Verifica que las tablas existan (deben ser creadas con setup-db.js)
 */
async function createTables() {
  // Verificar si las tablas críticas existen
  const tablas = await db.all(`
    SELECT name FROM sqlite_master 
    WHERE type='table' AND name IN ('usuarios', 'incapacidades', 'historial_estados', 'conciliaciones', 'notificaciones')
  `);
  
  if (tablas.length < 5) {
    console.warn('ADVERTENCIA: Faltan tablas en la BD. Ejecuta: node tools/setup-db.js');
    console.warn(`   Tablas encontradas: ${tablas.map(t => t.name).join(', ')}`);
  } else {
    console.log('Tablas de base de datos verificadas');
  }
}

/**
 * Obtiene la instancia de la base de datos
 */
export function getDatabase() {
  if (!db) {
    throw new Error('Base de datos no inicializada. Llama a initDatabase() primero.');
  }
  return db;
}

/**
 * Cierra la conexión a la base de datos
 */
export async function closeDatabase() {
  if (db) {
    await db.close();
    db = null;
    console.log('Base de datos cerrada');
  }
}

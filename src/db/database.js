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
 * Crea las tablas de la base de datos si no existen
 */
async function createTables() {
  // Verificar si las tablas tienen el esquema correcto
  try {
    // Verificar columnas en incapacidades
    const columnasIncapacidades = await db.all(`PRAGMA table_info(incapacidades)`);
    const tieneIBC = columnasIncapacidades.some(col => col.name === 'ibc');
    const tieneSalarioBase = columnasIncapacidades.some(col => col.name === 'salario_base');
    const tieneOCRData = columnasIncapacidades.some(col => col.name === 'ocr_data');
    const tieneDocumentoPath = columnasIncapacidades.some(col => col.name === 'documento_path');
    
    // Verificar columnas en conciliaciones
    const columnasConciliaciones = await db.all(`PRAGMA table_info(conciliaciones)`);
    const tieneDiasIncapacidad = columnasConciliaciones.some(col => col.name === 'dias_incapacidad');
    
    // Si falta alguna columna crítica, recrear todas las tablas
    const necesitaRecreacion = 
      (columnasIncapacidades.length > 0 && (!tieneIBC || !tieneSalarioBase || !tieneOCRData || !tieneDocumentoPath)) ||
      (columnasConciliaciones.length > 0 && !tieneDiasIncapacidad);
    
    if (necesitaRecreacion) {
      console.log('[DB] Esquema antiguo detectado. Recreando base de datos...');
      // Eliminar todas las tablas para recrearlas
      await db.exec(`DROP TABLE IF EXISTS reemplazos`);
      await db.exec(`DROP TABLE IF EXISTS conciliaciones`);
      await db.exec(`DROP TABLE IF EXISTS notificaciones`);
      await db.exec(`DROP TABLE IF EXISTS historial_estados`);
      await db.exec(`DROP TABLE IF EXISTS incapacidades`);
      await db.exec(`DROP TABLE IF EXISTS usuarios`);
    }
  } catch (error) {
    // Tabla no existe, continuar con creación normal
  }

  console.log('[DB] Creando tablas de la base de datos...');

  // Tabla usuarios
  await db.exec(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      documento TEXT,
      rol TEXT NOT NULL CHECK(rol IN ('gh', 'conta', 'lider', 'colaborador')),
      salario_base REAL,
      ibc REAL,
      area TEXT,
      cargo TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Tabla incapacidades
  await db.exec(`
    CREATE TABLE IF NOT EXISTS incapacidades (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      usuario_id INTEGER NOT NULL,
      tipo TEXT NOT NULL CHECK(tipo IN ('EPS', 'ARL', 'Licencia_Maternidad', 'Licencia_Paternidad')),
      diagnostico TEXT NOT NULL,
      fecha_inicio DATE NOT NULL,
      fecha_fin DATE NOT NULL,
      dias_totales INTEGER NOT NULL,
      ibc REAL,
      salario_base REAL,
      estado TEXT DEFAULT 'reportada' CHECK(estado IN ('reportada', 'en_revision', 'validada', 'rechazada', 'pagada', 'conciliada', 'archivada')),
      documento_url TEXT,
      documento_path TEXT,
      ocr_data TEXT,
      observaciones TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
    );
  `);

  // Tabla historial_estados
  await db.exec(`
    CREATE TABLE IF NOT EXISTS historial_estados (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      incapacidad_id INTEGER NOT NULL,
      estado_anterior TEXT,
      estado_nuevo TEXT NOT NULL,
      usuario_cambio_id INTEGER,
      observaciones TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (incapacidad_id) REFERENCES incapacidades(id) ON DELETE CASCADE,
      FOREIGN KEY (usuario_cambio_id) REFERENCES usuarios(id)
    );
  `);

  // Tabla notificaciones
  await db.exec(`
    CREATE TABLE IF NOT EXISTS notificaciones (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      usuario_id INTEGER NOT NULL,
      titulo TEXT NOT NULL,
      mensaje TEXT NOT NULL,
      tipo TEXT DEFAULT 'info' CHECK(tipo IN ('info', 'success', 'warning', 'error')),
      leida INTEGER DEFAULT 0,
      incapacidad_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
      FOREIGN KEY (incapacidad_id) REFERENCES incapacidades(id) ON DELETE CASCADE
    );
  `);

  // Tabla conciliaciones
  await db.exec(`
    CREATE TABLE IF NOT EXISTS conciliaciones (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      incapacidad_id INTEGER NOT NULL UNIQUE,
      dias_incapacidad INTEGER NOT NULL,
      salario_base REAL NOT NULL,
      ibc REAL NOT NULL,
      valor_dia REAL NOT NULL,
      dias_eps_100 INTEGER DEFAULT 0,
      monto_eps_100 REAL DEFAULT 0,
      dias_empresa_67 INTEGER DEFAULT 0,
      monto_empresa_67 REAL DEFAULT 0,
      dias_arl_100 INTEGER DEFAULT 0,
      monto_arl_100 REAL DEFAULT 0,
      total_a_pagar REAL NOT NULL,
      estado_pago TEXT DEFAULT 'pendiente' CHECK(estado_pago IN ('pendiente', 'aprobado', 'pagado', 'rechazado')),
      observaciones TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (incapacidad_id) REFERENCES incapacidades(id) ON DELETE CASCADE
    );
  `);

  // Tabla reemplazos
  await db.exec(`
    CREATE TABLE IF NOT EXISTS reemplazos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      incapacidad_id INTEGER NOT NULL,
      colaborador_reemplazo_id INTEGER NOT NULL,
      fecha_inicio DATE NOT NULL,
      fecha_fin DATE NOT NULL,
      estado TEXT DEFAULT 'activo' CHECK(estado IN ('activo', 'finalizado', 'cancelado')),
      observaciones TEXT,
      created_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (incapacidad_id) REFERENCES incapacidades(id) ON DELETE CASCADE,
      FOREIGN KEY (colaborador_reemplazo_id) REFERENCES usuarios(id),
      FOREIGN KEY (created_by) REFERENCES usuarios(id)
    );
  `);

  console.log('[DB] Tablas creadas exitosamente');

  // Crear usuarios de prueba
  await createDefaultUsers();
}

/**
 * Crea usuarios de prueba si no existen
 */
async function createDefaultUsers() {
  const usuariosExistentes = await db.get('SELECT COUNT(*) as count FROM usuarios');
  
  if (usuariosExistentes.count > 0) {
    console.log('[DB] Usuarios ya existen');
    return;
  }

  console.log('[DB] Creando usuarios de prueba...');

  const bcrypt = await import('bcryptjs');
  const saltRounds = 10;

  const usuarios = [
    {
      nombre: 'Admin GH',
      email: 'gh@kare.com',
      password: await bcrypt.hash('123456', saltRounds),
      documento: '1000000001',
      rol: 'gh',
      salario_base: 5000000,
      ibc: 5000000,
      area: 'Gestión Humana',
      cargo: 'Director GH'
    },
    {
      nombre: 'Contador Principal',
      email: 'conta@kare.com',
      password: await bcrypt.hash('123456', saltRounds),
      documento: '1000000002',
      rol: 'conta',
      salario_base: 4500000,
      ibc: 4500000,
      area: 'Contabilidad',
      cargo: 'Contador'
    },
    {
      nombre: 'Líder de Equipo',
      email: 'lider1@kare.com',
      password: await bcrypt.hash('123456', saltRounds),
      documento: '1000000003',
      rol: 'lider',
      salario_base: 4000000,
      ibc: 4000000,
      area: 'Operaciones',
      cargo: 'Líder'
    },
    {
      nombre: 'Juan Pérez',
      email: 'colab1@kare.com',
      password: await bcrypt.hash('123456', saltRounds),
      documento: '1000000004',
      rol: 'colaborador',
      salario_base: 3000000,
      ibc: 3000000,
      area: 'Operaciones',
      cargo: 'Colaborador'
    },
    {
      nombre: 'María García',
      email: 'colab2@kare.com',
      password: await bcrypt.hash('123456', saltRounds),
      documento: '1000000005',
      rol: 'colaborador',
      salario_base: 3200000,
      ibc: 3200000,
      area: 'Operaciones',
      cargo: 'Colaborador'
    },
    {
      nombre: 'Carlos Rodríguez',
      email: 'colab3@kare.com',
      password: await bcrypt.hash('123456', saltRounds),
      documento: '1000000006',
      rol: 'colaborador',
      salario_base: 2900000,
      ibc: 2900000,
      area: 'Operaciones',
      cargo: 'Colaborador'
    },
    {
      nombre: 'Ana Martínez',
      email: 'colab4@kare.com',
      password: await bcrypt.hash('123456', saltRounds),
      documento: '1000000007',
      rol: 'colaborador',
      salario_base: 3100000,
      ibc: 3100000,
      area: 'Operaciones',
      cargo: 'Colaborador'
    },
    {
      nombre: 'Luis González',
      email: 'colab5@kare.com',
      password: await bcrypt.hash('123456', saltRounds),
      documento: '1000000008',
      rol: 'colaborador',
      salario_base: 3050000,
      ibc: 3050000,
      area: 'Operaciones',
      cargo: 'Colaborador'
    }
  ];

  for (const usuario of usuarios) {
    await db.run(`
      INSERT INTO usuarios (nombre, email, password, documento, rol, salario_base, ibc, area, cargo)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [usuario.nombre, usuario.email, usuario.password, usuario.documento, usuario.rol, usuario.salario_base, usuario.ibc, usuario.area, usuario.cargo]);
  }

  console.log('[DB] Usuarios de prueba creados exitosamente');
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

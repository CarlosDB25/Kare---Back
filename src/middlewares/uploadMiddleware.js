import multer from 'multer';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuración de almacenamiento
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = join(__dirname, '..', 'uploads');
    
    // Crear directorio base si no existe
    if (!existsSync(uploadPath)) {
      mkdirSync(uploadPath, { recursive: true });
    }

    // Si hay usuario autenticado, crear subdirectorio por usuario
    if (req.user && req.user.id) {
      const userUploadPath = join(uploadPath, `user_${req.user.id}`);
      if (!existsSync(userUploadPath)) {
        mkdirSync(userUploadPath, { recursive: true });
      }
      cb(null, userUploadPath);
    } else {
      // Si no hay usuario (ej: durante validación antes de crear), usar carpeta temporal
      const tempPath = join(uploadPath, 'temp');
      if (!existsSync(tempPath)) {
        mkdirSync(tempPath, { recursive: true });
      }
      cb(null, tempPath);
    }
  },
  filename: (req, file, cb) => {
    // Generar nombre único: timestamp-userid-nombreoriginal
    const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    const userId = req.user ? req.user.id : 'temp';
    const uniqueName = `${Date.now()}-user${userId}-${sanitizedName}`;
    cb(null, uniqueName);
  }
});

// Filtro de archivos (solo imágenes y PDFs)
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.pdf'];
  
  const ext = file.originalname.toLowerCase().substring(file.originalname.lastIndexOf('.'));
  
  if (allowedTypes.includes(file.mimetype) && allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    const error = new Error('Formato no soportado. Solo se aceptan: JPG, JPEG, PNG, PDF');
    error.statusCode = 400; // Marcar como Bad Request
    cb(error, false);
  }
};

// Configuración de multer
export const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB máximo
  }
});

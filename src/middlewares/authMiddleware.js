import jwt from 'jsonwebtoken';

/**
 * Middleware para autenticar solicitudes mediante JWT
 * Valida el token y adjunta la información del usuario a req.user
 */
export function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Token no proporcionado',
        data: null
      });
    }

    const token = authHeader.substring(7); // Quitar "Bearer "

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Adjuntar datos del usuario al request
    req.user = decoded;

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Token inválido o expirado',
      data: null
    });
  }
}

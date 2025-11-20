/**
 * Middleware para verificar roles de usuario
 * @param {string[]} rolesPermitidos - Array de roles que pueden acceder
 */
export function roleMiddleware(rolesPermitidos) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado',
        data: null
      });
    }

    if (!rolesPermitidos.includes(req.user.rol)) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para realizar esta acción',
        data: null
      });
    }

    next();
  };
}

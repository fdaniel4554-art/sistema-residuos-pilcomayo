const jwt = require('jsonwebtoken');
const prisma = require('../config/database');

const authMiddleware = async (req, res, next) => {
    try {
        // Obtener token del header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                error: 'Token no proporcionado'
            });
        }

        const token = authHeader.substring(7); // Remover 'Bearer '

        // Verificar token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Buscar usuario
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                active: true
            }
        });

        if (!user) {
            return res.status(401).json({
                error: 'Usuario no encontrado'
            });
        }

        if (!user.active) {
            return res.status(403).json({
                error: 'Usuario inactivo'
            });
        }

        // Agregar usuario al request
        req.user = user;
        next();

    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                error: 'Token inválido'
            });
        }

        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                error: 'Token expirado'
            });
        }

        console.error('Error en authMiddleware:', error);
        return res.status(500).json({
            error: 'Error de autenticación'
        });
    }
};

// Middleware para verificar roles
const roleMiddleware = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                error: 'No autenticado'
            });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                error: 'No tienes permisos para esta acción'
            });
        }

        next();
    };
};

module.exports = { authMiddleware, roleMiddleware };

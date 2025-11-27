const express = require('express');
const router = express.Router();
const routeController = require('../controllers/route.controller');
const { authMiddleware, roleMiddleware } = require('../middlewares/auth.middleware');

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// Solo brigadas y admins pueden optimizar rutas
router.get('/optimize',
    roleMiddleware('ADMIN', 'BRIGADE', 'DRIVER'),
    routeController.getOptimizedRoute
);

module.exports = router;

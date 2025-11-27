const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analytics.controller');
const { authMiddleware, roleMiddleware } = require('../middlewares/auth.middleware');

// Todos los endpoints de analytics requieren autenticación

// Puntos críticos
router.get('/critical-points', authMiddleware, roleMiddleware('ADMIN', 'BRIGADE'), analyticsController.getCriticalPoints);

// Tendencias
router.get('/trends', authMiddleware, roleMiddleware('ADMIN'), analyticsController.getTrends);

// Predicciones
router.get('/predictions', authMiddleware, roleMiddleware('ADMIN'), analyticsController.getPredictions);

module.exports = router;

const express = require('express');
const router = express.Router();
const reportController = require('../controllers/report.controller');
const { authMiddleware, roleMiddleware } = require('../middlewares/auth.middleware');

// Todos los reportes requieren autenticación y rol ADMIN

// Reporte diario
router.get('/daily', authMiddleware, roleMiddleware('ADMIN'), reportController.getDailyReport);

// Reporte semanal
router.get('/weekly', authMiddleware, roleMiddleware('ADMIN'), reportController.getWeeklyReport);

// Reporte mensual
router.get('/monthly', authMiddleware, roleMiddleware('ADMIN'), reportController.getMonthlyReport);

module.exports = router;

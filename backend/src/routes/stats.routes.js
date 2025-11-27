const express = require('express');
const router = express.Router();
const statsController = require('../controllers/stats.controller');
const { authMiddleware } = require('../middlewares/auth.middleware');

// Todas las rutas requieren autenticación
router.use(authMiddleware);

router.get('/general', statsController.getGeneralStats);
router.get('/waste-types', statsController.getWasteTypeStats);
router.get('/severity', statsController.getSeverityStats);
router.get('/trend', statsController.getIncidentsTrend);
router.get('/critical-points', statsController.getCriticalPoints);
router.get('/brigade-performance', statsController.getBrigadePerformance);

module.exports = router;

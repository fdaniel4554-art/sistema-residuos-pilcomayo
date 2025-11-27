const criticalPointsService = require('../services/ai/criticalPoints.service');

/**
 * Controlador de Analytics y Puntos Críticos
 */

// Obtener puntos críticos
exports.getCriticalPoints = async (req, res) => {
    try {
        const days = parseInt(req.query.days) || 30;
        const criticalPoints = await criticalPointsService.identifyCriticalPoints(days);

        res.json({
            success: true,
            data: criticalPoints
        });
    } catch (error) {
        console.error('Error al obtener puntos críticos:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Analizar tendencias
exports.getTrends = async (req, res) => {
    try {
        const days = parseInt(req.query.days) || 90;
        const trends = await criticalPointsService.analyzeTrends(days);

        res.json({
            success: true,
            data: trends
        });
    } catch (error) {
        console.error('Error al analizar tendencias:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Predecir zonas de riesgo
exports.getPredictions = async (req, res) => {
    try {
        const predictions = await criticalPointsService.predictRiskZones();

        res.json({
            success: true,
            data: predictions
        });
    } catch (error) {
        console.error('Error al predecir zonas de riesgo:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

module.exports = exports;

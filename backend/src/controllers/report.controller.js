const reportService = require('../services/report.service');

/**
 * Controlador de Reportes
 */

// Generar reporte diario
exports.getDailyReport = async (req, res) => {
    try {
        const date = req.query.date ? new Date(req.query.date) : new Date();
        const report = await reportService.generateDailyReport(date);

        res.json({
            success: true,
            data: report
        });
    } catch (error) {
        console.error('Error al generar reporte diario:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Generar reporte semanal
exports.getWeeklyReport = async (req, res) => {
    try {
        const date = req.query.date ? new Date(req.query.date) : new Date();
        const report = await reportService.generateWeeklyReport(date);

        res.json({
            success: true,
            data: report
        });
    } catch (error) {
        console.error('Error al generar reporte semanal:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Generar reporte mensual
exports.getMonthlyReport = async (req, res) => {
    try {
        const year = parseInt(req.query.year) || new Date().getFullYear();
        const month = parseInt(req.query.month) || new Date().getMonth() + 1;

        const report = await reportService.generateMonthlyReport(year, month);

        res.json({
            success: true,
            data: report
        });
    } catch (error) {
        console.error('Error al generar reporte mensual:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

module.exports = exports;

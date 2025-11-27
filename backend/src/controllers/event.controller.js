const eventDetectionService = require('../services/ai/eventDetection.service');

/**
 * Controlador de Eventos Externos
 */

// Crear nuevo evento
exports.createEvent = async (req, res) => {
    try {
        const event = await eventDetectionService.registerEvent(req.body);
        res.json({
            success: true,
            message: 'Evento registrado exitosamente',
            data: event
        });
    } catch (error) {
        console.error('Error al crear evento:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Obtener todos los eventos activos
exports.getEvents = async (req, res) => {
    try {
        const events = eventDetectionService.getActiveEvents();
        res.json({
            success: true,
            data: events
        });
    } catch (error) {
        console.error('Error al obtener eventos:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Desactivar un evento
exports.deactivateEvent = async (req, res) => {
    try {
        await eventDetectionService.deactivateEvent(req.params.id);
        res.json({
            success: true,
            message: 'Evento desactivado exitosamente'
        });
    } catch (error) {
        console.error('Error al desactivar evento:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Verificar si una ubicación está afectada
exports.checkLocation = async (req, res) => {
    try {
        const { latitude, longitude } = req.query;

        if (!latitude || !longitude) {
            return res.status(400).json({
                success: false,
                error: 'Se requieren latitude y longitude'
            });
        }

        const isAffected = eventDetectionService.isLocationAffected(
            parseFloat(latitude),
            parseFloat(longitude)
        );

        res.json({
            success: true,
            data: { isAffected }
        });
    } catch (error) {
        console.error('Error al verificar ubicación:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

module.exports = exports;

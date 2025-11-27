const routeService = require('../services/route.service');
const prisma = require('../config/database');

const getOptimizedRoute = async (req, res) => {
    try {
        const { latitude, longitude } = req.query;

        if (!latitude || !longitude) {
            return res.status(400).json({
                error: 'Se requieren coordenadas de inicio (latitude, longitude)'
            });
        }

        // Obtener incidencias pendientes o asignadas
        const incidents = await prisma.incident.findMany({
            where: {
                status: { in: ['PENDING', 'ASSIGNED'] }
            },
            select: {
                id: true,
                description: true,
                latitude: true,
                longitude: true,
                severity: true,
                wasteType: true,
                address: true,
                status: true
            }
        });

        const startLocation = {
            latitude: parseFloat(latitude),
            longitude: parseFloat(longitude)
        };

        const result = await routeService.optimizeRoute(startLocation, incidents);

        res.json(result);

    } catch (error) {
        console.error('Error en getOptimizedRoute:', error);
        res.status(500).json({
            error: 'Error al optimizar ruta'
        });
    }
};

module.exports = {
    getOptimizedRoute
};

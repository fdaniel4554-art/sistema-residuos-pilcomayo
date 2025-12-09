const BrigadeLocation = require('../models/BrigadeLocation');
const User = require('../models/User');

// Actualizar ubicación de la brigada
exports.updateLocation = async (req, res) => {
    try {
        const { latitude, longitude, accuracy, speed, heading, currentIncidentId } = req.body;
        const brigadeId = req.user.id;

        // Verificar que el usuario sea una brigada
        if (req.user.role !== 'BRIGADE') {
            return res.status(403).json({
                error: 'Solo las brigadas pueden actualizar su ubicación'
            });
        }

        // Validar coordenadas
        if (!latitude || !longitude) {
            return res.status(400).json({
                error: 'Latitud y longitud son requeridas'
            });
        }

        if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
            return res.status(400).json({
                error: 'Coordenadas inválidas'
            });
        }

        // Crear nueva ubicación
        const location = new BrigadeLocation({
            brigadeId,
            latitude,
            longitude,
            accuracy,
            speed,
            heading,
            currentIncidentId: currentIncidentId || null,
            isActive: true,
            timestamp: new Date()
        });

        await location.save();

        res.status(200).json({
            message: 'Ubicación actualizada correctamente',
            location: {
                latitude: location.latitude,
                longitude: location.longitude,
                timestamp: location.timestamp
            }
        });
    } catch (error) {
        console.error('Error al actualizar ubicación:', error);
        res.status(500).json({
            error: 'Error al actualizar ubicación'
        });
    }
};

// Obtener todas las ubicaciones activas (Admin)
exports.getAllLocations = async (req, res) => {
    try {
        const locations = await BrigadeLocation.getAllActiveLocations();

        // Formatear respuesta
        const formattedLocations = locations.map(loc => ({
            id: loc._id,
            brigade: {
                id: loc.brigadeId?._id,
                name: loc.brigadeId?.name,
                email: loc.brigadeId?.email
            },
            latitude: loc.latitude,
            longitude: loc.longitude,
            accuracy: loc.accuracy,
            speed: loc.speed,
            heading: loc.heading,
            currentIncident: loc.currentIncidentId ? {
                id: loc.currentIncidentId._id,
                description: loc.currentIncidentId.description,
                address: loc.currentIncidentId.address,
                status: loc.currentIncidentId.status,
                latitude: loc.currentIncidentId.latitude,
                longitude: loc.currentIncidentId.longitude
            } : null,
            timestamp: loc.timestamp,
            lastUpdate: getTimeAgo(loc.timestamp)
        }));

        res.status(200).json({
            locations: formattedLocations,
            total: formattedLocations.length
        });
    } catch (error) {
        console.error('Error al obtener ubicaciones:', error);
        res.status(500).json({
            error: 'Error al obtener ubicaciones'
        });
    }
};

// Obtener ubicación de una brigada específica
exports.getBrigadeLocation = async (req, res) => {
    try {
        const { brigadeId } = req.params;

        const location = await BrigadeLocation.getLatestLocation(brigadeId);

        if (!location) {
            return res.status(404).json({
                error: 'No se encontró ubicación para esta brigada'
            });
        }

        res.status(200).json({
            location: {
                id: location._id,
                brigade: {
                    id: location.brigadeId?._id,
                    name: location.brigadeId?.name,
                    email: location.brigadeId?.email
                },
                latitude: location.latitude,
                longitude: location.longitude,
                accuracy: location.accuracy,
                speed: location.speed,
                heading: location.heading,
                currentIncident: location.currentIncidentId ? {
                    id: location.currentIncidentId._id,
                    description: location.currentIncidentId.description,
                    address: location.currentIncidentId.address,
                    status: location.currentIncidentId.status
                } : null,
                timestamp: location.timestamp,
                lastUpdate: getTimeAgo(location.timestamp)
            }
        });
    } catch (error) {
        console.error('Error al obtener ubicación de brigada:', error);
        res.status(500).json({
            error: 'Error al obtener ubicación'
        });
    }
};

// Desactivar compartir ubicación
exports.deactivateLocation = async (req, res) => {
    try {
        const brigadeId = req.user.id;

        await BrigadeLocation.updateMany(
            { brigadeId },
            { $set: { isActive: false } }
        );

        res.status(200).json({
            message: 'Ubicación desactivada correctamente'
        });
    } catch (error) {
        console.error('Error al desactivar ubicación:', error);
        res.status(500).json({
            error: 'Error al desactivar ubicación'
        });
    }
};

// Obtener brigadas cercanas a un punto (útil para asignación inteligente)
exports.getNearbyBrigades = async (req, res) => {
    try {
        const { latitude, longitude, maxDistance = 5000 } = req.query; // maxDistance en metros

        if (!latitude || !longitude) {
            return res.status(400).json({
                error: 'Latitud y longitud son requeridas'
            });
        }

        const locations = await BrigadeLocation.getAllActiveLocations();

        // Calcular distancias
        const brigadesWithDistance = locations.map(loc => {
            const distance = calculateDistance(
                parseFloat(latitude),
                parseFloat(longitude),
                loc.latitude,
                loc.longitude
            );

            return {
                ...loc.toObject(),
                distance: Math.round(distance)
            };
        }).filter(loc => loc.distance <= maxDistance)
            .sort((a, b) => a.distance - b.distance);

        res.status(200).json({
            brigades: brigadesWithDistance,
            total: brigadesWithDistance.length
        });
    } catch (error) {
        console.error('Error al buscar brigadas cercanas:', error);
        res.status(500).json({
            error: 'Error al buscar brigadas cercanas'
        });
    }
};

// Función auxiliar para calcular distancia entre dos puntos (Haversine)
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // Radio de la Tierra en metros
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) *
        Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distancia en metros
}

// Función auxiliar para calcular tiempo transcurrido
function getTimeAgo(timestamp) {
    const seconds = Math.floor((new Date() - new Date(timestamp)) / 1000);

    if (seconds < 60) return `Hace ${seconds} segundos`;
    if (seconds < 3600) return `Hace ${Math.floor(seconds / 60)} minutos`;
    if (seconds < 86400) return `Hace ${Math.floor(seconds / 3600)} horas`;
    return `Hace ${Math.floor(seconds / 86400)} días`;
}

module.exports = exports;

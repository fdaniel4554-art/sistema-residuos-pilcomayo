const prisma = require('../../config/database');

/**
 * Servicio de Detección de Eventos Externos
 * Detecta paros, construcciones, accidentes y otros eventos que afectan las rutas
 */

class EventDetectionService {
    constructor() {
        this.events = [];
        this.loadEvents();
    }

    /**
     * Cargar eventos desde la base de datos
     */
    async loadEvents() {
        try {
            // En producción, esto vendría de una base de datos o API externa
            this.events = await prisma.externalEvent.findMany({
                where: {
                    active: true,
                    OR: [
                        { endDate: null },
                        { endDate: { gte: new Date() } }
                    ]
                }
            });
        } catch (error) {
            console.error('Error al cargar eventos:', error);
            this.events = [];
        }
    }

    /**
     * Registrar un nuevo evento externo
     */
    async registerEvent(eventData) {
        try {
            const event = await prisma.externalEvent.create({
                data: {
                    type: eventData.type, // 'STRIKE', 'CONSTRUCTION', 'ACCIDENT', 'WEATHER'
                    description: eventData.description,
                    affectedStreets: eventData.affectedStreets || [],
                    latitude: eventData.latitude,
                    longitude: eventData.longitude,
                    radius: eventData.radius || 500, // metros
                    severity: eventData.severity || 'MEDIUM',
                    startDate: eventData.startDate || new Date(),
                    endDate: eventData.endDate,
                    active: true
                }
            });

            this.events.push(event);
            return event;
        } catch (error) {
            console.error('Error al registrar evento:', error);
            throw error;
        }
    }

    /**
     * Verificar si una ubicación está afectada por algún evento
     */
    isLocationAffected(latitude, longitude) {
        return this.events.some(event => {
            const distance = this.calculateDistance(
                latitude,
                longitude,
                event.latitude,
                event.longitude
            );
            return distance <= event.radius;
        });
    }

    /**
     * Obtener eventos que afectan una ruta
     */
    getAffectingEvents(route) {
        const affectingEvents = [];

        route.forEach(point => {
            this.events.forEach(event => {
                const distance = this.calculateDistance(
                    point.latitude,
                    point.longitude,
                    event.latitude,
                    event.longitude
                );

                if (distance <= event.radius) {
                    affectingEvents.push({
                        event,
                        point,
                        distance
                    });
                }
            });
        });

        return affectingEvents;
    }

    /**
     * Calcular distancia entre dos puntos (fórmula de Haversine)
     */
    calculateDistance(lat1, lon1, lat2, lon2) {
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

    /**
     * Desactivar un evento
     */
    async deactivateEvent(eventId) {
        try {
            await prisma.externalEvent.update({
                where: { id: eventId },
                data: { active: false }
            });

            this.events = this.events.filter(e => e.id !== eventId);
        } catch (error) {
            console.error('Error al desactivar evento:', error);
            throw error;
        }
    }

    /**
     * Obtener todos los eventos activos
     */
    getActiveEvents() {
        return this.events;
    }
}

module.exports = new EventDetectionService();

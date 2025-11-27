const eventDetectionService = require('./eventDetection.service');
const criticalPointsService = require('./criticalPoints.service');

/**
 * Servicio de Optimización Avanzada de Rutas
 * Considera eventos externos, puntos críticos, recursos y prioridades
 */

class RouteOptimizationService {
    /**
     * Optimizar ruta considerando todos los factores
     */
    async optimizeRoute(incidents, options = {}) {
        try {
            const {
                vehicleCapacity = 1000, // kg
                maxDistance = 50, // km
                maxTime = 480, // minutos (8 horas)
                startLocation = { latitude: -12.0464, longitude: -77.0428 } // Lima, Perú
            } = options;

            // 1. Filtrar incidentes por prioridad y severidad
            const prioritizedIncidents = this.prioritizeIncidents(incidents);

            // 2. Obtener eventos externos activos
            const activeEvents = eventDetectionService.getActiveEvents();

            // 3. Obtener puntos críticos
            const criticalPoints = await criticalPointsService.identifyCriticalPoints(7);

            // 4. Calcular matriz de distancias considerando eventos
            const distanceMatrix = this.calculateDistanceMatrix(
                prioritizedIncidents,
                startLocation,
                activeEvents
            );

            // 5. Aplicar algoritmo TSP mejorado
            const optimizedOrder = this.tspWithConstraints(
                distanceMatrix,
                prioritizedIncidents,
                {
                    maxDistance,
                    maxTime,
                    criticalPoints,
                    activeEvents
                }
            );

            // 6. Generar ruta final
            const route = optimizedOrder.map((index, order) => ({
                order: order + 1,
                incident: prioritizedIncidents[index],
                estimatedArrival: this.calculateArrivalTime(order, distanceMatrix, optimizedOrder),
                warnings: this.getLocationWarnings(
                    prioritizedIncidents[index],
                    activeEvents,
                    criticalPoints
                )
            }));

            // 7. Calcular resumen
            const summary = this.calculateRouteSummary(route, distanceMatrix, optimizedOrder);

            return {
                success: true,
                data: {
                    optimizedRoute: route,
                    summary,
                    criticalPoints,
                    activeEvents: activeEvents.map(e => ({
                        type: e.type,
                        description: e.description,
                        severity: e.severity
                    }))
                }
            };
        } catch (error) {
            console.error('Error en optimización de ruta:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Priorizar incidentes por severidad y tiempo
     */
    prioritizeIncidents(incidents) {
        const severityScores = {
            'HIGH': 3,
            'MEDIUM': 2,
            'LOW': 1
        };

        return incidents.sort((a, b) => {
            // Prioridad 1: Severidad
            const severityDiff = (severityScores[b.severity] || 1) - (severityScores[a.severity] || 1);
            if (severityDiff !== 0) return severityDiff;

            // Prioridad 2: Antigüedad
            return new Date(a.createdAt) - new Date(b.createdAt);
        });
    }

    /**
     * Calcular matriz de distancias considerando eventos
     */
    calculateDistanceMatrix(incidents, startLocation, activeEvents) {
        const points = [startLocation, ...incidents];
        const matrix = [];

        for (let i = 0; i < points.length; i++) {
            matrix[i] = [];
            for (let j = 0; j < points.length; j++) {
                if (i === j) {
                    matrix[i][j] = 0;
                } else {
                    let distance = this.calculateDistance(
                        points[i].latitude,
                        points[i].longitude,
                        points[j].latitude,
                        points[j].longitude
                    );

                    // Penalizar rutas que pasan por eventos activos
                    const penalty = this.calculateEventPenalty(
                        points[i],
                        points[j],
                        activeEvents
                    );

                    matrix[i][j] = distance * (1 + penalty);
                }
            }
        }

        return matrix;
    }

    /**
     * Calcular penalización por eventos en la ruta
     */
    calculateEventPenalty(point1, point2, events) {
        let penalty = 0;

        events.forEach(event => {
            // Verificar si la ruta pasa cerca del evento
            const distToEvent1 = this.calculateDistance(
                point1.latitude,
                point1.longitude,
                event.latitude,
                event.longitude
            );

            const distToEvent2 = this.calculateDistance(
                point2.latitude,
                point2.longitude,
                event.latitude,
                event.longitude
            );

            if (distToEvent1 < event.radius || distToEvent2 < event.radius) {
                // Penalización según severidad del evento
                const severityPenalties = {
                    'HIGH': 0.5,    // +50% distancia
                    'MEDIUM': 0.25, // +25% distancia
                    'LOW': 0.1      // +10% distancia
                };
                penalty += severityPenalties[event.severity] || 0.1;
            }
        });

        return penalty;
    }

    /**
     * TSP con restricciones (Nearest Neighbor mejorado)
     */
    tspWithConstraints(distanceMatrix, incidents, constraints) {
        const n = incidents.length;
        const visited = new Array(n).fill(false);
        const route = [];
        let currentPos = 0; // Empezar desde el punto de inicio (índice 0 en la matriz)

        let totalDistance = 0;
        let totalTime = 0;

        while (route.length < n) {
            let nearestIndex = -1;
            let nearestDistance = Infinity;

            // Buscar el punto más cercano no visitado
            for (let i = 0; i < n; i++) {
                if (!visited[i]) {
                    const distance = distanceMatrix[currentPos + 1][i + 1]; // +1 porque índice 0 es el punto de inicio

                    // Verificar restricciones
                    if (totalDistance + distance <= constraints.maxDistance * 1000 &&
                        distance < nearestDistance) {
                        nearestDistance = distance;
                        nearestIndex = i;
                    }
                }
            }

            if (nearestIndex === -1) break; // No hay más puntos alcanzables

            visited[nearestIndex] = true;
            route.push(nearestIndex);
            totalDistance += nearestDistance;
            totalTime += (nearestDistance / 1000) * 3; // Estimación: 3 min por km
            currentPos = nearestIndex + 1;
        }

        return route;
    }

    /**
     * Obtener advertencias para una ubicación
     */
    getLocationWarnings(incident, events, criticalPoints) {
        const warnings = [];

        // Verificar eventos cercanos
        events.forEach(event => {
            const distance = this.calculateDistance(
                incident.latitude,
                incident.longitude,
                event.latitude,
                event.longitude
            );

            if (distance <= event.radius) {
                warnings.push({
                    type: 'EVENT',
                    severity: event.severity,
                    message: `${event.type}: ${event.description}`
                });
            }
        });

        // Verificar si está en punto crítico
        criticalPoints.forEach(point => {
            const distance = this.calculateDistance(
                incident.latitude,
                incident.longitude,
                point.latitude,
                point.longitude
            );

            if (distance <= point.radius) {
                warnings.push({
                    type: 'CRITICAL_POINT',
                    severity: point.severity,
                    message: `Zona crítica: ${point.incidentCount} incidentes recientes`
                });
            }
        });

        return warnings;
    }

    /**
     * Calcular tiempo estimado de llegada
     */
    calculateArrivalTime(order, distanceMatrix, route) {
        let totalMinutes = 0;

        for (let i = 0; i <= order; i++) {
            const fromIndex = i === 0 ? 0 : route[i - 1] + 1;
            const toIndex = route[i] + 1;
            const distance = distanceMatrix[fromIndex][toIndex];

            // Estimación: 3 minutos por kilómetro + 10 minutos por parada
            totalMinutes += (distance / 1000) * 3 + (i > 0 ? 10 : 0);
        }

        const now = new Date();
        now.setMinutes(now.getMinutes() + totalMinutes);
        return now.toISOString();
    }

    /**
     * Calcular resumen de la ruta
     */
    calculateRouteSummary(route, distanceMatrix, optimizedOrder) {
        let totalDistance = 0;
        let totalTime = 0;

        for (let i = 0; i < optimizedOrder.length; i++) {
            const fromIndex = i === 0 ? 0 : optimizedOrder[i - 1] + 1;
            const toIndex = optimizedOrder[i] + 1;
            const distance = distanceMatrix[fromIndex][toIndex];

            totalDistance += distance;
            totalTime += (distance / 1000) * 3 + 10; // 3 min/km + 10 min por parada
        }

        return {
            totalDistance: totalDistance / 1000, // convertir a km
            totalTime: Math.round(totalTime),
            totalStops: route.length,
            estimatedCompletion: new Date(Date.now() + totalTime * 60000).toISOString()
        };
    }

    /**
     * Calcular distancia (Haversine)
     */
    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371e3;
        const φ1 = lat1 * Math.PI / 180;
        const φ2 = lat2 * Math.PI / 180;
        const Δφ = (lat2 - lat1) * Math.PI / 180;
        const Δλ = (lon2 - lon1) * Math.PI / 180;

        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c;
    }
}

module.exports = new RouteOptimizationService();

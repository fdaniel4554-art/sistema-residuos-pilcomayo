const trafficService = require('./traffic.service');

// Calcular distancia Haversine
const getDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radio de la Tierra en km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

const optimizeRoute = async (startLocation, incidents) => {
    if (!incidents || incidents.length === 0) return [];

    let currentLocation = startLocation;
    const unvisited = [...incidents];
    const route = [];
    let totalDistance = 0;
    let totalTime = 0;

    // Obtener eventos de tráfico una vez
    const trafficEvents = trafficService.getSimulatedEvents();

    while (unvisited.length > 0) {
        let bestNextIndex = -1;
        let minScore = Infinity;

        // Encontrar el siguiente punto óptimo
        for (let i = 0; i < unvisited.length; i++) {
            const incident = unvisited[i];
            const distance = getDistance(
                currentLocation.latitude,
                currentLocation.longitude,
                incident.latitude,
                incident.longitude
            );

            // Factor de severidad (HIGH reduce el "costo" para ser priorizado)
            let severityFactor = 1.0;
            if (incident.severity === 'HIGH') severityFactor = 0.5;
            else if (incident.severity === 'MEDIUM') severityFactor = 0.8;

            // Factor de tráfico (si hay evento cerca, aumenta el costo)
            let trafficPenalty = 1.0;
            const nearEvent = trafficEvents.find(e =>
                getDistance(e.latitude, e.longitude, incident.latitude, incident.longitude) < 0.5
            );
            if (nearEvent) trafficPenalty = 1.5;

            // Score final (menor es mejor)
            const score = distance * severityFactor * trafficPenalty;

            if (score < minScore) {
                minScore = score;
                bestNextIndex = i;
            }
        }

        // Agregar el mejor siguiente punto a la ruta
        const nextStop = unvisited[bestNextIndex];
        const distanceToNext = getDistance(
            currentLocation.latitude,
            currentLocation.longitude,
            nextStop.latitude,
            nextStop.longitude
        );

        const trafficLevel = trafficService.getTrafficLevel();
        const timeToNext = trafficService.calculateTravelTime(distanceToNext, trafficLevel);

        route.push({
            ...nextStop,
            estimatedTravelTime: timeToNext,
            distanceFromPrev: distanceToNext.toFixed(2),
            trafficLevel
        });

        totalDistance += distanceToNext;
        totalTime += timeToNext;

        // Actualizar ubicación actual y remover de no visitados
        currentLocation = { latitude: nextStop.latitude, longitude: nextStop.longitude };
        unvisited.splice(bestNextIndex, 1);
    }

    return {
        route,
        summary: {
            totalDistance: totalDistance.toFixed(2),
            totalTime,
            trafficEvents
        }
    };
};

module.exports = {
    optimizeRoute
};

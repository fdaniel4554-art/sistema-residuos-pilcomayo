const prisma = require('../../config/database');

/**
 * Servicio de Identificación de Puntos Críticos
 * Analiza patrones de incidentes para identificar zonas problemáticas
 */

class CriticalPointsService {
    /**
     * Identificar puntos críticos basados en clustering de incidentes
     */
    async identifyCriticalPoints(timeRange = 30) {
        try {
            // Obtener incidentes de los últimos N días
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - timeRange);

            const incidents = await prisma.incident.findMany({
                where: {
                    createdAt: {
                        gte: startDate
                    }
                },
                select: {
                    id: true,
                    latitude: true,
                    longitude: true,
                    severity: true,
                    wasteType: true,
                    createdAt: true
                }
            });

            // Agrupar incidentes por proximidad (clustering simple)
            const clusters = this.clusterIncidents(incidents, 500); // 500 metros de radio

            // Identificar clusters críticos
            const criticalPoints = clusters
                .filter(cluster => cluster.incidents.length >= 3) // Mínimo 3 incidentes
                .map(cluster => ({
                    latitude: cluster.center.latitude,
                    longitude: cluster.center.longitude,
                    incidentCount: cluster.incidents.length,
                    severity: this.calculateClusterSeverity(cluster.incidents),
                    dominantWasteType: this.getDominantWasteType(cluster.incidents),
                    radius: cluster.radius,
                    incidents: cluster.incidents
                }))
                .sort((a, b) => b.incidentCount - a.incidentCount);

            return criticalPoints;
        } catch (error) {
            console.error('Error al identificar puntos críticos:', error);
            throw error;
        }
    }

    /**
     * Clustering simple de incidentes por proximidad
     */
    clusterIncidents(incidents, maxDistance) {
        const clusters = [];
        const processed = new Set();

        incidents.forEach((incident, index) => {
            if (processed.has(index)) return;

            const cluster = {
                incidents: [incident],
                center: {
                    latitude: incident.latitude,
                    longitude: incident.longitude
                },
                radius: 0
            };

            // Buscar incidentes cercanos
            incidents.forEach((other, otherIndex) => {
                if (index === otherIndex || processed.has(otherIndex)) return;

                const distance = this.calculateDistance(
                    incident.latitude,
                    incident.longitude,
                    other.latitude,
                    other.longitude
                );

                if (distance <= maxDistance) {
                    cluster.incidents.push(other);
                    processed.add(otherIndex);
                }
            });

            // Recalcular centro del cluster
            if (cluster.incidents.length > 1) {
                const avgLat = cluster.incidents.reduce((sum, inc) => sum + inc.latitude, 0) / cluster.incidents.length;
                const avgLng = cluster.incidents.reduce((sum, inc) => sum + inc.longitude, 0) / cluster.incidents.length;

                cluster.center = {
                    latitude: avgLat,
                    longitude: avgLng
                };

                // Calcular radio del cluster
                cluster.radius = Math.max(...cluster.incidents.map(inc =>
                    this.calculateDistance(avgLat, avgLng, inc.latitude, inc.longitude)
                ));
            }

            processed.add(index);
            clusters.push(cluster);
        });

        return clusters;
    }

    /**
     * Calcular severidad promedio de un cluster
     */
    calculateClusterSeverity(incidents) {
        const severityScores = {
            'HIGH': 3,
            'MEDIUM': 2,
            'LOW': 1
        };

        const avgScore = incidents.reduce((sum, inc) => {
            return sum + (severityScores[inc.severity] || 1);
        }, 0) / incidents.length;

        if (avgScore >= 2.5) return 'HIGH';
        if (avgScore >= 1.5) return 'MEDIUM';
        return 'LOW';
    }

    /**
     * Obtener el tipo de residuo más común en un cluster
     */
    getDominantWasteType(incidents) {
        const typeCounts = {};

        incidents.forEach(inc => {
            const type = inc.wasteType || 'UNKNOWN';
            typeCounts[type] = (typeCounts[type] || 0) + 1;
        });

        return Object.entries(typeCounts)
            .sort((a, b) => b[1] - a[1])[0]?.[0] || 'UNKNOWN';
    }

    /**
     * Analizar tendencias temporales
     */
    async analyzeTrends(days = 90) {
        try {
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - days);

            const incidents = await prisma.incident.groupBy({
                by: ['wasteType', 'severity'],
                where: {
                    createdAt: {
                        gte: startDate
                    }
                },
                _count: true
            });

            return incidents.map(group => ({
                wasteType: group.wasteType,
                severity: group.severity,
                count: group._count
            }));
        } catch (error) {
            console.error('Error al analizar tendencias:', error);
            throw error;
        }
    }

    /**
     * Predecir zonas de riesgo futuras
     */
    async predictRiskZones() {
        try {
            const criticalPoints = await this.identifyCriticalPoints(30);

            // Analizar tendencias de crecimiento
            const riskZones = criticalPoints.map(point => {
                // Calcular tasa de crecimiento (simplificado)
                const recentIncidents = point.incidents.filter(inc => {
                    const daysSince = (new Date() - new Date(inc.createdAt)) / (1000 * 60 * 60 * 24);
                    return daysSince <= 7;
                }).length;

                const growthRate = recentIncidents / point.incidentCount;

                return {
                    ...point,
                    riskLevel: growthRate > 0.5 ? 'HIGH' : growthRate > 0.3 ? 'MEDIUM' : 'LOW',
                    growthRate: (growthRate * 100).toFixed(1) + '%'
                };
            });

            return riskZones.filter(zone => zone.riskLevel !== 'LOW');
        } catch (error) {
            console.error('Error al predecir zonas de riesgo:', error);
            throw error;
        }
    }

    /**
     * Calcular distancia entre dos puntos (Haversine)
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

module.exports = new CriticalPointsService();

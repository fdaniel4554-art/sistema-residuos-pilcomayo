const prisma = require('../config/database');

// ==========================================
// ESTADÍSTICAS GENERALES
// ==========================================
const getGeneralStats = async (req, res) => {
    try {
        const [
            totalIncidents,
            pendingIncidents,
            assignedIncidents,
            resolvedIncidents,
            totalUsers,
            activeUsers,
            totalBrigades
        ] = await Promise.all([
            prisma.incident.count(),
            prisma.incident.count({ where: { status: 'PENDING' } }),
            prisma.incident.count({ where: { status: 'ASSIGNED' } }),
            prisma.incident.count({ where: { status: 'RESOLVED' } }),
            prisma.user.count(),
            prisma.user.count({ where: { active: true } }),
            prisma.user.count({ where: { role: { in: ['BRIGADE', 'DRIVER'] } } })
        ]);

        res.json({
            incidents: {
                total: totalIncidents,
                pending: pendingIncidents,
                assigned: assignedIncidents,
                resolved: resolvedIncidents,
                inProgress: totalIncidents - pendingIncidents - resolvedIncidents
            },
            users: {
                total: totalUsers,
                active: activeUsers,
                brigades: totalBrigades
            }
        });

    } catch (error) {
        console.error('Error en getGeneralStats:', error);
        res.status(500).json({
            error: 'Error al obtener estadísticas'
        });
    }
};

// ==========================================
// ESTADÍSTICAS POR TIPO DE RESIDUO
// ==========================================
const getWasteTypeStats = async (req, res) => {
    try {
        const stats = await prisma.incident.groupBy({
            by: ['wasteType'],
            _count: {
                id: true
            },
            where: {
                wasteType: { not: null }
            }
        });

        const formatted = stats.map(stat => ({
            type: stat.wasteType,
            count: stat._count.id
        }));

        res.json(formatted);

    } catch (error) {
        console.error('Error en getWasteTypeStats:', error);
        res.status(500).json({
            error: 'Error al obtener estadísticas por tipo'
        });
    }
};

// ==========================================
// ESTADÍSTICAS POR SEVERIDAD
// ==========================================
const getSeverityStats = async (req, res) => {
    try {
        const stats = await prisma.incident.groupBy({
            by: ['severity'],
            _count: {
                id: true
            },
            where: {
                severity: { not: null }
            }
        });

        const formatted = stats.map(stat => ({
            severity: stat.severity,
            count: stat._count.id
        }));

        res.json(formatted);

    } catch (error) {
        console.error('Error en getSeverityStats:', error);
        res.status(500).json({
            error: 'Error al obtener estadísticas por severidad'
        });
    }
};

// ==========================================
// INCIDENCIAS POR DÍA (ÚLTIMOS 30 DÍAS)
// ==========================================
const getIncidentsTrend = async (req, res) => {
    try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const incidents = await prisma.incident.findMany({
            where: {
                createdAt: {
                    gte: thirtyDaysAgo
                }
            },
            select: {
                createdAt: true,
                status: true
            }
        });

        // Agrupar por día
        const grouped = {};
        incidents.forEach(incident => {
            const date = incident.createdAt.toISOString().split('T')[0];
            if (!grouped[date]) {
                grouped[date] = { date, total: 0, resolved: 0 };
            }
            grouped[date].total++;
            if (incident.status === 'RESOLVED') {
                grouped[date].resolved++;
            }
        });

        const trend = Object.values(grouped).sort((a, b) =>
            new Date(a.date) - new Date(b.date)
        );

        res.json(trend);

    } catch (error) {
        console.error('Error en getIncidentsTrend:', error);
        res.status(500).json({
            error: 'Error al obtener tendencia'
        });
    }
};

// ==========================================
// PUNTOS CRÍTICOS (MÁS REPORTADOS)
// ==========================================
const getCriticalPoints = async (req, res) => {
    try {
        const { limit = 10 } = req.query;

        // Obtener incidencias agrupadas por ubicación cercana
        const incidents = await prisma.incident.findMany({
            select: {
                latitude: true,
                longitude: true,
                address: true,
                status: true
            }
        });

        // Agrupar por ubicaciones cercanas (radio de ~100m)
        const clusters = [];
        const processed = new Set();

        incidents.forEach((incident, index) => {
            if (processed.has(index)) return;

            const cluster = {
                latitude: incident.latitude,
                longitude: incident.longitude,
                address: incident.address,
                count: 1,
                pending: incident.status === 'PENDING' ? 1 : 0
            };

            // Buscar incidencias cercanas
            incidents.forEach((other, otherIndex) => {
                if (index === otherIndex || processed.has(otherIndex)) return;

                const distance = getDistance(
                    incident.latitude,
                    incident.longitude,
                    other.latitude,
                    other.longitude
                );

                if (distance < 0.1) { // ~100 metros
                    cluster.count++;
                    if (other.status === 'PENDING') cluster.pending++;
                    processed.add(otherIndex);
                }
            });

            if (cluster.count > 1) {
                clusters.push(cluster);
            }
            processed.add(index);
        });

        // Ordenar por cantidad y limitar
        const criticalPoints = clusters
            .sort((a, b) => b.count - a.count)
            .slice(0, parseInt(limit));

        res.json(criticalPoints);

    } catch (error) {
        console.error('Error en getCriticalPoints:', error);
        res.status(500).json({
            error: 'Error al obtener puntos críticos'
        });
    }
};

// ==========================================
// RENDIMIENTO DE BRIGADAS
// ==========================================
const getBrigadePerformance = async (req, res) => {
    try {
        const brigades = await prisma.user.findMany({
            where: {
                role: { in: ['BRIGADE', 'DRIVER'] },
                active: true
            },
            select: {
                id: true,
                name: true,
                role: true,
                assignments: {
                    select: {
                        completedAt: true,
                        assignedAt: true
                    }
                }
            }
        });

        const performance = brigades.map(brigade => {
            const total = brigade.assignments.length;
            const completed = brigade.assignments.filter(a => a.completedAt).length;

            // Calcular tiempo promedio de resolución
            const completedAssignments = brigade.assignments.filter(a => a.completedAt);
            let avgTime = 0;
            if (completedAssignments.length > 0) {
                const totalTime = completedAssignments.reduce((sum, a) => {
                    const time = new Date(a.completedAt) - new Date(a.assignedAt);
                    return sum + time;
                }, 0);
                avgTime = totalTime / completedAssignments.length / (1000 * 60 * 60); // en horas
            }

            return {
                id: brigade.id,
                name: brigade.name,
                role: brigade.role,
                totalAssignments: total,
                completedAssignments: completed,
                pendingAssignments: total - completed,
                completionRate: total > 0 ? ((completed / total) * 100).toFixed(1) : 0,
                avgResolutionTime: avgTime.toFixed(1) // en horas
            };
        });

        res.json(performance);

    } catch (error) {
        console.error('Error en getBrigadePerformance:', error);
        res.status(500).json({
            error: 'Error al obtener rendimiento de brigadas'
        });
    }
};

// Función auxiliar para calcular distancia entre dos puntos
function getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radio de la Tierra en km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

module.exports = {
    getGeneralStats,
    getWasteTypeStats,
    getSeverityStats,
    getIncidentsTrend,
    getCriticalPoints,
    getBrigadePerformance
};

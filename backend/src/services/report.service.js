const prisma = require('../config/database');

/**
 * Servicio de Generación de Reportes
 * Genera reportes automáticos diarios, semanales y mensuales
 */

class ReportService {
    /**
     * Generar reporte diario
     */
    async generateDailyReport(date = new Date()) {
        try {
            const startOfDay = new Date(date.setHours(0, 0, 0, 0));
            const endOfDay = new Date(date.setHours(23, 59, 59, 999));

            const incidents = await prisma.incident.findMany({
                where: {
                    createdAt: {
                        gte: startOfDay,
                        lte: endOfDay
                    }
                },
                include: {
                    reportedBy: {
                        select: { name: true, role: true }
                    },
                    assignments: {
                        include: {
                            assignedTo: {
                                select: { name: true }
                            }
                        }
                    }
                }
            });

            const report = {
                type: 'DAILY',
                date: date.toISOString(),
                summary: {
                    totalIncidents: incidents.length,
                    resolved: incidents.filter(i => i.status === 'RESOLVED').length,
                    pending: incidents.filter(i => i.status === 'PENDING' || i.status === 'ASSIGNED').length,
                    inProgress: incidents.filter(i => i.status === 'IN_PROGRESS').length
                },
                byWasteType: this.groupByWasteType(incidents),
                bySeverity: this.groupBySeverity(incidents),
                topReporters: await this.getTopReporters(startOfDay, endOfDay),
                mostActiveBrigade: await this.getMostActiveBrigade(startOfDay, endOfDay)
            };

            return report;
        } catch (error) {
            console.error('Error al generar reporte diario:', error);
            throw error;
        }
    }

    /**
     * Generar reporte semanal
     */
    async generateWeeklyReport(date = new Date()) {
        try {
            const startOfWeek = new Date(date);
            startOfWeek.setDate(date.getDate() - date.getDay());
            startOfWeek.setHours(0, 0, 0, 0);

            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(startOfWeek.getDate() + 6);
            endOfWeek.setHours(23, 59, 59, 999);

            const incidents = await prisma.incident.findMany({
                where: {
                    createdAt: {
                        gte: startOfWeek,
                        lte: endOfWeek
                    }
                }
            });

            const report = {
                type: 'WEEKLY',
                startDate: startOfWeek.toISOString(),
                endDate: endOfWeek.toISOString(),
                summary: {
                    totalIncidents: incidents.length,
                    dailyAverage: (incidents.length / 7).toFixed(1),
                    resolved: incidents.filter(i => i.status === 'RESOLVED').length,
                    resolutionRate: ((incidents.filter(i => i.status === 'RESOLVED').length / incidents.length) * 100).toFixed(1) + '%'
                },
                trends: await this.analyzeTrends(startOfWeek, endOfWeek),
                criticalZones: await this.identifyCriticalZones(startOfWeek, endOfWeek)
            };

            return report;
        } catch (error) {
            console.error('Error al generar reporte semanal:', error);
            throw error;
        }
    }

    /**
     * Generar reporte mensual
     */
    async generateMonthlyReport(year, month) {
        try {
            const startOfMonth = new Date(year, month - 1, 1);
            const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

            const incidents = await prisma.incident.findMany({
                where: {
                    createdAt: {
                        gte: startOfMonth,
                        lte: endOfMonth
                    }
                }
            });

            const report = {
                type: 'MONTHLY',
                year,
                month,
                summary: {
                    totalIncidents: incidents.length,
                    resolved: incidents.filter(i => i.status === 'RESOLVED').length,
                    avgResponseTime: await this.calculateAvgResponseTime(startOfMonth, endOfMonth),
                    topWasteType: this.getMostCommonWasteType(incidents)
                },
                weeklyBreakdown: await this.getWeeklyBreakdown(startOfMonth, endOfMonth),
                predictions: await this.generatePredictions(incidents)
            };

            return report;
        } catch (error) {
            console.error('Error al generar reporte mensual:', error);
            throw error;
        }
    }

    /**
     * Agrupar incidentes por tipo de residuo
     */
    groupByWasteType(incidents) {
        const grouped = {};
        incidents.forEach(inc => {
            const type = inc.wasteType || 'UNKNOWN';
            grouped[type] = (grouped[type] || 0) + 1;
        });
        return grouped;
    }

    /**
     * Agrupar incidentes por severidad
     */
    groupBySeverity(incidents) {
        const grouped = {
            HIGH: 0,
            MEDIUM: 0,
            LOW: 0
        };
        incidents.forEach(inc => {
            if (inc.severity) {
                grouped[inc.severity]++;
            }
        });
        return grouped;
    }

    /**
     * Obtener top reportadores
     */
    async getTopReporters(startDate, endDate) {
        const topReporters = await prisma.incident.groupBy({
            by: ['reportedById'],
            where: {
                createdAt: {
                    gte: startDate,
                    lte: endDate
                }
            },
            _count: true,
            orderBy: {
                _count: {
                    reportedById: 'desc'
                }
            },
            take: 5
        });

        // Obtener nombres de usuarios
        const reportersWithNames = await Promise.all(
            topReporters.map(async (reporter) => {
                const user = await prisma.user.findUnique({
                    where: { id: reporter.reportedById },
                    select: { name: true, email: true }
                });
                return {
                    ...user,
                    count: reporter._count
                };
            })
        );

        return reportersWithNames;
    }

    /**
     * Obtener brigada más activa
     */
    async getMostActiveBrigade(startDate, endDate) {
        const assignments = await prisma.assignment.findMany({
            where: {
                assignedAt: {
                    gte: startDate,
                    lte: endDate
                }
            },
            include: {
                assignedTo: {
                    select: { name: true, role: true }
                }
            }
        });

        const brigadeCount = {};
        assignments.forEach(assignment => {
            const brigadeName = assignment.assignedTo.name;
            brigadeCount[brigadeName] = (brigadeCount[brigadeName] || 0) + 1;
        });

        const mostActive = Object.entries(brigadeCount)
            .sort((a, b) => b[1] - a[1])[0];

        return mostActive ? { name: mostActive[0], count: mostActive[1] } : null;
    }

    /**
     * Analizar tendencias
     */
    async analyzeTrends(startDate, endDate) {
        // Simplificado: comparar con semana anterior
        const previousStart = new Date(startDate);
        previousStart.setDate(previousStart.getDate() - 7);
        const previousEnd = new Date(endDate);
        previousEnd.setDate(previousEnd.getDate() - 7);

        const currentCount = await prisma.incident.count({
            where: {
                createdAt: { gte: startDate, lte: endDate }
            }
        });

        const previousCount = await prisma.incident.count({
            where: {
                createdAt: { gte: previousStart, lte: previousEnd }
            }
        });

        const change = currentCount - previousCount;
        const changePercent = previousCount > 0 ? ((change / previousCount) * 100).toFixed(1) : 0;

        return {
            current: currentCount,
            previous: previousCount,
            change,
            changePercent: changePercent + '%',
            trend: change > 0 ? 'UP' : change < 0 ? 'DOWN' : 'STABLE'
        };
    }

    /**
     * Identificar zonas críticas
     */
    async identifyCriticalZones(startDate, endDate) {
        // Simplificado: agrupar por coordenadas aproximadas
        const incidents = await prisma.incident.findMany({
            where: {
                createdAt: { gte: startDate, lte: endDate }
            },
            select: {
                latitude: true,
                longitude: true,
                address: true
            }
        });

        // Agrupar por dirección si está disponible
        const zoneCount = {};
        incidents.forEach(inc => {
            const zone = inc.address || `${inc.latitude.toFixed(2)},${inc.longitude.toFixed(2)}`;
            zoneCount[zone] = (zoneCount[zone] || 0) + 1;
        });

        return Object.entries(zoneCount)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([zone, count]) => ({ zone, count }));
    }

    /**
     * Calcular tiempo promedio de respuesta
     */
    async calculateAvgResponseTime(startDate, endDate) {
        const resolvedIncidents = await prisma.incident.findMany({
            where: {
                createdAt: { gte: startDate, lte: endDate },
                status: 'RESOLVED',
                resolvedAt: { not: null }
            },
            select: {
                createdAt: true,
                resolvedAt: true
            }
        });

        if (resolvedIncidents.length === 0) return '0 horas';

        const totalMinutes = resolvedIncidents.reduce((sum, inc) => {
            const diff = new Date(inc.resolvedAt).getTime() - new Date(inc.createdAt).getTime();
            return sum + (diff / 1000 / 60); // convertir a minutos
        }, 0);

        const avgMinutes = totalMinutes / resolvedIncidents.length;
        const hours = Math.floor(avgMinutes / 60);
        const minutes = Math.floor(avgMinutes % 60);

        return `${hours}h ${minutes}m`;
    }

    /**
     * Obtener tipo de residuo más común
     */
    getMostCommonWasteType(incidents) {
        const types = this.groupByWasteType(incidents);
        const mostCommon = Object.entries(types)
            .sort((a, b) => b[1] - a[1])[0];
        return mostCommon ? mostCommon[0] : 'UNKNOWN';
    }

    /**
     * Desglose semanal del mes
     */
    async getWeeklyBreakdown(startDate, endDate) {
        const weeks = [];
        let currentWeekStart = new Date(startDate);

        while (currentWeekStart < endDate) {
            const currentWeekEnd = new Date(currentWeekStart);
            currentWeekEnd.setDate(currentWeekEnd.getDate() + 6);

            const count = await prisma.incident.count({
                where: {
                    createdAt: {
                        gte: currentWeekStart,
                        lte: currentWeekEnd > endDate ? endDate : currentWeekEnd
                    }
                }
            });

            weeks.push({
                week: weeks.length + 1,
                count
            });

            currentWeekStart.setDate(currentWeekStart.getDate() + 7);
        }

        return weeks;
    }

    /**
     * Generar predicciones simples
     */
    async generatePredictions(incidents) {
        const avgPerDay = incidents.length / 30;
        const nextMonthPrediction = Math.round(avgPerDay * 30);

        return {
            nextMonthIncidents: nextMonthPrediction,
            confidence: 'MEDIUM',
            recommendation: nextMonthPrediction > incidents.length
                ? 'Se espera un aumento en incidentes. Considerar aumentar recursos.'
                : 'Se espera una disminución. Mantener recursos actuales.'
        };
    }
}

module.exports = new ReportService();

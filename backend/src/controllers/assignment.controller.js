const prisma = require('../config/database');

// ==========================================
// ASIGNAR INCIDENTES A BRIGADAS (ADMIN)
// ==========================================
const assignIncidentToBrigade = async (req, res) => {
    try {
        const { incidentId } = req.params;
        const { brigadeId, notes } = req.body;

        // Verificar que el incidente existe
        const incident = await prisma.incident.findUnique({
            where: { id: incidentId }
        });

        if (!incident) {
            return res.status(404).json({
                error: 'Incidencia no encontrada'
            });
        }

        // Verificar que la brigada existe
        const brigade = await prisma.user.findUnique({
            where: { id: brigadeId }
        });

        if (!brigade || (brigade.role !== 'BRIGADE' && brigade.role !== 'DRIVER')) {
            return res.status(400).json({
                error: 'Usuario no es una brigada o conductor'
            });
        }

        // Verificar si ya existe asignación
        const existingAssignment = await prisma.assignment.findFirst({
            where: {
                incidentId,
                assignedToId: brigadeId
            }
        });

        if (existingAssignment) {
            return res.status(400).json({
                error: 'Esta incidencia ya está asignada a esta brigada'
            });
        }

        // Crear asignación
        const assignment = await prisma.assignment.create({
            data: {
                incidentId,
                assignedToId: brigadeId,
                assignedAt: new Date(),
                notes: notes || `Asignado por ${req.user.name}`
            },
            include: {
                assignedTo: {
                    select: {
                        id: true,
                        name: true,
                        role: true
                    }
                }
            }
        });

        // Actualizar estado del incidente
        await prisma.incident.update({
            where: { id: incidentId },
            data: { status: 'ASSIGNED' }
        });

        // Log de actividad
        await prisma.activityLog.create({
            data: {
                userId: req.user.id,
                incidentId,
                action: 'ASSIGN_INCIDENT',
                description: `Incidencia asignada a ${brigade.name}`,
                ipAddress: req.ip,
                userAgent: req.get('user-agent')
            }
        });

        res.json({
            message: 'Incidencia asignada exitosamente',
            assignment
        });

    } catch (error) {
        console.error('Error en assignIncidentToBrigade:', error);
        res.status(500).json({
            error: 'Error al asignar incidencia'
        });
    }
};

// ==========================================
// AUTO-ASIGNAR INCIDENTES PENDIENTES (TEMPORAL)
// ==========================================
const autoAssignIncidents = async (req, res) => {
    try {
        // Solo admin puede usar esto
        if (req.user.role !== 'ADMIN') {
            return res.status(403).json({
                error: 'Solo administradores pueden auto-asignar'
            });
        }

        // Buscar brigada
        const brigade = await prisma.user.findFirst({
            where: { role: 'BRIGADE' }
        });

        if (!brigade) {
            return res.status(404).json({
                error: 'No se encontró ninguna brigada'
            });
        }

        // Buscar incidentes pendientes
        const incidents = await prisma.incident.findMany({
            where: {
                status: {
                    in: ['PENDING', 'ASSIGNED']
                }
            },
            take: 5
        });

        if (incidents.length === 0) {
            return res.status(404).json({
                error: 'No hay incidentes pendientes'
            });
        }

        const assigned = [];

        for (const incident of incidents) {
            // Verificar si ya tiene asignación
            const existingAssignment = await prisma.assignment.findFirst({
                where: {
                    incidentId: incident.id,
                    assignedToId: brigade.id
                }
            });

            if (existingAssignment) {
                continue;
            }

            // Crear asignación
            await prisma.assignment.create({
                data: {
                    incidentId: incident.id,
                    assignedToId: brigade.id,
                    assignedAt: new Date(),
                    notes: 'Asignación automática para pruebas'
                }
            });

            // Actualizar estado
            await prisma.incident.update({
                where: { id: incident.id },
                data: { status: 'ASSIGNED' }
            });

            assigned.push(incident.id);
        }

        res.json({
            message: `${assigned.length} incidentes asignados a ${brigade.name}`,
            brigadeId: brigade.id,
            brigadeName: brigade.name,
            assignedIncidents: assigned
        });

    } catch (error) {
        console.error('Error en autoAssignIncidents:', error);
        res.status(500).json({
            error: 'Error al auto-asignar incidentes'
        });
    }
};

module.exports = {
    assignIncidentToBrigade,
    autoAssignIncidents
};

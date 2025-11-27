const prisma = require('../config/database');
const axios = require('axios');

// ==========================================
// CREAR INCIDENCIA
// ==========================================
const createIncident = async (req, res) => {
    try {
        const {
            description,
            latitude,
            longitude,
            address,
            imageUrl,
            wasteType,
            severity
        } = req.body;

        // Validar campos requeridos
        if (!description || !latitude || !longitude) {
            return res.status(400).json({
                error: 'Descripción, latitud y longitud son requeridos'
            });
        }

        // Crear incidencia
        const incident = await prisma.incident.create({
            data: {
                description,
                latitude: parseFloat(latitude),
                longitude: parseFloat(longitude),
                address,
                imageUrl,
                wasteType,
                severity,
                reportedById: req.user.id
            },
            include: {
                reportedBy: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true
                    }
                }
            }
        });

        // Si hay imagen, enviar a IA para clasificación
        if (imageUrl) {
            try {
                const aiResponse = await axios.post(
                    `${process.env.AI_SERVICE_URL}/analyze`,
                    { imageUrl },
                    { timeout: 10000 }
                );

                // Actualizar con clasificación IA
                const updateData = {
                    aiWasteType: aiResponse.data.wasteType,
                    aiSeverity: aiResponse.data.severity,
                    aiConfidence: aiResponse.data.confidence,
                    aiPriority: aiResponse.data.priority
                };

                // Si la descripción original era genérica o vacía, usar la de la IA
                if (!description || description.trim() === '' || description === 'Reporte ciudadano') {
                    updateData.description = aiResponse.data.description;
                }

                await prisma.incident.update({
                    where: { id: incident.id },
                    data: updateData
                });
            } catch (aiError) {
                console.error('Error en clasificación IA:', aiError.message);
                // Continuar sin clasificación IA
            }
        }

        // Log de actividad
        await prisma.activityLog.create({
            data: {
                userId: req.user.id,
                incidentId: incident.id,
                action: 'CREATE_INCIDENT',
                description: `Incidencia creada: ${description.substring(0, 50)}...`,
                ipAddress: req.ip,
                userAgent: req.get('user-agent')
            }
        });

        res.status(201).json({
            message: 'Incidencia creada exitosamente',
            incident
        });

    } catch (error) {
        console.error('Error en createIncident:', error);
        res.status(500).json({
            error: 'Error al crear incidencia'
        });
    }
};

// ==========================================
// OBTENER TODAS LAS INCIDENCIAS
// ==========================================
const getIncidents = async (req, res) => {
    try {
        const {
            status,
            wasteType,
            severity,
            startDate,
            endDate,
            page = 1,
            limit = 50
        } = req.query;

        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Construir filtros
        const where = {};

        if (status) where.status = status;
        if (wasteType) where.wasteType = wasteType;
        if (severity) where.severity = severity;

        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) where.createdAt.gte = new Date(startDate);
            if (endDate) where.createdAt.lte = new Date(endDate);
        }

        // 🔒 FILTRAR POR BRIGADA: Si es brigada o conductor, solo ver sus tareas asignadas
        if (req.user.role === 'BRIGADE' || req.user.role === 'DRIVER') {
            where.assignments = {
                some: {
                    assignedToId: req.user.id
                }
            };
        }

        // 👤 FILTRAR POR CIUDADANO: Solo ver sus propios reportes
        if (req.user.role === 'CITIZEN') {
            where.reportedById = req.user.id;
        }

        // Obtener incidencias
        const [incidents, total] = await Promise.all([
            prisma.incident.findMany({
                where,
                skip,
                take: parseInt(limit),
                orderBy: { createdAt: 'desc' },
                include: {
                    reportedBy: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            role: true
                        }
                    },
                    assignments: {
                        include: {
                            assignedTo: {
                                select: {
                                    id: true,
                                    name: true,
                                    role: true
                                }
                            }
                        }
                    }
                }
            }),
            prisma.incident.count({ where })
        ]);

        res.json({
            incidents,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / parseInt(limit))
            }
        });

    } catch (error) {
        console.error('Error en getIncidents:', error);
        res.status(500).json({
            error: 'Error al obtener incidencias'
        });
    }
};

// ==========================================
// OBTENER INCIDENCIA POR ID
// ==========================================
const getIncidentById = async (req, res) => {
    try {
        const { id } = req.params;

        const incident = await prisma.incident.findUnique({
            where: { id },
            include: {
                reportedBy: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true,
                        phone: true
                    }
                },
                assignments: {
                    include: {
                        assignedTo: {
                            select: {
                                id: true,
                                name: true,
                                role: true,
                                phone: true
                            }
                        }
                    }
                },
                statusHistory: {
                    orderBy: { createdAt: 'desc' }
                },
                activityLogs: {
                    orderBy: { createdAt: 'desc' },
                    take: 20,
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                role: true
                            }
                        }
                    }
                }
            }
        });

        if (!incident) {
            return res.status(404).json({
                error: 'Incidencia no encontrada'
            });
        }

        res.json(incident);

    } catch (error) {
        console.error('Error en getIncidentById:', error);
        res.status(500).json({
            error: 'Error al obtener incidencia'
        });
    }
};

// ==========================================
// ACTUALIZAR ESTADO DE INCIDENCIA
// ==========================================
const updateIncidentStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, notes } = req.body;

        // Obtener incidencia actual
        const currentIncident = await prisma.incident.findUnique({
            where: { id }
        });

        if (!currentIncident) {
            return res.status(404).json({
                error: 'Incidencia no encontrada'
            });
        }

        // Actualizar incidencia
        const incident = await prisma.incident.update({
            where: { id },
            data: {
                status,
                ...(status === 'RESOLVED' && { resolvedAt: new Date() })
            }
        });

        // Crear historial de estado
        await prisma.statusHistory.create({
            data: {
                incidentId: id,
                oldStatus: currentIncident.status,
                newStatus: status,
                notes
            }
        });

        // Log de actividad
        await prisma.activityLog.create({
            data: {
                userId: req.user.id,
                incidentId: id,
                action: 'UPDATE_STATUS',
                description: `Estado cambiado de ${currentIncident.status} a ${status}`,
                ipAddress: req.ip,
                userAgent: req.get('user-agent'),
                metadata: { notes }
            }
        });

        res.json({
            message: 'Estado actualizado',
            incident
        });

    } catch (error) {
        console.error('Error en updateIncidentStatus:', error);
        res.status(500).json({
            error: 'Error al actualizar estado'
        });
    }
};

// ==========================================
// ASIGNAR BRIGADA A INCIDENCIA
// ==========================================
const assignIncident = async (req, res) => {
    try {
        const { id } = req.params;
        const { assignedToId, notes } = req.body;

        if (!assignedToId) {
            return res.status(400).json({
                error: 'ID de usuario asignado es requerido'
            });
        }

        // Verificar que el usuario existe y es brigada/chofer
        const assignedUser = await prisma.user.findUnique({
            where: { id: assignedToId }
        });

        if (!assignedUser) {
            return res.status(404).json({
                error: 'Usuario no encontrado'
            });
        }

        if (!['BRIGADE', 'DRIVER'].includes(assignedUser.role)) {
            return res.status(400).json({
                error: 'Solo se puede asignar a brigadas o choferes'
            });
        }

        // Crear asignación
        const assignment = await prisma.assignment.create({
            data: {
                incidentId: id,
                assignedToId,
                notes
            },
            include: {
                assignedTo: {
                    select: {
                        id: true,
                        name: true,
                        role: true,
                        phone: true
                    }
                }
            }
        });

        // Actualizar estado de incidencia
        await prisma.incident.update({
            where: { id },
            data: { status: 'ASSIGNED' }
        });

        // Log de actividad
        await prisma.activityLog.create({
            data: {
                userId: req.user.id,
                incidentId: id,
                action: 'ASSIGN_INCIDENT',
                description: `Incidencia asignada a ${assignedUser.name}`,
                ipAddress: req.ip,
                userAgent: req.get('user-agent')
            }
        });

        res.status(201).json({
            message: 'Incidencia asignada exitosamente',
            assignment
        });

    } catch (error) {
        console.error('Error en assignIncident:', error);
        res.status(500).json({
            error: 'Error al asignar incidencia'
        });
    }
};

// ==========================================
// ELIMINAR INCIDENCIA
// ==========================================
const deleteIncident = async (req, res) => {
    try {
        const { id } = req.params;

        await prisma.incident.delete({
            where: { id }
        });

        // Log de actividad
        await prisma.activityLog.create({
            data: {
                userId: req.user.id,
                action: 'DELETE_INCIDENT',
                description: `Incidencia ${id} eliminada`,
                ipAddress: req.ip,
                userAgent: req.get('user-agent')
            }
        });

        res.json({
            message: 'Incidencia eliminada'
        });

    } catch (error) {
        console.error('Error en deleteIncident:', error);
        res.status(500).json({
            error: 'Error al eliminar incidencia'
        });
    }
};

module.exports = {
    createIncident,
    getIncidents,
    getIncidentById,
    updateIncidentStatus,
    assignIncident,
    deleteIncident
};

const prisma = require('../config/database');
const bcrypt = require('bcryptjs');

// ==========================================
// OBTENER TODOS LOS USUARIOS
// ==========================================
const getUsers = async (req, res) => {
    try {
        const { role, active, page = 1, limit = 50 } = req.query;

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const where = {};
        if (role) where.role = role;
        if (active !== undefined) where.active = active === 'true';

        const [users, total] = await Promise.all([
            prisma.user.findMany({
                where,
                skip,
                take: parseInt(limit),
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    email: true,
                    name: true,
                    role: true,
                    phone: true,
                    active: true,
                    createdAt: true,
                    _count: {
                        select: {
                            incidents: true,
                            assignments: true
                        }
                    }
                }
            }),
            prisma.user.count({ where })
        ]);

        res.json({
            users,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / parseInt(limit))
            }
        });

    } catch (error) {
        console.error('Error en getUsers:', error);
        res.status(500).json({
            error: 'Error al obtener usuarios'
        });
    }
};

// ==========================================
// OBTENER USUARIO POR ID
// ==========================================
const getUserById = async (req, res) => {
    try {
        const { id } = req.params;

        const user = await prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                phone: true,
                active: true,
                createdAt: true,
                updatedAt: true,
                incidents: {
                    take: 10,
                    orderBy: { createdAt: 'desc' },
                    select: {
                        id: true,
                        description: true,
                        status: true,
                        createdAt: true
                    }
                },
                assignments: {
                    take: 10,
                    orderBy: { assignedAt: 'desc' },
                    include: {
                        incident: {
                            select: {
                                id: true,
                                description: true,
                                status: true
                            }
                        }
                    }
                }
            }
        });

        if (!user) {
            return res.status(404).json({
                error: 'Usuario no encontrado'
            });
        }

        res.json(user);

    } catch (error) {
        console.error('Error en getUserById:', error);
        res.status(500).json({
            error: 'Error al obtener usuario'
        });
    }
};

// ==========================================
// CREAR USUARIO (ADMIN)
// ==========================================
const createUser = async (req, res) => {
    try {
        const { email, password, name, phone, role } = req.body;

        if (!email || !password || !name || !role) {
            return res.status(400).json({
                error: 'Email, contraseña, nombre y rol son requeridos'
            });
        }

        // Verificar si el email ya existe
        const existingUser = await prisma.user.findUnique({
            where: { email }
        });

        if (existingUser) {
            return res.status(400).json({
                error: 'El email ya está registrado'
            });
        }

        // Hash de contraseña
        const hashedPassword = await bcrypt.hash(password, 10);

        // Crear usuario
        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name,
                phone,
                role
            },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                phone: true,
                active: true,
                createdAt: true
            }
        });

        // Log de actividad
        await prisma.activityLog.create({
            data: {
                userId: req.user.id,
                action: 'CREATE_USER',
                description: `Usuario creado: ${name} (${role})`,
                ipAddress: req.ip,
                userAgent: req.get('user-agent')
            }
        });

        res.status(201).json({
            message: 'Usuario creado exitosamente',
            user
        });

    } catch (error) {
        console.error('Error en createUser:', error);
        res.status(500).json({
            error: 'Error al crear usuario'
        });
    }
};

// ==========================================
// ACTUALIZAR USUARIO
// ==========================================
const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, phone, role, active } = req.body;

        const user = await prisma.user.update({
            where: { id },
            data: {
                ...(name && { name }),
                ...(phone !== undefined && { phone }),
                ...(role && { role }),
                ...(active !== undefined && { active })
            },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                phone: true,
                active: true,
                updatedAt: true
            }
        });

        // Log de actividad
        await prisma.activityLog.create({
            data: {
                userId: req.user.id,
                action: 'UPDATE_USER',
                description: `Usuario actualizado: ${user.name}`,
                ipAddress: req.ip,
                userAgent: req.get('user-agent'),
                metadata: { updatedFields: Object.keys(req.body) }
            }
        });

        res.json({
            message: 'Usuario actualizado',
            user
        });

    } catch (error) {
        console.error('Error en updateUser:', error);
        res.status(500).json({
            error: 'Error al actualizar usuario'
        });
    }
};

// ==========================================
// ELIMINAR USUARIO
// ==========================================
const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        // No permitir eliminar el propio usuario
        if (id === req.user.id) {
            return res.status(400).json({
                error: 'No puedes eliminar tu propio usuario'
            });
        }

        await prisma.user.delete({
            where: { id }
        });

        // Log de actividad
        await prisma.activityLog.create({
            data: {
                userId: req.user.id,
                action: 'DELETE_USER',
                description: `Usuario eliminado: ${id}`,
                ipAddress: req.ip,
                userAgent: req.get('user-agent')
            }
        });

        res.json({
            message: 'Usuario eliminado'
        });

    } catch (error) {
        console.error('Error en deleteUser:', error);
        res.status(500).json({
            error: 'Error al eliminar usuario'
        });
    }
};

module.exports = {
    getUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser
};

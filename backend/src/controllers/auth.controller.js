const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/database');

// ==========================================
// REGISTRO DE USUARIO
// ==========================================
const register = async (req, res) => {
    try {
        const { email, password, name, phone, role } = req.body;

        // Validar campos requeridos
        if (!email || !password || !name) {
            return res.status(400).json({
                error: 'Email, contraseña y nombre son requeridos'
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

        // Hash de la contraseña
        const hashedPassword = await bcrypt.hash(password, 10);

        // Crear usuario
        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name,
                phone,
                role: role || 'CITIZEN'
            },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                createdAt: true
            }
        });

        // Generar token
        const token = jwt.sign(
            { userId: user.id },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );

        res.status(201).json({
            message: 'Usuario registrado exitosamente',
            user,
            token
        });

    } catch (error) {
        console.error('Error en register:', error);
        res.status(500).json({
            error: 'Error al registrar usuario'
        });
    }
};

// ==========================================
// LOGIN
// ==========================================
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validar campos
        if (!email || !password) {
            return res.status(400).json({
                error: 'Email y contraseña son requeridos'
            });
        }

        // Buscar usuario
        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user) {
            return res.status(401).json({
                error: 'Credenciales inválidas'
            });
        }

        // Verificar si está activo
        if (!user.active) {
            return res.status(403).json({
                error: 'Usuario inactivo'
            });
        }

        // Verificar contraseña
        const validPassword = await bcrypt.compare(password, user.password);

        if (!validPassword) {
            return res.status(401).json({
                error: 'Credenciales inválidas'
            });
        }

        // Generar token
        const token = jwt.sign(
            { userId: user.id },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );

        // Respuesta sin contraseña
        const { password: _, ...userWithoutPassword } = user;

        res.json({
            message: 'Login exitoso',
            user: userWithoutPassword,
            token
        });

    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({
            error: 'Error al iniciar sesión'
        });
    }
};

// ==========================================
// OBTENER PERFIL
// ==========================================
const getProfile = async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                phone: true,
                active: true,
                createdAt: true,
                updatedAt: true
            }
        });

        res.json(user);

    } catch (error) {
        console.error('Error en getProfile:', error);
        res.status(500).json({
            error: 'Error al obtener perfil'
        });
    }
};

// ==========================================
// ACTUALIZAR PERFIL
// ==========================================
const updateProfile = async (req, res) => {
    try {
        const { name, phone } = req.body;

        const user = await prisma.user.update({
            where: { id: req.user.id },
            data: {
                ...(name && { name }),
                ...(phone && { phone })
            },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                phone: true,
                updatedAt: true
            }
        });

        res.json({
            message: 'Perfil actualizado',
            user
        });

    } catch (error) {
        console.error('Error en updateProfile:', error);
        res.status(500).json({
            error: 'Error al actualizar perfil'
        });
    }
};

// ==========================================
// CAMBIAR CONTRASEÑA
// ==========================================
const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                error: 'Contraseña actual y nueva son requeridas'
            });
        }

        // Obtener usuario con contraseña
        const user = await prisma.user.findUnique({
            where: { id: req.user.id }
        });

        // Verificar contraseña actual
        const validPassword = await bcrypt.compare(currentPassword, user.password);

        if (!validPassword) {
            return res.status(401).json({
                error: 'Contraseña actual incorrecta'
            });
        }

        // Hash de nueva contraseña
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Actualizar contraseña
        await prisma.user.update({
            where: { id: req.user.id },
            data: { password: hashedPassword }
        });

        res.json({
            message: 'Contraseña actualizada exitosamente'
        });

    } catch (error) {
        console.error('Error en changePassword:', error);
        res.status(500).json({
            error: 'Error al cambiar contraseña'
        });
    }
};

module.exports = {
    register,
    login,
    getProfile,
    updateProfile,
    changePassword
};

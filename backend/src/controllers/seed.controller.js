const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// Endpoint para crear usuarios de prueba (solo en desarrollo/primera vez)
const seedUsers = async (req, res) => {
    try {
        console.log('🌱 Iniciando creación de usuarios...');

        const hashedPassword = await bcrypt.hash('admin123', 10);

        // Verificar si ya existen usuarios
        const existingAdmin = await prisma.user.findUnique({
            where: { email: 'admin@pilcomayo.gob.pe' }
        });

        if (existingAdmin) {
            return res.status(200).json({
                message: 'Los usuarios ya existen',
                users: [
                    { email: 'admin@pilcomayo.gob.pe', role: 'ADMIN' },
                    { email: 'brigada1@pilcomayo.gob.pe', role: 'BRIGADE' },
                    { email: 'brigada2@pilcomayo.gob.pe', role: 'BRIGADE' },
                    { email: 'chofer1@pilcomayo.gob.pe', role: 'DRIVER' },
                    { email: 'ciudadano@example.com', role: 'CITIZEN' }
                ],
                password: 'admin123'
            });
        }

        // Crear usuarios
        const users = [];

        // Admin
        const admin = await prisma.user.create({
            data: {
                email: 'admin@pilcomayo.gob.pe',
                password: hashedPassword,
                name: 'Administrador Municipal',
                role: 'ADMIN',
                phone: '964123456',
                active: true
            }
        });
        users.push({ email: admin.email, role: admin.role });

        // Brigada 1
        const brigade1 = await prisma.user.create({
            data: {
                email: 'brigada1@pilcomayo.gob.pe',
                password: hashedPassword,
                name: 'Juan Pérez - Brigada Norte',
                role: 'BRIGADE',
                phone: '964123457',
                active: true
            }
        });
        users.push({ email: brigade1.email, role: brigade1.role });

        // Brigada 2
        const brigade2 = await prisma.user.create({
            data: {
                email: 'brigada2@pilcomayo.gob.pe',
                password: hashedPassword,
                name: 'María García - Brigada Sur',
                role: 'BRIGADE',
                phone: '964123458',
                active: true
            }
        });
        users.push({ email: brigade2.email, role: brigade2.role });

        // Chofer
        const driver = await prisma.user.create({
            data: {
                email: 'chofer1@pilcomayo.gob.pe',
                password: hashedPassword,
                name: 'Carlos Rodríguez - Chofer',
                role: 'DRIVER',
                phone: '964123459',
                active: true
            }
        });
        users.push({ email: driver.email, role: driver.role });

        // Ciudadano
        const citizen = await prisma.user.create({
            data: {
                email: 'ciudadano@example.com',
                password: hashedPassword,
                name: 'Ana López',
                role: 'CITIZEN',
                phone: '964123460',
                active: true
            }
        });
        users.push({ email: citizen.email, role: citizen.role });

        console.log('✅ Usuarios creados exitosamente');

        res.status(201).json({
            message: '✅ Usuarios creados exitosamente',
            users,
            credentials: {
                password: 'admin123',
                note: 'Usa este password para todos los usuarios'
            }
        });

    } catch (error) {
        console.error('❌ Error creando usuarios:', error);
        res.status(500).json({
            error: 'Error al crear usuarios',
            details: error.message
        });
    }
};

module.exports = { seedUsers };

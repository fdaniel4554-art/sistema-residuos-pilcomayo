const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Iniciando seed de producción...');

    // Limpiar datos existentes (opcional)
    console.log('🗑️  Limpiando datos existentes...');
    await prisma.incident.deleteMany();
    await prisma.user.deleteMany();

    // Crear usuarios
    console.log('👥 Creando usuarios...');

    const hashedPassword = await bcrypt.hash('admin123', 10);

    // Admin
    const admin = await prisma.user.create({
        data: {
            name: 'Administrador',
            email: 'admin@pilcomayo.gob.pe',
            password: hashedPassword,
            role: 'ADMIN',
            phone: '987654321',
            isActive: true
        }
    });
    console.log('✅ Admin creado:', admin.email);

    // Brigadista
    const brigade = await prisma.user.create({
        data: {
            name: 'Juan Pérez',
            email: 'brigada@pilcomayo.gob.pe',
            password: hashedPassword,
            role: 'BRIGADE',
            phone: '987654322',
            isActive: true
        }
    });
    console.log('✅ Brigadista creado:', brigade.email);

    // Conductor
    const driver = await prisma.user.create({
        data: {
            name: 'Carlos López',
            email: 'conductor@pilcomayo.gob.pe',
            password: hashedPassword,
            role: 'DRIVER',
            phone: '987654323',
            isActive: true
        }
    });
    console.log('✅ Conductor creado:', driver.email);

    console.log('');
    console.log('✅ Seed completado exitosamente!');
    console.log('');
    console.log('📋 Credenciales de acceso:');
    console.log('');
    console.log('Admin:');
    console.log('  Email: admin@pilcomayo.gob.pe');
    console.log('  Password: admin123');
    console.log('');
    console.log('Brigadista:');
    console.log('  Email: brigada@pilcomayo.gob.pe');
    console.log('  Password: admin123');
    console.log('');
    console.log('Conductor:');
    console.log('  Email: conductor@pilcomayo.gob.pe');
    console.log('  Password: admin123');
}

main()
    .catch((e) => {
        console.error('❌ Error en seed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

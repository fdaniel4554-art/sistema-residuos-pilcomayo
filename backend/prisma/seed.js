const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Iniciando seed de la base de datos...');

    // Limpiar datos existentes (opcional, comentar en producción)
    // await prisma.activityLog.deleteMany();
    // await prisma.statusHistory.deleteMany();
    // await prisma.assignment.deleteMany();
    // await prisma.incident.deleteMany();
    // await prisma.user.deleteMany();

    // ==========================================
    // CREAR USUARIOS
    // ==========================================
    console.log('👥 Creando usuarios...');

    const hashedPassword = await bcrypt.hash('admin123', 10);

    // Admin
    const admin = await prisma.user.upsert({
        where: { email: 'admin@pilcomayo.gob.pe' },
        update: {},
        create: {
            email: 'admin@pilcomayo.gob.pe',
            password: hashedPassword,
            name: 'Administrador Municipal',
            role: 'ADMIN',
            phone: '964123456'
        }
    });

    // Brigadas
    const brigade1 = await prisma.user.upsert({
        where: { email: 'brigada1@pilcomayo.gob.pe' },
        update: {},
        create: {
            email: 'brigada1@pilcomayo.gob.pe',
            password: hashedPassword,
            name: 'Juan Pérez - Brigada Norte',
            role: 'BRIGADE',
            phone: '964123457'
        }
    });

    const brigade2 = await prisma.user.upsert({
        where: { email: 'brigada2@pilcomayo.gob.pe' },
        update: {},
        create: {
            email: 'brigada2@pilcomayo.gob.pe',
            password: hashedPassword,
            name: 'María García - Brigada Sur',
            role: 'BRIGADE',
            phone: '964123458'
        }
    });

    // Chofer
    const driver = await prisma.user.upsert({
        where: { email: 'chofer1@pilcomayo.gob.pe' },
        update: {},
        create: {
            email: 'chofer1@pilcomayo.gob.pe',
            password: hashedPassword,
            name: 'Carlos Rodríguez - Chofer',
            role: 'DRIVER',
            phone: '964123459'
        }
    });

    // Ciudadano
    const citizen = await prisma.user.upsert({
        where: { email: 'ciudadano@example.com' },
        update: {},
        create: {
            email: 'ciudadano@example.com',
            password: hashedPassword,
            name: 'Ana López',
            role: 'CITIZEN',
            phone: '964123460'
        }
    });

    console.log('✅ Usuarios creados');

    // ==========================================
    // CREAR INCIDENCIAS DE EJEMPLO
    // ==========================================
    console.log('📍 Creando incidencias de ejemplo...');

    const incidents = [
        {
            description: 'Acumulación de basura en la esquina de Av. Mariscal Castilla',
            latitude: -12.0464,
            longitude: -75.2137,
            address: 'Av. Mariscal Castilla esquina con Jr. Ayacucho',
            wasteType: 'MIXED',
            severity: 'HIGH',
            status: 'PENDING',
            reportedById: citizen.id
        },
        {
            description: 'Punto crítico con residuos de construcción',
            latitude: -12.0475,
            longitude: -75.2145,
            address: 'Jr. Lima 234',
            wasteType: 'CONSTRUCTION',
            severity: 'MEDIUM',
            status: 'ASSIGNED',
            reportedById: brigade1.id
        },
        {
            description: 'Basura orgánica en mercado municipal',
            latitude: -12.0455,
            longitude: -75.2128,
            address: 'Mercado Municipal de Pilcomayo',
            wasteType: 'ORGANIC',
            severity: 'HIGH',
            status: 'IN_PROGRESS',
            reportedById: citizen.id
        },
        {
            description: 'Botellas plásticas en parque',
            latitude: -12.0468,
            longitude: -75.2150,
            address: 'Parque Principal',
            wasteType: 'PLASTIC',
            severity: 'LOW',
            status: 'RESOLVED',
            reportedById: citizen.id,
            resolvedAt: new Date()
        }
    ];

    for (const incidentData of incidents) {
        await prisma.incident.create({
            data: incidentData
        });
    }

    console.log('✅ Incidencias creadas');

    // ==========================================
    // CREAR CONFIGURACIÓN DEL SISTEMA
    // ==========================================
    console.log('⚙️ Creando configuración del sistema...');

    await prisma.systemConfig.upsert({
        where: { key: 'app_name' },
        update: { value: 'Sistema de Residuos Pilcomayo' },
        create: {
            key: 'app_name',
            value: 'Sistema de Residuos Pilcomayo'
        }
    });

    await prisma.systemConfig.upsert({
        where: { key: 'municipality' },
        update: { value: 'Municipalidad Distrital de Pilcomayo' },
        create: {
            key: 'municipality',
            value: 'Municipalidad Distrital de Pilcomayo'
        }
    });

    console.log('✅ Configuración creada');

    console.log('\n🎉 Seed completado exitosamente!\n');
    console.log('📧 Credenciales de acceso:');
    console.log('   Admin:     admin@pilcomayo.gob.pe / admin123');
    console.log('   Brigada 1: brigada1@pilcomayo.gob.pe / admin123');
    console.log('   Brigada 2: brigada2@pilcomayo.gob.pe / admin123');
    console.log('   Chofer:    chofer1@pilcomayo.gob.pe / admin123');
    console.log('   Ciudadano: ciudadano@example.com / admin123\n');
}

main()
    .catch((e) => {
        console.error('❌ Error en seed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

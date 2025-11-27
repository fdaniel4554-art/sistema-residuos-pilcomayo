const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// Manejo de errores de conexión
prisma.$connect()
    .then(() => {
        console.log('✅ Conectado a PostgreSQL');
    })
    .catch((error) => {
        console.error('❌ Error conectando a PostgreSQL:', error);
        process.exit(1);
    });

// Cerrar conexión al terminar el proceso
process.on('beforeExit', async () => {
    await prisma.$disconnect();
});

module.exports = prisma;

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function assignIncidentsToBrigade() {
    try {
        console.log('🔄 Asignando incidentes a brigadas...');

        // 1. Buscar usuario brigada
        const brigade = await prisma.user.findFirst({
            where: { role: 'BRIGADE' }
        });

        if (!brigade) {
            console.log('❌ No se encontró ningún usuario con rol BRIGADE');
            console.log('💡 Crea un usuario brigada primero con: npm run seed:users');
            return;
        }

        console.log(`✅ Brigada encontrada: ${brigade.name} (${brigade.email})`);

        // 2. Buscar incidentes pendientes o asignados
        const incidents = await prisma.incident.findMany({
            where: {
                status: {
                    in: ['PENDING', 'ASSIGNED']
                }
            },
            take: 5 // Asignar solo 5 incidentes
        });

        if (incidents.length === 0) {
            console.log('❌ No hay incidentes pendientes para asignar');
            return;
        }

        console.log(`📋 Encontrados ${incidents.length} incidentes para asignar`);

        // 3. Crear asignaciones
        for (const incident of incidents) {
            // Verificar si ya tiene asignación
            const existingAssignment = await prisma.assignment.findFirst({
                where: {
                    incidentId: incident.id,
                    assignedToId: brigade.id
                }
            });

            if (existingAssignment) {
                console.log(`⏭️  Incidente ${incident.id.substring(0, 8)}... ya está asignado`);
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

            // Actualizar estado del incidente
            await prisma.incident.update({
                where: { id: incident.id },
                data: { status: 'ASSIGNED' }
            });

            console.log(`✅ Incidente ${incident.id.substring(0, 8)}... asignado a ${brigade.name}`);
        }

        console.log('\n🎉 ¡Asignaciones completadas!');
        console.log(`📊 Total asignados: ${incidents.length} incidentes`);

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

assignIncidentsToBrigade();

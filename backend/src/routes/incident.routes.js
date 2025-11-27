const express = require('express');
const router = express.Router();
const incidentController = require('../controllers/incident.controller');
const { authMiddleware, roleMiddleware } = require('../middlewares/auth.middleware');

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// Crear incidencia (todos los usuarios autenticados)
router.post('/', incidentController.createIncident);

// Obtener incidencias (todos los usuarios autenticados)
router.get('/', incidentController.getIncidents);

// Obtener incidencia por ID
router.get('/:id', incidentController.getIncidentById);

// Actualizar estado (solo admin y brigadas)
router.put('/:id/status',
    roleMiddleware('ADMIN', 'BRIGADE', 'DRIVER'),
    incidentController.updateIncidentStatus
);

// Asignar brigada (solo admin)
router.post('/:id/assign',
    roleMiddleware('ADMIN'),
    incidentController.assignIncident
);

// Eliminar incidencia (solo admin)
router.delete('/:id',
    roleMiddleware('ADMIN'),
    incidentController.deleteIncident
);

module.exports = router;

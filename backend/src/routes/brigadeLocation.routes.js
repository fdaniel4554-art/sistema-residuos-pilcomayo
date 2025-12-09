const express = require('express');
const router = express.Router();
const brigadeLocationController = require('../controllers/brigadeLocation.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

// Actualizar ubicación (solo brigadas)
router.post('/location',
    authenticate,
    authorize(['BRIGADE']),
    brigadeLocationController.updateLocation
);

// Desactivar compartir ubicación (solo brigadas)
router.post('/location/deactivate',
    authenticate,
    authorize(['BRIGADE']),
    brigadeLocationController.deactivateLocation
);

// Obtener todas las ubicaciones activas (solo admin)
router.get('/locations',
    authenticate,
    authorize(['ADMIN']),
    brigadeLocationController.getAllLocations
);

// Obtener ubicación de una brigada específica (admin y la misma brigada)
router.get('/:brigadeId/location',
    authenticate,
    authorize(['ADMIN', 'BRIGADE']),
    brigadeLocationController.getBrigadeLocation
);

// Buscar brigadas cercanas (admin)
router.get('/nearby',
    authenticate,
    authorize(['ADMIN']),
    brigadeLocationController.getNearbyBrigades
);

module.exports = router;

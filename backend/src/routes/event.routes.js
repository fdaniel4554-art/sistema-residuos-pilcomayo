const express = require('express');
const router = express.Router();
const eventController = require('../controllers/event.controller');
const { authMiddleware, roleMiddleware } = require('../middlewares/auth.middleware');

// Crear evento (solo admin)
router.post('/', authMiddleware, roleMiddleware('ADMIN'), eventController.createEvent);

// Obtener eventos activos (todos los usuarios autenticados)
router.get('/', authMiddleware, eventController.getEvents);

// Verificar si una ubicación está afectada
router.get('/check-location', authMiddleware, eventController.checkLocation);

// Desactivar evento (solo admin)
router.delete('/:id', authMiddleware, roleMiddleware('ADMIN'), eventController.deactivateEvent);

module.exports = router;

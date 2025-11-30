const express = require('express');
const { seedUsers } = require('../controllers/seed.controller');

const router = express.Router();

// POST /api/seed/users - Crear usuarios de prueba
router.post('/users', seedUsers);

module.exports = router;

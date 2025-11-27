const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
require('dotenv').config();

const app = express();
const PORT = process.env.BACKEND_PORT || 4000;

// ==========================================
// MIDDLEWARES
// ==========================================
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==========================================
// RUTAS
// ==========================================
const authRoutes = require('./routes/auth.routes');
const incidentRoutes = require('./routes/incident.routes');
const userRoutes = require('./routes/user.routes');
const statsRoutes = require('./routes/stats.routes');
const uploadRoutes = require('./routes/upload.routes');
const routeRoutes = require('./routes/route.routes');
const eventRoutes = require('./routes/event.routes');
const reportRoutes = require('./routes/report.routes');
const analyticsRoutes = require('./routes/analytics.routes');

app.use('/api/auth', authRoutes);
app.use('/api/incidents', incidentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/routes', routeRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/analytics', analyticsRoutes);

// ==========================================
// RUTA DE SALUD
// ==========================================
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'Backend API',
    version: '1.0.0'
  });
});

// ==========================================
// RUTA RAÍZ
// ==========================================
app.get('/', (req, res) => {
  res.json({
    message: '🗑️ Sistema de Gestión de Residuos Sólidos - Pilcomayo',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      incidents: '/api/incidents',
      users: '/api/users',
      stats: '/api/stats',
      upload: '/api/upload',
      routes: '/api/routes',
      events: '/api/events',
      reports: '/api/reports',
      analytics: '/api/analytics'
    }
  });
});

// ==========================================
// MANEJO DE ERRORES 404
// ==========================================
app.use((req, res) => {
  res.status(404).json({
    error: 'Ruta no encontrada',
    path: req.path
  });
});

// ==========================================
// MANEJO DE ERRORES GLOBAL
// ==========================================
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Error interno del servidor',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// ==========================================
// INICIAR SERVIDOR
// ==========================================
app.listen(PORT, '0.0.0.0', () => {
  console.log(`
╔═══════════════════════════════════════════════════════╗
║  🗑️  Sistema de Gestión de Residuos - Pilcomayo      ║
║                                                       ║
║  🚀 Backend API corriendo en:                        ║
║     http://localhost:${PORT}                            ║
║                                                       ║
║  📊 Endpoints disponibles:                           ║
║     GET  /health                                     ║
║     POST /api/auth/login                             ║
║     POST /api/auth/register                          ║
║     GET  /api/incidents                              ║
║     POST /api/incidents                              ║
║     GET  /api/stats                                  ║
║                                                       ║
║  🔧 Modo: ${process.env.NODE_ENV || 'development'}                        ║
╚═══════════════════════════════════════════════════════╝
  `);
});

module.exports = app;

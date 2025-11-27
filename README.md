# 🗑️ Sistema Inteligente de Gestión de Residuos Sólidos - Pilcomayo

Sistema web moderno para la gestión, monitoreo y optimización de la recolección de residuos sólidos en el distrito de Pilcomayo - Huancayo, con integración de inteligencia artificial para clasificación y priorización automática.

## 🎯 Características Principales

- 🗺️ **Mapa Interactivo**: Visualización en tiempo real de puntos críticos de acumulación
- 📸 **Reportes Ciudadanos**: Sistema de reportes con geolocalización y evidencia fotográfica
- 🤖 **IA Integrada**: Clasificación automática de residuos y detección de severidad
- 👥 **Multi-usuario**: Roles para administradores, brigadas y ciudadanos
- 📊 **Dashboard Analytics**: KPIs y métricas en tiempo real
- 🔍 **Trazabilidad Completa**: Historial de todas las acciones y estados
- 📱 **PWA**: Funciona como app móvil sin necesidad de instalación
- 🐳 **Docker**: Despliegue portable en cualquier sistema

## 🏗️ Arquitectura

```
┌─────────────────────────────────────────────────────┐
│          DOCKER COMPOSE (Orquestación)              │
├─────────────────────────────────────────────────────┤
│  Frontend (Next.js) → Backend (Node.js) → IA (Python)
│  PostgreSQL + PostGIS | Redis | MinIO | Nginx       │
└─────────────────────────────────────────────────────┘
```

## 🛠️ Stack Tecnológico

### Frontend
- **Next.js 14** - Framework React con SSR
- **TypeScript** - Tipado estático
- **TailwindCSS** - Estilos modernos
- **Leaflet** - Mapas interactivos
- **PWA** - Progressive Web App

### Backend
- **Node.js + Express** - API REST
- **Prisma ORM** - Gestión de base de datos
- **JWT** - Autenticación segura
- **Socket.io** - Comunicación en tiempo real

### IA/ML
- **Python + FastAPI** - Microservicio de IA
- **TensorFlow/YOLOv8** - Clasificación de imágenes
- **OpenCV** - Procesamiento de imágenes

### Infraestructura
- **PostgreSQL 15 + PostGIS** - Base de datos geoespacial
- **Redis** - Caché y sesiones
- **MinIO** - Almacenamiento de imágenes (S3-compatible)
- **Nginx** - Reverse proxy
- **Docker + Docker Compose** - Contenedorización

## 🚀 Inicio Rápido

### Prerequisitos

- Docker Desktop instalado y funcionando
- Git (opcional)

### Instalación

1. **Navegar al proyecto**
```bash
cd "C:\Users\ACER\Documents\7° SEMESTRE\Modelamiento y Gestion de Procesos de Negocios\sistema-residuos-pilcomayo"
```

2. **Configurar variables de entorno**
```bash
copy .env.example .env
```

3. **Levantar todos los servicios**
```bash
docker compose up -d
```

4. **Acceder a la aplicación**
- Frontend: http://localhost:3000
- Backend API: http://localhost:4000
- IA Service: http://localhost:8000
- MinIO Console: http://localhost:9001

### Credenciales por defecto

- **Admin**: admin@pilcomayo.gob.pe / admin123
- **MinIO**: minioadmin / minioadmin

## 📁 Estructura del Proyecto

```
sistema-residuos-pilcomayo/
├── frontend/           # Aplicación web Next.js
├── backend/            # API Node.js + Express
├── ai-service/         # Servicio de IA Python
├── nginx/              # Configuración reverse proxy
├── docs/               # Documentación
├── docker-compose.yml  # Orquestación de servicios
└── .env.example        # Variables de entorno
```

## 👥 Tipos de Usuarios

### 1. Administrador Municipal
- Visualización completa del sistema
- Gestión de usuarios y brigadas
- Asignación de incidencias
- Generación de reportes y KPIs
- Validación de reportes ciudadanos

### 2. Brigada/Chofer
- Registro de incidencias en campo
- Subida de evidencia fotográfica
- Marcado de puntos atendidos
- Visualización de asignaciones

### 3. Ciudadano
- Reporte de puntos críticos
- Seguimiento de incidencias
- Consulta de estado de recolección

## 🔄 Flujo de Trabajo

1. **Reporte** → Ciudadano/Brigada reporta punto crítico con foto y ubicación
2. **Análisis IA** → Sistema clasifica tipo de residuo y severidad automáticamente
3. **Visualización** → Incidencia aparece en mapa con código de color según prioridad
4. **Asignación** → Administrador asigna brigada para atención
5. **Atención** → Brigada marca como atendido con evidencia fotográfica
6. **Análisis** → Sistema genera métricas y detecta patrones

## 📊 Módulo de IA

El sistema de inteligencia artificial realiza:

- ✅ **Clasificación de residuos**: Orgánico, plástico, papel, construcción, mixto
- ✅ **Detección de severidad**: Baja, media, alta acumulación
- ✅ **Priorización automática**: Asignación de puntaje para orden de atención
- ✅ **Análisis de patrones**: Identificación de puntos críticos recurrentes

## 🔧 Comandos Útiles

```bash
# Levantar servicios
docker compose up -d

# Ver logs
docker compose logs -f

# Detener servicios
docker compose down

# Reiniciar un servicio específico
docker compose restart backend

# Reconstruir imágenes
docker compose build --no-cache

# Ver estado de servicios
docker compose ps
```

## 📖 Documentación

- [Arquitectura del Sistema](docs/arquitectura.md)
- [Manual de Usuario](docs/manual-usuario.md)
- [Guía de Desarrollo](docs/guia-desarrollo.md)
- [API Documentation](docs/api.md)

## 🤝 Contribución

Este proyecto fue desarrollado para la Municipalidad de Pilcomayo - Huancayo como parte de un sistema de gestión moderna de residuos sólidos.

## 📄 Licencia

Desarrollado para uso municipal - Pilcomayo, Huancayo, Perú

## 📧 Contacto

Para soporte o consultas sobre el sistema, contactar al área de TI de la Municipalidad de Pilcomayo.

---

**Versión**: 1.0.0  
**Última actualización**: 2025-11-21

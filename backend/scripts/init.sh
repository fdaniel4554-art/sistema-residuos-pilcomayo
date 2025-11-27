#!/bin/bash
# init.sh - Script de inicialización del backend
# Este script se ejecuta cada vez que el contenedor del backend se inicia

set -e

echo "🚀 Iniciando backend del Sistema de Residuos Pilcomayo..."

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Función para imprimir mensajes
log_info() {
    echo -e "${GREEN}✓${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}⚠${NC} $1"
}

log_error() {
    echo -e "${RED}✗${NC} $1"
}

# Paso 1: Esperar a que PostgreSQL esté listo
log_info "Esperando a que PostgreSQL esté disponible..."
/app/scripts/wait-for-it.sh postgres 5432 60 || {
    log_error "PostgreSQL no está disponible después de 60 segundos"
    exit 1
}

# Paso 2: Generar Prisma Client
log_info "Generando Prisma Client..."
npx prisma generate || {
    log_error "Error al generar Prisma Client"
    exit 1
}

# Paso 3: Ejecutar migraciones de Prisma
log_info "Ejecutando migraciones de base de datos..."
if [ "$NODE_ENV" = "production" ]; then
    # En producción, usar migrate deploy (no crea nuevas migraciones)
    npx prisma migrate deploy || {
        log_error "Error al ejecutar migraciones"
        exit 1
    }
else
    # En desarrollo, usar migrate dev
    npx prisma migrate dev --name init || {
        log_warn "Las migraciones ya están aplicadas o hubo un error menor"
    }
fi

# Paso 4: (Opcional) Ejecutar seed solo si existe
if [ -f "prisma/seed.js" ]; then
    log_info "Ejecutando seed de datos iniciales..."
    npm run prisma:seed || {
        log_warn "No se pudieron cargar los datos iniciales (puede ser normal si ya existen)"
    }
else
    log_warn "No se encontró archivo de seed, omitiendo..."
fi

# Paso 5: Verificar conexión a Redis
if [ -n "$REDIS_URL" ]; then
    log_info "Verificando conexión a Redis..."
    # La verificación real se hará cuando el servidor inicie
fi

# Paso 6: Verificar conexión a MinIO
if [ -n "$MINIO_ENDPOINT" ]; then
    log_info "Verificando configuración de MinIO..."
    # La verificación real se hará cuando el servidor inicie
fi

log_info "✅ Inicialización completada exitosamente"
log_info "🚀 Iniciando servidor Node.js..."

# Ejecutar el comando principal (npm run dev o npm start)
exec "$@"

#!/bin/bash
# docker-health.sh - Script para verificar el estado de salud de todos los servicios Docker

echo "╔════════════════════════════════════════════════════════════╗"
echo "║  🏥  Health Check - Sistema de Residuos Pilcomayo          ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para verificar si un contenedor está corriendo
check_container() {
    local container_name=$1
    local service_name=$2
    
    if docker ps --filter "name=$container_name" --filter "status=running" | grep -q "$container_name"; then
        echo -e "${GREEN}✓${NC} $service_name está corriendo"
        return 0
    else
        echo -e "${RED}✗${NC} $service_name NO está corriendo"
        return 1
    fi
}

# Función para verificar healthcheck
check_health() {
    local container_name=$1
    local service_name=$2
    
    health=$(docker inspect --format='{{.State.Health.Status}}' "$container_name" 2>/dev/null)
    
    if [ "$health" == "healthy" ]; then
        echo -e "  ${GREEN}└─ Health: HEALTHY${NC}"
        return 0
    elif [ "$health" == "unhealthy" ]; then
        echo -e "  ${RED}└─ Health: UNHEALTHY${NC}"
        return 1
    elif [ "$health" == "" ]; then
        echo -e "  ${YELLOW}└─ Health: Sin healthcheck configurado${NC}"
        return 0
    else
        echo -e "  ${YELLOW}└─ Health: $health${NC}"
        return 0
    fi
}

# Función para verificar endpoint HTTP
check_endpoint() {
    local url=$1
    local service_name=$2
    
    if curl -s -f "$url" > /dev/null 2>&1; then
        echo -e "  ${GREEN}└─ Endpoint $url: ACCESIBLE${NC}"
        return 0
    else
        echo -e "  ${RED}└─ Endpoint $url: NO ACCESIBLE${NC}"
        return 1
    fi
}

echo -e "${BLUE}[1/6]${NC} Verificando PostgreSQL..."
check_container "residuos-postgres" "PostgreSQL"
check_health "residuos-postgres" "PostgreSQL"
echo ""

echo -e "${BLUE}[2/6]${NC} Verificando Redis..."
check_container "residuos-redis" "Redis"
check_health "residuos-redis" "Redis"
echo ""

echo -e "${BLUE}[3/6]${NC} Verificando MinIO..."
check_container "residuos-minio" "MinIO"
check_health "residuos-minio" "MinIO"
check_endpoint "http://localhost:9000/minio/health/live" "MinIO API"
check_endpoint "http://localhost:9001" "MinIO Console"
echo ""

echo -e "${BLUE}[4/6]${NC} Verificando Backend API..."
check_container "residuos-backend" "Backend"
check_health "residuos-backend" "Backend"
check_endpoint "http://localhost:4000/health" "Backend Health"
echo ""

echo -e "${BLUE}[5/6]${NC} Verificando AI Service..."
check_container "residuos-ai" "AI Service"
check_endpoint "http://localhost:8000/health" "AI Service Health"
echo ""

echo -e "${BLUE}[6/6]${NC} Verificando Frontend..."
check_container "residuos-frontend" "Frontend"
check_health "residuos-frontend" "Frontend"
check_endpoint "http://localhost:3000" "Frontend App"
echo ""

echo -e "${BLUE}[+]${NC} Verificando Nginx..."
check_container "residuos-nginx" "Nginx"
check_endpoint "http://localhost:80" "Nginx Proxy"
echo ""

echo "════════════════════════════════════════════════════════════"
echo ""

# Resumen de contenedores
echo -e "${BLUE}📊 Resumen de Contenedores:${NC}"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" --filter "name=residuos-"
echo ""

# Verificar logs recientes en busca de errores
echo -e "${YELLOW}⚠️  Últimos errores en los logs (si los hay):${NC}"
docker compose logs --tail=5 --since=5m 2>&1 | grep -i "error\|exception\|failed" | head -10 || echo -e "${GREEN}No se encontraron errores recientes${NC}"
echo ""

echo "╔════════════════════════════════════════════════════════════╗"
echo "║  ✅  Health Check Completado                               ║"
echo "╚════════════════════════════════════════════════════════════╝"

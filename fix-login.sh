#!/bin/bash

# Script para solucionar el error de login en Docker
# Configuración de Nginx como proxy

echo "🔧 Solucionando error de login en Docker..."
echo ""

# Paso 1: Detener contenedores
echo "📦 Deteniendo contenedores..."
docker-compose down

# Paso 2: Limpiar caché de Next.js
echo "🧹 Limpiando caché del frontend..."
rm -rf frontend/.next
rm -rf frontend/node_modules/.cache

# Paso 3: Reconstruir contenedores
echo "🏗️  Reconstruyendo contenedores..."
docker-compose build --no-cache frontend backend

# Paso 4: Iniciar contenedores
echo "🚀 Iniciando contenedores..."
docker-compose up -d

# Paso 5: Esperar a que los servicios estén listos
echo "⏳ Esperando a que los servicios estén listos..."
sleep 15

# Paso 6: Verificar estado
echo ""
echo "📊 Estado de los contenedores:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo ""
echo "✅ Configuración completada!"
echo ""
echo "🌐 Accede a la aplicación en:"
echo "   http://localhost (Puerto 80 - Nginx)"
echo ""
echo "📝 Credenciales de prueba:"
echo "   Admin: admin@pilcomayo.gob.pe / admin123"
echo "   Brigada: brigada1@pilcomayo.gob.pe / admin123"
echo ""
echo "🔍 Para ver los logs:"
echo "   docker logs residuos-frontend"
echo "   docker logs residuos-backend"
echo "   docker logs residuos-nginx"
